import { persistAuthority } from './v12-wo-003-fixtures.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createFileBackedDeltaLedgerStore, initializeDurableDeltaLedger,
  recordVerifiedDeltaAttempt, initializeDeltaLedger, addDeltaAttempt,
} from '../packages/heds-delta-review/dist/public.js';

const sha256 = text => createHash('sha256').update(text).digest('hex');
const H = text => 'sha256:' + sha256(text);
const digest = text => sha256(text);
const WO = 'GBS-V12-WO-003', HEAD = 'b'.repeat(40);
const unwrap = result => { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; };
const reject = (result, reason) => {
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.equal(result.code, reason);
};
const attempt = (id, observation) => ({
  testId: 'tests:unit', attemptId: id, headSha: HEAD,
  inputDigest: H('input'), toolchainDigest: H('node22'),
  evidenceDigest: H(id), observation,
  failureSignature: observation === 'FAIL' ? 'failureA' : null,
});
const authority = persistAuthority;

test('Delta file store preserves first failure after restart and independently verified retry', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-delta-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(dir);
  unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, ['tests:unit'], digest));
  reject(await initializeDurableDeltaLedger(
    createFileBackedDeltaLedgerStore(dir), WO, HEAD, ['tests:unit'], digest),
    'DELTA_LEDGER_EXISTS_REQUIRES_RECOVERY');
  unwrap(await recordVerifiedDeltaAttempt(store, authority, WO, attempt('original','FAIL'), HEAD, digest));
  const reopened = createFileBackedDeltaLedgerStore(dir);
  assert.equal((await reopened.read(WO, HEAD)).records[0].firstFailure.attemptId, 'original');
  unwrap(await recordVerifiedDeltaAttempt(
    reopened, authority, WO, attempt('passing-retry','PASS'), HEAD, digest));
  const restarted = await createFileBackedDeltaLedgerStore(dir).read(WO, HEAD);
  assert.equal(restarted.records[0].firstFailure.attemptId, 'original');
  assert.equal(restarted.records[0].classification, 'FLAKE_CANDIDATE');
  assert.equal(restarted.records[0].attempts.length, 2);
});

test('Delta file store rejects competing CAS writes and stale revisions', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-delta-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const one = createFileBackedDeltaLedgerStore(dir);
  const original = unwrap(await initializeDurableDeltaLedger(one, WO, HEAD, ['tests:unit'], digest));
  const two = createFileBackedDeltaLedgerStore(dir);
  const candidateA = unwrap(addDeltaAttempt(original, attempt('one','FAIL'), digest));
  const candidateB = unwrap(addDeltaAttempt(original, attempt('two','FAIL'), digest));
  const outcomes = await Promise.all([
    one.compareAndSwap(WO, HEAD, original.ledgerDigest, candidateA),
    two.compareAndSwap(WO, HEAD, original.ledgerDigest, candidateB),
  ]);
  assert.deepEqual(outcomes.sort(), [false, true]);
  const committed = await createFileBackedDeltaLedgerStore(dir).read(WO, HEAD);
  assert.equal(committed.records[0].attempts.length, 1);
  assert.equal(await one.compareAndSwap(WO, HEAD, original.ledgerDigest, candidateA), false);
});

test('Delta stale exclusive lock and invalid storage keys fail closed', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-delta-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(dir);
  const old = unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, ['tests:unit'], digest));
  const key = sha256(WO + '\n' + HEAD);
  await mkdir(join(dir, key + '.lock'));
  const next = unwrap(addDeltaAttempt(old, attempt('candidate','FAIL'), digest));
  assert.equal(await store.compareAndSwap(WO, HEAD, old.ledgerDigest, next), false);
  assert.equal((await store.read(WO, HEAD)).ledgerDigest, old.ledgerDigest);
  await assert.rejects(store.read('../not-allowed', HEAD));
});

test('Delta independent verifier cannot launder FAIL into PASS or change first-failure signature', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-delta-outcome-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(dir);
  const initial = unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, ['tests:unit'], digest));
  const forgedPass = attempt('claimed-pass', 'PASS');
  const authenticFailureAuthority = { async verify(_ledger, candidate) {
    return { ...await authority.verify(_ledger, candidate),
      observation: 'FAIL', failureSignature: 'actual-provider-failure' };
  } };
  reject(await recordVerifiedDeltaAttempt(store, authenticFailureAuthority, WO,
    forgedPass, HEAD, digest), 'DELTA_EVIDENCE_NOT_VERIFIED');
  const actualFailure = attempt('original-failure', 'FAIL');
  const forgedSuccessAuthority = { async verify(_ledger, candidate) {
    return { ...await authority.verify(_ledger, candidate),
      observation: 'PASS', failureSignature: null };
  } };
  reject(await recordVerifiedDeltaAttempt(store, forgedSuccessAuthority, WO,
    actualFailure, HEAD, digest), 'DELTA_EVIDENCE_NOT_VERIFIED');
  const mismatchedSignatureAuthority = { async verify(_ledger, candidate) {
    return { ...await authority.verify(_ledger, candidate),
      failureSignature: 'changed-signature' };
  } };
  reject(await recordVerifiedDeltaAttempt(store, mismatchedSignatureAuthority, WO,
    actualFailure, HEAD, digest), 'DELTA_EVIDENCE_NOT_VERIFIED');
  assert.equal((await store.read(WO, HEAD)).ledgerDigest, initial.ledgerDigest);
  unwrap(await recordVerifiedDeltaAttempt(store, authority, WO,
    actualFailure, HEAD, digest));
  assert.equal((await store.read(WO, HEAD)).records[0].firstFailure.attemptId,
    'original-failure');
});

test('Delta durable snapshot replacements leave one committed ledger and no temporary leftovers', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'gef-delta-atomic-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = createFileBackedDeltaLedgerStore(dir);
  unwrap(await initializeDurableDeltaLedger(store, WO, HEAD, ['tests:unit'], digest));
  for (let i = 0; i < 4; i++) {
    const id = 'durable-' + i;
    unwrap(await recordVerifiedDeltaAttempt(
      store, authority, WO, attempt(id, 'PASS'), HEAD, digest));
    const reloaded = await createFileBackedDeltaLedgerStore(dir).read(WO, HEAD);
    assert.equal(reloaded.records[0].attempts.at(-1).attemptId, id);
    assert.equal(reloaded.records[0].attempts.length, i + 1);
  }
  const names = await readdir(dir);
  assert.equal(names.length, 1);
  assert.match(names[0], /^[a-f0-9]{64}\.json$/);
});
