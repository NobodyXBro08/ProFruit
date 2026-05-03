const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

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

const host = process.env.MYSQLHOST || process.env.DB_HOST;
const user = process.env.MYSQLUSER || process.env.DB_USER;
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "";
const database = process.env.MYSQLDATABASE || process.env.DB_NAME;
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

const run = async () => {
  if (!host || !user || !database) {
    console.error(
      "Faltan variables de conexión. Define MYSQLHOST, MYSQLUSER, MYSQLDATABASE (Railway) o DB_HOST, DB_USER, DB_NAME (local) en backend/.env o .env.local"
    );
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
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
