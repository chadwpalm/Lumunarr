var express = require("express");
var router = express.Router();
var axios = require("axios").default;
var fs = require("fs");
var path = require("path");
var https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // (NOTE: this will disable client verification)
  cert: fs.readFileSync(path.resolve(__dirname, "bridgecert.pem")),
});

router.post("/", async function (req, res, next) {
  var rooms = {};
  var zones = {};
  var lights = [];
  var groupList = [];
  var output = [];

  console.info("Retrieving information for server page...");

  var url = `https://${req.body.bridge.ip}/clip/v2/resource/room`;

  await axios
    .get(url, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${req.body.bridge.user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      console.info("Retrieving Rooms");
      rooms = response.data.data;
      for (const [key, value] of Object.entries(rooms)) {
        try {
          const groupedLightService = value.services.find((service) => service.rtype === "grouped_light");

          let array = groupedLightService
            ? `{ "Room":"${value.metadata.name}", "Type":"Room", "Id":"${groupedLightService.rid}"}`
            : `{ "Room":"${value.metadata.name}", "Type":"Room", "Id":"" }`;

          groupList.push(JSON.parse(array));
        } catch (error) {
          console.error("GroupList: ", error);
        }
      }
      console.log(`${rooms.length} total room(s) retrieved`);
    })
    .catch(function (error) {
      console.error("Error while trying to connect to the Hue bridge while requesting rooms: ", error.message);
      message.push("Could not connect to the Hue Bridge while requesting rooms");
    });

  var url = `https://${req.body.bridge.ip}/clip/v2/resource/zone`;

  await axios
    .get(url, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${req.body.bridge.user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      console.info("Retrieving Zones");
      zones = response.data.data;
      for (const [key, value] of Object.entries(zones)) {
        try {
          const groupedLightService = value.services.find((service) => service.rtype === "grouped_light");

          let array = groupedLightService
            ? `{ "Room":"${value.metadata.name}", "Type":"Zone", "Id":"${groupedLightService.rid}"}`
            : `{ "Room":"${value.metadata.name}", "Type":"Zone", "Id":"" }`;

          groupList.push(JSON.parse(array));
        } catch (error) {
          console.error("GroupList: ", error);
        }
      }
      console.log(`${zones.length} total zones(s) retrieved`);
    })
    .catch(function (error) {
      console.error("Error while trying to connect to the Hue bridge while requesting rooms: ", error.message);
      message.push("Could not connect to the Hue Bridge while requesting rooms");
    });

  url = `https://${req.body.bridge.ip}/clip/v2/resource/light`;

  await axios
    .get(url, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${req.body.bridge.user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      console.info("Retrieving Lights");
      var data = {};
      data = response.data.data;
      data.forEach((light) => {
        rooms.forEach((room) => {
          room.children.forEach((child) => {
            if (child.rid === light.owner.rid) {
              try {
                let array = `{ "Id":"${light.id}", "Name":"${light.metadata.name}", "Room":"${room.metadata.name}"}`;
                lights.push(JSON.parse(array));
              } catch (error) {
                console.error("Lights: ", error);
              }
            }
          });
        });
      });

      data.forEach((light) => {
        zones.forEach((zone) => {
          zone.children.forEach((child) => {
            if (child.rid === light.id) {
              try {
                let array = `{ "Id":"${light.id}", "Name":"${light.metadata.name}", "Room":"${zone.metadata.name}"}`;
                lights.push(JSON.parse(array));
              } catch (error) {
                console.error("Lights: ", error);
              }
            }
          });
        });
      });

      lights.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
      lights.sort((a, b) => (a.Room > b.Room ? 1 : b.Room > a.Room ? -1 : 0));

      console.log(`${lights.length} total lights(s) retrieved`);

      output.push(lights);
      output.push(groupList);
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Hue bridge");
        res.status(403).send("Could not connect to the Hue bridge");
      }
    });

  console.info("Sending server information to user interface...");
  res.send(JSON.stringify(output));
});

module.exports = router;
