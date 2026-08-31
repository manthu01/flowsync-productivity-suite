const db = require("../config/db");

const submitContactMessage = (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are all required" });
    }

    const query = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";

    db.query(query, [name.trim(), email.trim(), message.trim()], (err) => {
        if (err) {
            return res.status(500).json({ message: "Couldn't send your message, try again" });
        }

        res.status(201).json({ message: "Message sent! We'll get back to you soon." });
    });
};

module.exports = { submitContactMessage };
