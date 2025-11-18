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

[1.0.0]: https://github.com/dominiquekossi/mcp-agent-kit/releases/tag/v1.0.0
