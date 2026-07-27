import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PortfolioDomain, PortfolioDomainInput } from '@/types/domain';

export function useDomainPortfolio() {
  const { isAuthenticated } = useAuth();
  const [domains, setDomains] = useState<PortfolioDomain[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<{ domains: PortfolioDomain[] }>('/domains');
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Erreur chargement domaines:', error);
      setDomains([]);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const addDomain = useCallback(async (input: PortfolioDomainInput) => {
    const data = await api.post<{ domain: PortfolioDomain }>('/domains', input);
    setDomains((prev) => [...prev, data.domain]);
    return data.domain;
  }, []);

  const updateDomain = useCallback(async (id: string, input: Partial<PortfolioDomainInput>) => {
    const data = await api.put<{ domain: PortfolioDomain }>(`/domains/${id}`, input);
    setDomains((prev) => prev.map((d) => (d.id === id ? data.domain : d)));
    return data.domain;
  }, []);

  const deleteDomain = useCallback(async (id: string) => {
    await api.delete(`/domains/${id}`);
    setDomains((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const syncHostinger = useCallback(async () => {
    const result = await api.post<{ synced: number; updated: number; created: number }>(
      '/domains/sync/hostinger'
    );
    await load();
    return result;
  }, [load]);

  const createQontoDraft = useCallback(
    async (
      id: string,
      payload?: { clientId?: string; vatRate?: number; dueDays?: number; description?: string }
    ) => {
      const result = await api.post<{
        invoice: { id: string; status: string; invoiceUrl?: string | null };
        message: string;
      }>(`/domains/${id}/qonto-draft`, payload || {});
      await load();
      return result;
    },
    [load]
  );

  return {
    domains,
    isLoaded,
    loading,
    load,
    addDomain,
    updateDomain,
    deleteDomain,
    syncHostinger,
    createQontoDraft,
  };
}
