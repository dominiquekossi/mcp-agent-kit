/**
 * OpenAI Provider
 */

import OpenAI from 'openai';
import { AgentConfig, AgentMessage, AgentResponse } from '../../types';
import { logger } from '../../core/logger';

export class OpenAIProvider {
  private client: OpenAI;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: AgentMessage[]): Promise<AgentResponse> {
    try {
      const model = this.config.model || 'gpt-4-turbo-preview';
      
      logger.debug(`OpenAI: Calling ${model}`);

      const response = await this.client.chat.completions.create({
        model,
        messages: messages as any,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens,
        tools: this.config.tools?.map(tool => ({
          type: 'function' as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Handle tool calls
      const toolCalls = message.tool_calls?.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      return {
        content: message.content || '',
        toolCalls,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      logger.error('OpenAI error:', error.message);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}
