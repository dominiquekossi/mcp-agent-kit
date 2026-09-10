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
      const model = this.config.model || 'claude-opus-5';

      logger.debug(`Anthropic: Calling ${model}`);

      // Separate system message
      const systemMessage =
        messages.find((m) => m.role === 'system')?.content || this.config.system;
      const chatMessages = messages.filter((m) => m.role !== 'system');

      const request: any = {
        model,
        max_tokens: this.config.maxTokens || 4096,
        system: systemMessage,
        messages: this.convertMessages(chatMessages),
        tools: this.config.tools?.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        })),
      };

      // Only send temperature when the caller asked for one: the current Claude
      // models reject sampling parameters, so passing a default would make every
      // request fail with a 400.
      if (this.config.temperature !== undefined) {
        request.temperature = this.config.temperature;
      }

      const response = await this.client.messages.create(request);

      // Text can arrive in any block, and a tool-using turn often puts the
      // tool_use block first — concatenate every text block instead of
      // reading content[0].
      const text = response.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');

      // Handle tool calls
      const toolCalls = response.content
        .filter((c: any) => c.type === 'tool_use')
        .map((c: any) => ({
          id: c.id,
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

  /**
   * Convert the neutral message format into Anthropic's block format.
   *
   * Anthropic expects tool results as `tool_result` blocks inside a single user
   * message, so consecutive tool messages are merged into one turn.
   */
  private convertMessages(messages: AgentMessage[]): any[] {
    const converted: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'tool') {
        const block = {
          type: 'tool_result',
          tool_use_id: msg.toolCallId,
          content: msg.content,
        };

        const previous = converted[converted.length - 1];
        const previousIsToolResult =
          previous &&
          previous.role === 'user' &&
          Array.isArray(previous.content) &&
          previous.content.every((c: any) => c.type === 'tool_result');

        if (previousIsToolResult) {
          previous.content.push(block);
        } else {
          converted.push({ role: 'user', content: [block] });
        }
        continue;
      }

      if (msg.role === 'assistant' && msg.toolCalls?.length) {
        const content: any[] = [];

        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }

        for (const call of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: call.id,
            name: call.name,
            input: call.arguments ?? {},
          });
        }

        converted.push({ role: 'assistant', content });
        continue;
      }

      converted.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    return converted;
  }
}
