import { useMemo } from 'react';
import { tools } from '@/data/tools';
import { filterAvailableTools } from '@/lib/features';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export function useAvailableTools() {
  const { domainHubEnabled, isLoading } = useFeatureFlags();

  const availableTools = useMemo(
    () => filterAvailableTools(tools, { domainHubEnabled }),
    [domainHubEnabled]
  );

  return { availableTools, isLoading };
}
