/**
 * MCP Orchestrator — connect to several MCP servers at once, aggregate their
 * tools behind one namespace, and hand them to an agent.
 *
 * This is the client half of MCP: `createMCPServer` publishes tools, this
 * consumes them.
 */

import { AgentTool } from '../../types';
import { createLogger, Logger } from '../../core/logger';
import {
  ConnectMCPConfig,
  MCPCallRecord,
  MCPHttpServer,
  MCPServerSpec,
  MCPServerState,
  MCPServerStatus,
  MCPStdioServer,
} from './types';

// Dynamic imports: the MCP SDK is ESM-only, so it cannot be required from the
// CommonJS build at load time.
let Client: any;
let StdioClientTransport: any;
let StreamableHTTPClientTransport: any;

async function loadMCPClientSDK(): Promise<void> {
  if (Client) {
    return;
  }

  const clientModule = await import('@modelcontextprotocol/sdk/client/index.js');
  Client = clientModule.Client;

  const stdioModule = await import('@modelcontextprotocol/sdk/client/stdio.js');
  StdioClientTransport = stdioModule.StdioClientTransport;

  const httpModule = await import(
    '@modelcontextprotocol/sdk/client/streamableHttp.js'
  );
  StreamableHTTPClientTransport = httpModule.StreamableHTTPClientTransport;
}

function isHttpServer(spec: MCPServerSpec): spec is MCPHttpServer {
  return typeof (spec as MCPHttpServer).url === 'string';
}

/**
 * Match a name against a glob pattern supporting `*`.
 * `github__*` matches `github__create_issue`; `*` matches everything.
 */
export function matchesPattern(name: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(name);
}

function isAllowed(
  name: string,
  allow?: string[],
  deny?: string[]
): boolean {
  if (deny?.some((pattern) => matchesPattern(name, pattern))) {
    return false;
  }

  if (allow?.length) {
    return allow.some((pattern) => matchesPattern(name, pattern));
  }

  return true;
}

interface ConnectedServer {
  name: string;
  spec: MCPServerSpec;
  client: any;
  state: MCPServerState;
  transport: 'stdio' | 'http';
  toolsAvailable: number;
  tools: AgentTool[];
  /** Tool definitions exactly as the server declared them */
  rawTools: any[];
  /** How long the connect handshake took, in ms */
  connectMs: number;
  error?: string;
}

export class MCPOrchestrator {
  private config: Required<
    Pick<
      ConnectMCPConfig,
      | 'connectTimeout'
      | 'toolTimeout'
      | 'namespaceSeparator'
      | 'strict'
      | 'autoReconnect'
    >
  > &
    ConnectMCPConfig;
  private logger: Logger;
  private servers: Map<string, ConnectedServer> = new Map();
  private calls: MCPCallRecord[] = [];
  private stderrByServer: Map<string, string[]> = new Map();

  constructor(config: ConnectMCPConfig) {
    this.config = {
      connectTimeout: 30000,
      toolTimeout: 60000,
      namespaceSeparator: '__',
      strict: false,
      autoReconnect: true,
      ...config,
    };

    this.logger = createLogger(config.logLevel || 'info', 'mcp-orchestrator');
  }

  /** Connect to every enabled server, in parallel. */
  async connect(): Promise<void> {
    await loadMCPClientSDK();

    const entries = Object.entries(this.config.servers);

    if (entries.length === 0) {
      this.logger.warn('No MCP servers configured');
      return;
    }

    this.logger.info(`Connecting to ${entries.length} MCP server(s)...`);

    // One slow or dead server must not delay the others.
    await Promise.all(
      entries.map(([name, spec]) => this.connectServer(name, spec))
    );

    const connected = this.listServers().filter((s) => s.state === 'connected');
    this.logger.info(
      `Connected to ${connected.length}/${entries.length} server(s); ` +
        `${this.getTools().length} tool(s) available`
    );
  }

  private async connectServer(
    name: string,
    spec: MCPServerSpec
  ): Promise<void> {
    const transport: 'stdio' | 'http' = isHttpServer(spec) ? 'http' : 'stdio';

    if (spec.enabled === false) {
      this.servers.set(name, {
        name,
        spec,
        client: null,
        state: 'disabled',
        transport,
        toolsAvailable: 0,
        tools: [],
        rawTools: [],
        connectMs: 0,
      });
      this.logger.debug(`Server ${name} is disabled; skipping`);
      return;
    }

    const startedAt = Date.now();

    try {
      const client = await this.withTimeout(
        this.openClient(name, spec),
        this.config.connectTimeout,
        `Timed out connecting to MCP server "${name}"`
      );

      const connectMs = Date.now() - startedAt;
      const listed = await client.listTools();
      const offered = listed.tools || [];

      const entry: ConnectedServer = {
        name,
        spec,
        client,
        state: 'connected',
        transport,
        toolsAvailable: offered.length,
        tools: [],
        rawTools: offered,
        connectMs,
      };

      entry.tools = offered
        .filter((tool: any) => this.toolPassesFilters(name, tool.name, spec))
        .map((tool: any) => this.toAgentTool(name, tool));

      this.servers.set(name, entry);

      this.logger.info(
        `Server ${name} connected: ${entry.tools.length}/${offered.length} tool(s) exposed`
      );
    } catch (error: any) {
      this.servers.set(name, {
        name,
        spec,
        client: null,
        state: 'failed',
        transport,
        toolsAvailable: 0,
        tools: [],
        rawTools: [],
        connectMs: Date.now() - startedAt,
        error: error.message,
      });

      if (this.config.strict) {
        throw new Error(
          `Failed to connect to MCP server "${name}": ${error.message}`
        );
      }

      // Degrade instead of failing: the agent keeps every other server's tools.
      this.logger.warn(`Server ${name} unavailable: ${error.message}`);
    }
  }

  private async openClient(name: string, spec: MCPServerSpec): Promise<any> {
    const client = new Client(
      { name: `mcp-agent-kit:${name}`, version: '1.2.0' },
      { capabilities: {} }
    );

    const transport = isHttpServer(spec)
      ? new StreamableHTTPClientTransport(new URL(spec.url), {
          requestInit: spec.headers ? { headers: spec.headers } : undefined,
        })
      : new StdioClientTransport({
          command: (spec as MCPStdioServer).command,
          args: (spec as MCPStdioServer).args,
          env: (spec as MCPStdioServer).env,
          cwd: (spec as MCPStdioServer).cwd,
          stderr: (spec as MCPStdioServer).stderr || 'inherit',
        });

    // With `stderr: 'pipe'` the child's logs are captured instead of printed,
    // so a failed connection can report what the server actually said.
    if (transport.stderr) {
      const buffer: string[] = [];

      transport.stderr.on('data', (chunk: Buffer) => {
        buffer.push(chunk.toString());
        // Keep only the tail: a chatty server should not grow this forever.
        if (buffer.length > 50) {
          buffer.splice(0, buffer.length - 50);
        }
      });

      this.stderrByServer.set(name, buffer);
    }

    await client.connect(transport);
    return client;
  }

  /** Captured stderr from a stdio server started with `stderr: 'pipe'`. */
  getServerLogs(serverName: string): string {
    return (this.stderrByServer.get(serverName) || []).join('').trim();
  }

  private toolPassesFilters(
    server: string,
    toolName: string,
    spec: MCPServerSpec
  ): boolean {
    // Per-server filters use the bare tool name, global ones the namespaced
    // name, so both read naturally in config.
    if (!isAllowed(toolName, spec.allowTools, spec.denyTools)) {
      return false;
    }

    const namespaced = this.namespace(server, toolName);
    return isAllowed(namespaced, this.config.allowTools, this.config.denyTools);
  }

  private namespace(server: string, tool: string): string {
    return `${server}${this.config.namespaceSeparator}${tool}`;
  }

  /**
   * Wrap one MCP tool as an AgentTool the agent loop can execute directly.
   */
  private toAgentTool(server: string, tool: any): AgentTool {
    return {
      name: this.namespace(server, tool.name),
      description: tool.description || `${tool.name} (from ${server})`,
      parameters: tool.inputSchema || { type: 'object', properties: {} },
      handler: async (params: any) => this.invoke(server, tool.name, params),
    };
  }

  /**
   * Call a tool by its namespaced name, e.g. `github__create_issue`.
   */
  async callTool(namespacedName: string, params: any = {}): Promise<any> {
    const separator = this.config.namespaceSeparator;
    const index = namespacedName.indexOf(separator);

    if (index === -1) {
      throw new Error(
        `Tool name "${namespacedName}" is not namespaced (expected "server${separator}tool")`
      );
    }

    const server = namespacedName.slice(0, index);
    const tool = namespacedName.slice(index + separator.length);

    return this.invoke(server, tool, params);
  }

  private async invoke(
    serverName: string,
    toolName: string,
    params: any
  ): Promise<any> {
    const entry = this.servers.get(serverName);

    if (!entry) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    if (entry.state !== 'connected' || !entry.client) {
      throw new Error(
        `MCP server "${serverName}" is ${entry.state}${entry.error ? `: ${entry.error}` : ''}`
      );
    }

    const startedAt = Date.now();

    try {
      const result = await this.withTimeout(
        entry.client.callTool({ name: toolName, arguments: params ?? {} }),
        this.config.toolTimeout,
        `Tool ${serverName}${this.config.namespaceSeparator}${toolName} timed out after ${this.config.toolTimeout}ms`
      );

      this.record(serverName, toolName, startedAt, true);
      return this.unwrapResult(result);
    } catch (error: any) {
      // A dropped transport is worth one reconnect before giving up: stdio
      // servers die and restart, HTTP sessions expire.
      if (this.config.autoReconnect && this.isConnectionError(error)) {
        this.logger.warn(
          `Connection to ${serverName} lost; reconnecting and retrying once`
        );

        try {
          await this.reconnect(serverName);
          const retried = await this.withTimeout(
            this.servers
              .get(serverName)!
              .client.callTool({ name: toolName, arguments: params ?? {} }),
            this.config.toolTimeout,
            `Tool ${toolName} timed out after reconnect`
          );

          this.record(serverName, toolName, startedAt, true);
          return this.unwrapResult(retried);
        } catch (retryError: any) {
          this.record(serverName, toolName, startedAt, false, retryError.message);
          throw retryError;
        }
      }

      this.record(serverName, toolName, startedAt, false, error.message);
      throw error;
    }
  }

  private isConnectionError(error: any): boolean {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('closed') ||
      message.includes('econnreset') ||
      message.includes('epipe') ||
      message.includes('not connected') ||
      message.includes('session')
    );
  }

  /** Drop and re-establish one server's connection. */
  async reconnect(serverName: string): Promise<void> {
    const entry = this.servers.get(serverName);

    if (!entry) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    try {
      await entry.client?.close();
    } catch {
      // Already gone; nothing to clean up.
    }

    await this.connectServer(serverName, entry.spec);

    const reconnected = this.servers.get(serverName);
    if (reconnected?.state !== 'connected') {
      throw new Error(
        `Could not reconnect to "${serverName}"${reconnected?.error ? `: ${reconnected.error}` : ''}`
      );
    }
  }

  /**
   * MCP returns content blocks; give handlers the plain value when there is
   * one, and keep the structured payload when there is more.
   */
  private unwrapResult(result: any): any {
    if (result?.structuredContent !== undefined) {
      return result.structuredContent;
    }

    const content = result?.content;

    if (!Array.isArray(content)) {
      return result;
    }

    const texts = content
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => block.text);

    if (texts.length === content.length && texts.length > 0) {
      const joined = texts.join('\n');

      // Servers commonly return JSON as text; hand back the parsed value so
      // the model sees structured data rather than an escaped string.
      try {
        return JSON.parse(joined);
      } catch {
        return joined;
      }
    }

    return content;
  }

  private record(
    server: string,
    tool: string,
    startedAt: number,
    ok: boolean,
    error?: string
  ): void {
    const record: MCPCallRecord = {
      server,
      tool,
      durationMs: Date.now() - startedAt,
      ok,
      ...(error ? { error } : {}),
    };

    this.calls.push(record);

    if (ok) {
      this.logger.debug(
        `${server}/${tool} ok in ${record.durationMs}ms`
      );
    } else {
      this.logger.warn(
        `${server}/${tool} failed in ${record.durationMs}ms: ${error}`
      );
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message: string
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(message)), ms);
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /** Every tool exposed across all connected servers, namespaced. */
  getTools(): AgentTool[] {
    const tools: AgentTool[] = [];

    for (const entry of this.servers.values()) {
      tools.push(...entry.tools);
    }

    return tools;
  }

  /** Tools from one server only. */
  getServerTools(serverName: string): AgentTool[] {
    return [...(this.servers.get(serverName)?.tools || [])];
  }

  /**
   * Tool definitions exactly as a server declared them — original names, raw
   * input schemas, no namespacing and no filtering. Use this to inspect or
   * validate what a server publishes.
   */
  getRawTools(serverName: string): any[] {
    return [...(this.servers.get(serverName)?.rawTools || [])];
  }

  /** How long a server's connect handshake took, in ms. */
  getConnectTime(serverName: string): number {
    return this.servers.get(serverName)?.connectMs ?? 0;
  }

  /** Resources a server publishes. Returns [] when it exposes none. */
  async listResources(serverName: string): Promise<any[]> {
    const entry = this.servers.get(serverName);

    if (!entry || entry.state !== 'connected' || !entry.client) {
      return [];
    }

    try {
      const listed = await entry.client.listResources();
      return listed.resources || [];
    } catch (error: any) {
      // Servers without the resources capability answer with an error rather
      // than an empty list; that is not a failure worth propagating.
      this.logger.debug(
        `Server ${serverName} exposes no resources: ${error.message}`
      );
      return [];
    }
  }

  listServers(): MCPServerStatus[] {
    return Array.from(this.servers.values()).map((entry) => ({
      name: entry.name,
      state: entry.state,
      transport: entry.transport,
      tools: entry.tools.length,
      toolsAvailable: entry.toolsAvailable,
      ...(entry.error ? { error: entry.error } : {}),
    }));
  }

  /** Per-call history, for cost and latency reporting. */
  getCallLog(): MCPCallRecord[] {
    return [...this.calls];
  }

  getStats(): {
    servers: number;
    connected: number;
    failed: number;
    tools: number;
    calls: number;
    failedCalls: number;
    avgDurationMs: number;
  } {
    const statuses = this.listServers();
    const failedCalls = this.calls.filter((c) => !c.ok).length;
    const totalDuration = this.calls.reduce((sum, c) => sum + c.durationMs, 0);

    return {
      servers: statuses.length,
      connected: statuses.filter((s) => s.state === 'connected').length,
      failed: statuses.filter((s) => s.state === 'failed').length,
      tools: this.getTools().length,
      calls: this.calls.length,
      failedCalls,
      avgDurationMs: this.calls.length
        ? Math.round(totalDuration / this.calls.length)
        : 0,
    };
  }

  /** Close every connection. Safe to call more than once. */
  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.servers.values()).map(async (entry) => {
        try {
          await entry.client?.close();
        } catch (error: any) {
          this.logger.debug(`Error closing ${entry.name}: ${error.message}`);
        }
        entry.client = null;
        entry.state = 'closed';
        entry.tools = [];
      })
    );

    this.logger.info('All MCP connections closed');
  }
}

/**
 * Connect to one or more MCP servers and aggregate their tools.
 *
 * @example
 * ```ts
 * const mcp = await connectMCP({
 *   servers: {
 *     filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'] },
 *     github: { url: 'https://mcp.example.com/mcp', headers: { Authorization: 'Bearer ...' } },
 *   },
 *   allowTools: ['filesystem__read_file', 'github__*'],
 * });
 *
 * const agent = createAgent({ provider: 'openai' });
 * agent.use(mcp);
 *
 * const answer = await agent.chat('Summarise the open issues and save them to notes.md');
 * await mcp.close();
 * ```
 */
export async function connectMCP(
  config: ConnectMCPConfig
): Promise<MCPOrchestrator> {
  const orchestrator = new MCPOrchestrator(config);
  await orchestrator.connect();
  return orchestrator;
}
