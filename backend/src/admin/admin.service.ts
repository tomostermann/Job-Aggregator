import pool from "../config/db";

export const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  return result.rows;
};
