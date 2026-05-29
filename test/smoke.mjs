import assert from 'node:assert';
import {
  appendToolSessionRecord,
  compileTools,
  createToolDescriptor,
  createToolDescriptors,
  createToolRecord,
  createToolsManifest,
  createToolsProof,
  createToolsRegistryGraph,
  createToolsSession,
  decodeToolsJsonl,
  defineToolAction,
  defineTools,
  encodeToolsJsonl,
  executeToolAction,
  executeToolActionAsync,
  listAvailableTools,
  planToolAction,
  planToolActionAsync,
  queryToolsManifest,
  redactToolsManifest,
  traceToolsImpact,
  validateToolInput
} from '../dist/index.js';

const manifest = createToolsManifest({
  id: 'todos.tools',
  package: '@app/todos',
  feature: 'todos',
  owner: 'product',
  actions: [
    {
      id: 'todos.complete',
      title: 'Complete todo',
      description: 'Mark a todo item as complete.',
      input: {
        todoId: { type: 'string', minLength: 1 },
        reason: { type: 'string', required: false }
      },
      reads: ['entities.todos'],
      writes: ['entities.todos'],
      requires: ['todo.write'],
      routes: ['/todos/*'],
      dryRun: true,
      expectedPatch: [{ op: 'set', path: '/entities/todos/:id/done', value: true }],
      rollback: { action: 'todos.reopen' },
      metadata: { token: 'secret' }
    },
    {
      id: 'todos.reopen',
      title: 'Reopen todo',
      input: { todoId: 'string' },
      reads: ['entities.todos'],
      writes: ['entities.todos'],
      requires: ['todo.write'],
      expectedPatch: [{ op: 'set', path: '/entities/todos/:id/done', value: false }]
    },
    {
      id: 'todos.export',
      title: 'Export todos',
      inputSchema: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['json', 'csv'] }
        },
        required: ['format'],
        additionalProperties: false
      },
      reads: ['entities.todos'],
      effects: ['download:todos'],
      requires: ['todo.read'],
      approval: { required: true, reason: 'export leaves the app boundary' }
    }
  ]
});

assert.strictEqual(defineTools({ id: 'empty' }).id, 'empty');
assert.strictEqual(defineToolAction({ id: 'x.y' }).title, 'Y');
assert.strictEqual(manifest.summary.actionCount, 3);
assert.strictEqual(manifest.summary.dryRunCount, 1);
assert.strictEqual(manifest.summary.rollbackCount, 1);

const compiler = compileTools(manifest);
assert.strictEqual(compiler.get('todos.complete').id, 'todos.complete');
assert.deepStrictEqual(queryToolsManifest(manifest, { writes: ['entities.todos'] }).ids, ['todos.complete', 'todos.reopen']);

const validation = validateToolInput(compiler.get('todos.complete'), { todoId: 't1' });
assert.strictEqual(validation.valid, true);
assert.strictEqual(validateToolInput(compiler.get('todos.complete'), { reason: 'missing id' }).valid, false);

const context = {
  capabilities: ['todo.write'],
  route: '/todos/inbox',
  policyDecision: {
    allowed: true,
    allowedTools: ['todos.*'],
    reasons: ['policy allowed todo tools']
  }
};

const available = listAvailableTools(compiler, context);
assert.deepStrictEqual(available.map((action) => action.id), ['todos.complete', 'todos.reopen']);

const plan = planToolAction(compiler, {
  actionId: 'todos.complete',
  input: { todoId: 't1' },
  dryRun: true,
  causeId: 'agent-turn-1'
}, context, { now: 1000 });
assert.strictEqual(plan.available, true);
assert.strictEqual(plan.dryRun, true);
assert.deepStrictEqual(plan.expectedPatch, [{ op: 'set', path: '/entities/todos/t1/done', value: true }]);
assert.strictEqual(plan.descriptor.raw.requiresApproval, false);

const blocked = planToolAction(compiler, { actionId: 'todos.complete', input: { todoId: 't1' } }, {
  capabilities: ['todo.write'],
  route: '/settings',
  policyDecision: { allowed: true }
});
assert.strictEqual(blocked.available, false);
assert.ok(blocked.blockedReasons.includes('route-unavailable'));

const asyncPlan = await planToolActionAsync(compiler, { actionId: 'todos.complete', input: { todoId: 't2' } }, {
  capabilities: ['todo.write'],
  route: '/todos/inbox'
}, {
  policyEvaluator: async (request) => {
    assert.strictEqual(request.tool, 'todos.complete');
    assert.deepStrictEqual(request.resources.includes('tool:todos.complete'), true);
    return { allowed: true, allowedTools: ['todos.complete'] };
  },
  now: 2000
});
assert.strictEqual(asyncPlan.available, true);

const descriptors = createToolDescriptors(compiler, context, { format: 'openai', strict: true, includeFrontierMetadata: true });
assert.strictEqual(descriptors.length, 2);
assert.strictEqual(descriptors[0].raw.type, 'function');
assert.strictEqual(descriptors[0].raw.function.strict, true);
assert.strictEqual(descriptors[0].raw.frontier.actionId, 'todos.complete');
assert.strictEqual(createToolDescriptor(compiler.get('todos.complete'), { format: 'mcp' }).raw.annotations.destructiveHint, true);
assert.strictEqual(createToolDescriptor(compiler.get('todos.complete'), { format: 'vercel' }).raw.inputSchema.type, 'object');

const dryRunRecord = executeToolAction(compiler, {
  actionId: 'todos.complete',
  input: { todoId: 't1' },
  dryRun: true
}, { context });
assert.strictEqual(dryRunRecord.status, 'dry-run');
assert.deepStrictEqual(dryRunRecord.patches, [{ op: 'set', path: '/entities/todos/t1/done', value: true }]);

const executed = executeToolAction(compiler, {
  actionId: 'todos.complete',
  input: { todoId: 't2' }
}, {
  context,
  handlers: {
    'todos.complete': ({ input }) => ({
      output: { completed: input.todoId },
      patches: [{ op: 'set', path: '/entities/todos/t2/done', value: true }],
      effects: []
    })
  }
});
assert.strictEqual(executed.status, 'ok');
assert.strictEqual(executed.expectedPatchMatched, true);
assert.deepStrictEqual(executed.output, { completed: 't2' });

const asyncExecuted = await executeToolActionAsync(compiler, {
  actionId: 'todos.complete',
  input: { todoId: 't3' }
}, {
  context,
  handlers: {
    'todos.complete': async ({ input }) => ({
      patches: [{ op: 'set', path: '/entities/todos/t3/done', value: true }],
      output: { completed: input.todoId }
    })
  }
});
assert.strictEqual(asyncExecuted.status, 'ok');

const record = createToolRecord({ plan, status: 'dry-run', patches: plan.expectedPatch });
assert.strictEqual(record.actionId, 'todos.complete');
const session = appendToolSessionRecord(createToolsSession({ id: 'session-1', startedAt: 1 }), record, 2);
assert.strictEqual(session.summary.recordCount, 1);
assert.deepStrictEqual(session.summary.actionIds, ['todos.complete']);

const graph = createToolsRegistryGraph(manifest);
assert.ok(graph.entries.some((entry) => entry.id === 'todos.complete'));
assert.ok(graph.edges.some((edge) => edge.kind === 'rollback' && edge.to.endsWith('todos.reopen')));

const impact = traceToolsImpact(manifest, { nodes: ['entities.todos'] });
assert.ok(impact.actionIds.includes('todos.complete'));

const jsonl = encodeToolsJsonl([plan, record]);
assert.strictEqual(decodeToolsJsonl(jsonl).length, 2);
assert.notStrictEqual(createToolsProof(manifest).hash.length, 0);
assert.strictEqual(JSON.stringify(redactToolsManifest(manifest)).includes('secret'), false);
