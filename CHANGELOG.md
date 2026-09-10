# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-07

The headline is the MCP orchestrator. Everything before it is a correctness
release: three of the defects fixed here made documented features not work at
all.

### Added

#### `inspect` CLI

- `npx mcp-agent-kit inspect <command|url>` — connect to any MCP server, list
  its tools and resources, validate the schemas and time the round-trips.
  Usable without adopting the library
- Schema validation that catches what real clients reject: tool names outside
  `[a-zA-Z0-9_-]{1,64}` (OpenAI and Anthropic refuse them), `required` keys with
  no matching property, missing or non-object `inputSchema`, duplicate names.
  Missing descriptions are reported as warnings
- `--call <tool>` with `--args` to exercise a tool and measure its latency
- `--json` for CI, with meaningful exit codes: `0` clean, `1` schema errors,
  `2` could not connect
- `--header` for authenticated HTTP servers, `--env` for stdio servers
- A stdio server's stderr is captured and shown only when the connection
  fails — so its logs explain the failure instead of polluting the report

#### MCP Orchestrator (the client side of MCP)

- `connectMCP({ servers })` — connect to several MCP servers at once over
  stdio and Streamable HTTP, in parallel
- Tool aggregation with per-server namespacing (`github__create_issue`), so two
  servers can expose the same tool name without colliding
- Tool filtering with `allowTools` / `denyTools` globs, per server (bare names)
  and globally (namespaced names) — keeps dozens of tools from bloating the
  prompt and degrading model choices
- Fault isolation: a server that fails to connect degrades the tool set instead
  of failing the agent. `strict: true` opts into all-or-nothing
- Automatic reconnect-and-retry once when a connection drops mid-call
- `agent.use(mcp)` to hand every MCP tool to an agent in one call
- Observability: `getStats()`, `getCallLog()` with per-call server, duration and
  outcome; `listServers()` for connection state
- `getRawTools()`, `listResources()`, `getConnectTime()` and `getServerLogs()`
  for inspecting what a server publishes
- Per-server and per-call timeouts

#### Agent

- `registerTools()` and `listTools()` to add and inspect tools on a live agent
- `toolConfig.autoExecuteTools` (default `true`) and `toolConfig.maxIterations`
  (default `5`)
- `AgentResponse.toolResults` and `AgentResponse.iterations`; `usage` is now
  summed across every round-trip
- Tool handlers receive an `AbortSignal` as a second argument, so a handler can
  cancel its own work when `toolTimeout` fires

#### MCP Server

- Streamable HTTP transport: `server.start("http")`, served at a configurable
  `path` (default `/mcp`)

#### Tooling

- `npm run check:readme` compiles every TypeScript block in README.md
- `npm run check:examples` type-checks `examples/`
- GitHub Actions CI: build, tests, doc checks and a package tarball smoke test
  across Node 18/20/22

### Fixed

- **Tools are now actually executed.** `agent.chat()` returned the model's raw
  tool calls and never ran a handler, so any agent with tools answered with an
  empty string — while the README claimed tools were called automatically. The
  agent now runs the requested tools, feeds their results back to the model and
  returns the final answer
- **Cache no longer returns another call's result.** `ToolCache.generateKey`
  passed sorted keys as `JSON.stringify`'s replacer, which strips nested
  properties at every level: any two calls with nested params produced the same
  key and the cache served the wrong value, silently. Keys are now built with a
  recursive stable serialization, and `null`/primitive params no longer throw
- **README examples run.** `createMCPServer` became async in v1.1.3 but the docs
  and examples kept calling it synchronously, so the Quick Start threw
  `TypeError: server.start is not a function`. Fixed, and CI now compiles every
  example on the page
- **`forceToolUse` and `onToolNotCalled` now do something.** Both were
  documented with defaults, but `PromptEnhancer` — the class implementing them —
  was never called from anywhere. It is now wired into the tool loop with
  progressive prompt escalation
- Anthropic provider read only `content[0]`, losing the text whenever a tool_use
  block came first; it now concatenates every text block
- Anthropic provider no longer sends `temperature` unless explicitly set —
  current Claude models reject sampling parameters with a 400
- Gemini and Ollama providers never passed tool definitions to the model, so
  they could never call a tool
- Chatbot's documented return type corrected to `Promise<string>`
- Cache cleanup timers are `unref()`'d, so a CLI can exit on its own
- Cache cleanup no longer logs unless `debug` is set

### Changed

- **Removed the `websocket` transport.** It accepted connections and ran a
  heartbeat but was never wired to the MCP server, so it answered no requests
  while `getStatus()` reported it healthy. `start("websocket")` now throws with
  a pointer to `start("http")`
- Upgraded `@modelcontextprotocol/sdk` from 0.5.0 (November 2024, pre-1.0) to
  1.30.0 — this is what makes Streamable HTTP and the orchestrator possible
- Default models refreshed: `gpt-4o` (was `gpt-4-turbo-preview`),
  `claude-opus-5` (was `claude-3-5-sonnet-20241022`), `gemini-2.0-flash`,
  `llama3.1` (was `llama2`)
- Test suite grew from 32 tests in one module to 69 across the agent loop, cache
  keys, the orchestrator (against a real MCP server) and HTTP transport

## [1.0.0] - 2024-01-XX

### Added

#### Core Features

- Environment configuration with smart defaults
- Configurable logging system with multiple levels
- Complete TypeScript type definitions

#### AI Agents

- Support for OpenAI (GPT-4, GPT-3.5)
- Support for Anthropic (Claude 3.5, Claude 3)
- Support for Google Gemini (Gemini 2.0+)
- Support for Ollama (local models)
- Unified interface across all providers
- Function calling / tool support
- System prompt configuration
- Temperature and token limit controls

#### MCP Server

- Complete MCP server implementation
- Tool registry and execution
- Resource registry and management
- Stdio transport support
- WebSocket transport support
- Heartbeat and reconnection logic
- Comprehensive logging

#### LLM Router

- Intelligent routing based on custom rules
- Automatic fallback on provider failure
- Retry logic with exponential backoff
- Support for multiple providers simultaneously
- Routing decision logging

#### Chatbot

- Conversation memory management
- Automatic message history pruning
- System prompt persistence
- Context management
- Conversation statistics
- Reset functionality

#### API Helper

- Simplified HTTP request interface
- Automatic retry with exponential backoff
- Configurable timeout
- Request logging with duration tracking
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Query parameters and headers support

#### Documentation

- Comprehensive README with examples
- Troubleshooting guide
- Extensibility guide
- 9 practical examples covering all features

### Technical Details

- **Language**: TypeScript 5.0+
- **Node.js**: 18.0.0+
- **Build System**: TypeScript Compiler
- **Package Manager**: npm

### Dependencies

- `@modelcontextprotocol/sdk`: ^0.5.0
- `axios`: ^1.6.2
- `dotenv`: ^16.3.1
- `ws`: ^8.16.0
- `openai`: ^4.20.0
- `@anthropic-ai/sdk`: ^0.9.0
- `@google/generative-ai`: ^0.1.3

## [1.1.0] - 2024-11-20

### Added

#### Smart Tool Calling

- **Automatic Retry Logic**: Tools now automatically retry on failure with configurable max attempts (default: 3)
- **Timeout Support**: Set execution timeouts for tools to prevent hanging (default: 30s)
- **Result Caching**: Cache tool results with configurable TTL and max size for improved performance
- **Force Tool Use**: Option to force the model to use tools when available
- **Flexible Error Handling**: Configure behavior when tools aren't called: retry, error, warn, or allow
- **Debug Mode**: Enhanced logging for tool execution and retry attempts
- **Direct Tool Execution**: New `executeTool()` method for direct tool invocation with retry and caching

#### Configuration

- New `toolConfig` option in `createAgent()` with comprehensive settings:
  - `forceToolUse`: Force model to use tools (default: false)
  - `maxRetries`: Maximum retry attempts (default: 3)
  - `onToolNotCalled`: Action when tool not called (default: "retry")
  - `toolTimeout`: Timeout in milliseconds (default: 30000)
  - `cacheResults`: Caching configuration with enabled, ttl, and maxSize options
  - `debug`: Enable debug logging (default: false)

#### Documentation

- Added comprehensive Smart Tool Calling section to README
- Added complete API Reference section with all methods and types
- Added `smart-tool-calling.ts` example demonstrating all features
- Updated examples list in documentation

#### Testing

- Added comprehensive test suite for smart tool calling features
- E2E tests for retry logic, timeout, and caching
- Integration tests for tool execution
- Cache behavior tests

### Technical Details

- New modules:
  - `src/agent/smart-tool-calling/retry-logic.ts`: Retry mechanism implementation
  - `src/agent/smart-tool-calling/cache.ts`: Result caching system
  - `src/agent/smart-tool-calling/config.ts`: Configuration management
  - `src/agent/smart-tool-calling/index.ts`: Main smart tool calling orchestrator
- Enhanced `createAgent()` with tool configuration support
- Added `SmartToolConfig` type definition

## [1.1.1] - 2024-11-20

### Fixed

- **ESM Compatibility**: Fixed critical issue where package was using CommonJS but dependencies required ESM
- Changed package to use `"type": "module"` for proper ESM support
- Updated TypeScript configuration to compile to ES2020 modules instead of CommonJS
- Renamed `jest.config.js` to `jest.config.cjs` for compatibility

### Technical Details

- Package now properly supports ESM imports
- Fixed `ERR_REQUIRE_ESM` error when importing from npm
- All tests passing (32 tests, 4 suites)

## [1.1.2] - 2024-11-20

### Fixed

- **Package Size**: Excluded demo folder from npm package (reduced from 3.7MB to ~54KB)
- Updated .npmignore to prevent demo files from being published

## [1.1.3] - 2024-11-20

### Fixed

- **ESM/CommonJS Compatibility**: Fixed module resolution issues by using dynamic imports for MCP SDK
- Changed `createMCPServer` to async function to support dynamic imports
- Reverted to CommonJS compilation with dynamic ESM imports for better compatibility
- All tests passing (32 tests, 4 suites)

### Changed

- `createMCPServer()` is now async and returns `Promise<MCPServer>`
- MCP SDK modules are loaded dynamically to avoid ESM/CommonJS conflicts

## [Unreleased]

### Planned Features

- Streaming response support
- Rate limiting
- Cost tracking
- Plugin system
- Middleware support
- Additional providers
- Web UI for debugging

---

[1.1.3]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.1.3
[1.1.2]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.1.2
[1.1.1]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.1.1
[1.1.0]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.1.0
[1.0.0]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.0.0
