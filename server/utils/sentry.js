// Must be required before express/app.js so Sentry's Node SDK can auto-instrument
// them. A no-op everywhere SENTRY_DSN isn't set (e.g. until a free Sentry account is
// wired up) — Sentry.* calls stay safe to make either way, they just do nothing.
const Sentry = require("@sentry/node");

const enabled = !!process.env.SENTRY_DSN;

if (enabled) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 0.1,
    });
}

module.exports = { Sentry, enabled };
