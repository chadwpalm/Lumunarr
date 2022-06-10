var express = require("express");
var router = express.Router();
var fs = require("fs");

router.get("/", function (req, res, next) {
  var fileData = '{ "connected": "false" }';
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

  console.debug("At request send: ", fileData.toString());
  res.send(fileData);
  // res.send(info);
});

module.exports = router;
