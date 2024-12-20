var express = require("express");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var axios = require("axios").default;
var https = require("https");
var path = require("path");
const { setTimeout: setTimeoutPromise } = require("timers/promises");

var flag = false;

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
    console.error("Could not retrieve sunrise/sunset times. Lat/Long must be valid entries");
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
        // console.log(response.errors);
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
            // console.log(response.errors);
          })
          .catch(function (error) {
            if (error.request) {
              console.error(error.description);
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
        // console.log(response.errors);
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
            // console.log(response.errors);
          })
          .catch(function (error) {
            if (error.request) {
              console.error(error.description);
            }
          });
      });
  }
}

function convertToMinutes(time) {
  const [hours, minutes] = time.split(":");
  return parseInt(hours) * 60 + parseInt(minutes);
}

async function turnoffGroup(room, ip, user, transition) {
  var groupNum;

  var url = `https://${ip}/clip/v2/resource/room`;
  var rooms = {};

  await axios
    .get(url, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      rooms = response.data.data;
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not retrieve rooms.");
      }
    });

  rooms.forEach((value) => {
    try {
      if (value.metadata.name === room) {
        var url = `https://${ip}/clip/v2/resource/grouped_light/${value.services[0].rid}`;

        axios
          .put(
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
          )
          .then(function (response) {})
          .catch(function (error) {
            if (error.request) {
              console.error(error.response.data.errors[0].description);
            }
          });
      }
    } catch (error) {
      console.error("GroupList: ", error);
    }
  });

  var url = `https://${ip}/clip/v2/resource/zone`;
  var zones = {};

  await axios
    .get(url, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      zones = response.data.data;
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not retrieve zones.");
      }
    });

  zones.forEach((value) => {
    try {
      if (value.metadata.name === room) {
        var url = `https://${ip}/clip/v2/resource/grouped_light/${value.services[0].rid}`;

        axios
          .put(
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
          )
          .then(function (response) {})
          .catch(function (error) {
            if (error.request) {
              console.error(error.response.data.errors[0].description);
            }
          });
      }
    } catch (error) {
      console.error("GroupList: ", error);
    }
  });
}

async function getChildren(types, roomName, ip, key) {
  const children = [];

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
        console.error(`${type} not found`);
        continue; // Skip to the next type if no matching room/zone is found
      }

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
              children.push(light);
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
                  await getChildren(["room", "zone"], server.roomNew, settings.bridge.ip, settings.bridge.user)
                    .then((c) => {
                      c.forEach((child) => {
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
                  await getChildren(["room", "zone"], server.roomNew, settings.bridge.ip, settings.bridge.user)
                    .then((c) => {
                      c.forEach((child) => {
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
            if (client.active && payload.Player.uuid) {
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
                      payload.Metadata.librarySectionType === client.media ||
                      client.media === "All" ||
                      (payload.Metadata.cinemaTrailer && client.media === "cinemaTrailer")
                    ) {
                      if (payload.event === "media.play" && client.play !== "None") {
                        await getChildren(["room", "zone"], client.room, settings.bridge.ip, settings.bridge.user)
                          .then((c) => {
                            c.forEach((child) => {
                              playStorage.push(child);
                            });
                          })
                          .catch((error) => {
                            console.error("Error retrieving children:", error);
                          });
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
                              for (const child of playStorage) {
                                if (child.on.on) {
                                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                                  await axios
                                    .put(
                                      url,
                                      {
                                        on: { on: true },
                                        dynamics: { duration: 0 },
                                        dimming: { brightness: child.dimming.brightness },
                                        color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                                        dynamics: { duration: parseFloat(client.transition) * 1000 },
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
                              setScene(
                                client.stop,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
                            }
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
                              for (const child of playStorage) {
                                if (child.on.on) {
                                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                                  await axios
                                    .put(
                                      url,
                                      {
                                        on: { on: true },
                                        dynamics: { duration: 0 },
                                        dimming: { brightness: child.dimming.brightness },
                                        color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                                        dynamics: { duration: parseFloat(global.transition) * 1000 },
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
                              setScene(
                                client.stop,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          }
                        }
                      }
                      if (payload.event === "media.pause" && client.pause !== "None") {
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
                            if (client.stop === "-2") {
                              for (const child of playStorage) {
                                if (child.on.on) {
                                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                                  await axios
                                    .put(
                                      url,
                                      {
                                        on: { on: true },
                                        dynamics: { duration: 0 },
                                        dimming: { brightness: child.dimming.brightness },
                                        color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                                        dynamics: { duration: parseFloat(client.transition) * 1000 },
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
                              setScene(
                                client.pause,
                                parseFloat(client.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                            }
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
                            if (client.stop === "-2") {
                              for (const child of playStorage) {
                                if (child.on.on) {
                                  var url = `https://${settings.bridge.ip}/clip/v2/resource/light/${child.id}`;
                                  await axios
                                    .put(
                                      url,
                                      {
                                        on: { on: true },
                                        dynamics: { duration: 0 },
                                        dimming: { brightness: child.dimming.brightness },
                                        color: { xy: { x: child.color.xy.x, y: child.color.xy.y } },
                                        dynamics: { duration: parseFloat(global.transition) * 1000 },
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
                              setScene(
                                client.pause,
                                parseFloat(global.transition) * 1000,
                                settings.bridge.ip,
                                settings.bridge.user
                              );
                              console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                            }
                          }
                        }
                      }
                      if (payload.event === "media.resume" && client.resume !== "None") {
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
                } else {
                  console.info("Not within schedule: ", client.uid);
                }
              }
            }
          } catch (err) {
            console.info("This is a server webhook not associated with a Plex client");
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
