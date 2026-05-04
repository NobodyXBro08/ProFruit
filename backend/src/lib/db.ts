import mysql, { type PoolConnection, type Pool } from "mysql2/promise";

let poolInstance: Pool | undefined;

function createPoolFromMysqlEnv(): Pool {
  const host = process.env.MYSQLHOST;
  const user = process.env.MYSQLUSER;
  const database = process.env.MYSQLDATABASE;
  if (!host || !user || !database) {
    throw new Error(
      "MYSQLHOST, MYSQLUSER y MYSQLDATABASE son obligatorios (red interna Railway / Docker)."
    );
  }

  return mysql.createPool({
    host,
    port: Number(process.env.MYSQLPORT || 3306),
    user,
    password: process.env.MYSQLPASSWORD ?? "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = createPoolFromMysqlEnv();
    console.log("MySQL conectado usando red interna Railway");
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
