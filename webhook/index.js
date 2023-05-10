var express = require("express");
var router = express.Router();
var huejay = require("huejay");
var multer = require("multer");
var fs = require("fs");
const { setTimeout: setTimeoutPromise } = require("timers/promises");

var upload = multer({ dest: "/tmp/" });

const filePath = "/config/settings.js";

let colors = [0, 8000, 15700, 25500, 45000, 51000, 0];

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
              let tHue, tSat, tOn, tTrans, tBri;

              bridge.lights
                .getById(parseInt(server.lightNew))
                .then((light) => {
                  tOn = light.on;
                  tTrans = light.transitionTime;
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
                  light.transitionTime = tTrans;
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

        clients.forEach((client) => {
          if (client.active) {
            if (payload.Player.uuid === client.client.id) {
              if (payload.Account.title === client.user.name || client.user.name === "Any") {
                if (
                  payload.Metadata.librarySectionType === client.media ||
                  client.media === "All" ||
                  (payload.Metadata.cinemaTrailer && client.media === "cinemaTrailer")
                ) {
                  if (payload.event === "media.play" && client.play !== "None") {
                    bridge.scenes
                      .recall(client.play)
                      .then(() => {
                        console.info(`Play scene was recalled for ${client.media} on ${client.client.name}`);
                      })
                      .catch((error) => {
                        console.error(error.stack);
                      });
                  }
                  if (payload.event === "media.stop" && client.stop !== "None") {
                    bridge.scenes
                      .recall(client.stop)
                      .then(() => {
                        console.info(`Stop scene was recalled for ${client.media} on ${client.client.name}`);
                      })
                      .catch((error) => {
                        console.error(error.stack);
                      });
                  }
                  if (payload.event === "media.pause" && client.pause !== "None") {
                    bridge.scenes
                      .recall(client.pause)
                      .then(() => {
                        console.info(`Pause scene was recalled ${client.media} on ${client.client.name}`);
                      })
                      .catch((error) => {
                        console.error(error.stack);
                      });
                  }
                  if (payload.event === "media.resume" && client.resume !== "None") {
                    bridge.scenes
                      .recall(client.resume)
                      .then(() => {
                        console.info(`Resume scene was recalled ${client.media} on ${client.client.name}`);
                      })
                      .catch((error) => {
                        console.error(error.stack);
                      });
                  }
                  if (payload.event === "media.scrobble" && client.scrobble !== "None") {
                    const recallScrobbleScene = () =>
                      bridge.scenes
                        .recall(client.scrobble)
                        .then(() => {
                          console.info(`Scrobble scene was recalled for ${client.media} on ${client.client.name}`);
                        })
                        .catch((error) => {
                          console.error(error.stack);
                        });
                                        
                    if (client.scrobbleDelayMs) {
                      console.info(`Waiting ${client.scrobbleDelayMs}ms before recalling scene`)
                      setTimeout(recallScrobbleScene, client.scrobbleDelayMs);
                    } else {
                      recallScrobbleScene(); 
                    }
                  }
                }
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

//For future use

// var current_ob = new Date();
// var date =
//   current_ob.getFullYear() +
//   "-" +
//   (current_ob.getMonth() + 1) +
//   "-" +
//   (current_ob.getDay() + 1);

// request(
//   "https://api.sunrise-sunset.org/json?lat=37.258330&lng=-121.806010&date=" +
//     date +
//     "&formatted=0",
//   function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       var sunTimes = JSON.parse(body);
//       var sunrise_ob = new Date(sunTimes.results.sunrise);
//       var sunset_ob = new Date(sunTimes.results.sunset);
//       if (
//         current_ob.getTime() > sunrise_ob.getTime() &&
//         current_ob.getTime() < sunset_ob.getTime()
//       ) {
//         console.log("It's day time!");
//         isNight = false;
//       } else {
//         console.log("It's night time!");
//         isNight = true;
//       }
//     }
//   }
// );
