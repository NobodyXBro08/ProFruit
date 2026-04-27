import mysql from "mysql2/promise";

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

