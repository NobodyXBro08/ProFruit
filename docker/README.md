# Docker — ProFruit

**`docker-compose.yml`** (raíz): **mysql**, **backend** (Next), **frontend** (nginx + build CRA). El navegador abre **`http://localhost:${FRONTEND_PORT:-8080}`**; `/api/*` se proxifica al backend.

## Requisitos

Docker Desktop en ejecución (Linux containers).

## Comandos

```bash
docker compose up --build -d
docker compose ps
```

Solo base de datos: `docker compose up -d mysql`.

## Variables (`.env` en la raíz o entorno)

| Variable | Defecto |
|----------|---------|
| `MYSQL_ROOT_PASSWORD` | `profruit_root` |
| `MYSQL_DATABASE` | `profruit_db` |
| `MYSQL_PUBLISH_PORT` | `3306` |
| `API_PUBLISH_PORT` | `3000` |
| `FRONTEND_PORT` | `8080` |

Backend en Docker usa `DB_HOST=mysql`. Desarrollo local solo Node: `DB_HOST=localhost` en `backend/.env.local`.

## Volumen MySQL

Init SQL en `docker/mysql/init/` solo corre con volumen vacío. Reset total: `docker compose down -v` y volver a subir.

## Puertos en conflicto

Cambia `MYSQL_PUBLISH_PORT`, `API_PUBLISH_PORT` o `FRONTEND_PORT` si algo ya ocupa esos puertos en el host.
