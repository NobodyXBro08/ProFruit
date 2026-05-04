import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql, { type PoolConnection, type Pool } from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../../db/migrate.sql");

let poolInstance: Pool | undefined;

function getPool(): Pool {
  console.log("MYSQLHOST:", process.env.MYSQLHOST);
  if (!process.env.MYSQLHOST) {
    throw new Error("MYSQLHOST no está definido");
  }
  if (!poolInstance) {
    poolInstance = mysql.createPool({
      host: process.env.MYSQLHOST,
      port: Number(process.env.MYSQLPORT),
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true,
    });
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

async function ensureTables() {
  if (!process.env.MYSQLHOST || !process.env.MYSQLDATABASE) {
    console.log("ensureTables omitido: falta MYSQLHOST o MYSQLDATABASE");
    return;
  }
  if (process.env.SKIP_DB_AUTO_MIGRATE === "1") {
    console.log("ensureTables omitido: SKIP_DB_AUTO_MIGRATE=1");
    return;
  }
  try {
    console.log("INICIANDO CREACIÓN DE TABLAS (migrate.sql)...");

    if (!fs.existsSync(sqlPath)) {
      console.error("No existe migrate.sql en:", sqlPath);
      return;
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    await pool.query(sql);

    console.log("migrate.sql ejecutado correctamente");
  } catch (error) {
    console.error("ERROR EN ensureTables:", error);
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
