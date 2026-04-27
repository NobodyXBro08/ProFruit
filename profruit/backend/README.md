# ProFruit — API (backend)

Este README describe **solo el backend** (API). El frontend React está en la carpeta superior: [README del frontend](../README.md). Vista general del repo: [README raíz](../../README.md).

Backend en **Node.js** con **Next.js** que expone una **API REST** en JSON para la aplicación **ProFruit**: catálogo de productos (frutos deshidratados), registro e inicio de sesión de usuarios, y un endpoint simple para comprobar que el servicio está en línea.

La API se conecta a **MySQL** para guardar usuarios y productos. Las contraseñas no se guardan en texto plano: se almacena un hash derivado con **scrypt**.

## Tecnologías

- Next.js 14 (rutas API / Route Handlers)
- TypeScript
- MySQL (cliente `mysql2`)

## Requisitos

- Node.js 18 o superior
- MySQL con una base de datos creada para el proyecto

## Instalación

Clona el repositorio, entra en la carpeta del backend e instala dependencias:

```bash
cd backend
npm install
```

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:

   ```bash
   # PowerShell (Windows)
   Copy-Item .env.example .env.local
   ```

2. Edita **`.env.local`** con tus datos de MySQL:

   | Variable     | Descripción        |
   |--------------|--------------------|
   | `DB_HOST`    | Host (ej. `localhost`) |
   | `DB_PORT`    | Puerto (por defecto `3306`) |
   | `DB_USER`    | Usuario de MySQL |
   | `DB_PASSWORD`| Contraseña       |
   | `DB_NAME`    | Nombre de la base de datos |

3. Crea las tablas que necesita la aplicación. Para **usuarios** puedes usar algo como:

   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id INT UNSIGNED NOT NULL AUTO_INCREMENT,
     username VARCHAR(191) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     PRIMARY KEY (id),
     UNIQUE KEY uk_users_username (username)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

   La tabla **products** debe coincidir con lo que espera el código en `src/lib/products.ts` (campos como `name`, `description`, `price`, `stock`, `weight`, etc.).

> **Importante:** no subas `.env.local` a Git (contiene secretos). El archivo `.env.example` sirve como plantilla sin contraseñas.

## Cómo ejecutar el proyecto

**Modo desarrollo** (recarga al cambiar código):

```bash
npm run dev
```

El servidor suele quedar en **http://localhost:3000**.

**Producción** (compilar y arrancar):

```bash
npm run build
npm start
```

## Qué ofrece la API

Resumen de rutas útiles. Las peticiones con cuerpo van en **JSON** (`Content-Type: application/json`).

| Método | Ruta | Para qué sirve |
|--------|------|-----------------|
| `GET` | `/api/health` | Comprobar que el backend responde |
| `POST` | `/register` o `/api/register` | Registrar un usuario |
| `POST` | `/login` o `/api/login` | Iniciar sesión |
| `GET` | `/api/products` | Listar productos |
| `GET` | `/api/products?id=` | Ver un producto por id |
| `POST` | `/api/products` | Crear producto |
| `PUT` | `/api/products` | Actualizar producto |
| `DELETE` | `/api/products?id=` | Eliminar producto |

Para cuerpos de ejemplo, códigos de respuesta y detalles de validación, revisa **`DOCUMENTACION_SERVICIOS_AA5_EV03.md`** en esta misma carpeta.

## Estructura del código

```
backend/
├── src/app/           # Rutas HTTP (register, login, api/...)
├── src/lib/           # Lógica: auth, productos, base de datos, validaciones
├── package.json
├── next.config.mjs
└── tsconfig.json
```

## Scripts disponibles

| Comando        | Acción                          |
|----------------|---------------------------------|
| `npm run dev`  | Servidor de desarrollo          |
| `npm run build`| Compila para producción         |
| `npm start`    | Sirve la build (tras `build`)   |
| `npm run lint` | Ejecuta el linter de Next.js   |

---

Si el frontend del monorepo corre en otro puerto, suele configurarse un **proxy** hacia `http://localhost:3000` para que el navegador llame a esta API sin problemas de CORS en desarrollo.
