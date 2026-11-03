var createError = require("http-errors");
var express = require("express");
var path = require("path");
require("./backend/logger");

var webhookRouter = require("./webhook/index");
var load = require("./backend/load");
var save = require("./backend/save");
var user = require("./backend/user.js");
var discover = require("./backend/discover");
var thumb = require("./backend/thumb");
var client = require("./backend/client");
var server = require("./backend/server");
require("./backend/monitor.js");

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend/production")));

app.use("/backend/load", load);
app.use("/backend/save", save);
app.use("/backend/user", user);
app.use("/backend/discover", discover);
app.use("/backend/thumb", thumb);
app.use("/backend/client", client);
app.use("/backend/server", server);
app.use("/webhook", webhookRouter);

// Single-page app: any other GET returns index.html so client-side routes work
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/production/index.html"));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler (no view engine is configured, so reply with plain text)
app.use(function (err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err.stack || err);
  res.status(status).send(err.expose ? err.message : status >= 500 ? "Internal Server Error" : err.message);
});

module.exports = app;
