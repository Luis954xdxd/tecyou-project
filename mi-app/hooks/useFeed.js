import { useState, useCallback } from 'react';
import { API_BASE } from '../constants/api';

export function useFeed() {
  const [recognitions, setRecognitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/api/recognitions/feed`);

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { 
        setError('Error al cargar el feed.');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Error al cargar el feed.');
        return;
      }

      // Normalizar media — el backend devuelve campo "media" con media_url y media_type
      const normalized = data.map((rec) => ({
        ...rec,
        media: Array.isArray(rec.media)
          ? rec.media.filter(m => m && m.media_url)
          : [],
      }));

      setRecognitions(normalized);
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { recognitions, loading, error, fetchFeed };
}