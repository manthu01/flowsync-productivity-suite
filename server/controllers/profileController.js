const db = require("../config/db");
const { uploadAvatar, isConfigured } = require("../utils/cloudinary");

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const USERNAME_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const PUBLIC_FIELDS = "id, name, username, email, avatar_url, theme, username_changed_at";

const getProfile = (req, res) => {
    db.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Couldn't load profile" });
        if (result.length === 0) return res.status(404).json({ message: "User not found" });
        res.status(200).json(result[0]);
    });
};

const updateName = (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }

    db.query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), req.userId], (err) => {
        if (err) return res.status(500).json({ message: "Couldn't update name" });
        res.status(200).json({ message: "Name updated", name: name.trim() });
    });
};

const updateUsername = (req, res) => {
    const { username } = req.body;

    if (!USERNAME_PATTERN.test(username || "")) {
        return res.status(400).json({
            message: "Username must be 3-20 characters and can only contain letters, numbers, and underscores",
        });
    }

    db.query(
        "SELECT username, username_changed_at FROM users WHERE id = ?",
        [req.userId],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Couldn't update username" });
            if (result.length === 0) return res.status(404).json({ message: "User not found" });

            const current = result[0];

            if (username === current.username) {
                return res.status(400).json({ message: "That's already your username" });
            }

            if (current.username_changed_at) {
                const nextAllowed = new Date(current.username_changed_at.getTime() + USERNAME_COOLDOWN_MS);
                if (nextAllowed > new Date()) {
                    return res.status(429).json({
                        message: "You can only change your username once every 90 days",
                        nextAllowedAt: nextAllowed.toISOString(),
                    });
                }
            }

            db.query(
                "UPDATE users SET username = ?, username_changed_at = NOW() WHERE id = ?",
                [username, req.userId],
                (updateErr) => {
                    if (updateErr) {
                        if (updateErr.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({ message: "That username is already taken" });
                        }
                        return res.status(500).json({ message: "Couldn't update username" });
                    }
                    res.status(200).json({ message: "Username updated", username });
                }
            );
        }
    );
};

const updateTheme = (req, res) => {
    const { theme } = req.body;

    if (theme !== "light" && theme !== "dark") {
        return res.status(400).json({ message: "Theme must be 'light' or 'dark'" });
    }

    db.query("UPDATE users SET theme = ? WHERE id = ?", [theme, req.userId], (err) => {
        if (err) return res.status(500).json({ message: "Couldn't update theme" });
        res.status(200).json({ message: "Theme updated", theme });
    });
};

const uploadAvatarHandler = async (req, res) => {
    if (!isConfigured()) {
        return res.status(503).json({ message: "Avatar upload isn't set up yet" });
    }

    if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
    }

    try {
        const url = await uploadAvatar(req.file.buffer, req.userId);

        db.query("UPDATE users SET avatar_url = ? WHERE id = ?", [url, req.userId], (err) => {
            if (err) return res.status(500).json({ message: "Couldn't save avatar" });
            res.status(200).json({ message: "Avatar updated", avatar_url: url });
        });
    } catch (error) {
        res.status(500).json({ message: "Couldn't upload avatar" });
    }
};

module.exports = { getProfile, updateName, updateUsername, updateTheme, uploadAvatarHandler };
