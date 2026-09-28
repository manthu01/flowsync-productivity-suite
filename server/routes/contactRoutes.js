const express = require("express");

const router = express.Router();

const { submitContactMessage } = require("../controllers/contactController");
const validate = require("../middleware/validate");
const { contactMessageSchema } = require("../validation/contactSchemas");
const { strictLimiter } = require("../middleware/rateLimit");

router.post("/", strictLimiter, validate(contactMessageSchema), submitContactMessage);

module.exports = router;
