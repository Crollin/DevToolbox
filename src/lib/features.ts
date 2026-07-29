import { Tool } from '@/data/tools';

export const DOMAIN_HUB_TOOL_ID = 'domain-hub';

export interface FeatureFlags {
  domainHubEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  domainHubEnabled: false,
};

export function filterAvailableTools(allTools: Tool[], flags: FeatureFlags): Tool[] {
  return allTools.filter((tool) => {
    if (tool.id === DOMAIN_HUB_TOOL_ID) {
      return flags.domainHubEnabled;
    }
    return true;
  });
}
