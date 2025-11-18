/**
 * Environment configuration with smart defaults
 * All variables are optional and have sensible defaults
 */

import * as dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

export interface EnvConfig {
  // MCP Server
  mcpServerName: string;
  mcpPort: number;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // LLM API Keys
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  ollamaHost?: string;
}

/**
 * Get environment configuration with smart defaults
 */
export function getEnv(): EnvConfig {
  return {
    // MCP Server defaults
    mcpServerName: process.env.MCP_SERVER_NAME || 'default-mcp-server',
    mcpPort: parseInt(process.env.MCP_PORT || '7777', 10),
    
    // Logging default
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    
    // LLM API Keys (optional)
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  };
}

/**
 * Validate that required API key exists for a provider
 */
export function validateApiKey(provider: string, apiKey?: string): void {
  if (!apiKey && provider !== 'ollama') {
    throw new Error(
      `API key for ${provider} not found. ` +
      `Set ${provider.toUpperCase()}_API_KEY environment variable or pass it in config.`
    );
  }
}
