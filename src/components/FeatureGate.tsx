import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

type FeatureGateFeature = 'domainHub';

interface FeatureGateProps {
  feature: FeatureGateFeature;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { domainHubEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (feature === 'domainHub' && !domainHubEnabled) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
