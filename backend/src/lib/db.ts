import mysql, { type PoolConnection, type Pool } from "mysql2/promise";

let poolInstance: Pool | undefined;

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está definido");
  }
  if (!poolInstance) {
    poolInstance = mysql.createPool(url);
  }
  return poolInstance;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool();
    const v = (p as unknown as Record<string | symbol, unknown>)[prop as string];
    if (typeof v === "function") {
      return (v as (...args: unknown[]) => unknown).bind(p);
    }
    return v;
  },
});

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (e) {
    console.error("db.query:", e);
    throw e;
  }
}

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    console.error("db.withTransaction:", e);
    throw e;
  } finally {
    conn.release();
  }
}
