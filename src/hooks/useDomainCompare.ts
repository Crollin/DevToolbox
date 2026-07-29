import { useCallback, useState } from 'react';
import api from '@/lib/api';
import {
  CompareResponse,
  CompareSettings,
  DEFAULT_COMPARE_TLDS,
  settingsToRegistrars,
} from '@/types/domain';

export function useDomainCompare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const compare = useCallback(
    async (
      name: string,
      tlds: string[] = [...DEFAULT_COMPARE_TLDS],
      settings: CompareSettings
    ) => {
      const registrars = settingsToRegistrars(settings);
      if (registrars.length === 0) {
        throw new Error('Activez au moins un registrar (Cloudflare, Hostinger ou OVH).');
      }

      const domainCount = name.includes('.') ? 1 : tlds.length;
      const registrarNames = registrars
        .map((r) => (r === 'cloudflare' ? 'Cloudflare' : r === 'hostinger' ? 'Hostinger' : 'OVH'))
        .join(', ');

      setLoading(true);
      setError(null);
      setData(null);
      setPendingLabel(
        `Interrogation de ${registrarNames} sur ${domainCount} extension${domainCount > 1 ? 's' : ''}…`
      );

      try {
        const result = await api.post<CompareResponse>('/domains/compare', {
          name,
          tlds,
          registrars,
          includeO2switch: settings.o2switch,
        });
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de comparaison';
        setError(message);
        setData(null);
        throw err;
      } finally {
        setLoading(false);
        setPendingLabel(null);
      }
    },
    []
  );

  return { compare, loading, error, data, setData, pendingLabel };
}
