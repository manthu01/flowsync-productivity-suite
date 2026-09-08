const db = require("../config/db");

const query = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
    });

const SIGNUP_WINDOW_DAYS = 30;

// Turns sparse "day with count" rows into a continuous 30-day series (zero-filled),
// so the chart doesn't have gaps on days with no signups. Bucketed in UTC to match
// how the DB's DATE_FORMAT groups timestamps.
const buildDailySeries = (rows) => {
    const byDay = new Map(rows.map((r) => [r.day, r.count]));
    const today = new Date();
    const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    const series = [];
    for (let i = SIGNUP_WINDOW_DAYS - 1; i >= 0; i--) {
        const key = new Date(utcToday - i * 86400000).toISOString().slice(0, 10);
        series.push({ date: key, count: byDay.get(key) || 0 });
    }
    return series;
};

const getStats = async (req, res) => {
    try {
        const [
            [{ totalUsers }],
            [{ totalTasks }],
            [{ completedTasks }],
            [{ totalSubtasks }],
            [{ totalContactMessages }],
            [{ totalFriendships }],
            [{ weeklyActive }],
            [{ monthlyActive }],
            signupRows,
            categoryRows,
            statusRows,
            priorityRows,
            recentSignups,
        ] = await Promise.all([
            query("SELECT COUNT(*) AS totalUsers FROM users"),
            query("SELECT COUNT(*) AS totalTasks FROM tasks"),
            query("SELECT COUNT(*) AS completedTasks FROM tasks WHERE status = 'Completed'"),
            query("SELECT COUNT(*) AS totalSubtasks FROM subtasks"),
            query("SELECT COUNT(*) AS totalContactMessages FROM contact_messages"),
            query("SELECT COUNT(*) AS totalFriendships FROM friend_requests WHERE status = 'accepted'"),
            query("SELECT COUNT(*) AS weeklyActive FROM users WHERE last_login_at >= NOW() - INTERVAL 7 DAY"),
            query("SELECT COUNT(*) AS monthlyActive FROM users WHERE last_login_at >= NOW() - INTERVAL 30 DAY"),
            query(
                `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count
                 FROM users
                 WHERE created_at >= NOW() - INTERVAL ? DAY
                 GROUP BY day`,
                [SIGNUP_WINDOW_DAYS]
            ),
            query("SELECT category, COUNT(*) AS count FROM tasks GROUP BY category"),
            query("SELECT status, COUNT(*) AS count FROM tasks GROUP BY status"),
            query("SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority"),
            query(
                "SELECT id, name, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10"
            ),
        ]);

        res.status(200).json({
            totals: {
                users: totalUsers,
                tasks: totalTasks,
                completedTasks,
                subtasks: totalSubtasks,
                contactMessages: totalContactMessages,
                friendships: totalFriendships,
            },
            activeUsers: { weekly: weeklyActive, monthly: monthlyActive },
            signupsByDay: buildDailySeries(signupRows),
            tasksByCategory: categoryRows,
            tasksByStatus: statusRows,
            tasksByPriority: priorityRows,
            recentSignups,
        });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load admin stats" });
    }
};

module.exports = { getStats };
