/** U12-05: immutable first-failure ledger and conservative assurance reuse. */
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
const ok = <T>(value: T): DeltaResult<T> => ({ ok: true, value });
const fail = <T>(code: string): DeltaResult<T> => ({ ok: false, code });
const sorted = (a: readonly string[]) => [...a].sort();
const sameSet = (a: readonly string[], b: readonly string[]) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const stable = (v: unknown): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`;
};
const hash = (digest: DeltaDigest, data: unknown) => `sha256:${digest(`GEF:V12:DELTA_ASSURANCE\n${stable(data)}`)}`;
const serialize = (ledger: Omit<DeltaLedger, 'ledgerDigest'>, digest: DeltaDigest): DeltaLedger =>
  ({ ...ledger, ledgerDigest: hash(digest, ledger) });

export function initializeDeltaLedger(workOrderId: string, headSha: string, requiredFinalTests: readonly string[], digest: DeltaDigest): DeltaResult<DeltaLedger> {
  if (!ID.test(workOrderId) || !S.test(headSha) || requiredFinalTests.length === 0 || requiredFinalTests.length > 2048 ||
      requiredFinalTests.some(id => !ID.test(id)) || new Set(requiredFinalTests).size !== requiredFinalTests.length) return fail('INVALID_ASSURANCE_INPUT');
  const ledger = serialize({ workOrderId, headSha, requiredFinalTests: sorted(requiredFinalTests), records: [] }, digest);
  return D.test(ledger.ledgerDigest) ? ok(ledger) : fail('INVALID_DIGEST_PORT');
}
export function validateDeltaLedger(ledger: DeltaLedger, digest: DeltaDigest): DeltaResult<true> {
  if (!ID.test(ledger.workOrderId) || !S.test(ledger.headSha) || ledger.requiredFinalTests.length === 0 ||
      !sameSet(ledger.requiredFinalTests, [...new Set(ledger.requiredFinalTests)]) ||
      ledger.records.some(r => !ID.test(r.testId) || r.attempts.length > 32 || r.attempts.some(a => a.testId !== r.testId || a.headSha !== ledger.headSha)) ||
      !sameSet(ledger.records.map(r => r.testId), [...new Set(ledger.records.map(r => r.testId))])) return fail('LEDGER_STRUCTURE_INVALID');
  const body = { workOrderId: ledger.workOrderId, headSha: ledger.headSha, requiredFinalTests: ledger.requiredFinalTests, records: ledger.records };
  if (hash(digest, body) !== ledger.ledgerDigest || !D.test(ledger.ledgerDigest)) return fail('LEDGER_TAMPERED');
  return ok(true);
}
export function addDeltaAttempt(ledger: DeltaLedger, attempt: DeltaAttempt, digest: DeltaDigest): DeltaResult<DeltaLedger> {
  const verified = validateDeltaLedger(ledger, digest);
  if (!verified.ok) return verified;
  if (!ID.test(attempt.testId) || !ID.test(attempt.attemptId) || !D.test(attempt.toolchainDigest) ||
      !D.test(attempt.inputDigest) || !D.test(attempt.evidenceDigest) || attempt.headSha !== ledger.headSha ||
      !['PASS', 'FAIL'].includes(attempt.observation) ||
      (attempt.observation === 'FAIL' && (!attempt.failureSignature || !ID.test(attempt.failureSignature))) ||
      (attempt.observation === 'PASS' && attempt.failureSignature !== null)) return fail('ATTEMPT_BINDING_INVALID');
  if (!ledger.requiredFinalTests.includes(attempt.testId)) return fail('TEST_NOT_ADMITTED');
  if (ledger.records.some(r => r.attempts.some(a => a.attemptId === attempt.attemptId))) return fail('DUPLICATE_ATTEMPT');
  const prev = ledger.records.find(r => r.testId === attempt.testId);
  if ((prev?.attempts.length ?? 0) >= 8) return fail('RETRY_BUDGET_EXHAUSTED');
  const attempts = [...(prev?.attempts ?? []), attempt];
  const firstFailure = prev?.firstFailure ?? (attempt.observation === 'FAIL' ? attempt : null);
  // A passing retry cannot erase the earliest failing proof. Mixed observations
  // with identical input/toolchain indicate nondeterminism, not an automatic PASS.
  const exact = attempts.filter(a => a.inputDigest === attempt.inputDigest && a.toolchainDigest === attempt.toolchainDigest);
  const mixed = exact.some(a => a.observation === 'PASS') && exact.some(a => a.observation === 'FAIL');
  const classification: DeltaClassification = firstFailure === null ? 'NO_FAILURE' :
    mixed && exact.length >= 3 ? 'FLAKE_CONFIRMED' : mixed ? 'FLAKE_CANDIDATE' :
    attempts.length > 1 && attempts.every(a => a.observation === 'FAIL' &&
      a.failureSignature === firstFailure.failureSignature && a.inputDigest === firstFailure.inputDigest &&
      a.toolchainDigest === firstFailure.toolchainDigest) ? 'DETERMINISTIC_FAILURE' : 'UNKNOWN';
  const record: DeltaRecord = { testId: attempt.testId, firstFailure, attempts, classification };
  const records = [...ledger.records.filter(r => r.testId !== attempt.testId), record].sort((a, b) => a.testId.localeCompare(b.testId));
  return ok(serialize({ workOrderId: ledger.workOrderId, headSha: ledger.headSha, requiredFinalTests: ledger.requiredFinalTests, records }, digest));
}

/** Computes dependency-closure invalidation; never exempts required final tests. */
export function evaluateDeltaAssurance(ledger: DeltaLedger, currentHeadSha: string,
  proofDependencies: Readonly<Record<string, readonly string[]>>,
  changedDependencies: readonly string[], digest: DeltaDigest): DeltaResult<DeltaAssuranceVerdict> {
  const verified = validateDeltaLedger(ledger, digest);
  if (!verified.ok) return verified;
  if (currentHeadSha !== ledger.headSha) return fail('STALE_HEAD');
  // The graph is bounded and traversed through all known intermediate proof nodes:
  // direct-only checking can reuse a stale proof when its transitive source changed.
  const entries = Object.entries(proofDependencies);
  if (entries.length > 4096 || changedDependencies.length > 4096 ||
      changedDependencies.some(s => !ID.test(s)) ||
      entries.some(([id, xs]) => !ID.test(id) || !Array.isArray(xs) || xs.length > 4096 || xs.some(s => !ID.test(s))))
    return fail('UNKNOWN_DEPENDENCY');
  const changed = new Set(changedDependencies), carried: string[] = [], reusable: string[] = [];
  let incomplete = false;
  const closureMemo = new Map<string, boolean>();
  const visiting = new Set<string>();
  let traversed = 0;
  function invalidated(id: string): boolean {
    if (changed.has(id)) return true;
    if (closureMemo.has(id)) return closureMemo.get(id)!;
    if (visiting.has(id)) throw new Error('DEPENDENCY_GRAPH_CYCLE');
    if (++traversed > 16384) throw new Error('DEPENDENCY_GRAPH_BUDGET');
    visiting.add(id);
    const deps = Object.prototype.hasOwnProperty.call(proofDependencies, id) ? proofDependencies[id] : undefined;
    const result = deps !== undefined && deps.some(d => invalidated(d));
    visiting.delete(id);
    closureMemo.set(id, result);
    return result;
  }
  try {
    for (const id of ledger.requiredFinalTests) {
      const record = ledger.records.find(r => r.testId === id);
      if (!record?.attempts.length) { incomplete = true; continue; }
      if (record.firstFailure !== null) carried.push(id);
      const deps = proofDependencies[id];
      if (!deps) { incomplete = true; continue; } // Unknown impact blocks reuse
      const final = record.attempts[record.attempts.length - 1]!;
      if (record.firstFailure === null && final.observation === 'PASS' && !invalidated(id)) reusable.push(id);
    }
  } catch (error) {
    return fail(error instanceof Error && error.message === 'DEPENDENCY_GRAPH_CYCLE' ? 'DEPENDENCY_GRAPH_CYCLE' : 'DEPENDENCY_GRAPH_BUDGET');
  }
  return ok({ state: carried.length ? 'CORRECTION_REQUIRED' : incomplete ? 'BLOCKED' : 'READY_FOR_FINAL_ASSURANCE',
    requiredFinalTests: ledger.requiredFinalTests, carriedFirstFailures: carried,
    evidenceReuseAllowed: reusable });
}
