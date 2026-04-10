const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '';

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};
