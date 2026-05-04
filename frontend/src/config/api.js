/** URL pública del API en Railway (build de producción sin REACT_APP_API_URL). */
const DEFAULT_PRODUCTION_API = 'https://profruit-production.up.railway.app';

/**
 * Base del API sin barra final.
 * - Si REACT_APP_API_URL está definido (puede ser cadena vacía): se usa tal cual (vacío = misma origen: proxy en dev o nginx /api/ en Docker).
 * - En desarrollo sin variable: '' → `package.json` proxy hacia el backend local.
 * - En producción sin variable: API por defecto en Railway.
 */
function resolveApiBaseUrl() {
  const v = process.env.REACT_APP_API_URL;
  if (typeof v === 'string') {
    return v.trim().replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  return DEFAULT_PRODUCTION_API;
}

export const API_URL = resolveApiBaseUrl();

export const api = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
};
