# GA7-220501096-AA5-EV01 — Diseño y desarrollo de servicios web

## Descripción

Este proyecto corresponde al desarrollo de **servicios web** (API REST) para **registro e inicio de sesión de usuarios**, aplicando conceptos de construcción de API, validación de datos, respuestas en **JSON** y persistencia en **MySQL**. Forma parte del backend **ProFruit** (Next.js + TypeScript).

> **Nota:** La evidencia menciona PHP como ejemplo; en este repositorio la implementación es **Node.js / Next.js API Routes**, equivalente funcional a servicios web con JSON y base de datos.

## Tecnologías utilizadas

- **Node.js** y **Next.js 14** (API Routes)
- **TypeScript**
- **JSON** (cuerpos de petición y respuestas)
- **MySQL** (tabla `users` + `mysql2`)
- **Git** y **GitHub** (versionamiento del código)

## Funcionalidades

- Registro de usuarios con validación y contraseña hasheada (`scrypt`)
- Inicio de sesión con verificación de credenciales
- Validación de campos vacíos y usuario duplicado
- Respuestas en formato JSON y códigos HTTP según la guía de la evidencia

## Base de datos — tabla `users`

Ejecuta en MySQL (misma base que uses en `.env.local`, por ejemplo `profruit_db`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Endpoints

### Registro

- **Método:** `POST`
- **Ruta:** `/api/register`
- **URL completa (local):** `http://localhost:3000/api/register`

**Body esperado:**

```json
{
  "username": "usuario",
  "password": "123456"
}
```

**Respuesta exitosa (201):**

```json
{
  "message": "Usuario registrado correctamente"
}
```

**Errores típicos:**

| Código | Situación |
|--------|-----------|
| 400 | Campos vacíos o JSON inválido |
| 409 | Usuario ya existente |
| 500 | Error interno del servidor |

---

### Inicio de sesión

- **Método:** `POST`
- **Ruta:** `/api/login`
- **URL completa (local):** `http://localhost:3000/api/login`

**Body esperado:**

```json
{
  "username": "usuario",
  "password": "123456"
}
```

**Respuesta exitosa (200):**

```json
{
  "message": "Autenticación satisfactoria"
}
```

**Respuesta de error de autenticación (401):**

```json
{
  "error": "Error en la autenticación"
}
```

**Otros:**

| Código | Situación |
|--------|-----------|
| 400 | Campos vacíos o JSON inválido |
| 500 | Error interno del servidor |

---

### Otros endpoints existentes (proyecto)

- `GET/POST/PUT/DELETE` `/api/products` — CRUD de productos
- `GET` `/api/health` — comprobación del servidor

## Instalación y ejecución

Desde la carpeta `backend`:

```bash
npm install
npm run dev
```

El servidor escucha por defecto en **http://localhost:3000**.

Variables de entorno (archivo `.env.local`):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=profruit_db
```

## Repositorio

Agregar aquí el enlace del repositorio: `https://github.com/TU_USUARIO/TU_REPOSITORIO`

---

## Verificación de cumplimiento

| Criterio | Cumple | Observación |
|----------|--------|-------------|
| Realiza un servicio para ser utilizado en un registro | Sí | Se implementa `POST /api/register` con validaciones y respuesta JSON. |
| Realiza un servicio para ser utilizado en un inicio de sesión | Sí | Se implementa `POST /api/login` con verificación de credenciales. |
| Realiza las validaciones de verificación correctamente | Sí | Campos vacíos, usuario duplicado (409) y contraseña incorrecta o inexistente (401). |
| Utiliza herramientas de versionamiento para la creación del proyecto | Sí | El proyecto está preparado para Git/GitHub (`.gitignore`, commits). |

---

## Estructura relevante (auth)

```
backend/src/
├── app/api/
│   ├── register/route.ts   # Servicio de registro
│   ├── login/route.ts      # Servicio de inicio de sesión
│   └── products/route.ts   # CRUD productos (existente)
└── lib/
    ├── auth.ts             # Validaciones, hash y consultas de usuario
    └── db.ts               # Pool MySQL
```
