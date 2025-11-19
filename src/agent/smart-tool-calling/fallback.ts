/**
 * Fallback Provider
 * Handles fallback to alternative LLM providers
 */

import { ProviderConfig } from "./config";
import { Agent, AgentResponse } from "./retry-logic";

/**
 * Fallback Provider Handler
 * Creates and manages fallback agent instances
 */
export class FallbackProvider {
  private config: ProviderConfig;
  private fallbackAgent?: Agent;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Execute with fallback provider
   * @param message Message to send
   * @param tools Tools to provide to fallback agent
   * @returns Agent response
   */
  async execute(message: string, tools?: any[]): Promise<AgentResponse> {
    if (!this.fallbackAgent) {
      this.fallbackAgent = await this.createFallbackAgent(tools);
    }

    return this.fallbackAgent.chat(message);
  }

  /**
   * Create fallback agent instance
   * @param tools Tools to provide
   * @returns Agent instance
   */
  private async createFallbackAgent(tools?: any[]): Promise<Agent> {
    // This will be implemented when we integrate with the actual createAgent
    // For now, return a placeholder that will be replaced during integration
    throw new Error(
      "Fallback agent creation not yet integrated. This will be implemented during createAgent integration."
    );
  }

  /**
   * Check if fallback is available
   * @returns True if fallback can be used
   */
  isAvailable(): boolean {
    return !!this.config && !!this.config.provider;
  }

  /**
   * Get fallback provider info
   * @returns Provider information
   */
  getInfo(): {
    provider: string;
    model?: string;
  } {
    return {
      provider: this.config.provider,
      model: this.config.model,
    };
  }
}
