/**
 * API Request - Simplified HTTP requests with retry, timeout, and logging
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { APIRequestConfig, APIResponse } from '../types';
import { logger, createLogger, Logger } from '../core/logger';

class APIClient {
  private logger: Logger;

  constructor() {
    this.logger = createLogger('info', 'api-client');
  }

  /**
   * Make an HTTP request with retry and timeout
   */
  async request<T = any>(config: APIRequestConfig): Promise<APIResponse<T>> {
    const {
      name = 'unnamed',
      url,
      method = 'GET',
      headers = {},
      query = {},
      body,
      timeout = 30000,
      retries = 3,
    } = config;

    this.logger.info(`[${name}] ${method} ${url}`);

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`[${name}] Attempt ${attempt}/${retries}`);

        const axiosConfig: AxiosRequestConfig = {
          url,
          method,
          headers,
          params: query,
          data: body,
          timeout,
          validateStatus: () => true, // Don't throw on any status
        };

        const response: AxiosResponse<T> = await axios(axiosConfig);
        const duration = Date.now() - startTime;

        // Check if response is successful (2xx or 3xx)
        if (response.status >= 200 && response.status < 400) {
          this.logger.info(
            `[${name}] Success: ${response.status} (${duration}ms)`
          );

          return {
            data: response.data,
            status: response.status,
            headers: response.headers as Record<string, string>,
            duration,
          };
        }

        // 4xx errors - don't retry (client error)
        if (response.status >= 400 && response.status < 500) {
          this.logger.error(
            `[${name}] Client error: ${response.status} - ${response.statusText}`
          );
          throw new Error(
            `HTTP ${response.status}: ${response.statusText || 'Client Error'}`
          );
        }

        // 5xx errors - retry (server error)
        if (response.status >= 500) {
          lastError = new Error(
            `HTTP ${response.status}: ${response.statusText || 'Server Error'}`
          );
          this.logger.warn(
            `[${name}] Server error: ${response.status} (attempt ${attempt}/${retries})`
          );

          if (attempt < retries) {
            const delay = this.calculateBackoff(attempt);
            this.logger.debug(`[${name}] Waiting ${delay}ms before retry...`);
            await this.sleep(delay);
            continue;
          }
        }
      } catch (error: any) {
        lastError = error;

        // Network errors or timeouts - retry
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          this.logger.warn(
            `[${name}] Timeout (attempt ${attempt}/${retries})`
          );
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.logger.warn(
            `[${name}] Network error: ${error.code} (attempt ${attempt}/${retries})`
          );
        } else {
          this.logger.error(`[${name}] Request failed:`, error.message);
        }

        if (attempt < retries) {
          const delay = this.calculateBackoff(attempt);
          this.logger.debug(`[${name}] Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    this.logger.error(
      `[${name}] All ${retries} attempts failed (${duration}ms)`
    );
    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // 1s, 2s, 4s, 8s...
    return Math.min(Math.pow(2, attempt - 1) * 1000, 10000);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = any>(
    url: string,
    config?: Partial<APIRequestConfig>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    });
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = any>(
    url: string,
    body?: any,
    config?: Partial<APIRequestConfig>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      body,
    });
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(
    url: string,
    body?: any,
    config?: Partial<APIRequestConfig>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'PUT',
      body,
    });
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(
    url: string,
    config?: Partial<APIRequestConfig>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    });
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = any>(
    url: string,
    body?: any,
    config?: Partial<APIRequestConfig>
  ): Promise<APIResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'PATCH',
      body,
    });
  }
}

// Export singleton instance
export const api = new APIClient();

/**
 * Create a new API client instance
 */
export function createAPIClient(): APIClient {
  return new APIClient();
}
