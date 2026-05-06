import pool from "../config/db";

export const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  return result.rows;
};

export const updateUserRole = async (id: string, role: "user" | "admin") => {
  const result = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role",
    [role, id]
  );
  if (result.rows.length === 0) throw new Error("User not found");
  return result.rows[0];
};

export const deleteOffer = async (id: string) => {
  const result = await pool.query(
    "DELETE FROM offers WHERE id = $1 RETURNING id",
    [id]
  );
  if (result.rows.length === 0) throw new Error("Offer not found");
};

export const moderateOffer = async (id: string, status: "validated" | "rejected") => {
  const result = await pool.query(
    "UPDATE offers SET status = $1 WHERE id = $2 RETURNING id, title, status",
    [status, id]
  );
  if (result.rows.length === 0) throw new Error("Offer not found");
  return result.rows[0];
};
