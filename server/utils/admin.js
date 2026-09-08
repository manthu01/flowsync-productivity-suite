// Admin access is allowlist-based via an env var rather than a DB column, so it can
// be granted or revoked by editing Render's env vars without touching the database.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

module.exports = { isAdminEmail };
