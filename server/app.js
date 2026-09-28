const express = require("express");
const cors = require("cors");
const pinoHttp = require("pino-http");

const { Sentry, enabled: sentryEnabled } = require("./utils/sentry");
const logger = require("./utils/logger");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const contactRoutes = require("./routes/contactRoutes");
const profileRoutes = require("./routes/profileRoutes");
const friendRoutes = require("./routes/friendRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
}));
app.use(express.json());

// One structured log line per request (method, path, status, duration, request id) —
// silenced under the test runner via the logger's own level so test output stays clean.
app.use(pinoHttp({ logger }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("FlowSync Backend Running");
});

// Sentry needs to see errors before our own handler responds, and only actually
// reports anything when SENTRY_DSN is set — a no-op middleware otherwise.
if (sentryEnabled) {
    Sentry.setupExpressErrorHandler(app);
}

// Safety net for anything a route didn't handle itself (a thrown sync error, a
// rejected promise passed to next(), etc.) — every existing route already sends its
// own response on failure, so in practice this is a last line of defense, not the
// primary error path.
app.use((err, req, res, next) => {
    req.log?.error({ err }, "Unhandled error");
    if (res.headersSent) return next(err);
    res.status(500).json({ message: "Something went wrong" });
});

module.exports = app;
