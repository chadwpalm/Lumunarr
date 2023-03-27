var express = require("express");
var router = express.Router();
var fs = require("fs");
var os = require("os");
var uuid = require("uuid").v4;

var appVersion = process.env.VERSION.toString();
var UID = Number(process.env.UID);
var GID = Number(process.env.GID);

var fileData = `{"connected": "false","platform":"${
  os.platform
}","uuid":"${uuid()}","version":"${appVersion}","clients":[]}`;
try {
  fileData = fs.readFileSync("/config/settings.js");
  if (JSON.parse(fileData).version !== appVersion) {
    console.info("Version updated from", JSON.parse(fileData).version, "to", appVersion);
    var temp = JSON.parse(fileData);
    temp.version = appVersion;
    fs.writeFileSync("/config/settings.js", JSON.stringify(temp));
  }
  console.info("Settings file read");
} catch (err) {
  console.info("Settings file not found, creating");
  try {
    fs.writeFileSync("/config/settings.js", fileData);
    console.info("Settings file created");
    fs.chownSync("/config/settings.js", UID, GID, (err) => {
      if (err) throw err;
      console.info(`Config file change to UID: ${UID} GID: ${GID}`);
    });
  } catch (err) {
    if (err) throw err;
  }
}

router.get("/", function (req, res, next) {
  // var fileData = `{"connected": "false","platform":"${os.platform}","uuid":"${uuid()}","version":"${appVersion}"}`;
  try {
    fileData = fs.readFileSync("/config/settings.js");
    console.info("Settings file read");
  } catch (err) {
    console.info("Settings file not found");
  }

  res.send(fileData);
});

module.exports = router;
