/**
 * Smart Tool Calling Configuration
 */

import { SmartToolConfig } from '../../types';

/**
 * Default configuration for smart tool calling
 */
export const DEFAULT_SMART_TOOL_CONFIG: Required<SmartToolConfig> = {
  forceToolUse: false,
  maxRetries: 3,
  onToolNotCalled: 'retry',
  toolTimeout: 30000, // 30 seconds
  cacheResults: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100,
  },
  debug: false,
};

/**
 * Merge user config with defaults and validate
 */
export function mergeConfig(
  userConfig?: SmartToolConfig
): Required<SmartToolConfig> {
  const merged = {
    ...DEFAULT_SMART_TOOL_CONFIG,
    ...userConfig,
    cacheResults: {
      ...DEFAULT_SMART_TOOL_CONFIG.cacheResults,
      ...userConfig?.cacheResults,
    },
  };

  // Validate
  if (merged.maxRetries < 0) {
    throw new Error('maxRetries must be >= 0');
  }
  if (merged.maxRetries > 10) {
    console.warn('maxRetries is high (>10). Consider a lower value for better performance.');
  }

  if (merged.toolTimeout < 0) {
    throw new Error('toolTimeout must be >= 0');
  }
  if (merged.toolTimeout < 1000) {
    console.warn('toolTimeout is very short (<1s). Tool calls may timeout prematurely.');
  }

  if (merged.cacheResults.ttl && merged.cacheResults.ttl < 0) {
    throw new Error('cache TTL must be >= 0');
  }

  return merged;
}
