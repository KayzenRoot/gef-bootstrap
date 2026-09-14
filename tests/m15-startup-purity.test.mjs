import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('execution-pack-compiler import is startup-pure', async () => {
  const cwd = process.cwd();
  const key = 'GEF_M15_PURITY_SENTINEL';
  const before = process.env[key];
  process.env[key] = 'stable';

  const mod = await import('../packages/execution-pack-compiler/dist/public.js');

  assert.equal(typeof mod.compileExecutionPack, 'function');
  assert.equal(typeof mod.computeExecutableWorkDag, 'function');
  assert.equal(typeof mod.computePackSemanticDigest, 'function');
  assert.equal(typeof mod.checkPreInvocationDrift, 'function');
  assert.equal(process.cwd(), cwd);
  assert.equal(process.env[key], 'stable');

  if (before === undefined) delete process.env[key];
  else process.env[key] = before;
});

test('ordinary execution-pack-compiler API use requires no filesystem network or process execution', async () => {
  const { computeExecutableWorkDag, suppressReasoningBranches } = await import(
    '../packages/execution-pack-compiler/dist/public.js'
  );
  const digest = {
    algorithm: 'sha256',
    digest(input) {
      return createHash('sha256').update(input).digest('hex');
    },
  };

  const dag = computeExecutableWorkDag(
    [
      {
        instructionId: 'a', objective: 'first', targetFiles: [], dependsOn: [],
        mutationDomains: [], validationIds: [], provenanceRefs: [],
        preconditions: ['pack-valid'], mutationSpec: 'read-only', evidenceOutputs: ['ev:a'],
      },
    ],
    { digest },
  );
  assert.equal(dag.ok, true);
  assert.deepEqual(dag.value.order, ['a']);

  const branches = suppressReasoningBranches([{ branchId: 'b1', decided: true, canonicalRef: 'd1' }]);
  assert.deepEqual(branches.suppressed, ['b1']);
});
