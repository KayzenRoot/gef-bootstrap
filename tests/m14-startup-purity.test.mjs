import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('task-context-compiler import is startup-pure', async () => {
  const cwd = process.cwd();
  const key = 'GEF_M14_PURITY_SENTINEL';
  const before = process.env[key];
  process.env[key] = 'stable';

  const mod = await import('../packages/task-context-compiler/dist/public.js');

  assert.equal(typeof mod.createTaskIntentEnvelope, 'function');
  assert.equal(typeof mod.createAuthorityBoundContextUnit, 'function');
  assert.equal(typeof mod.buildTaskContextCapsule, 'function');
  assert.equal(process.cwd(), cwd);
  assert.equal(process.env[key], 'stable');

  if (before === undefined) delete process.env[key];
  else process.env[key] = before;
});

test('ordinary task-context-compiler API use requires no filesystem network or process execution', async () => {
  const { createTaskIntentEnvelope, createAuthorityBoundContextUnit } = await import(
    '../packages/task-context-compiler/dist/public.js'
  );
  const digest = {
    algorithm: 'sha256',
    digest(input) {
      return createHash('sha256').update(input).digest('hex');
    },
  };

  const tieResult = createTaskIntentEnvelope(
    {
      taskId: 'task-001',
      taskClass: 'READ_ONLY_QUERY',
      riskClass: 'STANDARD',
      objectiveSummary: 'Query task for scope and arch',
      targetDomains: ['SCOPE', 'ARCH'],
      requiredCapabilities: ['READ'],
      projectId: 'proj-1',
      sourcePackIdentity: 'sp-1',
      profileIdentity: 'generic',
      profileDigest: 'sha256:p',
      policyVersion: '1.0',
      checkpointIdentity: 'chk-1',
    },
    { digest },
  );

  assert.equal(tieResult.ok, true);
  assert.match(tieResult.value.semanticIdentity, /^sha256:[0-9a-f]{64}$/);

  const abcuResult = createAuthorityBoundContextUnit(
    {
      unitId: 'unit-1',
      domain: 'SCOPE',
      role: 'NORMATIVE',
      applicability: 'ACTIVE',
      authorityRef: 'auth-01',
      sourceFingerprint: 'fp-1',
      projectId: 'proj-1',
      sourcePackIdentity: 'sp-1',
      profileIdentity: 'generic',
      profileDigest: 'sha256:p',
      policyVersion: '1.0',
      checkpointIdentity: 'chk-1',
      semanticPayloadRef: 'ref:scope-spec',
    },
    { digest },
  );

  assert.equal(abcuResult.ok, true);
  assert.match(abcuResult.value.semanticIdentity, /^sha256:[0-9a-f]{64}$/);
});
