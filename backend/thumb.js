var express = require("express");
const { STATUS_CODES } = require("http");
var router = express.Router();
var os = require("os");
var PlexAPI = require("plex-api");
var axios = require("axios").default;
var parser = require("xml2json");

router.post("/", async function (req, res, next) {
  var url = "https://plex.tv/users/account";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      console.info("Retrieving thumbnail from Plex account");

      let thumb = parser.toJson(response.data, { object: true }).user.thumb;
      let username = parser.toJson(response.data, { object: true }).user.username[0];
      let email = parser.toJson(response.data, { object: true }).user.email[0];

      let data = { thumb, username, email };

      res.send(JSON.stringify(data));
    })
    .catch(function (error) {
      if (error.request) {
        console.error("Could not connect to the Plex sewrver");
        res.status(403).send("Could not connect to the Plex server");
      }
    });
});

module.exports = router;
