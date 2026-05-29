import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  compileTools,
  createToolDescriptors,
  createToolsManifest,
  createToolsProof,
  createToolsRegistryGraph,
  decodeToolsJsonl,
  encodeToolsJsonl,
  executeToolAction,
  listAvailableTools,
  planToolAction,
  queryToolsManifest,
  traceToolsImpact,
  validateToolInput
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const actionCount = readPositiveInt(args.actions, 1000);
const rounds = readPositiveInt(args.rounds, 30);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const input = makeToolsInput(actionCount);
let manifest = createToolsManifest(input);
let compiler = compileTools(manifest);
const context = { capabilities: ['bench.read', 'bench.write'], route: '/bench/items', policyDecision: { allowed: true, allowedTools: ['bench.*'] } };
let plan = planToolAction(compiler, { actionId: 'bench.action0', input: { itemId: 'item-0' }, dryRun: true }, context);
let jsonl = encodeToolsJsonl([plan]);
let cursor = 0;

const rows = [
  measure('create-manifest-' + actionCount, 1, () => {
    manifest = createToolsManifest(input);
    return manifest.actions.length;
  }),
  measure('compile-tools-' + actionCount, 1, () => {
    compiler = compileTools(manifest);
    return compiler.manifest.actions.length;
  }),
  measure('list-available-' + actionCount, 16, () => listAvailableTools(compiler, context).length),
  measure('query-writes-' + actionCount, 32, () => queryToolsManifest(manifest, { writes: ['entities.items'] }).actions.length),
  measure('validate-input-' + actionCount, 128, () => validateToolInput(compiler.get('bench.action' + (cursor++ % actionCount)), { itemId: 'item-' + cursor }).valid ? 1 : 0),
  measure('plan-action-' + actionCount, 64, () => {
    const id = 'bench.action' + (cursor++ % actionCount);
    plan = planToolAction(compiler, { actionId: id, input: { itemId: 'item-' + cursor }, dryRun: true }, context);
    return plan.expectedPatch.length;
  }),
  measure('descriptor-openai-' + actionCount, 16, () => createToolDescriptors(compiler, context, { format: 'openai', strict: true }).length),
  measure('execute-dry-run-' + actionCount, 64, () => {
    const record = executeToolAction(compiler, { actionId: 'bench.action' + (cursor++ % actionCount), input: { itemId: 'item-' + cursor }, dryRun: true }, { context });
    return record.patches.length;
  }),
  measure('trace-impact-' + actionCount, 8, () => traceToolsImpact(manifest, { nodes: ['entities.items'] }).actionIds.length),
  measure('registry-graph-' + actionCount, 1, () => {
    const graph = createToolsRegistryGraph(manifest, { package: '@shapeshift-labs/frontier-tools' });
    return graph.entries.length + graph.edges.length;
  }),
  measure('jsonl-encode-' + actionCount, 8, () => {
    jsonl = encodeToolsJsonl([plan]);
    return jsonl.length;
  }),
  measure('jsonl-decode-' + actionCount, 8, () => decodeToolsJsonl(jsonl).length),
  measure('proof-' + actionCount, 4, () => createToolsProof(manifest).hash.length)
];

const report = {
  package: '@shapeshift-labs/frontier-tools',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  actionCount,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', actions=' + actionCount + ', rounds=' + rounds);
console.log('These are Frontier-only package measurements, not competitor comparisons.');
console.log('');
console.log(padRight('Fixture', 34) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 34) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function makeToolsInput(count) {
  const actions = [];
  for (let i = 0; i < count; i++) {
    actions.push({
      id: 'bench.action' + i,
      title: 'Bench Action ' + i,
      input: {
        itemId: { type: 'string', minLength: 1 },
        reason: { type: 'string', required: false }
      },
      reads: ['entities.items', 'entities.items.' + i],
      writes: ['entities.items'],
      effects: i % 13 === 0 ? ['fetch:/api/items/' + i] : [],
      requires: [i % 2 === 0 ? 'bench.read' : 'bench.write'],
      routes: ['/bench/*'],
      dryRun: true,
      expectedPatch: [{ op: 'set', path: '/entities/items/:id/updated', value: true }],
      rollback: i % 5 === 0 ? { action: 'bench.rollback' + i } : undefined,
      tags: ['bench', i % 2 === 0 ? 'even' : 'odd']
    });
  }
  return {
    id: 'bench.tools',
    actions,
    metadata: { token: 'bench-secret' }
  };
}

function measure(fixture, batchSize, fn, innerOps = 1) {
  const values = [];
  let sink = 0;
  for (let round = 0; round < rounds; round++) {
    const started = performance.now();
    for (let i = 0; i < batchSize; i++) sink += fn();
    values[values.length] = ((performance.now() - started) * 1000) / (batchSize * innerOps);
  }
  if (sink === -1) console.log('sink=' + sink);
  values.sort((left, right) => left - right);
  return {
    fixture,
    medianUs: percentile(values, 0.5),
    p95Us: percentile(values, 0.95)
  };
}

function percentile(values, p) {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] ?? 0;
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--actions') out.actions = argv[++i];
    else if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--actions 1000] [--rounds 30] [--out benchmarks/results/frontier-tools-package-bench-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
