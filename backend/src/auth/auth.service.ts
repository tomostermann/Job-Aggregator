import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import pool from "../config/db";
import { signToken } from "../utils/jwt";
import { RegisterDto, LoginDto } from "./auth.dto";

const ADMIN_BOOTSTRAP_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const isBootstrapAdmin = (email: string) =>
  ADMIN_BOOTSTRAP_EMAILS.includes(email.toLowerCase());

const cleanName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 100) throw new Error("Le nom est trop long (max 100 caractères)");
  return trimmed;
};

export const register = async (dto: RegisterDto) => {
  if (!dto.email || !dto.password) throw new Error("Email and password required");
  if (dto.password.length < 8) throw new Error("Password must be at least 8 characters");

  const firstName = cleanName(dto.firstName);
  const lastName = cleanName(dto.lastName);
  if (!firstName) throw new Error("Le prénom est requis");
  if (!lastName) throw new Error("Le nom est requis");

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [dto.email]);
  if (existing.rows.length > 0) throw new Error("Email already used");

  const hashed = await bcrypt.hash(dto.password, 10);
  const id = randomUUID();
  const role = isBootstrapAdmin(dto.email) ? "admin" : "user";

  await pool.query(
    "INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, dto.email, hashed, role, firstName, lastName],
  );

  const token = signToken({
    id,
    role,
    email: dto.email,
    firstName,
    lastName,
  });
  return { token };
};

export const updateProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string; signature?: string },
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(data.firstName || null); }
  if (data.lastName !== undefined)  { fields.push(`last_name = $${idx++}`);  values.push(data.lastName || null); }
  if (data.phone !== undefined)     { fields.push(`phone = $${idx++}`);      values.push(data.phone || null); }
  if (data.signature !== undefined) { fields.push(`signature = $${idx++}`);  values.push(data.signature || null); }

  if (fields.length === 0) return { message: "Rien à modifier" };

  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, values);

  const result = await pool.query(
    "SELECT id, email, role, first_name, last_name, phone, signature FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0];
};

export const setUserCv = async (
  userId: string,
  filename: string,
  mimetype: string,
  data: Buffer,
) => {
  await pool.query(
    `INSERT INTO user_cvs (user_id, filename, mimetype, data, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET filename = $2, mimetype = $3, data = $4, updated_at = NOW()`,
    [userId, filename, mimetype, data],
  );
  return { filename, mimetype, size: data.length };
};

export const deleteUserCv = async (userId: string) => {
  await pool.query("DELETE FROM user_cvs WHERE user_id = $1", [userId]);
  return { message: "CV supprimé" };
};

export const getUserCv = async (userId: string) => {
  const result = await pool.query(
    "SELECT filename, mimetype, data FROM user_cvs WHERE user_id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    filename: row.filename as string,
    mimetype: row.mimetype as string,
    data: row.data as Buffer,
  };
};

export const login = async (dto: LoginDto) => {
  const result = await pool.query(
    "SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1",
    [dto.email],
  );
  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  const valid = await bcrypt.compare(dto.password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  let role = user.role;
  if (isBootstrapAdmin(user.email) && role !== "admin") {
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
    role = "admin";
  }

  const token = signToken({
    id: user.id,
    role,
    email: user.email,
    firstName: user.first_name ?? undefined,
    lastName: user.last_name ?? undefined,
  });
  return { token };
};