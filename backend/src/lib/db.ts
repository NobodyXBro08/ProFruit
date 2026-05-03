import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql, { type PoolConnection } from "mysql2/promise";

console.log("MYSQL HOST:", process.env.MYSQLHOST);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../../db/migrate.sql");

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD ?? "",
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

async function ensureTables() {
  if (!process.env.MYSQLHOST || !process.env.MYSQLDATABASE) {
    return;
  }
  if (process.env.SKIP_DB_AUTO_MIGRATE === "1") {
    return;
  }
  try {
    console.log("Creando tablas si no existen...");

    if (!fs.existsSync(sqlPath)) {
      console.error("No existe migrate.sql en:", sqlPath);
      return;
    }

    const sql = fs.readFileSync(sqlPath, "utf8");

    await pool.query(sql);

    console.log("Tablas creadas y datos insertados correctamente");
  } catch (error) {
    console.error("Error creando tablas:", error);
  }
}

void ensureTables();

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
