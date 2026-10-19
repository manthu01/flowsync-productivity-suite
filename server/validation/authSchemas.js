const { z } = require("zod");

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

// Emails are compared case-insensitively everywhere, so they're stored lowercase.
const email = z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("A valid email is required").max(255));

// bcrypt only reads the first 72 bytes, so longer passwords would be silently
// truncated; cap it there instead.
const newPassword = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number");

const signupSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    username: z.string().regex(
        USERNAME_PATTERN,
        "Username must be 3-20 characters and can only contain letters, numbers, and underscores"
    ),
    email,
    password: newPassword,
});

// Login stays lenient on password shape so accounts created under the old,
// shorter rule can still sign in.
const loginSchema = z.object({
    identifier: z.string().trim().min(1, "Email/username and password are required").max(255),
    password: z.string().min(1, "Email/username and password are required").max(200),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, "This reset link is invalid or has expired"),
    password: newPassword,
});

module.exports = { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, newPassword, USERNAME_PATTERN };
