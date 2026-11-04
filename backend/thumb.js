var express = require("express");
const log = require("./logger").tagged("PLEX");
var router = express.Router();
var axios = require("axios").default;
var parser = require("xml-js");

router.post("/", async function (req, res, next) {
  var url = "https://plex.tv/users/account";

  await axios
    .get(url, { params: { "X-Plex-Token": req.body.token } })

    .then(function (response) {
      log.debug("Retrieving thumbnail from Plex account");

      let thumb = parser.xml2js(response.data, { compact: true, spaces: 4 }).user._attributes.thumb;
      let username = parser.xml2js(response.data, { compact: true, spaces: 4 }).user._attributes.username;
      let email = parser.xml2js(response.data, { compact: true, spaces: 4 }).user._attributes.email;

      let data = { thumb, username, email };

      res.send(JSON.stringify(data));
    })
    .catch(function (error) {
      if (error.request) {
        log.error("Could not connect to the Plex server");
        res.status(403).send("Could not connect to the Plex server");
      }
    });
});

module.exports = router;
