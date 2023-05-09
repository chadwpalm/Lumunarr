var express = require("express");
var router = express.Router();
var axios = require("axios").default;

router.post("/", async function (req, res, next) {
  var groups = {};
  var lights = [];
  var groupList = [];
  var output = [];

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
      if (error.request) {
        console.error("Could not connect to the Hue bridge");
        res.status(403).send("Could not connect to the Hue bridge");
      }
    });

  url = `http://${req.body.bridge.ip}/api/${req.body.bridge.user}/lights`;

  await axios
    .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
    .then(function (response) {
      console.info("Retrieving Lights");
      var data = {};
      data = response.data;
      for (const [key1, value1] of Object.entries(data)) {
        var group;
        for (const [key2, value2] of Object.entries(groups)) {
          if (value2.lights.includes(key1) && (value2.type === "Room" || value2.type === "Zone")) {
            group = key2;
          }
        }
        try {
          let array = `{ "Id":"${key1}", "Name":"${value1.name}", "Room":"${groups[group].name}"}`;
          lights.push(JSON.parse(array));
        } catch (error) {
          console.error("Lights: ", error);
        }
      }
      lights.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
      lights.sort((a, b) => (a.Room > b.Room ? 1 : b.Room > a.Room ? -1 : 0));

      output.push(lights);
      output.push(groupList);
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Hue bridge");
        res.status(403).send("Could not connect to the Hue bridge");
      }
    });

  res.send(JSON.stringify(output));
});

module.exports = router;
