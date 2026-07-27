import { useCallback, useState } from 'react';
import api from '@/lib/api';
import { CompareResponse, DEFAULT_COMPARE_TLDS } from '@/types/domain';

export function useDomainCompare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);

  const compare = useCallback(async (name: string, tlds: string[] = [...DEFAULT_COMPARE_TLDS]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<CompareResponse>('/domains/compare', { name, tlds });
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de comparaison';
      setError(message);
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { compare, loading, error, data, setData };
}
