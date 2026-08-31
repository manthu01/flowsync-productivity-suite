require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const contactRoutes = require("./routes/contactRoutes");

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

app.get("/", (req, res) => {
    res.send("FlowSync Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
