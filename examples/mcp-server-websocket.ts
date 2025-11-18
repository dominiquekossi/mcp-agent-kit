/**
 * Example: MCP Server with WebSocket transport
 */

import { createMCPServer } from '../src';

const server = createMCPServer({
  name: 'websocket-mcp-server',
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
});

async function main() {
  try {
    console.log('🚀 Starting MCP Server with WebSocket transport...\n');
    
    // Start with WebSocket transport
    await server.start('websocket');
    
    const status = server.getStatus();
    console.log('\n✅ Server is running!');
    console.log('📊 Status:', status);
    console.log('\n💡 WebSocket server listening on ws://localhost:8080');
    console.log('💡 Connect using an MCP client via WebSocket\n');
    
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
