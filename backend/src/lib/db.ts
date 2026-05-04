import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql, { type PoolConnection, type Pool, type PoolOptions } from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../../db/migrate.sql");

let poolInstance: Pool | undefined;

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definido");
  }
  if (!poolInstance) {
    console.log("Conectando a MySQL vía proxy");
    const opts: PoolOptions = {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10_000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      multipleStatements: true,
    };
    poolInstance = mysql.createPool(opts);
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

async function runMigrateSqlStatements() {
  const raw = fs.readFileSync(sqlPath, "utf8");
  const sql = raw
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
  const chunks = sql
    .split(/;\s*\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const chunk of chunks) {
    await pool.query(`${chunk};`);
  }
}

async function ensureTables() {
  if (!process.env.DATABASE_URL) {
    console.log("ensureTables omitido: falta DATABASE_URL");
    return;
  }
  if (process.env.SKIP_DB_AUTO_MIGRATE === "1") {
    console.log("ensureTables omitido: SKIP_DB_AUTO_MIGRATE=1");
    return;
  }
  try {
    if (!fs.existsSync(sqlPath)) {
      console.error("No existe migrate.sql en:", sqlPath);
      return;
    }
    await runMigrateSqlStatements();
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
