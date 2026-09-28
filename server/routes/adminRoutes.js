const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const validate = require("../middleware/validate");
const { setPasswordSchema } = require("../validation/adminSchemas");
const {
    getStats,
    getUsers,
    setUserPassword,
    getContactMessages,
    getAuditLog,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/stats", requireAuth, requireAdmin, getStats);
router.get("/users", requireAuth, requireAdmin, getUsers);
router.put("/users/:id/password", requireAuth, requireAdmin, validate(setPasswordSchema), setUserPassword);
router.get("/contact-messages", requireAuth, requireAdmin, getContactMessages);
router.get("/audit-log", requireAuth, requireAdmin, getAuditLog);

module.exports = router;
