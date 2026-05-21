import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import pool from "../config/db";
import { signToken, JwtPayload } from "../utils/jwt";
import { RegisterDto, LoginDto } from "./auth.dto";
import { ENV } from "../config/env";

/** Récupère le profil complet d'un utilisateur et construit le payload JWT. */
export const getUserWithProfile = async (userId: string): Promise<JwtPayload | null> => {
  const userRes = await pool.query(
    "SELECT id, email, role, first_name, last_name, phone, signature FROM users WHERE id = $1",
    [userId],
  );
  if (userRes.rows.length === 0) return null;
  const u = userRes.rows[0];

  const cvRes = await pool.query(
    "SELECT filename FROM user_cvs WHERE user_id = $1",
    [userId],
  );
  const hasCv = cvRes.rows.length > 0;
  const cvFilename: string | undefined = hasCv ? cvRes.rows[0].filename : undefined;

  return {
    id: u.id,
    role: u.role,
    email: u.email ?? undefined,
    firstName: u.first_name ?? undefined,
    lastName: u.last_name ?? undefined,
    phone: u.phone ?? undefined,
    signature: u.signature ?? undefined,
    hasCv,
    cvFilename,
  };
};

export const register = async (dto: RegisterDto) => {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [dto.email]);
  if (existing.rows.length > 0) throw new Error("Email already used");

  const hashed = await bcrypt.hash(dto.password, 10);
  const id = randomUUID();

  // Si l'email est dans ADMIN_EMAILS, le compte est créé directement en admin
  const isAdmin = ENV.ADMIN_EMAILS.includes(dto.email.toLowerCase());
  const role = isAdmin ? "admin" : "user";

  await pool.query(
    "INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, dto.email, hashed, role, dto.firstName ?? null, dto.lastName ?? null]
  );

  const payload = await getUserWithProfile(id);
  const token = signToken(payload ?? { id, role, email: dto.email });
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
  const result = await pool.query("SELECT id, password_hash, role FROM users WHERE email = $1", [dto.email]);
  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  const valid = await bcrypt.compare(dto.password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const payload = await getUserWithProfile(user.id);
  const token = signToken(payload ?? { id: user.id, role: user.role });
  return { token };
};
