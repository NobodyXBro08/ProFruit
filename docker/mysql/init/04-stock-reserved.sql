USE profruit_db;

ALTER TABLE products
  ADD COLUMN stock_reserved INT NOT NULL DEFAULT 0 AFTER stock;
