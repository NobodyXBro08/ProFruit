/**
 * Base del API en producción (p. ej. https://tu-servicio.up.railway.app).
 * Vacía: rutas relativas `/api/...` (proxy de CRA en dev; en Netlify debes definir
 * REACT_APP_API_URL o un proxy en netlify.toml hacia Railway).
 */
export function getApiBase() {
  const raw = process.env.REACT_APP_API_URL;
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\/+$/, '');
}

/** Construye la URL final para fetch (respeta slash inicial de `path`). */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${p}` : p;
}
