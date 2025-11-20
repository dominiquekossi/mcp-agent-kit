/**
 * Create Agent - Main entry point for creating AI agents
 */

import { AgentConfig, AgentMessage, AgentResponse } from "../types";
import { getEnv, validateApiKey } from "../core/env";
import { logger } from "../core/logger";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { OllamaProvider } from "./providers/ollama";
import { RetryLogic, ToolCache, mergeConfig } from "./smart-tool-calling";

export class Agent {
  private provider: any;
  private config: AgentConfig;
  private retryLogic?: RetryLogic;
  private toolCache?: ToolCache;

  constructor(config: AgentConfig) {
    // Merge with env defaults
    const env = getEnv();
    this.config = {
      ...config,
      apiKey: config.apiKey || this.getApiKeyFromEnv(config.provider, env),
    };

    // Validate API key
    validateApiKey(this.config.provider, this.config.apiKey);

    // Initialize provider
    this.provider = this.createProvider();

    // Initialize smart tool calling if configured
    if (this.config.toolConfig) {
      const mergedConfig = mergeConfig(this.config.toolConfig);

      this.retryLogic = new RetryLogic({
        maxRetries: mergedConfig.maxRetries,
        timeout: mergedConfig.toolTimeout,
        debug: mergedConfig.debug,
      });

      if (mergedConfig.cacheResults.enabled) {
        this.toolCache = new ToolCache({
          enabled: mergedConfig.cacheResults.enabled,
          ttl: mergedConfig.cacheResults.ttl!,
          maxSize: mergedConfig.cacheResults.maxSize!,
        });
      }
    }

    logger.info(
      `Agent created with provider: ${config.provider}${this.config.toolConfig ? " (Smart Tool Calling enabled)" : ""}`
    );
  }

  private getApiKeyFromEnv(provider: string, env: any): string | undefined {
    switch (provider) {
      case "openai":
        return env.openaiApiKey;
      case "anthropic":
        return env.anthropicApiKey;
      case "gemini":
        return env.geminiApiKey;
      case "ollama":
        return undefined; // Ollama doesn't need API key
      default:
        return undefined;
    }
  }

  private createProvider(): any {
    switch (this.config.provider) {
      case "openai":
        return new OpenAIProvider(this.config);
      case "anthropic":
        return new AnthropicProvider(this.config);
      case "gemini":
        return new GeminiProvider(this.config);
      case "ollama":
        return new OllamaProvider(this.config);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  async chat(messages: AgentMessage[] | string): Promise<AgentResponse> {
    // Convert string to messages array
    const messageArray: AgentMessage[] =
      typeof messages === "string"
        ? [{ role: "user", content: messages }]
        : messages;

    // Add system message if configured
    if (this.config.system && !messageArray.some((m) => m.role === "system")) {
      messageArray.unshift({
        role: "system",
        content: this.config.system,
      });
    }

    // Call provider directly - smart tool calling is used for individual tool execution
    return this.provider.chat(messageArray);
  }

  /**
   * Execute a tool with retry logic and caching if configured
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.config.tools?.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Check cache first
    if (this.toolCache) {
      const cacheKey = ToolCache.generateKey(toolName, params);
      const cached = this.toolCache.get(cacheKey);

      if (cached !== null) {
        logger.debug(`Cache hit for tool: ${toolName}`);
        return cached;
      }
    }

    // Execute with retry logic if configured
    if (this.retryLogic) {
      const result = await this.retryLogic.executeWithRetry(tool, params);

      if (!result.success) {
        throw result.error || new Error(`Tool execution failed: ${toolName}`);
      }

      // Cache successful result
      if (this.toolCache && result.result !== undefined) {
        const cacheKey = ToolCache.generateKey(toolName, params);
        this.toolCache.set(cacheKey, result.result);
      }

      return result.result;
    }

    // Execute without retry logic
    return tool.handler(params);
  }

  async execute(input: string): Promise<string> {
    const response = await this.chat(input);
    return response.content;
  }

  /**
   * Cleanup resources (stop cache cleanup timers, etc.)
   */
  cleanup(): void {
    if (this.toolCache) {
      this.toolCache.stopAutoCleanup();
    }
  }
}

/**
 * Create an AI agent with one line
 *
 * @example
 * ```ts
 * const agent = createAgent({
 *   provider: 'openai',
 *   model: 'gpt-4-turbo-preview'
 * });
 *
 * const response = await agent.chat('Hello!');
 * ```
 */
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
