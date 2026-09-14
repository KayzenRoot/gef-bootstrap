// M16 Policy & Guardrail Engine - s03-enforcement.ts
// S03: Guardrail Enforcement Membrane (GEM), Mutation Capability Lease (MCL),
//      Exception Blast-Radius Cap (EBRC), Policy TOCTOU Sentinel (PTS),
//      Fail-Closed Degradation Mode (FDM).
// Pure semantic authorization. M16 never mutates files, Git, GitHub,
// network/provider state or credentials.

import type {
  AppliedExceptionAuthorization,
  BlastRadiusCap,
  EnforcementProjection,
  ExceptionDebtEntry,
  ExceptionWarrant,
  ExecutionPack,
  GuardedOperation,
  LeaseCheckInput,
  MutationCapabilityLease,
  Obligation,
  OperationOptions,
  PackReceipt,
  PolicyAuthorityCapsule,
  PolicyDecisionReceipt,
  PolicyDependency,
  Result,
  VerifiedEnforcementProjection,
  WarrantApplication,
} from './types.js';
import {
  cancelled,
  compareCodePoint,
  deepFreeze,
  fail,
  sha,
  sortedStrings,
} from './utils.js';
import { isWarrantExhausted } from './s01-policy-model.js';
import { computeSealedDigests } from '@gef-bootstrap/execution-pack-compiler';
import { bindPolicyFingerprints, issuePolicyDecisionReceipt, verifyPolicyDecisionReceipt } from './s02-evaluation.js';

// ─── Guardrail Enforcement Membrane (GEM) ─────────────────────────────────────

/** Digest over full obligation semantics for projection sealing. */
function computeSealedObligationDigest(
  obligations: readonly Obligation[],
  options: OperationOptions,
): Result<string> {
  return sha(options, {
    obligations: sortedStrings(
      obligations.map(o =>
        JSON.stringify({
          id: o.obligationId,
          statement: o.statement,
          mandatory: o.mandatory,
          dependsOn: [...o.dependsOn].sort(compareCodePoint),
          conflictsWith: [...o.conflictsWith].sort(compareCodePoint),
        }),
      ),
    ),
  });
}

/** Deterministic projection seal over verified pack + PDR bindings. */
function computeProjectionDigest(
  fields: {
    packId: string;
    packDigest: string;
    taskIdentity: string;
    policyVersion: string;
    nodeId: string;
    mutationDomain: string;
    operation: string;
    decision: string;
    obligations: readonly Obligation[];
    policySetFingerprint: string;
    provenanceRef: string;
  },
  options: OperationOptions,
): Result<string> {
  const obligationDigest = computeSealedObligationDigest(fields.obligations, options);
  if (!obligationDigest.ok) return obligationDigest;
  return sha(options, {
    packId: fields.packId,
    packDigest: fields.packDigest,
    taskIdentity: fields.taskIdentity,
    policyVersion: fields.policyVersion,
    nodeId: fields.nodeId,
    mutationDomain: fields.mutationDomain,
    operation: fields.operation,
    decision: fields.decision,
    obligationDigest: obligationDigest.value,
    policySetFingerprint: fields.policySetFingerprint,
    provenanceRef: fields.provenanceRef,
  });
}

/**
 * Recompute a verified projection seal from its own sealed fields.
 * Detects tampering of any sealed field with a stale digest. A
 * from-scratch forgery with an internally consistent digest is still
 * rejected downstream because lease issuance re-runs GEM checks against
 * the independently verified pack instead of trusting the seal alone.
 */
export function verifyVerifiedProjection(
  projection: VerifiedEnforcementProjection,
  options: OperationOptions,
): Result<{ verified: true }> {
  const c = cancelled(options);
  if (c) return c;
  const seal = (projection as Partial<VerifiedEnforcementProjection>);
  for (const field of ['packId', 'packDigest', 'taskIdentity', 'policyVersion', 'obligationDigest', 'projectionDigest'] as const) {
    if (typeof seal[field] !== 'string' || (seal[field] as string).trim().length === 0) {
      return fail('POLICY_PROJECTION_INVALID', `Verified projection carries no ${field}`, projection.nodeId);
    }
  }
  const obligationDigest = computeSealedObligationDigest(projection.obligations, options);
  if (!obligationDigest.ok) return obligationDigest;
  if (obligationDigest.value !== projection.obligationDigest) {
    return fail('POLICY_PROJECTION_INVALID', 'Projection obligation digest drifted; tampering suspected', projection.nodeId);
  }
  const recomputed = computeProjectionDigest(
    {
      packId: projection.packId,
      packDigest: projection.packDigest,
      taskIdentity: projection.taskIdentity,
      policyVersion: projection.policyVersion,
      nodeId: projection.nodeId,
      mutationDomain: projection.mutationDomain,
      operation: projection.operation,
      decision: projection.decision,
      obligations: [...projection.obligations],
      policySetFingerprint: projection.policySetFingerprint,
      provenanceRef: projection.provenanceRef,
    },
    options,
  );
  if (!recomputed.ok) return recomputed;
  if (recomputed.value !== projection.projectionDigest) {
    return fail('POLICY_PROJECTION_INVALID', 'Projection digest does not match its sealed fields', projection.nodeId);
  }
  return { ok: true, value: deepFreeze({ verified: true as const }) };
}

/** Deterministic seal over one applied exception authorization. */
function computeExceptionAuthorizationDigest(
  fields: {
    warrantId: string;
    warrantFingerprint: string;
    maxUses: number;
    useCountAtApplication: number;
    relaxedObligations: readonly string[];
    compensatingControls: readonly string[];
    reviewTrigger: string;
  },
  options: OperationOptions,
): Result<string> {
  return sha(options, {
    warrantId: fields.warrantId,
    warrantFingerprint: fields.warrantFingerprint,
    maxUses: fields.maxUses,
    useCountAtApplication: fields.useCountAtApplication,
    relaxedObligations: sortedStrings(fields.relaxedObligations),
    compensatingControls: sortedStrings(fields.compensatingControls),
    reviewTrigger: fields.reviewTrigger,
  });
}

/**
 * Independently verify a sealed applied-exception authorization.
 * Recomputes the digest from its own fields; stale-field tampering fails.
 */
export function verifyAppliedExceptionAuthorization(
  authorization: AppliedExceptionAuthorization,
  options: OperationOptions,
): Result<{ verified: true }> {
  const c = cancelled(options);
  if (c) return c;
  if (!authorization || typeof authorization.warrantId !== 'string' || authorization.warrantId.trim().length === 0) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Exception authorization requires a warrant identity');
  }
  if (typeof authorization.warrantFingerprint !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(authorization.warrantFingerprint)) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', `Exception authorization for ${authorization.warrantId} carries an invalid warrant fingerprint`, authorization.warrantId);
  }
  if (!Number.isInteger(authorization.maxUses) || authorization.maxUses < 1) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', `Exception authorization for ${authorization.warrantId} carries an invalid use bound`, authorization.warrantId);
  }
  if (!Number.isInteger(authorization.useCountAtApplication) || authorization.useCountAtApplication < 0 || authorization.useCountAtApplication >= authorization.maxUses) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', `Exception authorization for ${authorization.warrantId} carries an out-of-bound use count`, authorization.warrantId);
  }
  const recomputed = computeExceptionAuthorizationDigest(
    {
      warrantId: authorization.warrantId,
      warrantFingerprint: authorization.warrantFingerprint,
      maxUses: authorization.maxUses,
      useCountAtApplication: authorization.useCountAtApplication,
      relaxedObligations: [...authorization.relaxedObligations],
      compensatingControls: [...authorization.compensatingControls],
      reviewTrigger: authorization.reviewTrigger,
    },
    options,
  );
  if (!recomputed.ok) return recomputed;
  if (recomputed.value !== authorization.authorizationDigest) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', `Exception authorization digest drifted for ${authorization.warrantId}`, authorization.warrantId);
  }
  return { ok: true, value: deepFreeze({ verified: true as const }) };
}

/**
 * Project a valid PDR onto exact M15 execution nodes and mutation domains.
 * Consumes the trusted M15 receipt — never a caller-provided boolean.
 * Cannot authorize mutations the M15 pack did not declare, cannot broaden
 * a mutation domain, and cannot turn an invalid/stale pack into work.
 *
 * HIGH-1 closure: the candidate M15 pack seal is independently re-verified
 * by recomputation (never by comparing stored digest fields), the PDR seal
 * is re-verified, and the PDR pack/task/policy binding must exactly match
 * the M15 pack and its trusted receipt. A tampered payload that keeps a
 * stale stored digest, or a PDR bound to another task/policy version,
 * fails closed.
 *
 * HIGH-A closure: each returned projection is a sealed
 * VerifiedEnforcementProjection binding exact pack/digest/task/policy,
 * node/domain/operation, PDR digest, policy set and obligation semantics
 * under a deterministic projection digest. Plain caller-constructed
 * objects carry no valid seal.
 */
export function projectDecisionToNodes(
  input: {
    receipt: PolicyDecisionReceipt;
    pack: ExecutionPack;
    trustedPackReceipt: PackReceipt;
    operations: readonly GuardedOperation[];
  },
  options: OperationOptions,
): Result<readonly VerifiedEnforcementProjection[]> {
  const { receipt, pack, trustedPackReceipt, operations } = input;
  const c = cancelled(options);
  if (c) return c;
  if (!options || !options.digest || options.digest.algorithm !== 'sha256') {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'GEM requires an injected SHA-256 digest capability for independent seal re-verification',
      pack.packId,
    );
  }

  if (trustedPackReceipt.packId !== pack.packId) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'M15 receipt pack identity does not match the candidate pack',
      pack.packId,
    );
  }
  if (trustedPackReceipt.status !== 'VALID' || !trustedPackReceipt.replayable) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      `M15 pack receipt is ${trustedPackReceipt.status}; only VALID replayable packs are projectable`,
      pack.packId,
    );
  }
  // Independent seal re-verification: recompute all four M15 digests from
  // the candidate payload and compare against the trusted receipt. Stored
  // pack.digest fields are never trusted on their own.
  const recomputed = computeSealedDigests(pack, options);
  if (!recomputed.ok) return recomputed;
  if (recomputed.value.semanticDigest !== trustedPackReceipt.semanticDigest) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'M15 candidate pack semantic seal drifted from the trusted receipt; tampering suspected',
      pack.packId,
    );
  }
  if (recomputed.value.graphDigest !== trustedPackReceipt.graphDigest) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'M15 candidate pack graph seal drifted from the trusted receipt',
      pack.packId,
    );
  }
  if (recomputed.value.toolPlanDigest !== trustedPackReceipt.toolPlanDigest) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'M15 candidate pack tool-plan seal drifted from the trusted receipt',
      pack.packId,
    );
  }
  if (recomputed.value.validationPlanDigest !== trustedPackReceipt.validationPlanDigest) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      'M15 candidate pack validation-plan seal drifted from the trusted receipt',
      pack.packId,
    );
  }
  // Exact PDR pack/task/policy binding to the M15 pack and trusted receipt.
  if (receipt.packIdentity !== pack.packId) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      `PDR guards pack ${receipt.packIdentity} but projection targets ${pack.packId}`,
      pack.packId,
    );
  }
  if (receipt.taskIdentity !== pack.taskIdentity || receipt.taskIdentity !== trustedPackReceipt.taskIdentity) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      `PDR task binding ${receipt.taskIdentity} does not exactly match pack ${pack.taskIdentity} and receipt ${trustedPackReceipt.taskIdentity}`,
      pack.packId,
    );
  }
  if (receipt.policyVersion !== pack.policyVersion || receipt.policyVersion !== trustedPackReceipt.policyVersion) {
    return fail(
      'POLICY_GEM_PACK_RECEIPT_INVALID',
      `PDR policy binding ${receipt.policyVersion} does not exactly match pack ${pack.policyVersion} and receipt ${trustedPackReceipt.policyVersion}`,
      pack.packId,
    );
  }
  // PDR seal re-verification: tampered PDR payload with an unchanged digest fails.
  const pdrCheck = verifyPolicyDecisionReceipt(receipt, options);
  if (!pdrCheck.ok) return pdrCheck;

  const nodesById = new Map(pack.workDag.map(n => [n.instructionId, n]));
  const tableByNode = new Map(pack.guardrailTable.map(g => [g.nodeId, g]));
  const boundCount = Object.keys(receipt.policyFingerprintById ?? {}).length;
  const effectivePolicies = new Set(
    boundCount > 0 ? receipt.provenance.map(p => p.policyId) : [],
  );
  const verifiedPackDigest = recomputed.value.semanticDigest;
  const projections: VerifiedEnforcementProjection[] = [];

  for (const operation of operations) {
    const node = nodesById.get(operation.nodeId);
    if (node === undefined) {
      return fail(
        'POLICY_GEM_UNKNOWN_NODE',
        `Guarded operation targets unknown pack node ${operation.nodeId}`,
        operation.nodeId,
      );
    }
    if (!node.mutationDomains.includes(operation.mutationDomain)) {
      return fail(
        'POLICY_GEM_UNDECLARED_MUTATION',
        `Node ${operation.nodeId} does not declare mutation domain ${operation.mutationDomain}; M16 cannot authorize undeclared mutations`,
        operation.mutationDomain,
      );
    }
    if (!pack.allowedMutations.includes(operation.mutationDomain)) {
      return fail(
        'POLICY_GEM_DOMAIN_NOT_PERMITTED',
        `Mutation domain ${operation.mutationDomain} is outside the pack allowedMutations; broadening is forbidden`,
        operation.mutationDomain,
      );
    }
    const binding = tableByNode.get(operation.nodeId);
    const boundPolicies = binding === undefined ? [] : [...binding.policyIds].sort(compareCodePoint);
    const governing = boundPolicies.filter(p => effectivePolicies.has(p));
    if (governing.length === 0) {
      return fail(
        'POLICY_GEM_POLICY_NOT_BOUND',
        `Node ${operation.nodeId} has no guardrail policy bound to the effective decision policies`,
        operation.nodeId,
      );
    }
    const obligationDigest = computeSealedObligationDigest([...receipt.obligations], options);
    if (!obligationDigest.ok) return obligationDigest;
    const projectionDigest = computeProjectionDigest(
      {
        packId: pack.packId,
        packDigest: verifiedPackDigest,
        taskIdentity: pack.taskIdentity,
        policyVersion: pack.policyVersion,
        nodeId: operation.nodeId,
        mutationDomain: operation.mutationDomain,
        operation: operation.operation,
        decision: receipt.decision,
        obligations: [...receipt.obligations],
        policySetFingerprint: receipt.policySetFingerprint,
        provenanceRef: receipt.digest,
      },
      options,
    );
    if (!projectionDigest.ok) return projectionDigest;
    projections.push({
      nodeId: operation.nodeId,
      mutationDomain: operation.mutationDomain,
      operation: operation.operation,
      decision: receipt.decision,
      obligations: [...receipt.obligations],
      policySetFingerprint: receipt.policySetFingerprint,
      provenanceRef: receipt.digest,
      packId: pack.packId,
      packDigest: verifiedPackDigest,
      taskIdentity: pack.taskIdentity,
      policyVersion: pack.policyVersion,
      obligationDigest: obligationDigest.value,
      projectionDigest: projectionDigest.value,
    });
  }

  projections.sort(
    (a, b) =>
      compareCodePoint(a.nodeId, b.nodeId) ||
      compareCodePoint(a.mutationDomain, b.mutationDomain) ||
      compareCodePoint(a.operation, b.operation),
  );
  return { ok: true, value: deepFreeze(projections) };
}

// ─── Mutation Capability Lease (MCL) ──────────────────────────────────────────

/**
 * Issue short-lived semantic authorization bound to exact project, pack,
 * decision, node, mutation domain/operation, policy fingerprint and
 * obligations. Wall-clock time alone is not authority: validity is proven
 * later by fingerprint revalidation (PTS), not by timestamps.
 *
 * HIGH-2 closure: authority derives only from the verified GEM/PDR chain.
 * The caller must present the sealed PDR that produced the projection;
 * the PDR seal is re-verified, the projection provenance must equal the
 * PDR digest, the supplied decision digest must equal both, the projection
 * policy set must equal the PDR set, and the lease pack must equal the PDR
 * pack. Caller-forged raw digests or projections fail closed.
 *
 * HIGH-A closure: the caller must additionally present the independently
 * verified M15 pack and its trusted receipt. The pack seal is recomputed
 * inside this path, the caller-supplied packDigest must exactly match the
 * verified digest, the projection seal is recomputed, and GEM node checks
 * (declared node, declared domain, permitted domain, bound policy) are
 * re-run against the verified pack. A manually constructed projection for
 * an undeclared node — even with the real PDR digest and policy set —
 * fails here because it never passed GEM.
 */
export function issueMutationLease(
  input: {
    projection: VerifiedEnforcementProjection | EnforcementProjection;
    receipt: PolicyDecisionReceipt;
    pack: ExecutionPack;
    trustedPackReceipt: PackReceipt;
    projectId: string;
    packId: string;
    packDigest: string;
    decisionDigest: string;
    obligations?: readonly Obligation[] | undefined;
    exceptionAuthorizations?: readonly AppliedExceptionAuthorization[] | undefined;
    warrantIds?: readonly string[] | undefined;
    warrantFingerprints?: Readonly<Record<string, string>> | undefined;
    warrantLimits?: Readonly<Record<string, number>> | undefined;
    reviewTrigger: string;
  },
  options: OperationOptions,
): Result<MutationCapabilityLease> {
  const c = cancelled(options);
  if (c) return c;

  if (input.projection.decision !== 'ALLOW' && input.projection.decision !== 'ALLOW_WITH_OBLIGATIONS') {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      `Cannot lease node ${input.projection.nodeId}: decision is ${input.projection.decision}`,
      input.projection.nodeId,
    );
  }
  if (!input.projectId || !input.packId || !input.packDigest || !input.decisionDigest) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Lease requires project, pack and decision bindings');
  }
  if (!input.reviewTrigger || input.reviewTrigger.trim().length === 0) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Lease requires a review trigger');
  }
  if (!input.receipt || typeof input.receipt.digest !== 'string') {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Lease requires the sealed PDR that produced the projection');
  }
  if (!input.pack || !input.trustedPackReceipt) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Lease requires the verified M15 pack and trusted receipt');
  }
  // Independently verify the M15 pack inside the lease path: a
  // caller-supplied packDigest becomes authority only when it matches the
  // recomputed seal against the trusted receipt.
  if (input.trustedPackReceipt.packId !== input.pack.packId) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Trusted M15 receipt does not match the candidate pack', input.pack.packId);
  }
  if (input.trustedPackReceipt.status !== 'VALID' || !input.trustedPackReceipt.replayable) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Trusted M15 receipt is not VALID replayable', input.pack.packId);
  }
  const recomputedPack = computeSealedDigests(input.pack, options);
  if (!recomputedPack.ok) return recomputedPack;
  if (recomputedPack.value.semanticDigest !== input.trustedPackReceipt.semanticDigest) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Candidate M15 pack seal drifted from the trusted receipt', input.pack.packId);
  }
  if (input.packDigest !== recomputedPack.value.semanticDigest) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Caller-supplied pack digest does not match the independently verified M15 pack',
      input.pack.packId,
    );
  }
  // The PDR seal itself must verify: a tampered receipt cannot authorize.
  const receiptCheck = verifyPolicyDecisionReceipt(input.receipt, options);
  if (!receiptCheck.ok) return receiptCheck;
  if (input.receipt.packIdentity !== input.pack.packId) {
    return fail('POLICY_LEASE_DECISION_NOT_PERMISSIVE', 'Sealed PDR pack does not match the verified M15 pack', input.pack.packId);
  }
  // The projection must provably come from this PDR, and the supplied
  // decision binding must equal both. Caller-crafted ALLOW projections
  // with mismatched digests fail here.
  if (input.projection.provenanceRef !== input.receipt.digest) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Projection provenance does not match the sealed PDR; caller-forged projections are rejected',
      input.projection.nodeId,
    );
  }
  if (input.decisionDigest !== input.receipt.digest || input.decisionDigest !== input.projection.provenanceRef) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Lease decision binding must exactly equal the verified PDR digest and projection provenance',
      input.projection.nodeId,
    );
  }
  if (input.projection.policySetFingerprint !== input.receipt.policySetFingerprint) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Projection policy set does not match the sealed PDR policy set',
      input.projection.nodeId,
    );
  }
  if (input.projection.decision !== input.receipt.decision) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Projection decision does not match the sealed PDR decision',
      input.projection.nodeId,
    );
  }
  if (input.packId !== input.receipt.packIdentity || input.packId !== input.pack.packId) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      `Lease pack ${input.packId} does not match sealed PDR pack ${input.receipt.packIdentity}`,
      input.packId,
    );
  }
  // Sealed-projection verification: the projection must carry a valid
  // GEM seal over the verified pack bindings.
  const sealed = input.projection as Partial<VerifiedEnforcementProjection>;
  if (typeof sealed.projectionDigest !== 'string' || typeof sealed.packDigest !== 'string') {
    return fail(
      'POLICY_PROJECTION_INVALID',
      'Lease requires a sealed verified GEM projection, not a plain caller object',
      input.projection.nodeId,
    );
  }
  const verifiedProjection = input.projection as VerifiedEnforcementProjection;
  const projectionCheck = verifyVerifiedProjection(verifiedProjection, options);
  if (!projectionCheck.ok) return projectionCheck;
  if (verifiedProjection.packId !== input.pack.packId || verifiedProjection.packDigest !== recomputedPack.value.semanticDigest) {
    return fail(
      'POLICY_PROJECTION_INVALID',
      'Projection pack binding does not match the independently verified M15 pack',
      input.projection.nodeId,
    );
  }
  if (verifiedProjection.taskIdentity !== input.pack.taskIdentity || verifiedProjection.policyVersion !== input.pack.policyVersion) {
    return fail(
      'POLICY_PROJECTION_INVALID',
      'Projection task/policy binding does not match the verified M15 pack',
      input.projection.nodeId,
    );
  }
  // Re-run GEM node checks against the verified pack: a forged projection
  // for an undeclared node/domain, or a node with no bound effective
  // policy, fails here even when it copies real digests.
  const nodesById = new Map(input.pack.workDag.map(n => [n.instructionId, n]));
  const node = nodesById.get(verifiedProjection.nodeId);
  if (node === undefined) {
    return fail('POLICY_GEM_UNKNOWN_NODE', `Lease projection targets unknown pack node ${verifiedProjection.nodeId}`, verifiedProjection.nodeId);
  }
  if (!node.mutationDomains.includes(verifiedProjection.mutationDomain)) {
    return fail('POLICY_GEM_UNDECLARED_MUTATION', `Node ${verifiedProjection.nodeId} does not declare mutation domain ${verifiedProjection.mutationDomain}`, verifiedProjection.mutationDomain);
  }
  if (!input.pack.allowedMutations.includes(verifiedProjection.mutationDomain)) {
    return fail('POLICY_GEM_DOMAIN_NOT_PERMITTED', `Mutation domain ${verifiedProjection.mutationDomain} is outside pack allowedMutations`, verifiedProjection.mutationDomain);
  }
  const tableByNode = new Map(input.pack.guardrailTable.map(g => [g.nodeId, g]));
  const effectivePolicies = new Set(input.receipt.provenance.map(p => p.policyId));
  const boundPolicies = tableByNode.get(verifiedProjection.nodeId);
  const governing = (boundPolicies === undefined ? [] : [...boundPolicies.policyIds]).filter(p => effectivePolicies.has(p));
  if (governing.length === 0) {
    return fail('POLICY_GEM_POLICY_NOT_BOUND', `Node ${verifiedProjection.nodeId} has no guardrail policy bound to the effective decision`, verifiedProjection.nodeId);
  }

  // HIGH-F: lease obligations derive exactly from the verified
  // projection. A caller-supplied override is accepted only as a
  // compatibility echo: it must canonically equal the verified
  // obligations, otherwise any omission, addition or semantic change
  // fails closed. An ALLOW_WITH_OBLIGATIONS lease can never shed controls.
  const canonicalObligation = (o: Obligation): string =>
    JSON.stringify({
      id: o.obligationId,
      statement: o.statement,
      mandatory: o.mandatory,
      dependsOn: [...o.dependsOn].sort(compareCodePoint),
      conflictsWith: [...o.conflictsWith].sort(compareCodePoint),
    });
  const verifiedObligations = sortedStrings(verifiedProjection.obligations.map(canonicalObligation));
  if (input.obligations !== undefined) {
    const supplied = sortedStrings([...input.obligations].map(canonicalObligation));
    if (JSON.stringify(supplied) !== JSON.stringify(verifiedObligations)) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        'Caller-supplied lease obligations do not exactly match the verified projection obligations',
        verifiedProjection.nodeId,
      );
    }
  }
  const obligations = [...verifiedProjection.obligations];

  // HIGH-G: exception authorization derives exactly from the sealed PDR.
  // For every exceptionsApplied entry the lease must carry the exact
  // sealed AppliedExceptionAuthorization emitted by verified exception
  // application. Missing, extra or mismatched bindings fail closed; raw
  // caller warrant fields never create exception authority.
  if (input.warrantIds !== undefined || input.warrantFingerprints !== undefined || input.warrantLimits !== undefined) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      'Lease warrant state derives only from sealed exception authorizations, not raw caller warrant fields',
      verifiedProjection.nodeId,
    );
  }
  const suppliedAuthorizations = [...(input.exceptionAuthorizations ?? [])];
  const pdrExceptions = [...input.receipt.exceptionsApplied].sort((a, b) => compareCodePoint(a.warrantId, b.warrantId));
  const orderedAuthorizations = [...suppliedAuthorizations].sort((a, b) => compareCodePoint(a.warrantId, b.warrantId));
  if (pdrExceptions.length !== orderedAuthorizations.length) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      `Sealed PDR carries ${pdrExceptions.length} applied exception(s) but lease supplies ${orderedAuthorizations.length} authorization(s)`,
      verifiedProjection.nodeId,
    );
  }
  const seenAuthorizationIds = new Set<string>();
  for (const authorization of orderedAuthorizations) {
    if (seenAuthorizationIds.has(authorization.warrantId)) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Duplicate exception authorization for ${authorization.warrantId}`,
        authorization.warrantId,
      );
    }
    seenAuthorizationIds.add(authorization.warrantId);
    const authorizationCheck = verifyAppliedExceptionAuthorization(authorization, options);
    if (!authorizationCheck.ok) return authorizationCheck;
  }
  for (const applied of pdrExceptions) {
    const authorization = orderedAuthorizations.find(a => a.warrantId === applied.warrantId);
    if (authorization === undefined) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Applied exception ${applied.warrantId} has no sealed lease authorization; omitting it is rejected`,
        applied.warrantId,
      );
    }
    if (JSON.stringify(sortedStrings(authorization.relaxedObligations)) !== JSON.stringify(sortedStrings(applied.relaxedObligations))) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Exception authorization for ${applied.warrantId} does not match the sealed PDR application`,
        applied.warrantId,
      );
    }
    if (JSON.stringify(sortedStrings(authorization.compensatingControls)) !== JSON.stringify(sortedStrings(applied.compensatingControls))) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Exception authorization controls for ${applied.warrantId} do not match the sealed PDR`,
        applied.warrantId,
      );
    }
    if (authorization.reviewTrigger !== applied.reviewTrigger) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Exception authorization review trigger for ${applied.warrantId} does not match the sealed PDR`,
        applied.warrantId,
      );
    }
  }
  const warrantIds = orderedAuthorizations.map(a => a.warrantId);
  const warrantFingerprints: Record<string, string> = {};
  const warrantLimits: Record<string, number> = {};
  for (const authorization of orderedAuthorizations) {
    warrantFingerprints[authorization.warrantId] = authorization.warrantFingerprint;
    warrantLimits[authorization.warrantId] = authorization.maxUses;
  }

  const policyById: Record<string, string> = { ...input.receipt.policyFingerprintById };
  const leaseId = sha(options, {
    projectId: input.projectId,
    packId: input.packId,
    packDigest: recomputedPack.value.semanticDigest,
    decisionDigest: input.receipt.digest,
    nodeId: verifiedProjection.nodeId,
    mutationDomain: verifiedProjection.mutationDomain,
    operation: verifiedProjection.operation,
    policySetFingerprint: verifiedProjection.policySetFingerprint,
    projectionDigest: verifiedProjection.projectionDigest,
    policyBindings: bindPolicyFingerprints(policyById),
    obligations: verifiedObligations,
    exceptionAuthorizations: sortedStrings(
      orderedAuthorizations.map(a =>
        JSON.stringify({
          warrantId: a.warrantId,
          warrantFingerprint: a.warrantFingerprint,
          maxUses: a.maxUses,
          useCountAtApplication: a.useCountAtApplication,
          relaxedObligations: sortedStrings(a.relaxedObligations),
          compensatingControls: sortedStrings(a.compensatingControls),
          reviewTrigger: a.reviewTrigger,
          authorizationDigest: a.authorizationDigest,
        }),
      ),
    ),
    warrantIds,
    warrantFingerprints,
    warrantLimits,
    reviewTrigger: input.reviewTrigger,
  });
  if (!leaseId.ok) return leaseId;

  return {
    ok: true,
    value: deepFreeze({
      leaseId: leaseId.value,
      projectId: input.projectId,
      packId: input.pack.packId,
      packDigest: recomputedPack.value.semanticDigest,
      decisionDigest: input.receipt.digest,
      nodeId: verifiedProjection.nodeId,
      mutationDomain: verifiedProjection.mutationDomain,
      operation: verifiedProjection.operation,
      policySetFingerprint: verifiedProjection.policySetFingerprint,
      policyFingerprintById: policyById,
      projectionDigest: verifiedProjection.projectionDigest,
      obligations,
      exceptionAuthorizations: [...orderedAuthorizations],
      warrantIds,
      warrantFingerprints,
      warrantLimits,
      reviewTrigger: input.reviewTrigger,
    }),
  };
}

/**
 * High-level verified lease path: receives the M15 pack, its trusted
 * receipt, the sealed PDR and one guarded operation, runs GEM internally
 * and issues the lease. No raw caller projection ever creates authority
 * on this path.
 */
export function issueVerifiedMutationLease(
  input: {
    pack: ExecutionPack;
    trustedPackReceipt: PackReceipt;
    receipt: PolicyDecisionReceipt;
    operation: GuardedOperation;
    projectId: string;
    reviewTrigger: string;
    obligations?: readonly Obligation[] | undefined;
    exceptionAuthorizations?: readonly AppliedExceptionAuthorization[] | undefined;
  },
  options: OperationOptions,
): Result<{ lease: MutationCapabilityLease; projection: VerifiedEnforcementProjection }> {
  const c = cancelled(options);
  if (c) return c;
  const projected = projectDecisionToNodes(
    {
      receipt: input.receipt,
      pack: input.pack,
      trustedPackReceipt: input.trustedPackReceipt,
      operations: [input.operation],
    },
    options,
  );
  if (!projected.ok) return projected;
  const projection = projected.value[0];
  if (projection === undefined) {
    return fail('POLICY_GEM_UNKNOWN_NODE', 'Verified GEM projection produced no output', input.operation.nodeId);
  }
  const leased = issueMutationLease(
    {
      projection,
      receipt: input.receipt,
      pack: input.pack,
      trustedPackReceipt: input.trustedPackReceipt,
      projectId: input.projectId,
      packId: input.pack.packId,
      packDigest: projection.packDigest,
      decisionDigest: input.receipt.digest,
      ...(input.obligations === undefined ? {} : { obligations: input.obligations }),
      ...(input.exceptionAuthorizations === undefined ? {} : { exceptionAuthorizations: input.exceptionAuthorizations }),
      reviewTrigger: input.reviewTrigger,
    },
    options,
  );
  if (!leased.ok) return leased;
  return { ok: true, value: deepFreeze({ lease: leased.value, projection }) };
}

// ─── Exception Blast-Radius Cap (EBRC) ────────────────────────────────────────

/** Canonical affected-set fingerprint for cap sealing. */
function computeAffectedSetFingerprint(
  sets: { nodeIds: readonly string[]; mutationDomains: readonly string[]; obligations: readonly string[] },
  options: OperationOptions,
): Result<string> {
  return sha(options, {
    nodeIds: sortedStrings(sets.nodeIds),
    mutationDomains: sortedStrings(sets.mutationDomains),
    obligations: sortedStrings(sets.obligations),
  });
}

/**
 * Cap exception effects to explicitly named obligations/domains/nodes.
 * The warrant scope must fit inside the computed maximum affected set, all
 * target policies must share one precedence domain (no cross-domain
 * relaxation), and every relaxed obligation must be named by the warrant.
 *
 * HIGH-B closure: the returned cap is a sealed validity-bound artifact.
 * It binds warrant identity/fingerprint, target policies, precedence
 * domain, the canonical affected set and the use-count bound under a
 * deterministic cap digest. Only `checkExceptionBlastRadius` can issue
 * it; `applyExceptionWarrant` independently verifies it.
 */
export function checkExceptionBlastRadius(
  warrant: ExceptionWarrant,
  policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>,
  maxAffected: { nodeIds: readonly string[]; mutationDomains: readonly string[]; obligations: readonly string[] },
  currentUses: number,
  options: OperationOptions,
): Result<BlastRadiusCap> {
  if (isWarrantExhausted(warrant, currentUses)) {
    return fail(
      'POLICY_WARRANT_EXHAUSTED',
      `Warrant ${warrant.warrantId} exhausted after ${currentUses} uses`,
      warrant.warrantId,
    );
  }
  const domains = new Set<string>();
  for (const policyId of warrant.targetPolicyIds) {
    const policy = policiesById.get(policyId);
    if (policy === undefined) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} targets unknown policy ${policyId}`,
        policyId,
      );
    }
    domains.add(policy.precedenceDomain);
  }
  if (domains.size > 1) {
    return fail(
      'POLICY_WARRANT_CROSS_DOMAIN',
      `Warrant ${warrant.warrantId} spans unrelated authority domains: ${[...domains].sort(compareCodePoint).join(',')}`,
      warrant.warrantId,
    );
  }
  const maxNodes = new Set(maxAffected.nodeIds);
  const maxDomains = new Set(maxAffected.mutationDomains);
  const maxObligations = new Set(maxAffected.obligations);
  for (const nodeId of warrant.scopeNodeIds) {
    if (!maxNodes.has(nodeId)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} scope escapes the affected node set at ${nodeId}`,
        nodeId,
      );
    }
  }
  for (const domain of warrant.scopeMutationDomains) {
    if (!maxDomains.has(domain)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} scope escapes the affected mutation domains at ${domain}`,
        domain,
      );
    }
  }
  for (const obligation of warrant.targetObligations) {
    if (!maxObligations.has(obligation)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} names obligation ${obligation} outside the affected set`,
        obligation,
      );
    }
  }
  // Every target domain must be governed by a target policy scope.
  const governed = new Set<string>();
  for (const policyId of warrant.targetPolicyIds) {
    const policy = policiesById.get(policyId);
    if (policy !== undefined) {
      for (const domain of policy.scopeDomains) governed.add(domain);
    }
  }
  for (const domain of warrant.targetDomains) {
    if (!governed.has(domain) && !governed.has('*')) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} targets domain ${domain} governed by no target policy`,
        domain,
      );
    }
  }
  const precedenceDomain = [...domains].sort(compareCodePoint)[0] ?? '';
  const sealedSets = {
    nodeIds: sortedStrings(warrant.scopeNodeIds),
    mutationDomains: sortedStrings(warrant.scopeMutationDomains),
    obligations: sortedStrings(warrant.targetObligations),
  };
  const affectedSetFingerprint = computeAffectedSetFingerprint(sealedSets, options);
  if (!affectedSetFingerprint.ok) return affectedSetFingerprint;
  // HIGH-H: bind the cap to the exact target-policy semantics, not only
  // warrant strings. Policy drift after issuance invalidates the cap.
  const targetBindings: Record<string, string> = {};
  for (const policyId of sortedStrings(warrant.targetPolicyIds)) {
    const policy = policiesById.get(policyId);
    if (policy === undefined) {
      return fail('POLICY_WARRANT_SCOPE_EXCEEDED', `Warrant ${warrant.warrantId} targets unknown policy ${policyId}`, policyId);
    }
    targetBindings[policyId] = policy.semanticIdentity;
  }
  const policySetFingerprint = sha(options, { policies: bindPolicyFingerprints(targetBindings) });
  if (!policySetFingerprint.ok) return policySetFingerprint;
  const capDigest = sha(options, {
    warrantId: warrant.warrantId,
    warrantFingerprint: warrant.semanticFingerprint,
    targetPolicyIds: sortedStrings(warrant.targetPolicyIds),
    precedenceDomain,
    policySetFingerprint: policySetFingerprint.value,
    affectedSetFingerprint: affectedSetFingerprint.value,
    useCount: currentUses,
    maxUses: warrant.maxUses,
  });
  if (!capDigest.ok) return capDigest;
  return {
    ok: true,
    value: deepFreeze({
      warrantId: warrant.warrantId,
      warrantFingerprint: warrant.semanticFingerprint,
      targetPolicyIds: sortedStrings(warrant.targetPolicyIds),
      precedenceDomain,
      nodeIds: sealedSets.nodeIds,
      mutationDomains: sealedSets.mutationDomains,
      obligations: sealedSets.obligations,
      useCount: currentUses,
      maxUses: warrant.maxUses,
      policySetFingerprint: policySetFingerprint.value,
      affectedSetFingerprint: affectedSetFingerprint.value,
      capDigest: capDigest.value,
    }),
  };
}

/**
 * Independently verify a sealed blast-radius cap against the warrant it
 * claims to authorize. Recomputes the affected-set fingerprint and the cap
 * digest; any forged set, reused warrant binding, changed fingerprint,
 * target, affected set or use count fails closed.
 */
export function verifyBlastRadiusCap(
  cap: BlastRadiusCap,
  warrant: ExceptionWarrant,
  options: OperationOptions,
): Result<{ verified: true }> {
  const c = cancelled(options);
  if (c) return c;
  if (!cap || cap.warrantId !== warrant.warrantId) {
    return fail('POLICY_CAP_INVALID', 'Blast-radius cap is not bound to this warrant', warrant.warrantId);
  }
  if (cap.warrantFingerprint !== warrant.semanticFingerprint) {
    return fail('POLICY_CAP_INVALID', `Cap warrant fingerprint drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (JSON.stringify([...cap.targetPolicyIds].sort(compareCodePoint)) !== JSON.stringify(sortedStrings(warrant.targetPolicyIds))) {
    return fail('POLICY_CAP_INVALID', `Cap target policies drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (cap.maxUses !== warrant.maxUses) {
    return fail('POLICY_CAP_INVALID', `Cap use bound drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (!Number.isInteger(cap.useCount) || cap.useCount < 0 || cap.useCount >= warrant.maxUses) {
    return fail('POLICY_CAP_INVALID', `Cap use count is outside the live bound for ${warrant.warrantId}`, warrant.warrantId);
  }
  const affectedSetFingerprint = computeAffectedSetFingerprint(
    { nodeIds: [...cap.nodeIds], mutationDomains: [...cap.mutationDomains], obligations: [...cap.obligations] },
    options,
  );
  if (!affectedSetFingerprint.ok) return affectedSetFingerprint;
  if (affectedSetFingerprint.value !== cap.affectedSetFingerprint) {
    return fail('POLICY_CAP_INVALID', `Cap affected-set fingerprint drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (typeof cap.policySetFingerprint !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(cap.policySetFingerprint)) {
    return fail('POLICY_CAP_INVALID', `Cap policy-set binding missing for ${warrant.warrantId}`, warrant.warrantId);
  }
  const capDigest = sha(options, {
    warrantId: cap.warrantId,
    warrantFingerprint: cap.warrantFingerprint,
    targetPolicyIds: sortedStrings(cap.targetPolicyIds),
    precedenceDomain: cap.precedenceDomain,
    policySetFingerprint: cap.policySetFingerprint,
    affectedSetFingerprint: cap.affectedSetFingerprint,
    useCount: cap.useCount,
    maxUses: cap.maxUses,
  });
  if (!capDigest.ok) return capDigest;
  if (capDigest.value !== cap.capDigest) {
    return fail('POLICY_CAP_INVALID', `Cap digest does not match its sealed fields for ${warrant.warrantId}`, warrant.warrantId);
  }
  // The sealed sets must exactly equal the warrant scope: a cap whose
  // sets merely cover the scope but differ is a different validity bound.
  if (JSON.stringify(sortedStrings(cap.nodeIds)) !== JSON.stringify(sortedStrings(warrant.scopeNodeIds))) {
    return fail('POLICY_CAP_INVALID', `Cap node set drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (JSON.stringify(sortedStrings(cap.mutationDomains)) !== JSON.stringify(sortedStrings(warrant.scopeMutationDomains))) {
    return fail('POLICY_CAP_INVALID', `Cap domain set drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  if (JSON.stringify(sortedStrings(cap.obligations)) !== JSON.stringify(sortedStrings(warrant.targetObligations))) {
    return fail('POLICY_CAP_INVALID', `Cap obligation set drifted for ${warrant.warrantId}`, warrant.warrantId);
  }
  return { ok: true, value: deepFreeze({ verified: true as const }) };
}

/**
 * Apply a capped warrant to a receipt: relax only the named obligations,
 * record the application, and preserve exception debt for S04 instead of
 * pretending the underlying obligation disappeared.
 *
 * HIGH-3 closure: the validity-bound EBRC cap is enforced here, not
 * ignored. Every warrant scope element must fit inside the cap, and the
 * exception-mutated PDR is resealed with a fresh digest so the old digest
 * can never authorize the relaxed semantics.
 *
 * HIGH-H closure: cap self-consistency is never proof of derivation. The
 * caller supplies the trusted derivation context (policies, affected-set
 * authority, use state); the expected cap is re-derived inside this path
 * and the supplied cap must exactly equal it. A fully self-consistent
 * forged cap computed without `checkExceptionBlastRadius` still fails
 * whenever the trusted context forbids the warrant (cross-domain,
 * out-of-affected-set, drifted policy fingerprints or use count).
 */
export function applyExceptionWarrant(
  receipt: PolicyDecisionReceipt,
  warrant: ExceptionWarrant,
  cap: BlastRadiusCap,
  derivation: {
    policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>;
    maxAffected: { nodeIds: readonly string[]; mutationDomains: readonly string[]; obligations: readonly string[] };
    currentUses: number;
  },
  options: OperationOptions,
): Result<WarrantApplication> {
  const c = cancelled(options);
  if (c) return c;
  if (!derivation || !derivation.policiesById || !derivation.maxAffected || !Number.isInteger(derivation.currentUses)) {
    return fail('POLICY_CAP_INVALID', 'Exception application requires the trusted derivation context', warrant.warrantId);
  }
  // HIGH-B: independently verify the sealed cap and its exact
  // warrant/context binding before use. A plain structural object with
  // identical sets carries no seal and fails here.
  const capCheck = verifyBlastRadiusCap(cap, warrant, options);
  if (!capCheck.ok) return capCheck;
  // HIGH-H: re-derive the expected cap from the trusted context and
  // require exact equality. Self-consistent forgery without derivation
  // fails here.
  const derived = checkExceptionBlastRadius(warrant, derivation.policiesById, derivation.maxAffected, derivation.currentUses, options);
  if (!derived.ok) return derived;
  const expected = derived.value;
  if (
    expected.capDigest !== cap.capDigest ||
    expected.affectedSetFingerprint !== cap.affectedSetFingerprint ||
    expected.policySetFingerprint !== cap.policySetFingerprint ||
    expected.useCount !== cap.useCount ||
    JSON.stringify(sortedStrings(expected.targetPolicyIds)) !== JSON.stringify(sortedStrings(cap.targetPolicyIds)) ||
    expected.precedenceDomain !== cap.precedenceDomain ||
    JSON.stringify(expected.nodeIds) !== JSON.stringify(sortedStrings(cap.nodeIds)) ||
    JSON.stringify(expected.mutationDomains) !== JSON.stringify(sortedStrings(cap.mutationDomains)) ||
    JSON.stringify(expected.obligations) !== JSON.stringify(sortedStrings(cap.obligations))
  ) {
    return fail(
      'POLICY_CAP_INVALID',
      `Cap for ${warrant.warrantId} does not match derivation under the trusted policy/affected-set/use context`,
      warrant.warrantId,
    );
  }
  // Enforce the cap: forged or reused caps that do not cover the warrant
  // scope fail closed.
  const capNodes = new Set(cap.nodeIds);
  const capDomains = new Set(cap.mutationDomains);
  const capObligations = new Set(cap.obligations);
  for (const nodeId of warrant.scopeNodeIds) {
    if (!capNodes.has(nodeId)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} scope node ${nodeId} escapes the blast-radius cap`,
        nodeId,
      );
    }
  }
  for (const domain of warrant.scopeMutationDomains) {
    if (!capDomains.has(domain)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} mutation domain ${domain} escapes the blast-radius cap`,
        domain,
      );
    }
  }
  for (const obligation of warrant.targetObligations) {
    if (!capObligations.has(obligation)) {
      return fail(
        'POLICY_WARRANT_SCOPE_EXCEEDED',
        `Warrant ${warrant.warrantId} obligation ${obligation} escapes the blast-radius cap`,
        obligation,
      );
    }
  }
  const receiptCheck = verifyPolicyDecisionReceipt(receipt, options);
  if (!receiptCheck.ok) return receiptCheck;

  const relaxed = new Set(warrant.targetObligations);
  const remaining = receipt.obligations.filter(o => !relaxed.has(o.obligationId));
  const relaxedIds = sortedStrings(
    receipt.obligations.filter(o => relaxed.has(o.obligationId)).map(o => o.obligationId),
  );
  const application = {
    warrantId: warrant.warrantId,
    relaxedObligations: relaxedIds,
    compensatingControls: [...warrant.compensatingControls],
    reviewTrigger: warrant.reviewTrigger,
  };
  const debt: ExceptionDebtEntry = {
    warrantId: warrant.warrantId,
    status: 'ACTIVE',
    compensatingControls: [...warrant.compensatingControls],
    reviewTrigger: warrant.reviewTrigger,
  };
  // HIGH-G: emit the sealed exception authorization consumed by leases.
  const authorizationDigest = computeExceptionAuthorizationDigest(
    {
      warrantId: warrant.warrantId,
      warrantFingerprint: warrant.semanticFingerprint,
      maxUses: warrant.maxUses,
      useCountAtApplication: derivation.currentUses,
      relaxedObligations: relaxedIds,
      compensatingControls: [...warrant.compensatingControls],
      reviewTrigger: warrant.reviewTrigger,
    },
    options,
  );
  if (!authorizationDigest.ok) return authorizationDigest;
  const exceptionAuthorization: AppliedExceptionAuthorization = deepFreeze({
    warrantId: warrant.warrantId,
    warrantFingerprint: warrant.semanticFingerprint,
    maxUses: warrant.maxUses,
    useCountAtApplication: derivation.currentUses,
    relaxedObligations: relaxedIds,
    compensatingControls: [...warrant.compensatingControls],
    reviewTrigger: warrant.reviewTrigger,
    authorizationDigest: authorizationDigest.value,
  });
  // Reseal the mutated PDR: the relaxed receipt carries a fresh digest
  // bound to the new obligations and the recorded exception application.
  // Decision evidence (request, witnesses, mandatory resolution, schemas,
  // lattice) is preserved from the original sealed receipt.
  const resealed = issuePolicyDecisionReceipt(
    {
      packIdentity: receipt.packIdentity,
      taskIdentity: receipt.taskIdentity,
      policyVersion: receipt.policyVersion,
      decision: receipt.decision,
      obligations: remaining,
      denials: [...receipt.denials],
      unknowns: [...receipt.unknowns],
      conflicts: [...receipt.conflicts],
      exceptionsApplied: [...receipt.exceptionsApplied, application],
      provenance: [...receipt.provenance],
      policyFingerprints: { ...receipt.policyFingerprintById },
      request: { domains: [...receipt.request.domains], operations: [...receipt.request.operations] },
      applicabilityWitnesses: [...receipt.applicabilityWitnesses],
      mandatoryDomains: [...receipt.mandatoryDomains],
      unresolvedMandatoryDomains: [...receipt.unresolvedMandatoryDomains],
      supportedSchemas: [...receipt.supportedSchemas],
      latticeEvidence: {
        domains: receipt.latticeEvidence.domains.map(d => ({ domain: d.domain, order: [...d.order] })),
        evidenceFingerprint: receipt.latticeEvidence.evidenceFingerprint,
      },
    },
    options,
  );
  if (!resealed.ok) return resealed;
  return {
    ok: true,
    value: deepFreeze({
      receipt: resealed.value,
      debt,
      exceptionAuthorization,
    }),
  };
}

/**
 * High-level verified exception path: receives trusted policies plus the
 * affected-set/use inputs, derives the sealed cap internally and applies
 * it. No caller-authored cap ever becomes authority on this path.
 */
export function applyVerifiedException(
  receipt: PolicyDecisionReceipt,
  warrant: ExceptionWarrant,
  trustedContext: {
    policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>;
    maxAffected: { nodeIds: readonly string[]; mutationDomains: readonly string[]; obligations: readonly string[] };
    currentUses: number;
  },
  options: OperationOptions,
): Result<WarrantApplication> {
  const c = cancelled(options);
  if (c) return c;
  const derived = checkExceptionBlastRadius(
    warrant, trustedContext.policiesById, trustedContext.maxAffected, trustedContext.currentUses, options,
  );
  if (!derived.ok) return derived;
  return applyExceptionWarrant(receipt, warrant, derived.value, trustedContext, options);
}

// ─── Policy TOCTOU Sentinel (PTS) ─────────────────────────────────────────────

/**
 * Revalidate a lease immediately before the guarded mutation: the pack
 * digest, the policy-set fingerprint (re-hashed from current ID-bound
 * fingerprints) and every bound warrant fingerprint/use count must still
 * match. A fingerprint change after decision but before mutation
 * invalidates authorization — time-of-check is never time-of-use
 * authority.
 *
 * HIGH-4 closure: revalidation is over exact ID-to-fingerprint bindings
 * (`"<id>:<fp>"`), never bare value sets. Swapped fingerprints across IDs,
 * dropped IDs or injected IDs change the bound hash and fail closed. When
 * the lease carries its sealed ID map, the current ID set must match it
 * exactly before hash comparison.
 */
export function revalidateLeaseAtMutation(
  lease: MutationCapabilityLease,
  current: LeaseCheckInput,
  options: OperationOptions,
): Result<{ authorized: true; leaseId: string }> {
  if (current.packDigest !== lease.packDigest) {
    return fail(
      'POLICY_LEASE_STALE_PACK',
      `Lease ${lease.leaseId} pack digest drifted before mutation`,
      lease.nodeId,
    );
  }
  const currentIds = Object.keys(current.currentPolicyFingerprints).sort(compareCodePoint);
  for (const id of currentIds) {
    const fp = current.currentPolicyFingerprints[id];
    if (typeof fp !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(fp)) {
      return fail(
        'POLICY_LEASE_STALE_POLICY',
        `Lease ${lease.leaseId} current fingerprint for ${id} is malformed`,
        lease.nodeId,
      );
    }
  }
  const sealedIds = lease.policyFingerprintById
    ? Object.keys(lease.policyFingerprintById).sort(compareCodePoint)
    : null;
  if (sealedIds !== null && JSON.stringify(currentIds) !== JSON.stringify(sealedIds)) {
    return fail(
      'POLICY_LEASE_STALE_POLICY',
      `Lease ${lease.leaseId} policy identity set changed after decision`,
      lease.nodeId,
    );
  }
  if (sealedIds !== null) {
    for (const id of sealedIds) {
      if (current.currentPolicyFingerprints[id] !== (lease.policyFingerprintById as Record<string, string>)[id]) {
        return fail(
          'POLICY_LEASE_STALE_POLICY',
          `Lease ${lease.leaseId} policy ${id} fingerprint changed after decision`,
          lease.nodeId,
        );
      }
    }
  }
  const setFingerprint = sha(options, {
    policies: bindPolicyFingerprints({ ...current.currentPolicyFingerprints }),
  });
  if (!setFingerprint.ok) return setFingerprint;
  if (setFingerprint.value !== lease.policySetFingerprint) {
    return fail(
      'POLICY_LEASE_STALE_POLICY',
      `Lease ${lease.leaseId} policy fingerprints changed after decision`,
      lease.nodeId,
    );
  }
  for (const warrantId of lease.warrantIds) {
    const bound = lease.warrantFingerprints[warrantId] ?? '';
    const currentFingerprint = current.currentWarrantFingerprints[warrantId];
    if (currentFingerprint === undefined || currentFingerprint !== bound) {
      return fail(
        'POLICY_LEASE_STALE_WARRANT',
        `Lease ${lease.leaseId} warrant ${warrantId} changed or vanished before mutation`,
        warrantId,
      );
    }
    const uses = current.warrantUses[warrantId];
    const limit = lease.warrantLimits[warrantId] ?? 0;
    if (!Number.isInteger(uses) || (uses ?? 0) < 0) {
      return fail(
        'POLICY_LEASE_STALE_WARRANT',
        `Lease ${lease.leaseId} warrant ${warrantId} has unreadable use count`,
        warrantId,
      );
    }
    if ((uses ?? 0) >= limit) {
      return fail(
        'POLICY_LEASE_STALE_WARRANT',
        `Lease ${lease.leaseId} warrant ${warrantId} exhausted before mutation`,
        warrantId,
      );
    }
  }
  return { ok: true, value: deepFreeze({ authorized: true as const, leaseId: lease.leaseId }) };
}

// ─── Fail-Closed Degradation Mode (FDM) ───────────────────────────────────────
/**
 * Block affected actions when mandatory policy dependencies are unavailable,
 * stale, unsupported or indeterminate. Controls are never silently disabled:
 * degradation is an explicit blocked verdict naming every degraded
 * dependency.
 */
export function evaluateFailClosedDegradation(
  dependencies: readonly PolicyDependency[],
  affectedActions: readonly string[],
): Result<{ blockedActions: readonly string[] }> {
  const degraded = dependencies
    .filter(d => d.mandatory && d.state !== 'AVAILABLE')
    .map(d => `${d.name}:${d.state}`)
    .sort(compareCodePoint);
  if (degraded.length > 0) {
    return fail(
      'POLICY_DEGRADATION_BLOCKED',
      `Fail-closed degradation blocks ${affectedActions.length} action(s); degraded: ${degraded.join(',')}`,
      degraded[0],
    );
  }
  return { ok: true, value: deepFreeze({ blockedActions: [] }) };
}

// ─── Mutation authorization (GEM + MCL + PTS combined) ────────────────────────

/**
 * Answer whether one guarded mutation may proceed: the lease must scope-match
 * the enforcement projection and requested bindings exactly, then pass
 * TOCTOU revalidation. A lease presented for another node, domain,
 * operation, project or pack fails closed — leases are never transferable.
 *
 * HIGH-2 closure: the lease decision, the projection provenance and the
 * requested decision binding must all equal one verified PDR digest.
 * A mismatched decision digest (forged or reused EBRC-style) fails closed
 * here even if scope otherwise matches.
 *
 * HIGH-A closure: the lease is bound to the exact sealed projection digest
 * it was issued from. A swapped projection — even with matching scope
 * strings — fails unless its seal equals the lease's sealed digest.
 */
export function authorizeMutation(
  input: {
    lease: MutationCapabilityLease;
    projection: VerifiedEnforcementProjection | EnforcementProjection;
    projectId: string;
    packDigest: string;
    decisionDigest: string;
  },
  current: LeaseCheckInput,
  options: OperationOptions,
): Result<{ authorized: true; leaseId: string }> {
  const { lease, projection } = input;
  const scopeMismatch = (field: string): Result<{ authorized: true; leaseId: string }> =>
    fail(
      'POLICY_LEASE_SCOPE_MISMATCH',
      `Lease ${lease.leaseId} does not cover requested ${field}`,
      field,
    );
  if (lease.nodeId !== projection.nodeId) return scopeMismatch('nodeId');
  if (lease.mutationDomain !== projection.mutationDomain) return scopeMismatch('mutationDomain');
  if (lease.operation !== projection.operation) return scopeMismatch('operation');
  if (lease.projectId !== input.projectId) return scopeMismatch('projectId');
  if (lease.packDigest !== input.packDigest) return scopeMismatch('packDigest');
  if (lease.decisionDigest !== input.decisionDigest) return scopeMismatch('decisionDigest');
  if (lease.policySetFingerprint !== projection.policySetFingerprint) {
    return scopeMismatch('policySetFingerprint');
  }
  const sealedProjection = projection as Partial<VerifiedEnforcementProjection>;
  if (typeof sealedProjection.projectionDigest !== 'string' || sealedProjection.projectionDigest.trim().length === 0) {
    return fail(
      'POLICY_PROJECTION_INVALID',
      'Authorization requires a sealed verified GEM projection',
      projection.nodeId,
    );
  }
  if (lease.projectionDigest !== sealedProjection.projectionDigest) {
    return fail(
      'POLICY_LEASE_SCOPE_MISMATCH',
      'Lease projection seal does not match the presented projection',
      'projectionDigest',
    );
  }
  const projectionCheck = verifyVerifiedProjection(projection as VerifiedEnforcementProjection, options);
  if (!projectionCheck.ok) return projectionCheck;
  // Provenance-bound authorization: lease, projection and requested
  // decision must all name the same verified PDR digest.
  if (lease.decisionDigest !== projection.provenanceRef) {
    return fail(
      'POLICY_LEASE_SCOPE_MISMATCH',
      `Lease decision ${lease.decisionDigest} does not match projection provenance ${projection.provenanceRef}`,
      'decisionDigest',
    );
  }
  if (input.decisionDigest !== projection.provenanceRef) {
    return fail(
      'POLICY_LEASE_SCOPE_MISMATCH',
      `Requested decision ${input.decisionDigest} does not match projection provenance ${projection.provenanceRef}`,
      'decisionDigest',
    );
  }
  return revalidateLeaseAtMutation(lease, current, options);
}
