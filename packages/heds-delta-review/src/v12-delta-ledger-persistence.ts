/**
 * U12-05: fail-closed verified evidence and durable compare-and-swap adapter.
 * Neither this adapter nor the in-memory ledger creates provider evidence.
 * Callers supply an independent trusted verifier and an atomic durable store.
 */
import { addDeltaAttempt, initializeDeltaLedger, validateDeltaLedger } from './v12-delta-assurance.js';
import type { DeltaAttempt, DeltaDigest, DeltaLedger, DeltaResult } from './v12-delta-assurance.js';

export interface DeltaLedgerStore {
  read(workOrderId: string, headSha: string): Promise<DeltaLedger | null>;
  /** Must compare the previous digest and commit the next ledger atomically and durably. */
  compareAndSwap(
    workOrderId: string, headSha: string, expectedDigest: string, next: DeltaLedger,
  ): Promise<boolean>;
  /** Optional durable create-if-absent, never read-then-overwrite. */
  createIfAbsent?(workOrderId: string, headSha: string, initial: DeltaLedger): Promise<boolean>;
}

/** Verified identities are mandatory; a bare boolean is never sufficient. */
export interface DeltaVerifiedEvidenceReceipt {
  readonly verified: true;
  readonly testId: string;
  readonly attemptId: string;
  readonly headSha: string;
  readonly toolchainDigest: string;
  readonly inputDigest: string;
  readonly evidenceDigest: string;
}

export interface DeltaEvidenceAuthority {
  verify(ledger: DeltaLedger, attempt: DeltaAttempt): Promise<DeltaVerifiedEvidenceReceipt | null>;
}

/** Create a never-before-seen ledger. Existing snapshots must be recovered. */
export async function initializeDurableDeltaLedger(
  store: DeltaLedgerStore,
  workOrderId: string,
  headSha: string,
  requiredFinalTests: readonly string[],
  digest: DeltaDigest,
): Promise<DeltaResult<DeltaLedger>> {
  if (!store || typeof store.createIfAbsent !== 'function')
    return { ok: false, code: 'DELTA_ATOMIC_CREATE_REQUIRED' };
  const initial = initializeDeltaLedger(workOrderId, headSha, requiredFinalTests, digest);
  if (!initial.ok) return initial;
  try {
    if (!await store.createIfAbsent(workOrderId, headSha, initial.value))
      return { ok: false, code: 'DELTA_LEDGER_EXISTS_REQUIRES_RECOVERY' };
    return initial;
  } catch {
    return { ok: false, code: 'DELTA_PERSISTENCE_UNAVAILABLE' };
  }
}

/**
 * Record a single independently attested attempt under optimistic concurrency.
 * A failed lookup, stale HEAD, forged identity or CAS conflict never alters
 * durable data. The first failure remains part of every future ledger version.
 */
export async function recordVerifiedDeltaAttempt(
  store: DeltaLedgerStore,
  authority: DeltaEvidenceAuthority,
  workOrderId: string,
  attempt: DeltaAttempt,
  currentHeadSha: string,
  digest: DeltaDigest,
): Promise<DeltaResult<DeltaLedger>> {
  if (!store || typeof store.read !== 'function' ||
      typeof store.compareAndSwap !== 'function' ||
      !authority || typeof authority.verify !== 'function' ||
      !attempt || typeof workOrderId !== 'string' ||
      typeof currentHeadSha !== 'string')
    return { ok: false, code: 'DELTA_PORT_MISSING' };
  if (attempt.headSha !== currentHeadSha)
    return { ok: false, code: 'DELTA_STALE_HEAD' };

  let previous: DeltaLedger | null;
  try {
    // Attempt IDs cannot authorize replay on their own. Read and validate
    // the actual durable ledger, then validate the candidate transition.
    previous = await store.read(workOrderId, currentHeadSha);
  } catch {
    return { ok: false, code: 'DELTA_PERSISTENCE_UNAVAILABLE' };
  }
  if (!previous)
    return { ok: false, code: 'DELTA_LEDGER_MISSING_REQUIRES_RECOVERY' };
  const checked = validateDeltaLedger(previous, digest);
  if (!checked.ok) return checked;
  if (previous.workOrderId !== workOrderId || previous.headSha !== currentHeadSha)
    return { ok: false, code: 'DELTA_STALE_HEAD' };
  const candidate = addDeltaAttempt(previous, attempt, digest);
  if (!candidate.ok) return candidate;

  let receipt: DeltaVerifiedEvidenceReceipt | null;
  try {
    receipt = await authority.verify(previous, attempt);
  } catch {
    return { ok: false, code: 'DELTA_EVIDENCE_UNAVAILABLE' };
  }
  if (!receipt || receipt.verified !== true ||
      receipt.testId !== attempt.testId ||
      receipt.attemptId !== attempt.attemptId ||
      receipt.headSha !== attempt.headSha ||
      receipt.toolchainDigest !== attempt.toolchainDigest ||
      receipt.inputDigest !== attempt.inputDigest ||
      receipt.evidenceDigest !== attempt.evidenceDigest)
    return { ok: false, code: 'DELTA_EVIDENCE_NOT_VERIFIED' };
  try {
    const stored = await store.compareAndSwap(
      previous.workOrderId, previous.headSha, previous.ledgerDigest, candidate.value,
    );
    if (!stored) return { ok: false, code: 'DELTA_PERSISTENCE_CAS_CONFLICT' };
    return candidate;
  } catch {
    return { ok: false, code: 'DELTA_PERSISTENCE_UNAVAILABLE' };
  }
}
