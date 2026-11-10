var express = require("express");
const log = require("./logger").tagged("PAIRING");
var router = express.Router();
var axios = require("axios").default;
const { setTimeout: setTimeoutPromise } = require("timers/promises");
const { saveFromPage, isSettingsObject } = require("./save");
var https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

router.post("/", async function (req, res, next) {
  var settings = req.body;
  if (!isSettingsObject(settings) || !settings.bridge?.ip) {
    return res.status(400).json({ error: "No bridge selected" });
  }

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
  }

  try {
    // The page's settings, keeping the sign-in fields only the server may change (backend/save.js)
    saveFromPage(settings, (saved) => {
      saved.bridge = { ...saved.bridge, user: username };
      if (username) saved.connected = "true";
    });
    log.debug("Settings file saved");
  } catch (err) {
    log.error("Could not save settings file:", err);
    return next(err);
  }

  res.send(username);
});

module.exports = router;
