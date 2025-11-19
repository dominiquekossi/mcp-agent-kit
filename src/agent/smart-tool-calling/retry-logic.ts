/**
 * Retry Logic
 * Handles retry attempts when tools are not called
 */

import { SmartToolConfig, RetryAttempt, ToolCallResult } from "./config";
import { PromptEnhancer } from "./prompt-enhancer";
import { ToolCache } from "./cache";

/**
 * Agent response interface (simplified)
 */
export interface AgentResponse {
  content: string;
  toolCalls?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Agent interface (simplified)
 */
export interface Agent {
  chat(message: string): Promise<AgentResponse>;
}

/**
 * Retry Logic Handler
 * Manages retry attempts and tool call verification
 */
export class RetryLogic {
  private promptEnhancer: PromptEnhancer;
  private cache?: ToolCache;
  private config: Required<Omit<SmartToolConfig, "fallbackProvider">> &
    Pick<SmartToolConfig, "fallbackProvider">;

  constructor(
    config: Required<Omit<SmartToolConfig, "fallbackProvider">> &
      Pick<SmartToolConfig, "fallbackProvider">
  ) {
    this.config = config;
    this.promptEnhancer = new PromptEnhancer();

    // Initialize cache if enabled
    if (config.cacheResults.enabled) {
      this.cache = new ToolCache(config.cacheResults);
    }
  }

  /**
   * Execute agent call with retry logic
   * @param agent Agent instance
   * @param message User message
   * @param toolNames Available tool names (for cache key)
   * @returns Tool call result
   */
  async executeWithRetry(
    agent: Agent,
    message: string,
    toolNames: string[] = []
  ): Promise<ToolCallResult> {
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastResponse: AgentResponse | null = null;
    let lastError: Error | null = null;

    // Check cache first
    if (this.cache && toolNames.length > 0) {
      const cacheKey = this.cache.generateKey("query", { message, toolNames });
      const cached = this.cache.get(cacheKey);
      if (cached) {
        if (this.config.debug) {
          console.log("[RetryLogic] Cache hit for message:", message);
        }
        return {
          success: true,
          toolCalled: true,
          result: cached,
          attempts: [],
          usedFallback: false,
          cached: true,
          duration: Date.now() - startTime,
        };
      }
    }

    // Try with retries
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Enhance message based on attempt number
        const enhancedMessage =
          attempt === 1 && !this.config.forceToolUse
            ? message
            : this.promptEnhancer.enhance(message, attempt);

        if (this.config.debug) {
          console.log(
            `[RetryLogic] Attempt ${attempt}/${this.config.maxRetries}`
          );
          console.log(`[RetryLogic] Enhanced message:`, enhancedMessage);
        }

        // Record attempt
        attempts.push({
          attempt,
          maxRetries: this.config.maxRetries,
          message,
          enhancedMessage,
          timestamp: Date.now(),
        });

        // Call agent with timeout
        const response = await this.callWithTimeout(agent, enhancedMessage);
        lastResponse = response;

        // Check if tool was called
        const toolCalled = this.wasToolCalled(response);

        if (toolCalled) {
          // Success! Tool was called
          if (this.config.debug) {
            console.log("[RetryLogic] Tool called successfully");
          }

          // Cache the result
          if (this.cache && toolNames.length > 0) {
            const cacheKey = this.cache.generateKey("query", {
              message,
              toolNames,
            });
            this.cache.set(cacheKey, response);
          }

          return {
            success: true,
            toolCalled: true,
            result: response,
            attempts,
            usedFallback: false,
            cached: false,
            duration: Date.now() - startTime,
          };
        }

        // Tool not called - handle based on config
        if (this.config.debug) {
          console.warn(
            `[RetryLogic] Tool not called on attempt ${attempt}/${this.config.maxRetries}`
          );
        }

        // If this is the last attempt, handle according to strategy
        if (attempt === this.config.maxRetries) {
          return this.handleMaxRetriesReached(
            message,
            lastResponse,
            attempts,
            startTime
          );
        }

        // Continue to next retry
      } catch (error) {
        lastError = error as Error;
        if (this.config.debug) {
          console.error(`[RetryLogic] Error on attempt ${attempt}:`, error);
        }

        // If this is the last attempt, handle error
        if (attempt === this.config.maxRetries) {
          return {
            success: false,
            toolCalled: false,
            error: lastError,
            attempts,
            usedFallback: false,
            cached: false,
            duration: Date.now() - startTime,
          };
        }
      }
    }

    // Should not reach here, but handle just in case
    return {
      success: false,
      toolCalled: false,
      error: lastError || new Error("Max retries reached"),
      result: lastResponse,
      attempts,
      usedFallback: false,
      cached: false,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Call agent with timeout
   * @param agent Agent instance
   * @param message Message to send
   * @returns Agent response
   */
  private async callWithTimeout(
    agent: Agent,
    message: string
  ): Promise<AgentResponse> {
    return Promise.race([
      agent.chat(message),
      new Promise<AgentResponse>((_, reject) =>
        setTimeout(
          () => reject(new Error("Tool call timeout")),
          this.config.toolTimeout
        )
      ),
    ]);
  }

  /**
   * Check if tool was called in response
   * @param response Agent response
   * @returns True if tool was called
   */
  private wasToolCalled(response: AgentResponse): boolean {
    return !!(response.toolCalls && response.toolCalls.length > 0);
  }

  /**
   * Handle max retries reached
   * @param message Original message
   * @param lastResponse Last response received
   * @param attempts All attempts made
   * @param startTime Start time
   * @returns Tool call result
   */
  private async handleMaxRetriesReached(
    message: string,
    lastResponse: AgentResponse | null,
    attempts: RetryAttempt[],
    startTime: number
  ): Promise<ToolCallResult> {
    const strategy = this.config.onToolNotCalled;

    if (strategy === "error") {
      // Throw error
      throw new Error(
        `Tool was not called after ${this.config.maxRetries} attempts`
      );
    } else if (strategy === "warn") {
      // Log warning and return response
      console.warn(
        `[RetryLogic] Tool was not called after ${this.config.maxRetries} attempts. Returning response anyway.`
      );
      return {
        success: true,
        toolCalled: false,
        result: lastResponse,
        attempts,
        usedFallback: false,
        cached: false,
        duration: Date.now() - startTime,
      };
    } else if (strategy === "allow") {
      // Allow response without tool
      return {
        success: true,
        toolCalled: false,
        result: lastResponse,
        attempts,
        usedFallback: false,
        cached: false,
        duration: Date.now() - startTime,
      };
    } else {
      // strategy === 'retry' - try fallback if available
      if (this.config.fallbackProvider) {
        if (this.config.debug) {
          console.log("[RetryLogic] Attempting fallback provider");
        }
        // Fallback will be handled by caller
        return {
          success: false,
          toolCalled: false,
          result: lastResponse,
          attempts,
          usedFallback: false,
          cached: false,
          duration: Date.now() - startTime,
        };
      }

      // No fallback available
      throw new Error(
        `Tool was not called after ${this.config.maxRetries} attempts and no fallback provider configured`
      );
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cache) {
      this.cache.destroy();
    }
  }
}
