# ProFruit

E-commerce / vitrina de frutos deshidratados: **SPA React** (`frontend/`) + **API Next.js** (`backend/`) + **MySQL**.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Create React App, **React Router** v7, Context API |
| Backend | Next.js 14 (App Router), TypeScript, `mysql2`, **bcryptjs**, tokens HMAC (`JWT_SECRET`) |
| Base de datos | MySQL 8 |
| Deploy | **Netlify** (FE), **Render** (API), **Aiven** (MySQL) |

## Estructura

| Ruta | Contenido |
|------|-----------|
| `frontend/` | SPA (tienda + panel admin) |
| `backend/` | API REST (`/api/*`) |
| `docker/mysql/init/` | SQL de arranque (esquema + seed) |
| `docker/mysql/manual-migrations/` | Parches para volúmenes ya creados |
| `.env.example` | Plantilla de variables |

## Arranque rápido (Docker)

1. Copia `.env.example` → `.env` y define al menos `JWT_SECRET`.
2. `npm run up` → MySQL + API + web.
3. Abre http://localhost:8080 (web) y http://localhost:3000 (API).

Usuario seed: **`admin` / `Admin123!`** (cámbialo en producción).

Si el volumen MySQL ya existía **antes** de estas migraciones, ejecuta a mano:

`docker/mysql/manual-migrations/add-roles-promotions-stock-movements.sql`

## Desarrollo local (sin Docker web)

```bash
npm run install
# backend/.env.local: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, JWT_SECRET
# frontend/.env.development ya apunta a http://localhost:3000
npm run dev
```

- API: http://localhost:3000  
- Frontend: http://localhost:3001  

## Variables importantes

| Variable | Dónde | Uso |
|----------|--------|-----|
| `DB_*` / `MYSQL*` | raíz `.env` / `backend/.env.local` | Conexión MySQL |
| `JWT_SECRET` | Compose + backend | Firmar tokens de sesión |
| `CORS_ORIGINS` | backend | Lista de orígenes FE (coma). En local hay defaults. |
| `REACT_APP_API_URL` | frontend env / Docker build | URL absoluta del API vista por el navegador |

En producción: FE `https://profruitcol.netlify.app` → API `https://profruit-backend.onrender.com` → MySQL Aiven.

En Docker local, el default del FE es `http://localhost:8080` (nginx proxy `/api` → backend).

## API (resumen)

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/api/health`, `/api/health/db`, `/api/health/auth` | Salud |
| POST | `/api/register`, `/api/login` | Auth |
| GET | `/api/me` | Sesión (rol desde BD) |
| GET/POST/PUT/DELETE | `/api/products` | Catálogo / CRUD staff |
| POST | `/api/orders` | Crear pedido (auth) |
| GET/POST | `/api/admin/orders` | Listar (expira >48h) / cancelar |
| POST | `/api/pay` | Confirmar pago (admin) |
| GET/POST | `/api/admin/inventory` | Stock y movimientos |
| CRUD | `/api/admin/promotions` | Promociones |
| GET | `/api/admin/stats` | Dashboard |
| GET/PUT/DELETE | `/api/users` | Usuarios (`super_admin`) |

Pedidos pendientes **reservan stock**. Al cancelar o al expirar (>48 h al listar admin) se libera la reserva. Al confirmar pago se descuenta stock físico.

## Pruebas

```bash
# Frontend (Jest / CRA)
cd frontend && npm test

# Backend (unitarios node:test)
cd backend && npm test

# Smoke opcional contra API en marcha
cd backend && npm run test:smoke
```

## Convenciones

PascalCase en componentes, camelCase en variables. Proyecto formativo **SENA** (Colombia).
