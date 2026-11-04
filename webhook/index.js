var express = require("express");
const log = require("../backend/logger").tagged("WEBHOOK");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var axios = require("axios").default;
var https = require("https");
var parser = require("xml-js");
var ColorThief = require("colorthief");
var { rgbToXy } = require("./colorUtils");
const { setTimeout: setTimeoutPromise } = require("timers/promises");

var flag = false;
var isPaused = false;

var upload = multer({ dest: "/tmp/" });

const filePath = "/config/settings.js";

let colors = [
  [0.64, 0.33],
  [0.58, 0.4],
  [0.49, 0.50525],
  [0.3, 0.6],
  [0.15, 0.06],
  [0.23792, 0.11454],
  [0.31273, 0.32902],
];

var playStorage = [];

const NO_EFFECT = "no_effect";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function isInSchedule(sh, sm, sd, eh, em, ed) {
  let currentTime = new Date();
  var startHour, startMin, endHour, endMin;

  parseInt(sd) === 2
    ? parseInt(sh) === 12
      ? (startHour = 12)
      : (startHour = parseInt(sh) + 12)
    : parseInt(sh) === 12
      ? (startHour = 0)
      : (startHour = parseInt(sh));
  parseInt(ed) === 2
    ? parseInt(eh) === 12
      ? (endHour = 12)
      : (endHour = parseInt(eh) + 12)
    : parseInt(eh) === 12
      ? (endHour = 0)
      : (endHour = parseInt(eh));
  startMin = parseInt(sm);
  endMin = parseInt(em);

  const start = convertToMinutes(`${startHour}:${startMin}`);
  const end = convertToMinutes(`${endHour}:${endMin}`);
  const check = convertToMinutes(`${currentTime.getHours()}:${currentTime.getMinutes()}`);

  if (start <= end) {
    return check >= start && check <= end;
  } else {
    return check >= start || check <= end;
  }
}

async function isSunRiseSet(lat, long) {
  if (!lat || !long) return false;

  const currentDate = new Date();
  const currentEpoch = currentDate.getTime();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get system timezone
  let sunTimes, sunset, sunrise;

  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${long}&tzid=${timeZone}&formatted=0&date=${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getDate()}`;

  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });

    sunTimes = response.data.results;
    sunrise = new Date(sunTimes.sunrise).getTime(); // Local sunrise time in epoch
    sunset = new Date(sunTimes.sunset).getTime(); // Local sunset time in epoch

    if (currentDate.getHours() < 12) {
      sunset -= 24 * 60 * 60 * 1000;
    } else {
      sunrise += 24 * 60 * 60 * 1000;
    }

    // Check if current time is between sunrise and sunset
    return currentEpoch >= sunset && currentEpoch <= sunrise;
  } catch (error) {
    log.error("Could not retrieve sunrise/sunset times", error);
    return false;
  }
}

function setScene(scene, transition, ip, user) {
  var url = `https://${ip}/clip/v2/resource/scene/${scene}`;

  if (transition === 0) {
    axios
      .put(
        url,
        { recall: { action: "active" } },
        {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "hue-application-key": `${user}`,
          },
          httpsAgent,
        },
      )
      .then(function (response) {
        log.debug(`Scene ${scene} recalled`);
      })
      .catch(function (error) {
        log.debug(`${scene} is not a regular scene, trying it as a smart scene`);
        var url = `https://${ip}/clip/v2/resource/smart_scene/${scene}`;

        axios
          .put(
            url,
            { recall: { action: "activate" } },
            {
              timeout: 5000,
              headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "hue-application-key": `${user}`,
              },
              httpsAgent,
            },
          )
          .then(function (response) {
            log.debug(`Smart scene ${scene} recalled`);
          })
          .catch(function (error) {
            log.error("Scene retrieval failed:", error);
          });
      });
  } else {
    axios
      .put(
        url,
        { recall: { action: "active", duration: transition } },
        {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "hue-application-key": `${user}`,
          },
          httpsAgent,
        },
      )
      .then(function (response) {
        log.debug(`Scene ${scene} recalled`);
      })
      .catch(function (error) {
        var url = `https://${ip}/clip/v2/resource/smart_scene/${scene}`;

        axios
          .put(
            url,
            { recall: { action: "activate" } },
            {
              timeout: 5000,
              headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "hue-application-key": `${user}`,
              },
              httpsAgent,
            },
          )
          .then(function (response) {
            log.debug(`Smart scene ${scene} recalled`);
          })
          .catch(function (error) {
            log.error("Scene retrieval failed:", error);
          });
      });
  }
}

function convertToMinutes(time) {
  const [hours, minutes] = time.split(":");
  return parseInt(hours) * 60 + parseInt(minutes);
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryRequest(url, data, config, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.put(url, data, config);
    } catch (error) {
      if (error.response && error.response.status === 429 && i < retries - 1) {
        log.warn(`Rate limit hit. Retrying in ${100 * 2 ** i}ms...`);
        await wait(100 * 2 ** i); // Exponential backoff
      } else {
        throw error; // Rethrow if not a rate-limit error or retries are exhausted
      }
    }
  }
}

async function turnoffGroup(room, ip, user, transition) {
  try {
    var url = `https://${ip}/clip/v2/resource/room`;
    var rooms = [];

    await axios
      .get(url, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${user}`,
        },
        httpsAgent,
      })
      .then((response) => {
        rooms = Array.isArray(response.data.data) ? response.data.data : [];
      })
      .catch((error) => {
        if (error.request) {
          log.error("Could not retrieve rooms: ", error);
        }
      });

    await Promise.all(
      rooms.map(async (value) => {
        try {
          if (value.metadata.name === room && value.services && value.services[0] && value.services[0].rid) {
            var url = `https://${ip}/clip/v2/resource/grouped_light/${value.services[0].rid}`;
            await retryRequest(
              url,
              { on: { on: false }, dynamics: { duration: transition } },
              {
                timeout: 5000,
                headers: {
                  "Content-Type": "application/json;charset=UTF-8",
                  "hue-application-key": `${user}`,
                },
                httpsAgent,
              },
            );
          }
        } catch (error) {
          log.error("GroupList (room):", error);
        }
      }),
    );

    url = `https://${ip}/clip/v2/resource/zone`;
    var zones = [];

    await axios
      .get(url, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${user}`,
        },
        httpsAgent,
      })
      .then((response) => {
        zones = Array.isArray(response.data.data) ? response.data.data : [];
      })
      .catch(() => {
        log.error("Could not retrieve zones.");
      });

    await Promise.all(
      zones.map(async (value) => {
        try {
          if (value.metadata.name === room && value.services && value.services[0] && value.services[0].rid) {
            var url = `https://${ip}/clip/v2/resource/grouped_light/${value.services[0].rid}`;
            await retryRequest(
              url,
              { on: { on: false }, dynamics: { duration: transition } },
              {
                timeout: 5000,
                headers: {
                  "Content-Type": "application/json;charset=UTF-8",
                  "hue-application-key": `${user}`,
                },
                httpsAgent,
              },
            );
          }
        } catch (error) {
          log.error("GroupList (zone):", error);
        }
      }),
    );
  } catch (error) {
    log.error("Unexpected error in turnoffGroup:", error);
  }
}

async function getChildren(types, roomName, uid, ip, key) {
  const children = {};

  children.client = uid || "null";
  children.lights = [];

  for (const type of types) {
    const roomUrl = `https://${ip}/clip/v2/resource/${type}`;
    const lightUrl = `https://${ip}/clip/v2/resource/light`;

    try {
      // Fetch the room or zone data
      const roomResponse = await axios.get(roomUrl, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": key,
        },
        httpsAgent,
      });

      const room = roomResponse.data.data.find(({ metadata }) => metadata.name === roomName);

      if (!room) {
        continue; // Skip to the next type if no matching room/zone is found
      }

      children.roomId = room.id;
      children.type = type;

      // Fetch all lights
      const lightResponse = await axios.get(lightUrl, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": key,
        },
        httpsAgent,
      });

      const lights = lightResponse.data.data;

      // Match lights to the room's or zone's children
      for (const light of lights) {
        for (const child of room.children) {
          if ((type === "room" && child.rid === light.owner.rid) || (type === "zone" && child.rid === light.id)) {
            try {
              children.lights.push(light);
            } catch (error) {
              log.error("Error adding light to children:", error);
            }
          }
        }
      }
    } catch (error) {
      log.error(`Error retrieving ${type}:`, error);
    }
  }
  return children;
}

function captureLightAttribute(light, action, parentKey, childKey) {
  const isEffectsV2 = parentKey === "effects_v2";
  const value = isEffectsV2 ? light[parentKey]?.status?.[childKey] : light[parentKey]?.[childKey];

  if (!value || value === NO_EFFECT) {
    return false;
  }

  if (!action.action[parentKey]) {
    action.action[parentKey] = {};
  }

  if (isEffectsV2) {
    // effects_v2 requires nested action object: { action: { effect: "...", parameters: {...} } }
    if (!action.action[parentKey].action) {
      action.action[parentKey].action = {};
    }
    action.action[parentKey].action[childKey] = value;

    // Capture optional parameters (speed, color) if present
    const parameters = light[parentKey]?.status?.parameters;
    if (parameters) {
      action.action[parentKey].action.parameters = parameters;
    }
  } else {
    action.action[parentKey][childKey] = value;
  }

  return true;
}

async function recallDanglingScene(roomName, ip, key) {
  const url = `https://${ip}/clip/v2/resource/scene`;
  var danglingScene = {};

  await axios
    .get(url, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${key}`,
      },
      httpsAgent,
    })
    .then((response) => {
      const res = response.data.data;
      danglingScene = res.find((scene) => scene.metadata.name === `Lumunarr ${roomName}`);
    })
    .catch((error) => {
      log.error("Scene retrieval failed:", error);
    });

  return danglingScene ?? null;
}

async function createScene(types, roomName, ip, key, transition) {
  const url = `https://${ip}/clip/v2/resource/scene`;
  var originalScene = {};

  await axios
    .get(url, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${key}`,
      },
      httpsAgent,
    })
    .then((response) => {
      const res = response.data.data;
      originalScene = res.find((scene) => scene.metadata.name === `Lumunarr ${roomName}`);
    })
    .catch((error) => {
      log.error("Scene retrieval failed:", error);
    });

  if (originalScene) {
    const url = `https://${ip}/clip/v2/resource/scene/${originalScene.id}`;

    await axios
      .delete(url, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${key}`,
        },
        httpsAgent,
      })
      .then(() => {
        log.debug(`Removed temporary scene ${originalScene.id}`);
      })
      .catch((error) => {
        log.error("Scene deletion failed:", error);
      });
  }

  const lightGroup = await getChildren(types, roomName, null, ip, key);

  const actions = lightGroup.lights.map((light) => {
    const action = {
      target: {
        rid: light.id,
        rtype: "light",
      },
      action: {
        on: { on: light.on?.on || false },
        dynamics: {
          duration: parseFloat(transition) * 1000 || 0,
        },
      },
    };

    if (light.dimming) {
      action.action.dimming = { brightness: light.dimming?.brightness || 0 };
    }

    const effectCaptured = captureLightAttribute(light, action, "effects_v2", "effect");

    // Only add static color/temperature if NO effect is active.
    // Color and color_temperature are mutually exclusive - prefer color if present.
    if (!effectCaptured) {
      if (light.color && light.color.xy) {
        action.action.color = {
          xy: {
            x: light.color.xy.x,
            y: light.color.xy.y,
          },
        };
      } else {
        captureLightAttribute(light, action, "color_temperature", "mirek");
      }
    }
    return action;
  });

  await axios
    .post(
      url,
      {
        actions,
        metadata: {
          name: `Lumunarr ${roomName}`,
        },
        group: {
          rid: lightGroup.roomId,
          rtype: lightGroup.type,
        },
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${key}`,
        },
        httpsAgent,
      },
    )
    .then((response) => {
      const res = response.data.data[0];
      const index = playStorage.findIndex((room) => room.room === roomName);

      if (index !== -1) {
        playStorage[index] = { room: roomName, rid: res.rid };
      } else {
        playStorage.push({ room: roomName, rid: res.rid });
      }
    })
    .catch((error) => {
      log.error("Scene creation failed:", error);
    });
}

async function deleteScene(roomName, transition, ip, key) {
  let parsedId;
  let roomId = playStorage.find((room) => room.room === roomName);

  if (roomId) {
    parsedId = roomId.rid;
    setScene(roomId.rid, transition, ip, key);
  } else {
    let tempId = await recallDanglingScene(roomName, ip, key);
    parsedId = tempId.id;
  }

  await wait(200);

  const url = `https://${ip}/clip/v2/resource/scene/${parsedId}`;

  await axios
    .delete(url, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${key}`,
      },
      httpsAgent,
    })
    .then((response) => {
      log.debug(`Removed temporary scene ${parsedId}`);
    })
    .catch((error) => {
      log.error("Scene creation failed:", error);
    });
}

async function setLightsToPoster(room, brightness, transition, ip, user, token, machineId, thumbURL, num, domLight) {
  let serverIP, palette, finalID;
  let url = `https://plex.tv/api/servers/${machineId}`;

  await axios
    .get(url, { timeout: 10000, params: { "X-Plex-Token": token } })
    .then(function (response) {
      const serverPayload = parser.xml2js(response.data, { compact: true, spaces: 4 }).MediaContainer.Server;
      serverIP = serverPayload._attributes.localAddresses;
    })
    .catch(function (error) {
      log.error("Issue with connection to online Plex account while requesting servers:", error);
    });

  if (!serverIP) {
    log.error("Plex server IP unknown");
    return;
  }

  const posterURL = `http://${serverIP}:32400${thumbURL}`;

  try {
    log.debug(`Downloading poster ${posterURL}`);

    const response = await fetch(posterURL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const poster = Buffer.from(await response.arrayBuffer());

    // colorthief needs at least 2 colors; take the most dominant `num` of them.
    // "rgb" quantization matches the colors colorthief v2 produced.
    const count = Math.max(1, Number(num) || 1);
    const colors = await ColorThief.getPalette(poster, { colorCount: Math.max(2, count), colorSpace: "rgb" });
    palette = (colors || [])
      .sort((a, b) => b.population - a.population)
      .slice(0, count)
      .map((c) => c.array());
  } catch (err) {
    log.error(err);
  }

  const lightGroup = await getChildren(["room", "zone"], room, null, ip, user);

  if (!Array.isArray(palette) || palette.length === 0) {
    log.error("No valid palette available, aborting");
    return;
  }
  if (!lightGroup.lights || lightGroup.lights.length === 0) {
    log.warn("No lights found for room", room);
    return;
  }

  let lightsArray = Array.isArray(lightGroup.lights) ? [...lightGroup.lights] : [];
  if (domLight !== "-1") {
    const idx = lightsArray.findIndex((l) => l.id === domLight);
    if (idx !== -1) {
      const [l] = lightsArray.splice(idx, 1);
      lightsArray.unshift(l);
    }
  }

  function normalizeUserFraction(b) {
    if (b === undefined || b === null || Number.isNaN(Number(b))) return 1.0;
    const n = Number(b);
    if (n <= 1) return Math.max(0, n);
    if (n <= 100) return Math.max(0, Math.min(1, n / 100));
    return Math.max(0, Math.min(1, n / 254));
  }

  const userFraction = normalizeUserFraction(brightness);
  const minFraction = 0.05;

  const actions = lightsArray
    .map((light, i) => {
      const idx = i % palette.length;
      const entry = palette[idx];
      if (!entry || entry.length < 3) {
        log.warn("Palette entry malformed", entry);
        return null;
      }

      const { x, y, brightness: posterY } = rgbToXy(entry[0], entry[1], entry[2]);

      const action = {
        target: {
          rid: light.id,
          rtype: "light",
        },
        action: {
          on: { on: true },
        },
      };

      const finalFraction = userFraction * (Number.isFinite(posterY) ? posterY : 1);
      const useFraction = Math.max(finalFraction, minFraction);
      const finalBrightness = Math.round(Math.max(0, Math.min(254, useFraction * 254)));

      if (light.dimming) {
        action.action.dimming = { brightness: Math.max(1, finalBrightness) };
      }

      if (light.color && Number.isFinite(x) && Number.isFinite(y)) {
        action.action.color = {
          xy: { x, y },
        };
      }

      return action;
    })
    .filter(Boolean);

  url = `https://${ip}/clip/v2/resource/scene`;

  await axios
    .post(
      url,
      {
        actions,
        metadata: {
          name: `Poster ${room}`,
        },
        group: {
          rid: lightGroup.roomId,
          rtype: lightGroup.type,
        },
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${user}`,
        },
        httpsAgent,
      },
    )
    .then((response) => {
      const res = response.data.data[0];
      finalID = res.rid;
      setScene(res.rid, parseFloat(transition) * 1000, ip, user);
    })
    .catch((error) => {
      log.error("Scene creation failed:", error);
    });

  if (finalID) {
    url = `https://${ip}/clip/v2/resource/scene/${finalID}`;

    await axios
      .delete(url, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${user}`,
        },
        httpsAgent,
      })
      .then((response) => {
        log.debug(`Removed temporary scene ${finalID}`);
      })
      .catch((error) => {
        log.error("Scene deletion failed:", error);
      });
  } else {
    log.debug("No temporary scene to delete");
  }
}

async function checkIfOff(roomName, ip, key) {
  const lights = await getChildren(["room", "zone"], roomName, null, ip, key);

  for (const light of lights.lights) {
    if (light.on.on) {
      return false;
    }
  }
  return true;
}

const MEDIA_EVENTS = ["media.play", "media.pause", "media.resume", "media.stop", "media.scrobble"];

/** Profile name for log lines */
function profileName(client) {
  return client?.client?.title || client?.client?.name || client?.uid || "profile";
}

/** e.g. media.play from "SHIELD" by chadwpalm: "Show - S01E02 - Title" (TV Shows on "MyServer") */
function describeWebhook(payload) {
  const m = payload.Metadata || {};
  const pad = (n) => String(n ?? "?").padStart(2, "0");
  const title =
    m.type === "episode" ? `${m.grandparentTitle} - S${pad(m.parentIndex)}E${pad(m.index)} - ${m.title}` : m.title || "?";
  const where = m.librarySectionTitle ? ` (${m.librarySectionTitle} on "${payload.Server?.title ?? "?"}")` : "";
  const who = payload.Player ? ` from "${payload.Player.title}"` : "";
  const by = payload.Account ? ` by ${payload.Account.title}` : "";
  return `${payload.event}${who}${by}: "${title}"${where}`;
}

/** Why a profile's media type/library didn't match the webhook */
function mediaMismatch(client, payload) {
  const m = payload.Metadata || {};
  const got = m.cinemaTrailer
    ? "a trailer/preroll"
    : `${m.librarySectionType ?? "?"} from library "${m.librarySectionTitle ?? "?"}" on "${payload.Server?.title ?? "?"}"`;
  let want = client.media === "cinemaTrailer" ? "trailers/prerolls" : client.media;
  if (client.media !== "cinemaTrailer" && client.library && client.library !== "All") {
    want += ` from library "${client.library}" on "${client.server}"`;
  }
  return `media is ${got}, profile wants ${want}`;
}

router.post("/", upload.single("thumb"), async function (req, res, next) {
  var payload = JSON.parse(req.body.payload);
  var settings = JSON.parse(fs.readFileSync(filePath));

  if (MEDIA_EVENTS.includes(payload.event)) {
    log.info(`Received ${describeWebhook(payload)}`);
  } else {
    log.debug(`Received ${describeWebhook(payload)}`);
  }
  if (payload.Player) log.debug(`Player "${payload.Player.title}" has ID ${payload.Player.uuid}`);

  if (settings.bridge) {
    try {
      if (settings.server) {
        var global = settings.settings;
        var server = settings.server;
        if (payload.event === "playback.started") {
          log.info(`Server alert: playback started by ${payload.Account?.title}`);
          var sFlag = true;

          switch (server.scheduleType) {
            case "1":
              sFlag = isInSchedule(
                server.startHour,
                server.startMin,
                server.startMed,
                server.endHour,
                server.endMin,
                server.endMed,
              );
              break;
            case "2":
              sFlag = await isSunRiseSet(global.latitude, global.longitude);
              break;
            case "3":
              sFlag = isInSchedule(
                global.startHour,
                global.startMin,
                global.startMed,
                global.endHour,
                global.endMin,
                global.endMed,
              );
              break;
            default:
              sFlag = true;
              break;
          }
          if (sFlag) {
            if (server.lightPlay !== "-2") {
              if (server.behaviorPlay === "1") {
                if (server.lightPlay === "-3") {
                  var url = `https://${settings.bridge.ip}/clip/v2/resource/grouped_light/${server.roomIdPlay}`;
                  var brightness = Math.floor(parseInt(server.brightnessPlay));
                  var x = colors[server.colorPlay][0];
                  var y = colors[server.colorPlay][1];
                  await axios
                    .put(
                      url,
                      {
                        on: { on: true },
                        dynamics: { duration: 0 },
                        dimming: { brightness: brightness },
                        color: { xy: { x: x, y: y } },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .then(function (response) {
                      log.debug("Server alert light updated (playback started)");
                    })
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });
                } else {
                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightPlay}`;
                  var brightness = Math.floor(parseInt(server.brightnessPlay));
                  var x = colors[server.colorPlay][0];
                  var y = colors[server.colorPlay][1];
                  await axios
                    .put(
                      url,
                      {
                        on: { on: true },
                        dynamics: { duration: 0 },
                        dimming: { brightness: brightness },
                        color: { xy: { x: x, y: y } },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .then(function (response) {
                      log.debug("Server alert light updated (playback started)");
                    })
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });
                }
              }
              if (server.behaviorPlay === "2") {
                if (server.lightPlay === "-3") {
                  let children = [];
                  await getChildren(["room", "zone"], server.roomNew, null, settings.bridge.ip, settings.bridge.user)
                    .then((c) => {
                      c.lights.forEach((child) => {
                        children.push(child);
                      });
                    })
                    .catch((error) => {
                      log.error("Error retrieving children:", error);
                    });

                  for (let i = 0; i < parseInt(server.intervalsPlay); i++) {
                    var url = `https://${settings.bridge.ip}/clip/v2/resource/grouped_light/${server.roomIdPlay}`;
                    await axios
                      .put(
                        url,
                        {
                          on: { on: false },
                          dynamics: { duration: 0 },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);

                      });

                    await setTimeoutPromise(500);
                    var bri = Math.floor(parseInt(server.brightnessPlay));
                    x = colors[server.colorPlay][0];
                    y = colors[server.colorPlay][1];

                    await axios
                      .put(
                        url,
                        {
                          on: { on: true },
                          dynamics: { duration: 0 },
                          dimming: { brightness: bri },
                          color: { xy: { x: x, y: y } },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    await setTimeoutPromise(500);
                  }
                  await axios
                    .put(
                      url,
                      {
                        on: { on: false },
                        dynamics: { duration: 0 },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });

                  await setTimeoutPromise(500);

                  for (const child of children) {
                    if (child.on.on) {
                      var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                      axios
                        .put(
                          url,
                          {
                            on: { on: true },
                            dynamics: { duration: 0 },
                            dimming: { brightness: child.dimming.brightness },
                            color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed (restore):", error);
                        });
                    }
                  }
                } else {
                  let state = {};
                  let x, y, bri;
                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightPlay}`;

                  await axios
                    .get(url, {
                      timeout: 10000,
                      headers: {
                        "Content-Type": "application/json;charset=UTF-8",
                        "hue-application-key": `${settings.bridge.user}`,
                      },
                      httpsAgent,
                    })
                    .then(function (response) {
                      state = response.data.data[0];
                    })
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });

                  for (let i = 0; i < parseInt(server.intervalsPlay); i++) {
                    var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightPlay}`;
                    await axios
                      .put(
                        url,
                        {
                          on: { on: false },
                          dynamics: { duration: 0 },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    await setTimeoutPromise(500);
                    bri = Math.floor(parseInt(server.brightnessPlay));
                    x = colors[server.colorPlay][0];
                    y = colors[server.colorPlay][1];

                    await axios
                      .put(
                        url,
                        {
                          on: { on: true },
                          dynamics: { duration: 0 },
                          dimming: { brightness: bri },
                          color: { xy: { x: x, y: y } },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    await setTimeoutPromise(500);
                  }
                  await axios
                    .put(
                      url,
                      {
                        on: { on: false },
                        dynamics: { duration: 0 },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });

                  await setTimeoutPromise(500);

                  if (state.on.on) {
                    await axios
                      .put(
                        url,
                        {
                          on: { on: true },
                          dynamics: { duration: 0 },
                          dimming: { brightness: state.dimming.brightness },
                          color: { xy: { x: state.color.xy.x, y: state.color.xy.y } },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });
                  }
                }
              }
            }
          } else {
            log.debug("Server alert skipped: outside its schedule");
          }
        }
        if (payload.event === "library.new") {
          log.info(`Server alert: new media added${payload.Metadata?.librarySectionTitle ? ` to ${payload.Metadata.librarySectionTitle}` : ""}`);
          var sFlag = true;

          switch (server.scheduleType) {
            case "1":
              sFlag = isInSchedule(
                server.startHour,
                server.startMin,
                server.startMed,
                server.endHour,
                server.endMin,
                server.endMed,
              );
              break;
            case "2":
              sFlag = await isSunRiseSet(global.latitude, global.longitude);
              break;
            case "3":
              sFlag = isInSchedule(
                global.startHour,
                global.startMin,
                global.startMed,
                global.endHour,
                global.endMin,
                global.endMed,
              );
              break;
            default:
              sFlag = true;
              break;
          }
          if (sFlag) {
            if (server.lightNew !== "-2") {
              if (server.behaviorNew === "1") {
                if (server.lightNew === "-3") {
                  var url = `https://${settings.bridge.ip}/clip/v2/resource/grouped_light/${server.roomIdNew}`;
                  var brightness = Math.floor(parseInt(server.brightnessNew));
                  var x = colors[server.colorNew][0];
                  var y = colors[server.colorNew][1];
                  await axios
                    .put(
                      url,
                      {
                        on: { on: true },
                        dynamics: { duration: 0 },
                        dimming: { brightness: brightness },
                        color: { xy: { x: x, y: y } },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .then(function (response) {
                      log.debug("Server alert light updated (library new)");
                    })
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });
                } else {
                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightNew}`;
                  var brightness = Math.floor(parseInt(server.brightnessNew));
                  var x = colors[server.colorNew][0];
                  var y = colors[server.colorNew][1];
                  await axios
                    .put(
                      url,
                      {
                        on: { on: true },
                        dynamics: { duration: 0 },
                        dimming: { brightness: brightness },
                        color: { xy: { x: x, y: y } },
                      },
                      {
                        timeout: 5000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      },
                    )
                    .then(function (response) {
                      log.debug("Server alert light updated (library new)");
                    })
                    .catch(function (error) {
                      log.error("Hue request failed:", error);
                    });
                }
              }
              if (server.behaviorNew === "2") {
                if (server.lightNew === "-3") {
                  if (!flag) {
                    flag = true;
                    let children = [];
                    await getChildren(["room", "zone"], server.roomNew, null, settings.bridge.ip, settings.bridge.user)
                      .then((c) => {
                        c.lights.forEach((child) => {
                          children.push(child);
                        });
                      })
                      .catch((error) => {
                        log.error("Error retrieving children:", error);
                      });

                    for (let i = 0; i < parseInt(server.intervalsNew); i++) {
                      var url = `https://${settings.bridge.ip}/clip/v2/resource/grouped_light/${server.roomIdNew}`;
                      await axios
                        .put(
                          url,
                          {
                            on: { on: false },
                            dynamics: { duration: 0 },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed:", error);

                        });

                      await setTimeoutPromise(500);
                      var bri = Math.floor(parseInt(server.brightnessNew));
                      x = colors[server.colorNew][0];
                      y = colors[server.colorNew][1];

                      await axios
                        .put(
                          url,
                          {
                            on: { on: true },
                            dynamics: { duration: 0 },
                            dimming: { brightness: bri },
                            color: { xy: { x: x, y: y } },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed:", error);
                        });

                      await setTimeoutPromise(500);
                    }
                    await axios
                      .put(
                        url,
                        {
                          on: { on: false },
                          dynamics: { duration: 0 },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    await setTimeoutPromise(500);

                    for (const child of children) {
                      if (child.on.on) {
                        var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                        axios
                          .put(
                            url,
                            {
                              on: { on: true },
                              dynamics: { duration: 0 },
                              dimming: { brightness: child.dimming.brightness },
                              color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                            },
                            {
                              timeout: 5000,
                              headers: {
                                "Content-Type": "application/json;charset=UTF-8",
                                "hue-application-key": `${settings.bridge.user}`,
                              },
                              httpsAgent,
                            },
                          )
                          .catch(function (error) {
                            log.error("Hue request failed (restore):", error);
                          });
                      }
                    }
                    flag = false;
                  }
                } else {
                  if (!flag) {
                    flag = true;
                    let state = {};
                    let bri;
                    var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightNew}`;

                    await axios
                      .get(url, {
                        timeout: 10000,
                        headers: {
                          "Content-Type": "application/json;charset=UTF-8",
                          "hue-application-key": `${settings.bridge.user}`,
                        },
                        httpsAgent,
                      })
                      .then(function (response) {
                        state = response.data.data[0];
                      })
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    for (let i = 0; i < parseInt(server.intervalsNew); i++) {
                      var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${server.lightNew}`;
                      await axios
                        .put(
                          url,
                          {
                            on: { on: false },
                            dynamics: { duration: 0 },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed:", error);
                        });

                      await setTimeoutPromise(500);
                      bri = Math.floor(parseInt(server.brightnessNew));
                      x = colors[server.colorNew][0];
                      y = colors[server.colorNew][1];

                      await axios
                        .put(
                          url,
                          {
                            on: { on: true },
                            dynamics: { duration: 0 },
                            dimming: { brightness: bri },
                            color: { xy: { x: x, y: y } },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed:", error);
                        });

                      await setTimeoutPromise(500);
                    }
                    await axios
                      .put(
                        url,
                        {
                          on: { on: false },
                          dynamics: { duration: 0 },
                        },
                        {
                          timeout: 5000,
                          headers: {
                            "Content-Type": "application/json;charset=UTF-8",
                            "hue-application-key": `${settings.bridge.user}`,
                          },
                          httpsAgent,
                        },
                      )
                      .catch(function (error) {
                        log.error("Hue request failed:", error);
                      });

                    await setTimeoutPromise(500);

                    if (state.on.on) {
                      await axios
                        .put(
                          url,
                          {
                            on: { on: true },
                            dynamics: { duration: 0 },
                            dimming: { brightness: state.dimming.brightness },
                            color: { xy: { x: state.color.xy.x, y: state.color.xy.y } },
                          },
                          {
                            timeout: 5000,
                            headers: {
                              "Content-Type": "application/json;charset=UTF-8",
                              "hue-application-key": `${settings.bridge.user}`,
                            },
                            httpsAgent,
                          },
                        )
                        .catch(function (error) {
                          log.error("Hue request failed (restore):", error);
                        });
                      flag = false;
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (settings.clients) {
        var clients = settings.clients;
        var global = settings.settings;

        let matched = 0;
        const evaluations = clients.map(async (client) => {
          const name = profileName(client);
          const skip = (reason) => log.debug(`"${name}" skipped: ${reason}`);
          try {
            if (client.active && payload?.Player?.uuid) {
              if (payload.Player.uuid === client.client.id) {
                var sFlag = true;

                switch (client.scheduleType) {
                  case "1":
                    sFlag = isInSchedule(
                      client.startHour,
                      client.startMin,
                      client.startMed,
                      client.endHour,
                      client.endMin,
                      client.endMed,
                    );
                    break;
                  case "2":
                    sFlag = await isSunRiseSet(global.latitude, global.longitude);
                    break;
                  case "3":
                    sFlag = isInSchedule(
                      global.startHour,
                      global.startMin,
                      global.startMed,
                      global.endHour,
                      global.endMin,
                      global.endMed,
                    );
                    break;
                }
                if (sFlag) {
                  if (payload.Account.id.toString() === client.user.id || client.user.id === "Any") {
                    if (
                      client.media === "All" ||
                      (payload.Metadata.cinemaTrailer && client.media === "cinemaTrailer") ||
                      (payload.Metadata.librarySectionType === client.media &&
                        (client.library === "All" || client.library === undefined)) ||
                      (payload.Metadata.librarySectionType === client.media &&
                        payload.Metadata.librarySectionTitle === client.library &&
                        payload.Server.title === client.server)
                    ) {
                      if (
                        !client.lightsOff ||
                        (client.lightsOff && !(await checkIfOff(client.room, settings.bridge.ip, settings.bridge.user)))
                      ) {
                        matched++;
                        log.debug(`"${name}" matches this webhook`);
                        if (payload.event === "media.play" && client.play !== "None") {
                          if (client.pause === "-2" || client.stop === "-2") {
                            await createScene(
                              ["room", "zone"],
                              client.room,
                              settings.bridge.ip,
                              settings.bridge.user,
                              client.transition,
                            );
                          }
                          if (client.transitionType === "1") {
                            if (client.play === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(client.transition) * 1000,
                              );
                              log.info(`"${name}": Play turned the lights off`);
                            } else if (client.play === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                client.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              setScene(
                                client.play,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user,
                              );
                              log.info(`"${name}": Play scene recalled`);
                            }
                          } else {
                            if (client.play === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000,
                              );
                              log.info(`"${name}": Play turned the lights off`);
                            } else if (client.play === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                global.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              setScene(
                                client.play,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user,
                              );
                              log.info(`"${name}": Play scene recalled`);
                            }
                          }
                        }
                        if (payload.event === "media.stop" && client.stop !== "None") {
                          isPaused = false;
                          if (client.transitionType === "1") {
                            if (client.stop === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(client.transition) * 1000,
                              );
                              log.info(`"${name}": Stop turned the lights off`);
                            } else if (client.stop === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                client.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              if (client.stop === "-2") {
                                await deleteScene(
                                  client.room,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                              } else {
                                setScene(
                                  client.stop,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                              }
                            }
                            if (client.pause === "-2" && client.stop !== "-2") {
                              await deleteScene(
                                client.room,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user,
                              );
                            }
                            log.info(`"${name}": Stop scene recalled`);
                          } else {
                            if (client.stop === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000,
                              );
                              log.info(`"${name}": Stop turned the lights off`);
                            } else if (client.stop === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                global.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              if (client.stop === "-2") {
                                await deleteScene(
                                  client.room,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                              } else {
                                setScene(
                                  client.stop,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                              }
                              if (client.pause === "-2" && client.stop !== "-2") {
                                await deleteScene(
                                  client.room,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                              }
                              log.info(`"${name}": Stop scene recalled`);
                            }
                          }
                        }
                        if (payload.event === "media.pause" && client.pause !== "None") {
                          const recallPauseScene = async () => {
                            if (isPaused) {
                              if (client.transitionType == "1") {
                                if (client.pause === "Off") {
                                  turnoffGroup(
                                    client.room,
                                    settings.bridge.ip,
                                    settings.bridge.user,
                                    parseFloat(client.transition) * 1000,
                                  );
                                  log.info(`"${name}": Pause turned the lights off`);
                                } else if (client.pause === "-3") {
                                  setLightsToPoster(
                                    client.room,
                                    Number(client.playBright),
                                    client.transition,
                                    settings.bridge.ip,
                                    settings.bridge.user,
                                    settings.token,
                                    payload.Server.uuid,
                                    payload.Metadata.librarySectionType === "show"
                                      ? payload.Metadata.grandparentThumb
                                      : payload.Metadata.thumb,
                                    client.playNum,
                                    client.playLight,
                                  );
                                } else {
                                  if (client.pause === "-2") {
                                    const roomId = playStorage.find((room) => room.room === client.room);
                                    if (roomId) {
                                      setScene(
                                        roomId.rid,
                                        parseFloat(client.transition) * 1000,
                                        settings.bridge.ip,
                                        settings.bridge.user,
                                      );
                                    } else {
                                      log.info(`"${name}": restoring the pre-play scene`);
                                      const result = await recallDanglingScene(
                                        client.room,
                                        settings.bridge.ip,
                                        settings.bridge.user,
                                      );
                                      if (result.id) {
                                        setScene(
                                          result.id,
                                          parseFloat(client.transition) * 1000,
                                          settings.bridge.ip,
                                          settings.bridge.user,
                                        );
                                      } else {
                                        log.warn(`"${name}": no pre-play scene stored to restore`);
                                      }
                                    }
                                  } else {
                                    setScene(
                                      client.pause,
                                      parseFloat(client.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user,
                                    );
                                  }
                                  log.info(`"${name}": Pause scene recalled`);
                                }
                              } else {
                                if (client.pause === "Off") {
                                  turnoffGroup(
                                    client.room,
                                    settings.bridge.ip,
                                    settings.bridge.user,
                                    parseFloat(global.transition) * 1000,
                                  );
                                  log.info(`"${name}": Pause turned the lights off`);
                                } else if (client.pause === "-3") {
                                  setLightsToPoster(
                                    client.room,
                                    Number(client.playBright),
                                    client.transition,
                                    settings.bridge.ip,
                                    settings.bridge.user,
                                    settings.token,
                                    payload.Server.uuid,
                                    payload.Metadata.librarySectionType === "show"
                                      ? payload.Metadata.grandparentThumb
                                      : payload.Metadata.thumb,
                                    client.playNum,
                                    client.playLight,
                                  );
                                } else {
                                  if (client.pause === "-2") {
                                    const roomId = playStorage.find((room) => room.room === client.room);
                                    if (roomId) {
                                      setScene(
                                        roomId.rid,
                                        parseFloat(client.transition) * 1000,
                                        settings.bridge.ip,
                                        settings.bridge.user,
                                      );
                                    } else {
                                      log.info(`"${name}": restoring the pre-play scene`);
                                      const result = await recallDanglingScene(
                                        client.room,
                                        settings.bridge.ip,
                                        settings.bridge.user,
                                      );
                                      if (result.id) {
                                        setScene(
                                          result.id,
                                          parseFloat(client.transition) * 1000,
                                          settings.bridge.ip,
                                          settings.bridge.user,
                                        );
                                      } else {
                                        log.warn(`"${name}": no pre-play scene stored to restore`);
                                      }
                                    }
                                  } else {
                                    setScene(
                                      client.pause,
                                      parseFloat(client.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user,
                                    );
                                  }
                                  log.info(`"${name}": Pause scene recalled`);
                                }
                              }
                            }
                          };

                          if (client.pauseDelayMs && client.pauseDelayMs !== "0") {
                            log.info(`"${name}": waiting ${client.pauseDelayMs} ms before the Pause scene`);
                            isPaused = true;
                            setTimeout(recallPauseScene, client.pauseDelayMs);
                          } else {
                            isPaused = true;
                            recallPauseScene();
                          }
                        }
                        if (payload.event === "media.resume" && client.resume !== "None") {
                          isPaused = false;
                          if (client.transitionType == "1") {
                            if (client.resume === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(client.transition) * 1000,
                              );
                              log.info(`"${name}": Resume turned the lights off`);
                            } else if (client.resume === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                client.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              setScene(
                                client.resume,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user,
                              );
                              log.info(`"${name}": Resume scene recalled`);
                            }
                          } else {
                            if (client.resume === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000,
                              );
                              log.info(`"${name}": Resume turned the lights off`);
                            } else if (client.resume === "-3") {
                              setLightsToPoster(
                                client.room,
                                Number(client.playBright),
                                global.transition,
                                settings.bridge.ip,
                                settings.bridge.user,
                                settings.token,
                                payload.Server.uuid,
                                payload.Metadata.librarySectionType === "show"
                                  ? payload.Metadata.grandparentThumb
                                  : payload.Metadata.thumb,
                                client.playNum,
                                client.playLight,
                              );
                            } else {
                              setScene(
                                client.resume,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user,
                              );
                              log.info(`"${name}": Resume scene recalled`);
                            }
                          }
                        }
                        if (payload.event === "media.scrobble" && client.scrobble !== "None") {
                          const recallScrobbleScene = async () => {
                            if (client.transitionType == "1") {
                              if (client.scrobble === "Off") {
                                turnoffGroup(
                                  client.room,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                  parseFloat(client.transition) * 1000,
                                );
                                log.info(`"${name}": Scrobble turned the lights off`);
                              } else if (client.scrobble === "-3") {
                                setLightsToPoster(
                                  client.room,
                                  Number(client.playBright),
                                  client.transition,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                  settings.token,
                                  payload.Server.uuid,
                                  payload.Metadata.librarySectionType === "show"
                                    ? payload.Metadata.grandparentThumb
                                    : payload.Metadata.thumb,
                                  client.playNum,
                                  client.playLight,
                                );
                              } else {
                                setScene(
                                  client.scrobble,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                                log.info(`"${name}": Scrobble scene recalled`);
                              }
                            } else {
                              if (client.scrobble === "Off") {
                                turnoffGroup(
                                  client.room,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                  parseFloat(global.transition) * 1000,
                                );
                                log.info(`"${name}": Scrobble turned the lights off`);
                              } else if (client.scrobble === "-3") {
                                setLightsToPoster(
                                  client.room,
                                  Number(client.playBright),
                                  client.transition,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                  settings.token,
                                  payload.Server.uuid,
                                  payload.Metadata.librarySectionType === "show"
                                    ? payload.Metadata.grandparentThumb
                                    : payload.Metadata.thumb,
                                  client.playNum,
                                  client.playLight,
                                );
                              } else {
                                setScene(
                                  client.scrobble,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                );
                                log.info(`"${name}": Scrobble scene recalled`);
                              }
                            }
                          };

                          if (client.scrobbleDelayMs) {
                            log.info(`"${name}": waiting ${client.scrobbleDelayMs} ms before the Scrobble scene`);
                            setTimeout(recallScrobbleScene, client.scrobbleDelayMs);
                          } else {
                            recallScrobbleScene();
                          }
                        }
                      } else {
                        skip("all lights in the room are off and 'Ignore triggers if lights are off' is on");
                      }
                    } else {
                      skip(mediaMismatch(client, payload));
                    }
                  } else {
                    skip(`webhook user "${payload.Account?.title}" is not the profile's user "${client.user?.name}"`);
                  }
                } else {
                  skip("outside its schedule");
                }
              } else {
                skip(`for a different player ("${client.client?.name}")`);
              }
            } else {
              skip(client.active ? "webhook has no player" : "profile is turned off");
            }
          } catch (err) {
            log.error(`"${name}": error while handling ${payload.event}:`, err);
          }
        });

        // Summary once every profile has been checked (does not delay the reply to Plex)
        Promise.all(evaluations).then(() => {
          if (!MEDIA_EVENTS.includes(payload.event)) return;
          if (matched === 0) {
            log.info(
              `No profile matched ${payload.event} (${clients.length} checked). Set Log Level to Debug in Settings to see why.`,
            );
          } else {
            log.debug(`${matched} profile(s) matched ${payload.event}`);
          }
        });
      } else {
        log.debug("No profiles set up yet, ignoring webhook");
      }
    } catch (err) {
      log.error("Could not process webhook (is the settings file valid? open the web app once to create it):", err);
    }

    res.sendStatus(200);
  } else {
    log.debug("Bridge is not set up yet, ignoring webhook");
    res.sendStatus(200);
  }
});

module.exports = router;
