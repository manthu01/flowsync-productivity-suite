const crypto = require("crypto");

const generateToken = () => crypto.randomBytes(32).toString("hex");

module.exports = { generateToken };
