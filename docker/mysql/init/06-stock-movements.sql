USE profruit_db;

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
