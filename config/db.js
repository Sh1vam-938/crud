// ================================================================
// config/db.js — MySQL Database Connection Pool
// ================================================================
// What is this file?
//   This file creates a "connection pool" to MySQL.
//   All other parts of the app import this pool and use it
//   to run SQL queries. We only configure the connection ONCE here.
//
// Why a separate file?
//   Instead of writing connection code in every file that needs
//   the database, we do it once here and export the pool.
//   This is the DRY principle: Don't Repeat Yourself.
//
// Why a POOL and not a single connection?
//   A single connection handles ONE query at a time.
//   If 100 users make requests simultaneously, they'd queue up.
//   A pool keeps multiple connections ready (default: 10).
//   Requests are served instantly from available connections.
//   Think of it like checkout lanes at a supermarket:
//     1 connection = 1 checkout lane (everyone waits)
//     pool of 10   = 10 lanes open (people served simultaneously)
// ================================================================

// Import the mysql2 package — specifically the "promise" version.
// The regular mysql2 uses callbacks (older style).
// mysql2/promise uses async/await (modern, cleaner style).
// We want async/await because it reads like normal code.
const mysql = require("mysql2/promise");

// Load .env values into process.env (just in case this file
// is ever imported before dotenv has run)
require("dotenv").config();

// ----------------------------------------------------------------
// Create a Connection Pool
// mysql.createPool() sets up the pool but does NOT connect yet.
// It connects lazily — the first time you run a query.
// ----------------------------------------------------------------
const pool = mysql.createPool({
  // Where is the database? "localhost" = same machine
  host: process.env.DB_HOST || "localhost",

  // Which MySQL user to authenticate as
  user: process.env.DB_USER || "root",

  // The MySQL password (read from .env — never hardcoded!)
  password: process.env.DB_PASSWORD || "",

  // Which database to use (we created this in Stage 3)
  database: process.env.DB_NAME || "task_manager_db",

  // The port MySQL listens on (default is 3306)
  port: process.env.DB_PORT || 3306,

  // waitForConnections: if all connections are busy, should new
  // requests wait? YES (true) — they'll wait until one is free.
  waitForConnections: true,

  // connectionLimit: max number of simultaneous connections.
  // 10 is a good default for development.
  // In production, tune this based on your server capacity.
  connectionLimit: 10,

  // queueLimit: max number of requests waiting for a connection.
  // 0 = unlimited queue (requests will wait as long as needed)
  queueLimit: 0,

  // timezone: store timestamps in UTC (universal time).
  // Always use UTC in databases to avoid timezone headaches.
  timezone: "+00:00",
});

// ----------------------------------------------------------------
// Test the connection when this file is first loaded.
// pool.getConnection() borrows a connection from the pool.
// We immediately release it — we just want to verify it works.
// ----------------------------------------------------------------
const testConnection = async () => {
  try {
    // Try to get a connection from the pool
    const connection = await pool.getConnection();
    console.log("✅ MySQL connected successfully!");

    // IMPORTANT: Release the connection back to the pool
    // If you forget this, the pool "leaks" — connections
    // are never returned and eventually the pool runs out.
    connection.release();
  } catch (error) {
    // If connection fails, log the error and exit.
    // The app cannot run without a database connection.
    console.error("❌ MySQL connection failed:", error.message);
    console.error(
      "   Check your .env file — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    );
    process.exit(1); // Exit with error code 1 (signals failure)
  }
};

// Run the test immediately when this file loads
testConnection();

// ----------------------------------------------------------------
// Export the pool so other files can use it.
// Usage in another file:
//   const pool = require("../config/db");
//   const [rows] = await pool.query("SELECT * FROM tasks");
// ----------------------------------------------------------------
module.exports = pool;
