const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const caCertPath = path.join(__dirname, "..", "certs", "aiven-ca.pem");
const sslConfig =
    process.env.DB_SSL === "true"
        ? {
              rejectUnauthorized: true,
              ca: fs.existsSync(caCertPath) ? fs.readFileSync(caCertPath) : undefined,
          }
        : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("Connected to MySQL database");
        connection.release();
    }
});

module.exports = pool;
