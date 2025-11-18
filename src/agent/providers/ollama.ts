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
      const model = this.config.model || 'llama2';
      
      logger.debug(`Ollama: Calling ${model} at ${this.baseUrl}`);

      // Convert messages to Ollama format
      const ollamaMessages = this.convertMessages(messages);

      // Make request to Ollama API
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages: ollamaMessages,
          stream: false,
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
      if (data.message?.tool_calls) {
        toolCalls = data.message.tool_calls.map((tc: any) => ({
          name: tc.function?.name || tc.name,
          arguments: tc.function?.arguments || tc.arguments,
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
      // Ollama uses 'system', 'user', 'assistant' roles
      let role = msg.role;
      
      // Convert 'tool' role to 'assistant' for Ollama
      if (role === 'tool') {
        role = 'assistant';
      }

      return {
        role,
        content: msg.content,
      };
    });
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
