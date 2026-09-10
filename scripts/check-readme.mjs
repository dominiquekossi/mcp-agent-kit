#!/usr/bin/env node
/**
 * Type-check every TypeScript block in README.md.
 *
 * v1.1.3 made createMCPServer async but the README kept calling it
 * synchronously, so the first example on the page threw a TypeError for every
 * new user. Nothing caught it because docs were never compiled. This does.
 *
 * Each block is wrapped in an async function (so top-level `await` is valid),
 * imports are rewritten to the local sources, and the whole set is compiled
 * with the project's own tsconfig settings.
 */

import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, '.readme-check');

/** Blocks that are deliberately illustrative rather than runnable. */
const SKIP_MARKERS = [
  'Coming soon',
  '// ...',
  'rules: [...]',
  'tools: [...]',
];

function extractBlocks(markdown) {
  const blocks = [];
  const fence = /```(?:typescript|ts)\n([\s\S]*?)```/g;
  let match;

  while ((match = fence.exec(markdown)) !== null) {
    const code = match[1];
    const line = markdown.slice(0, match.index).split('\n').length;

    // Type shapes (a bare `{ field: type }` illustrating a response object)
    // are documentation, not statements — they never compile on their own.
    const isTypeShape = code.trimStart().startsWith('{');

    if (isTypeShape || SKIP_MARKERS.some((marker) => code.includes(marker))) {
      blocks.push({ line, code, skipped: true });
      continue;
    }

    blocks.push({ line, code, skipped: false });
  }

  return blocks;
}

/**
 * Many blocks continue an earlier example ("const stats = bot.getStats()"),
 * so the identifiers a reader already has in scope are declared for them.
 * A block that defines its own `agent`/`bot`/... simply shadows these.
 */
const PACKAGE_EXPORTS = [
  'createAgent',
  'createMCPServer',
  'createLLMRouter',
  'createChatbot',
  'api',
  'connectMCP',
  'MCPOrchestrator',
  'Agent',
  'MCPServer',
  'LLMRouter',
  'Chatbot',
  'AgentTool',
  'MCPTool',
  'MCPResource',
  'MCPServerConfig',
  'AgentResponse',
];

/** Identifiers a continuation block expects to already be in scope. */
const AMBIENT = [
  ['agent', 'Agent'],
  ['server', 'MCPServer'],
  ['router', 'LLMRouter'],
  ['bot', 'Chatbot'],
  ['mcp', 'MCPOrchestrator'],
  ['url', 'string'],
  ['config', 'any'],
  ['body', 'any'],
];

function buildSource(block) {
  const lines = block.code.split('\n');

  // Imports have to sit at file top level, so lift them out of the wrapper.
  const imports = [];
  const body = [];

  for (const line of lines) {
    if (/^\s*import\s.+from\s+["']/.test(line)) {
      imports.push(line.replace(/from ["']mcp-agent-kit["']/, `from '../src'`));
    } else {
      body.push(line);
    }
  }

  // Whatever the block imports itself must not be imported again by the
  // preamble, or TypeScript reports a duplicate identifier.
  const alreadyImported = new Set();
  for (const line of imports) {
    const named = line.match(/import\s*{([^}]*)}/);
    if (named) {
      named[1]
        .split(',')
        .map((name) => name.trim().split(/\s+as\s+/).pop().trim())
        .filter(Boolean)
        .forEach((name) => alreadyImported.add(name));
    }
  }

  const missing = PACKAGE_EXPORTS.filter((name) => !alreadyImported.has(name));
  const ambient = AMBIENT.filter(
    ([name]) =>
      !alreadyImported.has(name) &&
      // A block that declares the value itself needs no ambient stand-in.
      !new RegExp(`\\b(?:const|let|var|function)\\s+${name}\\b`).test(block.code)
  );

  const preamble = [
    missing.length ? `import { ${missing.join(', ')} } from '../src';` : '',
    ...ambient.map(([name, type]) => `declare const ${name}: ${type};`),
  ]
    .filter(Boolean)
    .join('\n');

  const PREAMBLE = preamble;

  // Wrapping the body in a function gives each block its own scope (repeated
  // `const agent` across examples never collide) and allows top-level await.
  return [
    `// README.md line ${block.line}`,
    PREAMBLE,
    ...imports,
    ``,
    `export async function readmeBlock() {`,
    body.map((l) => (l.trim() ? `  ${l}` : l)).join('\n'),
    `}`,
    '',
  ].join('\n');
}

const markdown = readFileSync(join(root, 'README.md'), 'utf8');
const blocks = extractBlocks(markdown);
const checked = blocks.filter((b) => !b.skipped);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

checked.forEach((block, index) => {
  writeFileSync(join(outDir, `block-${index}.ts`), buildSource(block));
});

writeFileSync(
  join(outDir, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        moduleResolution: 'node',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
        // Examples legitimately declare values they only print.
        noUnusedLocals: false,
      },
      include: ['*.ts'],
    },
    null,
    2
  )
);

console.log(
  `Checking ${checked.length} TypeScript block(s) from README.md ` +
    `(${blocks.length - checked.length} illustrative block(s) skipped)`
);

try {
  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsc', '-p', join(outDir, 'tsconfig.json')],
    { cwd: root, stdio: 'pipe', encoding: 'utf8', shell: process.platform === 'win32' }
  );
} catch (error) {
  const output = `${error.stdout || ''}${error.stderr || ''}`;
  console.error('\nREADME examples do not compile:\n');

  // Map each error back to the README line it came from.
  for (const line of output.split('\n')) {
    const fileMatch = line.match(/block-(\d+)\.ts\((\d+),/);
    if (fileMatch) {
      const block = checked[Number(fileMatch[1])];
      console.error(`  README.md:~${block.line} → ${line.trim()}`);
    } else if (line.trim()) {
      console.error(`  ${line.trim()}`);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
console.log('All README examples compile.');
