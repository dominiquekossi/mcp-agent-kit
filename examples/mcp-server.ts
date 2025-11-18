/**
 * Example: Creating an MCP Server with tools and resources
 */

import { createMCPServer } from '../src';

// Create MCP server with tools and resources
const server = createMCPServer({
  name: 'example-mcp-server',
  logLevel: 'debug',
  
  // Register tools
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or coordinates',
          },
          units: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature units',
          },
        },
        required: ['location'],
      },
      handler: async ({ location, units = 'celsius' }) => {
        // Simulate API call
        const temp = units === 'celsius' ? 22 : 72;
        return {
          location,
          temperature: temp,
          units,
          condition: 'Sunny',
          humidity: 65,
        };
      },
    },
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide'],
          },
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['operation', 'a', 'b'],
      },
      handler: async ({ operation, a, b }) => {
        switch (operation) {
          case 'add':
            return { result: a + b };
          case 'subtract':
            return { result: a - b };
          case 'multiply':
            return { result: a * b };
          case 'divide':
            return { result: a / b };
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      },
    },
  ],
  
  // Register resources
  resources: [
    {
      uri: 'config://app-settings',
      name: 'Application Settings',
      description: 'Current application configuration',
      mimeType: 'application/json',
      handler: async () => {
        return JSON.stringify({
          version: '1.0.0',
          environment: 'production',
          features: {
            darkMode: true,
            notifications: true,
          },
        }, null, 2);
      },
    },
    {
      uri: 'data://user-stats',
      name: 'User Statistics',
      description: 'Current user statistics',
      mimeType: 'application/json',
      handler: async () => {
        return JSON.stringify({
          totalUsers: 1250,
          activeUsers: 890,
          newToday: 45,
        }, null, 2);
      },
    },
  ],
});

// Start the server
async function main() {
  try {
    console.log('🚀 Starting MCP Server...\n');
    
    await server.start();
    
    console.log('\n✅ Server is running!');
    console.log('📊 Status:', server.getStatus());
    console.log('\n💡 The server is now ready to accept MCP connections via stdio');
    console.log('💡 Connect using an MCP client to interact with tools and resources\n');
    
    // Keep the process running
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
