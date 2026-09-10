/**
 * Ollama Provider - Local LLM support
 */

import axios from 'axios';
import { AgentConfig, AgentMessage, AgentResponse } from '../../types';
import { logger } from '../../core/logger';
import { getEnv } from '../../core/env';

export class OllamaProvider {
  private config: AgentConfig;
  private baseUrl: string;

  constructor(config: AgentConfig) {
    this.config = config;
    const env = getEnv();
    this.baseUrl = env.ollamaHost || 'http://localhost:11434';
  }

  async chat(messages: AgentMessage[]): Promise<AgentResponse> {
    try {
      const model = this.config.model || 'llama3.1';

      logger.debug(`Ollama: Calling ${model} at ${this.baseUrl}`);

      const ollamaMessages = this.convertMessages(messages);

      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages: ollamaMessages,
          stream: false,
          // Without this the model never sees the tools, so it can never call
          // one — the same bug the other providers had.
          ...(this.config.tools?.length
            ? {
                tools: this.config.tools.map((tool) => ({
                  type: 'function',
                  function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                  },
                })),
              }
            : {}),
          options: {
            temperature: this.config.temperature ?? 0.7,
            num_predict: this.config.maxTokens,
          },
        },
        {
          timeout: 120000, // 2 minutes for local models
        }
      );

      const data = response.data;

      // Handle tool calls if present (Ollama supports function calling in some models)
      let toolCalls: any[] | undefined;
      if (data.message?.tool_calls?.length) {
        toolCalls = data.message.tool_calls.map((tc: any, index: number) => ({
          // Ollama does not issue call ids; synthesize one for the agent loop.
          id: tc.id || `ollama-${Date.now()}-${index}`,
          name: tc.function?.name || tc.name,
          arguments: this.parseArguments(
            tc.function?.arguments ?? tc.arguments
          ),
        }));
      }

      return {
        content: data.message?.content || '',
        toolCalls,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        logger.error('Ollama error: Cannot connect to Ollama server');
        throw new Error(
          `Cannot connect to Ollama at ${this.baseUrl}. ` +
          'Make sure Ollama is running (ollama serve)'
        );
      }

      logger.error('Ollama error:', error.message);
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  private convertMessages(messages: AgentMessage[]): any[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          ...(msg.name ? { name: msg.name } : {}),
        };
      }

      if (msg.role === 'assistant' && msg.toolCalls?.length) {
        return {
          role: 'assistant',
          content: msg.content || '',
          tool_calls: msg.toolCalls.map((tc) => ({
            function: {
              name: tc.name,
              arguments: tc.arguments ?? {},
            },
          })),
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });
  }

  private parseArguments(raw: any): any {
    if (typeof raw !== 'string') {
      return raw ?? {};
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error: any) {
      logger.error('Failed to list Ollama models:', error.message);
      return [];
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      logger.info(`Pulling Ollama model: ${modelName}`);

      await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName },
        { timeout: 600000 } // 10 minutes for model download
      );

      logger.info(`Model ${modelName} pulled successfully`);
    } catch (error: any) {
      logger.error(`Failed to pull model ${modelName}:`, error.message);
      throw error;
    }
  }
}
