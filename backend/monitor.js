const { SETTINGS_FILE } = require("./paths");
const log = require("./logger").tagged("MONITOR");
const fs = require("fs");
var https = require("https");
var axios = require("axios").default;
const store = require("./settingsStore");
const { findBridges } = require("./discover");

var interval = 15; //bridge checking interval in minutes

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

log.info(`Bridge monitor active, checking every ${interval} minutes`);

// Path to the JSON file
const jsonFilePath = SETTINGS_FILE;

function writeToSettings(ip) {
  try {
    store.update((s) => {
      s.bridge.ip = ip;
    });
  } catch (error) {
    log.error("Could not save the new bridge IP:", error);
    return;
  }
  log.info(`Saved new bridge IP ${ip} to settings`);
}

// Function to check the results
async function checkResults(data) {
  if (data.bridge) {
    var url = `https://${data.bridge.ip}/api/0/config`;

    await axios
      .get(url, {
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        timeout: 2000, // Set timeout to 2000 milliseconds (2 seconds)
        httpsAgent,
      })
      .then(function (response) {
        var bridgeData = response.data;

        // log.info(`Bridge check: ${bridgeData.bridgeid} found at ${data.bridge.ip}`);
      })
      .catch(function (error) {
        if (error.request) {
          log.warn(`Bridge not reachable at ${data.bridge.ip}, searching the network for it`);

          // Called directly: an HTTP request to our own /backend/discover would need a signed-in session
          findBridges()
            .then(function (discData) {
              discData.forEach((element) => {
                url = `https://${element.IP}/api/0/config`;
                axios
                  .get(url, {
                    headers: { "Content-Type": "application/json;charset=UTF-8" },
                    timeout: 2000, // Set timeout to 2000 milliseconds (2 seconds)
                    httpsAgent,
                  })
                  .then(function (response) {
                    var newData = response.data;

                    if (newData.bridgeid === data.bridge.id) {
                      log.info(`Bridge with ID ${newData.bridgeid} was found at ${element.IP}`);
                      writeToSettings(element.IP);
                    }
                  })
                  .catch(function (error) {
                    if (error.request) {
                      log.debug(`No matching bridge at ${element.IP}`);
                    }
                  });
              });
            })
            .catch(function (error) {
              if (error.request) {
                log.error("Bridge search failed:", error);
              }
            });
        }
      });
  }
}

function readAndCheckJson() {
  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      log.error("Error reading the file:", err);
      return;
    }
    try {
      const jsonData = JSON.parse(data);
      checkResults(jsonData);
    } catch (parseError) {
      log.error("Error parsing JSON:", parseError);
    }
  });
}

// Initial read and check
readAndCheckJson();

// Schedule to run every 15 minutes
setInterval(readAndCheckJson, interval * 60 * 1000); // 15 minutes in milliseconds
