import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import pool from "../config/db";
import { signToken } from "../utils/jwt";
import { RegisterDto, LoginDto } from "./auth.dto";

export const register = async (dto: RegisterDto) => {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [dto.email]);
  if (existing.rows.length > 0) throw new Error("Email already used");

  const hashed = await bcrypt.hash(dto.password, 10);
  const id = randomUUID();

  await pool.query(
    "INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
    [id, dto.email, hashed, "user"]
  );

  const token = signToken({ id, role: "user" });
  return { token };
};

export const login = async (dto: LoginDto) => {
  const result = await pool.query("SELECT id, password_hash, role FROM users WHERE email = $1", [dto.email]);
  if (result.rows.length === 0) throw new Error("Invalid credentials");

  const user = result.rows[0];
  const valid = await bcrypt.compare(dto.password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  const token = signToken({ id: user.id, role: user.role });
  return { token };
};
