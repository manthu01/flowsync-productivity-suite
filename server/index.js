require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const contactRoutes = require("./routes/contactRoutes");
const profileRoutes = require("./routes/profileRoutes");
const friendRoutes = require("./routes/friendRoutes");
const adminRoutes = require("./routes/adminRoutes");

require("./config/db");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("FlowSync Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
