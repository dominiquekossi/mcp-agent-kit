/**
 * Example: MCP Server over Streamable HTTP
 */

import { createMCPServer, MCPServerConfig } from '../src';

const config: MCPServerConfig = {
  name: 'http-mcp-server',
  port: 8080,
  logLevel: 'debug',
  
  tools: [
    {
      name: 'echo',
      description: 'Echo back the input message',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
      handler: async ({ message }) => {
        return `Echo: ${message}`;
      },
    },
    {
      name: 'get_time',
      description: 'Get current server time',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        return {
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      },
    },
  ],
  
  resources: [
    {
      uri: 'system://info',
      name: 'System Information',
      description: 'Server system information',
      mimeType: 'application/json',
      handler: async () => {
        return JSON.stringify({
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        }, null, 2);
      },
    },
  ],
};

async function main() {
  try {
    console.log('🚀 Starting MCP Server over Streamable HTTP...\n');

    // createMCPServer is async: it loads the MCP SDK before building the server
    const server = await createMCPServer(config);

    // Start on Streamable HTTP — the transport current MCP clients speak
    await server.start('http');
    
    const status = server.getStatus();
    console.log('\n✅ Server is running!');
    console.log('📊 Status:', status);
    console.log('\n💡 MCP endpoint: http://localhost:8080/mcp');
    console.log('💡 Point any MCP client at that URL, or use connectMCP()\n');
    
    // Keep running
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
