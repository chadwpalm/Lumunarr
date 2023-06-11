var express = require("express");
var router = express.Router();
var huejay = require("huejay");
var multer = require("multer");
var fs = require("fs");
var axios = require("axios").default;
const { setTimeout: setTimeoutPromise } = require("timers/promises");
const { error } = require("console");

var upload = multer({ dest: "/tmp/" });

const filePath = "/config/settings.js";

let colors = [0, 8000, 15700, 25500, 45000, 51000, 0];

function isInSchedule(sh, sm, sd, eh, em, ed) {
  currentTime = new Date();
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
  if (lat === "" || long === "") return false;

  var currentDate = new Date();
  var currentEpoch = currentDate.getTime();
  var sunTimes, sunset, sunrise;

  if (currentDate.getHours() < 12) {
    var date = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + (currentDate.getDate() - 1);
  } else {
    var date = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
  }

  var url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${long}&date=${date}&formatted=0`;

  await axios
    .get(url, { timeout: 5000, headers: { "Content-Type": "application/json;charset=UTF-8" } })
    .then(function (response) {
      sunTimes = response.data;
      sunset = new Date(sunTimes.results.sunset).getTime();
      sunrise = new Date(sunTimes.results.sunrise).getTime();
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not retrieve sunrise/sunset times. Lat/Long must be valid entries");
      }
    });

  return sunset <= currentEpoch && sunrise + 86400000 > currentEpoch;
}

function setScene(scene, transition, ip, user) {
  var url = `http://${ip}/api/${user}/groups/0/action`;

  axios
    .put(
      url,
      { scene: `${scene}`, transitiontime: transition },
      { timeout: 1000, headers: { "Content-Type": "application/json;charset=UTF-8" } }
    )
    .then(function (response) {
      // console.log(response);
    })
    .catch(function (error) {
      if (error.request) {
        console.error(error);
      }
    });
}

function convertToMinutes(time) {
  const [hours, minutes] = time.split(":");
  return parseInt(hours) * 60 + parseInt(minutes);
}

async function turnoffGroup(room, ip, user, transition) {
  var url = `http://${ip}/api/${user}/groups/`;
  var groups = {};
  var groupNum;

  await axios
    .get(url, { timeout: 5000, headers: { "Content-Type": "application/json;charset=UTF-8" } })
    .then(function (response) {
      groups = response.data;
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not retrieve groups.");
      }
    });

  for (const [key, value] of Object.entries(groups)) {
    try {
      if (value.name === room) {
        groupNum = key;
      }
    } catch (error) {
      console.error("GroupList: ", error);
    }
  }
  var url = `http://${ip}/api/${user}/groups/${groupNum}/action`;

  axios
    .put(
      url,
      { transitiontime: transition * 10, on: false },
      { timeout: 1000, headers: { "Content-Type": "application/json;charset=UTF-8" } }
    )
    .then(function (response) {
      // console.log(response);
    })
    .catch(function (error) {
      if (error.request) {
        console.error(error);
      }
    });
}

router.post("/", upload.single("thumb"), async function (req, res, next) {
  var payload = JSON.parse(req.body.payload);
  var settings = JSON.parse(fs.readFileSync(filePath));

  if (settings.bridge) {
    let bridge = new huejay.Client({
      host: settings.bridge.ip,
      port: 80,
      username: settings.bridge.user,
      timeout: 15000,
    });

    try {
      if (settings.server) {
        var server = settings.server;
        if (payload.event === "playback.started") {
          if (server.lightPlay !== "-2") {
            if (server.behaviorPlay === "1") {
              bridge.lights
                .getById(parseInt(server.lightPlay))
                .then((light) => {
                  light.on = true;
                  light.hue = colors[parseInt(server.colorPlay)];
                  if (server.colorPlay === "6") {
                    light.saturation = 0;
                  } else {
                    light.saturation = 254;
                  }
                  light.brightness = Math.floor((parseInt(server.brightnessPlay) / 100) * 254);
                  return bridge.lights.save(light);
                })
                .then(() => {
                  console.info(`Playback started on server by ${payload.Account.title}`);
                })
                .catch((error) => {
                  console.error(error.stack);
                });
            }
            if (server.behaviorPlay === "2") {
              let tHue, tSat, tOn, tBri;

              bridge.lights
                .getById(parseInt(server.lightPlay))
                .then((light) => {
                  tOn = light.on;
                  tHue = light.hue;
                  tSat = light.saturation;
                  tBri = light.brightness;
                })
                .then(() => {
                  console.info(`Playback started on server by ${payload.Account.title}`);
                })
                .catch((error) => {
                  console.error(error.stack);
                });

              for (let i = 0; i < parseInt(server.intervalsPlay); i++) {
                bridge.lights
                  .getById(parseInt(server.lightPlay))
                  .then((light) => {
                    light.on = false;
                    light.transitionTime = 0;
                    return bridge.lights.save(light);
                  })
                  .catch((error) => {
                    console.error(error.stack);
                  });

                await setTimeoutPromise(500);

                bridge.lights
                  .getById(parseInt(server.lightPlay))
                  .then((light) => {
                    light.on = true;
                    light.transitionTime = 0;
                    light.hue = colors[parseInt(server.colorPlay)];
                    if (server.colorPlay === "6") {
                      light.saturation = 0;
                    } else {
                      light.saturation = 254;
                    }
                    light.brightness = Math.floor((parseInt(server.brightnessPlay) / 100) * 254);
                    return bridge.lights.save(light);
                  })
                  .catch((error) => {
                    console.error(error.stack);
                  });

                await setTimeoutPromise(500);
              }
              bridge.lights
                .getById(parseInt(server.lightPlay))
                .then((light) => {
                  light.on = tOn;
                  light.hue = tHue;
                  light.saturation = tSat;
                  light.brightness = tBri;
                  return bridge.lights.save(light);
                })

                .catch((error) => {
                  console.error(error.stack);
                });
            }
          }
        }

        if (payload.event === "library.new") {
          if (server.lightNew !== "-2") {
            if (server.behaviorNew === "1") {
              bridge.lights
                .getById(parseInt(server.lightNew))
                .then((light) => {
                  light.on = true;
                  light.hue = colors[parseInt(server.colorNew)];
                  if (server.colorNew === "6") {
                    light.saturation = 0;
                  } else {
                    light.saturation = 254;
                  }
                  light.brightness = Math.floor((parseInt(server.brightnessNew) / 100) * 254);
                  return bridge.lights.save(light);
                })
                .then(() => {
                  console.info(`New item added to library ${payload.Metadata.librarySectionTitle}`);
                })
                .catch((error) => {
                  console.error(error.stack);
                });
            }
            if (server.behaviorNew === "2") {
              let tHue, tSat, tOn, tBri;

              bridge.lights
                .getById(parseInt(server.lightNew))
                .then((light) => {
                  tOn = light.on;
                  tHue = light.hue;
                  tSat = light.saturation;
                  tBri = light.brightness;
                })
                .then(() => {
                  console.info(`New item added to library ${payload.Metadata.librarySectionTitle}`);
                })
                .catch((error) => {
                  console.error(error.stack);
                });

              for (let i = 0; i < parseInt(server.intervalsNew); i++) {
                bridge.lights
                  .getById(parseInt(server.lightNew))
                  .then((light) => {
                    light.on = false;
                    light.transitionTime = 0;
                    return bridge.lights.save(light);
                  })
                  .catch((error) => {
                    console.error(error.stack);
                  });

                await setTimeoutPromise(500);

                bridge.lights
                  .getById(parseInt(server.lightNew))
                  .then((light) => {
                    light.on = true;
                    light.transitionTime = 0;
                    light.hue = colors[parseInt(server.colorNew)];
                    if (server.colorNew === "6") {
                      light.saturation = 0;
                    } else {
                      light.saturation = 254;
                    }
                    light.brightness = Math.floor((parseInt(server.brightnessNew) / 100) * 254);
                    return bridge.lights.save(light);
                  })
                  .catch((error) => {
                    console.error(error.stack);
                  });

                await setTimeoutPromise(500);
              }
              bridge.lights
                .getById(parseInt(server.lightNew))
                .then((light) => {
                  light.on = tOn;
                  light.hue = tHue;
                  light.saturation = tSat;
                  light.brightness = tBri;
                  return bridge.lights.save(light);
                })

                .catch((error) => {
                  console.error(error.stack);
                });
            }
          }
        }
      }

      if (settings.clients) {
        var clients = settings.clients;
        var global = settings.settings;

        clients.forEach(async (client) => {
          if (client.active) {
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
                if (payload.Account.title === client.user.name || client.user.name === "Any") {
                  if (
                    payload.Metadata.librarySectionType === client.media ||
                    client.media === "All" ||
                    (payload.Metadata.cinemaTrailer && client.media === "cinemaTrailer")
                  ) {
                    if (payload.event === "media.play" && client.play !== "None") {
                      if (client.transitionType == "1") {
                        if (client.play === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, client.transition);
                          console.info("Play trigger has turned off lights");
                        } else {
                          setScene(
                            client.play,
                            parseFloat(client.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Play scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      } else {
                        if (client.play === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, global.transition);
                          console.info("Play trigger has turned off lights");
                        } else {
                          setScene(
                            client.play,
                            parseFloat(global.transition) * 10,
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
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, client.transition);
                          console.info("Stop trigger has turned off lights");
                        } else {
                          setScene(
                            client.stop,
                            parseFloat(client.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      } else {
                        if (client.stop === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, global.transition);
                          console.info("Stop trigger has turned off lights");
                        } else {
                          setScene(
                            client.stop,
                            parseFloat(global.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Stop scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      }
                    }
                    if (payload.event === "media.pause" && client.pause !== "None") {
                      if (client.transitionType == "1") {
                        if (client.pause === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, client.transition);
                          console.info("Pause trigger has turned off lights");
                        } else {
                          setScene(
                            client.pause,
                            parseFloat(client.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      } else {
                        if (client.pause === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, global.transition);
                          console.info("Pause trigger has turned off lights");
                        } else {
                          setScene(
                            client.pause,
                            parseFloat(global.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      }
                    }
                    if (payload.event === "media.resume" && client.resume !== "None") {
                      if (client.transitionType == "1") {
                        if (client.resume === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, client.transition);
                          console.info("Resume trigger has turned off lights");
                        } else {
                          setScene(
                            client.resume,
                            parseFloat(client.transition) * 10,
                            settings.bridge.ip,
                            settings.bridge.user
                          );
                          console.info(`Resume scene was recalled ${client.media} on ${client.client.name}`);
                        }
                      } else {
                        if (client.resume === "Off") {
                          turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, global.transition);
                          console.info("Resume trigger has turned off lights");
                        } else {
                          setScene(
                            client.resume,
                            parseFloat(global.transition) * 10,
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
                            turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, client.transition);
                            console.info("Scrobble trigger has turned off lights");
                          } else {
                            setScene(
                              client.scrobble,
                              parseFloat(client.transition) * 10,
                              settings.bridge.ip,
                              settings.bridge.user
                            );
                            console.info(`Scrobble scene was recalled ${client.media} on ${client.client.name}`);
                          }
                        } else {
                          if (client.scrobble === "Off") {
                            turnoffGroup(client.room, settings.bridge.ip, settings.bridge.user, global.transition);
                            console.info("Scrobble trigger has turned off lights");
                          } else {
                            setScene(
                              client.scrobble,
                              parseFloat(global.transition) * 10,
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
                console.info("Not within schedule");
              }
            }
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
