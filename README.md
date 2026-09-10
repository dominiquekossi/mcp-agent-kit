# mcp-agent-kit

> Orchestrate MCP servers and build AI agents in TypeScript — in your app, not in your infrastructure

[![npm version](https://img.shields.io/npm/v/mcp-agent-kit.svg)](https://www.npmjs.com/package/mcp-agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Connect your agent to several MCP servers in three lines — no gateway, no
proxy, no container:

```typescript
const mcp = await connectMCP({
  servers: {
    files: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./"] },
    github: { url: "https://mcp.example.com/mcp" },
  },
});

const agent = createAgent({ provider: "openai" });
agent.use(mcp);

const answer = await agent.chat("Summarise the open issues into notes.md");
```

**mcp-agent-kit** is a TypeScript package for working with MCP from inside your
application:

- 🎛️ **MCP Orchestrator** — connect to many MCP servers, aggregate and filter their tools
- 🔍 **`inspect` CLI** — validate any MCP server’s tools without writing code
- 🔌 **MCP Servers** — publish your own tools over stdio or Streamable HTTP
- 🤖 **AI Agents** with automatic tool execution across four LLM providers
- 🧠 **Intelligent Routers** for multi-LLM routing
- 💬 **Chatbots** with conversation memory
- 🌐 **API Helpers** with retry and timeout

## Features

- **In-process**: an `npm install`, not another service to deploy
- **Tool loop included**: tools are executed and their results fed back to the model
- **Tool filtering**: allow/deny globs keep 60 tools from bloating the prompt
- **Fault isolation**: a server that is down degrades the tool set, not the agent
- **Multi-Provider**: OpenAI, Anthropic, Gemini, Ollama
- **Type-Safe**: Full TypeScript support with autocomplete
- **Verified docs**: every example on this page is compiled in CI

## Installation

```bash
npm install mcp-agent-kit
```

## Quick Start

### Create an AI Agent (1 line!)

```typescript
import { createAgent } from "mcp-agent-kit";

const agent = createAgent({ provider: "openai" });
const response = await agent.chat("Hello!");
console.log(response.content);
```

### Create an MCP Server (1 function!)

```typescript
import { createMCPServer } from "mcp-agent-kit";

const server = await createMCPServer({
  name: "my-server",
  tools: [
    {
      name: "get_weather",
      description: "Get weather for a location",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
      },
      handler: async ({ location }) => {
        return `Weather in ${location}: Sunny, 72°F`;
      },
    },
  ],
});

await server.start();
```

### Create a Chatbot with Memory

```typescript
import { createChatbot, createAgent } from "mcp-agent-kit";

const bot = createChatbot({
  agent: createAgent({ provider: "openai" }),
  system: "You are a helpful assistant",
  maxHistory: 10,
});

await bot.chat("Hi, my name is John");
await bot.chat("What is my name?"); // Remembers context!
```

## Documentation

### Table of Contents

- [AI Agents](#ai-agents)
- [MCP Servers](#mcp-servers)
- [MCP Orchestrator](#mcp-orchestrator)
- [CLI: inspect](#cli-inspect-an-mcp-server)
- [LLM Router](#llm-router)
- [Chatbots](#chatbots)
- [API Requests](#api-requests)
- [Configuration](#configuration)
- [Examples](#examples)

---

## AI Agents

Create intelligent agents that work with multiple LLM providers.

### Basic Usage

```typescript
import { createAgent } from "mcp-agent-kit";

const agent = createAgent({
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 2000,
});

const response = await agent.chat("Explain TypeScript");
console.log(response.content);
```

### Supported Providers

| Provider      | Models               | API Key Required |
| ------------- | -------------------- | ---------------- |
| **OpenAI**    | GPT-4o, GPT-4, o-series | ✅ Yes        |
| **Anthropic** | Claude Opus 5, Sonnet 5 | ✅ Yes        |
| **Gemini**    | Gemini 2.0+             | ✅ Yes        |
| **Ollama**    | Local models            | ❌ No         |

### With Tools (Function Calling)

```typescript
const agent = createAgent({
  provider: "openai",
  tools: [
    {
      name: "calculate",
      description: "Perform calculations",
      parameters: {
        type: "object",
        properties: {
          operation: { type: "string", enum: ["add", "subtract"] },
          a: { type: "number" },
          b: { type: "number" },
        },
        required: ["operation", "a", "b"],
      },
      handler: async ({ operation, a, b }) => {
        return operation === "add" ? a + b : a - b;
      },
    },
  ],
});

const response = await agent.chat("What is 15 + 27?");
```

### With System Prompt

```typescript
const agent = createAgent({
  provider: "anthropic",
  system: "You are an expert Python developer. Always provide code examples.",
});
```

### Smart Tool Calling

Smart Tool Calling adds reliability and performance to tool execution with automatic retry, timeout, and caching.

#### Basic Configuration

```typescript
const agent = createAgent({
  provider: "openai",
  toolConfig: {
    forceToolUse: true,      // Force model to use tools
    maxRetries: 3,           // Retry up to 3 times on failure
    toolTimeout: 30000,      // 30 second timeout
    onToolNotCalled: "retry", // Action when tool not called
  },
  tools: [...],
});
```

#### With Caching

```typescript
const agent = createAgent({
  provider: "openai",
  toolConfig: {
    cacheResults: {
      enabled: true,
      ttl: 300000,    // Cache for 5 minutes
      maxSize: 100,   // Store up to 100 results
    },
  },
  tools: [...],
});
```

#### Direct Tool Execution

```typescript
// Execute a tool directly with retry and caching
const result = await agent.executeTool("get_weather", {
  location: "San Francisco, CA",
});
```

#### Configuration Options

| Option                 | Type    | Default | Description                                                    |
| ---------------------- | ------- | ------- | -------------------------------------------------------------- |
| `forceToolUse`         | boolean | false   | Force the model to use tools when available                    |
| `maxRetries`           | number  | 3       | Maximum retry attempts on tool failure                         |
| `onToolNotCalled`      | string  | "retry" | Action when tool not called: "retry", "error", "warn", "allow" |
| `toolTimeout`          | number  | 30000   | Timeout for tool execution (ms)                                |
| `cacheResults.enabled` | boolean | true    | Enable result caching                                          |
| `cacheResults.ttl`     | number  | 300000  | Cache time-to-live (ms)                                        |
| `cacheResults.maxSize` | number  | 100     | Maximum cached results                                         |
| `debug`                | boolean | false   | Enable debug logging                                           |
| `autoExecuteTools`     | boolean | true    | Run requested tools and feed results back to the model         |
| `maxIterations`        | number  | 5       | Maximum model round-trips in one `chat()` call                 |

#### Complete Example

```typescript
const agent = createAgent({
  provider: "openai",
  model: "gpt-4o",
  toolConfig: {
    forceToolUse: true,
    maxRetries: 3,
    onToolNotCalled: "retry",
    toolTimeout: 30000,
    cacheResults: {
      enabled: true,
      ttl: 300000,
      maxSize: 100,
    },
    debug: true,
  },
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
        required: ["location"],
      },
      handler: async ({ location }) => {
        // Your weather API logic
        return { location, temp: 72, condition: "Sunny" };
      },
    },
  ],
});

// Tools are executed automatically and their results are sent back to the
// model, so `content` is the final answer — not an empty string with a
// pending tool call.
const response = await agent.chat("What's the weather in NYC?");

console.log(response.content);      // "It's 72°F and sunny in New York."
console.log(response.toolResults);  // [{ name: 'get_weather', result: {...} }]
console.log(response.iterations);   // 2 (one call for the tool, one for the answer)

// Or execute directly with retry and caching
const result = await agent.executeTool("get_weather", {
  location: "New York, NY",
});
```

---

## MCP Servers

Create Model Context Protocol servers to expose tools and resources.

### Basic MCP Server

```typescript
import { createMCPServer } from "mcp-agent-kit";

const server = await createMCPServer({
  name: "my-mcp-server",
  port: 7777,
  logLevel: "info",
});

await server.start(); // Starts on stdio by default
```

### With Tools

```typescript
const server = await createMCPServer({
  name: "weather-server",
  tools: [
    {
      name: "get_weather",
      description: "Get current weather",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
          units: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
      },
      handler: async ({ location, units = "celsius" }) => {
        // Your weather API logic here
        return { location, temp: 22, units, condition: "Sunny" };
      },
    },
  ],
});
```

### With Resources

```typescript
const server = await createMCPServer({
  name: "data-server",
  resources: [
    {
      uri: "config://app-settings",
      name: "Application Settings",
      description: "Current app configuration",
      mimeType: "application/json",
      handler: async () => {
        return JSON.stringify({ version: "1.0.0", env: "production" });
      },
    },
  ],
});
```

### Streamable HTTP Transport

```typescript
const server = await createMCPServer({
  name: "http-server",
  port: 8080,
  path: "/mcp", // default
});

await server.start("http"); // Serves MCP at http://localhost:8080/mcp
```

> The `websocket` transport was removed in v1.2.0. It accepted connections but
> was never wired to the MCP server, so it answered no requests while reporting
> itself as healthy. Use `"http"` (Streamable HTTP) instead — it is the
> transport current MCP clients speak.

---

## MCP Orchestrator

`createMCPServer` publishes tools. `connectMCP` is the other half: it connects
to MCP servers, aggregates their tools behind one namespace, and hands them to
an agent — no gateway, no proxy, no container.

### Connect to several servers

```typescript
import { connectMCP, createAgent } from "mcp-agent-kit";

const mcp = await connectMCP({
  servers: {
    // stdio: started as a child process
    files: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
    },
    // Streamable HTTP: a remote server
    github: {
      url: "https://mcp.example.com/mcp",
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    },
  },
});

const agent = createAgent({ provider: "openai" });
agent.use(mcp); // every MCP tool is now callable by the agent

const answer = await agent.chat("Summarise the open issues into notes.md");

await mcp.close();
```

Tools are namespaced by server, so two servers can both expose `read` without
colliding: `files__read`, `github__read`.

### Filter the tool surface

Six servers easily add up to 60 tools, which bloats the prompt and degrades the
model's choices. Expose only what the task needs:

```typescript
const mcp = await connectMCP({
  servers: {
    files: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./"] },
  },
  // Globs match the namespaced name
  allowTools: ["files__read_*", "files__list_*"],
  denyTools: ["*__delete_*"],
});
```

Filters can also be set per server, against the bare tool name:

```typescript
const mcp = await connectMCP({
  servers: {
    files: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
      denyTools: ["write_file", "move_file"],
    },
  },
});
```

### A server being down does not take the agent with it

By default a failed server degrades the tool set and the rest keep working:

```typescript
const mcp = await connectMCP({
  servers: {
    good: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./"] },
    flaky: { url: "https://might-be-down.example.com/mcp" },
  },
});

console.log(mcp.listServers());
// [{ name: 'good',  state: 'connected', tools: 12, toolsAvailable: 12 },
//  { name: 'flaky', state: 'failed', error: 'fetch failed', tools: 0 }]
```

Pass `strict: true` to fail the whole connection instead.

### Observability

```typescript
console.log(mcp.getStats());
// { servers: 2, connected: 1, failed: 1, tools: 12,
//   calls: 4, failedCalls: 0, avgDurationMs: 37 }

console.log(mcp.getCallLog());
// [{ server: 'good', tool: 'read_file', durationMs: 12, ok: true }, ...]
```

### Orchestrator options

| Option               | Type    | Default | Description                                              |
| -------------------- | ------- | ------- | -------------------------------------------------------- |
| `servers`            | object  | —       | Servers to connect to, keyed by namespace                |
| `allowTools`         | string[] | —      | Allowlist of namespaced names (globs allowed)            |
| `denyTools`          | string[] | —      | Denylist of namespaced names (globs allowed)             |
| `connectTimeout`     | number  | 30000   | Time to wait for a server to connect (ms)                |
| `toolTimeout`        | number  | 60000   | Time a single tool call may take (ms)                    |
| `namespaceSeparator` | string  | `__`    | Separator between server name and tool name              |
| `strict`             | boolean | false   | Fail the whole connect when any server fails             |
| `autoReconnect`      | boolean | true    | Reconnect and retry once when a connection drops         |

**Methods:** `getTools()`, `getServerTools(name)`, `getRawTools(name)`,
`listResources(name)`, `callTool(name, params)`, `listServers()`, `getStats()`,
`getCallLog()`, `getServerLogs(name)`, `reconnect(name)`, `close()`.

---

## CLI: inspect an MCP server

`inspect` connects to any MCP server, lists what it publishes, validates its
tool schemas and times the round-trips. It needs no config and no code — point
it at a server and read the report.

```bash
npx mcp-agent-kit inspect npx -y @modelcontextprotocol/server-filesystem ./
```

```
Target     npx -y @modelcontextprotocol/server-filesystem ./
Transport  stdio

✓ connected in 2453ms
✓ 14 tool(s), 0 resource(s) listed in 2ms

TOOLS
  ⚠ read_file                  { path: string, tail?: number, head?: number }
  ✓ read_multiple_files        { paths: array }
  ⚠ write_file                 { path: string, content: string }
  ...

ISSUES
  ⚠ read_file: property "path" has no description

Summary  14 tool(s) · 0 resource(s) · 0 errors · 18 warning(s)
```

### What it validates

Errors are things a real client will reject; warnings are things that make a
model choose worse:

| Level | Check                                                                 |
| ----- | --------------------------------------------------------------------- |
| Error | Tool name outside `[a-zA-Z0-9_-]{1,64}` — OpenAI and Anthropic reject it |
| Error | `required` lists a key that `properties` does not declare              |
| Error | Missing `inputSchema`, or `type` other than `object`                   |
| Error | Duplicate tool names                                                   |
| Warning | Tool or property with no description                                 |
| Warning | Property with no declared type                                       |

### Call a tool

```bash
npx mcp-agent-kit inspect --call read_file --args '{"path":"README.md"}' \
  npx -y @modelcontextprotocol/server-filesystem ./
```

### Remote servers

```bash
npx mcp-agent-kit inspect https://mcp.example.com/mcp -H "Authorization: Bearer $TOKEN"
```

### In CI

`--json` gives machine-readable output, and the exit code is meaningful:
`0` clean, `1` schema errors, `2` could not connect.

```bash
npx mcp-agent-kit inspect --json node ./my-server.js | jq '.issues'
```

### Options

| Option            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `--json`          | Machine-readable output                                |
| `--quiet`, `-q`   | Summary and issues only                                |
| `--timeout <ms>`  | Connect and call timeout (default 30000)               |
| `--header`, `-H`  | HTTP header, repeatable (`"Name: value"`)              |
| `--env`, `-e`     | Environment variable for a stdio server, repeatable    |
| `--call <tool>`   | Call a tool after inspecting                           |
| `--args <json>`   | Arguments for `--call`                                 |

> Options go before the target; everything after the target is the server's own
> command line.

---

## LLM Router

Route requests to different LLMs based on intelligent rules.

### Basic Router

```typescript
import { createLLMRouter } from "mcp-agent-kit";

const router = createLLMRouter({
  rules: [
    {
      when: (input) => input.length < 200,
      use: { provider: "openai", model: "gpt-4o" },
    },
    {
      when: (input) => input.includes("code"),
      use: { provider: "anthropic", model: "claude-opus-5" },
    },
    {
      default: true,
      use: { provider: "openai", model: "gpt-4o" },
    },
  ],
});

const response = await router.route("Write a function to sort an array");
```

### With Fallback and Retry

```typescript
const router = createLLMRouter({
  rules: [...],
  fallback: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  retryAttempts: 3,
  logLevel: 'debug'
});
```

### Router Statistics

```typescript
const stats = router.getStats();
console.log(stats);
// { totalRules: 3, totalAgents: 2, hasFallback: true }

const agents = router.listAgents();
console.log(agents);
// ['openai:gpt-4o', 'anthropic:claude-opus-5']
```

---

## Chatbots

Create conversational AI with automatic memory management.

### Basic Chatbot

```typescript
import { createChatbot, createAgent } from "mcp-agent-kit";

const bot = createChatbot({
  agent: createAgent({ provider: "openai" }),
  system: "You are a helpful assistant",
  maxHistory: 10,
});

await bot.chat("Hi, I am learning TypeScript");
await bot.chat("Can you help me with interfaces?");
await bot.chat("Thanks!");
```

### With Router

```typescript
const bot = createChatbot({
  router: createLLMRouter({ rules: [...] }),
  maxHistory: 20
});
```

### Memory Management

```typescript
// Get conversation history
const history = bot.getHistory();

// Get statistics
const stats = bot.getStats();
console.log(stats);
// {
//   messageCount: 6,
//   userMessages: 3,
//   assistantMessages: 3,
//   oldestMessage: Date,
//   newestMessage: Date
// }

// Reset conversation
bot.reset();

// Update system prompt
bot.setSystemPrompt("You are now a Python expert");
```

---

## API Requests

Simplified HTTP requests with automatic retry and timeout.

### Basic Request

```typescript
import { api } from "mcp-agent-kit";

const response = await api.get("https://api.example.com/data");
console.log(response.data);
```

### POST Request

```typescript
const response = await api.post(
  "https://api.example.com/users",
  { name: "John", email: "john@example.com" },
  {
    name: "create-user",
    headers: { "Content-Type": "application/json" },
  }
);
```

### With Retry and Timeout

```typescript
const response = await api.request({
  name: "important-request",
  url: "https://api.example.com/data",
  method: "GET",
  timeout: 10000, // 10 seconds
  retries: 5, // 5 attempts
  query: { page: 1, limit: 10 },
});
```

### All HTTP Methods

```typescript
await api.get(url, config);
await api.post(url, body, config);
await api.put(url, body, config);
await api.patch(url, body, config);
await api.delete(url, config);
```

---

## Configuration

### Environment Variables

All configuration is optional. Set these environment variables or pass them in code:

```bash
# MCP Server
MCP_SERVER_NAME=my-server
MCP_PORT=7777

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# LLM API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
OLLAMA_HOST=http://localhost:11434
```

### Using .env File

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LOG_LEVEL=debug
```

The package automatically loads `.env` files using `dotenv`.

---

## Examples

Check out the `/examples` directory for complete working examples:

- `basic-agent.ts` - Simple agent usage
- `smart-tool-calling.ts` - Smart tool calling with retry and caching
- `mcp-server.ts` - MCP server with tools and resources
- `mcp-server-http.ts` - MCP server over Streamable HTTP
- `mcp-orchestrator.ts` - Connect to several MCP servers and hand them to an agent
- `llm-router.ts` - Intelligent routing between LLMs
- `chatbot-basic.ts` - Chatbot with conversation memory
- `chatbot-with-router.ts` - Chatbot using router
- `api-requests.ts` - HTTP requests with retry

### Running Examples

```bash
# Install dependencies
npm install

# Run an example
npx ts-node examples/basic-agent.ts
```

---

## API Reference

### Agent API

#### `createAgent(config: AgentConfig)`

Creates a new AI agent instance.

**Parameters:**

- `provider` (required): LLM provider - "openai", "anthropic", "gemini", or "ollama"
- `model` (optional): Model name (defaults to provider's default)
- `temperature` (optional): Sampling temperature 0-2 (default: 0.7)
- `maxTokens` (optional): Maximum tokens in response (default: 2000)
- `apiKey` (optional): API key (reads from env if not provided)
- `tools` (optional): Array of tool definitions
- `system` (optional): System prompt
- `toolConfig` (optional): Smart tool calling configuration

**Returns:** Agent instance

**Methods:**

- `chat(message: string | AgentMessage[]): Promise<AgentResponse>` - Send a message and get the final answer, running any tools the model asks for
- `executeTool(name: string, params: any): Promise<any>` - Execute a tool directly
- `registerTools(tools: AgentTool[]): Agent` - Add tools to a live agent
- `listTools(): AgentTool[]` - Tools currently visible to the model
- `cleanup(): void` - Release cache timers

#### `AgentResponse`

Response object from agent.chat():

```typescript
{
  content: string;           // Final response text
  toolCalls?: Array<{        // Tools still pending (empty once the loop finishes)
    id?: string;
    name: string;
    arguments: any;
  }>;
  toolResults?: Array<{      // Tools executed while producing this response
    toolCallId: string;
    name: string;
    result: any;
    isError?: boolean;
  }>;
  iterations?: number;       // Model round-trips taken (1 when no tool ran)
  usage?: {                  // Token usage, summed across every round-trip
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### MCP Server API

#### `createMCPServer(config: MCPServerConfig)`

Creates a new MCP server instance.

**Parameters:**

- `name` (optional): Server name (default: from env or "mcp-server")
- `port` (optional): Port number (default: 7777)
- `logLevel` (optional): Log level - "debug", "info", "warn", "error"
- `tools` (optional): Array of tool definitions
- `resources` (optional): Array of resource definitions

**Returns:** `Promise<MCPServer>` — the function is async (it loads the MCP SDK first), so always `await` it

**Methods:**

- `start(transport?: "stdio" | "websocket"): Promise<void>` - Start the server

### Router API

#### `createLLMRouter(config: LLMRouterConfig)`

Creates a new LLM router instance.

**Parameters:**

- `rules` (required): Array of routing rules
- `fallback` (optional): Fallback provider configuration
- `retryAttempts` (optional): Number of retry attempts (default: 3)
- `logLevel` (optional): Log level

**Returns:** Router instance

**Methods:**

- `route(input: string): Promise<AgentResponse>` - Route input to appropriate LLM
- `getStats(): object` - Get router statistics
- `listAgents(): string[]` - List all configured agents

### Chatbot API

#### `createChatbot(config: ChatbotConfig)`

Creates a new chatbot instance with conversation memory.

**Parameters:**

- `agent` or `router` (required): Agent or router instance
- `system` (optional): System prompt
- `maxHistory` (optional): Maximum messages to keep (default: 10)

**Returns:** Chatbot instance

**Methods:**

- `chat(message: string): Promise<string>` - Send message with context, returns the reply text
- `getHistory(): ChatMessage[]` - Get conversation history
- `getStats(): object` - Get conversation statistics
- `reset(): void` - Clear conversation history
- `setSystemPrompt(prompt: string): void` - Update system prompt

### API Request Helpers

#### `api.request(config: APIRequestConfig)`

Make HTTP request with retry and timeout.

**Parameters:**

- `name` (optional): Request name for logging
- `url` (required): Request URL
- `method` (optional): HTTP method (default: "GET")
- `headers` (optional): Request headers
- `query` (optional): Query parameters
- `body` (optional): Request body
- `timeout` (optional): Timeout in ms (default: 30000)
- `retries` (optional): Retry attempts (default: 3)

**Returns:** `Promise<APIResponse>`

**Convenience Methods:**

- `api.get(url, config?)` - GET request
- `api.post(url, body, config?)` - POST request
- `api.put(url, body, config?)` - PUT request
- `api.patch(url, body, config?)` - PATCH request
- `api.delete(url, config?)` - DELETE request

---

## Advanced Usage

### Custom Provider

```typescript
// Coming soon: Plugin system for custom providers
```

### Middleware

```typescript
// Coming soon: Middleware support for request/response processing
```

### Streaming Responses

```typescript
// Coming soon: Streaming support for real-time responses
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT © [Dominique Kossi](https://github.com/dominiquekossi)

---

## Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Uses [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by OpenAI, Anthropic, Google, and Ollama

---

## Support

- Email: houessoudominique@gmail.com
- Issues: [GitHub Issues](https://github.com/dominiquekossi/mcp-agent-kit/issues)
- Discussions: [GitHub Discussions](https://github.com/dominiquekossi/mcp-agent-kit/discussions)

---

Made by developers, for developers
