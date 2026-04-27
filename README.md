# ProFruit

Repositorio de **ProFruit**: sitio web para mostrar frutos deshidratados y una **API** que sirve datos (productos) y autenticación básica (registro / login). El código útil vive en la carpeta **`profruit/`**; en la raíz solo hay un `package.json` pequeño que reenvía comandos a esa carpeta.

## Por qué hay varios README

No es un error: cada parte del repo tiene su propio **README.md** porque suele abrirse por carpetas en GitHub o en el editor.

| Ubicación | Qué explica |
|-----------|-------------|
| **Este archivo** (`README.md` en la raíz) | Qué es el repo, cómo está organizado y cómo arrancar en pocos pasos. |
| [`profruit/README.md`](profruit/README.md) | **Frontend** React (instalación, estructura, componentes, pruebas). |
| [`profruit/backend/README.md`](profruit/backend/README.md) | **API** Next.js + MySQL (variables de entorno, rutas, ejecución). |

Así cada módulo tiene documentación cerca del código que describe.

## Inicio rápido

```bash
cd profruit
npm install
npm run dev
```

Eso suele levantar el **backend** (puerto 3000) y el **frontend** (puerto 3001) a la vez. Solo frontend: `npm start` dentro de `profruit/`. Solo API: `cd profruit/backend` → `npm install` → `npm run dev`.

Desde la **raíz** del repo también puedes usar:

- `npm run install:app` — instala dependencias del frontend en `profruit/`
- `npm run dev` — equivale a `npm run dev` dentro de `profruit/`

Más detalle en los README enlazados arriba.
