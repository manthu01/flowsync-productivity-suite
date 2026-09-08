const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const { getStats } = require("../controllers/adminController");

const router = express.Router();

router.get("/stats", requireAuth, requireAdmin, getStats);

module.exports = router;
