/** URL absoluta del API si no se define REACT_APP_API_URL en el build. */
const DEFAULT_PUBLIC_API = 'https://profruit-production.up.railway.app';

/**
 * Base del API sin barra final, siempre absoluta (https://… o http://…).
 * Nunca devuelve cadena vacía: no hay fetch a rutas relativas tipo `/api/...`.
 */
function resolveApiBaseUrl() {
  const v = process.env.REACT_APP_API_URL;
  if (typeof v === 'string') {
    const t = v.trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(t)) return t;
  }
  return DEFAULT_PUBLIC_API;
}

export const API_URL = resolveApiBaseUrl();

/** Construye URL absoluta del endpoint (path debe empezar por `/`). */
export const api = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
};
