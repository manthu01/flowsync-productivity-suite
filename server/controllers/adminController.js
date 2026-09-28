const db = require("../config/db");
const bcrypt = require("bcryptjs");

const query = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
    });

const SIGNUP_WINDOW_DAYS = 30;

// Turns sparse "day with count" rows into a continuous 30-day series (zero-filled),
// so the chart doesn't have gaps on days with no signups. Bucketed in UTC to match
// how the DB's DATE_FORMAT groups timestamps.
const buildDailySeries = (rows) => {
    const byDay = new Map(rows.map((r) => [r.day, Number(r.count)]));
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
            query('SELECT COUNT(*) AS "totalUsers" FROM users'),
            query('SELECT COUNT(*) AS "totalTasks" FROM tasks'),
            query("SELECT COUNT(*) AS \"completedTasks\" FROM tasks WHERE status = 'Completed'"),
            query('SELECT COUNT(*) AS "totalSubtasks" FROM subtasks'),
            query('SELECT COUNT(*) AS "totalContactMessages" FROM contact_messages'),
            query("SELECT COUNT(*) AS \"totalFriendships\" FROM friend_requests WHERE status = 'accepted'"),
            query("SELECT COUNT(*) AS \"weeklyActive\" FROM users WHERE last_login_at >= NOW() - INTERVAL '7 days'"),
            query("SELECT COUNT(*) AS \"monthlyActive\" FROM users WHERE last_login_at >= NOW() - INTERVAL '30 days'"),
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day, COUNT(*) AS count
                 FROM users
                 WHERE created_at >= NOW() - make_interval(days => ?)
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
                users: Number(totalUsers),
                tasks: Number(totalTasks),
                completedTasks: Number(completedTasks),
                subtasks: Number(totalSubtasks),
                contactMessages: Number(totalContactMessages),
                friendships: Number(totalFriendships),
            },
            activeUsers: { weekly: Number(weeklyActive), monthly: Number(monthlyActive) },
            signupsByDay: buildDailySeries(signupRows),
            tasksByCategory: categoryRows.map((r) => ({ ...r, count: Number(r.count) })),
            tasksByStatus: statusRows.map((r) => ({ ...r, count: Number(r.count) })),
            tasksByPriority: priorityRows.map((r) => ({ ...r, count: Number(r.count) })),
            recentSignups,
        });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load admin stats" });
    }
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Clamps ?page and ?pageSize into safe positive integers so a bad/missing query
// string can't produce a negative OFFSET or an unbounded LIMIT.
const parsePagination = (req) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE));
    return { page, pageSize, offset: (page - 1) * pageSize };
};

// Server-side search + pagination — this list grows with total site signups
// (unlike a single user's own task list), so it needs to stay bounded at scale.
const getUsers = async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req);
    const search = (req.query.search || "").trim();

    try {
        const where = search ? "WHERE name ILIKE ? OR username ILIKE ? OR email ILIKE ?" : "";
        const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

        const [{ total }] = await query(`SELECT COUNT(*) AS total FROM users ${where}`, searchParams);

        const users = await query(
            `SELECT id, name, username, email, avatar_url, created_at, last_login_at
             FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...searchParams, pageSize, offset]
        );

        res.status(200).json({ users, total: Number(total), page, pageSize });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load users" });
    }
};

// Lets an admin set a user's password directly — never displays or requires the old
// one (that's never possible, since only its bcrypt hash exists), just overwrites it
// with a new one the admin chooses, same as any "reset password" flow would.
const setUserPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        await query(
            "INSERT INTO admin_actions (admin_id, action, target_user_id) VALUES (?, ?, ?)",
            [req.userId, "set_password", id]
        );

        res.status(200).json({ message: "Password updated" });
    } catch (error) {
        res.status(500).json({ message: "Couldn't update password" });
    }
};

const getContactMessages = async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req);
    const search = (req.query.search || "").trim();

    try {
        const where = search ? "WHERE name ILIKE ? OR email ILIKE ? OR message ILIKE ?" : "";
        const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

        const [{ total }] = await query(`SELECT COUNT(*) AS total FROM contact_messages ${where}`, searchParams);

        const messages = await query(
            `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...searchParams, pageSize, offset]
        );

        res.status(200).json({ messages, total: Number(total), page, pageSize });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load contact messages" });
    }
};

// Who did what to whom, for accountability on admin-only mutations (currently just
// password resets, but new admin actions should log here too as they're added).
const getAuditLog = async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req);

    try {
        const [{ total }] = await query("SELECT COUNT(*) AS total FROM admin_actions");

        const entries = await query(
            `SELECT aa.id, aa.action, aa.details, aa.created_at,
                    admin.name AS admin_name, admin.email AS admin_email,
                    target.name AS target_name, target.email AS target_email
             FROM admin_actions aa
             JOIN users admin ON admin.id = aa.admin_id
             LEFT JOIN users target ON target.id = aa.target_user_id
             ORDER BY aa.created_at DESC
             LIMIT ? OFFSET ?`,
            [pageSize, offset]
        );

        res.status(200).json({ entries, total: Number(total), page, pageSize });
    } catch (error) {
        res.status(500).json({ message: "Couldn't load audit log" });
    }
};

module.exports = { getStats, getUsers, setUserPassword, getContactMessages, getAuditLog };
