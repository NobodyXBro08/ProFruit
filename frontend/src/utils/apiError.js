/**
 * Formatea errores JSON del backend para mostrarlos al usuario.
 * @param {unknown} data
 * @param {number} [status]
 */
export function formatApiError(data, status) {
  const o = data && typeof data === 'object' ? data : {};
  const main = o.error || o.message || (status ? `Error del servidor (${status})` : 'Error del servidor');
  const extra = [];

  if (o.hint) extra.push(o.hint);
  if (o.details) extra.push(o.details);
  if (o.code) extra.push(`Código: ${o.code}`);

  if (extra.length === 0) return main;
  return `${main} — ${extra.join(' · ')}`;
}

/**
 * @param {Response} res
 */
export async function readApiError(res) {
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  const message = formatApiError(data, res.status);
  const err = new Error(message);
  err.status = res.status;
  err.api = data;
  return err;
}
