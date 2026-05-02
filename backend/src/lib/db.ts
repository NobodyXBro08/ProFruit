import mysql, { type PoolConnection } from "mysql2/promise";

/**
 * Compatibilidad: variables `DB_*` (local/Docker) y nombres típicos de Railway / MySQL plugin.
 */
function dbConfig() {
  const host =
    process.env.DB_HOST ?? process.env.MYSQLHOST ?? process.env.MYSQL_HOST ?? "localhost";
  const port = Number(process.env.DB_PORT ?? process.env.MYSQLPORT ?? process.env.MYSQL_PORT ?? "3306");
  const user =
    process.env.DB_USER ?? process.env.MYSQLUSER ?? process.env.MYSQL_USER ?? "root";
  const password =
    process.env.DB_PASSWORD ??
    process.env.MYSQLPASSWORD ??
    process.env.MYSQL_ROOT_PASSWORD ??
    "";
  const database =
    process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? process.env.MYSQL_DATABASE ?? "profruit_db";

  return { host, port, user, password, database };
}

const cfg = dbConfig();

/** Pool de conexiones MySQL reutilizado por productos, usuarios y autenticación. */
export const pool = mysql.createPool({
  ...cfg,
  connectionLimit: 10,
  connectTimeout: 15_000,
  waitForConnections: true,
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

