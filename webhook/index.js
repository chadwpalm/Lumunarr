var express = require("express");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var axios = require("axios").default;
var https = require("https");
var path = require("path");
const { setTimeout: setTimeoutPromise } = require("timers/promises");

var flag = false;
var isPaused = false;
var pauseTime;

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

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // (NOTE: this will disable client verification)
  cert: fs.readFileSync(path.resolve(__dirname, "../backend/bridgecert.pem")),
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
    console.error("Could not retrieve sunrise/sunset times", error);
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
        }
      )
      .then(function (response) {
        console.info(`Scene ${scene} recalled`);
      })
      .catch(function (error) {
        console.info("Not a normal scene....checking if smart scene");
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
            }
          )
          .then(function (response) {
            console.info(`Smart Scene ${scene} recalled`);
          })
          .catch(function (error) {
            if (error.response) {
              console.error("Scene retrieval failed:");
              console.error(`Status Code: ${error.response.status}`);
              console.error(`Status Text: ${error.response.statusText}`);
              console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
            } else {
              console.error("Unknown error:", error.message);
            }
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
        }
      )
      .then(function (response) {
        console.info(`Scene ${scene} recalled`);
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
            }
          )
          .then(function (response) {
            console.info(`Smart Scene ${scene} recalled`);
          })
          .catch(function (error) {
            if (error.response) {
              console.error("Scene retrieval failed:");
              console.error(`Status Code: ${error.response.status}`);
              console.error(`Status Text: ${error.response.statusText}`);
              console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
            } else {
              console.error("Unknown error:", error.message);
            }
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
        console.warn(`Rate limit hit. Retrying in ${100 * 2 ** i}ms...`);
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
          console.error("Could not retrieve rooms: ", error);
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
              }
            );
          }
        } catch (error) {
          console.error("GroupList (room):", error);
        }
      })
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
        console.error("Could not retrieve zones.");
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
              }
            );
          }
        } catch (error) {
          console.error("GroupList (zone):", error);
        }
      })
    );
  } catch (error) {
    console.error("Unexpected error in turnoffGroup:", error);
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
              console.error("Error adding light to children:", error);
            }
          }
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach((desc) => {
          console.error(`Error description for ${type}:`, desc.description);
        });
      } else {
        console.error(`Error retrieving ${type}:`, error);
      }
    }
  }
  return children;
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
      if (error.response) {
        console.error("Scene retrieval failed:");
        console.error(`Status Code: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Unknown error:", error.message);
      }
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
        console.info(`Scene ${originalScene.id} was removed`);
      })
      .catch((error) => {
        if (error.response) {
          console.error("Scene deletion failed:");
          console.error(`Status Code: ${error.response.status}`);
          console.error(`Status Text: ${error.response.statusText}`);
          console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
          console.error("Unknown error:", error.message);
        }
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

    if (light.color) {
      action.action.color = {
        xy: {
          x: light.color?.xy?.x || 0,
          y: light.color?.xy?.y || 0,
        },
      };
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
      }
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
      if (error.response) {
        console.error("Scene creation failed:");
        console.error(`Status Code: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Unknown error:", error.message);
      }
    });
}

async function deleteScene(roomName, transition, ip, key) {
  const roomId = playStorage.find((room) => room.room === roomName);

  setScene(roomId.rid, transition, ip, key);

  await wait(200);

  const url = `https://${ip}/clip/v2/resource/scene/${roomId.rid}`;

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
      console.info(`Scene ${roomId.rid} was removed`);
    })
    .catch((error) => {
      if (error.response) {
        console.error("Scene creation failed:");
        console.error(`Status Code: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Unknown error:", error.message);
      }
    });
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

router.post("/", upload.single("thumb"), async function (req, res, next) {
  var payload = JSON.parse(req.body.payload);
  var settings = JSON.parse(fs.readFileSync(filePath));

  if (settings.bridge) {
    try {
      if (settings.server) {
        var global = settings.settings;
        var server = settings.server;
        if (payload.event === "playback.started") {
          console.log("Playback has started from an external user");
          var sFlag = true;

          switch (server.scheduleType) {
            case "1":
              sFlag = isInSchedule(
                server.startHour,
                server.startMin,
                server.startMed,
                server.endHour,
                server.endMin,
                server.endMed
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
                global.endMed
              );
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
                      }
                    )
                    .then(function (response) {
                      console.info(`...Playback started on server by ${payload.Account.title}`, response);
                    })
                    .catch(function (error) {
                      if (error.response && error.response.data && error.response.data.errors) {
                        error.response.data.errors.forEach(function (desc) {
                          console.error("Error description:", desc.description);
                        });
                      } else {
                        console.error("Error data:", error);
                      }
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
                      }
                    )
                    .then(function (response) {
                      console.info(`Playback started on server by ${payload.Account.title}`);
                    })
                    .catch(function (error) {
                      if (error.response && error.response.data && error.response.data.errors) {
                        error.response.data.errors.forEach(function (desc) {
                          console.error("Error description:", desc.description);
                        });
                      } else {
                        console.error("Error data:", error);
                      }
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
                      console.error("Error retrieving children:", error);
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
                        }
                      )
                      .catch(function (error) {
                        if (error.response && error.response.data && error.response.data.errors) {
                          error.response.data.errors.forEach(function (desc) {
                            console.error("Error description:", desc.description);
                          });
                        } else {
                          console.error("Error data:", error);
                        }
                        grouped_;
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
                        }
                      )
                      .catch(function (error) {
                        if (error.response && error.response.data && error.response.data.errors) {
                          error.response.data.errors.forEach(function (desc) {
                            console.error("Error description:", desc.description);
                          });
                        } else {
                          console.error("Error data:", error);
                        }
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
                      }
                    )
                    .catch(function (error) {
                      if (error.response && error.response.data && error.response.data.errors) {
                        error.response.data.errors.forEach(function (desc) {
                          console.error("Error description:", desc.description);
                        });
                      } else {
                        console.error("Error data:", error);
                      }
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
                          }
                        )
                        .catch(function (error) {
                          if (error.response && error.response.data && error.response.data.errors) {
                            error.response.data.errors.forEach(function (desc) {
                              console.error("Error description restore:", desc.description);
                            });
                          } else {
                            console.error("Error data restore:", error);
                          }
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
                      console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        console.error(error.stack);
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
                      }
                    )
                    .catch(function (error) {
                      console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        console.error(error.stack);
                      });
                  }
                }
              }
            }
          } else {
            console.info("Not within schedule");
          }
        }

        if (payload.event === "library.new") {
          console.log("New media has been added to library");
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
                    }
                  )
                  .then(function (response) {
                    console.info("New media has been added to the Plex server");
                  })
                  .catch(function (error) {
                    if (error.response && error.response.data && error.response.data.errors) {
                      error.response.data.errors.forEach(function (desc) {
                        console.error("Error description:", desc.description);
                      });
                    } else {
                      console.error("Error data:", error);
                    }
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
                    }
                  )
                  .then(function (response) {
                    console.info(`New media has been added to the Plex server`);
                  })
                  .catch(function (error) {
                    if (error.response && error.response.data && error.response.data.errors) {
                      error.response.data.errors.forEach(function (desc) {
                        console.error("Error description:", desc.description);
                      });
                    } else {
                      console.error("Error data:", error);
                    }
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
                      console.error("Error retrieving children:", error);
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
                        }
                      )
                      .catch(function (error) {
                        if (error.response && error.response.data && error.response.data.errors) {
                          error.response.data.errors.forEach(function (desc) {
                            console.error("Error description:", desc.description);
                          });
                        } else {
                          console.error("Error data:", error);
                        }
                        grouped_;
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
                        }
                      )
                      .catch(function (error) {
                        if (error.response && error.response.data && error.response.data.errors) {
                          error.response.data.errors.forEach(function (desc) {
                            console.error("Error description:", desc.description);
                          });
                        } else {
                          console.error("Error data:", error);
                        }
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
                      }
                    )
                    .catch(function (error) {
                      if (error.response && error.response.data && error.response.data.errors) {
                        error.response.data.errors.forEach(function (desc) {
                          console.error("Error description:", desc.description);
                        });
                      } else {
                        console.error("Error data:", error);
                      }
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
                          }
                        )
                        .catch(function (error) {
                          if (error.response && error.response.data && error.response.data.errors) {
                            error.response.data.errors.forEach(function (desc) {
                              console.error("Error description restore:", desc.description);
                            });
                          } else {
                            console.error("Error data restore:", error);
                          }
                        });
                    }
                  }
                  flag = false;
                }
              } else {
                if (!flag) {
                  flag = true;
                  let state = {};
                  let sat, bri;
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
                      console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        console.error(error.stack);
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
                      }
                    )
                    .catch(function (error) {
                      console.error(error.stack);
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
                        }
                      )
                      .catch(function (error) {
                        if (error.response && error.response.data && error.response.data.errors) {
                          error.response.data.errors.forEach(function (desc) {
                            console.error("Error description restore:", desc.description);
                          });
                        } else {
                          console.error("Error data restore:", error);
                        }
                      });
                    flag = false;
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

        clients.forEach(async (client) => {
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
                      client.endMed
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
                      global.endMed
                    );
                    break;
                }
                if (sFlag) {
                  if (payload.Account.id.toString() === client.user.id || client.user.id === "Any") {
                    if (
                      client.media === "All" ||
                      (payload.Metadata.cinemaTrailer && client.media === "cinemaTrailer") ||
                      (payload.Metadata.librarySectionType === client.media && client.library === "All") ||
                      (payload.Metadata.librarySectionType === client.media &&
                        payload.Metadata.librarySectionTitle === client.library &&
                        payload.Server.title === client.server)
                    ) {
                      if (
                        !client.lightsOff ||
                        (client.lightsOff && !(await checkIfOff(client.room, settings.bridge.ip, settings.bridge.user)))
                      ) {
                        if (payload.event === "media.play" && client.play !== "None") {
                          if (client.pause === "-2" || client.stop === "-2") {
                            await createScene(
                              ["room", "zone"],
                              client.room,
                              settings.bridge.ip,
                              settings.bridge.user,
                              client.transition
                            );
                          }
                          if (client.transitionType == "1") {
                            if (client.play === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(client.transition) * 1000
                              );
                              console.info("Play trigger has turned off lights");
                            } else {
                              setScene(
                                client.play,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Play scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          } else {
                            if (client.play === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000
                              );
                              console.info("Play trigger has turned off lights");
                            } else {
                              setScene(
                                client.play,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Play scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          }
                        }
                        if (payload.event === "media.stop" && client.stop !== "None") {
                          isPaused = false;
                          if (client.transitionType == "1") {
                            if (client.stop === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(client.transition) * 1000
                              );
                              console.info("Stop trigger has turned off lights");
                            } else {
                              if (client.stop === "-2") {
                                await deleteScene(
                                  client.room,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                              } else {
                                setScene(
                                  client.stop,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                              }
                              console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          } else {
                            if (client.stop === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000
                              );
                              console.info("Stop trigger has turned off lights");
                            } else {
                              if (client.stop === "-2") {
                                await deleteScene(
                                  client.room,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                              } else {
                                setScene(
                                  client.stop,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                              }
                              console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
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
                                    parseFloat(client.transition) * 1000
                                  );
                                  console.info("Pause trigger has turned off lights");
                                } else {
                                  if (client.pause === "-2") {
                                    const roomId = playStorage.find((room) => room.room === client.room);
                                    setScene(
                                      roomId.rid,
                                      parseFloat(client.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user
                                    );
                                  } else {
                                    setScene(
                                      client.pause,
                                      parseFloat(client.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user
                                    );
                                  }
                                  console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                                }
                              } else {
                                if (client.pause === "Off") {
                                  turnoffGroup(
                                    client.room,
                                    settings.bridge.ip,
                                    settings.bridge.user,
                                    parseFloat(global.transition) * 1000
                                  );
                                  console.info("Pause trigger has turned off lights");
                                } else {
                                  if (client.pause === "-2") {
                                    const roomId = playStorage.find((room) => room.room === client.room);
                                    setScene(
                                      roomId.rid,
                                      parseFloat(global.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user
                                    );
                                  } else {
                                    setScene(
                                      client.pause,
                                      parseFloat(global.transition) * 1000,
                                      settings.bridge.ip,
                                      settings.bridge.user
                                    );
                                  }
                                  console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                                }
                              }
                            }
                          };

                          if (client.pauseDelayMs && client.pauseDelayMs !== "0") {
                            console.info(`Waiting ${client.pauseDelayMs}ms before recalling scene`);
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
                                parseFloat(client.transition) * 1000
                              );
                              console.info("Resume trigger has turned off lights");
                            } else {
                              setScene(
                                client.resume,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Resume scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          } else {
                            if (client.resume === "Off") {
                              turnoffGroup(
                                client.room,
                                settings.bridge.ip,
                                settings.bridge.user,
                                parseFloat(global.transition) * 1000
                              );
                              console.info("Resume trigger has turned off lights");
                            } else {
                              setScene(
                                client.resume,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Resume scene was recalled ${client.media} on ${client.client.name}`);
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
                                  parseFloat(client.transition) * 1000
                                );
                                console.info("Scrobble trigger has turned off lights");
                              } else {
                                setScene(
                                  client.scrobble,
                                  parseFloat(client.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                                console.info(`Scrobble scene was recalled ${client.media} on ${client.client.name}`);
                              }
                            } else {
                              if (client.scrobble === "Off") {
                                turnoffGroup(
                                  client.room,
                                  settings.bridge.ip,
                                  settings.bridge.user,
                                  parseFloat(global.transition) * 1000
                                );
                                console.info("Scrobble trigger has turned off lights");
                              } else {
                                setScene(
                                  client.scrobble,
                                  parseFloat(global.transition) * 1000,
                                  settings.bridge.ip,
                                  settings.bridge.user
                                );
                                console.info(`Scrobble scene was recalled ${client.media} on ${client.client.name}`);
                              }
                            }
                          };

                          if (client.scrobbleDelayMs) {
                            console.info(`Waiting ${client.scrobbleDelayMs}ms before recalling scene`);
                            setTimeout(recallScrobbleScene, client.scrobbleDelayMs);
                          } else {
                            recallScrobbleScene();
                          }
                        }
                      }
                    }
                  }
                } else {
                  console.info("Not within schedule: ", client.uid);
                }
              }
            }
          } catch (err) {
            console.info("There was an issue processing the webhook", err);
          }
        });
      } else {
        console.info("There are no clients set up yet.");
      }
    } catch (err) {
      console.info("Config file not found, please run the web app once to create file", err);
    }

    res.sendStatus(200);
  } else {
    console.info("Bridge is not set up");
    res.sendStatus(200);
  }
});

module.exports = router;
