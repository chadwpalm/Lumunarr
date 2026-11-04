var express = require("express");
const log = require("./logger").tagged("SERVER-PAGE");
var router = express.Router();
var axios = require("axios").default;
var https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

router.post("/", async function (req, res, next) {
  var rooms = {};
  var zones = {};
  var lights = [];
  var groupList = [];
  var output = [];
  var message = []; // problems to report to the UI

  log.debug("Retrieving information for server page...");

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
      log.debug("Retrieving Rooms");
      rooms = response.data.data;
      for (const [key, value] of Object.entries(rooms)) {
        try {
          const groupedLightService = value.services.find((service) => service.rtype === "grouped_light");

          let array = groupedLightService
            ? `{ "Room":"${value.metadata.name}", "Type":"Room", "Id":"${groupedLightService.rid}"}`
            : `{ "Room":"${value.metadata.name}", "Type":"Room", "Id":"" }`;

          groupList.push(JSON.parse(array));
        } catch (error) {
          log.error("GroupList: ", error);
        }
      }
      log.debug(`${rooms.length} total room(s) retrieved`);
    })
    .catch(function (error) {
      log.error("Error while trying to connect to the Hue bridge while requesting rooms:", error);
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
      log.debug("Retrieving Zones");
      zones = response.data.data;
      for (const [key, value] of Object.entries(zones)) {
        try {
          const groupedLightService = value.services.find((service) => service.rtype === "grouped_light");

          let array = groupedLightService
            ? `{ "Room":"${value.metadata.name}", "Type":"Zone", "Id":"${groupedLightService.rid}"}`
            : `{ "Room":"${value.metadata.name}", "Type":"Zone", "Id":"" }`;

          groupList.push(JSON.parse(array));
        } catch (error) {
          log.error("GroupList: ", error);
        }
      }
      log.debug(`${zones.length} total zone(s) retrieved`);
    })
    .catch(function (error) {
      log.error("Error while trying to connect to the Hue bridge while requesting rooms:", error);
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
      log.debug("Retrieving Lights");
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
                log.error("Lights: ", error);
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
                log.error("Lights: ", error);
              }
            }
          });
        });
      });

      lights.sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));
      lights.sort((a, b) => (a.Room > b.Room ? 1 : b.Room > a.Room ? -1 : 0));

      log.debug(`${lights.length} total light(s) retrieved`);

      output.push(lights);
      output.push(groupList);
    })
    .catch(function (error) {
      log.error("Error while trying to connect to the Hue bridge while requesting lights:", error);
      message.push("Could not connect to the Hue bridge while requesting lights");
    });

  if (message.length) {
    return res.status(403).send(message.join(". "));
  }
  log.debug("Sending server information to user interface...");
  res.send(JSON.stringify(output));
});

module.exports = router;
