import bcrypt from "bcryptjs";
import { pool, query } from "./db";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, stored);
  } catch (e) {
    console.error("verifyPassword:", e);
    return false;
  }
}

export function validateCredentials(
  username: unknown,
  password: unknown
): { ok: true } | { ok: false; message: string } {
  const u = typeof username === "string" ? username.trim() : "";
  const p = typeof password === "string" ? password.trim() : "";
  if (!u || !p) {
    return { ok: false, message: "El usuario y la contraseña son obligatorios y no pueden estar vacíos." };
  }
  return { ok: true };
}

export type UserAuthRow = {
  id: number;
  password_hash: string;
  email: string | null;
};

export async function findUserByUsername(username: string): Promise<UserAuthRow | null> {
  const rows = await query<Record<string, unknown>>(
    "SELECT id, password_hash, email FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    password_hash: String(row.password_hash),
    email: row.email != null ? String(row.email) : null,
  };
}

export async function findUserByEmail(email: string): Promise<{ id: number } | null> {
  const norm = email.trim().toLowerCase();
  const rows = await query<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1",
    [norm]
  );
  return rows[0] ?? null;
}

export async function createUser(username: string, passwordHash: string, email: string): Promise<void> {
  await pool.execute("INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)", [
    username,
    passwordHash,
    email,
  ]);
}
