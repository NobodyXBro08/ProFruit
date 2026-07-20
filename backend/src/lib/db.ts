import mysql, { type PoolConnection, type Pool, type PoolOptions } from "mysql2/promise";

let poolInstance: Pool | undefined;

function normalizePem(value: string): string {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function readMysqlCaCert(): string | undefined {
  const b64 = process.env.MYSQL_SSL_CA_B64?.trim();
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf8");
  }

  const raw = process.env.MYSQL_SSL_CA?.trim();
  if (!raw) return undefined;
  return normalizePem(raw);
}

function shouldUseMysqlSsl(host: string): boolean {
  const flag = process.env.MYSQL_SSL?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;

  const mode = process.env.MYSQL_SSL_MODE?.trim().toUpperCase();
  if (mode === "REQUIRED" || mode === "VERIFY_CA") return true;

  if (readMysqlCaCert()) return true;

  // Aiven y otros proveedores gestionados suelen exigir TLS.
  return host.includes("aivencloud.com");
}

function resolveMysqlSsl(host: string): PoolOptions["ssl"] {
  if (!shouldUseMysqlSsl(host)) return undefined;

  const ca = readMysqlCaCert();
  if (!ca) {
    throw new Error(
      "Conexión SSL requerida para MySQL. Añade MYSQL_SSL_CA (certificado CA de Aiven) o MYSQL_SSL_CA_B64 en las variables de entorno."
    );
  }

  return {
    ca,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  };
}

function createPoolFromMysqlEnv(): Pool {
  const host = process.env.MYSQLHOST;
  const user = process.env.MYSQLUSER;
  const database = process.env.MYSQLDATABASE;
  if (!host || !user || !database) {
    throw new Error("MYSQLHOST, MYSQLUSER y MYSQLDATABASE son obligatorios.");
  }

  const port = Number(process.env.MYSQLPORT ?? 3306);
  if (!Number.isFinite(port) || port < 1) {
    throw new Error("MYSQLPORT debe ser un número de puerto válido.");
  }

  const ssl = resolveMysqlSsl(host);

  return mysql.createPool({
    host,
    port,
    user,
    password: process.env.MYSQLPASSWORD ?? "",
    database,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = createPoolFromMysqlEnv();
    const sslOn = shouldUseMysqlSsl(process.env.MYSQLHOST ?? "");
    console.log(
      `MySQL pool inicializado (${process.env.MYSQLHOST}/${process.env.MYSQLDATABASE}, SSL: ${sslOn ? "on" : "off"}).`
    );
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
