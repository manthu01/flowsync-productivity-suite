const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const { getStats, getUsers, setUserPassword, getContactMessages } = require("../controllers/adminController");

const router = express.Router();

router.get("/stats", requireAuth, requireAdmin, getStats);
router.get("/users", requireAuth, requireAdmin, getUsers);
router.put("/users/:id/password", requireAuth, requireAdmin, setUserPassword);
router.get("/contact-messages", requireAuth, requireAdmin, getContactMessages);

module.exports = router;
