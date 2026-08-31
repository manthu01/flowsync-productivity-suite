const db = require("../config/db");
const { sendContactNotification } = require("../utils/email");

const submitContactMessage = (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are all required" });
    }

    const trimmed = { name: name.trim(), email: email.trim(), message: message.trim() };
    const query = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";

    db.query(query, [trimmed.name, trimmed.email, trimmed.message], async (err) => {
        if (err) {
            return res.status(500).json({ message: "Couldn't send your message, try again" });
        }

        try {
            await sendContactNotification(trimmed);
        } catch (emailError) {
            console.error("Failed to send contact notification email:", emailError.message);
        }

        res.status(201).json({ message: "Message sent! We'll get back to you soon." });
    });
};

module.exports = { submitContactMessage };
