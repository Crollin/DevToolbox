import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/lib/api';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/lib/features';

interface FeatureFlagsContextValue extends FeatureFlags {
  isLoading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  ...DEFAULT_FEATURE_FLAGS,
  isLoading: true,
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFlags = async () => {
      try {
        const data = await api.get<{ domainHubEnabled: boolean }>('/config');
        if (!cancelled) {
          setFlags({
            domainHubEnabled: Boolean(data.domainHubEnabled),
          });
        }
      } catch {
        if (!cancelled) {
          setFlags(DEFAULT_FEATURE_FLAGS);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFlags();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ ...flags, isLoading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}
