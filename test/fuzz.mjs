import assert from 'node:assert';
import {
  compileTools,
  createToolsManifest,
  createToolsProof,
  decodeToolsJsonl,
  encodeToolsJsonl,
  executeToolAction,
  listAvailableTools,
  planToolAction,
  queryToolsManifest,
  validateToolInput
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 500);
let seed = readPositiveInt(args.seed, 0x7f4a7c15);
let checked = 0;

for (let i = 0; i < cases; i++) {
  const scenario = makeScenario(i);
  const manifest = createToolsManifest({ id: 'tools-fuzz-' + i, actions: scenario.actions });
  const compiler = compileTools(manifest);
  const directAvailable = listAvailableTools(manifest, scenario.context).map((action) => action.id);
  const compiledAvailable = listAvailableTools(compiler, scenario.context).map((action) => action.id);
  assert.deepStrictEqual(compiledAvailable, directAvailable);

  const query = queryToolsManifest(manifest, { capabilities: [scenario.capability] });
  assert.ok(query.actions.every((action) => action.requires.includes(scenario.capability) || action.requires.length === 0));

  for (const action of manifest.actions) {
    const validInput = makeInput(action.id, true);
    const invalidInput = makeInput(action.id, false);
    const validation = validateToolInput(action, validInput);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validateToolInput(action, invalidInput).valid, false);
    const plan = planToolAction(compiler, { actionId: action.id, input: validInput, dryRun: true }, scenario.context, { now: i + 1 });
    const reference = referenceAvailable(action, scenario.context);
    assert.strictEqual(plan.available, reference);
    assert.ok(plan.expectedPatch.every((patch) => !patch.path.includes(':id')));

    const record = executeToolAction(compiler, { actionId: action.id, input: validInput, dryRun: true }, { context: scenario.context });
    if (action.dryRun && reference) assert.strictEqual(record.status, 'dry-run');
    const jsonl = encodeToolsJsonl([plan, record]);
    assert.strictEqual(decodeToolsJsonl(jsonl).length, 2);
  }

  assert.notStrictEqual(createToolsProof(manifest).hash.length, 0);
  checked++;
}

console.log('frontier-tools fuzz ok: ' + checked + ' cases');

function makeScenario(index) {
  const actionCount = 4 + nextInt(6);
  const actions = [];
  const capability = pick(['todo.read', 'todo.write', 'profile.write', 'admin.export']);
  for (let i = 0; i < actionCount; i++) {
    const id = 'feature' + (index % 5) + '.action' + i;
    const requires = maybe() ? [capability] : [pick(['todo.read', 'todo.write', 'profile.write', 'admin.export'])];
    actions.push({
      id,
      input: {
        itemId: { type: 'string', minLength: 1 },
        count: { type: 'integer', required: false, minimum: 0, maximum: 100 }
      },
      reads: ['entities.items'],
      writes: maybe() ? ['entities.items'] : [],
      effects: maybe() ? ['fetch:/api/items'] : [],
      requires,
      routes: maybe() ? ['/items/*'] : [],
      dryRun: maybe(),
      expectedPatch: [{ op: 'set', path: '/entities/items/:id/updated', value: '$input.itemId' }],
      rollback: maybe() ? { action: id + '.undo', input: { itemId: '$input.itemId' } } : undefined,
      tags: [i % 2 === 0 ? 'even' : 'odd']
    });
  }
  return {
    actions: shuffle(actions),
    capability,
    context: {
      capabilities: maybe() ? [capability, 'todo.read', 'todo.write'] : [capability],
      route: maybe() ? '/items/list' : '/settings',
      policyDecision: maybe() ? { allowed: true, allowedTools: ['feature*'] } : { allowed: true }
    }
  };
}

function makeInput(id, valid) {
  return valid ? { itemId: id + '-item', count: nextInt(10) } : { count: nextInt(10), extra: true };
}

function referenceAvailable(action, context) {
  for (const capability of action.requires) if (!context.capabilities.includes(capability)) return false;
  if (action.routes.length !== 0 && !action.routes.some((route) => wildcard(route, context.route))) return false;
  if (context.policyDecision.allowed === false) return false;
  if (context.policyDecision.allowedTools?.length && !context.policyDecision.allowedTools.some((pattern) => wildcard(pattern, action.id))) return false;
  return true;
}

function wildcard(pattern, value) {
  if (pattern === value || pattern === '*') return true;
  if (!pattern.includes('*')) return false;
  const [head, tail] = pattern.split('*');
  return value.startsWith(head) && value.endsWith(tail ?? '');
}

function shuffle(values) {
  const out = values.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(i + 1);
    const item = out[i];
    out[i] = out[j];
    out[j] = item;
  }
  return out;
}

function pick(values) {
  return values[nextInt(values.length)];
}

function maybe() {
  return (next() & 1) === 1;
}

function nextInt(max) {
  return next() % max;
}

function next() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cases') out.cases = argv[++i];
    else if (argv[i] === '--seed') out.seed = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
