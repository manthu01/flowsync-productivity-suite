const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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

// Render puts exactly one load balancer in front of the app. Trusting that single
// hop makes req.ip the real client address (so per-IP rate limits apply per
// visitor), without trusting X-Forwarded-For values a client could forge.
app.set("trust proxy", 1);

// Standard security headers (nosniff, frame denial, HSTS, ...) and no
// X-Powered-By banner. This server only returns JSON, so the defaults fit as-is.
app.use(helmet());

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
}));
app.use(express.json({ limit: "100kb" }));

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
