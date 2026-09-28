const db = require("../config/db");

// A task is visible/editable to its owner and anyone it's been shared with.
const hasTaskAccess = (taskId, userId) =>
    new Promise((resolve, reject) => {
        db.query(
            `SELECT 1 FROM tasks WHERE id = ? AND user_id = ?
             UNION
             SELECT 1 FROM task_collaborators WHERE task_id = ? AND user_id = ?`,
            [taskId, userId, taskId, userId],
            (err, result) => {
                if (err) return reject(err);
                resolve(result.length > 0);
            }
        );
    });

// Owner id + every collaborator's id for a task — the full set of people who should
// be notified when it changes. Empty array if the task doesn't exist.
const getTaskWatchers = (taskId) =>
    new Promise((resolve, reject) => {
        db.query(
            `SELECT user_id FROM (
                SELECT user_id FROM tasks WHERE id = ?
                UNION
                SELECT user_id FROM task_collaborators WHERE task_id = ?
             ) watchers`,
            [taskId, taskId],
            (err, result) => {
                if (err) return reject(err);
                resolve(result.map((r) => r.user_id));
            }
        );
    });

module.exports = { hasTaskAccess, getTaskWatchers };
