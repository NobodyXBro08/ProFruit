export const API_URL = process.env.REACT_APP_API_URL;

export const api = (path) => `${API_URL}${path}`;
