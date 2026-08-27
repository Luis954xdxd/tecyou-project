import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_TOKEN_KEY = 'tec_you_session_token';

export async function authenticatedFetch(url, options = {}) {
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
