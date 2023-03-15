var express = require("express");
var router = express.Router();

router.get("/", function (req, res, next) {
  var fileData = JSON.stringify(req.query);

  console.log("Test data: ", fileData);
  res.send("Chaps");
});

module.exports = router;
