# ProFruit

E-commerce / vitrina de frutos deshidratados: **SPA React** (`frontend/`) + **API Next.js** (`backend/`) + **MySQL**. Opcionalmente hay un `package.json` en la raíz solo con atajos.

## ¿Cuántos `package.json`?

- **`frontend/package.json`** y **`backend/package.json`**: **sí hacen falta** (CRA y Next son dos proyectos Node con dependencias distintas).
- **Raíz `package.json`**: opcional; incluye **`npm run up`** (= los 3 contenedores con Docker), `down`, `install`, `dev`, `build`.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `frontend/` | Create React App (React 19), `fetch('/api/products')`; en dev el `proxy` apunta al API en `:3000`. |
| `backend/` | Next.js 14 (route handlers), TypeScript, `mysql2`, **scrypt**. |
| `docker/mysql/init/` | SQL inicial para MySQL en Docker (`01-schema.sql`). |
| `docker-compose.yml` | **mysql + backend + frontend** (un solo comando). |

## Todo en Docker (3 contenedores)

En la **raíz** del repo:

```bash
npm run up
```

Equivale a `docker compose up --build -d`. Abre **http://localhost:8080** (web). API: **http://localhost:3000**. Parar: `npm run down`.

## Requisitos

Node.js 18+, npm, MySQL (o Docker). Si quedó una carpeta vacía **`profruit/`** tras la migración y no se borra, cierra el IDE o el proceso que la bloquee y elimínala a mano.

## Desarrollo local

```bash
npm run install
npm run dev
```

(o manual: `cd frontend && npm install`, `cd ../backend && npm install`, `cd ../frontend && npm run dev`)

- **API:** http://localhost:3000  
- **Frontend:** http://localhost:3001  

Solo CRA: `npm start` en `frontend/`. Solo API: `cd backend` → `npm run dev`.

### Backend — `.env.local` en `backend/`

| Variable | Ejemplo local |
|----------|----------------|
| `DB_HOST` | `localhost` (en Docker del API: `mysql`) |
| `DB_PORT` | `3306` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | tu clave |
| `DB_NAME` | `profruit_db` |

Esquema: `docker/mysql/init/01-schema.sql`.

### API (JSON)

| Método | Ruta |
|--------|------|
| `GET` | `/api/health` |
| `POST` | `/api/register`, `/api/login` (también `/register`, `/login` rewrite) |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/products` (`?id=` donde aplique) |
| `GET` / `PUT` / `DELETE` | `/api/users` |

```bash
cd backend
npm run build && npm start
npm run lint
```

### Frontend

Anclas HTML (`#products`, …), sin React Router. Pruebas: `npm test` en `frontend/`.

## Docker (detalle)

Mismo stack que `npm run up`:

```bash
docker compose up --build -d
```

| Servicio | Puerto host (defecto) |
|----------|-------------------------|
| `mysql` | `3306` |
| `backend` | `3000` |
| `frontend` | `8080` |

Web: http://localhost:8080 · API: http://localhost:3000 · Variables: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PUBLISH_PORT`, `API_PUBLISH_PORT`, `FRONTEND_PORT`. Reset volumen: `docker compose down -v`.

## Convenciones

PascalCase en componentes, camelCase en variables. **SENA** (Análisis y desarrollo de software, Colombia).
