/**
 * WO-003 / M17+M18 continuity gate. No new executor, provider permission, or
 * checkpoint promotion: this adapter validates real M17/M18 evidence using
 * caller-supplied trusted verifier implementations before local recovery.
 *
 * The existing packages remain independent. Install authentic M17/M18
 * verifiers at the boundary; this module never treats a digest or Boolean
 * supplied by the input artifact itself as evidence.
 */
import { validateMarathonState } from './v12-marathon.js';
import type { MarathonDigest, MarathonPlan, MarathonResult, MarathonState } from './v12-marathon.js';
import { recoverPersistedMarathon } from './v12-marathon-persistence.js';
import type { MarathonRecoveryDecision, MarathonStateStore } from './v12-marathon-persistence.js';

interface MarathonAuthorityBinding {
  readonly bindingId: string;
  readonly semanticIdentity: string;
  readonly required: boolean;
}
export interface MarathonCheckpointWitness {
  readonly checkpointDigest: string;
  readonly projectId: string;
  readonly lineageId: string;
  readonly admittedWorkOrderIds: readonly string[];
  readonly authorityBindings: readonly MarathonAuthorityBinding[];
  readonly blockers: readonly string[];
  readonly nextLegalAction: string;
}
export interface MarathonReadinessWitness {
  readonly checkpointDigest: string;
  readonly certificateDigest: string;
  readonly validity: string;
  readonly ready: boolean;
}
export interface MarathonHandoffWitness {
  readonly checkpointDigest: string;
  readonly projectId: string;
  readonly lineageId: string;
  readonly nextLegalAction: string;
  readonly readinessCertificateDigest: string;
  readonly handoffDigest: string;
}
export interface MarathonResumeWitness {
  readonly checkpointDigest: string;
  readonly projectId: string;
  readonly lineageId: string;
  readonly handoffDigest: string;
  readonly receiptDigest: string;
  readonly status: string;
  readonly nextAction: string | null;
}
export interface MarathonContinuityEvidence {
  readonly checkpoint: MarathonCheckpointWitness;
  readonly readiness: MarathonReadinessWitness;
  readonly handoff: MarathonHandoffWitness;
  readonly resumeReceipt: MarathonResumeWitness;
}
/** Implement these with M17/M18 verify/recompute functions, NOT mock trust. */
export interface MarathonContinuityVerifier {
  verifyCheckpoint(checkpoint: MarathonCheckpointWitness): Promise<boolean>;
  verifyReadiness(
    checkpoint: MarathonCheckpointWitness, readiness: MarathonReadinessWitness,
  ): Promise<boolean>;
  verifyHandoff(handoff: MarathonHandoffWitness): Promise<boolean>;
  verifyResumeReceipt(resume: MarathonResumeWitness): Promise<boolean>;
}
export interface MarathonContinuityDecision {
  readonly checkpointDigest: string;
  readonly resumeReceiptDigest: string;
  readonly planDigest: string;
  readonly stateDigest: string;
  readonly recovery: MarathonRecoveryDecision;
  readonly privilegeGranted: false;
}

const reject = <T>(code: string): MarathonResult<T> => ({ ok: false, code });
const D = /^sha256:[a-f0-9]{64}$/;
const isDigest = (v: unknown): v is string => typeof v === 'string' && D.test(v);

/**
 * Compare the semantic identities used by M17 against the same persisted
 * Marathon state M18 is asked to recover. The base SHA is domain-separated
 * before being stored in an M17 authority semantic digest.
 */
function verifyBinding(
  checkpoint: MarathonCheckpointWitness, plan: MarathonPlan,
  state: MarathonState, digest: MarathonDigest,
): boolean {
  let baseDigest: string;
  try {
    baseDigest = 'sha256:' + digest('GEF:MARATHON_BASE\\n' + plan.baseSha);
  } catch { return false; }
  if (!isDigest(baseDigest)) return false;
  const expected: Readonly<Record<string, string>> = {
    'marathon-base': baseDigest,
    'marathon-lock': plan.lockDigest,
    'marathon-plan': plan.planDigest,
    'marathon-state': state.stateDigest,
  };
  return Object.entries(expected).every(([id, identity]) =>
    checkpoint.authorityBindings.filter(binding =>
      binding.bindingId === id && binding.required && binding.semanticIdentity === identity,
    ).length === 1);
}

/** Read-only continuity gate; returns eligibility, never permission to mutate. */
export async function recoverMarathonWithCanonicalContinuity(
  plan: MarathonPlan,
  store: MarathonStateStore,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
  evidence: MarathonContinuityEvidence,
  verifier: MarathonContinuityVerifier,
): Promise<MarathonResult<MarathonContinuityDecision>> {
  if (!plan || !store || !current || !evidence || !verifier ||
      typeof verifier.verifyCheckpoint !== 'function' ||
      typeof verifier.verifyReadiness !== 'function' ||
      typeof verifier.verifyHandoff !== 'function' ||
      typeof verifier.verifyResumeReceipt !== 'function')
    return reject('CONTINUITY_PORT_MISSING');

  const { checkpoint: cp, readiness: rd, handoff: ho, resumeReceipt: re } = evidence;
  if (!cp || !rd || !ho || !re || !Array.isArray(cp.admittedWorkOrderIds) ||
      !Array.isArray(cp.authorityBindings) || !Array.isArray(cp.blockers) ||
      !isDigest(cp.checkpointDigest) || !isDigest(rd.certificateDigest) ||
      !isDigest(ho.handoffDigest) || !isDigest(re.receiptDigest) ||
      !cp.admittedWorkOrderIds.includes(plan.workOrderId) ||
      cp.blockers.length !== 0 || !cp.nextLegalAction ||
      rd.ready !== true || rd.validity !== 'VALID' ||
      rd.checkpointDigest !== cp.checkpointDigest ||
      ho.checkpointDigest !== cp.checkpointDigest ||
      ho.readinessCertificateDigest !== rd.certificateDigest ||
      ho.projectId !== cp.projectId || ho.lineageId !== cp.lineageId ||
      ho.nextLegalAction !== cp.nextLegalAction ||
      re.status !== 'READY' || re.nextAction !== cp.nextLegalAction ||
      re.checkpointDigest !== cp.checkpointDigest ||
      re.handoffDigest !== ho.handoffDigest ||
      re.projectId !== cp.projectId || re.lineageId !== cp.lineageId)
    return reject('CONTINUITY_CHAIN_STALE_OR_INCOMPLETE');
  if (current.baseSha !== plan.baseSha ||
      current.lockDigest !== plan.lockDigest || current.actor !== plan.actor)
    return reject('CONTINUITY_SOURCE_OR_ACTOR_DRIFT');

  // Validate the true disk snapshot, not a caller-invented parallel state.
  let state: MarathonState | null;
  try { state = await store.read(plan.planDigest); }
  catch { return reject('CONTINUITY_STORAGE_UNAVAILABLE'); }
  if (!state) return reject('CONTINUITY_SNAPSHOT_MISSING');
  const validated = validateMarathonState(plan, state, digest);
  if (!validated.ok) return validated;
  if (!verifyBinding(cp, plan, state, digest))
    return reject('CONTINUITY_M17_AUTHORITY_DRIFT');

  try {
    const [checkpointValid, readinessValid, handoffValid, resumeValid] =
      await Promise.all([
        verifier.verifyCheckpoint(cp),
        verifier.verifyReadiness(cp, rd),
        verifier.verifyHandoff(ho),
        verifier.verifyResumeReceipt(re),
      ]);
    if (checkpointValid !== true || readinessValid !== true ||
        handoffValid !== true || resumeValid !== true)
      return reject('CONTINUITY_M17_M18_PROOF_INVALID');
  } catch { return reject('CONTINUITY_M17_M18_PROOF_UNAVAILABLE'); }

  // Recheck after async verification; a concurrent writer invalidates any
  // old snapshot and cannot sneak an unverified continuation into the view.
  const recovery = await recoverPersistedMarathon(plan, store, current, digest);
  if (!recovery.ok) return recovery;
  if (recovery.value.stateDigest !== state.stateDigest)
    return reject('CONTINUITY_CONCURRENT_STATE_DRIFT');

  return { ok: true, value: {
    checkpointDigest: cp.checkpointDigest, resumeReceiptDigest: re.receiptDigest,
    planDigest: plan.planDigest, stateDigest: state.stateDigest,
    recovery: recovery.value, privilegeGranted: false,
  } };
}
