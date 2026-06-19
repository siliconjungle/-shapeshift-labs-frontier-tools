import type { JsonObject, JsonValue } from '@shapeshift-labs/frontier';
import { cloneJson } from '@shapeshift-labs/frontier/clone';
import {
  createFrontierRegistryGraph,
  normalizeFrontierRegistryPath,
  type FrontierRegistryEdge,
  type FrontierRegistryEntry,
  type FrontierRegistryGraph,
  type FrontierRegistryImpact,
  type FrontierRegistryImpactInput,
  type FrontierRegistryPath,
  type FrontierRegistrySource
} from '@shapeshift-labs/frontier/registry';

export const FRONTIER_TOOLS_MANIFEST_KIND = 'frontier.tools.manifest';
export const FRONTIER_TOOLS_MANIFEST_VERSION = 1;
export const FRONTIER_TOOL_ACTION_KIND = 'frontier.tools.action';
export const FRONTIER_TOOL_ACTION_VERSION = 1;
export const FRONTIER_TOOLS_QUERY_KIND = 'frontier.tools.query';
export const FRONTIER_TOOLS_QUERY_VERSION = 1;
export const FRONTIER_TOOLS_VALIDATION_KIND = 'frontier.tools.validation';
export const FRONTIER_TOOLS_VALIDATION_VERSION = 1;
export const FRONTIER_TOOLS_PLAN_KIND = 'frontier.tools.plan';
export const FRONTIER_TOOLS_PLAN_VERSION = 1;
export const FRONTIER_TOOLS_RECORD_KIND = 'frontier.tools.record';
export const FRONTIER_TOOLS_RECORD_VERSION = 1;
export const FRONTIER_TOOLS_SESSION_KIND = 'frontier.tools.session';
export const FRONTIER_TOOLS_SESSION_VERSION = 1;
export const FRONTIER_TOOLS_IMPACT_KIND = 'frontier.tools.impact';
export const FRONTIER_TOOLS_IMPACT_VERSION = 1;
export const FRONTIER_TOOLS_PROOF_KIND = 'frontier.tools.proof';
export const FRONTIER_TOOLS_PROOF_VERSION = 1;
export const FRONTIER_AGENT_TASK_DESCRIPTOR_KIND = 'frontier.tools.agent-task';
export const FRONTIER_AGENT_TASK_DESCRIPTOR_VERSION = 1;

export type FrontierToolsMaybePromise<T> = T | Promise<T>;
export type FrontierToolInputPrimitive = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
export type FrontierToolDescriptorFormat = 'frontier' | 'openai' | 'mcp' | 'vercel' | 'langchain';
export type FrontierToolExecutionStatus = 'ok' | 'planned' | 'dry-run' | 'blocked' | 'invalid' | 'error' | string;
export type FrontierAgentTaskResultStatus = 'todo' | 'queued' | 'running' | 'planned' | 'dry-run' | 'blocked' | 'invalid' | 'ok' | 'error' | 'cancelled' | string;
export type FrontierToolJsonSchema = JsonObject;

export interface FrontierToolSourceInput {
  file: string;
  line?: number;
  column?: number;
  symbol?: string;
  exportName?: string;
  package?: string;
}

export interface FrontierToolInputFieldInput {
  type?: FrontierToolInputPrimitive | readonly FrontierToolInputPrimitive[];
  description?: string;
  enum?: readonly JsonValue[];
  required?: boolean;
  default?: JsonValue;
  items?: FrontierToolJsonSchema;
  properties?: Record<string, FrontierToolJsonSchema>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | FrontierToolJsonSchema;
  metadata?: unknown;
}

export type FrontierToolInputShape = Record<string, FrontierToolInputPrimitive | FrontierToolInputFieldInput | FrontierToolJsonSchema>;

export type FrontierToolRisk = 'low' | 'medium' | 'high' | 'critical' | string;

export interface FrontierToolArtifactRecordInput {
  id?: string;
  kind?: string;
  path?: string;
  description?: string;
  required?: boolean;
  metadata?: unknown;
}

export type FrontierToolArtifactInput = string | FrontierToolArtifactRecordInput;

export interface FrontierToolArtifact {
  id: string;
  kind: string;
  path?: string;
  description?: string;
  required: boolean;
  metadata?: JsonObject;
}

export interface FrontierAgentTaskArtifactRecordInput {
  id?: string;
  kind?: string;
  path?: string;
  description?: string;
  required?: boolean;
  metadata?: unknown;
}

export type FrontierAgentTaskArtifactInput = string | FrontierAgentTaskArtifactRecordInput;

export interface FrontierAgentTaskArtifact {
  id: string;
  kind: string;
  path?: string;
  description?: string;
  required: boolean;
  metadata?: JsonObject;
}

export interface FrontierAgentTaskSafetyPolicyInput {
  approvalRequired?: boolean;
  approvalMode?: 'always' | 'policy' | 'never' | string;
  destructive?: boolean;
  sandbox?: 'none' | 'workspace' | 'process' | 'browser' | string;
  network?: 'none' | 'restricted' | 'allowed' | string;
  secrets?: 'none' | 'redacted' | 'read' | 'write' | string;
  allowedCommands?: readonly string[];
  deniedCommands?: readonly string[];
  requires?: readonly string[];
  policyResources?: readonly string[];
  maxRuntimeMs?: number;
  metadata?: unknown;
}

export interface FrontierAgentTaskSafetyPolicy {
  approvalRequired: boolean;
  approvalMode: string;
  destructive: boolean;
  sandbox: string;
  network: string;
  secrets: string;
  allowedCommands: string[];
  deniedCommands: string[];
  requires: string[];
  policyResources: string[];
  maxRuntimeMs?: number;
  metadata?: JsonObject;
}

export interface FrontierAgentTaskDescriptorInput {
  id: string;
  capability: string;
  title?: string;
  description?: string;
  reads?: readonly string[];
  writes?: readonly string[];
  expectedArtifacts?: readonly FrontierAgentTaskArtifactInput[];
  safetyPolicy?: FrontierAgentTaskSafetyPolicyInput;
  status?: FrontierAgentTaskResultStatus;
  owner?: string;
  package?: string;
  feature?: string;
  tags?: readonly string[];
  source?: FrontierRegistrySource | FrontierToolSourceInput;
  metadata?: unknown;
}

export interface FrontierAgentTaskDescriptor {
  kind: typeof FRONTIER_AGENT_TASK_DESCRIPTOR_KIND;
  version: typeof FRONTIER_AGENT_TASK_DESCRIPTOR_VERSION;
  id: string;
  capability: string;
  title: string;
  description?: string;
  reads: string[];
  writes: string[];
  expectedArtifacts: FrontierAgentTaskArtifact[];
  safetyPolicy: FrontierAgentTaskSafetyPolicy;
  status: FrontierAgentTaskResultStatus;
  owner?: string;
  package?: string;
  feature?: string;
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
}

export interface FrontierToolPatchTemplateInput {
  op?: string;
  path: FrontierRegistryPath | string;
  from?: FrontierRegistryPath | string;
  value?: unknown;
  oldValue?: unknown;
  metadata?: unknown;
}

export interface FrontierToolPatchTemplate {
  op: string;
  path: string;
  from?: string;
  value?: JsonValue;
  oldValue?: JsonValue;
  metadata?: JsonObject;
}

export interface FrontierToolRollbackInput {
  action: string;
  input?: unknown;
  reason?: string;
  metadata?: unknown;
}

export interface FrontierToolRollback {
  action: string;
  input?: JsonObject;
  reason?: string;
  metadata?: JsonObject;
}

export interface FrontierToolApprovalInput {
  required?: boolean;
  mode?: 'always' | 'policy' | 'never' | string;
  reason?: string;
  capability?: string;
  metadata?: unknown;
}

export interface FrontierToolApproval {
  required: boolean;
  mode: string;
  reason?: string;
  capability?: string;
  metadata?: JsonObject;
}

export interface FrontierToolActionInput {
  id: string;
  title?: string;
  description?: string;
  capability?: string;
  risk?: FrontierToolRisk;
  input?: FrontierToolInputShape;
  inputSchema?: FrontierToolJsonSchema;
  reads?: readonly string[];
  writes?: readonly string[];
  producedArtifacts?: readonly FrontierToolArtifactInput[];
  effects?: readonly string[];
  requires?: readonly string[];
  policyResources?: readonly string[];
  route?: string;
  routes?: readonly string[];
  dryRun?: boolean;
  expectedPatch?: readonly FrontierToolPatchTemplateInput[];
  rollback?: FrontierToolRollbackInput;
  approval?: FrontierToolApprovalInput;
  owner?: string;
  package?: string;
  feature?: string;
  tags?: readonly string[];
  source?: FrontierRegistrySource | FrontierToolSourceInput;
  metadata?: unknown;
}

export interface FrontierToolAction {
  kind: typeof FRONTIER_TOOL_ACTION_KIND;
  version: typeof FRONTIER_TOOL_ACTION_VERSION;
  id: string;
  title: string;
  description?: string;
  capability?: string;
  risk: FrontierToolRisk;
  inputSchema: FrontierToolJsonSchema;
  reads: string[];
  writes: string[];
  producedArtifacts: FrontierToolArtifact[];
  effects: string[];
  requires: string[];
  policyResources: string[];
  routes: string[];
  dryRun: boolean;
  expectedPatch: FrontierToolPatchTemplate[];
  rollback?: FrontierToolRollback;
  approval?: FrontierToolApproval;
  owner?: string;
  package?: string;
  feature?: string;
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
}

export interface FrontierToolsManifestInput {
  id?: string;
  title?: string;
  package?: string;
  feature?: string;
  owner?: string;
  actions?: readonly FrontierToolActionInput[];
  resources?: readonly string[];
  capabilities?: readonly string[];
  effects?: readonly string[];
  routes?: readonly string[];
  tags?: readonly string[];
  source?: FrontierRegistrySource;
  metadata?: unknown;
}

export interface FrontierToolsManifest {
  kind: typeof FRONTIER_TOOLS_MANIFEST_KIND;
  version: typeof FRONTIER_TOOLS_MANIFEST_VERSION;
  id: string;
  title?: string;
  package?: string;
  feature?: string;
  owner?: string;
  actions: FrontierToolAction[];
  resources: string[];
  capabilities: string[];
  effects: string[];
  routes: string[];
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
  summary: FrontierToolsSummary;
}

export interface FrontierToolsSummary {
  actionCount: number;
  readCount: number;
  writeCount: number;
  effectCount: number;
  capabilityCount: number;
  routeCount: number;
  dryRunCount: number;
  rollbackCount: number;
  approvalCount: number;
}

export interface FrontierToolsPolicyDecision {
  allowed?: boolean;
  access?: 'allow' | 'deny' | 'approval-required' | string;
  requiresApproval?: boolean;
  reasons?: readonly string[];
  redactions?: readonly string[];
  projection?: readonly string[];
  syncProjection?: readonly string[];
  allowedTools?: readonly string[];
  deniedTools?: readonly string[];
  allowedEffects?: readonly string[];
  deniedEffects?: readonly string[];
  metadata?: JsonObject;
}

export interface FrontierToolsPolicyEvaluationInput {
  actor?: unknown;
  subject?: unknown;
  action: 'tool.call';
  tool: string;
  tools: string[];
  resources: string[];
  capabilities: string[];
  route?: string;
  feature?: string;
  package?: string;
  state?: unknown;
  input: JsonObject;
  metadata?: JsonObject;
}

export type FrontierToolsPolicyEvaluator = (
  input: FrontierToolsPolicyEvaluationInput
) => FrontierToolsMaybePromise<FrontierToolsPolicyDecision | null | undefined>;

export interface FrontierToolsContext {
  actor?: unknown;
  subject?: unknown;
  capabilities?: readonly string[];
  route?: string;
  feature?: string;
  package?: string;
  state?: unknown;
  policyDecision?: FrontierToolsPolicyDecision | null;
  metadata?: unknown;
}

export interface FrontierToolsPlanOptions {
  policyEvaluator?: FrontierToolsPolicyEvaluator;
  now?: number;
}

export interface FrontierToolsAvailability {
  available: boolean;
  blockedReasons: string[];
  missingCapabilities: string[];
  policyDecision?: FrontierToolsPolicyDecision;
  requiresApproval: boolean;
}

export interface FrontierToolsValidationError {
  path: string;
  code: string;
  message: string;
}

export interface FrontierToolsValidationResult {
  kind: typeof FRONTIER_TOOLS_VALIDATION_KIND;
  version: typeof FRONTIER_TOOLS_VALIDATION_VERSION;
  valid: boolean;
  input: JsonObject;
  errors: FrontierToolsValidationError[];
}

export interface FrontierToolActionRequest {
  id?: string;
  actionId?: string;
  input?: unknown;
  dryRun?: boolean;
  causeId?: string;
  parentId?: string;
  metadata?: unknown;
}

export interface FrontierToolsPlan {
  kind: typeof FRONTIER_TOOLS_PLAN_KIND;
  version: typeof FRONTIER_TOOLS_PLAN_VERSION;
  id: string;
  actionId: string;
  generatedAt: number;
  input: JsonObject;
  valid: boolean;
  available: boolean;
  dryRun: boolean;
  requiresApproval: boolean;
  blockedReasons: string[];
  validationErrors: FrontierToolsValidationError[];
  reads: string[];
  writes: string[];
  effects: string[];
  requires: string[];
  policyResources: string[];
  expectedPatch: FrontierToolPatchTemplate[];
  rollback?: FrontierToolRollback;
  descriptor: FrontierToolDescriptor;
  policyDecision?: FrontierToolsPolicyDecision;
  metadata?: JsonObject;
}

export interface FrontierToolHandlerRequest {
  action: FrontierToolAction;
  plan: FrontierToolsPlan;
  input: JsonObject;
  context: FrontierToolsContext;
}

export interface FrontierToolHandlerResult {
  output?: unknown;
  patches?: readonly FrontierToolPatchTemplateInput[];
  effects?: readonly string[];
  rollback?: FrontierToolRollbackInput;
  metadata?: unknown;
}

export type FrontierToolHandler = (request: FrontierToolHandlerRequest) => FrontierToolsMaybePromise<FrontierToolHandlerResult | JsonValue | void>;

export interface FrontierToolExecuteOptions extends FrontierToolsPlanOptions {
  handlers?: Record<string, FrontierToolHandler>;
  context?: FrontierToolsContext;
  now?: number;
}

export interface FrontierToolRecordInput {
  id?: string;
  plan: FrontierToolsPlan;
  status?: FrontierToolExecutionStatus;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  output?: unknown;
  patches?: readonly FrontierToolPatchTemplateInput[];
  effects?: readonly string[];
  expectedPatchMatched?: boolean;
  causeId?: string;
  parentId?: string;
  error?: string;
  metadata?: unknown;
}

export interface FrontierToolRecord {
  kind: typeof FRONTIER_TOOLS_RECORD_KIND;
  version: typeof FRONTIER_TOOLS_RECORD_VERSION;
  id: string;
  actionId: string;
  planId: string;
  status: FrontierToolExecutionStatus;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  causeId?: string;
  parentId?: string;
  input: JsonObject;
  output?: JsonValue;
  patches: FrontierToolPatchTemplate[];
  expectedPatch: FrontierToolPatchTemplate[];
  expectedPatchMatched: boolean;
  effects: string[];
  reads: string[];
  writes: string[];
  policyDecision?: FrontierToolsPolicyDecision;
  error?: string;
  metadata?: JsonObject;
}

export interface FrontierToolsSession {
  kind: typeof FRONTIER_TOOLS_SESSION_KIND;
  version: typeof FRONTIER_TOOLS_SESSION_VERSION;
  id: string;
  startedAt: number;
  endedAt?: number;
  records: FrontierToolRecord[];
  summary: FrontierToolsSessionSummary;
  metadata?: JsonObject;
}

export interface FrontierToolsSessionSummary {
  recordCount: number;
  okCount: number;
  dryRunCount: number;
  blockedCount: number;
  invalidCount: number;
  errorCount: number;
  actionIds: string[];
}

export interface FrontierToolsQueryInput {
  ids?: readonly string[];
  features?: readonly string[];
  packages?: readonly string[];
  owners?: readonly string[];
  reads?: readonly string[];
  writes?: readonly string[];
  effects?: readonly string[];
  capabilities?: readonly string[];
  routes?: readonly string[];
  tags?: readonly string[];
}

export interface FrontierToolsQueryResult {
  kind: typeof FRONTIER_TOOLS_QUERY_KIND;
  version: typeof FRONTIER_TOOLS_QUERY_VERSION;
  ids: string[];
  actions: FrontierToolAction[];
  reads: string[];
  writes: string[];
  effects: string[];
  capabilities: string[];
  routes: string[];
}

export interface FrontierToolDescriptorOptions {
  format?: FrontierToolDescriptorFormat;
  namespace?: string;
  strict?: boolean;
  includeFrontierMetadata?: boolean;
}

export interface FrontierToolDescriptor {
  id: string;
  name: string;
  title: string;
  description?: string;
  format: FrontierToolDescriptorFormat;
  capability?: string;
  risk: FrontierToolRisk;
  inputSchema: FrontierToolJsonSchema;
  reads: string[];
  writes: string[];
  producedArtifacts: FrontierToolArtifact[];
  effects: string[];
  requires: string[];
  requiresApproval: boolean;
  dryRun: boolean;
  raw: JsonObject;
}

export interface FrontierToolsImpact extends Omit<FrontierRegistryImpact, 'kind' | 'version'> {
  kind: typeof FRONTIER_TOOLS_IMPACT_KIND;
  version: typeof FRONTIER_TOOLS_IMPACT_VERSION;
  actionIds: string[];
}

export interface FrontierToolsProof {
  kind: typeof FRONTIER_TOOLS_PROOF_KIND;
  version: typeof FRONTIER_TOOLS_PROOF_VERSION;
  id: string;
  hash: string;
  actionCount: number;
  capabilityCount: number;
  routeCount: number;
}

export interface FrontierToolsCompiler {
  readonly manifest: FrontierToolsManifest;
  get(id: string): FrontierToolAction | undefined;
  query(input?: FrontierToolsQueryInput): FrontierToolsQueryResult;
  list(context?: FrontierToolsContext, options?: FrontierToolsPlanOptions): FrontierToolAction[];
  descriptors(context?: FrontierToolsContext, options?: FrontierToolsPlanOptions & FrontierToolDescriptorOptions): FrontierToolDescriptor[];
  plan(request: string | FrontierToolActionRequest, context?: FrontierToolsContext, options?: FrontierToolsPlanOptions): FrontierToolsPlan;
  planAsync(request: string | FrontierToolActionRequest, context?: FrontierToolsContext, options?: FrontierToolsPlanOptions): Promise<FrontierToolsPlan>;
}

const hasOwn = Object.prototype.hasOwnProperty;
const toolsGraphCache = new WeakMap<FrontierToolsManifest, FrontierRegistryGraph>();

export function createToolsManifest(input: FrontierToolsManifestInput = {}): FrontierToolsManifest {
  const seen = new Set<string>();
  const actions = (input.actions ?? []).map((action, index) => normalizeToolAction(action, index));
  for (const action of actions) {
    if (seen.has(action.id)) throw new Error('duplicate tool action id: ' + action.id);
    seen.add(action.id);
  }
  actions.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const producedArtifacts = actions.flatMap((action) => action.producedArtifacts.flatMap((artifact) => artifact.path === undefined ? [] : [artifact.path]));
  const resources = sortedUnique((input.resources ?? []).concat(...actions.map((action) => action.reads), ...actions.map((action) => action.writes), ...producedArtifacts, ...actions.map((action) => action.policyResources)));
  const capabilities = sortedUnique((input.capabilities ?? []).concat(...actions.map((action) => action.requires)));
  const effects = sortedUnique((input.effects ?? []).concat(...actions.map((action) => action.effects)));
  const routes = sortedUnique((input.routes ?? []).concat(...actions.map((action) => action.routes)));
  return {
    kind: FRONTIER_TOOLS_MANIFEST_KIND,
    version: FRONTIER_TOOLS_MANIFEST_VERSION,
    id: input.id === undefined ? 'tools' : readString(input.id, 'tools manifest id'),
    title: optionalString(input.title, 'tools manifest title'),
    package: optionalString(input.package, 'tools manifest package'),
    feature: optionalString(input.feature, 'tools manifest feature'),
    owner: optionalString(input.owner, 'tools manifest owner'),
    actions,
    resources,
    capabilities,
    effects,
    routes,
    tags: uniqueStrings(input.tags ?? []),
    source: input.source,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'tools manifest metadata'),
    summary: {
      actionCount: actions.length,
      readCount: sortedUnique(actions.flatMap((action) => action.reads)).length,
      writeCount: sortedUnique(actions.flatMap((action) => action.writes)).length,
      effectCount: effects.length,
      capabilityCount: capabilities.length,
      routeCount: routes.length,
      dryRunCount: actions.filter((action) => action.dryRun).length,
      rollbackCount: actions.filter((action) => action.rollback !== undefined).length,
      approvalCount: actions.filter((action) => action.approval?.required === true).length
    }
  };
}

export function defineToolAction(input: FrontierToolActionInput): FrontierToolAction {
  return normalizeToolAction(input, 0);
}

export function defineTools(input: FrontierToolsManifestInput = {}): FrontierToolsManifest {
  return createToolsManifest(input);
}

export function createAgentTaskDescriptor(input: FrontierAgentTaskDescriptorInput): FrontierAgentTaskDescriptor {
  if (!isObject(input)) throw new TypeError('agent task descriptor must be an object');
  const id = readString(input.id, 'agent task id');
  if (id.length === 0) throw new TypeError('agent task id must not be empty');
  const capability = readString(input.capability, 'agent task capability');
  if (capability.length === 0) throw new TypeError('agent task capability must not be empty');
  const reads = uniqueStrings(input.reads ?? []);
  const writes = uniqueStrings(input.writes ?? []);
  return {
    kind: FRONTIER_AGENT_TASK_DESCRIPTOR_KIND,
    version: FRONTIER_AGENT_TASK_DESCRIPTOR_VERSION,
    id,
    capability,
    title: input.title === undefined ? titleFromId(id) : readString(input.title, 'agent task title'),
    description: optionalString(input.description, 'agent task description'),
    reads,
    writes,
    expectedArtifacts: (input.expectedArtifacts ?? []).map((artifact, index) => normalizeAgentTaskArtifact(artifact, index)),
    safetyPolicy: normalizeAgentTaskSafetyPolicy(input.safetyPolicy, id, capability, reads, writes),
    status: input.status === undefined ? 'planned' : readString(input.status, 'agent task status'),
    owner: optionalString(input.owner, 'agent task owner'),
    package: optionalString(input.package, 'agent task package'),
    feature: optionalString(input.feature, 'agent task feature'),
    tags: uniqueStrings(input.tags ?? []),
    source: input.source === undefined ? undefined : input.source,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'agent task metadata')
  };
}

export function defineAgentTaskDescriptor(input: FrontierAgentTaskDescriptorInput): FrontierAgentTaskDescriptor {
  return createAgentTaskDescriptor(input);
}

export interface FrontierCoordinatorActionRegistryInput {
  id?: string;
  title?: string;
  package?: string;
  feature?: string;
  owner?: string;
  artifactRoot?: string;
  metadata?: unknown;
}

export const FRONTIER_COORDINATOR_ACTION_REGISTRY_ID = 'frontier.tools.coordinator-actions';
export const FRONTIER_COORDINATOR_ACTION_IDS = [
  'coordinator.inspect-queue',
  'coordinator.lease-scope',
  'coordinator.apply-bundle',
  'coordinator.rerun-task',
  'coordinator.record-decision',
  'coordinator.answer-question',
  'coordinator.refill-queue'
] as const;

export function createCoordinatorActionDescriptors(input: FrontierCoordinatorActionRegistryInput = {}): FrontierToolActionInput[] {
  const artifactRoot = input.artifactRoot === undefined ? 'coordinator' : readString(input.artifactRoot, 'coordinator artifact root');
  const owner = optionalString(input.owner, 'coordinator action owner');
  const packageName = optionalString(input.package, 'coordinator action package');
  const feature = optionalString(input.feature, 'coordinator action feature');

  return [
    {
      id: 'coordinator.inspect-queue',
      title: 'Inspect queue',
      description: 'Inspect coordinator queue scopes, bundles, and decisions before classifying work.',
      capability: 'coordinator.queue.inspect',
      risk: 'low',
      input: {
        queueId: { type: 'string', minLength: 1 },
        scope: { type: 'string', required: false },
        limit: { type: 'integer', required: false, minimum: 0 },
        includeChildren: { type: 'boolean', required: false },
        includeLeases: { type: 'boolean', required: false },
        includeBundles: { type: 'boolean', required: false },
        includeDecisions: { type: 'boolean', required: false }
      },
      reads: ['queue:items', 'queue:leases', 'queue:bundles', 'queue:decisions', 'queue:questions'],
      writes: [
        artifactRoot + '/inspect-queue.json',
        artifactRoot + '/inspect-queue.jsonl'
      ],
      producedArtifacts: [
        { kind: 'report', path: artifactRoot + '/inspect-queue.json', required: true },
        { kind: 'log', path: artifactRoot + '/inspect-queue.jsonl', required: true }
      ],
      requires: ['coordinator.queue.inspect'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'queue', 'inspect']
    },
    {
      id: 'coordinator.lease-scope',
      title: 'Lease scope',
      description: 'Lease a queue scope so one local coordinator can serialize the decision lane.',
      capability: 'coordinator.queue.lease',
      risk: 'medium',
      input: {
        queueId: { type: 'string', minLength: 1 },
        leaseKey: { type: 'string', minLength: 1 },
        scope: { type: 'string', minLength: 1 },
        owner: { type: 'string', required: false },
        ttlMs: { type: 'integer', required: false, minimum: 0 },
        strict: { type: 'boolean', required: false }
      },
      reads: ['queue:items', 'queue:leases', 'queue:scopes', 'queue:bundles'],
      writes: [
        'queue:leases/:leaseKey',
        artifactRoot + '/lease-scope.json'
      ],
      producedArtifacts: [
        { kind: 'lease', path: 'queue:leases/:leaseKey', required: true },
        { kind: 'report', path: artifactRoot + '/lease-scope.json', required: true }
      ],
      requires: ['coordinator.queue.lease'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'lease', 'scope']
    },
    {
      id: 'coordinator.apply-bundle',
      title: 'Apply bundle',
      description: 'Apply an admitted bundle, record the decision, and preserve the evidence trail.',
      capability: 'coordinator.bundle.apply',
      risk: 'high',
      input: {
        bundleId: { type: 'string', minLength: 1 },
        queueItemId: { type: 'string', required: false },
        leaseKey: { type: 'string', required: false },
        scope: { type: 'string', required: false },
        targetRef: { type: 'string', required: false },
        dryRunOnly: { type: 'boolean', required: false },
        requiredGates: { type: 'array', required: false, items: { type: 'string' } }
      },
      reads: ['queue:leases', 'queue:bundles', 'bundle:patches', 'bundle:verification', 'queue:decisions'],
      writes: [
        'decision:ledger',
        'bundle:changes',
        artifactRoot + '/apply-bundle.json',
        artifactRoot + '/decision-ledger.jsonl'
      ],
      producedArtifacts: [
        { kind: 'decision', path: artifactRoot + '/apply-bundle.json', required: true },
        { kind: 'log', path: artifactRoot + '/decision-ledger.jsonl', required: true },
        { kind: 'patch', path: 'bundle:changes', required: false }
      ],
      requires: ['coordinator.bundle.apply'],
      approval: {
        required: true,
        reason: 'bundle application mutates queue-owned state'
      },
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'apply', 'bundle']
    },
    {
      id: 'coordinator.rerun-task',
      title: 'Rerun task',
      description: 'Create a fresh task from stale or incomplete coordinator evidence.',
      capability: 'coordinator.task.rerun',
      risk: 'medium',
      input: {
        taskId: { type: 'string', minLength: 1 },
        queueItemId: { type: 'string', required: false },
        sourceBundleId: { type: 'string', required: false },
        scope: { type: 'string', required: false },
        reason: { type: 'string', required: false },
        refreshEvidence: { type: 'boolean', required: false }
      },
      reads: ['queue:items', 'queue:bundles', 'queue:decisions', 'queue:evidence'],
      writes: [
        'queue:tasks',
        artifactRoot + '/rerun-task.json',
        artifactRoot + '/rerun-manifest.json'
      ],
      producedArtifacts: [
        { kind: 'task', path: artifactRoot + '/rerun-task.json', required: true },
        { kind: 'manifest', path: artifactRoot + '/rerun-manifest.json', required: true }
      ],
      requires: ['coordinator.task.rerun'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'rerun', 'task']
    },
    {
      id: 'coordinator.record-decision',
      title: 'Record decision',
      description: 'Record a terminal coordinator decision and attach the decision evidence.',
      capability: 'coordinator.decision.record',
      risk: 'medium',
      input: {
        decisionId: { type: 'string', minLength: 1 },
        queueItemId: { type: 'string', required: false },
        bundleId: { type: 'string', required: false },
        scope: { type: 'string', required: false },
        status: { type: 'string', minLength: 1 },
        reason: { type: 'string', required: false },
        note: { type: 'string', required: false }
      },
      reads: ['queue:items', 'queue:decisions', 'queue:bundles', 'queue:evidence'],
      writes: [
        'decision:ledger',
        artifactRoot + '/record-decision.json'
      ],
      producedArtifacts: [
        { kind: 'decision', path: artifactRoot + '/record-decision.json', required: true }
      ],
      requires: ['coordinator.decision.record'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'decision', 'record']
    },
    {
      id: 'coordinator.answer-question',
      title: 'Answer question',
      description: 'Answer a structured coordinator question and route the response back to the queue.',
      capability: 'coordinator.question.answer',
      risk: 'low',
      input: {
        questionId: { type: 'string', minLength: 1 },
        answerCode: { type: 'string', minLength: 1 },
        answer: { type: 'string', required: false },
        decisionId: { type: 'string', required: false },
        queueItemId: { type: 'string', required: false },
        taskId: { type: 'string', required: false },
        evidencePaths: { type: 'array', required: false, items: { type: 'string' } }
      },
      reads: ['queue:questions', 'queue:decisions', 'queue:answers'],
      writes: [
        'queue:answers',
        'queue:questions',
        artifactRoot + '/answer-question.json',
        artifactRoot + '/human-answer-routing.json'
      ],
      producedArtifacts: [
        { kind: 'answer', path: artifactRoot + '/answer-question.json', required: true },
        { kind: 'routing', path: artifactRoot + '/human-answer-routing.json', required: true }
      ],
      requires: ['coordinator.question.answer'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'question', 'answer']
    },
    {
      id: 'coordinator.refill-queue',
      title: 'Refill queue',
      description: 'Refill a coordinator queue with fresh work, follow-ups, or promoted items.',
      capability: 'coordinator.queue.refill',
      risk: 'medium',
      input: {
        queueId: { type: 'string', minLength: 1 },
        scope: { type: 'string', required: false },
        targetCount: { type: 'integer', required: false, minimum: 0 },
        source: { type: 'string', required: false },
        priorityFloor: { type: 'number', required: false },
        includePromoted: { type: 'boolean', required: false }
      },
      reads: ['queue:items', 'queue:leases', 'queue:bundles', 'queue:decisions', 'queue:promotions'],
      writes: [
        'queue:items',
        artifactRoot + '/refill-queue.json',
        artifactRoot + '/queue-refill.jsonl'
      ],
      producedArtifacts: [
        { kind: 'manifest', path: artifactRoot + '/refill-queue.json', required: true },
        { kind: 'log', path: artifactRoot + '/queue-refill.jsonl', required: true }
      ],
      requires: ['coordinator.queue.refill'],
      dryRun: true,
      owner,
      package: packageName,
      feature,
      tags: ['coordinator', 'queue', 'refill']
    }
  ];
}

export function createCoordinatorActionManifest(input: FrontierCoordinatorActionRegistryInput = {}): FrontierToolsManifest {
  return createToolsManifest({
    id: input.id ?? FRONTIER_COORDINATOR_ACTION_REGISTRY_ID,
    title: input.title ?? 'Coordinator actions',
    package: input.package,
    feature: input.feature,
    owner: input.owner,
    actions: createCoordinatorActionDescriptors(input),
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'coordinator action registry metadata')
  });
}

export function defineCoordinatorActions(input: FrontierCoordinatorActionRegistryInput = {}): FrontierToolsManifest {
  return createCoordinatorActionManifest(input);
}

export function compileTools(
  manifestOrInput: FrontierToolsManifest | FrontierToolsManifestInput | readonly FrontierToolActionInput[]
): FrontierToolsCompiler {
  const manifest = isToolsManifest(manifestOrInput)
    ? manifestOrInput
    : isActionInputArray(manifestOrInput)
      ? createToolsManifest({ actions: manifestOrInput })
      : createToolsManifest(manifestOrInput as FrontierToolsManifestInput);
  const byId = new Map<string, FrontierToolAction>();
  for (const action of manifest.actions) byId.set(action.id, action);
  return {
    manifest,
    get(id) {
      return byId.get(id);
    },
    query(input = {}) {
      return queryToolsManifest(manifest, input);
    },
    list(context = {}, options = {}) {
      return listAvailableTools(this, context, options);
    },
    descriptors(context = {}, options = {}) {
      return createToolDescriptors(this, context, options);
    },
    plan(request, context = {}, options = {}) {
      return planToolAction(this, request, context, options);
    },
    planAsync(request, context = {}, options = {}) {
      return planToolActionAsync(this, request, context, options);
    }
  };
}

export function queryToolsManifest(
  manifest: FrontierToolsManifest,
  query: FrontierToolsQueryInput = {}
): FrontierToolsQueryResult {
  const ids = new Set(query.ids ?? []);
  const features = new Set(query.features ?? []);
  const packages = new Set(query.packages ?? []);
  const owners = new Set(query.owners ?? []);
  const reads = new Set(query.reads ?? []);
  const writes = new Set(query.writes ?? []);
  const effects = new Set(query.effects ?? []);
  const capabilities = new Set(query.capabilities ?? []);
  const routes = new Set(query.routes ?? []);
  const tags = new Set(query.tags ?? []);
  const hasFilter = ids.size + features.size + packages.size + owners.size + reads.size + writes.size + effects.size + capabilities.size + routes.size + tags.size > 0;
  const actions = hasFilter ? manifest.actions.filter((action) => {
    if (ids.has(action.id)) return true;
    if (action.feature !== undefined && features.has(action.feature)) return true;
    if (action.package !== undefined && packages.has(action.package)) return true;
    if (action.owner !== undefined && owners.has(action.owner)) return true;
    if (intersectsSet(action.reads, reads)) return true;
    if (intersectsSet(action.writes, writes)) return true;
    if (intersectsSet(action.effects, effects)) return true;
    if (intersectsSet(action.requires, capabilities)) return true;
    if (intersectsSet(action.routes, routes)) return true;
    if (intersectsSet(action.tags, tags)) return true;
    return false;
  }) : manifest.actions.slice();
  return {
    kind: FRONTIER_TOOLS_QUERY_KIND,
    version: FRONTIER_TOOLS_QUERY_VERSION,
    ids: actions.map((action) => action.id),
    actions,
    reads: sortedUnique(actions.flatMap((action) => action.reads)),
    writes: sortedUnique(actions.flatMap((action) => action.writes)),
    effects: sortedUnique(actions.flatMap((action) => action.effects)),
    capabilities: sortedUnique(actions.flatMap((action) => action.requires)),
    routes: sortedUnique(actions.flatMap((action) => action.routes))
  };
}

export function listAvailableTools(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  context: FrontierToolsContext = {},
  options: FrontierToolsPlanOptions = {}
): FrontierToolAction[] {
  const manifest = isToolsCompiler(manifestOrCompiler) ? manifestOrCompiler.manifest : manifestOrCompiler;
  const out: FrontierToolAction[] = [];
  for (const action of manifest.actions) {
    const availability = evaluateAvailabilitySync(action, normalizeContext(context), normalizeInput({}, 'tool input'), options);
    if (availability.available) out[out.length] = action;
  }
  return out;
}

export function validateToolInput(actionOrSchema: FrontierToolAction | FrontierToolJsonSchema, input: unknown): FrontierToolsValidationResult {
  const schema = isToolAction(actionOrSchema) ? actionOrSchema.inputSchema : actionOrSchema;
  const normalized = normalizeInput(input, 'tool input');
  const errors: FrontierToolsValidationError[] = [];
  validateAgainstSchema(schema, normalized, '', errors);
  return {
    kind: FRONTIER_TOOLS_VALIDATION_KIND,
    version: FRONTIER_TOOLS_VALIDATION_VERSION,
    valid: errors.length === 0,
    input: normalized,
    errors
  };
}

export function createToolDescriptor(
  action: FrontierToolAction,
  options: FrontierToolDescriptorOptions = {}
): FrontierToolDescriptor {
  const format = options.format ?? 'frontier';
  const name = toToolName(action.id, options.namespace);
  const description = action.description ?? action.title;
  const requiresApproval = action.approval?.required === true;
  let raw: JsonObject;
  if (format === 'openai') {
    const fn: JsonObject = {
      name,
      description,
      parameters: action.inputSchema
    };
    if (options.strict !== undefined) fn.strict = options.strict;
    raw = { type: 'function', function: fn };
  } else if (format === 'mcp') {
    raw = {
      name,
      title: action.title,
      description,
      inputSchema: action.inputSchema,
      annotations: {
        readOnlyHint: action.writes.length === 0 && action.effects.length === 0,
        destructiveHint: action.writes.length !== 0 || action.effects.length !== 0,
        idempotentHint: action.expectedPatch.length !== 0,
        openWorldHint: action.effects.length !== 0
      } as unknown as JsonValue
    };
  } else if (format === 'vercel') {
    raw = {
      type: 'function',
      name,
      description,
      inputSchema: action.inputSchema
    };
    if (options.strict !== undefined) raw.strict = options.strict;
  } else if (format === 'langchain') {
    raw = {
      name,
      description,
      schema: action.inputSchema,
      metadata: createDescriptorMetadata(action) as unknown as JsonValue
    };
  } else {
    raw = {
      id: action.id,
      name,
      title: action.title,
      description,
      inputSchema: action.inputSchema,
      reads: action.reads as unknown as JsonValue,
      writes: action.writes as unknown as JsonValue,
      producedArtifacts: action.producedArtifacts as unknown as JsonValue,
      effects: action.effects as unknown as JsonValue,
      requires: action.requires as unknown as JsonValue,
      dryRun: action.dryRun,
      requiresApproval
    };
    if (action.capability !== undefined) raw.capability = action.capability;
    if (action.risk !== undefined) raw.risk = action.risk;
  }
  if (options.includeFrontierMetadata === true && format !== 'frontier') {
    raw.frontier = createDescriptorMetadata(action) as unknown as JsonValue;
  }
  return {
    id: action.id,
    name,
    title: action.title,
    description: action.description,
    format,
    capability: action.capability,
    risk: action.risk,
    inputSchema: action.inputSchema,
    reads: action.reads.slice(),
    writes: action.writes.slice(),
    producedArtifacts: action.producedArtifacts.slice(),
    effects: action.effects.slice(),
    requires: action.requires.slice(),
    requiresApproval,
    dryRun: action.dryRun,
    raw
  };
}

export function createToolDescriptors(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  context: FrontierToolsContext = {},
  options: FrontierToolsPlanOptions & FrontierToolDescriptorOptions = {}
): FrontierToolDescriptor[] {
  return listAvailableTools(manifestOrCompiler, context, options).map((action) => createToolDescriptor(action, options));
}

export function planToolAction(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  request: string | FrontierToolActionRequest,
  context: FrontierToolsContext = {},
  options: FrontierToolsPlanOptions = {}
): FrontierToolsPlan {
  const manifest = isToolsCompiler(manifestOrCompiler) ? manifestOrCompiler.manifest : manifestOrCompiler;
  const action = requireAction(manifest, requestActionId(request));
  const input = normalizeInput(typeof request === 'string' ? {} : request.input ?? {}, 'tool action input');
  const validation = validateToolInput(action, input);
  const availability = evaluateAvailabilitySync(action, normalizeContext(context), input, options);
  return createPlan(action, request, input, validation, availability, options.now ?? Date.now());
}

export async function planToolActionAsync(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  request: string | FrontierToolActionRequest,
  context: FrontierToolsContext = {},
  options: FrontierToolsPlanOptions = {}
): Promise<FrontierToolsPlan> {
  const manifest = isToolsCompiler(manifestOrCompiler) ? manifestOrCompiler.manifest : manifestOrCompiler;
  const action = requireAction(manifest, requestActionId(request));
  const input = normalizeInput(typeof request === 'string' ? {} : request.input ?? {}, 'tool action input');
  const validation = validateToolInput(action, input);
  const availability = await evaluateAvailabilityAsync(action, normalizeContext(context), input, options);
  return createPlan(action, request, input, validation, availability, options.now ?? Date.now());
}

export function executeToolAction(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  request: string | FrontierToolActionRequest,
  options: FrontierToolExecuteOptions = {}
): FrontierToolRecord {
  const startedAt = options.now ?? Date.now();
  const context = options.context ?? {};
  const plan = planToolAction(manifestOrCompiler, request, context, options);
  if (!plan.valid) return createToolRecord({ plan, status: 'invalid', startedAt, endedAt: startedAt, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  if (!plan.available) return createToolRecord({ plan, status: 'blocked', startedAt, endedAt: startedAt, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  if (plan.dryRun) return createToolRecord({ plan, status: 'dry-run', startedAt, endedAt: startedAt, patches: plan.expectedPatch, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  const action = requireAction(isToolsCompiler(manifestOrCompiler) ? manifestOrCompiler.manifest : manifestOrCompiler, plan.actionId);
  const handler = options.handlers?.[action.id];
  if (handler === undefined) return createToolRecord({ plan, status: 'planned', startedAt, endedAt: startedAt, patches: plan.expectedPatch, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  try {
    const result = handler({ action, plan, input: plan.input, context });
    if (isPromiseLike(result)) throw new Error('executeToolAction() received an async handler; use executeToolActionAsync()');
    const normalized = normalizeHandlerResult(result);
    const endedAt = Date.now();
    return createToolRecord({
      plan,
      status: 'ok',
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      output: normalized.output,
      patches: normalized.patches,
      effects: normalized.effects,
      expectedPatchMatched: patchesMatch(plan.expectedPatch, normalizePatches(normalized.patches ?? [])),
      causeId: readRequestCause(request),
      parentId: readRequestParent(request),
      metadata: normalized.metadata
    });
  } catch (error) {
    const endedAt = Date.now();
    return createToolRecord({
      plan,
      status: 'error',
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      causeId: readRequestCause(request),
      parentId: readRequestParent(request),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function executeToolActionAsync(
  manifestOrCompiler: FrontierToolsManifest | FrontierToolsCompiler,
  request: string | FrontierToolActionRequest,
  options: FrontierToolExecuteOptions = {}
): Promise<FrontierToolRecord> {
  const startedAt = options.now ?? Date.now();
  const context = options.context ?? {};
  const plan = await planToolActionAsync(manifestOrCompiler, request, context, options);
  if (!plan.valid) return createToolRecord({ plan, status: 'invalid', startedAt, endedAt: startedAt, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  if (!plan.available) return createToolRecord({ plan, status: 'blocked', startedAt, endedAt: startedAt, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  if (plan.dryRun) return createToolRecord({ plan, status: 'dry-run', startedAt, endedAt: startedAt, patches: plan.expectedPatch, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  const action = requireAction(isToolsCompiler(manifestOrCompiler) ? manifestOrCompiler.manifest : manifestOrCompiler, plan.actionId);
  const handler = options.handlers?.[action.id];
  if (handler === undefined) return createToolRecord({ plan, status: 'planned', startedAt, endedAt: startedAt, patches: plan.expectedPatch, causeId: readRequestCause(request), parentId: readRequestParent(request) });
  try {
    const result = await handler({ action, plan, input: plan.input, context });
    const normalized = normalizeHandlerResult(result);
    const endedAt = Date.now();
    return createToolRecord({
      plan,
      status: 'ok',
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      output: normalized.output,
      patches: normalized.patches,
      effects: normalized.effects,
      expectedPatchMatched: patchesMatch(plan.expectedPatch, normalizePatches(normalized.patches ?? [])),
      causeId: readRequestCause(request),
      parentId: readRequestParent(request),
      metadata: normalized.metadata
    });
  } catch (error) {
    const endedAt = Date.now();
    return createToolRecord({
      plan,
      status: 'error',
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      causeId: readRequestCause(request),
      parentId: readRequestParent(request),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export function createToolRecord(input: FrontierToolRecordInput): FrontierToolRecord {
  const patches = input.patches === undefined ? [] : normalizePatches(input.patches);
  const expectedPatchMatched = input.expectedPatchMatched ?? patchesMatch(input.plan.expectedPatch, patches);
  return {
    kind: FRONTIER_TOOLS_RECORD_KIND,
    version: FRONTIER_TOOLS_RECORD_VERSION,
    id: input.id ?? 'tool:' + input.plan.actionId + ':' + hashStable([input.plan.id, input.status ?? 'ok', input.output ?? null, patches]),
    actionId: input.plan.actionId,
    planId: input.plan.id,
    status: input.status ?? 'ok',
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationMs: input.durationMs,
    causeId: input.causeId,
    parentId: input.parentId,
    input: input.plan.input,
    output: input.output === undefined ? undefined : toJsonValue(input.output, 'tool record output'),
    patches,
    expectedPatch: input.plan.expectedPatch,
    expectedPatchMatched,
    effects: uniqueStrings((input.effects ?? []).concat(input.plan.effects)),
    reads: input.plan.reads,
    writes: input.plan.writes,
    policyDecision: input.plan.policyDecision,
    error: input.error,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'tool record metadata')
  };
}

export function createToolsSession(input: { id?: string; startedAt?: number; records?: readonly FrontierToolRecord[]; metadata?: unknown } = {}): FrontierToolsSession {
  const records = (input.records ?? []).slice();
  return {
    kind: FRONTIER_TOOLS_SESSION_KIND,
    version: FRONTIER_TOOLS_SESSION_VERSION,
    id: input.id ?? 'tools-session:' + hashStable([input.startedAt ?? 0, records.map((record) => record.id)]),
    startedAt: input.startedAt ?? Date.now(),
    records,
    summary: summarizeSession(records),
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'tool session metadata')
  };
}

export function appendToolSessionRecord(session: FrontierToolsSession, record: FrontierToolRecord, endedAt?: number): FrontierToolsSession {
  const records = session.records.concat(record);
  return {
    ...session,
    endedAt,
    records,
    summary: summarizeSession(records)
  };
}

export function createToolsRegistryGraph(
  manifest: FrontierToolsManifest,
  input: { package?: string; feature?: string; owner?: string; generatedAt?: number; metadata?: unknown } = {}
): FrontierRegistryGraph {
    const entries: FrontierRegistryEntry[] = [{
      id: manifest.id,
      kind: 'tools-manifest',
      package: input.package ?? manifest.package,
    feature: input.feature ?? manifest.feature,
    owner: input.owner ?? manifest.owner,
    source: manifest.source,
    touches: manifest.resources,
    consumes: manifest.capabilities,
    produces: manifest.effects,
    tags: manifest.tags,
    metadata: {
      actionCount: manifest.summary.actionCount,
      dryRunCount: manifest.summary.dryRunCount,
      rollbackCount: manifest.summary.rollbackCount
    }
  }];
  const edges: FrontierRegistryEdge[] = [];
  for (const action of manifest.actions) {
    entries[entries.length] = {
      id: action.id,
      kind: 'tool-action',
      package: action.package ?? input.package ?? manifest.package,
      feature: action.feature ?? input.feature ?? manifest.feature,
      owner: action.owner ?? input.owner ?? manifest.owner,
      source: action.source,
      touches: action.reads.concat(action.writes, action.producedArtifacts.flatMap((artifact) => artifact.path === undefined ? [] : [artifact.path])),
      consumes: action.requires.concat(action.reads),
      produces: action.writes.concat(action.producedArtifacts.flatMap((artifact) => artifact.path === undefined ? [] : [artifact.path]), action.effects),
      tags: action.tags,
      metadata: {
        title: action.title,
        dryRun: action.dryRun,
        requiresApproval: action.approval?.required === true,
        expectedPatchCount: action.expectedPatch.length,
        producedArtifactCount: action.producedArtifacts.length
      } as JsonObject
    };
    if (action.capability !== undefined) entries[entries.length - 1].metadata!.capability = action.capability;
    if (action.risk !== undefined) entries[entries.length - 1].metadata!.risk = action.risk;
    edges[edges.length] = { from: manifest.id, to: action.id, kind: 'contains' };
    for (const capability of action.requires) edges[edges.length] = { from: action.id, to: 'capability:' + capability, kind: 'depends-on' };
    for (const read of action.reads) edges[edges.length] = { from: action.id, to: read, kind: 'reads' };
    for (const write of action.writes) edges[edges.length] = { from: action.id, to: write, kind: 'writes' };
    for (const effect of action.effects) edges[edges.length] = { from: action.id, to: effect, kind: 'effects' };
    for (const route of action.routes) edges[edges.length] = { from: action.id, to: 'route:' + route, kind: 'available-on' };
    if (action.rollback !== undefined) edges[edges.length] = { from: action.id, to: action.rollback.action, kind: 'rollback' };
  }
  return createFrontierRegistryGraph({
    entries,
    edges,
    generatedAt: input.generatedAt,
    metadata: input.metadata === undefined ? manifest.metadata : readJsonObject(input.metadata, 'tools registry metadata')
  });
}

export function traceToolsImpact(
  manifest: FrontierToolsManifest,
  input: FrontierRegistryImpactInput
): FrontierToolsImpact {
  let graph = toolsGraphCache.get(manifest);
  if (graph === undefined) {
    graph = createToolsRegistryGraph(manifest);
    toolsGraphCache.set(manifest, graph);
  }
  const impact = frontierToolsRegistryImpact(graph, input);
  const nodeSet = new Set(impact.nodes);
  const actionIds = manifest.actions
    .filter((action) => nodeSet.has(action.id) || nodeSet.has('entry:' + action.id) || nodeSet.has('node:' + action.id))
    .map((action) => action.id);
  return {
    ...impact,
    kind: FRONTIER_TOOLS_IMPACT_KIND,
    version: FRONTIER_TOOLS_IMPACT_VERSION,
    actionIds
  };
}

function frontierToolsRegistryImpact(
  graph: FrontierRegistryGraph,
  input: FrontierRegistryImpactInput
): FrontierRegistryImpact {
  const seeds = normalizeImpactSeeds(input);
  const seedSet = new Set(seeds);
  const visited = new Set<string>(seeds);
  const queue = seeds.slice();
  const direction = input.direction ?? 'both';
  const forward = new Map<string, string[]>();
  const reverse = new Map<string, string[]>();

  for (const edge of graph.edges) {
    appendAdjacency(forward, edge.from, edge.to);
    appendAdjacency(reverse, edge.to, edge.from);
  }

  for (const path of input.paths ?? []) {
    const normalized = normalizeFrontierRegistryPath(path);
    for (const edge of graph.edges) {
      if (edge.to.startsWith('path:') && registryPathsOverlap(edge.to.slice(5), normalized)) {
        enqueue(edge.to, visited, queue);
        enqueue(edge.from, visited, queue);
      }
      if (edge.from.startsWith('path:') && registryPathsOverlap(edge.from.slice(5), normalized)) {
        enqueue(edge.from, visited, queue);
        enqueue(edge.to, visited, queue);
      }
    }
  }

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const node = queue[cursor];
    if (direction === 'forward' || direction === 'both') {
      for (const next of forward.get(node) ?? []) enqueue(next, visited, queue);
    }
    if (direction === 'reverse' || direction === 'both') {
      for (const next of reverse.get(node) ?? []) enqueue(next, visited, queue);
    }
  }

  const nodes = Array.from(visited).sort();
  const impacted = new Set(nodes);
  return {
    kind: 'frontier.registry.impact',
    version: 1,
    seeds: Array.from(seedSet).sort(),
    nodes,
    entries: graph.entries.filter((entry) => impacted.has('entry:' + entry.id)),
    records: graph.records.filter((record) => impacted.has('record:' + record.id)),
    edges: graph.edges.filter((edge) => impacted.has(edge.from) || impacted.has(edge.to))
  };
}

export function encodeToolsJsonl(value: FrontierToolsManifest | FrontierToolsPlan | FrontierToolRecord | FrontierToolsSession | readonly (FrontierToolsPlan | FrontierToolRecord)[]): string {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item) => JSON.stringify(item)).join('\n') + (items.length === 0 ? '' : '\n');
}

export function decodeToolsJsonl(text: string): Array<FrontierToolsManifest | FrontierToolsPlan | FrontierToolRecord | FrontierToolsSession> {
  const out: Array<FrontierToolsManifest | FrontierToolsPlan | FrontierToolRecord | FrontierToolsSession> = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    out[out.length] = JSON.parse(line) as FrontierToolsManifest | FrontierToolsPlan | FrontierToolRecord | FrontierToolsSession;
  }
  return out;
}

export function redactToolsManifest(
  manifest: FrontierToolsManifest,
  options: { redactKeys?: readonly string[] } = {}
): FrontierToolsManifest {
  const keys = new Set((options.redactKeys ?? ['token', 'secret', 'authorization', 'password', 'apiKey']).map((key) => key.toLowerCase()));
  return redactObject(manifest, keys) as FrontierToolsManifest;
}

export function createToolsProof(manifest: FrontierToolsManifest): FrontierToolsProof {
  return {
    kind: FRONTIER_TOOLS_PROOF_KIND,
    version: FRONTIER_TOOLS_PROOF_VERSION,
    id: manifest.id,
    hash: hashStable(redactToolsManifest(manifest)),
    actionCount: manifest.summary.actionCount,
    capabilityCount: manifest.summary.capabilityCount,
    routeCount: manifest.summary.routeCount
  };
}

function normalizeToolAction(input: FrontierToolActionInput, index: number): FrontierToolAction {
  if (!isObject(input)) throw new TypeError('tool action must be an object');
  const id = readString(input.id, 'tool action id');
  if (id.length === 0) throw new TypeError('tool action id must not be empty');
  const reads = uniqueStrings(input.reads ?? []);
  const writes = uniqueStrings(input.writes ?? []);
  const producedArtifacts = (input.producedArtifacts ?? []).map((artifact, artifactIndex) => normalizeToolArtifact(artifact, 'tool action producedArtifacts[' + artifactIndex + ']'));
  const effects = uniqueStrings(input.effects ?? []);
  const capability = optionalString(input.capability, 'tool action capability');
  const requires = uniqueStrings((capability === undefined ? [] : [capability]).concat(input.requires ?? []));
  const routes = uniqueStrings((input.route === undefined ? [] : [readString(input.route, 'tool action route')]).concat(input.routes ?? []));
  const policyResources = uniqueStrings((input.policyResources ?? []).concat('tool:' + id, reads, writes, effects));
  const inputSchema = normalizeInputSchema(input.input, input.inputSchema, id);
  const risk = input.risk === undefined
    ? (writes.length !== 0 || effects.length !== 0 || producedArtifacts.length !== 0 ? 'medium' : 'low')
    : readString(input.risk, 'tool action risk');
  return {
    kind: FRONTIER_TOOL_ACTION_KIND,
    version: FRONTIER_TOOL_ACTION_VERSION,
    id,
    title: input.title === undefined ? titleFromId(id) : readString(input.title, 'tool action title'),
    description: optionalString(input.description, 'tool action description'),
    capability: capability ?? requires[0],
    risk,
    inputSchema,
    reads,
    writes,
    producedArtifacts,
    effects,
    requires,
    policyResources,
    routes,
    dryRun: input.dryRun === true,
    expectedPatch: (input.expectedPatch ?? []).map((patch) => normalizePatchTemplate(patch, 'tool action expectedPatch')),
    rollback: input.rollback === undefined ? undefined : normalizeRollback(input.rollback),
    approval: input.approval === undefined ? undefined : normalizeApproval(input.approval),
    owner: optionalString(input.owner, 'tool action owner'),
    package: optionalString(input.package, 'tool action package'),
    feature: optionalString(input.feature, 'tool action feature'),
    tags: uniqueStrings(input.tags ?? []),
    source: input.source === undefined ? undefined : input.source,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'tool action metadata')
  };
}

function normalizeAgentTaskArtifact(input: FrontierAgentTaskArtifactInput, index: number): FrontierAgentTaskArtifact {
  if (typeof input === 'string') {
    if (input.length === 0) throw new TypeError('agent task artifact path must not be empty');
    return {
      id: 'artifact:' + index,
      kind: 'artifact',
      path: input,
      required: true
    };
  }
  if (!isObject(input)) throw new TypeError('agent task artifact must be a string path or object');
  const kind = input.kind === undefined ? 'artifact' : readString(input.kind, 'agent task artifact kind');
  const path = optionalString(input.path, 'agent task artifact path');
  const id = input.id === undefined ? (path === undefined ? kind + ':' + index : kind + ':' + path) : readString(input.id, 'agent task artifact id');
  if (id.length === 0) throw new TypeError('agent task artifact id must not be empty');
  return {
    id,
    kind,
    path,
    description: optionalString(input.description, 'agent task artifact description'),
    required: input.required !== false,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'agent task artifact metadata')
  };
}

function normalizeAgentTaskSafetyPolicy(
  input: FrontierAgentTaskSafetyPolicyInput | undefined,
  taskId: string,
  capability: string,
  reads: readonly string[],
  writes: readonly string[]
): FrontierAgentTaskSafetyPolicy {
  const approvalRequired = input?.approvalRequired === true;
  const destructive = input?.destructive ?? writes.length !== 0;
  const policyResources = uniqueStrings((input?.policyResources ?? []).concat('task:' + taskId, 'capability:' + capability, reads, writes));
  const out: FrontierAgentTaskSafetyPolicy = {
    approvalRequired,
    approvalMode: input?.approvalMode === undefined ? (approvalRequired ? 'always' : 'policy') : readString(input.approvalMode, 'agent task approval mode'),
    destructive,
    sandbox: input?.sandbox === undefined ? 'workspace' : readString(input.sandbox, 'agent task sandbox'),
    network: input?.network === undefined ? 'restricted' : readString(input.network, 'agent task network'),
    secrets: input?.secrets === undefined ? 'redacted' : readString(input.secrets, 'agent task secrets'),
    allowedCommands: uniqueStrings(input?.allowedCommands ?? []),
    deniedCommands: uniqueStrings(input?.deniedCommands ?? []),
    requires: uniqueStrings([capability].concat(input?.requires ?? [])),
    policyResources,
    metadata: input?.metadata === undefined ? undefined : readJsonObject(input.metadata, 'agent task safety metadata')
  };
  if (input?.maxRuntimeMs !== undefined) out.maxRuntimeMs = readNonNegativeNumber(input.maxRuntimeMs, 'agent task maxRuntimeMs');
  return out;
}

function normalizeToolArtifact(input: FrontierToolArtifactInput, label: string): FrontierToolArtifact {
  if (typeof input === 'string') {
    if (input.length === 0) throw new TypeError(label + ' path must not be empty');
    return {
      id: 'artifact:' + hashStable([label, input]),
      kind: 'artifact',
      path: input,
      required: true
    };
  }
  if (!isObject(input)) throw new TypeError(label + ' must be a string path or object');
  const kind = input.kind === undefined ? 'artifact' : readString(input.kind, label + ' kind');
  const path = optionalString(input.path, label + ' path');
  const id = input.id === undefined ? (path === undefined ? kind + ':' + hashStable([label, kind]) : kind + ':' + path) : readString(input.id, label + ' id');
  if (id.length === 0) throw new TypeError(label + ' id must not be empty');
  return {
    id,
    kind,
    path,
    description: optionalString(input.description, label + ' description'),
    required: input.required !== false,
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, label + ' metadata')
  };
}

function normalizeInputSchema(input: FrontierToolInputShape | undefined, inputSchema: FrontierToolJsonSchema | undefined, actionId: string): FrontierToolJsonSchema {
  if (inputSchema !== undefined) {
    const schema = readJsonObject(inputSchema, 'tool action inputSchema');
    if (schema.type === undefined) schema.type = 'object';
    if (schema.properties === undefined) schema.properties = {};
    if (schema.required === undefined) schema.required = [];
    if (schema.additionalProperties === undefined) schema.additionalProperties = false;
    return schema;
  }
  const properties: JsonObject = {};
  const required: string[] = [];
  for (const [key, field] of Object.entries(input ?? {})) {
    const normalized = normalizeInputField(field, actionId + '.' + key);
    properties[key] = normalized.schema as unknown as JsonValue;
    if (normalized.required) required[required.length] = key;
  }
  return {
    type: 'object',
    properties,
    required: required as unknown as JsonValue,
    additionalProperties: false
  };
}

function normalizeInputField(field: FrontierToolInputPrimitive | FrontierToolInputFieldInput | FrontierToolJsonSchema, label: string): { schema: FrontierToolJsonSchema; required: boolean } {
  if (typeof field === 'string') return { schema: { type: field }, required: true };
  if (!isObject(field)) throw new TypeError('tool input field ' + label + ' must be a primitive type or object schema');
  const schema = readJsonObject(field, 'tool input field ' + label);
  const required = schema.required === false ? false : true;
  if (typeof schema.required === 'boolean') delete schema.required;
  if (schema.type === undefined) schema.type = schema.enum !== undefined ? undefined as unknown as JsonValue : 'string';
  return { schema, required };
}

function normalizePatchTemplate(input: FrontierToolPatchTemplateInput, label: string): FrontierToolPatchTemplate {
  if (!isObject(input)) throw new TypeError(label + ' item must be an object');
  const out: FrontierToolPatchTemplate = {
    op: input.op === undefined ? 'set' : readString(input.op, label + ' op'),
    path: normalizeTemplatePath(input.path)
  };
  if (input.from !== undefined) out.from = normalizeTemplatePath(input.from);
  if (input.value !== undefined) out.value = toJsonValue(input.value, label + ' value');
  if (input.oldValue !== undefined) out.oldValue = toJsonValue(input.oldValue, label + ' oldValue');
  if (input.metadata !== undefined) out.metadata = readJsonObject(input.metadata, label + ' metadata');
  return out;
}

function normalizePatches(inputs: readonly FrontierToolPatchTemplateInput[]): FrontierToolPatchTemplate[] {
  return inputs.map((patch) => normalizePatchTemplate(patch, 'tool patch'));
}

function normalizeRollback(input: FrontierToolRollbackInput): FrontierToolRollback {
  if (!isObject(input)) throw new TypeError('tool rollback must be an object');
  const out: FrontierToolRollback = {
    action: readString(input.action, 'tool rollback action')
  };
  if (input.input !== undefined) out.input = readJsonObject(input.input, 'tool rollback input');
  if (input.reason !== undefined) out.reason = readString(input.reason, 'tool rollback reason');
  if (input.metadata !== undefined) out.metadata = readJsonObject(input.metadata, 'tool rollback metadata');
  return out;
}

function normalizeApproval(input: FrontierToolApprovalInput): FrontierToolApproval {
  if (!isObject(input)) throw new TypeError('tool approval must be an object');
  const mode = input.mode === undefined ? (input.required === true ? 'always' : 'policy') : readString(input.mode, 'tool approval mode');
  return {
    required: input.required === true,
    mode,
    reason: optionalString(input.reason, 'tool approval reason'),
    capability: optionalString(input.capability, 'tool approval capability'),
    metadata: input.metadata === undefined ? undefined : readJsonObject(input.metadata, 'tool approval metadata')
  };
}

function createPlan(
  action: FrontierToolAction,
  request: string | FrontierToolActionRequest,
  input: JsonObject,
  validation: FrontierToolsValidationResult,
  availability: FrontierToolsAvailability,
  generatedAt: number
): FrontierToolsPlan {
  const expectedPatch = action.expectedPatch.map((patch) => materializePatch(patch, input));
  const dryRun = typeof request === 'string' ? false : request.dryRun === true;
  const metadata = typeof request === 'string' || request.metadata === undefined ? undefined : readJsonObject(request.metadata, 'tool action request metadata');
  return {
    kind: FRONTIER_TOOLS_PLAN_KIND,
    version: FRONTIER_TOOLS_PLAN_VERSION,
    id: 'tool-plan:' + action.id + ':' + hashStable([input, generatedAt, dryRun]),
    actionId: action.id,
    generatedAt,
    input,
    valid: validation.valid,
    available: validation.valid && availability.available,
    dryRun: dryRun && action.dryRun,
    requiresApproval: availability.requiresApproval,
    blockedReasons: validation.valid ? availability.blockedReasons : availability.blockedReasons.concat(validation.errors.map((error) => error.message)),
    validationErrors: validation.errors,
    reads: action.reads,
    writes: action.writes,
    effects: action.effects,
    requires: action.requires,
    policyResources: action.policyResources,
    expectedPatch,
    rollback: action.rollback,
    descriptor: createToolDescriptor(action, { format: 'frontier' }),
    policyDecision: availability.policyDecision,
    metadata
  };
}

function evaluateAvailabilitySync(
  action: FrontierToolAction,
  context: FrontierToolsContext,
  input: JsonObject,
  options: FrontierToolsPlanOptions
): FrontierToolsAvailability {
  if (options.policyEvaluator !== undefined) {
    const decision = options.policyEvaluator(createPolicyEvaluationInput(action, context, input));
    if (isPromiseLike(decision)) throw new Error('planToolAction() received an async policyEvaluator; use planToolActionAsync()');
    return evaluateAvailabilityWithPolicy(action, context, decision ?? context.policyDecision ?? null);
  }
  return evaluateAvailabilityWithPolicy(action, context, context.policyDecision ?? null);
}

async function evaluateAvailabilityAsync(
  action: FrontierToolAction,
  context: FrontierToolsContext,
  input: JsonObject,
  options: FrontierToolsPlanOptions
): Promise<FrontierToolsAvailability> {
  const decision = options.policyEvaluator === undefined
    ? context.policyDecision ?? null
    : await options.policyEvaluator(createPolicyEvaluationInput(action, context, input)) ?? context.policyDecision ?? null;
  return evaluateAvailabilityWithPolicy(action, context, decision);
}

function evaluateAvailabilityWithPolicy(
  action: FrontierToolAction,
  context: FrontierToolsContext,
  policyDecision: FrontierToolsPolicyDecision | null
): FrontierToolsAvailability {
  const blockedReasons: string[] = [];
  const capabilities = new Set(context.capabilities ?? []);
  const missingCapabilities = action.requires.filter((capability) => !capabilities.has(capability));
  if (missingCapabilities.length !== 0) blockedReasons[blockedReasons.length] = 'missing-capability:' + missingCapabilities.join(',');
  if (action.approval?.capability !== undefined && !capabilities.has(action.approval.capability)) {
    missingCapabilities[missingCapabilities.length] = action.approval.capability;
    blockedReasons[blockedReasons.length] = 'missing-approval-capability:' + action.approval.capability;
  }
  if (action.routes.length !== 0) {
    if (context.route === undefined || !action.routes.some((route) => wildcardMatch(route, context.route ?? ''))) {
      blockedReasons[blockedReasons.length] = 'route-unavailable';
    }
  }
  let requiresApproval = action.approval?.required === true;
  if (policyDecision !== null) {
    if (policyDecision.allowed === false || policyDecision.access === 'deny') blockedReasons[blockedReasons.length] = 'policy-deny';
    if (policyDecision.requiresApproval === true || policyDecision.access === 'approval-required') requiresApproval = true;
    if (policyDecision.deniedTools?.some((tool) => wildcardMatch(tool, action.id)) === true) blockedReasons[blockedReasons.length] = 'policy-denied-tool';
    const allowedTools = policyDecision.allowedTools ?? [];
    if (allowedTools.length !== 0 && !allowedTools.some((tool) => wildcardMatch(tool, action.id))) blockedReasons[blockedReasons.length] = 'policy-tool-not-allowed';
    for (const effect of action.effects) {
      if (policyDecision.deniedEffects?.some((denied) => wildcardMatch(denied, effect)) === true) blockedReasons[blockedReasons.length] = 'policy-denied-effect:' + effect;
    }
  }
  return {
    available: blockedReasons.length === 0,
    blockedReasons,
    missingCapabilities,
    policyDecision: policyDecision ?? undefined,
    requiresApproval
  };
}

function createPolicyEvaluationInput(action: FrontierToolAction, context: FrontierToolsContext, input: JsonObject): FrontierToolsPolicyEvaluationInput {
  const metadata = context.metadata === undefined ? undefined : readJsonObject(context.metadata, 'tools context metadata');
  return {
    actor: context.actor,
    subject: context.subject,
    action: 'tool.call',
    tool: action.id,
    tools: [action.id],
    resources: action.policyResources,
    capabilities: action.requires,
    route: context.route,
    feature: context.feature ?? action.feature,
    package: context.package ?? action.package,
    state: context.state,
    input,
    metadata
  };
}

function normalizeContext(context: FrontierToolsContext): FrontierToolsContext {
  return {
    actor: context.actor,
    subject: context.subject,
    capabilities: uniqueStrings(context.capabilities ?? []),
    route: context.route,
    feature: context.feature,
    package: context.package,
    state: context.state,
    policyDecision: context.policyDecision ?? undefined,
    metadata: context.metadata
  };
}

function validateAgainstSchema(schema: FrontierToolJsonSchema, value: JsonValue, path: string, errors: FrontierToolsValidationError[]): void {
  const type = schema.type;
  if (type !== undefined && !typeMatches(type, value)) {
    errors[errors.length] = { path, code: 'type', message: (path || '/') + ' must be ' + formatType(type) };
    return;
  }
  if (schema.enum !== undefined && Array.isArray(schema.enum) && !schema.enum.some((item) => sameJsonValue(item, value))) {
    errors[errors.length] = { path, code: 'enum', message: (path || '/') + ' must be one of enum values' };
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) errors[errors.length] = { path, code: 'minLength', message: (path || '/') + ' is too short' };
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) errors[errors.length] = { path, code: 'maxLength', message: (path || '/') + ' is too long' };
    if (typeof schema.pattern === 'string' && !(new RegExp(schema.pattern)).test(value)) errors[errors.length] = { path, code: 'pattern', message: (path || '/') + ' does not match pattern' };
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors[errors.length] = { path, code: 'minimum', message: (path || '/') + ' is below minimum' };
    if (typeof schema.maximum === 'number' && value > schema.maximum) errors[errors.length] = { path, code: 'maximum', message: (path || '/') + ' is above maximum' };
  }
  if (isObject(value)) validateObjectAgainstSchema(schema, value, path, errors);
  if (Array.isArray(value) && isObject(schema.items)) {
    for (let i = 0; i < value.length; i++) validateAgainstSchema(schema.items, value[i], path + '/' + i, errors);
  }
}

function validateObjectAgainstSchema(schema: FrontierToolJsonSchema, value: JsonObject, path: string, errors: FrontierToolsValidationError[]): void {
  const properties = isObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : [];
  for (const key of required) {
    if (!hasOwn.call(value, key)) errors[errors.length] = { path: path + '/' + escapePointer(key), code: 'required', message: (path || '/') + ' missing required field ' + key };
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (hasOwn.call(value, key) && isObject(propertySchema)) validateAgainstSchema(propertySchema, value[key], path + '/' + escapePointer(key), errors);
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!hasOwn.call(properties, key)) errors[errors.length] = { path: path + '/' + escapePointer(key), code: 'additionalProperties', message: (path || '/') + ' has unknown field ' + key };
    }
  }
}

function typeMatches(type: JsonValue, value: JsonValue): boolean {
  if (Array.isArray(type)) return type.some((item) => typeMatches(item, value));
  if (typeof type !== 'string') return true;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isObject(value);
  if (type === 'null') return value === null;
  if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
  return typeof value === type;
}

function materializePatch(template: FrontierToolPatchTemplate, input: JsonObject): FrontierToolPatchTemplate {
  const out: FrontierToolPatchTemplate = {
    op: template.op,
    path: substituteTemplateString(template.path, input)
  };
  if (template.from !== undefined) out.from = substituteTemplateString(template.from, input);
  if (template.value !== undefined) out.value = substituteTemplateValue(template.value, input);
  if (template.oldValue !== undefined) out.oldValue = substituteTemplateValue(template.oldValue, input);
  if (template.metadata !== undefined) out.metadata = template.metadata;
  return out;
}

function substituteTemplateValue(value: JsonValue, input: JsonObject): JsonValue {
  if (typeof value === 'string' && value.startsWith('$input.')) {
    const found = lookupPath(input, value.slice(7).split('.'));
    return found === undefined ? value : cloneJson(found);
  }
  if (typeof value === 'string') return substituteTemplateString(value, input);
  if (Array.isArray(value)) return value.map((item) => substituteTemplateValue(item, input));
  if (isObject(value)) {
    const out: JsonObject = {};
    for (const key of Object.keys(value)) out[key] = substituteTemplateValue(value[key], input);
    return out;
  }
  return value;
}

function substituteTemplateString(value: string, input: JsonObject): string {
  return value.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_match, key: string) => {
    const found = lookupTemplateValue(key, input);
    return found === undefined || found === null ? ':' + key : escapePointer(String(found));
  });
}

function lookupTemplateValue(key: string, input: JsonObject): JsonValue | undefined {
  if (hasOwn.call(input, key)) return input[key];
  if (key === 'id') {
    if (hasOwn.call(input, 'id')) return input.id;
    const idKeys = Object.keys(input).filter((item) => item.toLowerCase().endsWith('id'));
    if (idKeys.length === 1) return input[idKeys[0]];
  }
  return undefined;
}

function lookupPath(value: JsonValue, path: readonly string[]): JsonValue | undefined {
  let current: JsonValue | undefined = value;
  for (const segment of path) {
    if (current === undefined || current === null) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined;
      current = current[index];
      continue;
    }
    if (!isObject(current) || !hasOwn.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function patchesMatch(expected: readonly FrontierToolPatchTemplate[], actual: readonly FrontierToolPatchTemplate[]): boolean {
  if (expected.length === 0) return true;
  if (actual.length === 0) return false;
  for (const expectedPatch of expected) {
    if (!actual.some((patch) => patch.op === expectedPatch.op && patch.path === expectedPatch.path)) return false;
  }
  return true;
}

function normalizeHandlerResult(result: FrontierToolHandlerResult | JsonValue | void): FrontierToolHandlerResult {
  if (result === undefined) return {};
  if (isObject(result) && (hasOwn.call(result, 'patches') || hasOwn.call(result, 'effects') || hasOwn.call(result, 'output') || hasOwn.call(result, 'metadata'))) {
    return result as FrontierToolHandlerResult;
  }
  return { output: result };
}

function createDescriptorMetadata(action: FrontierToolAction): JsonObject {
  const metadata: JsonObject = {
    actionId: action.id,
    reads: action.reads as unknown as JsonValue,
    writes: action.writes as unknown as JsonValue,
    producedArtifacts: action.producedArtifacts as unknown as JsonValue,
    effects: action.effects as unknown as JsonValue,
    requires: action.requires as unknown as JsonValue,
    policyResources: action.policyResources as unknown as JsonValue,
    dryRun: action.dryRun,
    expectedPatch: action.expectedPatch as unknown as JsonValue
  };
  if (action.capability !== undefined) metadata.capability = action.capability;
  if (action.risk !== undefined) metadata.risk = action.risk;
  if (action.rollback !== undefined) metadata.rollback = action.rollback as unknown as JsonValue;
  if (action.approval !== undefined) metadata.approval = action.approval as unknown as JsonValue;
  if (action.feature !== undefined) metadata.feature = action.feature;
  if (action.package !== undefined) metadata.package = action.package;
  return metadata;
}

function summarizeSession(records: readonly FrontierToolRecord[]): FrontierToolsSessionSummary {
  return {
    recordCount: records.length,
    okCount: records.filter((record) => record.status === 'ok').length,
    dryRunCount: records.filter((record) => record.status === 'dry-run').length,
    blockedCount: records.filter((record) => record.status === 'blocked').length,
    invalidCount: records.filter((record) => record.status === 'invalid').length,
    errorCount: records.filter((record) => record.status === 'error').length,
    actionIds: sortedUnique(records.map((record) => record.actionId))
  };
}

function requestActionId(request: string | FrontierToolActionRequest): string {
  if (typeof request === 'string') return request;
  return readString(request.actionId ?? request.id, 'tool action request id');
}

function readRequestCause(request: string | FrontierToolActionRequest): string | undefined {
  return typeof request === 'string' ? undefined : request.causeId;
}

function readRequestParent(request: string | FrontierToolActionRequest): string | undefined {
  return typeof request === 'string' ? undefined : request.parentId;
}

function requireAction(manifest: FrontierToolsManifest, id: string): FrontierToolAction {
  const action = manifest.actions.find((candidate) => candidate.id === id);
  if (action === undefined) throw new Error('unknown tool action: ' + id);
  return action;
}

function normalizeTemplatePath(path: FrontierRegistryPath | string): string {
  if (Array.isArray(path)) return '/' + normalizeFrontierRegistryPath(path);
  if (typeof path !== 'string') throw new TypeError('tool patch path must be a string or path array');
  return path.startsWith('/') || path.startsWith('path:') ? path.replace(/^path:/, '') : path;
}

function normalizeInput(input: unknown, label: string): JsonObject {
  if (input === undefined) return {};
  const json = toJsonValue(input, label);
  if (!isObject(json)) throw new TypeError(label + ' must be a JSON object');
  return json;
}

function titleFromId(id: string): string {
  const last = id.split(/[.:/]/).filter(Boolean).pop() ?? id;
  return last.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toToolName(id: string, namespace?: string): string {
  const raw = (namespace === undefined ? id : namespace + '_' + id).replace(/[^A-Za-z0-9_-]/g, '_');
  if (raw.length <= 64) return raw;
  return raw.slice(0, 47) + '_' + hashStable(raw).slice(0, 16);
}

function isToolsManifest(value: unknown): value is FrontierToolsManifest {
  return isObject(value) && value.kind === FRONTIER_TOOLS_MANIFEST_KIND && Array.isArray(value.actions);
}

function isToolAction(value: unknown): value is FrontierToolAction {
  return isObject(value) && value.kind === FRONTIER_TOOL_ACTION_KIND && typeof value.id === 'string';
}

function isActionInputArray(value: unknown): value is readonly FrontierToolActionInput[] {
  return Array.isArray(value);
}

function isToolsCompiler(value: unknown): value is FrontierToolsCompiler {
  return isObject(value) && isToolsManifest(value.manifest) && typeof value.plan === 'function';
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return isObject(value) && typeof value.then === 'function';
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(label + ' must be a string');
  return value;
}

function readNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new TypeError(label + ' must be a non-negative number');
  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return readString(value, label);
}

function readJsonObject(value: unknown, label: string): JsonObject {
  const json = toJsonValue(value, label);
  if (!isObject(json)) throw new TypeError(label + ' must be a JSON object');
  return json;
}

function toJsonValue(value: unknown, label: string): JsonValue {
  if (value === undefined) throw new TypeError(label + ' must not be undefined');
  try {
    return cloneJson(value as JsonValue);
  } catch {
    throw new TypeError(label + ' must be JSON-serializable');
  }
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(values: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (typeof value !== 'string') throw new TypeError('string list item must be a string');
    if (!out.includes(value)) out[out.length] = value;
  }
  return out;
}

function sortedUnique(values: readonly string[]): string[] {
  return uniqueStrings(values).sort();
}

function intersectsSet(left: readonly string[], right: Set<string>): boolean {
  for (const item of left) if (right.has(item)) return true;
  return false;
}

function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern === value || pattern === '*') return true;
  if (!pattern.includes('*')) return false;
  const parts = pattern.split('*');
  let offset = 0;
  if (parts[0] && !value.startsWith(parts[0])) return false;
  offset = parts[0].length;
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.length === 0) continue;
    const found = value.indexOf(part, offset);
    if (found < 0) return false;
    offset = found + part.length;
  }
  const last = parts[parts.length - 1];
  return last.length === 0 || value.endsWith(last);
}

function normalizeImpactSeeds(input: FrontierRegistryImpactInput): string[] {
  const seeds: string[] = [];
  for (const id of input.ids ?? []) pushUnique(seeds, 'entry:' + id);
  for (const path of input.paths ?? []) pushUnique(seeds, 'path:' + normalizeFrontierRegistryPath(path));
  for (const feature of input.features ?? []) pushUnique(seeds, 'feature:' + feature);
  for (const packageName of input.packages ?? []) pushUnique(seeds, 'package:' + packageName);
  for (const tag of input.tags ?? []) pushUnique(seeds, 'tag:' + tag);
  for (const file of input.files ?? []) pushUnique(seeds, 'file:' + file);
  for (const node of input.nodes ?? []) pushUnique(seeds, normalizeImpactNode(node));
  return seeds;
}

function normalizeImpactNode(node: string): string {
  if (
    node.startsWith('entry:') ||
    node.startsWith('record:') ||
    node.startsWith('path:') ||
    node.startsWith('feature:') ||
    node.startsWith('package:') ||
    node.startsWith('tag:') ||
    node.startsWith('file:') ||
    node.startsWith('node:')
  ) return node;
  if (/^[a-z][a-z0-9.-]*:.+$/i.test(node)) return node;
  return 'node:' + node;
}

function appendAdjacency(index: Map<string, string[]>, from: string, to: string): void {
  const bucket = index.get(from);
  if (bucket === undefined) index.set(from, [to]);
  else if (!bucket.includes(to)) bucket[bucket.length] = to;
}

function enqueue(node: string, visited: Set<string>, queue: string[]): void {
  if (visited.has(node)) return;
  visited.add(node);
  queue[queue.length] = node;
}

function registryPathsOverlap(left: string, right: string): boolean {
  if (left === right || left === '/*' || right === '/*') return true;
  const leftParts = splitPointer(left);
  const rightParts = splitPointer(right);
  const length = Math.min(leftParts.length, rightParts.length);
  for (let i = 0; i < length; i++) {
    if (leftParts[i] === '*' || rightParts[i] === '*') continue;
    if (leftParts[i] !== rightParts[i]) return false;
  }
  return leftParts.length === rightParts.length ||
    leftParts[leftParts.length - 1] === '*' ||
    rightParts[rightParts.length - 1] === '*';
}

function splitPointer(path: string): string[] {
  if (path === '' || path === '/') return [];
  return path.replace(/^\//, '').split('/');
}

function pushUnique(out: string[], value: string): void {
  if (!out.includes(value)) out[out.length] = value;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formatType(type: JsonValue): string {
  return Array.isArray(type) ? type.map(String).join(' or ') : String(type);
}

function escapePointer(value: string): string {
  return value.replace(/~/g, '~0').replace(/\//g, '~1');
}

function redactObject(value: unknown, keys: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => redactObject(item, keys));
  if (!isObject(value)) return value;
  const out: JsonObject = {};
  for (const key of Object.keys(value)) {
    out[key] = keys.has(key.toLowerCase()) ? '[redacted]' : redactObject(value[key], keys) as JsonValue;
  }
  return out;
}

function hashStable(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (isObject(value)) {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}
