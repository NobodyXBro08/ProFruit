/**
 * CRA solo sustituye process.env.REACT_APP_API_URL en tiempo de compilación.
 * Debe existir en .env.production / .env.development o en variables del CI.
 */
function readApiBaseUrl() {
  const v = process.env.REACT_APP_API_URL;
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(
      'REACT_APP_API_URL no está definido. Añade frontend/.env.production (o .env.development) o define la variable en el entorno de build.'
    );
  }
  const t = v.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(t)) {
    throw new Error('REACT_APP_API_URL debe ser una URL absoluta (http:// o https://), sin barra final.');
  }
  return t;
}

export const API_URL = readApiBaseUrl();

export const api = (path) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
};
