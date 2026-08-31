// Wipes every row from every table (users, tasks, subtasks, contact_messages,
// friend_requests, starred_friends) but keeps the schema intact. For use while
// manually testing the app before a final build — run it, then sign up fresh
// and click through the app again.
//
// Usage:  npm run reset-db   (from server/)
//
// Targets whatever DB_* env vars are active (server/.env), so it hits
// local or production Aiven depending on which .env is loaded — the host
// is always printed before anything runs so you can see which one.
require("dotenv").config();
const db = require("../config/db");

const TABLES = ["starred_friends", "friend_requests", "subtasks", "contact_messages", "tasks", "users"];

const run = (sql) =>
    new Promise((resolve, reject) => {
        db.query(sql, (err, result) => (err ? reject(err) : resolve(result)));
    });

(async () => {
    console.log(`Target DB: ${process.env.DB_HOST} / ${process.env.DB_NAME}`);
    console.log("Wiping all data in 3 seconds... (Ctrl+C to cancel)");
    await new Promise((r) => setTimeout(r, 3000));

    try {
        await run("SET FOREIGN_KEY_CHECKS = 0");
        for (const table of TABLES) {
            await run(`TRUNCATE TABLE ${table}`);
            console.log(`  cleared: ${table}`);
        }
        await run("SET FOREIGN_KEY_CHECKS = 1");
        console.log("Done. All tables empty, schema untouched.");
    } catch (err) {
        console.error("FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        process.exit();
    }
})();
