# Design Document - mcp-agent-kit Improvements

## Overview

Este documento descreve o design técnico para implementar as melhorias estratégicas no mcp-agent-kit. O design é modular e incremental, permitindo implementação em fases sem quebrar compatibilidade.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (User code using mcp-agent-kit)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Agent Core Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Smart Tool   │  │  Context     │  │  Multi-      │ │
│  │ Calling      │  │  Manager     │  │  Provider    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Observability Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Logger      │  │  Cost        │  │  Metrics     │ │
│  │  System      │  │  Tracker     │  │  Collector   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Plugin System                         │
│  (Extensibility hooks)                                   │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Smart Tool Calling

**Location:** `src/features/smart-tool-calling/`

**Interface:**

```typescript
interface ToolConfig {
  forceToolUse?: boolean;
  retryOnFailure?: number;
  fallbackToText?: boolean;
  timeout?: number;
}

interface ToolCallResult {
  success: boolean;
  result?: any;
  error?: Error;
  attempts: number;
  duration: number;
}

class SmartToolCaller {
  constructor(config: ToolConfig);
  async executeWithRetry(tool: Tool, params: any): Promise<ToolCallResult>;
  private async executeWithTimeout(tool: Tool, params: any): Promise<any>;
  private shouldRetry(error: Error, attempt: number): boolean;
}
```

**Implementation Details:**

- Wrapper em torno de tool execution
- Retry com exponential backoff
- Timeout usando AbortController
- Logging de todas as tentativas

### 2. Logging & Debugging

**Location:** `src/features/logging/`

**Interface:**

```typescript
enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

interface DebugConfig {
  enabled: boolean;
  logLevel: LogLevel;
  logToolCalls: boolean;
  logTokenUsage: boolean;
  logLatency: boolean;
}

class Logger {
  constructor(config: DebugConfig);
  verbose(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  export(): LogEntry[];
}
```

**Implementation Details:**

- Singleton logger instance
- Structured logging com contexto
- Buffer circular para performance
- Export para JSON

### 3. Cost Tracking

**Location:** `src/features/cost-tracking/`

**Interface:**

```typescript
interface CostConfig {
  enabled: boolean;
  budget?: number;
  alertThreshold?: number;
  onBudgetExceeded?: (usage: CostUsage) => void;
}

interface CostUsage {
  total: number;
  requests: number;
  avgPerRequest: number;
  byProvider: Record<string, number>;
}

interface ProviderPricing {
  inputTokenPrice: number; // per 1M tokens
  outputTokenPrice: number; // per 1M tokens
}

class CostTracker {
  constructor(config: CostConfig);
  trackUsage(provider: string, inputTokens: number, outputTokens: number): void;
  getCosts(): CostUsage;
  reset(): void;
  private checkBudget(): void;
}
```

**Implementation Details:**

- Pricing table para cada provider
- Cálculo baseado em tokens
- Alertas quando threshold atingido
- Persistência opcional

### 4. Testing Utilities

**Location:** `src/testing/`

**Interface:**

```typescript
interface MockAgentConfig {
  responses: Record<string, string | MockToolResponse>;
  delay?: number;
  failureRate?: number;
}

interface MockToolResponse {
  toolName: string;
  result: any;
  delay?: number;
}

function createMockAgent(config: MockAgentConfig): Agent;
function mockToolResponse(toolName: string, result: any): MockToolResponse;
function simulateError(errorType: string): Error;
```

**Implementation Details:**

- Mock agent com mesma interface
- Pattern matching para responses
- Simulação de latência e erros
- Sem chamadas reais de API

### 5. Tool Builder

**Location:** `src/features/tool-builder/`

**Interface:**

```typescript
class ToolBuilder<TParams = any> {
  constructor(name: string);
  description(desc: string): this;
  param<K extends string>(
    name: K,
    type: "string" | "number" | "boolean" | "object",
    options?: ParamOptions
  ): ToolBuilder<TParams & Record<K, any>>;
  handler(fn: (params: TParams) => Promise<any>): this;
  validate(): this;
  build(): Tool;
}

interface ParamOptions {
  required?: boolean;
  default?: any;
  description?: string;
  enum?: any[];
}
```

**Implementation Details:**

- Fluent API com type inference
- Validação em build time
- Schema generation automático
- Type-safe handler

### 6. Context Management

**Location:** `src/features/context-management/`

**Interface:**

```typescript
interface ContextStrategy {
  type: "smart-compression" | "sliding-window" | "summarization";
  maxTokens: number;
  keepRecent?: number;
  summarizeOlder?: boolean;
  prioritize?: string[];
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  priority?: number;
}

class ContextManager {
  constructor(strategy: ContextStrategy);
  addMessage(message: Message): void;
  getMessages(): Message[];
  compress(): void;
  private summarizeMessages(messages: Message[]): Message;
  private calculateTokens(content: string): number;
}
```

**Implementation Details:**

- Token counting usando tiktoken
- Compressão quando próximo do limite
- Priorização de mensagens importantes
- Summarization usando LLM

### 7. Multi-Provider Fallback

**Location:** `src/features/multi-provider/`

**Interface:**

```typescript
interface ProviderConfig {
  provider: string;
  model: string;
  priority: number;
  timeout?: number;
}

interface MultiProviderConfig {
  providers: ProviderConfig[];
  fallbackStrategy: "cascade" | "round-robin" | "least-connections";
  loadBalancing?: boolean;
}

class MultiProviderManager {
  constructor(config: MultiProviderConfig);
  async execute(request: any): Promise<any>;
  private selectProvider(): ProviderConfig;
  private handleFailure(provider: ProviderConfig, error: Error): void;
}
```

**Implementation Details:**

- Lista ordenada de providers
- Fallback automático em falhas
- Load balancing strategies
- Health check de providers

### 8. Streaming Support

**Location:** `src/features/streaming/`

**Interface:**

```typescript
interface StreamChunk {
  content: string;
  done: boolean;
  toolCall?: ToolCall;
}

class StreamingAgent extends Agent {
  async chatStream(message: string): AsyncIterableIterator<StreamChunk>;
  cancelStream(): void;
}
```

**Implementation Details:**

- AsyncIterator para streaming
- Support para SSE e WebSocket
- Cancelamento via AbortController
- Buffering para performance

### 9. Observability Dashboard

**Location:** `src/features/dashboard/`

**Interface:**

```typescript
interface DashboardConfig {
  port: number;
  agents: Agent[];
  realtime: boolean;
  auth?: { username: string; password: string };
}

class Dashboard {
  constructor(config: DashboardConfig);
  start(): Promise<void>;
  stop(): Promise<void>;
  private setupWebSocket(): void;
  private serveUI(): void;
}
```

**Implementation Details:**

- Express server para UI
- WebSocket para real-time updates
- React frontend (opcional)
- Métricas agregadas

### 10. Plugin System

**Location:** `src/features/plugins/`

**Interface:**

```typescript
interface Plugin {
  name: string;
  onToolCall?: (tool: Tool, params: any) => void | Promise<void>;
  onResponse?: (response: any) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onInit?: (agent: Agent) => void | Promise<void>;
}

class PluginManager {
  constructor(plugins: Plugin[]);
  async executeHook(hook: string, ...args: any[]): Promise<void>;
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(name: string): void;
}
```

**Implementation Details:**

- Event-based hook system
- Async plugin execution
- Error isolation (plugin error não quebra agent)
- Plugin ordering

## Data Models

### Agent Configuration

```typescript
interface AgentConfig {
  provider: string | MultiProviderConfig;
  model: string;
  tools?: Tool[];

  // Smart Tool Calling
  toolConfig?: ToolConfig;

  // Logging
  debug?: DebugConfig;

  // Cost Tracking
  costTracking?: CostConfig;

  // Context Management
  contextStrategy?: ContextStrategy;

  // Plugins
  plugins?: Plugin[];
}
```

## Error Handling

### Error Types

```typescript
class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public attempts: number,
    public originalError: Error
  ) {}
}

class BudgetExceededError extends Error {
  constructor(
    message: string,
    public currentCost: number,
    public budget: number
  ) {}
}

class ProviderFailureError extends Error {
  constructor(
    message: string,
    public provider: string,
    public failedProviders: string[]
  ) {}
}
```

### Error Recovery

- Tool execution: Retry com exponential backoff
- Provider failure: Fallback para próximo provider
- Budget exceeded: Callback + optional throw
- Context overflow: Automatic compression

## Testing Strategy

### Unit Tests

- Cada componente isolado
- Mock de dependências externas
- Coverage mínimo de 80%

### Integration Tests

- Fluxo completo com mock providers
- Teste de fallback scenarios
- Teste de plugin interactions

### E2E Tests

- Testes com providers reais (CI only)
- Validação de custos
- Performance benchmarks

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Carregar features apenas quando usadas
2. **Caching:** Cache de token counts e pricing
3. **Batching:** Batch de logs para reduzir I/O
4. **Async:** Operações não-críticas em background

### Benchmarks

- Tool execution overhead: < 5ms
- Logging overhead: < 1ms
- Context compression: < 100ms
- Dashboard updates: < 50ms

## Security Considerations

- API keys nunca em logs
- Dashboard com autenticação opcional
- Rate limiting para prevenir abuse
- Sanitização de inputs

## Migration Path

### Backward Compatibility

- Todas as features são opt-in
- API existente não muda
- Deprecation warnings para breaking changes

### Version Strategy

- Semantic versioning
- Major version para breaking changes
- Minor version para novas features
- Patch version para bug fixes
