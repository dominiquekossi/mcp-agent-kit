/**
 * Anthropic/Claude Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { AgentConfig, AgentMessage, AgentResponse } from '../../types';
import { logger } from '../../core/logger';

export class AnthropicProvider {
  private client: Anthropic;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: AgentMessage[]): Promise<AgentResponse> {
    try {
      const model = this.config.model || 'claude-3-5-sonnet-20241022';
      
      logger.debug(`Anthropic: Calling ${model}`);

      // Separate system message
      const systemMessage = messages.find(m => m.role === 'system')?.content || this.config.system;
      const chatMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 0.7,
        system: systemMessage,
        messages: chatMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })) as any,
        tools: this.config.tools?.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        })),
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      // Handle tool calls
      const toolCalls = response.content
        .filter((c: any) => c.type === 'tool_use')
        .map((c: any) => ({
          name: c.name,
          arguments: c.input,
        }));

      return {
        content: text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error: any) {
      logger.error('Anthropic error:', error.message);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
}
