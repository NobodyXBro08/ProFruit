import { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";

export type UserRow = {
  id: number;
  username: string;
};

export async function listUsers(): Promise<UserRow[]> {
  return query<UserRow>("SELECT id, username FROM users ORDER BY id DESC");
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const rows = await query<UserRow>("SELECT id, username FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] ?? null;
}

export async function updateUser(input: {
  id: number;
  username: string;
  passwordHash?: string;
}): Promise<boolean> {
  const username = input.username.trim();
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

export async function deleteUser(id: number): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
  return res.affectedRows > 0;
}
