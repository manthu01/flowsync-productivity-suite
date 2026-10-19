// Must run after requireAuth, which loads is_admin from the user's database row.
// Admin rights are a column, not an email match: signup doesn't verify email
// ownership, so an email allowlist could be claimed by anyone who registers first.
const requireAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
    }
    next();
};

module.exports = requireAdmin;
