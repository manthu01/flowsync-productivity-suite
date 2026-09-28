const db = require("../config/db");
const logger = require("../utils/logger");
const { getTaskWatchers } = require("../utils/taskAccess");
const { verifyIsFriend } = require("./friendController");
const { notifyTaskChanged } = require("../realtime");

const query = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
    });

const createTask = (req, res) => {
    const {
        title,
        description,
        status,
        priority,
        category,
        due_date
    } = req.body;

    const normalizedDueDate = due_date ? due_date.slice(0, 10) : due_date;

    const insertQuery = `
        INSERT INTO tasks
        (title, description, status, priority, category, due_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        insertQuery,
        [title, description, status, priority, category || "Other", normalizedDueDate, req.userId],
        (err, result) => {
            if (err) {
                logger.error({ err }, "Task creation failed");
                return res.status(500).json({ message: "Couldn't create task" });
            }

            notifyTaskChanged([req.userId]);
            res.status(201).json({
                message: "Task created successfully"
            });
        }
    );
};

// Returns tasks the caller owns AND tasks shared with them as a collaborator, tagged
// with is_owner so the UI can tell the two apart (only owners can delete/share/unshare).
const getTasks = (req, res) => {
    const getQuery = `
        SELECT
            t.*,
            COUNT(DISTINCT s.id) AS subtask_count,
            SUM(CASE WHEN s.is_completed THEN 1 ELSE 0 END) AS subtask_completed_count,
            (t.user_id = ?) AS is_owner,
            owner.name AS owner_name,
            (SELECT COUNT(*) FROM task_collaborators tc2 WHERE tc2.task_id = t.id) AS collaborator_count
        FROM tasks t
        JOIN users owner ON owner.id = t.user_id
        LEFT JOIN subtasks s ON s.task_id = t.id
        WHERE t.user_id = ? OR t.id IN (SELECT task_id FROM task_collaborators WHERE user_id = ?)
        GROUP BY t.id, owner.name
        ORDER BY t.created_at DESC
    `;

    db.query(getQuery, [req.userId, req.userId, req.userId], (err, result) => {
        if (err) {
            logger.error({ err }, "Loading tasks failed");
            return res.status(500).json({ message: "Couldn't load tasks" });
        }

        const tasks = result.map((task) => ({
            ...task,
            subtask_count: Number(task.subtask_count),
            subtask_completed_count: Number(task.subtask_completed_count),
            collaborator_count: Number(task.collaborator_count),
        }));

        res.status(200).json(tasks);
    });
};

// Owner and collaborators can both edit a shared task's details — same "shared doc"
// model as the rest of the app's collaboration story. Only the owner can delete it
// or manage who has access (see deleteTask/shareTask/unshareTask below).
const updateTask = async (req, res) => {
    const { id } = req.params;

    const {
        title,
        description,
        status,
        priority,
        category,
        due_date
    } = req.body;

    const normalizedDueDate = due_date ? due_date.slice(0, 10) : due_date;

    const updateQuery = `
        UPDATE tasks
        SET title=?, description=?, status=?, priority=?, category=?, due_date=?
        WHERE id=? AND (user_id=? OR id IN (SELECT task_id FROM task_collaborators WHERE user_id=?))
    `;

    try {
        const result = await query(updateQuery, [
            title, description, status, priority, category || "Other", normalizedDueDate,
            id, req.userId, req.userId,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const watchers = await getTaskWatchers(id);
        notifyTaskChanged(watchers);
        res.status(200).json({ message: "Task updated successfully" });
    } catch (err) {
        logger.error({ err }, "Task update failed");
        res.status(500).json({ message: "Couldn't update task" });
    }
};

const deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        const watchers = await getTaskWatchers(id);
        const result = await query("DELETE FROM tasks WHERE id=? AND user_id=?", [id, req.userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        notifyTaskChanged(watchers);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (err) {
        logger.error({ err }, "Task deletion failed");
        res.status(500).json({ message: "Couldn't delete task" });
    }
};

const getCollaborators = async (req, res) => {
    const { id } = req.params;

    try {
        const owned = await query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [id, req.userId]);
        if (owned.length === 0) return res.status(404).json({ message: "Task not found" });

        const collaborators = await query(
            `SELECT u.id, u.name, u.username, u.avatar_url
             FROM task_collaborators tc JOIN users u ON u.id = tc.user_id
             WHERE tc.task_id = ? ORDER BY tc.added_at ASC`,
            [id]
        );
        res.status(200).json(collaborators);
    } catch (err) {
        logger.error({ err }, "Loading collaborators failed");
        res.status(500).json({ message: "Couldn't load collaborators" });
    }
};

// Only the task's owner can share it, and only with an accepted friend — reuses the
// same friendship check the friends module already relies on.
const shareTask = async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        const owned = await query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [id, req.userId]);
        if (owned.length === 0) return res.status(404).json({ message: "Task not found" });

        const targets = await query("SELECT id, name, username, avatar_url FROM users WHERE username = ?", [
            username.trim(),
        ]);
        if (targets.length === 0) return res.status(404).json({ message: "No user with that username" });

        const target = targets[0];
        if (target.id === req.userId) {
            return res.status(400).json({ message: "You can't share a task with yourself" });
        }

        const isFriend = await verifyIsFriend(req.userId, target.id);
        if (!isFriend) {
            return res.status(400).json({ message: "You can only share tasks with your friends" });
        }

        await query(
            "INSERT INTO task_collaborators (task_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            [id, target.id]
        );

        const watchers = await getTaskWatchers(id);
        notifyTaskChanged(watchers);
        res.status(200).json({ message: `Shared with ${target.username}`, collaborator: target });
    } catch (err) {
        logger.error({ err }, "Sharing task failed");
        res.status(500).json({ message: "Couldn't share task" });
    }
};

const unshareTask = async (req, res) => {
    const { id, userId: targetUserId } = req.params;

    try {
        const owned = await query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [id, req.userId]);
        if (owned.length === 0) return res.status(404).json({ message: "Task not found" });

        const watchersBefore = await getTaskWatchers(id);

        await query("DELETE FROM task_collaborators WHERE task_id = ? AND user_id = ?", [id, targetUserId]);

        notifyTaskChanged(watchersBefore);
        res.status(200).json({ message: "Access removed" });
    } catch (err) {
        logger.error({ err }, "Unsharing task failed");
        res.status(500).json({ message: "Couldn't remove access" });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    getCollaborators,
    shareTask,
    unshareTask,
};
