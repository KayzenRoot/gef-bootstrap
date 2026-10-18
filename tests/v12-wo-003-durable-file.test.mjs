import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, open, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  compileMarathon, initialMarathonState, advanceMarathon,
  createFileBackedMarathonStore, initializePersistedMarathon,
  recoverPersistedMarathon, executeMarathonStep, reconcileMarathonStep,
} from '../packages/execution-pack-compiler/dist/public.js';

const hex = text => createHash('sha256').update(text).digest('hex');
const H = text => 'sha256:' + hex(text);
const digest = text => hex(text);
const BASE = 'a'.repeat(40);
const binding = { baseSha: BASE, lockDigest: H('wo003-lock'), actor: 'OWNER' };
const unwrap = value => {
  assert.equal(value.ok, true, JSON.stringify(value));
  return value.value;
};
const rejects = (value, code) => {
  assert.equal(value.ok, false, JSON.stringify(value));
  assert.equal(value.code, code);
};
function plan() {
  return unwrap(compileMarathon({ workOrderId: 'GBS-V12-WO-003', ...binding,
    nodes: [{ id: 'mutate', deps: [], reads: ['src/input'], writes: ['out/result'] },
            { id: 'audit', deps: ['mutate'], reads: ['out/result'], writes: ['out/audit'] }],
  }, digest));
}

test('file store persists a Marathon state across independent store instances', async t => {
  const root = await mkdtemp(join(tmpdir(), 'gef-marathon-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const p = plan(), store = createFileBackedMarathonStore(root);
  const initial = unwrap(await initializePersistedMarathon(p, store, binding, digest));
  assert.equal(initial.steps.mutate.status, 'PENDING');
  rejects(await initializePersistedMarathon(p, createFileBackedMarathonStore(root),
    binding, digest), 'SNAPSHOT_EXISTS_REQUIRES_RECOVERY');
  const reopened = createFileBackedMarathonStore(root);
  const recovery = unwrap(await recoverPersistedMarathon(p, reopened, binding, digest));
  assert.equal(recovery.status, 'READY');
  assert.deepEqual(recovery.readyNodeIds, ['mutate']);
});

test('file store never replays an uncertain provider effect after restart', async t => {
  const root = await mkdtemp(join(tmpdir(), 'gef-marathon-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const p = plan(), store = createFileBackedMarathonStore(root);
  unwrap(await initializePersistedMarathon(p, store, binding, digest));
  const marker = join(root, 'provider-applied');
  let runs = 0, lookups = 0;
  const provider = { async execute(input) {
    runs++;
    assert.equal((await store.read(p.planDigest)).steps.mutate.status, 'ACTIVE');
    const file = await open(marker, 'wx');
    try { await file.writeFile(input.intentId); await file.sync(); }
    finally { await file.close(); }
    throw Error('crash after provider mutation, before settlement');
  } };
  const authority = { async verify(_plan, prior, action) {
    return prior.steps.mutate?.status === 'ACTIVE' &&
      action.intentId === 'unique-intent' &&
      action.proofDigest === H('verified-provider-effect');
  } };
  rejects(await executeMarathonStep(p, store, 'mutate', 'unique-intent',
    binding, digest, { provider, proofAuthority: authority }), 'PROVIDER_OUTCOME_UNKNOWN_RECONCILE');
  const reopened = createFileBackedMarathonStore(root);
  const pending = unwrap(await recoverPersistedMarathon(p, reopened, binding, digest));
  assert.deepEqual(pending.unresolvedIntentIds, ['unique-intent']);
  rejects(await executeMarathonStep(p, reopened, 'mutate', 'different-intent',
    binding, digest, { provider, proofAuthority: authority }), 'STEP_NOT_DURABLY_READY');
  assert.equal(runs, 1);
  const lookup = { async lookup(input) {
    lookups++;
    assert.equal(input.intentId, await readFile(marker, 'utf8'));
    return { status: 'VERIFIED', proofDigest: H('verified-provider-effect') };
  } };
  const state = unwrap(await reconcileMarathonStep(p, reopened, 'mutate',
    binding, digest, lookup, authority));
  assert.equal(state.steps.mutate.status, 'VERIFIED');
  assert.equal(lookups, 1);
  assert.equal(runs, 1);
  assert.deepEqual(unwrap(await recoverPersistedMarathon(p,
    createFileBackedMarathonStore(root), binding, digest)).readyNodeIds, ['audit']);
});

test('durable store uses CAS and rejects mismatched concurrent revision', async t => {
  const root = await mkdtemp(join(tmpdir(), 'gef-marathon-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const p = plan(), one = createFileBackedMarathonStore(root);
  const original = unwrap(await initializePersistedMarathon(p, one, binding, digest));
  const two = createFileBackedMarathonStore(root);
  const next1 = unwrap(advanceMarathon(p, original,
    { type: 'START', nodeId: 'mutate', intentId: 'first' }, binding, digest));
  const next2 = unwrap(advanceMarathon(p, original,
    { type: 'START', nodeId: 'mutate', intentId: 'second' }, binding, digest));
  const result = await Promise.all([
    one.compareAndSwap(p.planDigest, original.stateDigest, next1),
    two.compareAndSwap(p.planDigest, original.stateDigest, next2),
  ]);
  assert.deepEqual(result.slice().sort(), [false, true]);
  const durable = await createFileBackedMarathonStore(root).read(p.planDigest);
  assert.equal(durable.steps.mutate.status, 'ACTIVE');
  assert.ok(['first', 'second'].includes(durable.steps.mutate.intentId));
});

test('stale exclusive lock blocks storage mutation instead of unlocking automatically', async t => {
  const root = await mkdtemp(join(tmpdir(), 'gef-marathon-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const p = plan(), store = createFileBackedMarathonStore(root);
  unwrap(await initializePersistedMarathon(p, store, binding, digest));
  await mkdir(join(root, p.planDigest.slice(7) + '.lock'));
  const original = await store.read(p.planDigest);
  const next = unwrap(advanceMarathon(p, original,
    { type: 'START', nodeId: 'mutate', intentId: 'not-applied' }, binding, digest));
  assert.equal(await store.compareAndSwap(p.planDigest, original.stateDigest, next), false);
  assert.equal((await store.read(p.planDigest)).stateDigest, original.stateDigest);
});

test('file store rejects invalid digest key without file writes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'gef-marathon-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = createFileBackedMarathonStore(root);
  await assert.rejects(store.read('../secrets'));
  await assert.rejects(store.compareAndSwap('../secrets', 'x', { planDigest: '../secrets' }));
  await assert.rejects(store.createIfAbsent('../secrets', { planDigest: '../secrets' }));
  assert.deepEqual(await readdir(root), []);
});
