import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { pool, query } from "./db";

/** Longitud de clave derivada para almacenamiento seguro (sin guardar contraseña en texto plano). */
const SCRYPT_KEYLEN = 64;

/**
 * Genera hash con sal aleatoria (formato almacenado: "saltHex:hashHex").
 * Configuración de seguridad para el registro de usuarios.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica contraseña contra el hash almacenado (comparación en tiempo constante).
 * Usado en el servicio de inicio de sesión.
 */
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

/** Validación: usuario y contraseña no vacíos (tras trim). */
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

/** Comprueba si ya existe un usuario con ese nombre (evita duplicados en registro). */
export async function findUserByUsername(username: string): Promise<{ id: number; password_hash: string } | null> {
  const rows = await query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, password_hash: String(row.password_hash) };
}

/** Registro: inserta usuario con contraseña hasheada. */
export async function createUser(username: string, passwordHash: string): Promise<void> {
  await pool.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, passwordHash]);
}
