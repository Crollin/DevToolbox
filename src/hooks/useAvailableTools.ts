import { useMemo } from 'react';
import { tools } from '@/data/tools';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export function useAvailableTools() {
  const { domainHubEnabled, transmuteEnabled, isLoading } = useFeatureFlags();

  const availableTools = useMemo(
    () =>
      tools.filter((t) => {
        if (t.id === 'domain-hub') return domainHubEnabled;
        if (t.id === 'file-converter') return transmuteEnabled;
        return true;
      }),
    [domainHubEnabled, transmuteEnabled]
  );

  return { availableTools, isLoading };
}
