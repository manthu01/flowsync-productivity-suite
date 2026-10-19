const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { generateToken, hashToken } = require("../utils/tokens");
const { signSessionToken } = require("../utils/session");
const { sendResetEmail } = require("../utils/email");
const logger = require("../utils/logger");

const RESET_TTL_MS = 60 * 60 * 1000; // 1h

const genericAuthEmailResponse = {
    message: "If that email is registered, we've sent you an email with further instructions.",
};

// One message for "no such user" and "wrong password" so login can't be used to
// find out which emails/usernames have accounts.
const INVALID_LOGIN = { message: "Invalid email/username or password" };

// Compared against when the user doesn't exist, so a miss takes as long as a real
// bcrypt check and response timing doesn't give the answer away either.
const DUMMY_HASH = bcrypt.hashSync("flowsync-timing-equalizer", 10);

const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
    theme: user.theme ?? "dark",
    is_admin: !!user.is_admin,
});

// No email verification step: accounts are active immediately on signup, and the
// response logs the user straight in (same shape as login) so there's no extra
// step between "create account" and "using the app". Input is already validated
// (and the email lowercased) by signupSchema.
const signup = async (req, res) => {
    const { name, username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (name, username, email, password, is_verified)
            VALUES (?, ?, ?, ?, TRUE)
            RETURNING id
        `;

        db.query(query, [name, username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === "23505") {
                    const field = err.constraint?.includes("username") ? "Username" : "Email";
                    return res.status(409).json({ message: `${field} already in use` });
                }
                return res.status(500).json({ message: "Signup failed" });
            }

            const user = { id: result.insertId, name, username, email, token_version: 0, is_admin: false };

            res.status(201).json({
                message: "Account created",
                token: signSessionToken(user),
                user: publicUser(user),
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Signup failed" });
    }
};

const login = (req, res) => {
    const { identifier, password } = req.body;

    // Emails are stored lowercase; usernames keep their case.
    const query = "SELECT * FROM users WHERE email = ? OR username = ?";

    db.query(query, [identifier.toLowerCase(), identifier], async (err, result) => {
        if (err) {
            logger.error({ err }, "Login failed");
            return res.status(500).json({ message: "Login failed" });
        }

        const user = result[0];
        const validPassword = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

        if (!user || !validPassword) {
            return res.status(401).json(INVALID_LOGIN);
        }

        // Fire-and-forget: powers the admin dashboard's active-user counts, not worth
        // delaying the login response for.
        db.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id], () => {});

        res.status(200).json({
            message: "Login successful",
            token: signSessionToken(user),
            user: publicUser(user),
        });
    });
};

const forgotPassword = (req, res) => {
    const { email } = req.body;

    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) {
            return res.status(500).json(genericAuthEmailResponse);
        }

        if (result.length > 0) {
            const resetToken = generateToken();
            const resetExpires = new Date(Date.now() + RESET_TTL_MS);

            db.query(
                "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
                [hashToken(resetToken), resetExpires, result[0].id],
                async (updateErr) => {
                    if (!updateErr) {
                        try {
                            await sendResetEmail(email, resetToken);
                        } catch (emailError) {
                            logger.error({ err: emailError }, "Failed to send reset email");
                        }
                    }
                }
            );
        }

        res.status(200).json(genericAuthEmailResponse);
    });
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    const query = "SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()";

    db.query(query, [hashToken(token)], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Reset failed" });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: "This reset link is invalid or has expired" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Bumping token_version signs out every existing session, so whoever might
        // have had access before the reset loses it.
        db.query(
            `UPDATE users
             SET password = ?, reset_token = NULL, reset_expires = NULL, token_version = token_version + 1
             WHERE id = ?`,
            [hashedPassword, result[0].id],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: "Reset failed" });
                }
                res.status(200).json({ message: "Password reset. You can now log in." });
            }
        );
    });
};

module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword,
};
