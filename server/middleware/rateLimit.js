const rateLimit = require("express-rate-limit");

// Login/signup are brute-force/credential-stuffing targets; this is the standard
// "5 attempts per 15 minutes per IP" band used for auth endpoints.
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

module.exports = { authLimiter, forgotPasswordLimiter: strictLimiter, strictLimiter };
