import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialMarathonState, advanceMarathon, recoverMarathonWithCanonicalContinuity,
} from '../packages/execution-pack-compiler/dist/public.js';
import { verifyResumeReceipt } from '../packages/resume-engine/dist/public.js';

import { digest, H, options, binding, policyBinding, unwrap, plan,
  canonicalChain, storeWith, reject } from './v12-wo-003-marathon-fixtures.test.mjs';

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
