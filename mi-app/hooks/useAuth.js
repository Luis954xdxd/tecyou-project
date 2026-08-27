import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/api';
import { SESSION_TOKEN_KEY } from '../utils/authenticatedFetch';

const SESSION_KEY = 'tec_you_user';

/**
 * Hook para manejar autenticación y sesión del usuario
 *
 * Uso:
 *   const { user, loading, login, logout } = useAuth();
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al arrancar la app, revisa si hay sesión guardada
  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await AsyncStorage.getItem(SESSION_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error cargando sesión:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  /**
   * Inicia sesión con email y password
   * Regresa { success: true } o { success: false, error: '...' }
   */
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión.' };
      }

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.token);
      setUser(data.user);
      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. ¿Está encendido el backend?',
      };
    }
  };

  /**
   * Registra una cuenta nueva
   * Regresa { success: true } o { success: false, error: '...' }
   */
  const register = async (email, password, confirmPassword) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al registrarse.' };
      }

      return { success: true, message: data.message };

    } catch (err) {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. ¿Está encendido el backend?',
      };
    }
  };

  /**
   * Cierra sesión y limpia el storage
   */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
    setUser(null);
  };

  return { user, loading, login, register, logout };
}
