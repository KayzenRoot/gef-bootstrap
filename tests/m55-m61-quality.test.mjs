import test from 'node:test';
import assert from 'node:assert/strict';
import { createGithubSimulation, simulateGithub, retryPlan, e2eReceipt, benchmarkSummary, performanceGate, containedPath, redactSecrets, validateConfig, documentationManifest, runbookDecision } from '../packages/m55-m61-quality/src/index.mjs';

test('M55 simulator is deterministic and stale revisions fail closed', () => {
  const a = createGithubSimulation('x');
  const r = simulateGithub(a, { type:'CREATE', id:'pr:1', value:{state:'open'}, expectedRevision:0 });
  assert.equal(r.result, 'OK');
  assert.equal(r.state.revision, 1);
  assert.equal(simulateGithub(r.state, { type:'UPDATE', id:'pr:1', value:{state:'closed'}, expectedRevision:0 }).result, 'CONFLICT');
  assert.equal(simulateGithub(a, { type:'CREATE', id:'x' }, 'UNKNOWN').mutated, false);
});

test('M55 retry policy is bounded and reconciliation-aware', () => {
  assert.deepEqual(retryPlan('RECONCILE_THEN_RETRY', 99), { kind:'RECONCILE_THEN_RETRY', maxAttempts:8, requiresReconciliation:true });
  assert.equal(retryPlan('DO_NOT_RETRY', 5).maxAttempts, 1);
});

test('M56 E2E receipt binds phase evidence', () => {
  const r = e2eReceipt('clean', [{phase:'preflight',status:'PASS'},{phase:'bootstrap',status:'PASS'}]);
  assert.equal(r.status, 'PASS');
  assert.equal(r.phases.length, 2);
  assert.match(r.digest, /^[a-f0-9]{64}$/);
});

test('M57 benchmark summary and incompatible population gate', () => {
  const s = benchmarkSummary([5,1,3,2,4]);
  assert.equal(s.median, 3);
  assert.equal(performanceGate({population:'linux',median:10},{population:'windows',median:10}).verdict, 'INCOMPARABLE');
  assert.equal(performanceGate({population:'linux',median:10},{population:'linux',median:13}, .15).verdict, 'REGRESSION');
});

test('M58 traversal containment and redaction', () => {
  assert.equal(containedPath('/tmp/gef-root', 'a/b'), true);
  assert.equal(containedPath('/tmp/gef-root', '../escape'), false);
  assert.equal(redactSecrets('token=abc123', ['abc123']), 'token=[REDACTED]');
});

test('M58 malicious config bounds and prototype keys', () => {
  assert.equal(validateConfig({safe:{value:1}}).valid, true);
  const bad = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.equal(validateConfig(bad).valid, false);
  let deep = {}; let p = deep; for (let i=0;i<20;i++) p = p.x = {};
  assert.equal(validateConfig(deep).valid, false);
});

test('M59-M60 documentation manifest deterministic ordering', () => {
  const a = documentationManifest([{id:'b',source:'x',version:1},{id:'a',source:'y',version:1}]);
  assert.deepEqual(a.entries.map(x=>x.id), ['a','b']);
  assert.match(a.digest, /^[a-f0-9]{64}$/);
});

test('M61 runbooks never auto-repair ambiguous state', () => {
  const r = runbookDecision('RECOVERY_JOURNAL_CONFLICT');
  assert.equal(r.automatic, false);
  assert.ok(r.steps.includes('MANUAL_ACTION_REQUIRED'));
  assert.ok(runbookDecision('UNKNOWN_FINDING').steps.includes('INDETERMINATE'));
});
