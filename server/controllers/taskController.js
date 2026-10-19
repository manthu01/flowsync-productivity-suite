const db = require("../config/db");
const logger = require("../utils/logger");
const { getTaskWatchers } = require("../utils/taskAccess");
const { verifyIsFriend } = require("./friendController");
const { notifyTaskChanged } = require("../realtime");

const query = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
    });

// Per-account ceiling so one account can't fill the (free-tier) database.
const MAX_TASKS_PER_USER = 1000;

const createTask = (req, res) => {
    const {
        title,
        description,
        status,
        priority,
        category,
        mood,
        recurrence,
        due_date
    } = req.body;

    const normalizedDueDate = due_date ? due_date.slice(0, 10) : due_date;

    // The cap is checked inside the INSERT itself, so concurrent requests can't race past it.
    const insertQuery = `
        INSERT INTO tasks
        (title, description, status, priority, category, mood, recurrence, due_date, user_id)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?::date, ?::int
        WHERE (SELECT COUNT(*) FROM tasks WHERE user_id = ?) < ?
    `;

    db.query(
        insertQuery,
        [
            title, description, status, priority, category || "Other", mood, recurrence, normalizedDueDate, req.userId,
            req.userId, MAX_TASKS_PER_USER,
        ],
        (err, result) => {
            if (err) {
                logger.error({ err }, "Task creation failed");
                return res.status(500).json({ message: "Couldn't create task" });
            }

            if (result.affectedRows === 0) {
                return res.status(429).json({
                    message: `You've reached the limit of ${MAX_TASKS_PER_USER} tasks. Delete some old ones first.`,
                });
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

// Completing a repeating task queues up its next occurrence: a fresh In Progress copy
// (same owner, collaborators and subtask checklist, all unticked) due one interval
// later — counted from the old due date, or from today if that's already passed.
// The completed task then drops its recurrence so it stays put as history and
// re-completing it later can't spawn a second copy.
const spawnNextOccurrence = async (taskId) => {
    const created = await query(
        `INSERT INTO tasks (title, description, status, priority, category, mood, recurrence, due_date, user_id)
         SELECT title, description, 'In Progress', priority, category, mood, recurrence,
                (GREATEST(COALESCE(due_date, CURRENT_DATE), CURRENT_DATE) + CASE recurrence
                    WHEN 'Daily' THEN INTERVAL '1 day'
                    WHEN 'Weekly' THEN INTERVAL '7 days'
                    ELSE INTERVAL '1 month'
                END)::date,
                user_id
         FROM tasks WHERE id = ? RETURNING id`,
        [taskId]
    );
    const nextId = created.insertId;

    await query(
        `INSERT INTO subtasks (task_id, title, is_completed, position)
         SELECT ?::int, title, FALSE, position FROM subtasks WHERE task_id = ?`,
        [nextId, taskId]
    );
    await query(
        `INSERT INTO task_collaborators (task_id, user_id)
         SELECT ?::int, user_id FROM task_collaborators WHERE task_id = ?`,
        [nextId, taskId]
    );
    await query("UPDATE tasks SET recurrence = 'None' WHERE id = ?", [taskId]);
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
        mood,
        recurrence,
        due_date
    } = req.body;

    const normalizedDueDate = due_date ? due_date.slice(0, 10) : due_date;

    const accessClause =
        "id=? AND (user_id=? OR id IN (SELECT task_id FROM task_collaborators WHERE user_id=?))";

    const updateQuery = `
        UPDATE tasks
        SET title=?, description=?, status=?, priority=?, category=?, mood=?, recurrence=?, due_date=?
        WHERE ${accessClause}
    `;

    try {
        const existing = await query(`SELECT status FROM tasks WHERE ${accessClause}`, [
            id, req.userId, req.userId,
        ]);

        if (existing.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const result = await query(updateQuery, [
            title, description, status, priority, category || "Other", mood, recurrence, normalizedDueDate,
            id, req.userId, req.userId,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const justCompleted = existing[0].status !== "Completed" && status === "Completed";
        if (justCompleted && recurrence !== "None") {
            await spawnNextOccurrence(id);
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
