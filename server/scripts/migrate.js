// Idempotent schema migration for Postgres. Safe to run repeatedly against any
// environment (local, or production via the same DATABASE_URL used by config/db.js).
// Postgres supports "IF NOT EXISTS" / "ADD COLUMN IF NOT EXISTS" directly, so unlike
// the old MySQL version this doesn't need to catch specific "already exists" error
// codes -- each statement below is naturally safe to re-run.
require("dotenv").config();
const db = require("../config/db");

const run = (sql, label) =>
    new Promise((resolve) => {
        db.query(sql, (err) => {
            if (err) {
                console.error(`FAILED: ${label} -> ${err.message}`);
            } else {
                console.log(`ok: ${label}`);
            }
            resolve();
        });
    });

(async () => {
    await run(
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            is_verified BOOLEAN NOT NULL DEFAULT FALSE,
            verification_token VARCHAR(255),
            verification_expires TIMESTAMP,
            reset_token VARCHAR(255),
            reset_expires TIMESTAMP,
            avatar_url VARCHAR(500),
            theme VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
            username_changed_at TIMESTAMP,
            last_login_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create users table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'In Progress',
            priority VARCHAR(50) DEFAULT 'Medium',
            category VARCHAR(50) DEFAULT 'Other',
            due_date DATE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create tasks table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS subtasks (
            id SERIAL PRIMARY KEY,
            task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            position INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create subtasks table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create contact_messages table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS friend_requests (
            id SERIAL PRIMARY KEY,
            sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            responded_at TIMESTAMP NULL,
            UNIQUE (sender_id, receiver_id)
        )`,
        "create friend_requests table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS starred_friends (
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            friend_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, friend_id)
        )`,
        "create starred_friends table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS task_collaborators (
            task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (task_id, user_id)
        )`,
        "create task_collaborators table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS admin_actions (
            id SERIAL PRIMARY KEY,
            admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action VARCHAR(50) NOT NULL,
            target_user_id INT REFERENCES users(id) ON DELETE SET NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create admin_actions table"
    );

    console.log("Migration complete.");
    process.exit(0);
})();
