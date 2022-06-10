var express = require("express");
var router = express.Router();
var huejay = require("huejay");
var multer = require("multer");
var request = require("request");

var upload = multer({ dest: "/tmp/" });

let client = new huejay.Client({
  host: "192.168.0.10",
  port: 80,
  username: "gLyQrTYX88fzTtYF4C70xaeGKFsAnAoXcCRxvTEX",
  timeout: 15000,
});

// huejay
//   .discover()
//   .then((bridges) => {
//     for (let bridge of bridges) {
//       console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
//     }
//   })
//   .catch((error) => {
//     console.log(`An error occurred mang: ${error.message}`);
//   });

var isNight = new Boolean();

/* GET home page. */
router.post("/", upload.single("thumb"), function (req, res, next) {
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

  if (1) {
    var payload = JSON.parse(req.body.payload);
    // console.log("Got webhook for", payload.Player.uuid);
    // console.log("For event: ", payload.event);
    // console.log("Media Type: ", payload.Metadata.type);
    console.log(payload.Metadata.librarySectionType);
    console.log(payload.Metadata.type);
    console.log(payload.Player.uuid);

    if (payload.Player.uuid == "0696be7326591955b902467af4c56f47") {
      if (payload.Metadata.type == "movie") {
        if (payload.event == "media.play" || payload.event == "media.resume") {
          client.scenes
            .recall("Yrwq0aV52BjaHdH")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }

        if (payload.event == "media.stop" || payload.event == "media.pause") {
          client.scenes
            .recall("rR6LmyN2F1q7Dev")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }
      }

      if (payload.Metadata.type == "clip") {
        if (payload.event == "media.play" || payload.event == "media.resume") {
          client.scenes
            .recall("p37WfvqJPC8dZRL")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }

        if (payload.event == "media.pause") {
          client.scenes
            .recall("rR6LmyN2F1q7Dev")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }
      }
    }

    if (payload.Player.uuid == "e975e492f7e75e3ab033b61e8c9942e1") {
      if (payload.event == "media.play" || payload.event == "media.resume") {
        client.scenes
          .recall("nMiXeWuqTFkJn4c")
          .then(() => {
            console.log("Scene was recalled");
          })
          .catch((error) => {
            console.log(error.stack);
          });
      }

      if (payload.event == "media.stop" || payload.event == "media.pause") {
        client.scenes
          .recall("X9IUlTHknEixbfG")
          .then(() => {
            console.log("Scene was recalled");
          })
          .catch((error) => {
            console.log(error.stack);
          });
      }
    }

    if (payload.Player.uuid == "j5nyrv5fhpf0fe54vzr47f9a") {
      if (payload.Metadata.type == "movie") {
        if (payload.event == "media.play" || payload.event == "media.resume") {
          client.scenes
            .recall("Yrwq0aV52BjaHdH")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }

        if (payload.event == "media.stop" || payload.event == "media.pause") {
          client.scenes
            .recall("rR6LmyN2F1q7Dev")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }
      }

      if (payload.Metadata.type == "clip") {
        if (payload.event == "media.play" || payload.event == "media.resume") {
          client.scenes
            .recall("p37WfvqJPC8dZRL")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }

        if (payload.event == "media.pause") {
          client.scenes
            .recall("rR6LmyN2F1q7Dev")
            .then(() => {
              console.log("Scene was recalled");
            })
            .catch((error) => {
              console.log(error.stack);
            });
        }
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;
