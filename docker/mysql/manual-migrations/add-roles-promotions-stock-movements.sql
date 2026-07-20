-- Para bases existentes (volumen ya inicializado). Ejecutar a mano una vez.
USE profruit_db;

-- users.role
SET @col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT ''client'' AFTER shipping_address, ADD KEY idx_users_role (role)',
  'SELECT ''users.role already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS promotions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  name VARCHAR(191) NULL,
  discount_percent DECIMAL(5, 2) NULL,
  promo_price DECIMAL(10, 2) NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_promotions_product_id (product_id),
  KEY idx_promotions_active_window (active, starts_at, ends_at),
  CONSTRAINT fk_promotions_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  movement_type VARCHAR(32) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  stock_before INT NOT NULL,
  stock_after INT NOT NULL,
  note VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_movements_product_id (product_id),
  KEY idx_stock_movements_created_at (created_at),
  CONSTRAINT fk_stock_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_stock_movements_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password_hash, role, full_name)
SELECT 'admin', '$2b$10$iWwS0or9rytAexFeLSKFQOlPzdZ2gi7gibMoPF3t0ZPuVfyZrIkb.', 'super_admin', 'Administrador ProFruit'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
