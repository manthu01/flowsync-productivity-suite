const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/tokens");
const { sendVerificationEmail, sendResetEmail } = require("../utils/email");
const { isAdminEmail } = require("../utils/admin");

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

const genericAuthEmailResponse = {
    message: "If that email is registered, we've sent you an email with further instructions.",
};

const signup = async (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (!USERNAME_PATTERN.test(username)) {
        return res.status(400).json({
            message: "Username must be 3-20 characters and can only contain letters, numbers, and underscores",
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateToken();
        const verificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);

        const query = `
            INSERT INTO users
            (name, username, email, password, is_verified, verification_token, verification_expires)
            VALUES (?, ?, ?, ?, FALSE, ?, ?)
        `;

        db.query(
            query,
            [name, username, email, hashedPassword, verificationToken, verificationExpires],
            async (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        const field = err.sqlMessage?.includes("username") ? "Username" : "Email";
                        return res.status(409).json({ message: `${field} already in use` });
                    }
                    return res.status(500).json({ message: "Signup failed" });
                }

                try {
                    await sendVerificationEmail(email, verificationToken);
                } catch (emailError) {
                    console.error("Failed to send verification email:", emailError.message);
                }

                res.status(201).json({
                    message: "Account created. Check your email to verify your account before logging in.",
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Signup failed" });
    }
};

const login = (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: "Email/username and password are required" });
    }

    const query = "SELECT * FROM users WHERE email = ? OR username = ?";

    db.query(query, [identifier, identifier], async (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = result[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in",
                unverified: true,
                email: user.email,
            });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Fire-and-forget: powers the admin dashboard's active-user counts, not worth
        // delaying the login response for.
        db.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id], () => {});

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                theme: user.theme,
                is_admin: isAdminEmail(user.email),
            },
        });
    });
};

const verifyEmail = (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
    }

    const query = "SELECT id FROM users WHERE verification_token = ? AND verification_expires > NOW()";

    db.query(query, [token], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Verification failed" });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: "This verification link is invalid or has expired" });
        }

        const userId = result[0].id;

        db.query(
            "UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = ?",
            [userId],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: "Verification failed" });
                }
                res.status(200).json({ message: "Email verified! You can now log in." });
            }
        );
    });
};

const resendVerification = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    db.query(
        "SELECT id, is_verified FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                return res.status(500).json(genericAuthEmailResponse);
            }

            if (result.length > 0 && !result[0].is_verified) {
                const verificationToken = generateToken();
                const verificationExpires = new Date(Date.now() + VERIFICATION_TTL_MS);

                db.query(
                    "UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?",
                    [verificationToken, verificationExpires, result[0].id],
                    async (updateErr) => {
                        if (!updateErr) {
                            try {
                                await sendVerificationEmail(email, verificationToken);
                            } catch (emailError) {
                                console.error("Failed to resend verification email:", emailError.message);
                            }
                        }
                    }
                );
            }

            res.status(200).json(genericAuthEmailResponse);
        }
    );
};

const forgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) {
            return res.status(500).json(genericAuthEmailResponse);
        }

        if (result.length > 0) {
            const resetToken = generateToken();
            const resetExpires = new Date(Date.now() + RESET_TTL_MS);

            db.query(
                "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
                [resetToken, resetExpires, result[0].id],
                async (updateErr) => {
                    if (!updateErr) {
                        try {
                            await sendResetEmail(email, resetToken);
                        } catch (emailError) {
                            console.error("Failed to send reset email:", emailError.message);
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

    if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const query = "SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()";

    db.query(query, [token], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Reset failed" });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: "This reset link is invalid or has expired" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
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
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
};
