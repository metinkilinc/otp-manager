import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * Generic API hook with loading, error states
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, request, api };
}

export default useApi;
