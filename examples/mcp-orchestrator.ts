/**
 * Example: orchestrate several MCP servers behind one agent.
 *
 * This is the short version — connect, hand the tools to an agent, ask a
 * question that needs more than one server:
 *
 *   const mcp = await connectMCP({
 *     servers: {
 *       files:  { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', './'] },
 *       github: { url: 'https://mcp.example.com/mcp', headers: { Authorization: `Bearer ${token}` } },
 *     },
 *   });
 *
 *   const agent = createAgent({ provider: 'openai' });
 *   agent.use(mcp);
 *
 *   const answer = await agent.chat('Summarise the open issues into notes.md');
 *   await mcp.close();
 *
 * Run: npx ts-node examples/mcp-orchestrator.ts
 */

import { connectMCP, createAgent } from '../src';

async function main() {
  // Connect to every server in parallel. A server that is down degrades the
  // tool set instead of failing the whole connection.
  const mcp = await connectMCP({
    servers: {
      // stdio: started as a child process
      files: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
      },

      // Streamable HTTP: a remote server
      // github: {
      //   url: 'https://mcp.example.com/mcp',
      //   headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      // },

      // Kept in config but not connected
      playwright: {
        command: 'npx',
        args: ['-y', '@playwright/mcp@latest'],
        enabled: false,
      },
    },

    // Six servers easily add up to 60 tools, which bloats the prompt and makes
    // the model choose worse. Expose only what this task needs.
    allowTools: ['files__read_*', 'files__list_*'],

    logLevel: 'info',
  });

  console.log('\n📡 Servers');
  for (const server of mcp.listServers()) {
    const detail =
      server.state === 'connected'
        ? `${server.tools}/${server.toolsAvailable} tools exposed`
        : server.error || server.state;
    console.log(`  ${server.name.padEnd(12)} ${server.state.padEnd(10)} ${detail}`);
  }

  console.log('\n🔧 Tools available to the agent');
  for (const tool of mcp.getTools()) {
    console.log(`  ${tool.name}`);
  }

  // Call a tool directly, without a model in the loop.
  const listTool = mcp.getTools().find((t) => t.name.includes('list'));
  if (listTool) {
    const result = await mcp.callTool(listTool.name, { path: process.cwd() });
    console.log(`\n📂 ${listTool.name} returned:`);
    console.log(String(JSON.stringify(result)).slice(0, 300));
  }

  // Hand every MCP tool to an agent. The agent runs them and feeds the results
  // back to the model until it answers.
  if (process.env.OPENAI_API_KEY) {
    const agent = createAgent({ provider: 'openai' });
    agent.use(mcp);

    console.log(`\n🤖 Agent has ${agent.listTools().length} tool(s)`);

    const response = await agent.chat(
      'List the files in the current directory and tell me what kind of project this is.'
    );

    console.log('\n💬 Answer:', response.content);
    console.log(`   (${response.iterations} round-trip(s), ` +
      `${response.toolResults?.length || 0} tool call(s), ` +
      `${response.usage?.totalTokens || 0} tokens)`);

    agent.cleanup();
  } else {
    console.log('\n💡 Set OPENAI_API_KEY to see the agent use these tools.');
  }

  console.log('\n📊 Stats:', mcp.getStats());

  await mcp.close();
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
