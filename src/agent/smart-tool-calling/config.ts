/**
 * Smart Tool Calling Configuration
 * Provides types and interfaces for smart tool calling feature
 */

/**
 * Provider configuration for fallback
 */
export interface ProviderConfig {
  provider: "openai" | "anthropic" | "gemini" | "ollama";
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  key?: (toolName: string, params: any) => string; // Custom key generator
}

/**
 * Cached result structure
 */
export interface CachedResult {
  result: any;
  timestamp: number;
  ttl: number;
}

/**
 * Smart Tool Calling configuration
 */
export interface SmartToolConfig {
  /**
   * Force the model to use tools when available
   * @default false
   */
  forceToolUse?: boolean;

  /**
   * Strategy when tool is not called
   * - 'retry': Retry with enhanced prompt
   * - 'error': Throw error
   * - 'warn': Log warning and continue
   * - 'allow': Allow response without tool
   * @default 'retry'
   */
  onToolNotCalled?: "retry" | "error" | "warn" | "allow";

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Timeout for each tool call in milliseconds
   * @default 30000 (30 seconds)
   */
  toolTimeout?: number;

  /**
   * Fallback provider configuration
   * Used when primary provider fails after max retries
   */
  fallbackProvider?: ProviderConfig;

  /**
   * Cache configuration for tool results
   */
  cacheResults?: CacheConfig;

  /**
   * Validate tool response before returning
   * @default true
   */
  validateToolResponse?: boolean;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_SMART_TOOL_CONFIG: Required<
  Omit<SmartToolConfig, "fallbackProvider">
> = {
  forceToolUse: false,
  onToolNotCalled: "retry",
  maxRetries: 3,
  toolTimeout: 30000,
  cacheResults: {
    enabled: false,
    ttl: 300000, // 5 minutes
    maxSize: 100,
  },
  validateToolResponse: true,
  debug: false,
};

/**
 * Merge user config with defaults and validate
 */
export function mergeConfig(
  userConfig?: SmartToolConfig
): Required<Omit<SmartToolConfig, "fallbackProvider">> &
  Pick<SmartToolConfig, "fallbackProvider"> {
  const merged = {
    ...DEFAULT_SMART_TOOL_CONFIG,
    ...userConfig,
    cacheResults: {
      ...DEFAULT_SMART_TOOL_CONFIG.cacheResults,
      ...userConfig?.cacheResults,
    },
  };

  // Validate configuration
  if (merged.maxRetries < 0) {
    throw new Error("maxRetries must be >= 0");
  }

  if (merged.maxRetries > 10) {
    console.warn(
      `maxRetries is set to ${merged.maxRetries}. Consider using a lower value to avoid excessive API calls.`
    );
  }

  if (merged.toolTimeout < 0) {
    throw new Error("toolTimeout must be >= 0");
  }

  if (merged.toolTimeout < 1000) {
    console.warn(
      `toolTimeout is set to ${merged.toolTimeout}ms. This may be too short for most tools.`
    );
  }

  if (merged.cacheResults.enabled && merged.cacheResults.ttl < 0) {
    throw new Error("cache TTL must be >= 0");
  }

  if (
    merged.cacheResults.enabled &&
    merged.cacheResults.maxSize &&
    merged.cacheResults.maxSize < 1
  ) {
    throw new Error("cache maxSize must be >= 1");
  }

  return merged;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  maxRetries: number;
  message: string;
  enhancedMessage: string;
  timestamp: number;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  success: boolean;
  toolCalled: boolean;
  result?: any;
  error?: Error;
  attempts: RetryAttempt[];
  usedFallback: boolean;
  cached: boolean;
  duration: number;
}
