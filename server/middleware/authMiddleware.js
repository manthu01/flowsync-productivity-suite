const { verifySessionToken, loadSession } = require("../utils/session");

// Verifies the JWT, then checks it against the user's current token_version so a
// password reset (or an admin setting a new password) logs out every existing
// session. Also loads is_admin for requireAdmin, so admin rights come from the
// database row, never from anything the client sends.
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const payload = verifySessionToken(authHeader.split(" ")[1]);
    if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    try {
        const session = await loadSession(payload);
        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        req.userId = session.id;
        req.isAdmin = session.isAdmin;
        next();
    } catch (err) {
        req.log?.error({ err }, "Session lookup failed");
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = requireAuth;
