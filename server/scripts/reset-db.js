// Wipes every row from every table (users, tasks, subtasks, contact_messages,
// friend_requests, starred_friends) but keeps the schema intact. For use while
// manually testing the app before a final build — run it, then sign up fresh
// and click through the app again.
//
// Usage:  npm run reset-db   (from server/)
//
// Targets whatever DATABASE_URL is active (server/.env), so it hits local or
// production depending on which .env is loaded — the target is always printed
// before anything runs so you can see which one.
require("dotenv").config();
const db = require("../config/db");

const TABLES = ["starred_friends", "friend_requests", "subtasks", "contact_messages", "tasks", "users"];

const run = (sql) =>
    new Promise((resolve, reject) => {
        db.query(sql, (err, result) => (err ? reject(err) : resolve(result)));
    });

(async () => {
    const target = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@") || "(no DATABASE_URL set)";
    console.log(`Target DB: ${target}`);
    console.log("Wiping all data in 3 seconds... (Ctrl+C to cancel)");
    await new Promise((r) => setTimeout(r, 3000));

    try {
        // A single TRUNCATE ... CASCADE handles every FK dependency atomically,
        // regardless of table order — no need for MySQL's FOREIGN_KEY_CHECKS pragma.
        // RESTART IDENTITY also resets the SERIAL id counters back to 1.
        await run(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
        console.log(`  cleared: ${TABLES.join(", ")}`);
        console.log("Done. All tables empty, schema untouched.");
    } catch (err) {
        console.error("FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        process.exit();
    }
})();
