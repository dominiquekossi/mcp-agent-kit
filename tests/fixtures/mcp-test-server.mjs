/**
 * A real MCP server over stdio, used to test the orchestrator against the
 * actual protocol rather than a mock of it.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'test-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: 'echo',
    description: 'Echo back a message',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  },
  {
    name: 'add',
    description: 'Add two numbers',
    inputSchema: {
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'number' } },
      required: ['a', 'b'],
    },
  },
  {
    name: 'explode',
    description: 'Always fails, for error-path tests',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'secret',
    description: 'Should be filtered out in some tests',
    inputSchema: { type: 'object', properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'echo') {
    return { content: [{ type: 'text', text: String(args?.message ?? '') }] };
  }

  if (name === 'add') {
    return {
      content: [
        { type: 'text', text: JSON.stringify({ sum: (args?.a ?? 0) + (args?.b ?? 0) }) },
      ],
    };
  }

  if (name === 'secret') {
    return { content: [{ type: 'text', text: 'classified' }] };
  }

  if (name === 'explode') {
    throw new Error('tool blew up on purpose');
  }

  throw new Error(`Unknown tool: ${name}`);
});

await server.connect(new StdioServerTransport());
