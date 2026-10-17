/**
 * GBS-V12-WO-003 / U12-05: conservative read-only final assurance handoff.
 *
 * M24 evidence, M25 proof, M27 assurance and M28 test impact remain the
 * authorities for their respective domains. This module does not issue their
 * attestations, grant release/merge rights, or treat a retry as a repair.
 */
import { evaluateDeltaAssurance, validateDeltaLedger } from './v12-delta-assurance.js';
import type { DeltaAttempt, DeltaDigest, DeltaLedger, DeltaRecord, DeltaResult } from './v12-delta-assurance.js';
import { assessDeltaRootCause } from './v12-delta-root-cause.js';
import type { DeltaRootCauseHypothesis } from './v12-delta-root-cause.js';
import type { DeltaLedgerStore } from './v12-delta-ledger-persistence.js';

export type DeltaAssuranceModule = 'M24' | 'M25' | 'M27' | 'M28';
export type DeltaFinalState = 'BLOCKED' | 'CORRECTION_REQUIRED' | 'READY_FOR_INDEPENDENT_REVIEW';

export interface DeltaModuleArtifact {
  readonly module: DeltaAssuranceModule;
  readonly artifactDigest: string;
  /** Passed to the real module verifier, never trusted directly. */
  readonly payload: unknown;
}
export interface DeltaModuleAttestation {
  readonly verified: true;
  readonly module: DeltaAssuranceModule;
  readonly workOrderId: string;
  readonly headSha: string;
  readonly artifactDigest: string;
  readonly verdict: 'PASS';
}
export interface DeltaVerifiedFinalTest {
  readonly verified: true;
  readonly workOrderId: string;
  readonly headSha: string;
  readonly testId: string;
  readonly attemptId: string;
  readonly evidenceDigest: string;
  readonly inputDigest: string;
  readonly toolchainDigest: string;
  readonly observation: 'PASS';
}
export interface DeltaRepairClaim {
  readonly hypothesis: DeltaRootCauseHypothesis;
  readonly repairEvidenceDigest: string;
  readonly finalAttemptId: string;
}
export interface DeltaVerifiedRepair {
  readonly verified: true;
  readonly workOrderId: string;
  readonly headSha: string;
  readonly testId: string;
  readonly firstFailureAttemptId: string;
  readonly firstFailureEvidenceDigest: string;
  readonly causeDependencyId: string;
  readonly repairEvidenceDigest: string;
  readonly finalAttemptId: string;
}
export interface DeltaFinalClosurePorts {
  /** Caller installs independent M24/M25/M27/M28 verifier implementations. */
  verifyModule(artifact: DeltaModuleArtifact): Promise<DeltaModuleAttestation | null>;
  /** Must check authoritative exact-HEAD provider test receipts, not ledger text. */
  verifyFinalTest(record: DeltaRecord, attempt: DeltaAttempt): Promise<DeltaVerifiedFinalTest | null>;
  /** Must check causal repair against independent source/proof attestation. */
  verifyRepair(record: DeltaRecord, claim: DeltaRepairClaim): Promise<DeltaVerifiedRepair | null>;
}
export interface DeltaFinalClosureInput {
  readonly workOrderId: string;
  readonly headSha: string;
  readonly proofDependencies: Readonly<Record<string, readonly string[]>>;
  readonly changedDependencies: readonly string[];
  /** Full, not selective: M28's selected intermediate tests cannot replace this. */
  readonly requiredFinalTests: readonly string[];
  readonly modules: readonly DeltaModuleArtifact[];
  readonly repairs: readonly DeltaRepairClaim[];
  /** Final mandatory full sweep is required regardless of reusable intermediate proofs. */
  readonly fullFinalSweepPerformed: boolean;
}
export interface DeltaFinalClosureDecision {
  readonly state: DeltaFinalState;
  readonly headSha: string;
  readonly workOrderId: string;
  readonly ledgerDigest: string;
  readonly firstFailureTestIds: readonly string[];
  readonly requiredFinalTests: readonly string[];
  readonly moduleProofDigests: readonly string[];
  readonly repairsIndependentlyVerified: readonly string[];
  readonly finalTestsIndependentlyVerified: readonly string[];
  readonly mayPromoteCheckpoint: false;
  readonly mayMerge: false;
  readonly mayPublish: false;
  readonly requiresIndependentReview: true;
}

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const MODULES = ['M24', 'M25', 'M27', 'M28'] as const;
const bad = <T>(code: string): DeltaResult<T> => ({ ok: false, code });
const setEquals = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && new Set(a).size === a.length &&
  new Set(b).size === b.length && a.every(v => b.includes(v));
const allowedModules = (v: unknown): v is DeltaAssuranceModule =>
  typeof v === 'string' && MODULES.some(m => m === v);

/**
 * Evaluates real durable state only. Every final PASS must be independently
 * verified; an old FIRST FAILURE requires independently attested causal repair.
 *
 * A successful result is NOT assurance approval: the result is a candidate for
 * independent review and the later governed release gates.
 */
export async function evaluateDeltaFinalClosure(
  store: DeltaLedgerStore, input: DeltaFinalClosureInput,
  ports: DeltaFinalClosurePorts, digest: DeltaDigest,
): Promise<DeltaResult<DeltaFinalClosureDecision>> {
  if (!store || typeof store.read !== 'function' || !input || !ports ||
      typeof ports.verifyModule !== 'function' ||
      typeof ports.verifyFinalTest !== 'function' ||
      typeof ports.verifyRepair !== 'function' ||
      !Array.isArray(input.modules) || !Array.isArray(input.repairs) ||
      !Array.isArray(input.requiredFinalTests))
    return bad('DELTA_FINAL_PORT_OR_INPUT_MISSING');

  let ledger: DeltaLedger | null;
  try { ledger = await store.read(input.workOrderId, input.headSha); }
  catch { return bad('DELTA_FINAL_STORAGE_UNAVAILABLE'); }
  if (!ledger) return bad('DELTA_FINAL_LEDGER_MISSING');
  const valid = validateDeltaLedger(ledger, digest);
  if (!valid.ok) return valid;
  if (ledger.workOrderId !== input.workOrderId || ledger.headSha !== input.headSha)
    return bad('DELTA_FINAL_STALE_HEAD_OR_WO');
  if (!setEquals(input.requiredFinalTests, ledger.requiredFinalTests))
    return bad('DELTA_FINAL_MANDATORY_TEST_MISMATCH');
  if (input.fullFinalSweepPerformed !== true)
    return bad('DELTA_FINAL_SWEEP_REQUIRED');

  const prelim = evaluateDeltaAssurance(
    ledger, input.headSha, input.proofDependencies, input.changedDependencies, digest,
  );
  if (!prelim.ok) return prelim;
  if (prelim.value.state === 'BLOCKED') return bad('DELTA_FINAL_IMPACT_UNKNOWN');

  // Fail closed on missing/duplicated modules, invalid digests, or forged keys.
  if (input.modules.length !== MODULES.length ||
      new Set(input.modules.map(m => m?.module)).size !== MODULES.length ||
      input.modules.some(m => !m || !allowedModules(m.module) || !DIGEST.test(m.artifactDigest) || m.payload === undefined))
    return bad('DELTA_FINAL_MODULE_SET_INVALID');

  const modules: DeltaModuleAttestation[] = [];
  for (const artifact of input.modules) {
    let proof: DeltaModuleAttestation | null;
    try { proof = await ports.verifyModule(artifact); }
    catch { return bad('DELTA_FINAL_MODULE_PROOF_UNAVAILABLE'); }
    if (proof?.verified !== true || proof.module !== artifact.module ||
        proof.workOrderId !== input.workOrderId || proof.headSha !== input.headSha ||
        proof.artifactDigest !== artifact.artifactDigest || proof.verdict !== 'PASS')
      return bad('DELTA_FINAL_MODULE_PROOF_NOT_VERIFIED');
    modules.push(proof);
  }

  // Each final test must have a FRESH separately verified successful attempt.
  // Retrying cannot by itself clear the first failure or waive security gates.
  const verifiedFinals: string[] = [];
  for (const testId of ledger.requiredFinalTests) {
    const record = ledger.records.find(r => r.testId === testId);
    const attempt = record?.attempts.at(-1);
    if (!record || !attempt || attempt.observation !== 'PASS')
      return bad('DELTA_FINAL_REQUIRED_TEST_NOT_PASSING');
    let proof: DeltaVerifiedFinalTest | null;
    try { proof = await ports.verifyFinalTest(record, attempt); }
    catch { return bad('DELTA_FINAL_TEST_PROOF_UNAVAILABLE'); }
    if (proof?.verified !== true || proof.workOrderId !== input.workOrderId ||
        proof.headSha !== input.headSha || proof.testId !== testId ||
        proof.attemptId !== attempt.attemptId ||
        proof.evidenceDigest !== attempt.evidenceDigest ||
        proof.inputDigest !== attempt.inputDigest ||
        proof.toolchainDigest !== attempt.toolchainDigest ||
        proof.observation !== 'PASS')
      return bad('DELTA_FINAL_TEST_PROOF_NOT_VERIFIED');
    verifiedFinals.push(testId);
  }

  // First failures remain immutable. A root cause is an HYPOTHESIS_ONLY until
  // a distinct trusted repair authority proves it with the final attempt.
  const failed = ledger.records.filter(r => r.firstFailure !== null);
  const repaired: string[] = [];
  if (input.repairs.length !== failed.length ||
      new Set(input.repairs.map(x => x?.hypothesis?.testId)).size !== failed.length)
    return bad('DELTA_FINAL_REPAIR_CLOSURE_MISSING');
  for (const record of failed) {
    const claim = input.repairs.find(x => x?.hypothesis?.testId === record.testId);
    const final = record.attempts.at(-1);
    if (!claim || !final || claim.finalAttemptId !== final.attemptId ||
        !DIGEST.test(claim.repairEvidenceDigest))
      return bad('DELTA_FINAL_REPAIR_BINDING_INVALID');
    const root = assessDeltaRootCause(
      ledger, claim.hypothesis, input.proofDependencies, input.changedDependencies, digest,
    );
    if (!root.ok || root.value.status !== 'HYPOTHESIS_ONLY')
      return bad('DELTA_FINAL_ROOT_CAUSE_UNPROVEN');
    let proof: DeltaVerifiedRepair | null;
    try { proof = await ports.verifyRepair(record, claim); }
    catch { return bad('DELTA_FINAL_REPAIR_PROOF_UNAVAILABLE'); }
    if (proof?.verified !== true || proof.workOrderId !== input.workOrderId ||
        proof.headSha !== input.headSha || proof.testId !== record.testId ||
        proof.firstFailureAttemptId !== record.firstFailure?.attemptId ||
        proof.firstFailureEvidenceDigest !== record.firstFailure?.evidenceDigest ||
        proof.causeDependencyId !== claim.hypothesis.causeDependencyId ||
        proof.repairEvidenceDigest !== claim.repairEvidenceDigest ||
        proof.finalAttemptId !== final.attemptId)
      return bad('DELTA_FINAL_REPAIR_PROOF_NOT_VERIFIED');
    repaired.push(record.testId);
  }

  // Keep the single-host CAS ledger as the source of truth across async ports.
  let after: DeltaLedger | null;
  try { after = await store.read(input.workOrderId, input.headSha); }
  catch { return bad('DELTA_FINAL_STORAGE_UNAVAILABLE'); }
  if (!after || !validateDeltaLedger(after, digest).ok ||
      after.ledgerDigest !== ledger.ledgerDigest)
    return bad('DELTA_FINAL_CONCURRENT_OR_TAMPERED_LEDGER');

  return { ok: true, value: {
    state: 'READY_FOR_INDEPENDENT_REVIEW',
    headSha: input.headSha, workOrderId: input.workOrderId,
    ledgerDigest: ledger.ledgerDigest,
    firstFailureTestIds: failed.map(r => r.testId).sort(),
    requiredFinalTests: [...ledger.requiredFinalTests],
    moduleProofDigests: modules.map(m => m.artifactDigest),
    repairsIndependentlyVerified: repaired.sort(),
    finalTestsIndependentlyVerified: verifiedFinals.sort(),
    mayPromoteCheckpoint: false, mayMerge: false, mayPublish: false,
    requiresIndependentReview: true,
  } };
}
