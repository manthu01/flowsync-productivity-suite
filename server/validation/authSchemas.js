const { z } = require("zod");

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

const signupSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    username: z.string().regex(
        USERNAME_PATTERN,
        "Username must be 3-20 characters and can only contain letters, numbers, and underscores"
    ),
    email: z.email("A valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    identifier: z.string().trim().min(1, "Email/username and password are required"),
    password: z.string().min(1, "Email/username and password are required"),
});

const forgotPasswordSchema = z.object({
    email: z.email("A valid email is required"),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token and new password are required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
