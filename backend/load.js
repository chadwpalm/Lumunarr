var express = require("express");
var router = express.Router();
var fs = require("fs");
var os = require("os");
var uuid = require("uuid").v4;

var appVersion = "0.1.0";

var fileData = `{"connected": "false","platform":"${os.platform}","uuid":"${uuid()}","version":"${appVersion}"}`;
  try {
    fileData = fs.readFileSync("/config/settings.js");
    console.info("Settings file read");
  } catch (err) {
    console.info("File not found, creating!");
    try {
      fs.writeFileSync("/config/settings.js", fileData);
      console.info("Settings file created");
    } catch (err) {
      if (err) throw err;
    }
  }

router.get("/", function (req, res, next) {
  var fileData = `{"connected": "false","platform":"${os.platform}","uuid":"${uuid()}","version":"${appVersion}"}`;
  try {
    fileData = fs.readFileSync("/config/settings.js");
    console.info("Settings file read");
  } catch (err) {
    console.info("Settings file not found");
  }

  console.debug("At request send: ", fileData.toString());
  res.send(fileData);
});

module.exports = router;
