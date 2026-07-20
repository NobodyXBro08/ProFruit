-- Solo en la primera creación del volumen (docker-entrypoint-initdb.d).
-- Debe coincidir con MYSQL_DATABASE del compose (por defecto profruit_db).

USE profruit_db;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(191) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(64) NULL,
  shipping_address TEXT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'client',
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_reserved INT NOT NULL DEFAULT 0,
  weight VARCHAR(64) NULL,
  image VARCHAR(512) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
