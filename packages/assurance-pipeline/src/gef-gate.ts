// GBS-MOD-WO-001 (E) — the stable `GEF Gate` decision and receipt.
//
// The gate is the one artifact that answers "which validations does this candidate owe, and why".
// It is deliberately conservative in two directions at once:
//
//   1. It never narrows a ruleset-required context. Whatever the risk tier proves, every context
//      the main branch ruleset requires stays in `requiredChecks`, because the ruleset is not
//      something this gate is authorized to reinterpret.
//   2. It never manufactures authority. `maySelectRequiredChecks`, `mayPromoteCheckpoint`,
//      `mayRelease` and friends are literal `false` on the receipt, so holding a receipt cannot
//      be mistaken for permission to merge, promote or self-approve.
//
// Narrowing is expressed as `narrowingCandidates`: checks a *later, separately authorized*
// ruleset update could drop, each carrying the closure proof that puts it outside the changed
// dependency and risk closure. Until that authorization exists they are reported as
// `NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION`, which keeps the receipt truthful rather than
// aspirational.

import type { OperationOptions, Result } from './types.js';
import { Guard, deepFreeze, digestValue, fail, ok, sortedUnique, validId } from './utils.js';

export const GEF_GATE_RECEIPT_VERSION = '1.0';

/** Mechanism identities introduced by GBS-MOD-WO-001; kept separate from the frozen M27 registry. */
export const GEF_GATE_MECHANISMS = Object.freeze([
  'GGD01',
  'GGC02',
  'GGV03',
  'GGX04',
] as const);
export type GefGateMechanism = (typeof GEF_GATE_MECHANISMS)[number];

export const gefGateDecisions = Object.freeze(['FULL_ASSURANCE', 'REDUCED_ADVISORY', 'BLOCKED'] as const);
export type GefGateDecision = (typeof gefGateDecisions)[number];

export const gefGateRiskTiers = Object.freeze(['LOW', 'STANDARD', 'ELEVATED', 'HIGH_ASSURANCE'] as const);
export type GefGateRiskTier = (typeof gefGateRiskTiers)[number];

export const gefGateCheckKinds = Object.freeze([
  'RULESET_REQUIRED',
  'MANDATORY_OBLIGATION',
  'SPECIALIST_GATE',
  'RETAINED_CANDIDATE',
] as const);
export type GefGateCheckKind = (typeof gefGateCheckKinds)[number];

export const GEF_GATE_DIAGNOSTIC_CODES = Object.freeze({
  GATE_INPUT_INVALID: 'GEF_GATE_INPUT_INVALID',
  GATE_BINDING_INVALID: 'GEF_GATE_BINDING_INVALID',
  GATE_TIER_UNKNOWN: 'GEF_GATE_TIER_UNKNOWN',
  GATE_IMPACT_BLOCKED: 'GEF_GATE_IMPACT_BLOCKED',
  GATE_CONTEXT_LOCK_BLOCKED: 'GEF_GATE_CONTEXT_LOCK_BLOCKED',
  GATE_RULESET_CONTEXTS_UNPROVEN: 'GEF_GATE_RULESET_CONTEXTS_UNPROVEN',
  GATE_STATE_UNKNOWN: 'GEF_GATE_STATE_UNKNOWN',
  GATE_OBLIGATION_FLOOR_MISSING: 'GEF_GATE_OBLIGATION_FLOOR_MISSING',
  GATE_RECEIPT_TAMPERED: 'GEF_GATE_RECEIPT_TAMPERED',
} as const);
export type GefGateDiagnosticCode = (typeof GEF_GATE_DIAGNOSTIC_CODES)[keyof typeof GEF_GATE_DIAGNOSTIC_CODES];

export interface GefGateCandidateCheck {
  readonly checkId: string;
  readonly ownerWorkflow: string;
  /** Why this provider check exists; carried into the receipt verbatim. */
  readonly reason: string;
  /** True when the router proved it outside the changed dependency and risk closure. */
  readonly outsideChangedClosure: boolean;
}

export interface GefGateInput {
  readonly gateId: string;
  readonly repository: string;
  readonly workOrderId: string;
  readonly baseRef: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly changedPaths: readonly string[];
  readonly changeImpactDigest: string;
  readonly impactState: 'CLASSIFIED' | 'BLOCKED';
  readonly riskTier: string;
  readonly governanceFastPath: 'PERMITTED' | 'REFUSED';
  readonly escalateReasons: readonly string[];
  readonly obligations: readonly string[];
  readonly contextLockDigest: string;
  readonly contextLockState: 'COMPILED' | 'EXPANDED' | 'BLOCKED';
  readonly closureDigest: string | null;
  readonly validationFloor: string | null;
    /** Contexts the target branch ruleset requires. Empty means "unproven", which blocks. */
  readonly rulesetRequiredContexts: readonly string[];
  /**
   * Obligations no receipt may omit, whatever the caller claims.
   *
   * The Work Order makes these non-negotiable for the governance fast path, so a receipt that would
   * be issued without them is refused instead of issued thinner than the contract requires.
   */
  readonly mandatoryObligationFloor: readonly string[];
  readonly providerCandidateChecks: readonly GefGateCandidateCheck[];
  readonly policyDigest: string;
  readonly candidateSemanticDigest: string;
}

export interface GefGateRequiredCheck {
  readonly checkId: string;
  readonly kind: GefGateCheckKind;
  readonly ownerWorkflow: string | null;
  readonly reason: string;
  readonly required: true;
}

export interface GefGateNarrowingCandidate {
  readonly checkId: string;
  readonly ownerWorkflow: string;
  readonly reason: string;
  readonly closureProof: string;
  readonly enforcement: 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION';
}

export interface GefGateRetainedCheck {
  readonly checkId: string;
  readonly ownerWorkflow: string;
  readonly reason: string;
  readonly retentionReason: string;
}

export interface GefGateBindings {
  readonly repository: string;
  readonly workOrderId: string;
  readonly baseRef: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly changedPathCount: number;
  readonly changeImpactDigest: string;
  readonly contextLockDigest: string;
  readonly closureDigest: string | null;
  readonly policyDigest: string;
  readonly candidateSemanticDigest: string;
}

export interface GefGateReceipt {
  readonly schemaVersion: string;
  readonly gateId: string;
  readonly decision: GefGateDecision;
  readonly riskTier: GefGateRiskTier;
  readonly enforcement: 'CONTRACT_ONLY_RULESET_PENDING';
  readonly bindings: GefGateBindings;
  readonly requiredChecks: readonly GefGateRequiredCheck[];
  readonly narrowingCandidates: readonly GefGateNarrowingCandidate[];
  readonly retainedChecks: readonly GefGateRetainedCheck[];
  readonly escalateReasons: readonly string[];
  readonly maySelectRequiredChecks: false;
  readonly mayRelaxRulesetContexts: false;
  readonly mayPromoteCheckpoint: false;
  readonly mayRelease: false;
  readonly manufacturesProductionCredit: false;
  readonly receiptDigest: string;
}

export interface GefGateIntegrity {
  readonly valid: boolean;
  readonly reason: string;
}

const SHA40 = /^[0-9a-f]{40}$/;
const IMPACT_STATES = ['CLASSIFIED', 'BLOCKED'] as const;
const CONTEXT_LOCK_STATES = ['COMPILED', 'EXPANDED', 'BLOCKED'] as const;
const VALIDATION_FLOORS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

function isCandidateCheckList(value: unknown): value is readonly GefGateCandidateCheck[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof (entry as GefGateCandidateCheck).checkId === 'string' &&
        (entry as GefGateCandidateCheck).checkId.length > 0 &&
        typeof (entry as GefGateCandidateCheck).ownerWorkflow === 'string' &&
        typeof (entry as GefGateCandidateCheck).reason === 'string' &&
        typeof (entry as GefGateCandidateCheck).outsideChangedClosure === 'boolean',
    )
  );
}

/** One entry per check id, with the strictest `outsideChangedClosure` reading winning. */
function normalizeCandidateChecks(candidates: readonly GefGateCandidateCheck[]): readonly GefGateCandidateCheck[] {
  const byId = new Map<string, GefGateCandidateCheck>();
  for (const candidate of [...candidates].sort((left, right) => (left.checkId < right.checkId ? -1 : left.checkId > right.checkId ? 1 : 0))) {
    const existing = byId.get(candidate.checkId);
    if (existing === undefined) {
      byId.set(candidate.checkId, candidate);
      continue;
    }
    byId.set(candidate.checkId, {
      ...existing,
      outsideChangedClosure: existing.outsideChangedClosure && candidate.outsideChangedClosure,
    });
  }
  return sortedUnique([...byId.keys()]).map((checkId) => byId.get(checkId) as GefGateCandidateCheck);
}

/**
 * Derives the gate decision and receipt.
 *
 * Fail-closed order matters: an unproven ruleset context set blocks before anything else, because
 * "which checks are required" cannot be answered without knowing the ruleset.
 */
export function decideGefGate(input: GefGateInput, options: OperationOptions): Result<GefGateReceipt> {
  const guard = new Guard(options);
  const step = guard.step('decideGefGate');
  if (step.ok !== true) return step;

  if (input === null || typeof input !== 'object') {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID, 'Gate input must be an object');
  }
  if (!validId(input.gateId)) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID, 'gateId is not a valid stable identifier', input.gateId);
  }
  if (!gefGateRiskTiers.includes(input.riskTier as GefGateRiskTier)) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_TIER_UNKNOWN, 'riskTier is not a known tier', String(input.riskTier));
  }
  if (!IMPACT_STATES.includes(input.impactState)) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_STATE_UNKNOWN, 'impactState is not a known state', String(input.impactState));
  }
  if (!CONTEXT_LOCK_STATES.includes(input.contextLockState)) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_STATE_UNKNOWN, 'contextLockState is not a known state', String(input.contextLockState));
  }
  if (input.closureDigest !== null && typeof input.closureDigest !== 'string') {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID, 'closureDigest must be a digest string or null');
  }
  if (input.validationFloor !== null && !VALIDATION_FLOORS.includes(input.validationFloor as (typeof VALIDATION_FLOORS)[number])) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_STATE_UNKNOWN, 'validationFloor is not a known ladder level', String(input.validationFloor));
  }
  if (!SHA40.test(input.baseSha) || !SHA40.test(input.headSha)) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID, 'base and head must be 40 character commit ids');
  }
  if (!isStringArray(input.changedPaths) || input.changedPaths.length === 0) {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_BINDING_INVALID, 'changedPaths must bind the exact changed state');
  }
  for (const field of ['rulesetRequiredContexts', 'obligations', 'escalateReasons', 'mandatoryObligationFloor'] as const) {
    if (!isStringArray(input[field])) {
      return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID, `${field} must be an array of non-empty strings`, field);
    }
  }
  if (!isCandidateCheckList(input.providerCandidateChecks)) {
    return fail(
      GEF_GATE_DIAGNOSTIC_CODES.GATE_INPUT_INVALID,
      'providerCandidateChecks must be an array of complete candidate descriptors',
    );
  }
  const missingObligation = input.mandatoryObligationFloor.find((obligation) => !input.obligations.includes(obligation));
  if (missingObligation !== undefined) {
    return fail(
      GEF_GATE_DIAGNOSTIC_CODES.GATE_OBLIGATION_FLOOR_MISSING,
      'obligations are missing a mandatory floor the gate contract cannot waive',
      missingObligation,
    );
  }
  if (input.rulesetRequiredContexts.length === 0) {
    return fail(
      GEF_GATE_DIAGNOSTIC_CODES.GATE_RULESET_CONTEXTS_UNPROVEN,
      'The target branch ruleset context set is unknown; required checks cannot be decided',
    );
  }
  if (input.impactState === 'BLOCKED') {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_IMPACT_BLOCKED, 'Change impact is blocked', input.escalateReasons.join('+'));
  }
  if (input.contextLockState === 'BLOCKED') {
    return fail(GEF_GATE_DIAGNOSTIC_CODES.GATE_CONTEXT_LOCK_BLOCKED, 'Context Lock did not compile for this candidate');
  }

  const riskTier = input.riskTier as GefGateRiskTier;
  const requiredChecks: GefGateRequiredCheck[] = sortedUnique(input.rulesetRequiredContexts).map((context) => ({
    checkId: context,
    kind: 'RULESET_REQUIRED' as const,
    ownerWorkflow: null,
    reason: 'TARGET_BRANCH_RULESET_REQUIRES_THIS_CONTEXT',
    required: true as const,
  }));
  for (const obligation of sortedUnique(input.obligations)) {
    requiredChecks.push({
      checkId: `OBLIGATION:${obligation}`,
      kind: 'MANDATORY_OBLIGATION',
      ownerWorkflow: null,
      reason: `CHANGE_IMPACT_PROVES_${obligation}`,
      required: true,
    });
  }
  if (riskTier === 'HIGH_ASSURANCE') {
    requiredChecks.push({
      checkId: 'GATE:INDEPENDENT_SPECIALIST_REVIEW',
      kind: 'SPECIALIST_GATE',
      ownerWorkflow: null,
      reason: 'HIGH_ASSURANCE_REQUIRES_INDEPENDENT_SPECIALIST_REVIEW',
      required: true,
    });
  }

  // Narrowing only becomes a claim when the fast path actually holds *and* the chain produced a
  // dependency closure. Otherwise every candidate stays retained with the reason it could not be
  // excluded.
  const fastPathHolds = input.governanceFastPath === 'PERMITTED' && input.escalateReasons.length === 0;
  // The per-candidate `outsideChangedClosure` flag is a caller claim. It is accepted only alongside
  // a proven closure digest and a known ladder level, and only while that level is below the
  // `HIGH_ASSURANCE` floor — which is what an L5 validation floor means. Note that an L4 floor is
  // *not* a reason to refuse: L4 governs which tests run inside `Repository validation`, which is
  // unchanged by this gate, whereas L5 means a HIGH_ASSURANCE candidate that must not be narrowed.
  const closureProven = input.closureDigest !== null && input.validationFloor !== null && input.validationFloor !== 'L5';
  // Duplicate check ids are normalized to the strictest reading before use, so the decision cannot
  // depend on the order the caller listed them in.
  const candidates = normalizeCandidateChecks(input.providerCandidateChecks);
  const narrowingCandidates: GefGateNarrowingCandidate[] = [];
  const retainedChecks: GefGateRetainedCheck[] = [];
  for (const entry of candidates) {
    if (fastPathHolds && closureProven && entry.outsideChangedClosure) {
      narrowingCandidates.push({
        checkId: entry.checkId,
        ownerWorkflow: entry.ownerWorkflow,
        reason: entry.reason,
        closureProof: `OUTSIDE_CHANGED_DEPENDENCY_AND_RISK_CLOSURE:${riskTier}:${input.changeImpactDigest}`,
        enforcement: 'NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION',
      });
      continue;
    }
    retainedChecks.push({
      checkId: entry.checkId,
      ownerWorkflow: entry.ownerWorkflow,
      reason: entry.reason,
      retentionReason: !fastPathHolds
        ? `GOVERNANCE_FAST_PATH_REFUSED:${input.governanceFastPath}`
        : !closureProven
          ? 'NARROWING_REQUIRES_A_PROVEN_DEPENDENCY_CLOSURE'
          : 'INSIDE_CHANGED_DEPENDENCY_OR_RISK_CLOSURE',
    });
  }

  const decision: GefGateDecision =
    narrowingCandidates.length === 0 ? 'FULL_ASSURANCE' : 'REDUCED_ADVISORY';

  const body = {
    schemaVersion: GEF_GATE_RECEIPT_VERSION,
    gateId: input.gateId,
    decision,
    riskTier,
    enforcement: 'CONTRACT_ONLY_RULESET_PENDING' as const,
    bindings: {
      repository: input.repository,
      workOrderId: input.workOrderId,
      baseRef: input.baseRef,
      baseSha: input.baseSha,
      headSha: input.headSha,
      changedPathCount: input.changedPaths.length,
      changeImpactDigest: input.changeImpactDigest,
      contextLockDigest: input.contextLockDigest,
      closureDigest: input.closureDigest,
      policyDigest: input.policyDigest,
      candidateSemanticDigest: input.candidateSemanticDigest,
    },
    requiredChecks: [...requiredChecks].sort((left, right) => (left.checkId < right.checkId ? -1 : left.checkId > right.checkId ? 1 : 0)),
    narrowingCandidates,
    retainedChecks,
    escalateReasons: sortedUnique(input.escalateReasons),
    maySelectRequiredChecks: false as const,
    mayRelaxRulesetContexts: false as const,
    mayPromoteCheckpoint: false as const,
    mayRelease: false as const,
    manufacturesProductionCredit: false as const,
  };

  const digestResult = digestValue(options, 'GEF_GATE_RECEIPT', body);
  if (digestResult.ok !== true) return digestResult;

  return ok(deepFreeze({ ...body, receiptDigest: digestResult.value }));
}

/**
 * Recomputes the receipt digest and reports tampering.
 *
 * A gate receipt is evidence; a receipt whose digest does not match its body is not evidence of
 * anything and must not be presented as a decision.
 */
export function verifyGefGateReceipt(
  receipt: GefGateReceipt,
  options: OperationOptions,
): Result<GefGateIntegrity> {
  const { receiptDigest, ...body } = receipt;
  const recomputed = digestValue(options, 'GEF_GATE_RECEIPT', body);
  if (recomputed.ok !== true) return recomputed;
  if (recomputed.value === receiptDigest) return ok({ valid: true, reason: 'RECEIPT_DIGEST_MATCH' });
  return ok({ valid: false, reason: GEF_GATE_DIAGNOSTIC_CODES.GATE_RECEIPT_TAMPERED });
}

/** True only for a receipt that still binds its own body. Convenience for gate call sites. */
export function gefGateReceiptIsCurrent(receipt: GefGateReceipt, options: OperationOptions): boolean {
  const result = verifyGefGateReceipt(receipt, options);
  return result.ok && result.value.valid;
}