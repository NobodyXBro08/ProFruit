import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { pool, query } from "./db";

const SCRYPT_KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  try {
    const hashVerify = scryptSync(plain, salt, SCRYPT_KEYLEN);
    const a = Buffer.from(hash, "hex");
    const b = hashVerify;
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
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
  full_name: string | null;
  email: string | null;
  phone: string | null;
  shipping_address: string | null;
};

export async function findUserByUsername(username: string): Promise<UserAuthRow | null> {
  const rows = await query<Record<string, unknown>>(
    "SELECT id, password_hash, full_name, email, phone, shipping_address FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    password_hash: String(row.password_hash),
    full_name: row.full_name != null ? String(row.full_name) : null,
    email: row.email != null ? String(row.email) : null,
    phone: row.phone != null ? String(row.phone) : null,
    shipping_address: row.shipping_address != null ? String(row.shipping_address) : null,
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

export type NewUserProfile = {
  fullName: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
};

export async function createUser(
  username: string,
  passwordHash: string,
  profile: NewUserProfile
): Promise<void> {
  await pool.execute(
    "INSERT INTO users (username, password_hash, full_name, email, phone, shipping_address) VALUES (?, ?, ?, ?, ?, ?)",
    [
      username,
      passwordHash,
      profile.fullName,
      profile.email,
      profile.phone ?? null,
      profile.shippingAddress ?? null,
    ]
  );
}
