const { Pool, types } = require("pg");
const logger = require("../utils/logger");

// Keep DATE columns (OID 1082) as plain "YYYY-MM-DD" strings. pg's default turns
// them into a Date at local midnight on the server, which JSON then serialises as
// UTC — on a server east of UTC that shifts every due date back a day.
types.setTypeParser(1082, (value) => value);

// Neon requires TLS. Its certificate chains to a public CA in node's default trust
// store, so verify it: an encrypted connection to an unverified server would still
// let a man-in-the-middle read the traffic.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: true } : false,
});

// Converts MySQL-style "?" positional placeholders to Postgres's "$1, $2, ..." so
// every existing call site across the controllers — all written as
// db.query(sql, params, callback) — keeps working unchanged.
const toPgPlaceholders = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
};

// Mimics mysql2's callback-style pool.query(), including its result shapes: a
// SELECT resolves to a plain array of rows (matching mysql2), and an
// INSERT/UPDATE/DELETE resolves to { affectedRows, insertId } (insertId is only
// populated when the query includes a `RETURNING id` clause, which callers add
// wherever they actually need the new row's id).
const query = (sql, paramsOrCallback, maybeCallback) => {
    let params = [];
    let callback = maybeCallback;

    if (typeof paramsOrCallback === "function") {
        callback = paramsOrCallback;
    } else if (paramsOrCallback) {
        params = paramsOrCallback;
    }

    pool.query(toPgPlaceholders(sql), params, (err, result) => {
        if (err) return callback(err);

        if (result.command === "SELECT") {
            return callback(null, result.rows);
        }

        callback(null, {
            affectedRows: result.rowCount,
            insertId: result.rows[0]?.id,
        });
    });
};

pool.connect((err, client, release) => {
    if (err) {
        logger.error({ err }, "Database connection failed");
    } else {
        logger.info("Connected to PostgreSQL database");
        release();
    }
});

module.exports = { query };
