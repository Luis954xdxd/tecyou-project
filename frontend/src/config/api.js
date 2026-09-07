const DEFAULT_API_BASE_URL = 'http://localhost:5000';

const normalizeApiBaseUrl = (value) => {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return DEFAULT_API_BASE_URL;
  return cleanValue.replace(/\/+$/, '');
};

export const API_BASE = normalizeApiBaseUrl(process.env.REACT_APP_API_BASE_URL);

export const resolveApiUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};
