# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
