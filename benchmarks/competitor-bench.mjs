import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createToolDescriptors, createToolsManifest } from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 50);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const manifest = createToolsManifest({
  id: 'competitor.tools',
  actions: [{
    id: 'todos.complete',
    title: 'Complete todo',
    description: 'Mark a todo complete.',
    input: { todoId: 'string' },
    reads: ['entities.todos'],
    writes: ['entities.todos'],
    requires: ['todo.write'],
    dryRun: true,
    expectedPatch: [{ op: 'set', path: '/entities/todos/:id/done', value: true }]
  }]
});
const frontierContext = { capabilities: ['todo.write'] };

const zod = await import('zod');
const { tool: vercelTool } = await import('ai');
let langchainTool = null;
try {
  const langchain = await import('@langchain/core/tools');
  langchainTool = langchain.tool;
} catch {
  langchainTool = null;
}

const rows = [
  measure('frontier-tools:openai-descriptor', 256, () => createToolDescriptors(manifest, frontierContext, { format: 'openai', strict: true }).length),
  measure('frontier-tools:mcp-descriptor', 256, () => createToolDescriptors(manifest, frontierContext, { format: 'mcp' }).length),
  measure('plain-openai:function-descriptor', 256, () => createPlainOpenAiTool().function.name.length),
  measure('plain-mcp:tool-descriptor', 256, () => createPlainMcpTool().name.length),
  measure('vercel-ai:tool-wrapper', 64, () => {
    const wrapped = vercelTool({
      description: 'Mark a todo complete.',
      inputSchema: zod.z.object({ todoId: zod.z.string() }),
      execute: async () => ({ ok: true })
    });
    return wrapped.description.length;
  })
];

if (langchainTool !== null) {
  rows.push(measure('langchain:tool-wrapper', 64, () => {
    const wrapped = langchainTool(async () => 'ok', {
      name: 'todos_complete',
      description: 'Mark a todo complete.',
      schema: zod.z.object({ todoId: zod.z.string() })
    });
    return wrapped.name.length;
  }));
}

const report = {
  package: '@shapeshift-labs/frontier-tools',
  type: 'competitor',
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rounds,
  competitors: {
    '@modelcontextprotocol/sdk': readVersion('@modelcontextprotocol/sdk'),
    '@langchain/core': safeReadVersion('@langchain/core'),
    ai: readVersion('ai'),
    zod: readVersion('zod')
  },
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log('frontier-tools competitor benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', rounds=' + rounds);
console.log('Fixture'.padEnd(38) + 'Median'.padStart(12) + 'p95'.padStart(12));
for (const row of rows) {
  console.log(row.fixture.padEnd(38) + formatUs(row.medianUs).padStart(12) + formatUs(row.p95Us).padStart(12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function createPlainOpenAiTool() {
  return {
    type: 'function',
    function: {
      name: 'todos_complete',
      description: 'Mark a todo complete.',
      parameters: {
        type: 'object',
        properties: { todoId: { type: 'string' } },
        required: ['todoId'],
        additionalProperties: false
      },
      strict: true
    }
  };
}

function createPlainMcpTool() {
  return {
    name: 'todos_complete',
    title: 'Complete todo',
    description: 'Mark a todo complete.',
    inputSchema: {
      type: 'object',
      properties: { todoId: { type: 'string' } },
      required: ['todoId'],
      additionalProperties: false
    },
    annotations: { destructiveHint: true, readOnlyHint: false }
  };
}

function measure(fixture, batchSize, fn) {
  const values = [];
  let sink = 0;
  for (let round = 0; round < rounds; round++) {
    const started = performance.now();
    for (let i = 0; i < batchSize; i++) sink += fn();
    values[values.length] = ((performance.now() - started) * 1000) / batchSize;
  }
  if (sink === -1) console.log('sink=' + sink);
  values.sort((left, right) => left - right);
  return { fixture, medianUs: percentile(values, 0.5), p95Us: percentile(values, 0.95) };
}

function percentile(values, p) {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] ?? 0;
}

function readVersion(name) {
  for (const root of [packageDir, repoRoot]) {
    const candidate = path.join(root, 'node_modules', ...name.split('/'), 'package.json');
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, 'utf8')).version;
  }
  let current = path.dirname(require.resolve(name));
  while (current !== path.dirname(current)) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, 'utf8')).version;
    current = path.dirname(current);
  }
  return 'unknown';
}

function safeReadVersion(name) {
  try {
    return readVersion(name);
  } catch {
    return 'not-installed';
  }
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench:competitors -- [--rounds 50] [--out benchmarks/results/frontier-tools-competitors-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
