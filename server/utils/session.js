const jwt = require("jsonwebtoken");
const db = require("../config/db");

const TOKEN_TTL = "1d";

// Every token carries the user's token_version ("tv"). Bumping the column in the
// database invalidates all tokens issued before it, which is how a password reset
// signs the user out everywhere.
const signSessionToken = (user) =>
    jwt.sign({ id: user.id, tv: user.token_version ?? 0 }, process.env.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: TOKEN_TTL,
    });

// Returns the decoded payload, or null for a missing/forged/expired token.
const verifySessionToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
        return null;
    }
};

// Resolves to { id, isAdmin } while the token is still current, or null once the
// user is gone or their token_version has moved on.
const loadSession = (payload) =>
    new Promise((resolve, reject) => {
        db.query("SELECT id, token_version, is_admin FROM users WHERE id = ?", [payload.id], (err, rows) => {
            if (err) return reject(err);
            const user = rows[0];
            if (!user || user.token_version !== (payload.tv ?? 0)) return resolve(null);
            resolve({ id: user.id, isAdmin: !!user.is_admin });
        });
    });

module.exports = { signSessionToken, verifySessionToken, loadSession };
