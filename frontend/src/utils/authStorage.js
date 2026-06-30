export const AUTH_USER_KEY = 'tec_you_user';
export const AUTH_TOKEN_KEY = 'tec_you_session_token';

export const saveUserSession = (user) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getUserSession = () => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const clearUserSession = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const saveSessionToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getSessionToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';
