var express = require("express");
var router = express.Router();
var huejay = require("huejay");
var os = require("os");
var fs = require("fs");

router.post("/", async function (req, res, next) {
  var settings = req.body;

  var hostname = os.hostname;

  console.log(settings.bridge.ip);

  let client = new huejay.Client({
    host: `${settings.bridge.ip}`,
    port: 80,
    timeout: 15000,
  });

  let user = new client.users.User();

  user.deviceType = `${settings.appId}`;
  console.info("Hue Application Name:", user.deviceType);

  let flag = 0;
  let startTime = new Date().getTime();

  while (!flag && new Date().getTime() - startTime < 10000) {
    await client.users
      .create(user)
      .then((user) => {
        console.info(`New bridge user created - Username: ${user.username}`);
        flag = 1;
      })
      .catch((error) => {
        if (error instanceof huejay.Error && error.type === 101) {
        }
      });
  }

  if (!user.username) {
    console.info(`Link button not pressed. Try again...`);
  } else {
    settings.connected = "true";
  }

  if (!settings.bridge) {
    settings.bridge = {};
  }

  settings.bridge.user = user.username;

  var fileData = JSON.stringify(settings);

  try {
    fs.writeFileSync("/config/settings.js", fileData);
    console.info("Settings file saved");
  } catch (err) {
    if (err) throw err;
  }

  res.send(user.username);
});

module.exports = router;
