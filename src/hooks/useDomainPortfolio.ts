import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { DomainBillingStatus, PortfolioDomain, PortfolioDomainInput } from '@/types/domain';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useDomainPortfolio() {
  const { isAuthenticated } = useAuth();
  const [domains, setDomains] = useState<PortfolioDomain[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }
    try {
      const data = await api.get<{ domains: PortfolioDomain[] }>('/domains');
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Erreur chargement domaines:', error);
      setDomains([]);
    } finally {
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

  const updateBillingStatus = useCallback(
    async (id: string, billingStatus: DomainBillingStatus) => {
      const data = await api.patch<{ domain: PortfolioDomain }>(`/domains/${id}/billing`, {
        billingStatus,
      });
      setDomains((prev) => prev.map((d) => (d.id === id ? data.domain : d)));
      return data.domain;
    },
    []
  );

  const exportBillingCsv = useCallback(
    async (params?: {
      payer?: 'client' | 'agency' | 'all';
      days?: number;
      billingStatus?: 'pending' | 'all';
    }) => {
      const qs = new URLSearchParams();
      qs.set('payer', params?.payer ?? 'client');
      qs.set('days', String(params?.days ?? 60));
      qs.set('billingStatus', params?.billingStatus ?? 'pending');

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/domains/export/billing.csv?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export impossible' }));
        throw new Error(error.error || 'Export impossible');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `domaines-facturation-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    domains,
    isLoaded,
    load,
    addDomain,
    updateDomain,
    deleteDomain,
    syncHostinger,
    updateBillingStatus,
    exportBillingCsv,
  };
}
