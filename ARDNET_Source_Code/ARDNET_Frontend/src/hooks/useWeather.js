import { useCallback, useEffect, useRef, useState } from 'react';
import API_CONFIG from '../api/config';

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(null);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/weather?location=Pagadian`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Weather is unavailable right now. Please try again.');
      if (!data.current || !Array.isArray(data.forecast)) throw new Error('Weather unavailable');
      if (request.current === controller) setWeather(data);
    } catch (err) {
      if (request.current === controller) {
        setError(err.name === 'AbortError'
          ? 'The weather request timed out. Please try again shortly.'
          : err instanceof TypeError
            ? 'Cannot connect to the weather server. Check that the backend is running and try again.'
            : err.message || 'Weather is unavailable right now. Please try again.');
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    return () => { const controller = request.current; request.current = null; controller?.abort(); };
  }, [refresh]);
  return { weather, loading, error, refresh };
}
