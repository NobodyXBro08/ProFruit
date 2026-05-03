import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql, { type PoolConnection } from "mysql2/promise";

console.log("MYSQLHOST:", process.env.MYSQLHOST);
console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE);

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

    console.log("TABLA PRODUCTS OK (migrate.sql aplicado: users, products, orders, order_items, payments + seed)");

    try {
      await pool.query(
        `INSERT INTO products (name, description, price, stock, stock_reserved, weight, image) VALUES
         ('Producto prueba', 'Fila de depuración', 1000, 1, 0, '100 g', 'https://via.placeholder.com/150')`
      );
      console.log("INSERT prueba OK (fila extra; si falla por duplicado lógico, revisar error arriba)");
    } catch (insertErr) {
      console.error("INSERT prueba (debug):", insertErr);
    }
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
