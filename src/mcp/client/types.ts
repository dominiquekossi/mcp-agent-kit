/**
 * Types for the MCP orchestrator (the client side of MCP).
 */

import { LogLevel } from '../../core/logger';

/** A server started as a child process and spoken to over stdio. */
export interface MCPStdioServer {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  /**
   * What to do with the child process's stderr. `inherit` (default) lets its
   * logs through to your own stderr; `pipe` captures them, so they can be
   * shown only when the connection fails.
   */
  stderr?: 'inherit' | 'pipe';
}

/** A server reached over Streamable HTTP. */
export interface MCPHttpServer {
  url: string;
  headers?: Record<string, string>;
}

export type MCPServerTransportConfig = MCPStdioServer | MCPHttpServer;

export type MCPServerSpec = MCPServerTransportConfig & {
  /** Only expose these tools from this server (glob, `*` allowed) */
  allowTools?: string[];
  /** Never expose these tools from this server (glob, `*` allowed) */
  denyTools?: string[];
  /** Skip this server without removing its config */
  enabled?: boolean;
};

export interface ConnectMCPConfig {
  /** Servers to connect to, keyed by the name used to namespace their tools */
  servers: Record<string, MCPServerSpec>;
  /** Allowlist applied to namespaced names, e.g. `github__*` */
  allowTools?: string[];
  /** Denylist applied to namespaced names */
  denyTools?: string[];
  /** How long to wait for a server to connect (ms). Default: 30000 */
  connectTimeout?: number;
  /** How long a single tool call may take (ms). Default: 60000 */
  toolTimeout?: number;
  /** Separator between server name and tool name. Default: `__` */
  namespaceSeparator?: string;
  /**
   * Fail the whole connect when any server fails. Default false: a server that
   * is down degrades the tool set instead of taking the agent with it.
   */
  strict?: boolean;
  /** Retry a failed call once after reconnecting. Default: true */
  autoReconnect?: boolean;
  logLevel?: LogLevel;
}

export type MCPServerState = 'connected' | 'failed' | 'disabled' | 'closed';

export interface MCPServerStatus {
  name: string;
  state: MCPServerState;
  transport: 'stdio' | 'http';
  /** Tools exposed after filtering */
  tools: number;
  /** Tools the server offered before filtering */
  toolsAvailable: number;
  error?: string;
}

export interface MCPCallRecord {
  server: string;
  tool: string;
  durationMs: number;
  ok: boolean;
  error?: string;
}
