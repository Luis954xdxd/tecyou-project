export const AUTH_USER_KEY = 'tec_you_user';

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
};