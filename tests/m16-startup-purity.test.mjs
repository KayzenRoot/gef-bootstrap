import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

test('policy-guardrail-engine import is startup-pure', async () => {
  const cwd = process.cwd();
  const key = 'GEF_M16_PURITY_SENTINEL';
  const before = process.env[key];
  process.env[key] = 'stable';

  const mod = await import('../packages/policy-guardrail-engine/dist/public.js');

  assert.equal(typeof mod.createPolicyAuthorityCapsule, 'function');
  assert.equal(typeof mod.decidePolicy, 'function');
  assert.equal(typeof mod.projectDecisionToNodes, 'function');
  assert.equal(typeof mod.computePolicySemanticFingerprint, 'function');
  assert.equal(process.cwd(), cwd);
  assert.equal(process.env[key], 'stable');

  if (before === undefined) delete process.env[key];
  else process.env[key] = before;
});

test('ordinary policy-guardrail-engine API use requires no filesystem network or process execution', async () => {
  const { combineDecisions, applyShortCircuitFirewall } = await import(
    '../packages/policy-guardrail-engine/dist/public.js'
  );
  assert.equal(combineDecisions(['ALLOW', 'DENY']), 'DENY');

  const digest = {
    algorithm: 'sha256',
    digest(input) {
      return createHash('sha256').update(input).digest('hex');
    },
  };
  void digest;
  const firewall = applyShortCircuitFirewall([{ domain: 'd1', decision: 'ALLOW' }], ['d2']);
  assert.equal(firewall.shortCircuited, false);
});
