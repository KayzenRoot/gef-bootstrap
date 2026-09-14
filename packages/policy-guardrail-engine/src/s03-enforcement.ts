// M16 Policy & Guardrail Engine - s03-enforcement.ts
// S03: Guardrail Enforcement Membrane (GEM), Mutation Capability Lease (MCL),
//      Exception Blast-Radius Cap (EBRC), Policy TOCTOU Sentinel (PTS),
//      Fail-Closed Degradation Mode (FDM).
// Pure semantic authorization. M16 never mutates files, Git, GitHub,
// network/provider state or credentials.

import type {
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
 */
export function projectDecisionToNodes(
  input: {
    receipt: PolicyDecisionReceipt;
    pack: ExecutionPack;
    trustedPackReceipt: PackReceipt;
    operations: readonly GuardedOperation[];
  },
  options: OperationOptions,
): Result<readonly EnforcementProjection[]> {
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
  const projections: EnforcementProjection[] = [];

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
    projections.push({
      nodeId: operation.nodeId,
      mutationDomain: operation.mutationDomain,
      operation: operation.operation,
      decision: receipt.decision,
      obligations: [...receipt.obligations],
      policySetFingerprint: receipt.policySetFingerprint,
      provenanceRef: receipt.digest,
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
 */
export function issueMutationLease(
  input: {
    projection: EnforcementProjection;
    receipt: PolicyDecisionReceipt;
    projectId: string;
    packId: string;
    packDigest: string;
    decisionDigest: string;
    obligations?: readonly Obligation[] | undefined;
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
  // The PDR seal itself must verify: a tampered receipt cannot authorize.
  const receiptCheck = verifyPolicyDecisionReceipt(input.receipt, options);
  if (!receiptCheck.ok) return receiptCheck;
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
  if (input.packId !== input.receipt.packIdentity) {
    return fail(
      'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
      `Lease pack ${input.packId} does not match sealed PDR pack ${input.receipt.packIdentity}`,
      input.packId,
    );
  }

  const obligations = input.obligations ?? input.projection.obligations;
  const warrantIds = sortedStrings(input.warrantIds ?? []);
  const warrantFingerprints: Record<string, string> = {};
  const warrantLimits: Record<string, number> = {};
  for (const id of warrantIds) {
    warrantFingerprints[id] = input.warrantFingerprints?.[id] ?? '';
    const limit = input.warrantLimits?.[id];
    if (limit === undefined || !Number.isInteger(limit) || limit < 1) {
      return fail(
        'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
        `Leased warrant ${id} requires a positive use limit`,
        id,
      );
    }
    warrantLimits[id] = limit;
  }

  const policyById: Record<string, string> = { ...input.receipt.policyFingerprintById };
  const leaseId = sha(options, {
    projectId: input.projectId,
    packId: input.packId,
    packDigest: input.packDigest,
    decisionDigest: input.decisionDigest,
    nodeId: input.projection.nodeId,
    mutationDomain: input.projection.mutationDomain,
    operation: input.projection.operation,
    policySetFingerprint: input.projection.policySetFingerprint,
    policyBindings: bindPolicyFingerprints(policyById),
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
      packId: input.packId,
      packDigest: input.packDigest,
      decisionDigest: input.decisionDigest,
      nodeId: input.projection.nodeId,
      mutationDomain: input.projection.mutationDomain,
      operation: input.projection.operation,
      policySetFingerprint: input.projection.policySetFingerprint,
      policyFingerprintById: policyById,
      obligations: [...obligations],
      warrantIds,
      warrantFingerprints,
      warrantLimits,
      reviewTrigger: input.reviewTrigger,
    }),
  };
}

// ─── Exception Blast-Radius Cap (EBRC) ────────────────────────────────────────

/**
 * Cap exception effects to explicitly named obligations/domains/nodes.
 * The warrant scope must fit inside the computed maximum affected set, all
 * target policies must share one precedence domain (no cross-domain
 * relaxation), and every relaxed obligation must be named by the warrant.
 */
export function checkExceptionBlastRadius(
  warrant: ExceptionWarrant,
  policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>,
  maxAffected: { nodeIds: readonly string[]; mutationDomains: readonly string[]; obligations: readonly string[] },
  currentUses: number,
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
  return {
    ok: true,
    value: deepFreeze({
      nodeIds: sortedStrings(warrant.scopeNodeIds),
      mutationDomains: sortedStrings(warrant.scopeMutationDomains),
      obligations: sortedStrings(warrant.targetObligations),
    }),
  };
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
 */
export function applyExceptionWarrant(
  receipt: PolicyDecisionReceipt,
  warrant: ExceptionWarrant,
  cap: BlastRadiusCap,
  options: OperationOptions,
): Result<WarrantApplication> {
  const c = cancelled(options);
  if (c) return c;
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
  // Reseal the mutated PDR: the relaxed receipt carries a fresh digest
  // bound to the new obligations and the recorded exception application.
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
    },
    options,
  );
  if (!resealed.ok) return resealed;
  return {
    ok: true,
    value: deepFreeze({
      receipt: resealed.value,
      debt,
    }),
  };
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
 */
export function authorizeMutation(
  input: {
    lease: MutationCapabilityLease;
    projection: EnforcementProjection;
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
