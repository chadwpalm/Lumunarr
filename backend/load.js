var express = require("express");
const { CONFIG_DIR, SETTINGS_FILE, configPath } = require("./paths");
const log = require("./logger").tagged("SETTINGS");
var router = express.Router();
var fs = require("fs");
var os = require("os");
var crypto = require("crypto");
var uuid = crypto.randomUUID;
var updates = require("./migrate.js");

var appVersion, branch, UID, GID, build;
var hostname = os.hostname;
// Signs the session cookies (backend/auth.js)
const newSecret = () => crypto.randomBytes(32).toString("hex");
var platform = `${os.platform().charAt(0).toUpperCase()}${os.platform().slice(1).toLowerCase()} ${os.release}`;

try {
  var info = fs.readFileSync("version.json");
  appVersion = JSON.parse(info).version;
  branch = JSON.parse(info).branch;
} catch (err) {
  log.error("Cannot grab version and branch info", err);
}

if (process.env.PUID) {
  UID = Number(process.env.PUID);
} else {
  UID = os.userInfo().uid;
}

if (process.env.PGID) {
  GID = Number(process.env.PGID);
} else {
  GID = os.userInfo().gid;
}

if (process.env.BUILD) {
  build = process.env.BUILD;
} else {
  build = "Native";
}

var fileData = `{"connected": "false","platform":"${
  platform
}","uuid":"${uuid()}","version":"${appVersion}","branch":"${branch}","build":"${build}","appId":"Lumunarr#${hostname}","sessionSecret":"${newSecret()}","clients":[],"settings":{"transition":"0","startHour":"12","startMin":"0","startMed":"1","endHour":"11","endMin":"59","endMed":"2"},"api": "v2"}`;

try {
  fileData = fs.readFileSync(SETTINGS_FILE);
  var temp = JSON.parse(fileData);

  if (temp.api !== "v2") {
    log.info('Backing up old settings file to "settings_v1.bak"');
    fs.writeFileSync(configPath("settings_v1.bak"), JSON.stringify(temp));
    updates.updateScenes(temp).then((temp2) => {
      updates.updateLights(temp2).then((newTemp) => {
        newTemp.api = "v2";
        if (newTemp.version !== appVersion || newTemp.build !== build || newTemp.branch !== branch) {
          log.info(
            "Version updated from",
            newTemp.version,
            "build",
            newTemp.build,
            "branch",
            newTemp.branch,
            "to",
            appVersion,
            "build",
            build,
            "branch",
            branch,
          );
          newTemp.version = appVersion;
          newTemp.build = build;
          newTemp.branch = branch;
          newTemp.appId = `Lumunarr#${hostname}`;
          newTemp.message = true;
          newTemp.platform = platform;
        }
        if (!newTemp.sessionSecret) newTemp.sessionSecret = newSecret();

        newTemp.clients.map((client) => {
          if (client.active === undefined) {
            client.active = true;
          }
        });

        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newTemp));
        fs.chownSync(SETTINGS_FILE, UID, GID, (err) => {
          if (err) throw err;
        });
        log.info(`Config file updated to UID: ${UID} GID: ${GID}`);
        log.debug("Settings file read");
        require("./auth").resolveOwnerFromToken();
      });
    });
  } else {
    if (temp.version !== appVersion || temp.build !== build || temp.branch !== branch) {
      log.info(
        "Version updated from",
        temp.version,
        "build",
        temp.build,
        "branch",
        temp.branch,
        "to",
        appVersion,
        "build",
        build,
        "branch",
        branch,
      );
      temp.version = appVersion;
      temp.build = build;
      temp.branch = branch;
      temp.appId = `Lumunarr#${hostname}`;
      temp.message = true;
      temp.platform = platform;
    }
    if (!temp.sessionSecret) temp.sessionSecret = newSecret();

    temp.clients.map((client) => {
      if (client.active === undefined) {
        client.active = true;
      }
    });

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(temp));
    fs.chownSync(SETTINGS_FILE, UID, GID, (err) => {
      if (err) throw err;
    });
    log.info(`Config file updated to UID: ${UID} GID: ${GID}`);
    log.debug("Settings file read");
    // Outside this try block: an error here must not fall into the "create a new settings file" path below
    setImmediate(() => require("./auth").resolveOwnerFromToken());
  }
} catch (err) {
  log.info("Settings file not found, creating");
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, fileData);
    log.info("Settings file created");
    fs.chownSync(SETTINGS_FILE, UID, GID, (err) => {
      if (err) throw err;
    });
    log.info(`Config file set to UID: ${UID} GID: ${GID}`);
  } catch (err) {
    if (err) throw err;
  }
}

// Settings that stay on the server: the browser never needs them, and backend/save keeps them as they are
const SERVER_ONLY = ["token", "sessionSecret", "ownerId", "plexSignInNeeded"];

router.get("/", function (req, res, next) {
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    log.debug("Settings file read");
  } catch (err) {
    log.error("Could not read settings file:", err);
    return next(err);
  }
  for (const key of SERVER_ONLY) delete settings[key];
  res.json(settings);
});

module.exports = router;
module.exports.SERVER_ONLY = SERVER_ONLY;
