/**
 * Create Agent - Main entry point for creating AI agents
 */

import {
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentTool,
  SmartToolConfig,
  ToolResult,
} from "../types";
import { getEnv, validateApiKey } from "../core/env";
import { logger } from "../core/logger";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { OllamaProvider } from "./providers/ollama";
import {
  RetryLogic,
  ToolCache,
  PromptEnhancer,
  mergeConfig,
} from "./smart-tool-calling";

export class Agent {
  private provider: any;
  private config: AgentConfig;
  private toolConfig: Required<SmartToolConfig>;
  private retryLogic?: RetryLogic;
  private toolCache?: ToolCache;
  private promptEnhancer?: PromptEnhancer;

  constructor(config: AgentConfig) {
    // Merge with env defaults
    const env = getEnv();
    this.config = {
      ...config,
      tools: config.tools ? [...config.tools] : [],
      apiKey: config.apiKey || this.getApiKeyFromEnv(config.provider, env),
    };

    // Validate API key
    validateApiKey(this.config.provider, this.config.apiKey);

    // Initialize provider
    this.provider = this.createProvider();

    // Smart tool calling always has a resolved config so the tool loop can rely
    // on it; retry and cache stay opt-in via `toolConfig`.
    this.toolConfig = mergeConfig(this.config.toolConfig);

    if (this.config.toolConfig) {
      this.retryLogic = new RetryLogic({
        maxRetries: this.toolConfig.maxRetries,
        timeout: this.toolConfig.toolTimeout,
        debug: this.toolConfig.debug,
      });

      if (this.toolConfig.cacheResults.enabled) {
        this.toolCache = new ToolCache({
          enabled: this.toolConfig.cacheResults.enabled,
          ttl: this.toolConfig.cacheResults.ttl!,
          maxSize: this.toolConfig.cacheResults.maxSize!,
          debug: this.toolConfig.debug,
        });
      }
    }

    if (this.toolConfig.forceToolUse) {
      this.promptEnhancer = new PromptEnhancer({
        forceToolUse: this.toolConfig.forceToolUse,
        debug: this.toolConfig.debug,
      });
    }

    logger.info(
      `Agent created with provider: ${config.provider}${this.config.toolConfig ? " (Smart Tool Calling enabled)" : ""}`
    );
  }

  private getApiKeyFromEnv(provider: string, env: any): string | undefined {
    switch (provider) {
      case "openai":
        return env.openaiApiKey;
      case "anthropic":
        return env.anthropicApiKey;
      case "gemini":
        return env.geminiApiKey;
      case "ollama":
        return undefined; // Ollama doesn't need API key
      default:
        return undefined;
    }
  }

  private createProvider(): any {
    switch (this.config.provider) {
      case "openai":
        return new OpenAIProvider(this.config);
      case "anthropic":
        return new AnthropicProvider(this.config);
      case "gemini":
        return new GeminiProvider(this.config);
      case "ollama":
        return new OllamaProvider(this.config);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Register extra tools on a live agent. The provider reads the same array,
   * so tools added here reach the model on the next call.
   */
  registerTools(tools: AgentTool[]): this {
    if (!this.config.tools) {
      this.config.tools = [];
    }

    for (const tool of tools) {
      const existing = this.config.tools.findIndex((t) => t.name === tool.name);
      if (existing >= 0) {
        this.config.tools[existing] = tool;
      } else {
        this.config.tools.push(tool);
      }
    }

    logger.debug(`Registered ${tools.length} tool(s); total: ${this.config.tools.length}`);
    return this;
  }

  /** Tools currently visible to the model. */
  listTools(): AgentTool[] {
    return [...(this.config.tools || [])];
  }

  /**
   * Attach a tool source — typically an MCP orchestrator — so every tool it
   * exposes becomes callable by this agent.
   *
   * @example
   * ```ts
   * const mcp = await connectMCP({ servers: { fs: { command: 'npx', args: [] } } });
   * agent.use(mcp);
   * ```
   */
  use(source: { getTools(): AgentTool[] }): this {
    return this.registerTools(source.getTools());
  }

  /**
   * Send a message and get the model's answer.
   *
   * When the model asks for tools, they are executed and their results are fed
   * back to the model until it produces a final answer (up to `maxIterations`).
   * Set `toolConfig.autoExecuteTools = false` to get the raw tool calls instead.
   */
  async chat(messages: AgentMessage[] | string): Promise<AgentResponse> {
    // Convert string to messages array (copy: we append to it below)
    const conversation: AgentMessage[] =
      typeof messages === "string"
        ? [{ role: "user", content: messages }]
        : [...messages];

    // Add system message if configured
    if (this.config.system && !conversation.some((m) => m.role === "system")) {
      conversation.unshift({
        role: "system",
        content: this.config.system,
      });
    }

    const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const toolResults: ToolResult[] = [];

    let response = await this.callProvider(conversation, 0);
    this.accumulateUsage(usage, response);

    response = await this.enforceToolUse(conversation, response, usage);

    const autoExecute = this.toolConfig.autoExecuteTools !== false;
    let iterations = 1;

    while (
      autoExecute &&
      response.toolCalls?.length &&
      this.hasExecutableTool(response) &&
      iterations < this.toolConfig.maxIterations
    ) {
      // Record what the model asked for, so the next turn keeps the context.
      conversation.push({
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls.map((call, index) => ({
          id: call.id || `call-${iterations}-${index}`,
          name: call.name,
          arguments: call.arguments,
        })),
      });

      const calls = conversation[conversation.length - 1].toolCalls!;

      // Tools requested in the same turn are independent: run them together.
      const results = await Promise.all(
        calls.map((call) => this.runToolCall(call.name, call.arguments))
      );

      results.forEach((outcome, index) => {
        const call = calls[index];

        toolResults.push({
          toolCallId: call.id,
          name: call.name,
          result: outcome.value,
          isError: outcome.isError,
        });

        conversation.push({
          role: "tool",
          name: call.name,
          toolCallId: call.id,
          content: this.serializeResult(outcome.value),
        });
      });

      response = await this.callProvider(conversation, iterations);
      this.accumulateUsage(usage, response);
      iterations++;
    }

    if (
      autoExecute &&
      response.toolCalls?.length &&
      iterations >= this.toolConfig.maxIterations
    ) {
      logger.warn(
        `Reached maxIterations (${this.toolConfig.maxIterations}) with tool calls still pending`
      );
    }

    return {
      ...response,
      toolResults: toolResults.length ? toolResults : undefined,
      iterations,
      usage,
    };
  }

  /**
   * Apply the `forceToolUse` / `onToolNotCalled` policy when the model answered
   * without calling any tool.
   */
  private async enforceToolUse(
    conversation: AgentMessage[],
    initial: AgentResponse,
    usage: NonNullable<AgentResponse["usage"]>
  ): Promise<AgentResponse> {
    const tools = this.config.tools || [];

    if (
      !this.toolConfig.forceToolUse ||
      tools.length === 0 ||
      initial.toolCalls?.length
    ) {
      return initial;
    }

    let response = initial;

    if (this.toolConfig.onToolNotCalled === "retry") {
      for (
        let attempt = 1;
        attempt <= this.toolConfig.maxRetries && !response.toolCalls?.length;
        attempt++
      ) {
        logger.debug(`No tool called; retrying with stronger prompt (${attempt})`);
        response = await this.callProvider(conversation, attempt);
        this.accumulateUsage(usage, response);
      }

      if (response.toolCalls?.length) {
        return response;
      }
    }

    if (response.toolCalls?.length) {
      return response;
    }

    const message = this.promptEnhancer
      ? this.promptEnhancer.generateMissingToolCallError(tools)
      : "Expected a tool call but none was made";

    switch (this.toolConfig.onToolNotCalled) {
      case "error":
      case "retry": // exhausted retries above
        throw new Error(message);
      case "warn":
        logger.warn(message);
        break;
      case "allow":
      default:
        break;
    }

    return response;
  }

  /**
   * Call the provider, escalating the system prompt when `forceToolUse` is on.
   */
  private async callProvider(
    conversation: AgentMessage[],
    attempt: number
  ): Promise<AgentResponse> {
    if (!this.promptEnhancer) {
      return this.provider.chat(conversation);
    }

    const tools = this.config.tools || [];
    const original = conversation.find((m) => m.role === "system")?.content;
    const enhanced = this.promptEnhancer.enhanceSystemPrompt(
      original,
      tools,
      attempt
    );

    if (!enhanced || enhanced === original) {
      return this.provider.chat(conversation);
    }

    // Send an enhanced copy; the stored conversation keeps the original prompt
    // so escalations never stack up across turns.
    const withEnhancedPrompt: AgentMessage[] = conversation.some(
      (m) => m.role === "system"
    )
      ? conversation.map((m) =>
          m.role === "system" ? { ...m, content: enhanced } : m
        )
      : [{ role: "system", content: enhanced }, ...conversation];

    return this.provider.chat(withEnhancedPrompt);
  }

  /** True when at least one requested call maps to a tool we can run. */
  private hasExecutableTool(response: AgentResponse): boolean {
    return !!response.toolCalls?.some((call) =>
      this.config.tools?.some((tool) => tool.name === call.name)
    );
  }

  /**
   * Run one tool call, turning failures into a result the model can read
   * instead of an exception that aborts the whole conversation.
   */
  private async runToolCall(
    name: string,
    args: any
  ): Promise<{ value: any; isError: boolean }> {
    try {
      const value = await this.executeTool(name, args);
      return { value, isError: false };
    } catch (error: any) {
      logger.warn(`Tool ${name} failed: ${error.message}`);
      return { value: `Error: ${error.message}`, isError: true };
    }
  }

  private serializeResult(value: any): string {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value ?? null);
    } catch {
      return String(value);
    }
  }

  private accumulateUsage(
    total: NonNullable<AgentResponse["usage"]>,
    response: AgentResponse
  ): void {
    if (!response.usage) {
      return;
    }

    total.promptTokens += response.usage.promptTokens || 0;
    total.completionTokens += response.usage.completionTokens || 0;
    total.totalTokens += response.usage.totalTokens || 0;
  }

  /**
   * Execute a tool with retry logic and caching if configured
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.config.tools?.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Check cache first
    if (this.toolCache) {
      const cacheKey = ToolCache.generateKey(toolName, params);
      const cached = this.toolCache.get(cacheKey);

      if (cached !== null) {
        logger.debug(`Cache hit for tool: ${toolName}`);
        return cached;
      }
    }

    // Execute with retry logic if configured
    if (this.retryLogic) {
      const result = await this.retryLogic.executeWithRetry(tool, params);

      if (!result.success) {
        throw result.error || new Error(`Tool execution failed: ${toolName}`);
      }

      // Cache successful result
      if (this.toolCache && result.result !== undefined) {
        const cacheKey = ToolCache.generateKey(toolName, params);
        this.toolCache.set(cacheKey, result.result);
      }

      return result.result;
    }

    // Execute without retry logic
    return tool.handler(params);
  }

  async execute(input: string): Promise<string> {
    const response = await this.chat(input);
    return response.content;
  }

  /**
   * Cleanup resources (stop cache cleanup timers, etc.)
   */
  cleanup(): void {
    if (this.toolCache) {
      this.toolCache.stopAutoCleanup();
    }
  }
}

/**
 * Create an AI agent with one line
 *
 * @example
 * ```ts
 * const agent = createAgent({
 *   provider: 'openai',
 *   model: 'gpt-4o'
 * });
 *
 * const response = await agent.chat('Hello!');
 * ```
 */
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
