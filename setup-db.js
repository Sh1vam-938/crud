// setup-db.js — Automatic database initializer
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function setup() {
  console.log("⏳ Connecting to MySQL server...");
  
  // Connect to MySQL server without database specified
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  try {
    const dbName = process.env.DB_NAME || "task_manager_db";
    console.log(`🔨 Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log("📄 Reading and applying schema.sql...");
    const schemaPath = path.join(__dirname, "database", "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");

    await connection.query(sql);

    console.log("\n✅ Database and tables created successfully!");
    console.log("🚀 You can now register/login from the frontend!\n");
  } catch (err) {
    console.error("\n❌ Setup error:", err.message);
  } finally {
    await connection.end();
  }
}

setup();
