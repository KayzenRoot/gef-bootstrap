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
  ExecutionHandoffContract,
  ReceiptValidity,
  OperationOptions,
  Result,
} from './types.js';
import {
  compareCodePoint,
  fail,
  cancelled,
  sha,
  deepFreeze,
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

  const normalizedInput = {
    taskIdentity: input.taskIdentity,
    selectedUnitIdentities: [...input.selectedUnitIdentities].sort(compareCodePoint),
    authorityProofRefs: [...input.authorityProofRefs].sort(compareCodePoint),
    sufficiencyProofIdentity: input.sufficiencyProofIdentity,
    validityFingerprints: [...input.validityFingerprints].sort(compareCodePoint),
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    policyVersion: input.policyVersion,
  };

  return sha(options, normalizedInput);
}

// ─── Task Context Capsule (TCC) ───────────────────────────────────────────────

/** Build an immutable Task Context Capsule. Only SUFFICIENT TCCs may reach M15. */
export function buildTaskContextCapsule(
  input: TaskContextCapsuleInput,
  options: OperationOptions,
): Result<TaskContextCapsule> {
  const c = cancelled(options);
  if (c) return c;

  const tie = input.taskIntentEnvelope;
  if (tie.projectId !== input.projectId) {
    return fail('CROSS_PROJECT_CONTEXT_FORBIDDEN', 'Project mismatch between TIE and capsule', tie.taskId);
  }
  if (tie.sourcePackIdentity !== input.sourcePackIdentity) {
    return fail('CONTEXT_UNIT_STALE', 'Source-pack mismatch between TIE and capsule', tie.taskId);
  }
  if (tie.profileIdentity !== input.profileIdentity || tie.profileDigest !== input.profileDigest) {
    return fail('TASK_CONTEXT_BINDING_STALE', 'Profile binding mismatch between TIE and capsule', tie.taskId);
  }
  if (tie.policyVersion !== input.policyVersion) {
    return fail('TASK_CONTEXT_BINDING_STALE', 'Policy version mismatch between TIE and capsule', tie.taskId);
  }
  if (tie.checkpointIdentity !== input.checkpointIdentity) {
    return fail('TASK_CONTEXT_BINDING_STALE', 'Checkpoint mismatch between TIE and capsule', tie.taskId);
  }

  for (const unit of input.selectedUnits) {
    if (unit.projectId !== input.projectId) {
      return fail('CROSS_PROJECT_CONTEXT_FORBIDDEN',
        `Unit ${unit.unitId} belongs to project ${unit.projectId} but capsule is for ${input.projectId}`,
        unit.unitId);
    }
    if (unit.sourcePackIdentity !== input.sourcePackIdentity) {
      return fail('CONTEXT_UNIT_STALE', `Unit ${unit.unitId} source pack mismatch`, unit.unitId);
    }
    if (unit.profileIdentity !== input.profileIdentity || unit.profileDigest !== input.profileDigest) {
      return fail('TASK_CONTEXT_BINDING_STALE', `Unit ${unit.unitId} profile binding mismatch`, unit.unitId);
    }
    if (unit.policyVersion !== input.policyVersion) {
      return fail('TASK_CONTEXT_BINDING_STALE', `Unit ${unit.unitId} policy binding mismatch`, unit.unitId);
    }
    if (unit.checkpointIdentity !== input.checkpointIdentity) {
      return fail('TASK_CONTEXT_BINDING_STALE', `Unit ${unit.unitId} checkpoint binding mismatch`, unit.unitId);
    }
  }

  const digestInput: ContextSemanticDigestInput = {
    taskIdentity: tie.semanticIdentity,
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

  const capsule: TaskContextCapsule = deepFreeze({
    taskIntentEnvelope: tie,
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
    compiledAtMs: Date.now(),
  });

  return { ok: true, value: capsule };
}

// ─── Selective Context Invalidation Graph (SCIG) ──────────────────────────────

export interface FingerprintBinding {
  readonly unitId: string;
  readonly fingerprint: string;
}

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
      invalidated = true;
      reason = `Unit ${unit.unitId} no longer exists in current source`;
    } else if (currentFp !== unit.sourceFingerprint) {
      invalidated = true;
      reason = `Source fingerprint changed for unit ${unit.unitId}`;
    } else if (!dependencyKnowledgeComplete) {
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

  return {
    ok: true,
    value: deepFreeze({
      capsuleIdentity: capsule.semanticDigest,
      nodes,
      invalidatedCount,
      conservativeExpansion: !dependencyKnowledgeComplete,
    }),
  };
}

// ─── Context Regression Sentinel (CRS) ────────────────────────────────────────

export interface PreviousCapsuleSnapshot {
  readonly semanticDigest: string;
  readonly selectedUnitIdentities: readonly string[];
  readonly authorityProofStates: readonly { domain: string; conflictState: string }[];
  readonly coverageState: string;
  readonly aperture: string;
}

export function detectContextRegression(
  previous: PreviousCapsuleSnapshot,
  current: TaskContextCapsule,
  options: OperationOptions,
): Result<ContextRegressionSentinelResult> {
  const c = cancelled(options);
  if (c) return c;

  const regressions: RegressionFinding[] = [];
  if (previous.coverageState === 'COVERED' && current.sufficiencyProof.coverageLattice.overallCoverage !== 'COVERED') {
    regressions.push({
      kind: 'LOST_OBLIGATION_COVERAGE',
      detail: `Coverage regressed from COVERED to ${current.sufficiencyProof.coverageLattice.overallCoverage}`,
    });
  }

  const previousConflicts = new Set(
    previous.authorityProofStates.filter(p => p.conflictState === 'CONFLICT').map(p => p.domain),
  );
  const currentConflicts = new Set(
    current.authorityProofs.filter(p => p.conflictState === 'CONFLICT').map(p => p.domain),
  );
  for (const domain of currentConflicts) {
    if (!previousConflicts.has(domain)) {
      regressions.push({ kind: 'NEW_CONFLICT', domain, detail: `New authority conflict appeared in domain ${domain}` });
    }
  }

  const previousResolved = previous.authorityProofStates.filter(p => p.conflictState === 'RESOLVED').length;
  const currentResolved = current.authorityProofs.filter(p => p.conflictState === 'RESOLVED').length;
  if (currentResolved < previousResolved) {
    regressions.push({
      kind: 'AUTHORITY_DOWNGRADE',
      detail: `Resolved authority count decreased from ${previousResolved} to ${currentResolved}`,
    });
  }

  const prevUnitCount = previous.selectedUnitIdentities.length;
  const currUnitCount = current.selectedUnits.length;
  if (currUnitCount < prevUnitCount && current.sufficiencyProof.sufficiencyState !== 'SUFFICIENT') {
    regressions.push({
      kind: 'UNSAFE_APERTURE_SHRINKAGE',
      detail: `Context shrank from ${prevUnitCount} to ${currUnitCount} units without achieving sufficiency`,
    });
  }

  if (!current.sufficiencyProof.dependencyKnowledgeComplete && previous.coverageState === 'COVERED') {
    regressions.push({
      kind: 'DEPENDENCY_GROWTH',
      detail: 'Dependency knowledge is now incomplete, potentially leaving gaps',
    });
  }

  const sortedRegressions = [...regressions].sort((a, b) =>
    compareCodePoint(a.kind, b.kind) || compareCodePoint(a.detail, b.detail),
  );

  return {
    ok: true,
    value: deepFreeze({
      previousDigest: previous.semanticDigest,
      currentDigest: current.semanticDigest,
      regressions: sortedRegressions,
      hasRegression: sortedRegressions.length > 0,
    }),
  };
}

// ─── Execution Handoff Contract (EHC) ─────────────────────────────────────────

export function buildExecutionHandoffContract(
  capsule: TaskContextCapsule,
  invalidationGraph: SelectiveContextInvalidationGraph,
  options: OperationOptions,
): Result<ExecutionHandoffContract> {
  const c = cancelled(options);
  if (c) return c;

  const blockerCodes: string[] = [];
  if (capsule.validity !== 'VALID') blockerCodes.push(`CAPSULE_VALIDITY_${capsule.validity}`);
  if (capsule.sufficiencyProof.sufficiencyState !== 'SUFFICIENT') {
    blockerCodes.push(`SUFFICIENCY_${capsule.sufficiencyProof.sufficiencyState}`);
  }
  if (invalidationGraph.invalidatedCount > 0) {
    blockerCodes.push(`INVALIDATED_UNITS_${invalidationGraph.invalidatedCount}`);
  }
  if (invalidationGraph.conservativeExpansion) blockerCodes.push('CONSERVATIVE_INVALIDATION_APPLIED');

  // Internal exact-binding consistency is mandatory even when the capsule claims VALID.
  const tie = capsule.taskIntentEnvelope;
  if (tie.projectId !== capsule.projectId) blockerCodes.push('BINDING_PROJECT_MISMATCH');
  if (tie.sourcePackIdentity !== capsule.sourcePackIdentity) blockerCodes.push('BINDING_SOURCE_PACK_MISMATCH');
  if (tie.profileIdentity !== capsule.profileIdentity || tie.profileDigest !== capsule.profileDigest) {
    blockerCodes.push('BINDING_PROFILE_MISMATCH');
  }
  if (tie.policyVersion !== capsule.policyVersion) blockerCodes.push('BINDING_POLICY_MISMATCH');
  if (tie.checkpointIdentity !== capsule.checkpointIdentity) blockerCodes.push('BINDING_CHECKPOINT_MISMATCH');

  const sortedBlockers = [...new Set(blockerCodes)].sort(compareCodePoint);
  const readyForM15Consumption = sortedBlockers.length === 0;
  const handoffPayload = {
    capsuleSemanticDigest: capsule.semanticDigest,
    capsuleValidity: capsule.validity,
    readyForM15Consumption,
    blockerCodes: sortedBlockers,
  };
  const digestResult = sha(options, handoffPayload);
  if (!digestResult.ok) return digestResult;

  return {
    ok: true,
    value: deepFreeze({
      capsuleSemanticDigest: capsule.semanticDigest,
      capsuleValidity: capsule.validity,
      readyForM15Consumption,
      blockerCodes: sortedBlockers,
      handoffIdentity: digestResult.value,
    }),
  };
}

// ─── Receipt validity evaluation ─────────────────────────────────────────────

export interface ValidityEvalInput {
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly capsule: TaskContextCapsule;
  readonly currentFingerprints: readonly FingerprintBinding[];
  readonly supportedPolicies: readonly string[];
}

/** Evaluate exact current binding/fingerprint validity. Unknown evidence fails closed. */
export function evaluateCapsuleValidity(input: ValidityEvalInput): ReceiptValidity {
  const {
    projectId,
    sourcePackIdentity,
    profileIdentity,
    profileDigest,
    policyVersion,
    checkpointIdentity,
    capsule,
    currentFingerprints,
    supportedPolicies,
  } = input;

  if (!projectId || !sourcePackIdentity || !profileIdentity || !profileDigest || !policyVersion || !checkpointIdentity) {
    return 'INDETERMINATE';
  }
  if (capsule.projectId !== projectId) return 'PROJECT_MISMATCH';
  if (capsule.sourcePackIdentity !== sourcePackIdentity) return 'SOURCE_PACK_MISMATCH';
  if (capsule.profileIdentity !== profileIdentity || capsule.profileDigest !== profileDigest) return 'STALE';
  if (capsule.checkpointIdentity !== checkpointIdentity) return 'STALE';
  if (capsule.policyVersion !== policyVersion || !supportedPolicies.includes(policyVersion)) return 'POLICY_UNSUPPORTED';

  if (capsule.sufficiencyProof.sufficiencyState === 'BLOCKED') return 'BLOCKED';
  if (capsule.sufficiencyProof.sufficiencyState === 'INDETERMINATE') return 'INDETERMINATE';
  if (capsule.sufficiencyProof.sufficiencyState !== 'SUFFICIENT') return 'PARTIAL';

  const fpMap = new Map(currentFingerprints.map(f => [f.unitId, f.fingerprint]));
  let staleCount = 0;
  const totalUnits = capsule.selectedUnits.length;
  if (totalUnits > 0 && currentFingerprints.length === 0) return 'INDETERMINATE';

  for (const unit of capsule.selectedUnits) {
    const currentFp = fpMap.get(unit.unitId);
    if (currentFp === undefined || currentFp !== unit.sourceFingerprint) staleCount++;
  }

  if (staleCount === 0) return 'VALID';
  if (staleCount === totalUnits) return 'STALE';
  return 'PARTIAL';
}
