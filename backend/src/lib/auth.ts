import bcrypt from "bcryptjs";
import { pool, query } from "./db";
import type { UserRole } from "./roles";
import { normalizeRole } from "./roles";

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
  if (!u || typeof password !== "string" || password.length === 0) {
    return { ok: false, message: "El usuario y la contraseña son obligatorios y no pueden estar vacíos." };
  }
  return { ok: true };
}

function isUnknownColumnError(error: unknown, column: string): boolean {
  const e = error as { code?: string; sqlMessage?: string };
  return e?.code === "ER_BAD_FIELD_ERROR" && (e.sqlMessage?.includes(column) ?? false);
}

export type UserAuthRow = {
  id: number;
  password_hash: string;
  role: UserRole;
};

export async function findUserByUsername(username: string): Promise<UserAuthRow | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      "SELECT id, password_hash, role FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      password_hash: String(row.password_hash),
      role: normalizeRole(row.role),
    };
  } catch (error) {
    if (!isUnknownColumnError(error, "role")) throw error;

    const rows = await query<Record<string, unknown>>(
      "SELECT id, password_hash FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      password_hash: String(row.password_hash),
      role: "client",
    };
  }
}

export async function createUser(username: string, passwordHash: string, role: UserRole = "client"): Promise<void> {
  try {
    await pool.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [
      username,
      passwordHash,
      role,
    ]);
  } catch (error) {
    if (!isUnknownColumnError(error, "role")) throw error;
    await pool.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, passwordHash]);
  }
}
