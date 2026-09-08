const db = require("../config/db");
const { isAdminEmail } = require("../utils/admin");

// Must run after requireAuth, which sets req.userId from the JWT.
const requireAdmin = (req, res, next) => {
    db.query("SELECT email FROM users WHERE id = ?", [req.userId], (err, result) => {
        if (err || result.length === 0 || !isAdminEmail(result[0].email)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        next();
    });
};

module.exports = requireAdmin;
