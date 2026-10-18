/** U12-05: immutable first-failure ledger and conservative assurance reuse. */
import type { BugProofReceipt } from './bug-proof-types.js';

export type DeltaDigest = (canonical: string) => string;
export type DeltaResult<T> = { ok: true; value: T } | { ok: false; code: string };
export type DeltaObservation = 'PASS' | 'FAIL';
export type DeltaClassification = 'UNKNOWN' | 'DETERMINISTIC_FAILURE' | 'FLAKE_CANDIDATE' | 'FLAKE_CONFIRMED' | 'NO_FAILURE';
export interface DeltaAttempt {
  readonly testId: string;
  readonly attemptId: string;
  readonly headSha: string;
  readonly toolchainDigest: string;
  readonly inputDigest: string;
  readonly observation: DeltaObservation;
  readonly evidenceDigest: string;
  readonly failureSignature: string | null;
}
export interface DeltaRecord {
  readonly testId: string;
  readonly firstFailure: DeltaAttempt | null;
  readonly attempts: readonly DeltaAttempt[];
  readonly classification: DeltaClassification;
}
export interface DeltaLedger {
  readonly workOrderId: string;
  readonly headSha: string;
  readonly requiredFinalTests: readonly string[];
  readonly records: readonly DeltaRecord[];
  readonly ledgerDigest: string;
}
export interface DeltaAssuranceVerdict {
  readonly state: 'BLOCKED' | 'CORRECTION_REQUIRED' | 'READY_FOR_FINAL_ASSURANCE';
  readonly requiredFinalTests: readonly string[];
  readonly carriedFirstFailures: readonly string[];
  readonly evidenceReuseAllowed: readonly string[];
}
const S = /^[0-9a-f]{40}$/;
const D = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const validId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);
const ok = <T>(value: T): DeltaResult<T> => ({ ok: true, value });
const fail = <T>(code: string): DeltaResult<T> => ({ ok: false, code });
/** Canonical hashes may not change with LANG or ICU locale. */
const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const sorted = (a: readonly string[]) => [...a].sort(compareText);
const sameSet = (a: readonly string[], b: readonly string[]) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const stable = (v: unknown): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  const o = v as Record<string, unknown>;
  const entries = Object.keys(o).sort(compareText).map(k => {
    const field = `${JSON.stringify(k)}:${stable(o[k])}`;
    return field;
  });
  return `{${entries.join(',')}}`;
};
const hash = (digest: DeltaDigest, data: unknown): string => {
  const payload = `GEF:V12:DELTA_ASSURANCE\n${stable(data)}`;
  return `sha256:${digest(payload)}`;
};
const serialize = (ledger: Omit<DeltaLedger, 'ledgerDigest'>, digest: DeltaDigest): DeltaLedger =>
  ({ ...ledger, ledgerDigest: hash(digest, ledger) });

export function initializeDeltaLedger(workOrderId: string, headSha: string, requiredFinalTests: readonly string[], digest: DeltaDigest): DeltaResult<DeltaLedger> {
  if (!Array.isArray(requiredFinalTests) || !validId(workOrderId) || !S.test(headSha) || requiredFinalTests.length === 0 || requiredFinalTests.length > 2048 ||
      requiredFinalTests.some(id => !validId(id)) || new Set(requiredFinalTests).size !== requiredFinalTests.length) return fail('INVALID_ASSURANCE_INPUT');
  const ledger = serialize({ workOrderId, headSha, requiredFinalTests: sorted(requiredFinalTests), records: [] }, digest);
  return D.test(ledger.ledgerDigest) ? ok(ledger) : fail('INVALID_DIGEST_PORT');
}
/** An imported receipt must prove its complete original attempt sequence, not just a seal. */
export function validateDeltaLedger(ledger: DeltaLedger, digest: DeltaDigest): DeltaResult<true> {
  if (!ledger || !validId(ledger.workOrderId) || !S.test(ledger.headSha) ||
      !Array.isArray(ledger.requiredFinalTests) || ledger.requiredFinalTests.length === 0 ||
      ledger.requiredFinalTests.length > 2048 ||
      ledger.requiredFinalTests.some(id => !validId(id)) ||
      !sameSet(ledger.requiredFinalTests, [...new Set(ledger.requiredFinalTests)]) ||
      !Array.isArray(ledger.records) || ledger.records.length > ledger.requiredFinalTests.length ||
      ledger.records.some(r => !r || typeof r !== 'object') ||
      !sameSet(ledger.records.map(r => r.testId), [...new Set(ledger.records.map(r => r.testId))]))
    return fail('LEDGER_STRUCTURE_INVALID');
  const seenAttempts = new Set<string>();
  for (const record of ledger.records) {
    if (!record || !validId(record.testId) || !ledger.requiredFinalTests.includes(record.testId) ||
        !Array.isArray(record.attempts) || record.attempts.length < 1 || record.attempts.length > 8)
      return fail('LEDGER_STRUCTURE_INVALID');
    for (const attempt of record.attempts) {
      if (!attempt || !validId(attempt.attemptId) || seenAttempts.has(attempt.attemptId) ||
          attempt.testId !== record.testId || attempt.headSha !== ledger.headSha ||
          !D.test(attempt.toolchainDigest) || !D.test(attempt.inputDigest) ||
          !D.test(attempt.evidenceDigest) || !['PASS', 'FAIL'].includes(attempt.observation) ||
          (attempt.observation === 'FAIL' && (!attempt.failureSignature || !validId(attempt.failureSignature))) ||
          (attempt.observation === 'PASS' && attempt.failureSignature !== null))
        return fail('LEDGER_ATTEMPT_INVALID');
      seenAttempts.add(attempt.attemptId);
    }
    const expectedFirst = record.attempts.find((a: DeltaAttempt) => a.observation === 'FAIL') ?? null;
    if (JSON.stringify(record.firstFailure) !== JSON.stringify(expectedFirst) ||
        record.classification !== classifyDeltaAttempts(record.attempts))
      return fail('LEDGER_FAILURE_HISTORY_INCONSISTENT');
  }
  const body = { workOrderId: ledger.workOrderId, headSha: ledger.headSha, requiredFinalTests: ledger.requiredFinalTests, records: ledger.records };
  if (hash(digest, body) !== ledger.ledgerDigest || !D.test(ledger.ledgerDigest)) return fail('LEDGER_TAMPERED');
  return ok(true);
}

/** Observe only matching inputs and toolchains before classifying nondeterminism. */
function classifyDeltaAttempts(attempts: readonly DeltaAttempt[]): DeltaClassification {
  const firstFailure = attempts.find(a => a.observation === 'FAIL');
  if (!firstFailure) return 'NO_FAILURE';
  const exact = attempts.filter(a => a.inputDigest === firstFailure.inputDigest &&
    a.toolchainDigest === firstFailure.toolchainDigest);
  const mixed = exact.some(a => a.observation === 'PASS') && exact.some(a => a.observation === 'FAIL');
  if (mixed) return exact.length >= 3 ? 'FLAKE_CONFIRMED' : 'FLAKE_CANDIDATE';
  return attempts.length > 1 && attempts.every(a => a.observation === 'FAIL' &&
    a.failureSignature === firstFailure.failureSignature &&
    a.inputDigest === firstFailure.inputDigest && a.toolchainDigest === firstFailure.toolchainDigest)
    ? 'DETERMINISTIC_FAILURE' : 'UNKNOWN';
}

export function addDeltaAttempt(ledger: DeltaLedger, attempt: DeltaAttempt, digest: DeltaDigest): DeltaResult<DeltaLedger> {
  const verified = validateDeltaLedger(ledger, digest);
  if (!verified.ok) return verified;
  if (!attempt || !validId(attempt.testId) || !validId(attempt.attemptId) || !D.test(attempt.toolchainDigest) ||
      !D.test(attempt.inputDigest) || !D.test(attempt.evidenceDigest) || attempt.headSha !== ledger.headSha ||
      !['PASS', 'FAIL'].includes(attempt.observation) ||
      (attempt.observation === 'FAIL' && (!attempt.failureSignature || !validId(attempt.failureSignature))) ||
      (attempt.observation === 'PASS' && attempt.failureSignature !== null)) return fail('ATTEMPT_BINDING_INVALID');
  if (!ledger.requiredFinalTests.includes(attempt.testId)) return fail('TEST_NOT_ADMITTED');
  if (ledger.records.some(r => r.attempts.some(a => a.attemptId === attempt.attemptId))) return fail('DUPLICATE_ATTEMPT');
  const prev = ledger.records.find(r => r.testId === attempt.testId);
  if ((prev?.attempts.length ?? 0) >= 8) return fail('RETRY_BUDGET_EXHAUSTED');
  const attempts = [...(prev?.attempts ?? []), attempt];
  const firstFailure = prev?.firstFailure ?? (attempt.observation === 'FAIL' ? attempt : null);
  // A passing retry cannot erase the original failing attempt or its identity.
  const classification = classifyDeltaAttempts(attempts);
  const record: DeltaRecord = { testId: attempt.testId, firstFailure, attempts, classification };
  const records = [...ledger.records.filter(r => r.testId !== attempt.testId), record].sort((a, b) => compareText(a.testId, b.testId));
  return ok(serialize({ workOrderId: ledger.workOrderId, headSha: ledger.headSha, requiredFinalTests: ledger.requiredFinalTests, records }, digest));
}

interface DeltaImpactChecker {
  invalidated(id: string): boolean;
  incomplete(): boolean;
}

function createDeltaImpactChecker(
  proofDependencies: Readonly<Record<string, readonly string[]>>,
  changedDependencies: readonly string[],
): DeltaImpactChecker {
  const changed = new Set(changedDependencies);
  const closureMemo = new Map<string, boolean>();
  const visiting = new Set<string>();
  let traversed = 0;
  let unknown = false;

  function invalidated(id: string): boolean {
    if (closureMemo.has(id)) return closureMemo.get(id)!;
    if (visiting.has(id)) throw new Error('DEPENDENCY_GRAPH_CYCLE');
    if (++traversed > 16384) throw new Error('DEPENDENCY_GRAPH_BUDGET');
    visiting.add(id);
    const deps = Object.hasOwn(proofDependencies, id) ? proofDependencies[id] : undefined;
    if (deps === undefined) {
      if (!changed.has(id)) unknown = true;
      visiting.delete(id);
      closureMemo.set(id, true);
      return true;
    }
    let dirty = changed.has(id);
    for (const dep of deps) {
      if (invalidated(dep)) dirty = true;
    }
    visiting.delete(id);
    closureMemo.set(id, dirty);
    return dirty;
  }
  return { invalidated, incomplete: () => unknown };
}

/** Computes dependency-closure invalidation; never exempts required final tests. */
export function evaluateDeltaAssurance(ledger: DeltaLedger, currentHeadSha: string,
  proofDependencies: Readonly<Record<string, readonly string[]>>,
  changedDependencies: readonly string[], digest: DeltaDigest): DeltaResult<DeltaAssuranceVerdict> {
  const verified = validateDeltaLedger(ledger, digest);
  if (!verified.ok) return verified;
  if (currentHeadSha !== ledger.headSha) return fail('STALE_HEAD');
  if (!proofDependencies || !Array.isArray(changedDependencies)) return fail('UNKNOWN_DEPENDENCY');
  // The graph is bounded and traversed through all known intermediate proof nodes:
  // direct-only checking can reuse a stale proof when its transitive source changed.
  const entries = Object.entries(proofDependencies);
  if (entries.length > 4096 || changedDependencies.length > 4096 ||
      changedDependencies.some(s => !validId(s)) ||
      entries.some(([id, xs]) => !validId(id) || !Array.isArray(xs) || xs.length > 4096 || xs.some(s => !validId(s))))
    return fail('UNKNOWN_DEPENDENCY');
  const impact = createDeltaImpactChecker(proofDependencies, changedDependencies);
  const carried: string[] = [];
  const reusable: string[] = [];
  let incomplete = false;
  try {
    for (const id of ledger.requiredFinalTests) {
      const record = ledger.records.find(r => r.testId === id);
      if (!record?.attempts.length) { incomplete = true; continue; }
      if (record.firstFailure !== null) carried.push(id);
      const deps = proofDependencies[id];
      if (!deps) { incomplete = true; continue; } // Unknown impact blocks reuse
      // Always traverse the complete graph, including tests that failed first.
      // A historical failure must never mask a different test's unknown leaf
      // or a cyclic dependency, even when that first failure was later repaired.
      const invalidated = impact.invalidated(id);
      const final = record.attempts.at(-1)!;
      if (record.firstFailure === null && final.observation === 'PASS' && !invalidated) reusable.push(id);
    }
  } catch (error) {
    return fail(error instanceof Error && error.message === 'DEPENDENCY_GRAPH_CYCLE' ? 'DEPENDENCY_GRAPH_CYCLE' : 'DEPENDENCY_GRAPH_BUDGET');
  }
  let state: DeltaAssuranceVerdict['state'] = 'READY_FOR_FINAL_ASSURANCE';
  // Incomplete/unknown dependency knowledge outranks a retained failure:
  // otherwise the final closure caller may mistake CORRECTION_REQUIRED for
  // an independently repairable state and promote an incomplete proof graph.
  if (incomplete || impact.incomplete()) state = 'BLOCKED';
  else if (carried.length > 0) state = 'CORRECTION_REQUIRED';
  return ok({ state,
    requiredFinalTests: ledger.requiredFinalTests, carriedFirstFailures: carried,
    evidenceReuseAllowed: reusable });
}

/**
 * M26 integration boundary: conservatively import REQUIRED test obligations,
 * never PASS evidence. The caller MUST verify the Bug Proof receipt with M26
 * before invoking this projection; this function grants no proof authority.
 */
export function initializeDeltaLedgerFromBugProof(
  receipt: BugProofReceipt,
  workOrderId: string,
  headSha: string,
  digest: DeltaDigest,
): DeltaResult<DeltaLedger> {
  if (!receipt?.projectId || !receipt.sourceIdentityDigest ||
      !receipt.testImpactHandoffDigest || !receipt.receiptDigest ||
      !['READY', 'WIDENED'].includes(receipt.testImpactState) ||
      !Array.isArray(receipt.mandatoryTargetIds) ||
      !Array.isArray(receipt.finalAssuranceTargetIds) ||
      !Array.isArray(receipt.unresolvedTestIds) ||
      receipt.unresolvedTestIds.length !== 0 ||
      !['NONE', 'LOCAL', 'BOUNDARY'].includes(receipt.testImpactUncertainty))
    return fail('BUG_PROOF_NOT_READY');

  const mandatory = [...new Set([
    ...receipt.mandatoryTargetIds,
    ...receipt.finalAssuranceTargetIds,
  ])].sort(compareText);
  if (mandatory.length === 0) return fail('BUG_PROOF_FINAL_TESTS_MISSING');
  // No attempts are imported: none can be treated as verified without a
  // matching exact-HEAD, toolchain and independent provider evidence receipt.
  return initializeDeltaLedger(workOrderId, headSha, mandatory, digest);
}
