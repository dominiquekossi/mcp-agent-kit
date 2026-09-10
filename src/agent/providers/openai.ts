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
      const model = this.config.model || 'gpt-4o';

      logger.debug(`OpenAI: Calling ${model}`);

      const response = await this.client.chat.completions.create({
        model,
        messages: this.convertMessages(messages),
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
      const toolCalls = message.tool_calls?.map(tc => {
        const fn = (tc as any).function;
        return {
          id: tc.id,
          name: fn.name,
          arguments: this.parseArguments(fn.arguments),
        };
      });

      return {
        content: message.content || '',
        toolCalls: toolCalls?.length ? toolCalls : undefined,
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

  /**
   * Convert the neutral message format into OpenAI's wire format, carrying
   * assistant tool calls and tool results so a multi-turn tool loop keeps
   * its context.
   */
  private convertMessages(messages: AgentMessage[]): any[] {
    return messages.map((msg) => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.toolCallId,
          content: msg.content,
        };
      }

      if (msg.role === 'assistant' && msg.toolCalls?.length) {
        return {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments:
                typeof tc.arguments === 'string'
                  ? tc.arguments
                  : JSON.stringify(tc.arguments ?? {}),
            },
          })),
        };
      }

      return { role: msg.role, content: msg.content };
    });
  }

  private parseArguments(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      // A model can emit malformed JSON; hand the raw string to the caller
      // instead of throwing away the whole response.
      logger.warn('OpenAI: could not parse tool arguments as JSON');
      return raw;
    }
  }
}
