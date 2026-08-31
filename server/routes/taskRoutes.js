const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

const subtaskRoutes = require("./subtaskRoutes");

router.use(requireAuth);

router.post("/", createTask);

router.get("/", getTasks);

router.put("/:id", updateTask);

router.delete("/:id", deleteTask);

router.use("/:taskId/subtasks", subtaskRoutes);

module.exports = router;
