/**
 * mcp-agent-kit
 * The easiest way to create MCP servers, AI agents, and chatbots
 */

// Core
export { getEnv } from './core/env';
export { logger, createLogger } from './core/logger';

// Types
export * from './types';

// Agent
export { createAgent, Agent } from './agent/createAgent';

// MCP Server
export { createMCPServer, MCPServer } from './mcp/createServer';

// MCP Orchestrator (client side: connect to and aggregate MCP servers)
export {
  connectMCP,
  MCPOrchestrator,
  matchesPattern,
} from './mcp/client/connectMCP';
export type {
  ConnectMCPConfig,
  MCPServerSpec,
  MCPStdioServer,
  MCPHttpServer,
  MCPServerStatus,
  MCPServerState,
  MCPCallRecord,
} from './mcp/client/types';

// Router
export { createLLMRouter, LLMRouter } from './router/createLLMRouter';

// Chatbot
export { createChatbot, Chatbot } from './chatbot/createChatbot';

// API
export { api, createAPIClient } from './api/request';
