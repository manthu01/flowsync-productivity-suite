const db = require("../config/db");

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

    const query = `
        INSERT INTO tasks
        (title, description, status, priority, category, due_date, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [title, description, status, priority, category || "Other", normalizedDueDate, req.userId],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.status(201).json({
                message: "Task created successfully"
            });
        }
    );
};

const getTasks = (req, res) => {
    const query = "SELECT * FROM tasks WHERE user_id = ?";

    db.query(query, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.status(200).json(result);
    });
};

const updateTask = (req, res) => {
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

    const query = `
        UPDATE tasks
        SET title=?, description=?, status=?, priority=?, category=?, due_date=?
        WHERE id=? AND user_id=?
    `;

    db.query(
        query,
        [title, description, status, priority, category || "Other", normalizedDueDate, id, req.userId],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.status(200).json({
                message: "Task updated successfully"
            });
        }
    );
};

const deleteTask = (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM tasks WHERE id=? AND user_id=?";

    db.query(query, [id, req.userId], (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        res.status(200).json({
            message: "Task deleted successfully"
        });
    });
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
