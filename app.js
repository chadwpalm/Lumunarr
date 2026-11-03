var createError = require("http-errors");
var express = require("express");
var path = require("path");
var fs = require("fs");
require("./backend/logger");
const { getBaseURL } = require("./backend/config");

var webhookRouter = require("./webhook/index");
var load = require("./backend/load");
var save = require("./backend/save");
var user = require("./backend/user.js");
var discover = require("./backend/discover");
var thumb = require("./backend/thumb");
var client = require("./backend/client");
var server = require("./backend/server");
var host = require("./backend/host");
require("./backend/monitor.js");

var app = express();

// URL base for reverse proxies, e.g. "/lumunarr" ("" = root). Everything is mounted under it.
const base = getBaseURL();
const basePath = base + "/";
const frontendDir = path.join(__dirname, "frontend/production");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (base) {
  // "/" and "/lumunarr" -> "/lumunarr/"
  app.use((req, res, next) => {
    if (req.path === "/" || req.path === base) return res.redirect(302, basePath);
    next();
  });
}

var routes = express.Router();

routes.use(express.static(frontendDir, { index: false }));

routes.use("/backend/load", load);
routes.use("/backend/save", save);
routes.use("/backend/user", user);
routes.use("/backend/discover", discover);
routes.use("/backend/thumb", thumb);
routes.use("/backend/client", client);
routes.use("/backend/server", server);
routes.use("/backend/host", host);
routes.use("/webhook", webhookRouter);

// Single-page app: any other GET returns index.html so client-side routes work.
// <base href> makes the relative asset and API URLs in the frontend resolve under the URL base,
// and window.__BASE_PATH__ tells React Router its basename.
routes.get("/{*splat}", (req, res, next) => {
  fs.readFile(path.join(frontendDir, "index.html"), "utf8", (err, html) => {
    if (err) return next(err);
    const inject = `<base href="${basePath}" /><script>window.__BASE_PATH__=${JSON.stringify(basePath)};</script>`;
    res.set("Cache-Control", "no-cache").type("html").send(html.replace("<head>", `<head>${inject}`));
  });
});

app.use(base || "/", routes);

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
