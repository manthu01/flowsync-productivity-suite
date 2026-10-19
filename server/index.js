require("dotenv").config();
require("./utils/sentry"); // must load before app.js so Express gets auto-instrumented

const http = require("http");
const app = require("./app");
const { attachRealtime } = require("./realtime");
require("./config/db");
const logger = require("./utils/logger");

// Every session token is signed with this, so refuse to run without one and warn
// loudly if it's short enough to be brute-forced offline.
if (!process.env.JWT_SECRET) {
    logger.fatal("JWT_SECRET is not set; refusing to start");
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    logger.warn("JWT_SECRET is shorter than 32 characters; use a long random value");
}

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
attachRealtime(server);

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
