import pool from "./db";
import fs from "fs";
import path from "path";

const initDb = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
    await pool.query(schema);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
};

export default initDb;
