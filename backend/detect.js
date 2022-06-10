var express = require("express");
var router = express.Router();
var huejay = require("huejay");

router.get("/", async function (req, res, next) {
  var list = [
    // { Id: "ECB5FAFFFE3F7E59", IP: "192.168.0.10" },
    // { Id: "F74635E95894A87B", IP: "192.168.0.50" },
    { Id: "A74456E95894A812", IP: "192.168.0.75" },
  ];

  // var list = [];

  // await huejay
  //   .discover()
  //   .then((bridges) => {
  //     for (let bridge of bridges) {
  //       let array = `{ "Id":"${bridge.id}", "IP":"${bridge.ip}" }`;
  //       console.info(array);
  //       list.push(JSON.parse(array));
  //     }
  //   })
  //   .catch((error) => {
  //     console.debug(`An error occurred: ${error.message}`);
  //   });

  res.send(list);
});

module.exports = router;
