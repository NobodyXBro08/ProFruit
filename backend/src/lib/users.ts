import { ResultSetHeader } from "mysql2";
import { pool, query } from "./db";
import type { UserRole } from "./roles";
import { normalizeRole } from "./roles";

export type UserRow = {
  id: number;
  username: string;
  role: UserRole;
};

export type UserProfile = {
  id: number;
  username: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
};

function parseStoredShipping(raw: unknown): { city: string | null; address: string | null } {
  if (typeof raw !== "string" || !raw.trim()) return { city: null, address: null };
  try {
    const o = JSON.parse(raw) as { city?: string; address?: string };
    return {
      city: typeof o.city === "string" && o.city.trim() ? o.city.trim() : null,
      address: typeof o.address === "string" && o.address.trim() ? o.address.trim() : null,
    };
  } catch {
    return { city: null, address: raw.trim() };
  }
}

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

export async function getUserProfile(id: number): Promise<UserProfile | null> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT id, username, role, full_name, phone, shipping_address
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;
    const shipping = parseStoredShipping(row.shipping_address);
    return {
      id: Number(row.id),
      username: String(row.username),
      role: normalizeRole(row.role),
      fullName: row.full_name != null && String(row.full_name).trim() ? String(row.full_name).trim() : null,
      phone: row.phone != null && String(row.phone).trim() ? String(row.phone).trim() : null,
      city: shipping.city,
      address: shipping.address,
    };
  } catch (error) {
    if (isUnknownColumnError(error, "full_name") || isUnknownColumnError(error, "phone")) {
      const basic = await getUserById(id);
      if (!basic) return null;
      return { ...basic, fullName: null, phone: null, city: null, address: null };
    }
    if (isUnknownColumnError(error, "role")) {
      const rows = await query<Record<string, unknown>>(
        `SELECT id, username, full_name, phone, shipping_address FROM users WHERE id = ? LIMIT 1`,
        [id]
      );
      const row = rows[0];
      if (!row) return null;
      const shipping = parseStoredShipping(row.shipping_address);
      return {
        id: Number(row.id),
        username: String(row.username),
        role: "client",
        fullName: row.full_name != null && String(row.full_name).trim() ? String(row.full_name).trim() : null,
        phone: row.phone != null && String(row.phone).trim() ? String(row.phone).trim() : null,
        city: shipping.city,
        address: shipping.address,
      };
    }
    throw error;
  }
}

export async function updateUserProfile(
  id: number,
  input: { fullName?: string | null; phone?: string | null; city?: string | null; address?: string | null }
): Promise<UserProfile | null> {
  const fullName =
    input.fullName === undefined
      ? undefined
      : input.fullName == null || !String(input.fullName).trim()
        ? null
        : String(input.fullName).trim().slice(0, 191);
  const phone =
    input.phone === undefined
      ? undefined
      : input.phone == null || !String(input.phone).trim()
        ? null
        : String(input.phone).trim().slice(0, 64);

  let shippingJson: string | null | undefined;
  if (input.city !== undefined || input.address !== undefined) {
    const current = await getUserProfile(id);
    if (!current) return null;
    const city =
      input.city !== undefined
        ? input.city == null || !String(input.city).trim()
          ? null
          : String(input.city).trim().slice(0, 120)
        : current.city;
    const address =
      input.address !== undefined
        ? input.address == null || !String(input.address).trim()
          ? null
          : String(input.address).trim().slice(0, 500)
        : current.address;
    shippingJson =
      city || address
        ? JSON.stringify({ city: city ?? "", address: address ?? "" })
        : null;
  }

  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (fullName !== undefined) {
    sets.push("full_name = ?");
    params.push(fullName);
  }
  if (phone !== undefined) {
    sets.push("phone = ?");
    params.push(phone);
  }
  if (shippingJson !== undefined) {
    sets.push("shipping_address = ?");
    params.push(shippingJson);
  }
  if (sets.length === 0) return getUserProfile(id);

  params.push(id);
  try {
    const [res] = await pool.execute<ResultSetHeader>(
      `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
      params
    );
    if (res.affectedRows < 1) return null;
    return getUserProfile(id);
  } catch (error) {
    if (
      isUnknownColumnError(error, "full_name") ||
      isUnknownColumnError(error, "phone") ||
      isUnknownColumnError(error, "shipping_address")
    ) {
      throw new Error("El perfil de usuario no está disponible en esta base de datos.");
    }
    throw error;
  }
}
