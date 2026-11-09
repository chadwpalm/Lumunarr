var https = require("https");
const log = require("./logger").tagged("MIGRATE");
var axios = require("axios").default;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function updateScenes(temp) {
  var url = `https://${temp.bridge.ip}/clip/v2/resource/scene`;

  return axios
    .get(url, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "hue-application-key": `${temp.bridge.user}`,
      },
      httpsAgent,
    })
    .then(function (response) {
      log.info("Migrating Config File to API v2");
      var data = response.data.data;
      data.forEach((element) => {
        temp.clients.forEach(function (client, index, thisArg) {
          if (client.play === element.id_v1.split("/")[2]) {
            thisArg[index].play = element.id;
          }
          if (client.pause === element.id_v1.split("/")[2]) {
            thisArg[index].pause = element.id;
          }
          if (client.stop === element.id_v1.split("/")[2]) {
            thisArg[index].stop = element.id;
          }
          if (client.resume === element.id_v1.split("/")[2]) {
            thisArg[index].resume = element.id;
          }
          if (client.scrobble === element.id_v1.split("/")[2]) {
            thisArg[index].scrobble = element.id;
          }
        });
      });
      return temp;
    })
    .catch(function (error) {
      log.error("Error while trying to connect to the Hue bridge while migrating settings:", error);
    });
}

async function updateLights(temp) {
  if (temp.server) {
    var url2 = `https://${temp.bridge.ip}/clip/v2/resource/light`;
    return axios
      .get(url2, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "hue-application-key": `${temp.bridge.user}`,
        },
        httpsAgent,
      })
      .then(function (response) {
        var data = response.data.data;
        data.forEach((element) => {
          if (temp.server.lightPlay === element.id_v1.split("/")[2]) {
            temp.server.lightPlay = element.id;
          }
          if (temp.server.lightNew === element.id_v1.split("/")[2]) {
            temp.server.lightNew = element.id;
          }
        });
        return temp;
      })
      .catch(function (error) {
        log.error("Error while trying to connect to the Hue bridge while migrating settings:", error);
      });
  } else {
    return temp;
  }
}

exports.updateScenes = updateScenes;
exports.updateLights = updateLights;
