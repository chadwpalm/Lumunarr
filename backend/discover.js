var express = require("express");
const log = require("./logger").tagged("DISCOVER");
var router = express.Router();
var https = require("https");
var axios = require("axios").default;
var mdns = require("mdns-js");

var TIMEOUT = 3000;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Hue bridges on the network ({ Id, IP, name } each). With `onlyIp`, just checks that address.
 * Also used by the bridge monitor (backend/monitor.js), which calls it directly.
 */
function findBridges(onlyIp) {
  return new Promise((resolve) => {
    var ips = [];
    var list = [];
    var browser = mdns.createBrowser();

    browser.on("ready", function () {
      log.debug("Searching for bridges using mDNS");
      browser.discover();
    });

    browser.on("update", function (data) {
      if (data.type[0].name === "hue") {
        const ip = (data.addresses || []).find((a) => /^\d{1,3}(\.\d{1,3}){3}$/.test(a));
        if (ip && !ips.includes(ip)) {
          ips.push(ip);
          log.debug("mDNS found a bridge at", ip);
        }
      }
    });

    setTimeout(async function onTimeout() {
      browser.stop();
      log.debug(`mDNS search finished, ${ips.length} bridge(s) found`);

      if (!onlyIp) {
        if (ips.length === 0) {
          log.info("No bridges found using mDNS, asking the Hue Discovery service (discovery.meethue.com)");

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
                  log.error("Could not connect to Hue Discovery. Check internet connection.");
                } else if (error.message === "Request failed with status code 429") {
                  log.error(
                    "Could not get bridges from Hue Discovery due to reaching rate limit. Try again in 15 minutes.",
                  );
                } else {
                  log.error("Could not connect to Hue Discovery website:", error);
                }
              }
            });
        }
      } else {
        ips = [];
        ips.push(onlyIp);
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
            log.info(data.name + " found at", ip);
            list.push(JSON.parse(element));
          })
          .catch(function (error) {
            log.error(`Could not get bridge details from ${ip}:`, error);
          });
      }
      resolve(list);
    }, TIMEOUT);
  });
}

router.post("/", async function (req, res) {
  // Express 5 leaves req.body undefined when the request has no body
  res.send(await findBridges(req.body?.ip));
});

module.exports = router;
module.exports.findBridges = findBridges;
