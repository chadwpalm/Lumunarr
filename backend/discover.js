var express = require("express");
var router = express.Router();
var https = require("https");
var axios = require("axios").default;
var mdns = require("mdns-js");

var TIMEOUT = 3000;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

router.post("/", function (req, res, next) {
  var ips = [];
  var list = [];
  var browser = mdns.createBrowser();

  browser.on("ready", function () {
    console.info("Searching for bridges using mDNS");
    browser.discover();
  });

  browser.on("update", function (data) {
    if (data.type[0].name === "hue") {
      const ip = data.addresses[0];
      if (!ips.includes(ip)) {
        ips.push(ip);
        console.info("Found: ", ip);
      }
    }
  });

  setTimeout(async function onTimeout() {
    browser.stop();
    console.info("Finished searching for bridges using mDNS");

    if (!Object.keys(req.body).length) {
      if (ips.length === 0) {
        console.info("No bridges found using mDNS, using Hue Discovery");

        var url = `https://discovery.meethue.com`;
        await axios
          .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
          .then(function (response) {
            var data = response.data;

            for (const obj of data) {
              ips.push(obj.internalipaddress);
            }
          })
          .catch(function (error) {
            if (error.request) {
              if (error.message === "getaddrinfo ENOTFOUND discovery.meethue.com") {
                console.error("Could not connect to Hue Discovery. Check internet connection.");
              } else if (error.message === "Request failed with status code 429") {
                console.error(
                  "Could not get bridges from Hue Discovery due to reaching rate limit. Try again in 15 minutes."
                );
              } else {
                console.error("Could not connect to Hue Discovery website: ", error.message);
              }
            }
          });
      }
    } else {
      ips = [];
      ips.push(req.body.ip);
    }

    for (const ip of ips) {
      var url = `https://${ip}/api/0/config`;

      await axios
        .get(url, {
          timeout: 2000,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
          },
          httpsAgent,
        })
        .then(function (response) {
          var data = response.data;

          let element = `{ "Id":"${data.bridgeid}", "IP":"${ip}", "name":"${data.name}" }`;
          console.info(data.name + " found at", ip);
          list.push(JSON.parse(element));
        })
        .catch(function (error) {
          console.error("=== Bridge Request Error ===");

          if (error.response) {
            // Server responded but with an error status
            console.error("Bridge responded with status:", error.response.status);
            console.error("Response headers:", error.response.headers);
            console.error("Response data:", error.response.data);
          } else if (error.request) {
            // No response received
            console.error("No response received from bridge at", ip);
            console.error(
              "Request made:",
              JSON.stringify({
                method: error.config?.method,
                url: error.config?.url,
                timeout: error.config?.timeout,
              })
            );
            console.error("Error code:", error.code || "N/A");
            console.error("Error message:", error.message);
          } else {
            // Something went wrong setting up the request
            console.error("Request setup error:", error.message);
          }

          console.error("============================");
        });
    }
    res.send(list);
  }, TIMEOUT);
});

module.exports = router;
