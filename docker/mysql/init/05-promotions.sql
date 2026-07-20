USE profruit_db;

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
