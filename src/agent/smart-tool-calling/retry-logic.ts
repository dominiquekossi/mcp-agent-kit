/**
 * Retry Logic for Smart Tool Calling
 */

import { AgentTool } from "../../types";

export interface RetryOptions {
  maxRetries: number;
  timeout: number;
  debug: boolean;
}

export interface RetryResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  duration: number;
}

/**
 * RetryLogic class handles retry logic with timeout support
 */
export class RetryLogic {
  constructor(private options: RetryOptions) {}

  /**
   * Execute a tool call with retry logic and timeout
   */
  async executeWithRetry<T = any>(
    tool: AgentTool,
    params: any
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let i = 0; i <= this.options.maxRetries; i++) {
      attempts++;

      try {
        if (this.options.debug) {
          console.log(
            `[RetryLogic] Attempt ${attempts} for tool: ${tool.name}`
          );
        }

        const result = await this.executeWithTimeout(tool, params);

        const duration = Date.now() - startTime;

        if (this.options.debug) {
          console.log(
            `[RetryLogic] Tool ${tool.name} succeeded on attempt ${attempts} (${duration}ms)`
          );
        }

        return {
          success: true,
          result,
          attempts,
          duration,
        };
      } catch (error) {
        lastError = error as Error;

        if (this.options.debug) {
          console.warn(
            `[RetryLogic] Tool ${tool.name} failed on attempt ${attempts}:`,
            error
          );
        }

        // If this is not the last attempt, wait before retrying
        if (i < this.options.maxRetries) {
          const delay = this.calculateBackoff(i);
          if (this.options.debug) {
            console.log(`[RetryLogic] Waiting ${delay}ms before retry...`);
          }
          await this.sleep(delay);
        }
      }
    }

    const duration = Date.now() - startTime;

    if (this.options.debug) {
      console.error(
        `[RetryLogic] Tool ${tool.name} failed after ${attempts} attempts (${duration}ms)`
      );
    }

    return {
      success: false,
      error: lastError,
      attempts,
      duration,
    };
  }

  /**
   * Execute tool with timeout
   */
  private async executeWithTimeout<T = any>(
    tool: AgentTool,
    params: any
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.options.timeout);

    try {
      // Create a promise that rejects on timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(
            new Error(`Tool execution timeout after ${this.options.timeout}ms`)
          );
        });
      });

      // Race between tool execution and timeout
      const result = await Promise.race([tool.handler(params), timeoutPromise]);

      return result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, etc.
    const baseDelay = 100;
    const maxDelay = 5000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
