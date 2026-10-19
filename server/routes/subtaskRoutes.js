const express = require("express");

// mergeParams lets this router read :taskId from the parent router it's mounted under
const router = express.Router({ mergeParams: true });

const validate = require("../middleware/validate");
const { numericIdParam } = require("../middleware/idParams");
const { createSubtaskSchema, updateSubtaskSchema } = require("../validation/miscSchemas");

const {
    getSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
} = require("../controllers/subtaskController");

router.param("id", numericIdParam);

router.get("/", getSubtasks);
router.post("/", validate(createSubtaskSchema), createSubtask);
router.put("/:id", validate(updateSubtaskSchema), updateSubtask);
router.delete("/:id", deleteSubtask);

module.exports = router;
