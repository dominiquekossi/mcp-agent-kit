# mcp-agent-kit

> The easiest way to create MCP servers, AI agents, and chatbots with any LLM

[![npm version](https://img.shields.io/npm/v/mcp-agent-kit.svg)](https://www.npmjs.com/package/mcp-agent-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

**mcp-agent-kit** is a TypeScript package that simplifies the creation of:

- 🔌 **MCP Servers** (Model Context Protocol)
- 🤖 **AI Agents** with multiple LLM providers
- 🧠 **Intelligent Routers** for multi-LLM orchestration
- 💬 **Chatbots** with conversation memory
- 🌐 **API Helpers** with retry and timeout

## Features

- **Zero Config**: Works out of the box with smart defaults
- **Multi-Provider**: OpenAI, Anthropic, Gemini, Ollama support
- **Type-Safe**: Full TypeScript support with autocomplete
- **Production Ready**: Built-in retry, timeout, and error handling
- **Developer Friendly**: One-line setup for complex features
- **Extensible**: Easy to add custom providers and middleware

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

const server = createMCPServer({
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
  model: "gpt-4-turbo-preview",
  temperature: 0.7,
  maxTokens: 2000,
});

const response = await agent.chat("Explain TypeScript");
console.log(response.content);
```

### Supported Providers

| Provider      | Models               | API Key Required |
| ------------- | -------------------- | ---------------- |
| **OpenAI**    | GPT-4, GPT-3.5       | ✅ Yes           |
| **Anthropic** | Claude 3.5, Claude 3 | ✅ Yes           |
| **Gemini**    | Gemini 2.0+          | ✅ Yes           |
| **Ollama**    | Local models         | ❌ No            |

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

---

## MCP Servers

Create Model Context Protocol servers to expose tools and resources.

### Basic MCP Server

```typescript
import { createMCPServer } from "mcp-agent-kit";

const server = createMCPServer({
  name: "my-mcp-server",
  port: 7777,
  logLevel: "info",
});

await server.start(); // Starts on stdio by default
```

### With Tools

```typescript
const server = createMCPServer({
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
const server = createMCPServer({
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

### WebSocket Transport

```typescript
const server = createMCPServer({
  name: "ws-server",
  port: 8080,
});

await server.start("websocket"); // Use WebSocket instead of stdio
```

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
      use: { provider: "openai", model: "gpt-4-turbo-preview" },
    },
    {
      when: (input) => input.includes("code"),
      use: { provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
    },
    {
      default: true,
      use: { provider: "openai", model: "gpt-4-turbo-preview" },
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
    model: 'gpt-4-turbo-preview'
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
// ['openai:gpt-4-turbo-preview', 'anthropic:claude-3-5-sonnet-20241022']
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
- `mcp-server.ts` - MCP server with tools and resources
- `mcp-server-websocket.ts` - MCP server with WebSocket
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
