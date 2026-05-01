# ProFruit

E-commerce / vitrina de frutos deshidratados: **SPA React** (`frontend/`) + **API Next.js** (`backend/`) + **MySQL**. Opcionalmente hay un `package.json` en la raíz solo con atajos.

## ¿Cuántos `package.json`?

- **`frontend/package.json`** y **`backend/package.json`**: **sí hacen falta** (CRA y Next son dos proyectos Node con dependencias distintas).
- **Raíz `package.json`**: opcional; incluye **`npm run up`** (MySQL en contenedor + API + web), **`npm run up:hostdb`** (solo API + web leyendo MySQL de tu PC), `down`, `install`, `dev`, `build`.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `frontend/` | Create React App (React 19), `fetch('/api/products')`; en dev el `proxy` apunta al API en `:3000`. |
| `backend/` | Next.js 14 (route handlers), TypeScript, `mysql2`, **scrypt**. |
| `docker/mysql/init/` | SQL inicial para MySQL en Docker (esquema + seed opcional). |
| `docker-compose.yml` | **backend + frontend** (API puede usar MySQL del PC o el hostname `mysql`). |
| `docker-compose.db.yml` | MySQL en contenedor; se combina con el anterior en `npm run up`. |
| `.env.example` | Plantilla para `DB_HOST=host.docker.internal`, claves, etc. |

## Todo en Docker (3 contenedores)

En la **raíz** del repo:

```bash
npm run up
```

Incluye **`docker-compose.db.yml`** (levanta MySQL + API + web). Abre **http://localhost:8080** (web). API: **http://localhost:3000**. Parar: `npm run down`.

Para **API y web en Docker** pero **base de datos = MySQL instalado en Windows** (la que ya usabas en local), crea un archivo **`.env`** en la raíz (puedes partir de `.env.example`) con al menos:

```env
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_clave_de_mysql_en_windows
DB_NAME=profruit_db
```

Luego ejecuta **`npm run up:hostdb`** (no uses `npm run up`, para no levantar el contenedor MySQL). El nombre `host.docker.internal` es la forma estándar de que un contenedor llegue al equipo anfitrión en Docker Desktop para Windows.

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

Solo CRA: `npm start` en `frontend/` (usa el puerto **3001** para no chocar con Next en **3000**; el `proxy` de CRA solo funciona así). Solo API: `cd backend` → `npm run dev`.

### Backend — `.env.local` en `backend/`

| Variable | Ejemplo local |
|----------|----------------|
| `DB_HOST` | `localhost` en dev sin Docker; en contenedor con MySQL embebido `mysql`; con MySQL en tu PC desde Docker: `host.docker.internal` (vía `.env` en la raíz con `up:hostdb`) |
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

| Comando | Qué levanta |
|---------|-------------|
| `npm run up` | `docker compose -f docker-compose.yml -f docker-compose.db.yml up --build -d` → MySQL contenedor (puerto host **3307** por defecto) + API + web |
| `npm run up:hostdb` | Solo `docker-compose.yml` → API + web; en `.env` define `DB_HOST=host.docker.internal` y el resto de `DB_*` hacia tu MySQL de Windows |

| Servicio | Puerto host (defecto) |
|----------|-------------------------|
| `mysql` (solo con `npm run up`) | `3307` (mapeo al 3306 del contenedor) |
| `backend` | `3000` |
| `frontend` | `8080` |

Web: http://localhost:8080 · API: http://localhost:3000 · Variables: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PUBLISH_PORT`, `API_PUBLISH_PORT`, `FRONTEND_PORT`, y para MySQL del host: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Los `.sql` en `docker/mysql/init/` solo corren al **crear** el volumen del contenedor MySQL.

**Firewall:** si el API en Docker no conecta a tu MySQL de Windows, permite conexiones **TCP al puerto 3306** desde Docker (o prueba desactivar el firewall un momento para descartar).

## Convenciones

PascalCase en componentes, camelCase en variables. **SENA** (Análisis y desarrollo de software, Colombia).
