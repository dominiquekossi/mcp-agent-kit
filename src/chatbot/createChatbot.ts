/**
 * Chatbot - Conversational AI with memory and context management
 */

import { ChatbotConfig, ChatMessage, AgentMessage, AgentResponse } from '../types';
import { Agent } from '../agent/createAgent';
import { LLMRouter } from '../router/createLLMRouter';
import { logger, createLogger, Logger } from '../core/logger';

export class Chatbot {
  private config: ChatbotConfig;
  private agent: Agent | null = null;
  private router: LLMRouter | null = null;
  private history: ChatMessage[] = [];
  private logger: Logger;
  private maxHistory: number;
  private systemPrompt: string | undefined;

  constructor(config: ChatbotConfig) {
    this.config = config;
    this.maxHistory = config.maxHistory || 10;
    this.systemPrompt = config.system;

    // Must have either agent or router
    if (!config.agent && !config.router) {
      throw new Error('Chatbot requires either an agent or router');
    }

    this.agent = config.agent || null;
    this.router = config.router || null;

    this.logger = createLogger('info', 'chatbot');
    this.logger.info('Chatbot initialized');
  }

  /**
   * Send a message and get a response
   */
  async chat(message: string): Promise<string> {
    this.logger.debug(`User message: "${message.substring(0, 50)}..."`);

    // Add user message to history
    this.addToHistory('user', message);

    // Build messages array with context
    const messages = this.buildMessages();

    try {
      let response: AgentResponse;

      // Use router or agent
      if (this.router) {
        response = await this.router.route(messages);
      } else if (this.agent) {
        response = await this.agent.chat(messages);
      } else {
        throw new Error('No agent or router available');
      }

      // Add assistant response to history
      this.addToHistory('assistant', response.content);

      this.logger.debug(`Assistant response: "${response.content.substring(0, 50)}..."`);
      
      return response.content;

    } catch (error: any) {
      this.logger.error('Chat error:', error.message);
      throw error;
    }
  }

  /**
   * Build messages array with system prompt and history
   */
  private buildMessages(): AgentMessage[] {
    const messages: AgentMessage[] = [];

    // Add system prompt if configured
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    // Add conversation history
    this.history.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    return messages;
  }

  /**
   * Add message to history with automatic pruning
   */
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Prune old messages if exceeding limit
    if (this.history.length > this.maxHistory * 2) {
      // Keep last maxHistory pairs (user + assistant)
      const toRemove = this.history.length - (this.maxHistory * 2);
      this.history.splice(0, toRemove);
      this.logger.debug(`Pruned ${toRemove} old messages from history`);
    }
  }

  /**
   * Reset conversation history
   */
  reset(): void {
    this.history = [];
    this.logger.info('Conversation history reset');
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    oldestMessage?: Date;
    newestMessage?: Date;
  } {
    const userMessages = this.history.filter(m => m.role === 'user').length;
    const assistantMessages = this.history.filter(m => m.role === 'assistant').length;

    return {
      messageCount: this.history.length,
      userMessages,
      assistantMessages,
      oldestMessage: this.history[0]?.timestamp,
      newestMessage: this.history[this.history.length - 1]?.timestamp,
    };
  }

  /**
   * Set system prompt (will apply to next messages)
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    this.logger.info('System prompt updated');
  }

  /**
   * Get current system prompt
   */
  getSystemPrompt(): string | undefined {
    return this.systemPrompt;
  }

  /**
   * Set maximum history size
   */
  setMaxHistory(max: number): void {
    this.maxHistory = max;
    this.logger.info(`Max history set to ${max}`);
  }
}

/**
 * Create a chatbot with conversation memory
 * 
 * @example
 * ```ts
 * // With agent
 * const bot = createChatbot({
 *   agent: createAgent({ provider: 'openai' }),
 *   system: 'You are a helpful assistant',
 *   maxHistory: 10
 * });
 * 
 * const response = await bot.chat('Hello!');
 * console.log(response);
 * 
 * // With router
 * const bot2 = createChatbot({
 *   router: createLLMRouter({ rules: [...] }),
 *   maxHistory: 20
 * });
 * ```
 */
export function createChatbot(config: ChatbotConfig): Chatbot {
  return new Chatbot(config);
}
