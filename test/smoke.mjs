import assert from 'node:assert';
import {
  appendToolSessionRecord,
  compileTools,
  createAutonomousMergeActionDescriptors,
  createAutonomousMergeActionManifest,
  createContinuousPoolActionDescriptors,
  createContinuousPoolActionManifest,
  FRONTIER_CONTINUOUS_POOL_TASK_SET_SELECTION_INPUT,
  createBundleRepairActionDescriptors,
  createBundleRepairActionManifest,
  createCoordinatorActionDescriptors,
  createCoordinatorActionManifest,
  createGateRunActionDescriptors,
  createGateRunActionManifest,
  createGateBackedDrainActionDescriptors,
  createGateBackedDrainActionManifest,
  createAgentTaskDescriptor,
  createModelRoutingActionDescriptors,
  createModelRoutingActionManifest,
  createModelRoutingPolicyOverrideActionDescriptors,
  createModelRoutingPolicyOverrideActionManifest,
  createSafeModelRoutingPolicyOverrideActionDescriptors,
  createSafeModelRoutingPolicyOverrideActionManifest,
  defineSafeModelRoutingPolicyOverrideActions,
  createSemanticOwnershipActionDescriptors,
  createSemanticOwnershipActionManifest,
  createToolRecordActionDescriptors,
  createToolRecordActionManifest,
  createToolDescriptor,
  createToolDescriptors,
  createToolRecord,
  createToolsManifest,
  createToolsProof,
  createToolsRegistryGraph,
  createToolsSession,
  FRONTIER_GATE_BACKED_DRAIN_ACTION_IDS,
  FRONTIER_GATE_RUN_ACTION_IDS,
  FRONTIER_MODEL_ROUTING_POLICY_OVERRIDE_ACTION_IDS,
  FRONTIER_SEMANTIC_OWNERSHIP_ACTION_IDS,
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

const agentTask = createAgentTaskDescriptor({
  id: 'todos.audit-export',
  capability: 'todo.audit',
  reads: ['entities.todos', 'entities.todos'],
  writes: ['agent-runs/todos-audit/evidence'],
  expectedArtifacts: [
    { kind: 'patch', path: 'changes.patch', required: true },
    { kind: 'evidence', path: 'evidence/evidence.json', metadata: { dashboard: true } }
  ],
  safetyPolicy: {
    approvalRequired: true,
    sandbox: 'workspace',
    network: 'none',
    secrets: 'none',
    allowedCommands: ['npm --prefix packages/frontier-tools run test'],
    maxRuntimeMs: 120000
  },
  status: 'queued'
});
assert.strictEqual(agentTask.kind, 'frontier.tools.agent-task');
assert.strictEqual(agentTask.title, 'Audit Export');
assert.strictEqual(agentTask.capability, 'todo.audit');
assert.deepStrictEqual(agentTask.reads, ['entities.todos']);
assert.deepStrictEqual(agentTask.writes, ['agent-runs/todos-audit/evidence']);
assert.strictEqual(agentTask.expectedArtifacts.length, 2);
assert.strictEqual(agentTask.expectedArtifacts[1].metadata.dashboard, true);
assert.strictEqual(agentTask.safetyPolicy.approvalRequired, true);
assert.strictEqual(agentTask.safetyPolicy.destructive, true);
assert.deepStrictEqual(agentTask.safetyPolicy.requires, ['todo.audit']);
assert.ok(agentTask.safetyPolicy.policyResources.includes('task:todos.audit-export'));
assert.strictEqual(agentTask.safetyPolicy.maxRuntimeMs, 120000);
assert.strictEqual(agentTask.status, 'queued');

const semanticOwnershipDescriptors = createSemanticOwnershipActionDescriptors({
  id: 'semantic-ownership.tools',
  package: '@app/semantic-ownership',
  feature: 'semantic-ownership',
  owner: 'coordinator',
  artifactRoot: 'evidence/semantic-ownership'
});
assert.deepStrictEqual(semanticOwnershipDescriptors.map((action) => action.id), FRONTIER_SEMANTIC_OWNERSHIP_ACTION_IDS);
assert.strictEqual(semanticOwnershipDescriptors.length, 1);
assert.strictEqual(semanticOwnershipDescriptors[0].capability, 'semantic-ownership.region.inspect');
assert.ok(semanticOwnershipDescriptors[0].reads.includes('region:pending-changes'));

const semanticOwnershipManifest = createSemanticOwnershipActionManifest({
  id: 'semantic-ownership.tools',
  package: '@app/semantic-ownership',
  feature: 'semantic-ownership',
  owner: 'coordinator',
  artifactRoot: 'evidence/semantic-ownership'
});
const semanticOwnershipCompiler = compileTools(semanticOwnershipManifest);
assert.strictEqual(semanticOwnershipManifest.summary.actionCount, 1);
assert.strictEqual(semanticOwnershipManifest.summary.dryRunCount, 1);
assert.strictEqual(semanticOwnershipManifest.summary.readCount, 4);
assert.strictEqual(semanticOwnershipManifest.summary.writeCount, 2);
assert.deepStrictEqual(listAvailableTools(semanticOwnershipCompiler, { capabilities: ['semantic-ownership.region.inspect'] }).map((action) => action.id), ['semantic-ownership.inspect-region']);
assert.deepStrictEqual(createToolDescriptors(semanticOwnershipCompiler, { capabilities: ['semantic-ownership.region.inspect'] }, { format: 'frontier' }).map((descriptor) => descriptor.id), ['semantic-ownership.inspect-region']);
assert.strictEqual(validateToolInput(semanticOwnershipCompiler.get('semantic-ownership.inspect-region'), { regionId: 'region-1', includePendingChanges: true }).valid, true);
assert.strictEqual(validateToolInput(semanticOwnershipCompiler.get('semantic-ownership.inspect-region'), {}).valid, false);
assert.strictEqual(createToolDescriptor(semanticOwnershipCompiler.get('semantic-ownership.inspect-region'), { format: 'frontier' }).risk, 'low');

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

const coordinatorDescriptors = createCoordinatorActionDescriptors({
  id: 'coordinator.tools',
  package: '@app/coordinator',
  feature: 'autonomous-merge',
  owner: 'coordinator',
  artifactRoot: 'evidence/coordinator'
});
assert.strictEqual(coordinatorDescriptors.length, 8);
assert.ok(coordinatorDescriptors.every((action) => action.dryRun === true));
assert.strictEqual(coordinatorDescriptors.some((action) => action.producedArtifacts.length > 0), true);
assert.strictEqual(coordinatorDescriptors.find((action) => action.id === 'coordinator.submit-answer').title, 'Submit human answer');
assert.ok(coordinatorDescriptors.find((action) => action.id === 'coordinator.submit-answer').tags.includes('dashboard'));

const coordinatorManifest = createCoordinatorActionManifest({
  id: 'coordinator.tools',
  package: '@app/coordinator',
  feature: 'autonomous-merge',
  owner: 'coordinator',
  artifactRoot: 'evidence/coordinator'
});
const coordinatorCompiler = compileTools(coordinatorManifest);
const coordinatorContext = { capabilities: coordinatorManifest.capabilities };
const coordinatorAvailable = createToolDescriptors(coordinatorCompiler, coordinatorContext, { format: 'frontier' });
assert.strictEqual(coordinatorManifest.summary.actionCount, 8);
assert.strictEqual(coordinatorManifest.summary.approvalCount, 1);
assert.strictEqual(coordinatorManifest.summary.dryRunCount, 8);
assert.strictEqual(coordinatorAvailable.length, 8);
assert.strictEqual(coordinatorCompiler.get('coordinator.apply-bundle').risk, 'high');
assert.strictEqual(coordinatorCompiler.get('coordinator.answer-question').capability, 'coordinator.question.answer');
assert.strictEqual(coordinatorCompiler.get('coordinator.submit-answer').capability, 'coordinator.question.answer');
assert.ok(coordinatorCompiler.get('coordinator.apply-bundle').producedArtifacts.some((artifact) => artifact.kind === 'decision'));
assert.strictEqual(createToolDescriptor(coordinatorCompiler.get('coordinator.apply-bundle'), { format: 'frontier' }).risk, 'high');
assert.strictEqual(createToolDescriptor(coordinatorCompiler.get('coordinator.submit-answer'), { format: 'frontier' }).title, 'Submit human answer');

const gateBackedDrainDescriptors = createGateBackedDrainActionDescriptors({
  id: 'gate-backed-drain.tools',
  package: '@app/gate-backed-drain',
  feature: 'gate-backed-drain',
  owner: 'coordinator',
  artifactRoot: 'evidence/gate-backed-drain'
});
assert.deepStrictEqual(gateBackedDrainDescriptors.map((action) => action.id), FRONTIER_GATE_BACKED_DRAIN_ACTION_IDS);
assert.strictEqual(gateBackedDrainDescriptors.length, 5);
assert.ok(gateBackedDrainDescriptors.every((action) => action.dryRun === true));
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.select-default-gates').risk, 'low');
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.select-default-gates').approval.required, false);
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.apply-with-gates').approval.required, true);
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.apply-with-gates').risk, 'high');
assert.ok(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.apply-with-gates').description.includes('not a blind apply'));
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.route-gate-failure').risk, 'medium');
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.request-missing-gate-rerun').approval.required, false);
assert.strictEqual(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.record-decision-ledger').approval.required, true);
assert.ok(gateBackedDrainDescriptors.find((action) => action.id === 'gate-backed-drain.record-decision-ledger').writes.includes('decision:ledger'));

const gateBackedDrainManifest = createGateBackedDrainActionManifest({
  id: 'gate-backed-drain.tools',
  package: '@app/gate-backed-drain',
  feature: 'gate-backed-drain',
  owner: 'coordinator',
  artifactRoot: 'evidence/gate-backed-drain'
});
const gateBackedDrainCompiler = compileTools(gateBackedDrainManifest);
assert.strictEqual(gateBackedDrainManifest.summary.actionCount, 5);
assert.strictEqual(gateBackedDrainManifest.summary.approvalCount, 2);
assert.strictEqual(gateBackedDrainManifest.summary.dryRunCount, 5);
assert.deepStrictEqual(listAvailableTools(gateBackedDrainCompiler, { capabilities: ['gate-backed-drain.gates.select-default'] }).map((action) => action.id), ['gate-backed-drain.select-default-gates']);
assert.strictEqual(validateToolInput(gateBackedDrainCompiler.get('gate-backed-drain.apply-with-gates'), { drainId: 'drain-1', requiredGateIds: ['gate-1'] }).valid, true);
assert.strictEqual(validateToolInput(gateBackedDrainCompiler.get('gate-backed-drain.apply-with-gates'), { drainId: 'drain-1' }).valid, false);
assert.strictEqual(createToolDescriptor(gateBackedDrainCompiler.get('gate-backed-drain.apply-with-gates'), { format: 'frontier' }).risk, 'high');

const gateRunDescriptors = createGateRunActionDescriptors({
  id: 'gate-run.tools',
  package: '@app/gate-run',
  feature: 'gate-run',
  owner: 'coordinator',
  artifactRoot: 'evidence/gate-run'
});
assert.deepStrictEqual(gateRunDescriptors.map((action) => action.id), FRONTIER_GATE_RUN_ACTION_IDS);
assert.strictEqual(gateRunDescriptors.length, 3);
assert.ok(gateRunDescriptors.every((action) => action.dryRun === true));
assert.strictEqual(gateRunDescriptors.find((action) => action.id === 'gate-run.run-package-gates').approval.required, false);
assert.strictEqual(gateRunDescriptors.find((action) => action.id === 'gate-run.run-package-gates').risk, 'low');
assert.strictEqual(gateRunDescriptors.find((action) => action.id === 'gate-run.run-local-gates').title, 'Run local gates');
assert.strictEqual(gateRunDescriptors.find((action) => action.id === 'gate-run.run-global-gates').approval.required, true);
assert.ok(gateRunDescriptors.find((action) => action.id === 'gate-run.run-global-gates').writes.includes('repo:gate-summary'));

const gateRunManifest = createGateRunActionManifest({
  id: 'gate-run.tools',
  package: '@app/gate-run',
  feature: 'gate-run',
  owner: 'coordinator',
  artifactRoot: 'evidence/gate-run'
});
const gateRunCompiler = compileTools(gateRunManifest);
assert.strictEqual(gateRunManifest.summary.actionCount, 3);
assert.strictEqual(gateRunManifest.summary.approvalCount, 1);
assert.strictEqual(gateRunManifest.summary.dryRunCount, 3);
assert.deepStrictEqual(listAvailableTools(gateRunCompiler, { capabilities: ['gate-run.package'] }).map((action) => action.id), ['gate-run.run-package-gates']);
assert.deepStrictEqual(listAvailableTools(gateRunCompiler, { capabilities: ['gate-run.global'] }).map((action) => action.id), ['gate-run.run-global-gates']);
assert.strictEqual(validateToolInput(gateRunCompiler.get('gate-run.run-package-gates'), { packageName: 'packages/frontier-tools' }).valid, true);
assert.strictEqual(validateToolInput(gateRunCompiler.get('gate-run.run-local-gates'), { workspaceRoot: '.' }).valid, true);
assert.strictEqual(validateToolInput(gateRunCompiler.get('gate-run.run-global-gates'), { repoRoot: '.', packageGlobs: ['packages/*'] }).valid, true);
assert.strictEqual(gateRunCompiler.get('gate-run.run-global-gates').approval.required, true);

const bundleRepairDescriptors = createBundleRepairActionDescriptors({
  id: 'bundle-repair.tools',
  package: '@app/bundle-repair',
  feature: 'bundle-repair',
  owner: 'coordinator',
  artifactRoot: 'evidence/bundle-repair'
});
assert.strictEqual(bundleRepairDescriptors.length, 7);
assert.ok(bundleRepairDescriptors.every((action) => action.dryRun === true));
assert.ok(bundleRepairDescriptors.every((action) => action.producedArtifacts.length > 0));
assert.strictEqual(bundleRepairDescriptors.filter((action) => action.tags.includes('decision')).length, 3);
assert.strictEqual(bundleRepairDescriptors.find((action) => action.id === 'bundle-repair.generate-patch').risk, 'medium');
assert.strictEqual(bundleRepairDescriptors.find((action) => action.id === 'bundle-repair.generate-patch').producedArtifacts.some((artifact) => artifact.kind === 'patch'), true);
assert.strictEqual(bundleRepairDescriptors.find((action) => action.id === 'bundle-repair.record-applied-decision').approval.required, true);

const bundleRepairManifest = createBundleRepairActionManifest({
  id: 'bundle-repair.tools',
  package: '@app/bundle-repair',
  feature: 'bundle-repair',
  owner: 'coordinator',
  artifactRoot: 'evidence/bundle-repair'
});
const bundleRepairCompiler = compileTools(bundleRepairManifest);
assert.strictEqual(bundleRepairManifest.summary.actionCount, 7);
assert.strictEqual(bundleRepairManifest.summary.approvalCount, 1);
assert.strictEqual(bundleRepairManifest.summary.dryRunCount, 7);
assert.deepStrictEqual(listAvailableTools(bundleRepairCompiler, { capabilities: ['bundle-repair.patch.generate'] }).map((action) => action.id), ['bundle-repair.generate-patch']);
assert.strictEqual(validateToolInput(bundleRepairCompiler.get('bundle-repair.generate-patch'), { bundleId: 'bundle-1' }).valid, true);
assert.strictEqual(validateToolInput(bundleRepairCompiler.get('bundle-repair.generate-patch'), {}).valid, false);
assert.strictEqual(createToolDescriptor(bundleRepairCompiler.get('bundle-repair.record-applied-decision'), { format: 'frontier' }).risk, 'high');

const toolRecordDescriptors = createToolRecordActionDescriptors({
  id: 'tool-record.tools',
  package: '@app/tool-record',
  feature: 'tool-record',
  owner: 'coordinator',
  artifactRoot: 'evidence/tool-record'
});
assert.strictEqual(toolRecordDescriptors.length, 4);
assert.ok(toolRecordDescriptors.every((action) => action.dryRun === true));
assert.strictEqual(toolRecordDescriptors.filter((action) => action.tags.includes('decision')).length, 3);
assert.strictEqual(toolRecordDescriptors.find((action) => action.id === 'tool-record.apply').approval.required, true);
assert.strictEqual(toolRecordDescriptors.find((action) => action.id === 'tool-record.rerun').risk, 'medium');
assert.ok(toolRecordDescriptors.find((action) => action.id === 'tool-record.rerun').producedArtifacts.some((artifact) => artifact.kind === 'task'));

const toolRecordManifest = createToolRecordActionManifest({
  id: 'tool-record.tools',
  package: '@app/tool-record',
  feature: 'tool-record',
  owner: 'coordinator',
  artifactRoot: 'evidence/tool-record'
});
const toolRecordCompiler = compileTools(toolRecordManifest);
assert.strictEqual(toolRecordManifest.summary.actionCount, 4);
assert.strictEqual(toolRecordManifest.summary.approvalCount, 1);
assert.strictEqual(toolRecordManifest.summary.dryRunCount, 4);
assert.deepStrictEqual(listAvailableTools(toolRecordCompiler, { capabilities: ['tool-record.decision.apply'] }).map((action) => action.id), ['tool-record.apply']);
assert.strictEqual(validateToolInput(toolRecordCompiler.get('tool-record.apply'), { recordId: 'record-1' }).valid, true);
assert.strictEqual(validateToolInput(toolRecordCompiler.get('tool-record.apply'), {}).valid, false);
assert.strictEqual(createToolDescriptor(toolRecordCompiler.get('tool-record.apply'), { format: 'frontier' }).risk, 'high');
const toolRecordRun = executeToolAction(toolRecordCompiler, {
  actionId: 'tool-record.no-change',
  input: { recordId: 'record-2' },
  dryRun: true
}, {
  context: { capabilities: ['tool-record.decision.no-change'] }
});
assert.strictEqual(toolRecordRun.status, 'dry-run');
assert.strictEqual(toolRecordRun.actionId, 'tool-record.no-change');

const autonomousMergeDescriptors = createAutonomousMergeActionDescriptors({
  id: 'autonomous-merge.tools',
  package: '@app/autonomous-merge',
  feature: 'autonomous-merge',
  owner: 'coordinator',
  artifactRoot: 'evidence/autonomous-merge'
});
assert.strictEqual(autonomousMergeDescriptors.length, 8);
assert.ok(autonomousMergeDescriptors.every((action) => action.dryRun === true));
assert.ok(autonomousMergeDescriptors.every((action) => action.producedArtifacts.length > 0));
assert.strictEqual(autonomousMergeDescriptors.filter((action) => action.tags.includes('human')).length, 2);
assert.strictEqual(autonomousMergeDescriptors.filter((action) => action.tags.includes('queue')).length, 2);
assert.strictEqual(autonomousMergeDescriptors.find((action) => action.id === 'autonomous-merge.ask-human').capability, 'autonomous-merge.human.ask');
assert.strictEqual(autonomousMergeDescriptors.find((action) => action.id === 'autonomous-merge.consume-answer').capability, 'autonomous-merge.human.consume');
assert.strictEqual(autonomousMergeDescriptors.find((action) => action.id === 'autonomous-merge.apply-candidate').approval.required, true);

const autonomousMergeManifest = createAutonomousMergeActionManifest({
  id: 'autonomous-merge.tools',
  package: '@app/autonomous-merge',
  feature: 'autonomous-merge',
  owner: 'coordinator',
  artifactRoot: 'evidence/autonomous-merge'
});
const autonomousMergeCompiler = compileTools(autonomousMergeManifest);
assert.strictEqual(autonomousMergeManifest.summary.actionCount, 8);
assert.strictEqual(autonomousMergeManifest.summary.approvalCount, 2);
assert.strictEqual(autonomousMergeManifest.summary.dryRunCount, 8);
assert.strictEqual(autonomousMergeManifest.summary.rollbackCount, 0);
assert.deepStrictEqual(listAvailableTools(autonomousMergeCompiler, { capabilities: ['autonomous-merge.human.ask'] }).map((action) => action.id), ['autonomous-merge.ask-human']);
assert.deepStrictEqual(listAvailableTools(autonomousMergeCompiler, { capabilities: ['autonomous-merge.review.drain'] }).map((action) => action.id), ['autonomous-merge.drain-review']);
assert.deepStrictEqual(createToolDescriptors(autonomousMergeCompiler, { capabilities: ['autonomous-merge.human.ask'] }, { format: 'frontier' }).map((descriptor) => descriptor.id), ['autonomous-merge.ask-human']);
assert.deepStrictEqual(createToolDescriptors(autonomousMergeCompiler, { capabilities: ['autonomous-merge.review.drain'] }, { format: 'frontier' }).map((descriptor) => descriptor.id), ['autonomous-merge.drain-review']);
assert.strictEqual(createToolDescriptor(autonomousMergeCompiler.get('autonomous-merge.apply-candidate'), { format: 'frontier' }).risk, 'high');

const continuousPoolDescriptors = createContinuousPoolActionDescriptors({
  id: 'continuous-pool.tools',
  package: '@app/continuous-pool',
  feature: 'continuous-pool',
  owner: 'coordinator',
  artifactRoot: 'evidence/continuous-pool'
});
assert.strictEqual(continuousPoolDescriptors.length, 9);
assert.ok(continuousPoolDescriptors.every((action) => action.dryRun === true));
assert.ok(continuousPoolDescriptors.every((action) => action.producedArtifacts.length > 0));
assert.strictEqual(continuousPoolDescriptors.filter((action) => action.tags.includes('coordinator-review')).length, 4);
assert.strictEqual(continuousPoolDescriptors.filter((action) => action.tags.includes('auto-rerun')).length, 1);
assert.strictEqual(continuousPoolDescriptors.filter((action) => action.tags.includes('apply')).length, 1);
assert.strictEqual(continuousPoolDescriptors.filter((action) => action.tags.includes('human-question')).length, 2);
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.select-next-task-set').capability, 'continuous-pool.task-set.select');
assert.deepStrictEqual(Object.keys(FRONTIER_CONTINUOUS_POOL_TASK_SET_SELECTION_INPUT), ['desiredConcurrency', 'selectedTaskSetGeneration']);
assert.deepStrictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.select-next-task-set').input.desiredConcurrency, FRONTIER_CONTINUOUS_POOL_TASK_SET_SELECTION_INPUT.desiredConcurrency);
assert.deepStrictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.select-next-task-set').input.selectedTaskSetGeneration, FRONTIER_CONTINUOUS_POOL_TASK_SET_SELECTION_INPUT.selectedTaskSetGeneration);
assert.deepStrictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.emit-human-question').reads, ['pool:reviews', 'pool:questions', 'pool:evidence']);
assert.ok(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.inspect-pool').producedArtifacts.some((artifact) => artifact.kind === 'evidence'));
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.apply-candidate').approval.required, true);
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.apply-candidate').risk, 'high');
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.rerun-stale').risk, 'medium');
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.emit-human-question').risk, 'low');
assert.strictEqual(continuousPoolDescriptors.find((action) => action.id === 'continuous-pool.consume-answer').capability, 'continuous-pool.human.consume');

const continuousPoolManifest = createContinuousPoolActionManifest({
  id: 'continuous-pool.tools',
  package: '@app/continuous-pool',
  feature: 'continuous-pool',
  owner: 'coordinator',
  artifactRoot: 'evidence/continuous-pool'
});
const continuousPoolCompiler = compileTools(continuousPoolManifest);
assert.strictEqual(continuousPoolManifest.summary.actionCount, 9);
assert.strictEqual(continuousPoolManifest.summary.approvalCount, 1);
assert.strictEqual(continuousPoolManifest.summary.dryRunCount, 9);
assert.deepStrictEqual(listAvailableTools(continuousPoolCompiler, { capabilities: ['continuous-pool.human.ask'] }).map((action) => action.id), ['continuous-pool.emit-human-question']);
assert.deepStrictEqual(listAvailableTools(continuousPoolCompiler, { capabilities: ['continuous-pool.task-set.select'] }).map((action) => action.id), ['continuous-pool.select-next-task-set']);
assert.deepStrictEqual(createToolDescriptors(continuousPoolCompiler, { capabilities: ['continuous-pool.review.rerun'] }, { format: 'frontier' }).map((descriptor) => descriptor.id), ['continuous-pool.rerun-stale']);
assert.strictEqual(createToolDescriptor(continuousPoolCompiler.get('continuous-pool.apply-candidate'), { format: 'frontier' }).risk, 'high');

const modelRoutingDescriptors = createModelRoutingActionDescriptors({
  id: 'model-routing.tools',
  package: '@app/model-routing',
  feature: 'adaptive-routing',
  owner: 'routing',
  artifactRoot: 'evidence/model-routing'
});
assert.strictEqual(modelRoutingDescriptors.length, 5);
assert.ok(modelRoutingDescriptors.every((action) => action.dryRun === true));
assert.deepStrictEqual(modelRoutingDescriptors[0].reads, ['model-routing:routes', 'model-routing:decisions', 'model-routing:signals', 'model-routing:budgets']);
assert.deepStrictEqual(modelRoutingDescriptors[0].writes, [
  'evidence/model-routing/explain-routing.json',
  'evidence/model-routing/explain-routing.jsonl'
]);
assert.strictEqual(modelRoutingDescriptors[1].capability, 'model-routing.tiers.compare');
assert.strictEqual(modelRoutingDescriptors[2].risk, 'medium');
assert.ok(modelRoutingDescriptors[3].writes.includes('evidence/model-routing/outcome-feedback.json'));
assert.ok(modelRoutingDescriptors[4].producedArtifacts.some((artifact) => artifact.kind === 'manifest'));

const modelRoutingManifest = createModelRoutingActionManifest({
  id: 'model-routing.tools',
  package: '@app/model-routing',
  feature: 'adaptive-routing',
  owner: 'routing',
  artifactRoot: 'evidence/model-routing'
});
const modelRoutingCompiler = compileTools(modelRoutingManifest);
const modelRoutingDescriptorsOut = createToolDescriptors(modelRoutingCompiler, { capabilities: modelRoutingManifest.capabilities }, { format: 'frontier' });
assert.strictEqual(modelRoutingManifest.summary.actionCount, 5);
assert.strictEqual(modelRoutingManifest.summary.dryRunCount, 5);
assert.strictEqual(modelRoutingManifest.summary.approvalCount, 0);
assert.strictEqual(modelRoutingCompiler.get('model-routing.request-tournament-rerun').capability, 'model-routing.tournament.rerun');
assert.strictEqual(createToolDescriptor(modelRoutingCompiler.get('model-routing.explain-routing'), { format: 'frontier' }).risk, 'low');
assert.strictEqual(modelRoutingDescriptorsOut.length, 5);

const modelRoutingOverrideDescriptors = createModelRoutingPolicyOverrideActionDescriptors({
  id: 'model-routing-policy-override.tools',
  package: '@app/model-routing',
  feature: 'adaptive-routing',
  owner: 'routing',
  artifactRoot: 'evidence/model-routing/overrides'
});
assert.strictEqual(modelRoutingOverrideDescriptors.length, 2);
assert.ok(modelRoutingOverrideDescriptors.every((action) => action.dryRun === true));
assert.strictEqual(modelRoutingOverrideDescriptors[0].risk, 'low');
assert.strictEqual(modelRoutingOverrideDescriptors[1].approval.required, true);
assert.strictEqual(modelRoutingOverrideDescriptors[1].writes[0], 'model-routing:policy-override-requests');
assert.ok(modelRoutingOverrideDescriptors[1].producedArtifacts.some((artifact) => artifact.kind === 'request'));

const modelRoutingOverrideManifest = createModelRoutingPolicyOverrideActionManifest({
  id: 'model-routing-policy-override.tools',
  package: '@app/model-routing',
  feature: 'adaptive-routing',
  owner: 'routing',
  artifactRoot: 'evidence/model-routing/overrides'
});
const modelRoutingOverrideCompiler = compileTools(modelRoutingOverrideManifest);
assert.strictEqual(modelRoutingOverrideManifest.summary.actionCount, 2);
assert.strictEqual(modelRoutingOverrideManifest.summary.dryRunCount, 2);
assert.strictEqual(modelRoutingOverrideManifest.summary.approvalCount, 1);
assert.deepStrictEqual(
  createToolDescriptors(modelRoutingOverrideCompiler, { capabilities: modelRoutingOverrideManifest.capabilities }, { format: 'frontier' }).map((descriptor) => descriptor.id),
  ['model-routing.preview-policy-override', 'model-routing.request-policy-override']
);
assert.strictEqual(createToolDescriptor(modelRoutingOverrideCompiler.get('model-routing.request-policy-override'), { format: 'frontier' }).requiresApproval, true);
assert.deepStrictEqual(
  createSafeModelRoutingPolicyOverrideActionDescriptors({
    id: 'model-routing-policy-override.tools',
    package: '@app/model-routing',
    feature: 'adaptive-routing',
    owner: 'routing',
    artifactRoot: 'evidence/model-routing/overrides'
  }).map((action) => action.id),
  FRONTIER_MODEL_ROUTING_POLICY_OVERRIDE_ACTION_IDS
);
assert.strictEqual(
  createSafeModelRoutingPolicyOverrideActionManifest({
    id: 'model-routing-policy-override.tools',
    package: '@app/model-routing',
    feature: 'adaptive-routing',
    owner: 'routing',
    artifactRoot: 'evidence/model-routing/overrides'
  }).summary.actionCount,
  2
);
assert.strictEqual(
  defineSafeModelRoutingPolicyOverrideActions({
    id: 'model-routing-policy-override.tools',
    package: '@app/model-routing',
    feature: 'adaptive-routing',
    owner: 'routing',
    artifactRoot: 'evidence/model-routing/overrides'
  }).summary.approvalCount,
  1
);
