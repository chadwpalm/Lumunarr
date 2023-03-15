var express = require("express");
var router = express.Router();
var fs = require("fs");
var huejay = require("huejay");
var axios = require("axios").default;
var mdns = require("mdns-js");

var ips = [];

var TIMEOUT = 5000;

var browser = mdns.createBrowser();

browser.on("ready", function () {
  console.info("Searching for bridges using mDNS");
  browser.discover();
});

browser.on("update", function (data) {
  if (data.type[0].name === "hue" && data.interfaceIndex === 0) ips.push(data.addresses[0]);
});

setTimeout(function onTimeout() {
  browser.stop();
  console.log("Finished searching for bridges");
}, TIMEOUT);

router.post("/", async function (req, res, next) {
  console.log("Frigg: ", req.body);
  var list = [];

  if (!Object.keys(req.body).length) {
    if (ips.length === 0) {
      console.log("No bridges found using mDNS, using Hue Discovery");

      var url = `https://discovery.meethue.comy`;
      await axios
        .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
        .then(function (response) {
          var data = response.data;

          for (const obj of data) {
            ips.push(obj.internalipaddress);
          }
          // await huejay
          //   .discover()
          //   .then((bridges) => {
          //     for (let bridge of bridges) {
          //       console.log(bridge);
          //       let array = `{ "Id":"${bridge.id}", "IP":"${bridge.ip}", "name":"${bridge.name}" }`;
          //       console.info(array);
          //       list.push(JSON.parse(array));
          //     }
          //   })
          //   .catch((error) => {
          //     console.debug(`An error occurred: ${error.message}`);
          //   });
        })
        .catch(function (error) {
          if (error.request) {
            console.log("Could not get bridges from Hue Discovery. Try again in 15 minutes");
          }
        });
    }
  } else {
    ips.push(req.body.ip);
  }

  for (const ip of ips) {
    var url = `http://${ip}/api/0/config`;

    await axios
      .get(url, { headers: { "Content-Type": "application/json;charset=UTF-8" } })
      .then(function (response) {
        var data = response.data;

        let element = `{ "Id":"${data.bridgeid}", "IP":"${ip}", "name":"${data.name}" }`;
        console.info(data.name + " bridge found at", ip);
        list.push(JSON.parse(element));
      })
      .catch(function (error) {
        if (error.request) {
          console.log("Bridge not online at", ip);
        }
      });
  }
  ips = [];
  res.send(list);
});

module.exports = router;
