export function getApiBase() {
  return process.env.REACT_APP_API_URL;
}

export function apiUrl(path) {
  const base = getApiBase();
  if (base == null || base === "") {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const trimmed = String(base).replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${p}`;
}
