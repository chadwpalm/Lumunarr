var express = require("express");
const { STATUS_CODES } = require("http");
var router = express.Router();
var os = require("os");
var PlexAPI = require("plex-api");
var axios = require("axios").default;
var parser = require("xml2json");

router.post("/", async function (req, res, next) {
  var groups = {};
  var scenes = [];
  var users = [];
  var data = [];
  var url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/groups`;

  await axios
    .get(url, { timeout: 5000, headers: { "Content-Type": "application/json;charset=UTF-8" } })

    .then(function (response) {
      console.info("Retrieving Groups");
      groups = response.data;
    })
    .catch(function (error) {
      if (error.request) {
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/scenes`;

  await axios.get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } }).then(function (response) {
    console.info("Retrieving Scenes");
    var data = {};
    data = response.data;
    for (const [key, value] of Object.entries(data)) {
      try {
        if (groups[value.group]) {
          let array = `{ "Id":"${key}", "Name":"${value.name}", "Room":"${groups[value.group].name}"}`;

          scenes.push(JSON.parse(array));
        }
      } catch (error) {
        console.error("Scenes: ", error);
      }
    }
    scenes.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
    scenes.sort((a, b) => (a.Room > b.Room ? 1 : b.Room > a.Room ? -1 : 0));
  });

  // url = `http://${req.body.bridge.ip}/api/${req.body.user}/lights`;

  // await axios
  //   .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
  //   .then(function (response) {
  //     console.info("Retrieving Lights");
  //     var data = {};
  //     data = response.data;
  //     for (const [key1, value1] of Object.entries(data)) {
  //       var group;
  //       for (const [key2, value2] of Object.entries(groups)) {
  //         if (value2.lights.includes(key1) && value2.type === "Room") {
  //           group = key2;
  //         }
  //       }
  //       try {
  //         let array = `{ "Id":"${key1}", "Name":"${value1.name}", "Room":"${groups[group].name}"}`;
  //         lights.push(JSON.parse(array));
  //       } catch (error) {
  //         console.error("Lights: ", error);
  //       }
  //     }
  //     lights.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
  //     lights.sort((a, b) => (a.Room > b.Room ? 1 : b.Room > a.Room ? -1 : 0));
  //   });

  // let options = {
  //   hostname: req.body.plex.ip,
  //   port: req.body.plex.port,
  //   token: req.body.plex.token,
  //   options: {
  //     deviceName: "HuePlex",
  //     platform: req.body.platform,
  //     identifier: req.body.uuid,
  //   },
  // };

  // let client = new PlexAPI(options);

  // await client.query("/accounts").then(
  //   function (result) {
  //     console.info("Retrieving Accounts");
  //     let list = result.MediaContainer.Account;
  //     list.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
  //     var i = 0;
  //     while (i < list.length) {
  //       if (list[i].name === "") {
  //         list.splice(i, 1);
  //       } else {
  //         ++i;
  //       }
  //     }
  //     users = list;
  //   },
  //   function (err) {
  //     console.error("Accounts", err);
  //   }
  // );

  var url = "https://plex.tv/pms/friends/all";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Accounts");

      let list = parser.toJson(response.data, { object: true, trim: true, coerce: true }).MediaContainer.User;

      users = list;
    })
    .catch(function (error) {
      if (error.request) {
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  var url = "https://plex.tv/users/account";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Server Admin");

      let user = parser.toJson(response.data, { object: true }).user;

      let temp = { id: user.id, title: user.title, username: user.username[0] };

      users.push(temp);
      users.sort((a, b) => (a.title > b.title ? 1 : b.title > a.title ? -1 : 0));
      console.log(users);
    })
    .catch(function (error) {
      if (error.request) {
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  var url = "https://plex.tv/devices.xml";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Groups");

      let list = parser.toJson(response.data, { object: true, trim: true, coerce: true }).MediaContainer.Device;
      list.sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : b.lastSeenAt < a.lastSeenAt ? -1 : 0));
      // console.info(info);
      var i = 0;
      while (i < list.length) {
        if (list[i].name === "") {
          list.splice(i, 1);
        } else {
          ++i;
        }
      }
      data.push(users);
      data.push(list);
      data.push(scenes);
      // console.log(data);
      res.send(JSON.stringify(data));
    })
    .catch(function (error) {
      if (error.request) {
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  //   await client.query("/devices").then(
  //     function (result) {
  //       console.info("Retrieving Devices");
  //       let list = result.MediaContainer.Device;
  //       console.log(result);
  //       list.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
  //       var i = 0;
  //       while (i < list.length) {
  //         if (list[i].name === "") {
  //           list.splice(i, 1);
  //         } else {
  //           ++i;
  //         }
  //       }
  //       data.push(users);
  //       data.push(list);
  //       data.push(scenes);
  //       // console.log(data);
  //       res.send(JSON.stringify(data));
  //     },
  //     function (err) {
  //       console.error("Could not connect to server", err);
  //     }
  //   );
});

module.exports = router;
