/**
 * Retry Logic for Smart Tool Calling
 */

import { SmartToolConfig, AgentMessage, AgentResponse } from '../../types';
import { mergeConfig } from './config';
import { logger } from '../../core/logger';

export class RetryLogic {
  private config: Required<SmartToolConfig>;

  constructor(config?: SmartToolConfig) {
    this.config = mergeConfig(config);
  }

  /**
   * Execute agent chat with retry logic
   */
  async executeWithRetry(
    chatFn: (messages: AgentMessage[]) => Promise<AgentResponse>,
    messages: AgentMessage[],
    toolNames?: string[]
  ): Promise<AgentResponse> {
    let attempt = 0;
    let lastResponse: AgentResponse | null = null;
    let lastError: Error | null = null;

    while (attempt <= this.config.maxRetries) {
      attempt++;

      try {
        if (this.config.debug) {
          logger.debug(`Tool call attempt ${attempt}/${this.config.maxRetries + 1}`);
        }

        // Execute with timeout
        const response = await this.executeWithTimeout(chatFn, messages);
        lastResponse = response;

        // Check if tools were called
        const toolCalled = this.wasToolCalled(response);

        if (toolCalled || !this.config.forceToolUse) {
          // Success - tool was called or we don't require it
          if (this.config.debug) {
            logger.debug(`Tool call ${toolCalled ? 'succeeded' : 'not required'} on attempt ${attempt}`);
          }
          return response;
        }

        // Tool was not called but we require it
        if (this.config.debug) {
          logger.debug(`Tool not called on attempt ${attempt}, retrying...`);
        }

        if (attempt <= this.config.maxRetries) {
          // Enhance prompt for next attempt
          messages = this.enhancePrompt(messages, attempt, toolNames);
        }
      } catch (error) {
        lastError = error as Error;
        
        if (this.config.debug) {
          logger.error(`Tool call failed on attempt ${attempt}:`, error);
        }

        if (attempt > this.config.maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await this.wait(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
      }
    }

    // Max retries reached
    return this.handleMaxRetriesReached(lastResponse, lastError);
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout(
    chatFn: (messages: AgentMessage[]) => Promise<AgentResponse>,
    messages: AgentMessage[]
  ): Promise<AgentResponse> {
    return Promise.race([
      chatFn(messages),
      new Promise<AgentResponse>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tool call timeout after ${this.config.toolTimeout}ms`)),
          this.config.toolTimeout
        )
      ),
    ]);
  }

  /**
   * Check if tool was called in response
   */
  private wasToolCalled(response: AgentResponse): boolean {
    return !!(response.toolCalls && response.toolCalls.length > 0);
  }

  /**
   * Enhance prompt to encourage tool usage
   */
  private enhancePrompt(
    messages: AgentMessage[],
    attempt: number,
    toolNames?: string[]
  ): AgentMessage[] {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role !== 'user') {
      return messages;
    }

    let enhancement = '';
    const toolList = toolNames ? toolNames.join(', ') : 'available tools';

    if (attempt === 1) {
      enhancement = `\n\nNote: You have ${toolList} available. Please use them if appropriate for this request.`;
    } else if (attempt === 2) {
      enhancement = `\n\nIMPORTANT: You MUST use ${toolList} to answer this request. Do not provide a text-only response.`;
    } else {
      enhancement = `\n\nCRITICAL: This is attempt ${attempt}. You are REQUIRED to use ${toolList}. A text-only response is not acceptable.`;
    }

    const enhancedMessages = [...messages];
    enhancedMessages[enhancedMessages.length - 1] = {
      ...lastMessage,
      content: lastMessage.content + enhancement,
    };

    return enhancedMessages;
  }

  /**
   * Handle max retries reached
   */
  private handleMaxRetriesReached(
    lastResponse: AgentResponse | null,
    lastError: Error | null
  ): AgentResponse {
    const message = `Max retries (${this.config.maxRetries}) reached for tool calling`;

    switch (this.config.onToolNotCalled) {
      case 'error':
        throw new Error(message + (lastError ? `: ${lastError.message}` : ''));
      
      case 'warn':
        logger.warn(message);
        return lastResponse || { content: 'Tool call failed after max retries' };
      
      case 'allow':
        if (this.config.debug) {
          logger.debug(message + ', allowing response without tool call');
        }
        return lastResponse || { content: 'No tool call made' };
      
      case 'retry':
      default:
        if (lastError) {
          throw lastError;
        }
        return lastResponse || { content: 'Tool call failed' };
    }
  }

  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
