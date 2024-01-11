var express = require("express");
var router = express.Router();
var axios = require("axios").default;
var parser = require("xml-js");

router.post("/", async function (req, res, next) {
  var groups = {};
  var scenes = [];
  var users = [];
  var data = [];
  var groupList = [];
  var message = [];
  var flag = false;

  var url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/groups`;

  await axios
    .get(url, { timeout: 5000, headers: { "Content-Type": "application/json;charset=UTF-8" } })
    .then(function (response) {
      console.info("Retrieving Light Groups");
      groups = response.data;
      for (const [key, value] of Object.entries(groups)) {
        try {
          if (value.type === "Room" || value.type === "Zone") {
            let array = `{ "Room":"${value.name}", "Type":"${value.type}"}`;

            groupList.push(JSON.parse(array));
          }
        } catch (error) {
          console.error("GroupList: ", error);
        }
      }
    })
    .catch(function (error) {
      console.error("Error while trying to connect to the Hue bridge while requesting light groups: ", error.message);
      message.push("Could not connect to the Hue Bridge while requesting light groups");
    });

  url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/scenes`;

  await axios
    .get(url, { timeout: 5000, headers: { "Content-Type": "application/json;charset=UTF-8" } })
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
      console.error("Error while trying to connect to the Hue bridge while requesting scenes: ", error.message);
      message.push("Could not connect to the Hue bridge while requesting scenes");
    });

  var url = "https://plex.tv/pms/friends/all";

  await axios
    .get(url, { timeout: 5000, params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Plex Accounts");

      var user = parser.xml2js(response.data, { compact: true, spaces: 4 }).MediaContainer.User;

      if (Array.isArray(user)) {
        users = user;
      } else if (!user || user === undefined) {
        users = [];
      } else {
        users.push(user);
      }
    })
    .catch(function (error) {
      console.error("Issue with connection to online Plex account while requesting friends: ", error.message);
      message.push("Issue with connection to online Plex account which requesting friends. Check logs for reason.");
    });

  var url = "https://plex.tv/users/account";

  await axios
    .get(url, { timeout: 5000, params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Server Admin Information");

      let user = parser.xml2js(response.data, { compact: true, spaces: 4 }).user;

      let temp = {
        _attributes: { id: user._attributes.id, title: user._attributes.title, username: user._attributes.username },
      };

      users.push(temp);
      users.sort((a, b) =>
        a._attributes.title > b._attributes.title ? 1 : b._attributes.title > a._attributes.title ? -1 : 0
      );
    })
    .catch(function (error) {
      console.error("Issue with connection to online Plex account while requesting account info: ", error.message);
      message.push(
        "Issue with connection to online Plex account while requesting account info. Check logs for reason."
      );
    });

  var url = "https://plex.tv/devices.xml";

  await axios
    .get(url, { timeout: 5000, params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving Plex Clients");

      let list = parser.xml2js(response.data, { compact: true, spaces: 4 }).MediaContainer.Device;

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
      data.push(groupList);
    })
    .catch(function (error) {
      console.error("Issue with connection to online Plex account while requesting device info: ", error.message);
      message.push("Issue with connection to online Plex account while requesting device info. Check logs for reason.");
    });

  if (message.length !== 0) {
    res.status(403).send(JSON.stringify(message));
  } else {
    res.send(JSON.stringify(data));
  }
});

module.exports = router;
