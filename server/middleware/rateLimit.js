const rateLimit = require("express-rate-limit");

// Login/signup are brute-force/credential-stuffing targets; this is the standard
// "a handful of attempts per 15 minutes per IP" band used for auth endpoints.
// Keyed on req.ip, which is the real client address because app.js trusts exactly
// one proxy hop (Render's load balancer).
// Disabled under the test runner (Jest sets NODE_ENV=test) so a test file making
// more than a handful of requests to the same endpoint doesn't start tripping 429s
// that have nothing to do with what that test is actually checking.
const skipInTests = () => process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    message: { message: "Too many attempts, please try again later" },
});

// Shared by forgot-password and the public contact form: both are low-frequency-
// by-nature endpoints an attacker could otherwise abuse to spam someone's inbox.
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    message: { message: "Too many requests, please try again later" },
});

// Per-account cap on writes (create/edit/delete), mounted after requireAuth. Far
// above what a person clicking around does, low enough that a script can't flood
// the database from one account.
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `user:${req.userId}`,
    skip: (req) => skipInTests() || req.method === "GET",
    message: { message: "You're doing that too fast, please slow down" },
});

module.exports = { authLimiter, forgotPasswordLimiter: strictLimiter, strictLimiter, writeLimiter };
