var express = require("express");
const fs = require("fs");
var axios = require("axios").default;

var interval = 15; //bridge checking interval in minutes

console.info("Bridge checking monitor is active");

// Path to the JSON file
const jsonFilePath = "/config/settings.js";

function writeToSettings(ip) {
  var fileData = "";
  try {
    fileData = fs.readFileSync("/config/settings.js");
  } catch (error) {
    console.error("Could not read settings file, (monitor.js)");
  }
  var temp = JSON.parse(fileData);
  temp.bridge.ip = ip;
  try {
    fs.writeFileSync("/config/settings.js", JSON.stringify(temp));
  } catch (error) {
    console.error("Could not write settings file, (monitor.js)");
  }
  console.info(`Writing IP ${ip} to settings`);
}

// Function to check the results
async function checkResults(data) {
  if (data.bridge) {
    var url = `http://${data.bridge.ip}/api/0/config`;

    await axios
      .get(url, {
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        timeout: 2000, // Set timeout to 2000 milliseconds (2 seconds)
      })
      .then(function (response) {
        var bridgeData = response.data;

        // console.info(`Bridge check: ${bridgeData.bridgeid} found at ${data.bridge.ip}`);
      })
      .catch(function (error) {
        if (error.request) {
          console.error("Bridge not online at", data.bridge.ip);

          axios
            .post(
              "http://localhost:3939/backend/discover",
              {},
              {
                headers: { "Content-Type": "application/json;charset=UTF-8" },
                timeout: 10000, // Set timeout to 2000 milliseconds (2 seconds)
              }
            )
            .then(function (response) {
              var discData = response.data;

              discData.forEach((element) => {
                url = `http://${element.IP}/api/0/config`;
                axios
                  .get(url, {
                    headers: { "Content-Type": "application/json;charset=UTF-8" },
                    timeout: 2000, // Set timeout to 2000 milliseconds (2 seconds)
                  })
                  .then(function (response) {
                    var newData = response.data;

                    if (newData.bridgeid === data.bridge.id) {
                      console.info(`Bridge with ID ${newData.bridgeid} was found at ${element.IP}`);
                      writeToSettings(element.IP);
                    }
                  })
                  .catch(function (error) {
                    if (error.request) {
                      console.error("Bridge not online at", data.bridge.ip);
                    }
                  });
              });
            })
            .catch(function (error) {
              if (error.request) {
                console.error(error);
              }
            });
        }
      });
  }
}

function readAndCheckJson() {
  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }
    try {
      const jsonData = JSON.parse(data);
      checkResults(jsonData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
    }
  });
}

// Initial read and check
readAndCheckJson();

// Schedule to run every 15 minutes
setInterval(readAndCheckJson, interval * 60 * 1000); // 15 minutes in milliseconds
