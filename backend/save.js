var express = require("express");
var router = express.Router();
var fs = require("fs");

router.post("/", function (req, res, next) {
  var fileData = JSON.stringify(req.body);

  try {
    fs.writeFileSync("/config/settings.js", fileData);
    console.info("Settings file saved");
  } catch (err) {
    if (err) throw err;
  }

  //   console.debug("At request save: ", fileData.toString());
  res.send();
  // res.send(info);
});

module.exports = router;
