var express = require("express");
var router = express.Router();
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
      console.info("Retrieving Light Groups");
      groups = response.data;
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Hue bridge");
        res.status(403).send("Could not connect to the Hue bridge");
      }
    });

  url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/scenes`;

  await axios
    .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
    .then(function (response) {
      console.info("Retrieving Light Scenes");
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
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Hue bridge");
        res.status(403).send("Could not connect to the Hue bridge");
      }
    });

  var url = "https://plex.tv/pms/friends/all";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Plex Accounts");

      let list = parser.toJson(response.data, { object: true, trim: true, coerce: true }).MediaContainer.User;

      users = list;
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Plex Server");
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  var url = "https://plex.tv/users/account";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Server Admin Information");

      let user = parser.toJson(response.data, { object: true }).user;

      let temp = { id: user.id, title: user.title, username: user.username[0] };

      users.push(temp);
      users.sort((a, b) => (a.title > b.title ? 1 : b.title > a.title ? -1 : 0));
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Plex Server");
        res.status(403).send("Could not connect to the Plex server");
      }
    });

  var url = "https://plex.tv/devices.xml";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Plex Clients");

      let list = parser.toJson(response.data, { object: true, trim: true, coerce: true }).MediaContainer.Device;
      list.sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : b.lastSeenAt < a.lastSeenAt ? -1 : 0));
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
      res.send(JSON.stringify(data));
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Plex Server");
        res.status(403).send("Could not connect to the Plex server");
      }
    });
});

module.exports = router;
