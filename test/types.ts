import {
  compileTools,
  createToolsManifest,
  executeToolActionAsync,
  type FrontierToolActionInput,
  type FrontierToolDescriptor,
  type FrontierToolHandler,
  type FrontierToolsManifest,
  type FrontierToolsPlan
} from '../dist/index.js';

const actions: FrontierToolActionInput[] = [{
  id: 'profile.save',
  input: { userId: 'string' },
  reads: ['entities.users'],
  writes: ['entities.users'],
  requires: ['profile.write'],
  expectedPatch: [{ op: 'set', path: '/entities/users/:id/saved', value: true }]
}];

const manifest: FrontierToolsManifest = createToolsManifest({ actions });
const tools = compileTools(manifest);
const plan: FrontierToolsPlan = tools.plan({ actionId: 'profile.save', input: { userId: 'u1' } }, {
  capabilities: ['profile.write']
});
const descriptors: FrontierToolDescriptor[] = tools.descriptors({ capabilities: ['profile.write'] }, { format: 'openai' });
const handler: FrontierToolHandler = ({ input }) => ({ output: input, patches: plan.expectedPatch });

void descriptors;
void executeToolActionAsync(tools, { actionId: 'profile.save', input: { userId: 'u1' } }, {
  context: { capabilities: ['profile.write'] },
  handlers: { 'profile.save': handler }
});
