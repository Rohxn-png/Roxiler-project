
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(
            path.join(__dirname, "../certs/ca.pem")
        ),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        const [result] = await connection.query(
            "SELECT VERSION() AS version, DATABASE() AS database_name"
        );

        console.log("==================================");
        console.log("AIVEN MYSQL CONNECTED SUCCESSFULLY");
        console.log("==================================");
        console.log("MySQL Version:", result[0].version);
        console.log("Database:", result[0].database_name);

    } catch (error) {
        console.error("DATABASE CONNECTION FAILED");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

if (require.main === module) {
    testConnection();
}

module.exports = pool;
