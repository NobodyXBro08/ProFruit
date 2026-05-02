USE profruit_db;

ALTER TABLE users
  ADD COLUMN full_name VARCHAR(191) NULL AFTER password_hash,
  ADD COLUMN email VARCHAR(191) NULL AFTER full_name,
  ADD COLUMN phone VARCHAR(64) NULL AFTER email,
  ADD COLUMN shipping_address TEXT NULL AFTER phone;

CREATE UNIQUE INDEX uk_users_email ON users (email);
