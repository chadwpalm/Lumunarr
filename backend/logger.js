const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf((info) => `[${info.timestamp}] [${info.level}] ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: "/config/logs/lumunarr-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "5",
    }),
  ],
});

// Override default console methods
console.log = (...args) => logger.log("info", args.join(" "));
console.info = (...args) => logger.log("info", args.join(" "));
console.error = (...args) => logger.log("error", args.join(" "));
console.warn = (...args) => logger.log("warn", args.join(" "));
console.debug = (...args) => logger.log("debug", args.join(" "));

module.exports = logger;
