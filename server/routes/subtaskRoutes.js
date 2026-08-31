const express = require("express");

// mergeParams lets this router read :taskId from the parent router it's mounted under
const router = express.Router({ mergeParams: true });

const {
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
} = require("../controllers/subtaskController");

router.get("/", getSubtasks);
router.post("/", createSubtask);
router.put("/:id", updateSubtask);
router.delete("/:id", deleteSubtask);

module.exports = router;
