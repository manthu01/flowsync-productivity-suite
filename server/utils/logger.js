const pino = require("pino");

// pino-pretty is nice for a local terminal but shouldn't run in production (it's a
// dev dependency-shaped tool and costs throughput); ship plain structured JSON
// lines everywhere except local dev, where transport makes them human-readable.
const isProd = process.env.NODE_ENV === "production";

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info"),
    transport: isProd
        ? undefined
        : {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
          },
});

module.exports = logger;
