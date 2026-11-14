/**
 * MCP Server - Create a complete MCP server with one function
 */

import { createServer as createHttpServer, Server as HttpServer } from "http";
import { timingSafeEqual } from "crypto";
import { MCPServerConfig, MCPTool, MCPResource } from "../types";
import { getEnv } from "../core/env";
import { logger, createLogger, Logger } from "../core/logger";

/** Transports a server can be started on. */
export type MCPTransportKind = "stdio" | "http";

// Dynamic imports for ESM modules
let Server: any;
let StdioServerTransport: any;
let StreamableHTTPServerTransport: any;
let CallToolRequestSchema: any;
let ListToolsRequestSchema: any;
let ListResourcesRequestSchema: any;
let ReadResourceRequestSchema: any;

async function loadMCPSDK() {
  if (!Server) {
    const serverModule = await import(
      "@modelcontextprotocol/sdk/server/index.js"
    );
    Server = serverModule.Server;

    const stdioModule = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    StdioServerTransport = stdioModule.StdioServerTransport;

    const httpModule = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    StreamableHTTPServerTransport = httpModule.StreamableHTTPServerTransport;

    const typesModule = await import("@modelcontextprotocol/sdk/types.js");
    CallToolRequestSchema = typesModule.CallToolRequestSchema;
    ListToolsRequestSchema = typesModule.ListToolsRequestSchema;
    ListResourcesRequestSchema = typesModule.ListResourcesRequestSchema;
    ReadResourceRequestSchema = typesModule.ReadResourceRequestSchema;
  }
}

/**
 * Minimal check of tool arguments against the tool's inputSchema:
 * object shape, required keys, and primitive types of declared properties.
 */
function validateToolArgs(tool: MCPTool, args: unknown): string | null {
  if (args === null || typeof args !== "object" || Array.isArray(args)) {
    return "arguments must be an object";
  }
  const input = args as Record<string, unknown>;

  for (const key of tool.inputSchema.required || []) {
    if (input[key] === undefined) return `missing required field "${key}"`;
  }

  const props = tool.inputSchema.properties || {};
  for (const [key, value] of Object.entries(input)) {
    const expected = props[key]?.type;
    if (!expected || value === undefined || value === null) continue;
    const actual = Array.isArray(value) ? "array" : typeof value;
    const ok =
      expected === "integer"
        ? Number.isInteger(value)
        : ["string", "number", "boolean", "object", "array"].includes(expected)
          ? actual === expected
          : true;
    if (!ok) return `field "${key}" must be of type ${expected}`;
  }
  return null;
}

export class MCPServer {
  private server: any;
  private config: MCPServerConfig;
  private tools: Map<string, MCPTool>;
  private resources: Map<string, MCPResource>;
  private logger: Logger;
  private isRunning: boolean = false;
  private httpServer: HttpServer | null = null;
  private transportType: MCPTransportKind = "stdio";
  private initialized: boolean = false;

  private constructor(config: MCPServerConfig = {}) {
    const env = getEnv();

    this.config = {
      name: config.name || env.mcpServerName,
      port: config.port || env.mcpPort,
      path: config.path || '/mcp',
      host: config.host || '127.0.0.1',
      authToken: config.authToken,
      allowedOrigins: config.allowedOrigins || [],
      allowedHosts: config.allowedHosts || [],
      maxBodyBytes: config.maxBodyBytes || 1024 * 1024,
      logLevel: config.logLevel || env.logLevel,
      tools: config.tools || [],
      resources: config.resources || [],
    };

    this.logger = createLogger(
      this.config.logLevel,
      `mcp-server:${this.config.name}`
    );
    this.tools = new Map();
    this.resources = new Map();

    this.config.tools?.forEach((tool) => this.registerTool(tool));
    this.config.resources?.forEach((resource) =>
      this.registerResource(resource)
    );
  }

  static async create(config: MCPServerConfig = {}): Promise<MCPServer> {
    await loadMCPSDK();
    const instance = new MCPServer(config);

    instance.server = instance.buildServer();
    instance.initialized = true;
    instance.logger.info(`MCP Server initialized: ${instance.config.name}`);
    return instance;
  }

  /**
   * Build a protocol server with this instance's tools and resources.
   *
   * Stateless HTTP needs a fresh server and transport per request — a single
   * transport can only serve one exchange — so this is called per request
   * there, and once at startup for stdio.
   */
  private buildServer(): any {
    const server = new Server(
      {
        name: this.config.name!,
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers(server);
    return server;
  }

  private setupHandlers(target: any): void {
    const server = target;

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug("Listing tools");
      return {
        tools: Array.from(this.tools.values()).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const { name, arguments: args } = request.params;
        // Log only argument names: values can hold secrets or personal data.
        this.logger.debug(
          `Tool called: ${name}`,
          args && typeof args === "object" ? Object.keys(args) : []
        );

        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        try {
          const problem = validateToolArgs(tool, args || {});
          if (problem) {
            throw new Error(`Invalid arguments for ${name}: ${problem}`);
          }
          const result = await tool.handler(args || {});
          this.logger.debug(`Tool ${name} executed successfully`);
          return {
            content: [
              {
                type: "text",
                text:
                  typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          this.logger.error(`Tool ${name} failed:`, error.message);
          throw error;
        }
      }
    );

    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug("Listing resources");
      return {
        resources: Array.from(this.resources.values()).map((resource) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType || "text/plain",
        })),
      };
    });

    server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: any) => {
        const { uri } = request.params;
        this.logger.debug(`Resource requested: ${uri}`);

        const resource = this.resources.get(uri);
        if (!resource) {
          throw new Error(`Resource not found: ${uri}`);
        }

        try {
          const content = await resource.handler();
          this.logger.debug(`Resource ${uri} read successfully`);
          return {
            contents: [
              {
                uri: resource.uri,
                mimeType: resource.mimeType || "text/plain",
                text:
                  typeof content === "string" ? content : content.toString(),
              },
            ],
          };
        } catch (error: any) {
          this.logger.error(`Resource ${uri} failed:`, error.message);
          throw error;
        }
      }
    );
  }

  /**
   * Serve MCP over Streamable HTTP — the transport current MCP clients speak.
   * Runs stateless: each request carries everything the server needs.
   */
  private async startHttp(): Promise<void> {
    const port = this.config.port!;
    const path = this.config.path || "/mcp";

    this.logger.info(
      `Starting MCP Server on Streamable HTTP (port ${port}, path ${path})...`
    );

    this.httpServer = createHttpServer((req, res) => {
      void this.handleHttpRequest(path, req, res);
    });

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      this.httpServer!.once("error", onError);
      this.httpServer!.listen(port, this.config.host, () => {
        this.httpServer!.off("error", onError);
        resolve();
      });
    });
  }

  private async handleHttpRequest(
    path: string,
    req: any,
    res: any
  ): Promise<void> {
    let server: any;
    let transport: any;

    try {
      const url = new URL(
        req.url || "/",
        `http://${req.headers.host || "localhost"}`
      );

      if (!this.isRequestAllowed(req, res)) return;

      if (url.pathname !== path) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Not found. MCP is served at ${path}` }));
        return;
      }

      const body = req.method === "POST" ? await this.readJsonBody(req) : undefined;

      // Stateless mode: one server and transport per request. Reusing a single
      // transport across requests makes the second exchange fail with a 500.
      server = this.buildServer();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on("close", () => {
        void transport?.close();
        void server?.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error: any) {
      this.logger.error("HTTP request failed:", error.message);

      if (!res.headersSent) {
        const tooLarge = error?.code === "BODY_TOO_LARGE";
        const badJson = error?.code === "BAD_JSON";
        res.writeHead(tooLarge ? 413 : badJson ? 400 : 500, {
          "Content-Type": "application/json",
        });
        // Internal error details stay in the log, not in the response.
        res.end(
          JSON.stringify({
            error: tooLarge
              ? "Request body too large"
              : badJson
                ? "Request body is not valid JSON"
                : "Internal server error",
          })
        );
      }
    }
  }

  /**
   * Guards for the HTTP transport: Host allow-list (DNS rebinding), Origin
   * allow-list (browser callers) and optional bearer token. Writes the
   * error response and returns false when the request is refused.
   */
  private isRequestAllowed(req: any, res: any): boolean {
    const deny = (status: number, message: string): false => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
      return false;
    };

    const port = this.config.port;
    const hostHeader = String(req.headers.host || "").toLowerCase();
    const allowedHosts = new Set(
      [
        `localhost:${port}`,
        `127.0.0.1:${port}`,
        `[::1]:${port}`,
        ...(this.config.allowedHosts || []),
      ].map((h) => h.toLowerCase())
    );
    if (!allowedHosts.has(hostHeader)) return deny(403, "Host not allowed");

    const origin = req.headers.origin;
    if (origin && !(this.config.allowedOrigins || []).includes(origin)) {
      return deny(403, "Origin not allowed");
    }

    if (this.config.authToken) {
      const supplied = String(req.headers.authorization || "");
      const expected = `Bearer ${this.config.authToken}`;
      const a = Buffer.from(supplied);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return deny(401, "Unauthorized");
      }
    }
    return true;
  }

  private readJsonBody(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const limit = this.config.maxBodyBytes!;
      let received = 0;

      req.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (received > limit) {
          const error: any = new Error("Request body too large");
          error.code = "BODY_TOO_LARGE";
          req.destroy();
          reject(error);
          return;
        }
        chunks.push(chunk);
      });
      req.on("error", reject);
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");

        if (!raw) {
          resolve(undefined);
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
          const error: any = new Error("Request body is not valid JSON");
          error.code = "BAD_JSON";
          reject(error);
        }
      });
    });
  }

  registerTool(tool: MCPTool): void {
    this.logger.debug(`Registering tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  registerResource(resource: MCPResource): void {
    this.logger.debug(`Registering resource: ${resource.uri}`);
    this.resources.set(resource.uri, resource);
  }

  async start(transport?: MCPTransportKind | "websocket"): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Server is already running");
      return;
    }

    if (transport === "websocket") {
      // The old WebSocket transport accepted connections but was never wired to
      // the MCP server, so it answered nothing. Streamable HTTP is the current
      // standard transport and is implemented below.
      throw new Error(
        'The "websocket" transport was removed in v1.2.0: it accepted ' +
          "connections without ever answering MCP requests. Use " +
          'start("http") for Streamable HTTP, or start() for stdio.'
      );
    }

    this.transportType = transport || "stdio";

    try {
      if (this.transportType === "http") {
        await this.startHttp();
      } else {
        this.logger.info(`Starting MCP Server on stdio transport...`);
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
      }

      this.isRunning = true;
      this.logger.info(
        `MCP Server started successfully (${this.transportType})`
      );
      this.logger.info(`Tools registered: ${this.tools.size}`);
      this.logger.info(`Resources registered: ${this.resources.size}`);
    } catch (error: any) {
      this.logger.error("Failed to start server:", error.message);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn("Server is not running");
      return;
    }

    try {
      this.logger.info("Stopping MCP Server...");

      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => resolve());
          // Sockets kept alive by clients would otherwise hold close() open.
          this.httpServer!.closeAllConnections?.();
        });
        this.httpServer = null;
      }

      await this.server.close();
      this.isRunning = false;
      this.logger.info("MCP Server stopped");
    } catch (error: any) {
      this.logger.error("Failed to stop server:", error.message);
      throw error;
    }
  }

  getStatus(): {
    running: boolean;
    tools: number;
    resources: number;
    transport: MCPTransportKind;
    url?: string;
  } {
    const status: {
      running: boolean;
      tools: number;
      resources: number;
      transport: MCPTransportKind;
      url?: string;
    } = {
      running: this.isRunning,
      tools: this.tools.size,
      resources: this.resources.size,
      transport: this.transportType,
    };

    if (this.transportType === "http" && this.isRunning) {
      status.url = `http://localhost:${this.config.port}${this.config.path || "/mcp"}`;
    }

    return status;
  }
}

export async function createMCPServer(
  config?: MCPServerConfig
): Promise<MCPServer> {
  return await MCPServer.create(config);
}
