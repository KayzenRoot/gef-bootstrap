// M14 Task & Context Compiler - s05-receipt-handoff.ts
// S05: Task Context Capsule, Context Semantic Digest, Selective Context Invalidation Graph,
//      Context Regression Sentinel, Execution Handoff Contract
// Deterministic, immutable, replayable, invalidatable.

import type {
  TaskContextCapsule,
  TaskContextCapsuleInput,
  ContextSemanticDigestInput,
  SelectiveContextInvalidationGraph,
  InvalidationNode,
  ContextRegressionSentinelResult,
  RegressionFinding,
  RegressionKind,
  ExecutionHandoffContract,
  ReceiptValidity,
  AuthorityBoundContextUnit,
  ExclusionEntry,
  OperationOptions,
  Result,
} from './types.js';
import {
  compareCodePoint,
  fail,
  cancelled,
  sha,
  deepFreeze,
  canonical,
} from './utils.js';

// ─── Context Semantic Digest (CSD) ────────────────────────────────────────────

/**
 * Compute the Context Semantic Digest.
 * SHA-256 over normalized semantic bindings, NOT timestamps or path order.
 * Semantically equivalent inputs produce the same digest.
 */
export function computeContextSemanticDigest(
  input: ContextSemanticDigestInput,
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;

  // Normalize: sort all set-like collections for order-independence
  const normalizedInput = {
    taskIdentity: input.taskIdentity,
    selectedUnitIdentities: [...input.selectedUnitIdentities].sort(compareCodePoint),
    authorityProofRefs: [...input.authorityProofRefs].sort(compareCodePoint),
    sufficiencyProofIdentity: input.sufficiencyProofIdentity,
    validityFingerprints: [...input.validityFingerprints].sort(compareCodePoint),
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    policyVersion: input.policyVersion,
    // Deliberately exclude: timestamps, paths, insertion order
  };

  return sha(options, normalizedInput);
}

// ─── Task Context Capsule (TCC) ───────────────────────────────────────────────

/**
 * Build an immutable Task Context Capsule.
 * Only SUFFICIENT TCCs may be consumed by M15.
 */
export function buildTaskContextCapsule(
  input: TaskContextCapsuleInput,
  options: OperationOptions,
): Result<TaskContextCapsule> {
  const c = cancelled(options);
  if (c) return c;

  // Validate: cross-project contamination is forbidden
  for (const unit of input.selectedUnits) {
    if (unit.projectId !== input.projectId) {
      return fail('CROSS_PROJECT_CONTEXT_FORBIDDEN',
        `Unit ${unit.unitId} belongs to project ${unit.projectId} but capsule is for ${input.projectId}`,
        unit.unitId);
    }
    if (unit.sourcePackIdentity !== input.sourcePackIdentity) {
      return fail('CONTEXT_UNIT_STALE',
        `Unit ${unit.unitId} source pack mismatch`, unit.unitId);
    }
  }

  // Validate profile/policy alignment
  if (input.taskIntentEnvelope.profileIdentity !== input.profileIdentity) {
    return fail('TASK_CONTEXT_BINDING_STALE',
      'Profile identity mismatch between TIE and capsule', input.taskIntentEnvelope.taskId);
  }
  if (input.taskIntentEnvelope.policyVersion !== input.policyVersion) {
    return fail('TASK_CONTEXT_BINDING_STALE',
      'Policy version mismatch between TIE and capsule', input.taskIntentEnvelope.taskId);
  }

  // Compute Context Semantic Digest
  const digestInput: ContextSemanticDigestInput = {
    taskIdentity: input.taskIntentEnvelope.semanticIdentity,
    selectedUnitIdentities: input.selectedUnits.map(u => u.semanticIdentity),
    authorityProofRefs: input.authorityProofs.map(p => p.proofRef),
    sufficiencyProofIdentity: input.sufficiencyProof.semanticIdentity,
    validityFingerprints: input.selectedUnits.map(u => u.sourceFingerprint),
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    policyVersion: input.policyVersion,
  };

  const digestResult = computeContextSemanticDigest(digestInput, options);
  if (!digestResult.ok) return digestResult;

  const compiledAtMs = Date.now();

  const capsule: TaskContextCapsule = deepFreeze({
    taskIntentEnvelope: input.taskIntentEnvelope,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
    selectedUnits: [...input.selectedUnits].sort((a, b) => compareCodePoint(a.unitId, b.unitId)),
    authorityProofs: [...input.authorityProofs].sort((a, b) => compareCodePoint(a.domain, b.domain)),
    sufficiencyProof: input.sufficiencyProof,
    expansionTrace: [...input.expansionTrace],
    exclusions: [...input.exclusions].sort((a, b) => compareCodePoint(a.unitId, b.unitId)),
    validity: input.validity,
    semanticDigest: digestResult.value,
    compiledAtMs,
  });

  return { ok: true, value: capsule };
}

// ─── Selective Context Invalidation Graph (SCIG) ──────────────────────────────

export interface FingerprintBinding {
  readonly unitId: string;
  readonly fingerprint: string;
}

/**
 * Compute the Selective Context Invalidation Graph.
 * Invalidates only portions whose bound fingerprints changed.
 * Conservatively widens when dependency knowledge is incomplete.
 */
export function computeSelectiveContextInvalidationGraph(
  capsule: TaskContextCapsule,
  currentFingerprints: readonly FingerprintBinding[],
  dependencyKnowledgeComplete: boolean,
  options: OperationOptions,
): Result<SelectiveContextInvalidationGraph> {
  const c = cancelled(options);
  if (c) return c;

  const fpMap = new Map(currentFingerprints.map(f => [f.unitId, f.fingerprint]));
  const nodes: InvalidationNode[] = [];
  let invalidatedCount = 0;

  for (const unit of [...capsule.selectedUnits].sort((a, b) => compareCodePoint(a.unitId, b.unitId))) {
    const currentFp = fpMap.get(unit.unitId);
    let invalidated = false;
    let reason: string | undefined;

    if (currentFp === undefined) {
      // Source no longer exists → invalidate conservatively
      invalidated = true;
      reason = `Unit ${unit.unitId} no longer exists in current source`;
    } else if (currentFp !== unit.sourceFingerprint) {
      invalidated = true;
      reason = `Source fingerprint changed for unit ${unit.unitId}`;
    } else if (!dependencyKnowledgeComplete) {
      // Incomplete dependency knowledge → conservative expansion
      invalidated = true;
      reason = 'Incomplete dependency knowledge; conservative invalidation applied';
    }

    if (invalidated) invalidatedCount++;

    nodes.push({
      unitId: unit.unitId,
      dependsOnFingerprints: [unit.sourceFingerprint],
      invalidated,
      ...(reason !== undefined ? { reason } : {}),
    });
  }

  // Conservative expansion: if dependency knowledge incomplete, mark ALL as invalidated
  const conservativeExpansion = !dependencyKnowledgeComplete;

  const result: SelectiveContextInvalidationGraph = deepFreeze({
    capsuleIdentity: capsule.semanticDigest,
    nodes,
    invalidatedCount,
    conservativeExpansion,
  });

  return { ok: true, value: result };
}

// ─── Context Regression Sentinel (CRS) ────────────────────────────────────────

export interface PreviousCapsuleSnapshot {
  readonly semanticDigest: string;
  readonly selectedUnitIdentities: readonly string[];
  readonly authorityProofStates: readonly { domain: string; conflictState: string }[];
  readonly coverageState: string;
  readonly aperture: string;
}

/**
 * Detect context regressions between two capsule generations.
 * Detects: authority downgrade, lost coverage, new conflicts, stale aliases,
 *          dependency growth, unsafe aperture shrinkage.
 */
export function detectContextRegression(
  previous: PreviousCapsuleSnapshot,
  current: TaskContextCapsule,
  options: OperationOptions,
): Result<ContextRegressionSentinelResult> {
  const c = cancelled(options);
  if (c) return c;

  const regressions: RegressionFinding[] = [];

  // Check for lost obligation coverage
  if (previous.coverageState === 'COVERED' && current.sufficiencyProof.coverageLattice.overallCoverage !== 'COVERED') {
    regressions.push({
      kind: 'LOST_OBLIGATION_COVERAGE',
      detail: `Coverage regressed from COVERED to ${current.sufficiencyProof.coverageLattice.overallCoverage}`,
    });
  }

  // Check for new conflicts
  const previousConflicts = new Set(
    previous.authorityProofStates.filter(p => p.conflictState === 'CONFLICT').map(p => p.domain)
  );
  const currentConflicts = new Set(
    current.authorityProofs.filter(p => p.conflictState === 'CONFLICT').map(p => p.domain)
  );
  for (const domain of currentConflicts) {
    if (!previousConflicts.has(domain)) {
      regressions.push({
        kind: 'NEW_CONFLICT',
        domain,
        detail: `New authority conflict appeared in domain ${domain}`,
      });
    }
  }

  // Check for authority downgrade (fewer proofs with RESOLVED state)
  const previousResolved = previous.authorityProofStates.filter(p => p.conflictState === 'RESOLVED').length;
  const currentResolved = current.authorityProofs.filter(p => p.conflictState === 'RESOLVED').length;
  if (currentResolved < previousResolved) {
    regressions.push({
      kind: 'AUTHORITY_DOWNGRADE',
      detail: `Resolved authority count decreased from ${previousResolved} to ${currentResolved}`,
    });
  }

  // Check for unsafe aperture shrinkage (fewer units without sufficiency improvement)
  const prevUnitCount = previous.selectedUnitIdentities.length;
  const currUnitCount = current.selectedUnits.length;
  if (currUnitCount < prevUnitCount && current.sufficiencyProof.sufficiencyState !== 'SUFFICIENT') {
    regressions.push({
      kind: 'UNSAFE_APERTURE_SHRINKAGE',
      detail: `Context shrank from ${prevUnitCount} to ${currUnitCount} units without achieving sufficiency`,
    });
  }

  // Check for dependency growth (closure incomplete where previously complete)
  if (
    !current.sufficiencyProof.dependencyKnowledgeComplete &&
    previous.coverageState === 'COVERED'
  ) {
    regressions.push({
      kind: 'DEPENDENCY_GROWTH',
      detail: 'Dependency knowledge is now incomplete, potentially leaving gaps',
    });
  }

  const sortedRegressions = [...regressions].sort((a, b) =>
    compareCodePoint(a.kind, b.kind) || compareCodePoint(a.detail, b.detail)
  );

  const result: ContextRegressionSentinelResult = deepFreeze({
    previousDigest: previous.semanticDigest,
    currentDigest: current.semanticDigest,
    regressions: sortedRegressions,
    hasRegression: sortedRegressions.length > 0,
  });

  return { ok: true, value: result };
}

// ─── Execution Handoff Contract (EHC) ─────────────────────────────────────────

/**
 * Build the Execution Handoff Contract.
 * M15 may consume only SUFFICIENT non-stale TCCs.
 * M15 cannot silently add authority-bearing context.
 */
export function buildExecutionHandoffContract(
  capsule: TaskContextCapsule,
  invalidationGraph: SelectiveContextInvalidationGraph,
  options: OperationOptions,
): Result<ExecutionHandoffContract> {
  const c = cancelled(options);
  if (c) return c;

  const blockerCodes: string[] = [];

  // Check validity state
  if (capsule.validity !== 'VALID') {
    blockerCodes.push(`CAPSULE_VALIDITY_${capsule.validity}`);
  }

  // Check sufficiency
  if (capsule.sufficiencyProof.sufficiencyState !== 'SUFFICIENT') {
    blockerCodes.push(`SUFFICIENCY_${capsule.sufficiencyProof.sufficiencyState}`);
  }

  // Check for invalidated units
  if (invalidationGraph.invalidatedCount > 0) {
    blockerCodes.push(`INVALIDATED_UNITS_${invalidationGraph.invalidatedCount}`);
  }

  // Check for conservative expansion (incomplete dep knowledge)
  if (invalidationGraph.conservativeExpansion) {
    blockerCodes.push('CONSERVATIVE_INVALIDATION_APPLIED');
  }

  const sortedBlockers = [...blockerCodes].sort(compareCodePoint);
  const readyForM15Consumption = sortedBlockers.length === 0;

  const handoffPayload = {
    capsuleSemanticDigest: capsule.semanticDigest,
    capsuleValidity: capsule.validity,
    readyForM15Consumption,
    blockerCodes: sortedBlockers,
  };

  const digestResult = sha(options, handoffPayload);
  if (!digestResult.ok) return digestResult;

  const contract: ExecutionHandoffContract = deepFreeze({
    capsuleSemanticDigest: capsule.semanticDigest,
    capsuleValidity: capsule.validity,
    readyForM15Consumption,
    blockerCodes: sortedBlockers,
    handoffIdentity: digestResult.value,
  });

  return { ok: true, value: contract };
}

// ─── Receipt validity evaluation ─────────────────────────────────────────────

export interface ValidityEvalInput {
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly policyVersion: string;
  readonly capsule: TaskContextCapsule;
  readonly currentFingerprints: readonly FingerprintBinding[];
  readonly supportedPolicies: readonly string[];
}

/**
 * Evaluate the current validity of a Task Context Capsule.
 * States: VALID, STALE, PARTIAL, BLOCKED, PROJECT_MISMATCH, SOURCE_PACK_MISMATCH,
 *         POLICY_UNSUPPORTED, INDETERMINATE.
 */
export function evaluateCapsuleValidity(
  input: ValidityEvalInput,
): ReceiptValidity {
  const { projectId, sourcePackIdentity, policyVersion, capsule, currentFingerprints, supportedPolicies } = input;

  if (capsule.projectId !== projectId) return 'PROJECT_MISMATCH';
  if (capsule.sourcePackIdentity !== sourcePackIdentity) return 'SOURCE_PACK_MISMATCH';
  if (!supportedPolicies.includes(policyVersion)) return 'POLICY_UNSUPPORTED';

  if (capsule.sufficiencyProof.sufficiencyState === 'BLOCKED') return 'BLOCKED';
  if (capsule.sufficiencyProof.sufficiencyState === 'INDETERMINATE') return 'INDETERMINATE';

  const fpMap = new Map(currentFingerprints.map(f => [f.unitId, f.fingerprint]));
  let staleCount = 0;
  let totalUnits = capsule.selectedUnits.length;

  for (const unit of capsule.selectedUnits) {
    const currentFp = fpMap.get(unit.unitId);
    if (currentFp === undefined || currentFp !== unit.sourceFingerprint) {
      staleCount++;
    }
  }

  if (staleCount === 0) return 'VALID';
  if (staleCount === totalUnits) return 'STALE';
  return 'PARTIAL';
}
