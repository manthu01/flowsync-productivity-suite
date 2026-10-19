const crypto = require("crypto");

const generateToken = () => crypto.randomBytes(32).toString("hex");

// Reset tokens are stored hashed, so a leaked database row can't be turned into a
// working reset link. The raw token only ever exists in the emailed URL.
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { generateToken, hashToken };
