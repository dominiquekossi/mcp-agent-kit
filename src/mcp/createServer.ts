/**
 * MCP Server - Create a complete MCP server with one function
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPServerConfig, MCPTool, MCPResource } from '../types';
import { getEnv } from '../core/env';
import { logger, createLogger, Logger } from '../core/logger';
import { WebSocketTransport } from './transport';

export class MCPServer {
  private server: Server;
  private config: MCPServerConfig;
  private tools: Map<string, MCPTool>;
  private resources: Map<string, MCPResource>;
  private logger: Logger;
  private isRunning: boolean = false;
  private wsTransport: WebSocketTransport | null = null;
  private transportType: 'stdio' | 'websocket' = 'stdio';

  constructor(config: MCPServerConfig = {}) {
    const env = getEnv();
    
    this.config = {
      name: config.name || env.mcpServerName,
      port: config.port || env.mcpPort,
      logLevel: config.logLevel || env.logLevel,
      tools: config.tools || [],
      resources: config.resources || [],
    };

    this.logger = createLogger(this.config.logLevel, `mcp-server:${this.config.name}`);
    this.tools = new Map();
    this.resources = new Map();

    this.config.tools?.forEach(tool => this.registerTool(tool));
    this.config.resources?.forEach(resource => this.registerResource(resource));

    this.server = new Server(
      {
        name: this.config.name!,
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    this.logger.info(`MCP Server initialized: ${this.config.name}`);
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing tools');
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.debug(`Tool called: ${name}`, args);

      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});
        this.logger.debug(`Tool ${name} executed successfully`);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        this.logger.error(`Tool ${name} failed:`, error.message);
        throw error;
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing resources');
      return {
        resources: Array.from(this.resources.values()).map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType || 'text/plain',
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
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
              mimeType: resource.mimeType || 'text/plain',
              text: typeof content === 'string' ? content : content.toString(),
            },
          ],
        };
      } catch (error: any) {
        this.logger.error(`Resource ${uri} failed:`, error.message);
        throw error;
      }
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

  async start(transport?: 'stdio' | 'websocket'): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    this.transportType = transport || 'stdio';

    try {
      if (this.transportType === 'websocket') {
        this.logger.info(`Starting MCP Server on WebSocket (port ${this.config.port})...`);
        this.wsTransport = new WebSocketTransport(
          { port: this.config.port! },
          this.logger
        );
        await this.wsTransport.start();
      } else {
        this.logger.info(`Starting MCP Server on stdio transport...`);
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
      }
      
      this.isRunning = true;
      this.logger.info(`MCP Server started successfully (${this.transportType})`);
      this.logger.info(`Tools registered: ${this.tools.size}`);
      this.logger.info(`Resources registered: ${this.resources.size}`);
    } catch (error: any) {
      this.logger.error('Failed to start server:', error.message);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      this.logger.info('Stopping MCP Server...');
      
      if (this.wsTransport) {
        await this.wsTransport.stop();
        this.wsTransport = null;
      }
      
      await this.server.close();
      this.isRunning = false;
      this.logger.info('MCP Server stopped');
    } catch (error: any) {
      this.logger.error('Failed to stop server:', error.message);
      throw error;
    }
  }

  getStatus(): { running: boolean; tools: number; resources: number; transport: string; clients?: number } {
    const status: any = {
      running: this.isRunning,
      tools: this.tools.size,
      resources: this.resources.size,
      transport: this.transportType,
    };

    if (this.wsTransport) {
      status.clients = this.wsTransport.getStatus().clients;
    }

    return status;
  }
}

export function createMCPServer(config?: MCPServerConfig): MCPServer {
  return new MCPServer(config);
}
