require("dotenv").config();
require("./utils/sentry"); // must load before app.js so Express gets auto-instrumented

const http = require("http");
const app = require("./app");
const { attachRealtime } = require("./realtime");
require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
attachRealtime(server);

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
