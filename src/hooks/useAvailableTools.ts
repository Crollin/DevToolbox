import { useMemo } from 'react';
import { tools } from '@/data/tools';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export function useAvailableTools() {
  const { domainHubEnabled, isLoading } = useFeatureFlags();

  const availableTools = useMemo(
    () => tools.filter((t) => t.id !== 'domain-hub' || domainHubEnabled),
    [domainHubEnabled]
  );

  return { availableTools, isLoading };
}
