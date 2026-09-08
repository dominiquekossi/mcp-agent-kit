/**
 * `mcp-agent-kit inspect` — connect to an MCP server, list what it publishes,
 * validate its tool schemas and measure how long it takes to answer.
 *
 * Useful on its own, without adopting the library: it is the fastest way to
 * see what a server actually exposes and why a client might reject it.
 */

import { connectMCP } from '../mcp/client/connectMCP';
import { MCPServerSpec } from '../mcp/client/types';
import { describeParameters, validateTools, ValidationIssue } from './validate';

export interface InspectOptions {
  json: boolean;
  timeout: number;
  headers: Record<string, string>;
  env: Record<string, string>;
  call?: string;
  args?: any;
  quiet: boolean;
}

const SERVER = 'target';

// --- output helpers -------------------------------------------------------

const useColor =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb';

const paint = (code: string, text: string) =>
  useColor ? `\x1b[${code}m${text}\x1b[0m` : text;

const bold = (t: string) => paint('1', t);
const dim = (t: string) => paint('90', t);
const green = (t: string) => paint('32', t);
const yellow = (t: string) => paint('33', t);
const red = (t: string) => paint('31', t);
const cyan = (t: string) => paint('36', t);

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// --- argument parsing -----------------------------------------------------

export function parseInspectArgs(argv: string[]): {
  spec: MCPServerSpec;
  label: string;
  options: InspectOptions;
} {
  const options: InspectOptions = {
    json: false,
    timeout: 30000,
    headers: {},
    env: {},
    quiet: false,
  };

  const positional: string[] = [];
  let index = 0;

  // Flags come before the target. Once the target starts, everything after it
  // belongs to the server's own command line (`inspect npx -y some-server`).
  while (index < argv.length) {
    const arg = argv[index];

    if (!arg.startsWith('-')) {
      break;
    }

    switch (arg) {
      case '--json':
        options.json = true;
        index++;
        break;
      case '--quiet':
      case '-q':
        options.quiet = true;
        index++;
        break;
      case '--timeout':
        options.timeout = Number(argv[++index]) || 30000;
        index++;
        break;
      case '--header':
      case '-H': {
        const raw = argv[++index] || '';
        const separator = raw.indexOf(':');
        if (separator > 0) {
          options.headers[raw.slice(0, separator).trim()] = raw
            .slice(separator + 1)
            .trim();
        }
        index++;
        break;
      }
      case '--env':
      case '-e': {
        const raw = argv[++index] || '';
        const separator = raw.indexOf('=');
        if (separator > 0) {
          options.env[raw.slice(0, separator)] = raw.slice(separator + 1);
        }
        index++;
        break;
      }
      case '--call':
        options.call = argv[++index];
        index++;
        break;
      case '--args': {
        const raw = argv[++index] || '{}';
        try {
          options.args = JSON.parse(raw);
        } catch {
          throw new Error(`--args is not valid JSON: ${raw}`);
        }
        index++;
        break;
      }
      case '--':
        index++;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  positional.push(...argv.slice(index));

  if (positional.length === 0) {
    throw new Error('No target given');
  }

  const [first, ...rest] = positional;

  if (/^https?:\/\//i.test(first)) {
    return {
      spec: {
        url: first,
        ...(Object.keys(options.headers).length
          ? { headers: options.headers }
          : {}),
      },
      label: first,
      options,
    };
  }

  return {
    spec: {
      command: first,
      args: rest,
      ...(Object.keys(options.env).length ? { env: options.env } : {}),
      // Capture the server's own logs instead of mixing them into the report;
      // they are shown only when the connection fails.
      stderr: 'pipe',
    },
    label: [first, ...rest].join(' '),
    options,
  };
}

// --- the command ----------------------------------------------------------

export async function runInspect(argv: string[]): Promise<number> {
  let parsed;

  try {
    parsed = parseInspectArgs(argv);
  } catch (error: any) {
    console.error(`${red('error')} ${error.message}`);
    console.error(`\nRun ${cyan('mcp-agent-kit inspect --help')} for usage.`);
    return 2;
  }

  const { spec, label, options } = parsed;
  const transport = 'url' in spec ? 'http' : 'stdio';

  if (!options.json && !options.quiet) {
    console.log('');
    console.log(`${bold('Target')}     ${label}`);
    console.log(`${bold('Transport')}  ${transport}`);
    console.log('');
  }

  const mcp = await connectMCP({
    servers: { [SERVER]: spec },
    connectTimeout: options.timeout,
    toolTimeout: options.timeout,
    logLevel: 'error',
  }).catch((error: Error) => error);

  if (mcp instanceof Error) {
    return fail(options, `could not connect: ${mcp.message}`);
  }

  const status = mcp.listServers()[0];

  if (status.state !== 'connected') {
    const logs = mcp.getServerLogs(SERVER);
    await mcp.close();
    return fail(
      options,
      `could not connect: ${status.error || status.state}`,
      logs
    );
  }

  const connectMs = mcp.getConnectTime(SERVER);
  const tools = mcp.getRawTools(SERVER);

  const listedAt = Date.now();
  const resources = await mcp.listResources(SERVER);
  const listMs = Date.now() - listedAt;

  const issues = validateTools(tools);

  // Optional live call, so `inspect` can also answer "does this tool work?"
  let callResult: { tool: string; durationMs: number; ok: boolean; value?: any; error?: string } | undefined;

  if (options.call) {
    const startedAt = Date.now();
    try {
      const value = await mcp.callTool(`${SERVER}__${options.call}`, options.args ?? {});
      callResult = {
        tool: options.call,
        durationMs: Date.now() - startedAt,
        ok: true,
        value,
      };
    } catch (error: any) {
      callResult = {
        tool: options.call,
        durationMs: Date.now() - startedAt,
        ok: false,
        error: error.message,
      };
    }
  }

  await mcp.close();

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          target: label,
          transport,
          connected: true,
          timings: { connectMs, listMs },
          tools: tools.map((tool: any) => ({
            name: tool.name,
            description: tool.description,
            parameters: describeParameters(tool.inputSchema),
            inputSchema: tool.inputSchema,
          })),
          resources: resources.map((resource: any) => ({
            uri: resource.uri,
            name: resource.name,
            mimeType: resource.mimeType,
          })),
          issues,
          ...(callResult ? { call: callResult } : {}),
          summary: {
            tools: tools.length,
            resources: resources.length,
            errors: errors.length,
            warnings: warnings.length,
          },
        },
        null,
        2
      )
    );

    return errors.length ? 1 : 0;
  }

  printReport({
    connectMs,
    listMs,
    tools,
    resources,
    issues,
    callResult,
    quiet: options.quiet,
  });

  return errors.length ? 1 : 0;
}

function fail(
  options: InspectOptions,
  message: string,
  serverLogs?: string
): number {
  if (options.json) {
    console.log(
      JSON.stringify(
        { connected: false, error: message, ...(serverLogs ? { serverLogs } : {}) },
        null,
        2
      )
    );
    return 2;
  }

  console.error(`${red('✗')} ${message}`);

  // The server's own output is usually the only thing that explains why.
  if (serverLogs) {
    console.error('');
    console.error(bold('SERVER OUTPUT'));
    for (const line of serverLogs.split('\n').slice(-15)) {
      console.error(`  ${dim(line)}`);
    }
  }

  console.error('');
  return 2;
}

function printReport(report: {
  connectMs: number;
  listMs: number;
  tools: any[];
  resources: any[];
  issues: ValidationIssue[];
  callResult?: { tool: string; durationMs: number; ok: boolean; value?: any; error?: string };
  quiet: boolean;
}): void {
  const { connectMs, listMs, tools, resources, issues, callResult } = report;

  console.log(`${green('✓')} connected in ${bold(`${connectMs}ms`)}`);
  console.log(
    `${green('✓')} ${bold(String(tools.length))} tool(s), ` +
      `${bold(String(resources.length))} resource(s) listed in ${bold(`${listMs}ms`)}`
  );

  const errorsByTool = new Map<string, number>();
  const warningsByTool = new Map<string, number>();

  for (const issue of issues) {
    const target = issue.level === 'error' ? errorsByTool : warningsByTool;
    target.set(issue.tool, (target.get(issue.tool) || 0) + 1);
  }

  if (tools.length && !report.quiet) {
    console.log('');
    console.log(bold('TOOLS'));

    const width = Math.min(
      Math.max(...tools.map((t: any) => (t.name || '').length), 4),
      32
    );

    for (const tool of tools) {
      const name = (tool.name || '<unnamed>').padEnd(width);
      const params = dim(truncate(describeParameters(tool.inputSchema), 46));

      let mark = green('✓');
      if (errorsByTool.has(tool.name)) {
        mark = red('✗');
      } else if (warningsByTool.has(tool.name)) {
        mark = yellow('⚠');
      }

      console.log(`  ${mark} ${name}  ${params}`);
    }
  }

  if (resources.length && !report.quiet) {
    console.log('');
    console.log(bold('RESOURCES'));
    for (const resource of resources) {
      console.log(
        `  ${resource.uri}  ${dim(resource.mimeType || 'text/plain')}`
      );
    }
  }

  if (issues.length) {
    console.log('');
    console.log(bold('ISSUES'));
    for (const issue of issues) {
      const mark = issue.level === 'error' ? red('✗') : yellow('⚠');
      console.log(`  ${mark} ${cyan(issue.tool)}: ${issue.message}`);
    }
  }

  if (callResult) {
    console.log('');
    console.log(bold('CALL'));
    if (callResult.ok) {
      const preview = truncate(
        typeof callResult.value === 'string'
          ? callResult.value
          : JSON.stringify(callResult.value),
        200
      );
      console.log(
        `  ${green('✓')} ${callResult.tool} returned in ${callResult.durationMs}ms`
      );
      console.log(`  ${dim(preview)}`);
    } else {
      console.log(
        `  ${red('✗')} ${callResult.tool} failed in ${callResult.durationMs}ms`
      );
      console.log(`  ${dim(callResult.error || '')}`);
    }
  }

  const errors = issues.filter((i) => i.level === 'error').length;
  const warnings = issues.length - errors;

  const parts = [
    `${tools.length} tool(s)`,
    `${resources.length} resource(s)`,
    errors ? red(`${errors} error(s)`) : green('0 errors'),
    warnings ? yellow(`${warnings} warning(s)`) : '0 warnings',
  ];

  console.log('');
  console.log(`${bold('Summary')}  ${parts.join(dim(' · '))}`);
  console.log('');
}

export const INSPECT_HELP = `
${bold('mcp-agent-kit inspect')} — inspect and validate an MCP server

${bold('USAGE')}
  mcp-agent-kit inspect [options] <command> [args...]
  mcp-agent-kit inspect [options] <url>

${bold('EXAMPLES')}
  mcp-agent-kit inspect npx -y @modelcontextprotocol/server-filesystem ./
  mcp-agent-kit inspect https://mcp.example.com/mcp -H "Authorization: Bearer $TOKEN"
  mcp-agent-kit inspect --call read_file --args '{"path":"README.md"}' npx -y @modelcontextprotocol/server-filesystem ./
  mcp-agent-kit inspect --json npx -y my-server | jq .issues

${bold('OPTIONS')}
  --json              Machine-readable output
  --quiet, -q         Summary and issues only
  --timeout <ms>      Connect and call timeout (default: 30000)
  --header, -H <h>    HTTP header, repeatable ("Name: value")
  --env, -e <k=v>     Environment variable for a stdio server, repeatable
  --call <tool>       Call a tool after inspecting
  --args <json>       Arguments for --call (default: {})
  --help, -h          Show this help

${bold('NOTES')}
  Options go before the target; everything after it is the server's own
  command line.

${bold('EXIT CODES')}
  0  connected, no schema errors
  1  connected, but tool schemas have errors
  2  could not connect
`;
