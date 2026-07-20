import { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";
import type { UserRole } from "./roles";
import { normalizeRole } from "./roles";

export type UserRow = {
  id: number;
  username: string;
  role: UserRole;
};

function isUnknownColumnError(error: unknown, column: string): boolean {
  const e = error as { code?: string; sqlMessage?: string };
  return e?.code === "ER_BAD_FIELD_ERROR" && (e.sqlMessage?.includes(column) ?? false);
}

export async function listUsers(): Promise<UserRow[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      "SELECT id, username, role FROM users ORDER BY id DESC"
    );
    return rows.map((row) => ({
      id: Number(row.id),
      username: String(row.username),
      role: normalizeRole(row.role),
    }));
  } catch (error) {
    if (!isUnknownColumnError(error, "role")) throw error;
    const rows = await query<Record<string, unknown>>("SELECT id, username FROM users ORDER BY id DESC");
    return rows.map((row) => ({
      id: Number(row.id),
      username: String(row.username),
      role: "client" as UserRole,
    }));
  }
}

export async function getUserById(id: number): Promise<UserRow | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      "SELECT id, username, role FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      username: String(row.username),
      role: normalizeRole(row.role),
    };
  } catch (error) {
    if (!isUnknownColumnError(error, "role")) throw error;
    const rows = await query<Record<string, unknown>>("SELECT id, username FROM users WHERE id = ? LIMIT 1", [
      id,
    ]);
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      username: String(row.username),
      role: "client",
    };
  }
}

export async function updateUser(input: {
  id: number;
  username: string;
  passwordHash?: string;
  role?: UserRole;
}): Promise<boolean> {
  const username = input.username.trim();

  try {
    if (input.passwordHash && input.role) {
      const [res] = await pool.execute<ResultSetHeader>(
        "UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?",
        [username, input.passwordHash, input.role, input.id]
      );
      return res.affectedRows > 0;
    }
    if (input.passwordHash) {
      const [res] = await pool.execute<ResultSetHeader>(
        "UPDATE users SET username = ?, password_hash = ? WHERE id = ?",
        [username, input.passwordHash, input.id]
      );
      return res.affectedRows > 0;
    }
    if (input.role) {
      const [res] = await pool.execute<ResultSetHeader>("UPDATE users SET username = ?, role = ? WHERE id = ?", [
        username,
        input.role,
        input.id,
      ]);
      return res.affectedRows > 0;
    }

    const [res] = await pool.execute<ResultSetHeader>("UPDATE users SET username = ? WHERE id = ?", [
      username,
      input.id,
    ]);
    return res.affectedRows > 0;
  } catch (error) {
    if (!isUnknownColumnError(error, "role")) throw error;
    if (input.passwordHash) {
      const [res] = await pool.execute<ResultSetHeader>(
        "UPDATE users SET username = ?, password_hash = ? WHERE id = ?",
        [username, input.passwordHash, input.id]
      );
      return res.affectedRows > 0;
    }
    const [res] = await pool.execute<ResultSetHeader>("UPDATE users SET username = ? WHERE id = ?", [
      username,
      input.id,
    ]);
    return res.affectedRows > 0;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
