/**
 * U12-05: trace a repair hypothesis to the FIRST recorded failing evidence.
 * This is only a proposal, never a declaration that a bug is fixed.
 */
import { validateDeltaLedger } from './v12-delta-assurance.js';
import type { DeltaDigest, DeltaLedger, DeltaResult } from './v12-delta-assurance.js';

export interface DeltaRootCauseHypothesis {
  readonly testId: string;
  readonly firstFailureAttemptId: string;
  readonly firstFailureEvidenceDigest: string;
  readonly causeDependencyId: string;
  readonly reason: string;
}

export interface DeltaRootCauseAssessment {
  readonly status: 'HYPOTHESIS_ONLY';
  readonly testId: string;
  readonly firstFailureAttemptId: string;
  readonly firstFailureEvidenceDigest: string;
  readonly causeDependencyId: string;
  readonly reason: string;
  readonly classification: string;
  readonly finalTestsRequired: readonly string[];
  readonly independentRepairProofRequired: true;
}

const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const validId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
const err = <T>(code: string): DeltaResult<T> => ({ ok: false, code });

/**
 * The candidate cause must be a declared dependency of the failing test.
 * An unknown edge, stale first-failure identity, or cyclic proof DAG fails
 * closed, even if a later retry has passed.
 */
export function assessDeltaRootCause(
  ledger: DeltaLedger,
  hypothesis: DeltaRootCauseHypothesis,
  proofDependencies: Readonly<Record<string, readonly string[]>>,
  changedDependencies: readonly string[],
  digest: DeltaDigest,
): DeltaResult<DeltaRootCauseAssessment> {
  const validated = validateDeltaLedger(ledger, digest);
  if (!validated.ok) return err(validated.code);
  if (!hypothesis || !validId(hypothesis.testId) ||
      !validId(hypothesis.firstFailureAttemptId) ||
      !validId(hypothesis.causeDependencyId) ||
      typeof hypothesis.firstFailureEvidenceDigest !== 'string' ||
      typeof hypothesis.reason !== 'string' ||
      hypothesis.reason.trim().length === 0 || hypothesis.reason.length > 1000 ||
      !proofDependencies || !Array.isArray(changedDependencies) ||
      changedDependencies.length > 4096 ||
      changedDependencies.some(v => !validId(v)))
    return err('ROOT_CAUSE_INPUT_INVALID');

  const record = ledger.records.find(r => r.testId === hypothesis.testId);
  if (!record?.firstFailure) return err('FIRST_FAILURE_MISSING');
  if (record.firstFailure.attemptId !== hypothesis.firstFailureAttemptId ||
      record.firstFailure.evidenceDigest !== hypothesis.firstFailureEvidenceDigest)
    return err('FIRST_FAILURE_BINDING_MISMATCH');
  if (!changedDependencies.includes(hypothesis.causeDependencyId))
    return err('CAUSE_NOT_IN_CHANGE_SET');

  const entries = Object.entries(proofDependencies);
  if (entries.length > 4096 || entries.some(([key, deps]) =>
      !validId(key) || !Array.isArray(deps) || deps.length > 4096 ||
      deps.some(v => !validId(v)))) return err('PROOF_GRAPH_INVALID');

  const visiting = new Set<string>();
  const visited = new Set<string>();
  let matched = false;
  let traversed = 0;
  function walk(id: string): string | null {
    if (visiting.has(id)) return 'PROOF_GRAPH_CYCLE';
    if (visited.has(id)) return null;
    if (++traversed > 16384) return 'PROOF_GRAPH_BUDGET';
    const deps = Object.prototype.hasOwnProperty.call(proofDependencies, id)
      ? proofDependencies[id] : undefined;
    if (deps === undefined && !changedDependencies.includes(id))
      return 'UNKNOWN_PROOF_DEPENDENCY';
    visiting.add(id);
    if (id === hypothesis.causeDependencyId) matched = true;
    // Never stop after finding the cause: sibling edges may still be invalid.
    for (const dep of deps ?? []) {
      const error = walk(dep);
      if (error) return error;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  }
  const traversalError = walk(hypothesis.testId);
  if (traversalError) return err(traversalError);
  if (!matched) return err('CAUSE_NOT_IN_PROOF_CLOSURE');

  return { ok: true, value: {
    status: 'HYPOTHESIS_ONLY',
    testId: hypothesis.testId,
    firstFailureAttemptId: record.firstFailure.attemptId,
    firstFailureEvidenceDigest: record.firstFailure.evidenceDigest,
    causeDependencyId: hypothesis.causeDependencyId,
    reason: hypothesis.reason,
    classification: record.classification,
    finalTestsRequired: ledger.requiredFinalTests,
    independentRepairProofRequired: true,
  } };
}
