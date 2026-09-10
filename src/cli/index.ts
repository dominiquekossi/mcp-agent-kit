#!/usr/bin/env node
/**
 * mcp-agent-kit CLI.
 */

import { runInspect, INSPECT_HELP } from './inspect';

const HELP = `
mcp-agent-kit — orchestrate MCP servers and build AI agents

USAGE
  mcp-agent-kit <command> [options]

COMMANDS
  inspect    Connect to an MCP server, list its tools and validate them

Run "mcp-agent-kit inspect --help" for command options.
`;

function version(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../../package.json').version;
  } catch {
    return 'unknown';
  }
}

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(HELP);
    return 0;
  }

  if (command === '--version' || command === '-v') {
    console.log(version());
    return 0;
  }

  if (command === 'inspect') {
    if (rest.includes('--help') || rest.includes('-h')) {
      console.log(INSPECT_HELP);
      return 0;
    }
    return runInspect(rest);
  }

  console.error(`Unknown command: ${command}`);
  console.log(HELP);
  return 2;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 2;
  });
