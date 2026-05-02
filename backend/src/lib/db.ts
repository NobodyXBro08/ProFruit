import mysql, { type PoolConnection } from "mysql2/promise";

/** Pool de conexiones MySQL reutilizado por productos, usuarios y autenticación. */
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "profruit_db",
  connectionLimit: 10,
});

/**
 * Consultas SELECT u operaciones cuyo resultado se trata como filas (compatibilidad con código existente).
 */
export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/**
 * Ejecuta un bloque dentro de una transacción (commit al terminar bien, rollback si falla).
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

