export interface FeatureFlags {
  domainHubEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  domainHubEnabled: false,
};
