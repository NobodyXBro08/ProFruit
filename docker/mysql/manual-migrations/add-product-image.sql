USE profruit_db;

ALTER TABLE products
  ADD COLUMN image VARCHAR(512) NULL AFTER weight;
