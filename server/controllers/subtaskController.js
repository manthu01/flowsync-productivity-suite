const db = require("../config/db");

// Confirms the parent task belongs to the requesting user before touching subtasks
const verifyTaskOwnership = (taskId, userId) =>
    new Promise((resolve, reject) => {
        db.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId], (err, result) => {
            if (err) return reject(err);
            resolve(result.length > 0);
        });
    });

const getSubtasks = async (req, res) => {
    const { taskId } = req.params;

    try {
        const owned = await verifyTaskOwnership(taskId, req.userId);
        if (!owned) return res.status(404).json({ message: "Task not found" });

        db.query(
            "SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC, id ASC",
            [taskId],
            (err, result) => {
                if (err) return res.status(500).json({ message: "Couldn't load subtasks" });
                res.status(200).json(result);
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Couldn't load subtasks" });
    }
};

const createSubtask = async (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ message: "Subtask title is required" });
    }

    try {
        const owned = await verifyTaskOwnership(taskId, req.userId);
        if (!owned) return res.status(404).json({ message: "Task not found" });

        db.query(
            "SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM subtasks WHERE task_id = ?",
            [taskId],
            (posErr, posResult) => {
                if (posErr) return res.status(500).json({ message: "Couldn't create subtask" });

                const position = posResult[0].nextPosition;

                db.query(
                    "INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)",
                    [taskId, title.trim(), position],
                    (err, result) => {
                        if (err) return res.status(500).json({ message: "Couldn't create subtask" });

                        res.status(201).json({
                            id: result.insertId,
                            task_id: Number(taskId),
                            title: title.trim(),
                            is_completed: false,
                            position,
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Couldn't create subtask" });
    }
};

const updateSubtask = async (req, res) => {
    const { taskId, id } = req.params;
    const { title, is_completed } = req.body;

    try {
        const owned = await verifyTaskOwnership(taskId, req.userId);
        if (!owned) return res.status(404).json({ message: "Task not found" });

        const fields = [];
        const values = [];

        if (title !== undefined) {
            fields.push("title = ?");
            values.push(title.trim());
        }
        if (is_completed !== undefined) {
            fields.push("is_completed = ?");
            values.push(!!is_completed);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "Nothing to update" });
        }

        values.push(id, taskId);

        db.query(
            `UPDATE subtasks SET ${fields.join(", ")} WHERE id = ? AND task_id = ?`,
            values,
            (err) => {
                if (err) return res.status(500).json({ message: "Couldn't update subtask" });
                res.status(200).json({ message: "Subtask updated" });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Couldn't update subtask" });
    }
};

const deleteSubtask = async (req, res) => {
    const { taskId, id } = req.params;

    try {
        const owned = await verifyTaskOwnership(taskId, req.userId);
        if (!owned) return res.status(404).json({ message: "Task not found" });

        db.query("DELETE FROM subtasks WHERE id = ? AND task_id = ?", [id, taskId], (err) => {
            if (err) return res.status(500).json({ message: "Couldn't delete subtask" });
            res.status(200).json({ message: "Subtask deleted" });
        });
    } catch (error) {
        res.status(500).json({ message: "Couldn't delete subtask" });
    }
};

module.exports = { getSubtasks, createSubtask, updateSubtask, deleteSubtask };
