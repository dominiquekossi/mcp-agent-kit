/**
 * LLM Router - Intelligent routing between multiple LLMs based on rules
 */

import { LLMRouterConfig, RouterRule, AgentMessage, AgentResponse } from '../types';
import { Agent, createAgent } from '../agent/createAgent';
import { logger, createLogger, Logger } from '../core/logger';

export class LLMRouter {
  private config: LLMRouterConfig;
  private rules: RouterRule[];
  private agents: Map<string, Agent>;
  private logger: Logger;
  private fallbackAgent: Agent | null = null;

  constructor(config: LLMRouterConfig) {
    this.config = {
      ...config,
      retryAttempts: config.retryAttempts ?? 3,
      logLevel: config.logLevel || 'info',
    };

    this.logger = createLogger(this.config.logLevel, 'llm-router');
    this.rules = config.rules;
    this.agents = new Map();

    // Initialize agents for each rule
    this.initializeAgents();

    this.logger.info(`LLM Router initialized with ${this.rules.length} rules`);
  }

  private initializeAgents(): void {
    // Create agents for each rule
    this.rules.forEach((rule, index) => {
      const key = this.getAgentKey(rule.use.provider, rule.use.model);
      
      if (!this.agents.has(key)) {
        const agent = createAgent({
          provider: rule.use.provider,
          model: rule.use.model,
        });
        this.agents.set(key, agent);
        this.logger.debug(`Initialized agent: ${key}`);
      }

      // Set default agent
      if (rule.default) {
        this.fallbackAgent = this.agents.get(key)!;
        this.logger.debug(`Default agent set: ${key}`);
      }
    });

    // Create fallback agent if specified
    if (this.config.fallback) {
      const key = this.getAgentKey(
        this.config.fallback.provider,
        this.config.fallback.model
      );
      
      if (!this.agents.has(key)) {
        const agent = createAgent({
          provider: this.config.fallback.provider,
          model: this.config.fallback.model,
        });
        this.agents.set(key, agent);
        this.logger.debug(`Fallback agent initialized: ${key}`);
      }
      
      this.fallbackAgent = this.agents.get(key)!;
    }
  }

  private getAgentKey(provider: string, model?: string): string {
    return model ? `${provider}:${model}` : provider;
  }

  /**
   * Add a new routing rule
   */
  addRule(rule: RouterRule): void {
    this.rules.push(rule);
    
    const key = this.getAgentKey(rule.use.provider, rule.use.model);
    if (!this.agents.has(key)) {
      const agent = createAgent({
        provider: rule.use.provider,
        model: rule.use.model,
      });
      this.agents.set(key, agent);
      this.logger.debug(`Added new rule and agent: ${key}`);
    }

    if (rule.default) {
      this.fallbackAgent = this.agents.get(key)!;
    }
  }

  /**
   * Route a message to the appropriate LLM based on rules
   */
  async route(input: string | AgentMessage[]): Promise<AgentResponse> {
    const inputText = typeof input === 'string' 
      ? input 
      : input.find(m => m.role === 'user')?.content || '';

    this.logger.debug(`Routing input: "${inputText.substring(0, 50)}..."`);

    // Try each rule in order
    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i];

      // Skip default rules in first pass
      if (rule.default) continue;

      // Check if rule matches
      if (rule.when && rule.when(inputText)) {
        const key = this.getAgentKey(rule.use.provider, rule.use.model);
        this.logger.info(`Rule ${i + 1} matched: ${key}`);

        const agent = this.agents.get(key);
        if (!agent) {
          this.logger.warn(`Agent not found for rule: ${key}`);
          continue;
        }

        // Try to execute with retry
        const response = await this.executeWithRetry(agent, input, key);
        if (response) {
          return response;
        }
      }
    }

    // No rule matched, use default/fallback
    if (this.fallbackAgent) {
      this.logger.info('No rule matched, using fallback agent');
      const response = await this.executeWithRetry(
        this.fallbackAgent,
        input,
        'fallback'
      );
      
      if (response) {
        return response;
      }
    }

    throw new Error('All routing attempts failed and no fallback available');
  }

  private async executeWithRetry(
    agent: Agent,
    input: string | AgentMessage[],
    agentKey: string
  ): Promise<AgentResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt}/${this.config.retryAttempts} for ${agentKey}`);
        
        const response = await agent.chat(input);
        
        this.logger.info(`Successfully routed to ${agentKey}`);
        return response;
        
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt} failed for ${agentKey}: ${error.message}`
        );

        // Exponential backoff
        if (attempt < this.config.retryAttempts!) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          this.logger.debug(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `All ${this.config.retryAttempts} attempts failed for ${agentKey}: ${lastError?.message}`
    );
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    totalRules: number;
    totalAgents: number;
    hasFallback: boolean;
  } {
    return {
      totalRules: this.rules.length,
      totalAgents: this.agents.size,
      hasFallback: this.fallbackAgent !== null,
    };
  }

  /**
   * List all registered agents
   */
  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}

/**
 * Create an LLM router with intelligent routing rules
 * 
 * @example
 * ```ts
 * const router = createLLMRouter({
 *   rules: [
 *     {
 *       when: (input) => input.length < 200,
 *       use: { provider: 'openai', model: 'gpt-4-turbo-preview' }
 *     },
 *     {
 *       when: (input) => input.includes('code'),
 *       use: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' }
 *     },
 *     {
 *       default: true,
 *       use: { provider: 'openai', model: 'gpt-4-turbo-preview' }
 *     }
 *   ]
 * });
 * 
 * const response = await router.route('Write a function to sort an array');
 * ```
 */
export function createLLMRouter(config: LLMRouterConfig): LLMRouter {
  return new LLMRouter(config);
}
