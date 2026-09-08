/**
 * Core types and interfaces for mcp-agent-kit
 */

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: () => Promise<string | Buffer>;
}

export interface MCPServerConfig {
  name?: string;
  port?: number;
  /** HTTP path MCP is served at when using the http transport. Default: /mcp */
  path?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  tools?: MCPTool[];
  resources?: MCPResource[];
}

// ============================================================================
// Agent Types
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ToolContext {
  /** Aborted when the tool exceeds `toolTimeout`, so handlers can stop early */
  signal: AbortSignal;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any, context?: ToolContext) => Promise<any>;
}

// ============================================================================
// Smart Tool Calling Types
// ============================================================================

export interface SmartToolConfig {
  /** Force the model to use tools */
  forceToolUse?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Action when tool is not called: retry, error, warn, or allow */
  onToolNotCalled?: 'retry' | 'error' | 'warn' | 'allow';
  /** Timeout for tool execution in milliseconds */
  toolTimeout?: number;
  /** Enable caching of tool results */
  cacheResults?: {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
  };
  /** Enable debug logging for tool calls */
  debug?: boolean;
  /**
   * Run requested tools automatically inside chat() and feed the results back
   * to the model until it answers. Set to false to get the raw tool calls back
   * and run them yourself. Default: true.
   */
  autoExecuteTools?: boolean;
  /** Maximum model round-trips in one chat() call. Default: 5 */
  maxIterations?: number;
}

export interface AgentConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  tools?: AgentTool[];
  system?: string;
  /** Smart tool calling configuration */
  toolConfig?: SmartToolConfig;
}

export interface ToolCall {
  /** Provider-issued id, used to correlate a result with its call */
  id: string;
  name: string;
  arguments: any;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  /** Result returned by the tool handler, or the error message when it failed */
  result: any;
  isError?: boolean;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  /** Tool calls requested by the assistant on this turn */
  toolCalls?: ToolCall[];
  /** Set on a `tool` message: which call this message answers */
  toolCallId?: string;
  /** @deprecated use `toolCalls` */
  tool_calls?: any[];
}

export interface AgentResponse {
  content: string;
  toolCalls?: Array<{
    id?: string;
    name: string;
    arguments: any;
  }>;
  /** Tools executed while producing this response, in call order */
  toolResults?: ToolResult[];
  /** Number of model round-trips taken (1 when no tool was called) */
  iterations?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================================================
// Router Types
// ============================================================================

export interface RouterRule {
  when?: (input: string) => boolean;
  default?: boolean;
  use: {
    provider: LLMProvider;
    model?: string;
  };
}

export interface LLMRouterConfig {
  rules: RouterRule[];
  fallback?: {
    provider: LLMProvider;
    model?: string;
  };
  retryAttempts?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// Chatbot Types
// ============================================================================

export interface ChatbotConfig {
  agent?: any; // Agent instance
  router?: any; // Router instance
  system?: string;
  maxHistory?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// API Types
// ============================================================================

export interface APIRequestConfig {
  name?: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  duration: number;
}
