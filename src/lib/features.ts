export interface FeatureFlags {
  domainHubEnabled: boolean;
  transmuteEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  domainHubEnabled: false,
  transmuteEnabled: false,
};
