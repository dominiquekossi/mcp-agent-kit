/**
 * Smart Tool Calling
 * Main export file for smart tool calling feature
 */

// Configuration
export {
  SmartToolConfig,
  ProviderConfig,
  CacheConfig,
  CachedResult,
  RetryAttempt,
  ToolCallResult,
  DEFAULT_SMART_TOOL_CONFIG,
  mergeConfig,
} from "./config";

// Prompt Enhancement
export { PromptEnhancer, promptEnhancer } from "./prompt-enhancer";

// Cache
export { ToolCache } from "./cache";

// Retry Logic
export { RetryLogic, Agent, AgentResponse } from "./retry-logic";

// Fallback Provider
export { FallbackProvider } from "./fallback";

/**
 * Create a retry logic instance with configuration
 * @param config Smart tool configuration
 * @returns RetryLogic instance
 */
export function createRetryLogic(config: SmartToolConfig): RetryLogic {
  const mergedConfig = mergeConfig(config);
  return new RetryLogic(mergedConfig);
}
