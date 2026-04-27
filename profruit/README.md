# ProFruit — Frontend web

## Evidencia de producto

**GA7-220501096-AA4-EV03** — Módulos de software codificados y probados (integración de interfaz y navegación).

---

## Descripción del proyecto

ProFruit es una aplicación web de una sola página (SPA de presentación) para mostrar y promocionar frutos deshidratados. Incluye secciones de bienvenida, catálogo de productos (consumo de API con datos en MySQL mediante el backend del repositorio), testimonios, aliados y pie de página con contacto.

---

## Tecnologías utilizadas

| Área | Tecnología |
|------|------------|
| Interfaz | React 19 (Create React App) |
| Estilos | CSS modular por componente |
| Iconos | react-icons |
| Datos de productos | Fetch a `/api/products` (proxy en desarrollo hacia Next.js + MySQL en `backend/`) |

---

## Requisitos previos

- Node.js LTS (recomendado v18 o superior)
- npm
- Para ver productos reales: MySQL en ejecución y backend Next.js en `http://localhost:3000` (ver carpeta `backend/`)

---

## Instalación y ejecución

Desde la carpeta `profruit`:

```bash
npm install
npm start
```

La aplicación se abre en `http://localhost:3000` si no hay otro proceso en ese puerto; si usa el script `npm run dev` del monorepo, el frontend suele estar en el puerto **3001**.

Compilación de producción:

```bash
npm run build
```

Pruebas unitarias (Jest + Testing Library):

```bash
npm test
```

---

## Estructura del proyecto

```
profruit/
├── public/              # Recursos estáticos (index.html, favicon, manifest)
├── src/
│   ├── App.js           # Componente raíz: layout y orden de secciones
│   ├── App.css
│   ├── index.js         # Punto de entrada React
│   ├── styles/
│   │   └── global.css   # Variables CSS, scroll suave y offsets de anclas
│   ├── assets/images/   # Imágenes de la marca y productos
│   └── components/
│       ├── NavBar/      # Navegación fija y menú hamburguesa (móvil)
│       ├── About/       # Hero / bienvenida (#about)
│       ├── Products/    # Carrusel de productos desde API (#products)
│       ├── Opinions/    # Testimonios (#opinions)
│       ├── JobWithUs/   # Aliados (#jobs)
│       └── Footer/      # Contacto y enlaces (#contact)
└── backend/             # API Next.js + MySQL (opcional para datos en vivo)
```

---

## Componentes principales

| Componente | Responsabilidad |
|------------|-----------------|
| **Navbar** | Enlaces internos por ancla (`#inicio`, `#about`, `#products`, …); menú hamburguesa en pantallas pequeñas. |
| **About** | Sección principal con fondo rotativo y botones hacia productos y contacto. |
| **Products** | Obtiene productos vía `fetch('/api/products')`, muestra carrusel, precio y peso. |
| **Opinions** | Grid de opiniones de clientes (datos estáticos). |
| **JobWithUs** | Tarjetas de aliados comerciales y llamada a la acción. |
| **Footer** | Datos de contacto, redes y enlaces de navegación por ancla. |

---

## Navegación

La aplicación no usa React Router: todas las rutas son **anclas HTML** hacia el `id` de cada sección (`#inicio`, `#about`, `#products`, `#opinions`, `#jobs`, `#contact`). El archivo `global.css` define `scroll-behavior: smooth` y `scroll-margin-top` para que el encabezado fijo no tape el título al hacer clic en el menú.

---

## Repositorio remoto

Sustituye la siguiente URL por la de tu repositorio en GitHub:

**https://github.com/TU_USUARIO/TU_REPOSITORIO**

---

## Estándar de codificación (resumen)

- Componentes en **PascalCase** y archivos alineados con el nombre del componente.
- Variables y funciones en **camelCase**.
- Comentarios JSDoc al inicio de componentes y comentarios breves en bloques JSX relevantes.
- Estilos encapsulados en un `.css` por carpeta de componente.

---

## Autor / programa de formación

Análisis y desarrollo de software — SENA (Colombia). Proyecto formativo integrador de tecnologías orientadas a servicios.
