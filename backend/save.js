var express = require("express");
var router = express.Router();
var fs = require("fs");
const logger = require("./logger");
const log = logger.tagged("SAVE");

router.post("/", function (req, res, next) {
  try {
    fs.writeFileSync("/config/settings.js", JSON.stringify(req.body));
    log.debug("Settings file saved");
  } catch (err) {
    log.error("Could not save settings file:", err);
    return next(err);
  }

  // Apply log level/size/files and refresh the secrets used for redaction
  logger.reload();

  res.send();
});

module.exports = router;
