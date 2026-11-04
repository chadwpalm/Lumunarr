// Where Lumunarr keeps its data: settings.js, logs/ and backups.
// Defaults to /config (the Docker volume). Set CONFIG_DIR to use another folder, e.g. for development:
//   CONFIG_DIR=./dev-config npm start
// A relative CONFIG_DIR is resolved from the folder Lumunarr is started in.
// This module has no dependencies (it is also loaded by bin/healthcheck.js).
const path = require("path");

const CONFIG_DIR = path.resolve(process.env.CONFIG_DIR || "/config");

module.exports = {
  CONFIG_DIR,
  SETTINGS_FILE: path.join(CONFIG_DIR, "settings.js"),
  LOG_DIR: path.join(CONFIG_DIR, "logs"),
  /** Path of a file inside the config folder, e.g. configPath("settings_v1.bak") */
  configPath: (...parts) => path.join(CONFIG_DIR, ...parts),
};
