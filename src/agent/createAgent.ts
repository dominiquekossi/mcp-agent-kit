/**
 * Create Agent - Main entry point for creating AI agents
 */

import { AgentConfig, AgentMessage, AgentResponse } from '../types';
import { getEnv, validateApiKey } from '../core/env';
import { logger } from '../core/logger';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import { OllamaProvider } from './providers/ollama';
import { RetryLogic, ToolCache } from './smart-tool-calling';

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
      this.retryLogic = new RetryLogic(this.config.toolConfig);
      
      if (this.config.toolConfig.cacheResults?.enabled) {
        this.toolCache = new ToolCache({
          enabled: true,
          ttl: this.config.toolConfig.cacheResults.ttl || 300000,
          maxSize: this.config.toolConfig.cacheResults.maxSize || 100,
        });
      }
    }
    
    logger.info(`Agent created with provider: ${config.provider}${this.config.toolConfig ? ' (Smart Tool Calling enabled)' : ''}`);
  }

  private getApiKeyFromEnv(provider: string, env: any): string | undefined {
    switch (provider) {
      case 'openai':
        return env.openaiApiKey;
      case 'anthropic':
        return env.anthropicApiKey;
      case 'gemini':
        return env.geminiApiKey;
      case 'ollama':
        return undefined; // Ollama doesn't need API key
      default:
        return undefined;
    }
  }

  private createProvider(): any {
    switch (this.config.provider) {
      case 'openai':
        return new OpenAIProvider(this.config);
      case 'anthropic':
        return new AnthropicProvider(this.config);
      case 'gemini':
        return new GeminiProvider(this.config);
      case 'ollama':
        return new OllamaProvider(this.config);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  async chat(messages: AgentMessage[] | string): Promise<AgentResponse> {
    // Convert string to messages array
    const messageArray: AgentMessage[] = typeof messages === 'string'
      ? [{ role: 'user', content: messages }]
      : messages;

    // Add system message if configured
    if (this.config.system && !messageArray.some(m => m.role === 'system')) {
      messageArray.unshift({
        role: 'system',
        content: this.config.system,
      });
    }

    // Use smart tool calling if configured
    if (this.retryLogic && this.config.tools && this.config.tools.length > 0) {
      const toolNames = this.config.tools.map(t => t.name);
      return this.retryLogic.executeWithRetry(
        (msgs) => this.provider.chat(msgs),
        messageArray,
        toolNames
      );
    }

    return this.provider.chat(messageArray);
  }

  async execute(input: string): Promise<string> {
    const response = await this.chat(input);
    return response.content;
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
