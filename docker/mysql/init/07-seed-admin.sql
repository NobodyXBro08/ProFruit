USE profruit_db;

-- Usuario inicial: admin / Admin123!
-- Cambia la contraseña tras el primer acceso en entornos reales.
INSERT INTO users (username, password_hash, role, full_name)
SELECT 'admin', '$2b$10$iWwS0or9rytAexFeLSKFQOlPzdZ2gi7gibMoPF3t0ZPuVfyZrIkb.', 'super_admin', 'Administrador ProFruit'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
