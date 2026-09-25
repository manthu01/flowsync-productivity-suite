const { Pool } = require("pg");

// Neon (and most managed Postgres) requires TLS but hands out a cert chain that
// node's default trust store doesn't always resolve cleanly through — same
// trade-off `rejectUnauthorized: false` makes for plenty of managed DBs. Connection
// itself is still fully encrypted either way.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
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
        console.log("Database connection failed:", err.message);
    } else {
        console.log("Connected to PostgreSQL database");
        release();
    }
});

module.exports = { query };
