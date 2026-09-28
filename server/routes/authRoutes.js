const express = require("express");

const router = express.Router();

const { signup, login, forgotPassword, resetPassword } = require("../controllers/authController");
const validate = require("../middleware/validate");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimit");
const {
    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("../validation/authSchemas");

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
