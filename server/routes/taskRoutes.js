const express = require("express");

const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { taskSchema, shareTaskSchema } = require("../validation/taskSchemas");

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    getCollaborators,
    shareTask,
    unshareTask,
} = require("../controllers/taskController");

const subtaskRoutes = require("./subtaskRoutes");

router.use(requireAuth);

router.post("/", validate(taskSchema), createTask);

router.get("/", getTasks);

router.put("/:id", validate(taskSchema), updateTask);

router.delete("/:id", deleteTask);

router.get("/:id/collaborators", getCollaborators);
router.post("/:id/share", validate(shareTaskSchema), shareTask);
router.delete("/:id/share/:userId", unshareTask);

router.use("/:taskId/subtasks", subtaskRoutes);

module.exports = router;
