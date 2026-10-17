import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  compileMarathon, initialMarathonState, advanceMarathon,
  recoverMarathonWithCanonicalContinuity,
} from '../packages/execution-pack-compiler/dist/public.js';
import {
  createCanonicalContinuationCapsule, verifyCanonicalContinuationCapsule,
  buildCheckpointFreshnessVector, buildCheckpointPortabilityEnvelope,
  buildResumeReadinessCertificate, buildContinuationHandoffContract,
} from '../packages/checkpoint-engine/dist/public.js';
import {
  createResumeIntentCapsule, proveLineageContinuity, enforceResumeAuthorityBoundary,
  applyConversationIndependence, buildResumeMinimumSufficientContext, rehydrateHotState,
  buildContextTemperatureMap, buildResumeReadPlan, buildResumeDriftVector,
  detectOrphanWork, buildResumeConflictQuarantine, evaluateSafeReentry,
  buildResumeReceipt, verifyResumeReceipt, verifyContinuationHandoff,
} from '../packages/resume-engine/dist/public.js';

const digest = text => createHash('sha256').update(text).digest('hex');
const H = s => 'sha256:' + digest(s);
const options = { digest: { algorithm: 'sha256', digest } };
const binding = { baseSha: 'a'.repeat(40), lockDigest: H('admitted-lock'), actor: 'CHATGPT_OWNER' };
const policyBinding = { checkpointIdentity: 'prev', policyFingerprint: H('a'),
  decisionReceiptDigest: H('b'), exceptionDebtDigest: H('c'),
  policyIds: ['p'], bindingDigest: H('d') };
const unwrap = result => {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
};
function plan() {
  return unwrap(compileMarathon({
    workOrderId: 'GBS-V12-WO-003', ...binding,
    nodes: [{ id: 'step1', deps: [], reads: ['src/input'], writes: ['out/result'] }],
  }, digest));
}
function canonicalChain(p, state, overrides = {}) {
  const bindings = [
    ['marathon-base', H('GEF:MARATHON_BASE\\n' + p.baseSha)],
    ['marathon-lock', p.lockDigest],
    ['marathon-plan', p.planDigest],
    ['marathon-state', state.stateDigest],
  ].map(([bindingId, semanticIdentity]) => ({
    bindingId, semanticIdentity, domain: 'MARATHON',
    authorityRef: 'source:' + bindingId, required: true,
  }));
  const identities = Object.fromEntries(bindings.map(b => [b.bindingId, b.semanticIdentity]));
  const checkpoint = unwrap(createCanonicalContinuationCapsule({
    schemaVersion: 1, projectId: 'gef-bootstrap', moduleId: 'GBS-M17',
    stageId: 'WO003-CONTINUATION', lineageId: 'lineage-wo003',
    predecessorCheckpointDigest: null, admittedWorkOrderIds: [p.workOrderId],
    authorityBindings: bindings, policyBinding, claims: [], blockers: [],
    evidenceRefs: ['wo003:durable-state'], nextLegalAction: 'RECOVER_MARATHON_STATE',
    requiredCapabilities: [],
    ...overrides,
  }, options));
  const freshness = unwrap(buildCheckpointFreshnessVector(checkpoint, identities, options));
  const portability = unwrap(buildCheckpointPortabilityEnvelope(checkpoint, [], options));
  const readiness = unwrap(buildResumeReadinessCertificate(checkpoint, freshness, portability, options));
  const handoff = unwrap(buildContinuationHandoffContract(checkpoint, readiness, options));
  const intent = unwrap(createResumeIntentCapsule({
    resumeId: 'resume-wo003', projectId: checkpoint.projectId,
    expectedLineageId: checkpoint.lineageId,
    expectedCheckpointDigest: checkpoint.checkpointDigest,
    requestedNextAction: null,
  }, options));
  const lineage = unwrap(proveLineageContinuity(intent, checkpoint, handoff, options));
  const authority = unwrap(enforceResumeAuthorityBoundary(intent, checkpoint, handoff, options));
  const refs = [{ refId: 'checkpoint', dependencyKeys: ['checkpoint'], mandatory: true,
    preferredTemperature: 'HOT' }];
  const context = unwrap(buildResumeMinimumSufficientContext(checkpoint, handoff, refs, options));
  const hot = unwrap(rehydrateHotState([], handoff.handoffDigest, options));
  const temperature = unwrap(buildContextTemperatureMap(refs, {}, options));
  const readPlan = unwrap(buildResumeReadPlan(context, hot, temperature, options));
  const drift = unwrap(buildResumeDriftVector(checkpoint, {
    projectId: checkpoint.projectId, lineageId: checkpoint.lineageId,
    checkpointDigest: checkpoint.checkpointDigest,
    policyBindingDigest: checkpoint.policyBinding.bindingDigest,
    authorityIdentities: identities, claimStates: {},
  }, options));
  const orphans = unwrap(detectOrphanWork(checkpoint, [], options));
  const conversation = unwrap(applyConversationIndependence([], {}, options));
  const quarantine = unwrap(buildResumeConflictQuarantine(drift, orphans, conversation, options));
  const decision = unwrap(evaluateSafeReentry(
    checkpoint, lineage, authority, readiness, drift, readPlan, orphans, options));
  assert.equal(decision.status, 'READY', JSON.stringify(decision));
  const resumeReceipt = unwrap(buildResumeReceipt(
    intent, checkpoint, handoff, decision, readPlan, drift, orphans, quarantine, options));
  const witness = { checkpoint, readiness, handoff, resumeReceipt };
  const verifier = {
    async verifyCheckpoint(cp) { return verifyCanonicalContinuationCapsule(cp, options).ok; },
    async verifyReadiness(cp, rd) {
      const fresh = buildCheckpointFreshnessVector(cp, identities, options);
      if (!fresh.ok) return false;
      const portable = buildCheckpointPortabilityEnvelope(cp, [], options);
      if (!portable.ok) return false;
      const rebuilt = buildResumeReadinessCertificate(cp, fresh.value, portable.value, options);
      return rebuilt.ok && rebuilt.value.certificateDigest === rd.certificateDigest &&
        rebuilt.value.ready && rebuilt.value.validity === 'VALID';
    },
    async verifyHandoff(ho) { return verifyContinuationHandoff(ho, options).ok; },
    async verifyResumeReceipt(re) { return verifyResumeReceipt(re, options).ok; },
  };
  return { witness, verifier };
}
function storeWith(initial) {
  let state = initial;
  return { async read() { return state; },
    async compareAndSwap(_key, before, next) {
      if (state.stateDigest !== before) return false;
      state = next; return true;
    },
    set(next) { state = next; },
  };
}
const reject = (result, code) => {
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.equal(result.code, code);
};

test('real M17/M18 receipts authorize only read-only exact-bound Marathon recovery', async () => {
  const p = plan(), state = unwrap(initialMarathonState(p, digest));
  const store = storeWith(state);
  const { witness, verifier } = canonicalChain(p, state);
  const result = unwrap(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, witness, verifier));
  assert.equal(result.recovery.status, 'READY');
  assert.deepEqual(result.recovery.readyNodeIds, ['step1']);
  assert.equal(result.privilegeGranted, false);
  assert.equal(result.stateDigest, state.stateDigest);
  assert.equal(result.checkpointDigest, witness.checkpoint.checkpointDigest);
  assert.equal(result.resumeReceiptDigest, witness.resumeReceipt.receiptDigest);
});

test('M17/M18 gate refuses forged resume receipt, stale authority and drifted actor', async () => {
  const p = plan(), state = unwrap(initialMarathonState(p, digest));
  const store = storeWith(state);
  const { witness, verifier } = canonicalChain(p, state);
  reject(await recoverMarathonWithCanonicalContinuity(p, store, binding, digest,
    { ...witness, resumeReceipt: { ...witness.resumeReceipt,
      receiptDigest: H('forged') } }, verifier), 'CONTINUITY_M17_M18_PROOF_INVALID');
  reject(await recoverMarathonWithCanonicalContinuity(p, store,
    { ...binding, actor: 'WRONG_ACTOR' }, digest, witness, verifier),
  'CONTINUITY_SOURCE_OR_ACTOR_DRIFT');
  const wrong = canonicalChain(p, state, {
    authorityBindings: witness.checkpoint.authorityBindings.map(b =>
      b.bindingId === 'marathon-lock' ? { ...b, semanticIdentity: H('stale') } : b),
  });
  reject(await recoverMarathonWithCanonicalContinuity(p, store, binding, digest,
    wrong.witness, wrong.verifier), 'CONTINUITY_M17_AUTHORITY_DRIFT');
});

test('M17/M18 gate rejects stale state and concurrent CAS change after verification', async () => {
  const p = plan(), state = unwrap(initialMarathonState(p, digest));
  const store = storeWith(state);
  const { witness, verifier } = canonicalChain(p, state);
  const changed = unwrap(advanceMarathon(p, state,
    { type: 'PAUSE' }, binding, digest));
  store.set(changed);
  reject(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, witness, verifier), 'CONTINUITY_M17_AUTHORITY_DRIFT');
  store.set(state);
  const changingVerifier = {
    ...verifier,
    async verifyResumeReceipt(value) {
      store.set(changed);
      return verifier.verifyResumeReceipt(value);
    },
  };
  reject(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, witness, changingVerifier),
    'CONTINUITY_CONCURRENT_STATE_DRIFT');
});

test('M17/M18 gate quarantines an uncertain ACTIVE step without provider replay', async () => {
  const p = plan(), initial = unwrap(initialMarathonState(p, digest));
  const active = unwrap(advanceMarathon(p, initial,
    { type: 'START', nodeId: 'step1', intentId: 'persisted-before-crash' }, binding, digest));
  const store = storeWith(active);
  const { witness, verifier } = canonicalChain(p, active);
  const result = unwrap(await recoverMarathonWithCanonicalContinuity(
    p, store, binding, digest, witness, verifier));
  assert.equal(result.recovery.status, 'RECONCILIATION_REQUIRED');
  assert.deepEqual(result.recovery.unresolvedIntentIds, ['persisted-before-crash']);
  assert.deepEqual(result.recovery.readyNodeIds, []);
  assert.equal(result.privilegeGranted, false);
});
