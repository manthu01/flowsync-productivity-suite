// Idempotent schema migration. Safe to run repeatedly against any environment
// (local, or production via the same DB_* env vars used by config/db.js).
require("dotenv").config();
const db = require("../config/db");

const run = (sql, label) =>
    new Promise((resolve) => {
        db.query(sql, (err) => {
            if (err) {
                if (["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME"].includes(err.code)) {
                    console.log(`skip (already applied): ${label}`);
                } else {
                    console.error(`FAILED: ${label} -> ${err.message}`);
                }
            } else {
                console.log(`ok: ${label}`);
            }
            resolve();
        });
    });

(async () => {
    await run(
        "ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL",
        "add users.username"
    );

    await run(
        "UPDATE users SET username = CONCAT(SUBSTRING_INDEX(email, '@', 1), '_', id) WHERE username IS NULL",
        "backfill username for existing users"
    );

    await run(
        "ALTER TABLE users MODIFY username VARCHAR(50) NOT NULL",
        "enforce users.username NOT NULL"
    );

    await run(
        "ALTER TABLE users ADD UNIQUE INDEX idx_username (username)",
        "add unique index on users.username"
    );

    await run(
        "ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "add users.is_verified"
    );

    await run(
        "ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL",
        "add users.verification_token"
    );

    await run(
        "ALTER TABLE users ADD COLUMN verification_expires DATETIME NULL",
        "add users.verification_expires"
    );

    await run(
        "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL",
        "add users.reset_token"
    );

    await run(
        "ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL",
        "add users.reset_expires"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS subtasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            position INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )`,
        "create subtasks table"
    );

    await run(
        `CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        "create contact_messages table"
    );

    // Grandfather in accounts that predate email verification: a real signup always
    // sets verification_token at creation time, so is_verified=FALSE with no token
    // can only mean this account existed before the verification feature shipped.
    // Safe to re-run: a genuinely unverified new signup always still has its token set.
    await run(
        "UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE AND verification_token IS NULL",
        "grandfather pre-verification accounts as verified"
    );

    console.log("Migration complete.");
    process.exit(0);
})();
