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
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  tools?: MCPTool[];
  resources?: MCPResource[];
}

// ============================================================================
// Agent Types
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
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

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
}

export interface AgentResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
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
