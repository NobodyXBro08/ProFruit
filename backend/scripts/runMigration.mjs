import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, "..", ".env"));

const run = async () => {
  if (!process.env.MYSQLHOST) {
    console.error("Define MYSQLHOST, MYSQLUSER, MYSQLDATABASE (y opcionalmente MYSQLPORT, MYSQLPASSWORD).");
    process.exit(1);
  }
  if (!process.env.MYSQLUSER || !process.env.MYSQLDATABASE) {
    console.error("MYSQLUSER y MYSQLDATABASE son obligatorios.");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD ?? "",
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT || 3306),
    multipleStatements: true,
  });

  const sqlPath = path.join(root, "db", "migrate.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  await connection.query(sql);
  await connection.end();

  console.log("Migración ejecutada correctamente");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
