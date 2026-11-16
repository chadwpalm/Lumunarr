var express = require("express");
var router = express.Router();
const store = require("./settingsStore");
const logger = require("./logger");
const { SERVER_ONLY } = require("./load");
const log = logger.tagged("SAVE");

// Set by the server, never by the page: the sign-in (backend/auth.js) and the Plex account shown in the menu
const KEPT_FROM_SERVER = [...SERVER_ONLY, "username", "email", "thumb", "uuid"];

/**
 * Saves the settings object a page sent, keeping the fields only the server may change.
 * `change` can adjust the result before it is written (e.g. the bridge key after pairing).
 */
function saveFromPage(incoming, change) {
  return store.update((current) => {
    const saved = { ...incoming };
    for (const key of KEPT_FROM_SERVER) {
      if (key in current) saved[key] = current[key];
      else delete saved[key];
    }
    if (change) change(saved);
    // store.update() writes back the object it was given, so replace its contents
    for (const key of Object.keys(current)) delete current[key];
    Object.assign(current, saved);
  });
}

function isSettingsObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

router.post("/", function (req, res, next) {
  if (!isSettingsObject(req.body)) return res.status(400).json({ error: "Settings must be a JSON object" });

  try {
    saveFromPage(req.body);
    log.debug("Settings file saved");
  } catch (err) {
    log.error("Could not save settings file:", err);
    return next(err);
  }

  // Apply log level/size/files and refresh the secrets used for redaction
  logger.reload();

  res.send();
});

module.exports = router;
module.exports.saveFromPage = saveFromPage;
module.exports.isSettingsObject = isSettingsObject;
