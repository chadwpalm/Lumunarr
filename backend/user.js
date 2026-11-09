var express = require("express");
const { SETTINGS_FILE } = require("./paths");
const log = require("./logger").tagged("PAIRING");
var router = express.Router();
var axios = require("axios").default;
const { setTimeout: setTimeoutPromise } = require("timers/promises");
var fs = require("fs");
var https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

router.post("/", async function (req, res, next) {
  var settings = req.body;

  log.info(`Pairing with bridge at ${settings.bridge.ip}`);
  log.debug(`Hue application name: ${settings.appId}`);

  var flag = false;
  var startTime = new Date().getTime();
  var url = `https://${settings.bridge.ip}/api`;
  var username;

  while (!flag && new Date().getTime() - startTime < 30000) {
    await axios
      .post(url, { devicetype: `${settings.appId}` }, { httpsAgent })
      .then(function (response) {
        if (!response.data[0].error) {
          log.info("Paired with the bridge, new application key created");
          username = response.data[0].success.username;
          flag = true;
        }
      })
      .catch(function (error) {
        if (error.request) {
          log.error("Could not reach bridge during detection:", error);
        }
      });
    await setTimeoutPromise(200);
  }

  if (!username) {
    log.info("Bridge link button not pressed yet, waiting...");
  } else {
    settings.connected = "true";
  }

  if (!settings.bridge) {
    settings.bridge = {};
  }

  settings.bridge.user = username;

  var fileData = JSON.stringify(settings);

  try {
    fs.writeFileSync(SETTINGS_FILE, fileData);
    log.debug("Settings file saved");
  } catch (err) {
    if (err) throw err;
  }

  res.send(username);
});

module.exports = router;
