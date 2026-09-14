// M16 Policy & Guardrail Engine - s04-regression.ts
// S04: Policy Regression Sentinel (PRS), Guardrail Coverage Map (GCM),
//      Policy Semantic Fingerprint (PSF), Exception Debt Register (EDR),
//      Continuity Policy Binding (CPB).
// Deterministic, read-only, startup-pure. No filesystem/network/Git mutation.

import type {
  ContinuityPolicyBinding,
  CoverageEntry,
  CoverageMap,
  ExceptionDebtEntry,
  ExceptionWarrant,
  OperationOptions,
  PolicyAuthorityCapsule,
  PolicySnapshot,
  RegressionFinding,
  RegressionKind,
  Result,
} from './types.js';
import {
  cancelled,
  compareCodePoint,
  deepFreeze,
  fail,
  sha,
  sortedStrings,
  validId,
} from './utils.js';

// ─── Policy Semantic Fingerprint (PSF) ────────────────────────────────────────

/**
 * Deterministic SHA-256 over normalized effective policy semantics —
 * identity, version, owner plus provenance, domains, applicability, effect,
 * obligations with full graph semantics, evidence, review and schema.
 * Order-independent; any semantic change alters the fingerprint. Timestamps
 * and path order never contribute.
 *
 * HIGH-6 closure: owner provenance, evidence fingerprint, review trigger
 * and obligation dependsOn/conflictsWith are sealed. Changing any of them
 * changes the fingerprint.
 */
export function computePolicySemanticFingerprint(
  policies: readonly PolicyAuthorityCapsule[],
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;
  return sha(options, {
    policies: sortedStrings(
      policies.map(p =>
        JSON.stringify({
          policyId: p.policyId,
          version: p.version,
          ownerAuthority: p.ownerAuthority,
          ownerProvenance: p.ownerProvenance,
          precedenceDomain: p.precedenceDomain,
          scopeDomains: [...p.scopeDomains].sort(compareCodePoint),
          applicability: {
            domains: [...p.applicability.domains].sort(compareCodePoint),
            operations: [...p.applicability.operations].sort(compareCodePoint),
            matchMode: p.applicability.matchMode,
          },
          effectOnMatch: p.effectOnMatch,
          obligations: [...p.obligations]
            .sort((a, b) => compareCodePoint(a.obligationId, b.obligationId))
            .map(o => ({
              id: o.obligationId,
              statement: o.statement,
              mandatory: o.mandatory,
              dependsOn: [...o.dependsOn].sort(compareCodePoint),
              conflictsWith: [...o.conflictsWith].sort(compareCodePoint),
            })),
          evidenceFingerprint: p.evidenceFingerprint,
          reviewTrigger: p.reviewTrigger,
          schemaVersion: p.schemaVersion,
        }),
      ),
    ),
  });
}

// ─── Policy Regression Sentinel (PRS) ─────────────────────────────────────────

function applicabilityEmpty(policy: PolicyAuthorityCapsule): boolean {
  return policy.applicability.domains.length === 0 && policy.applicability.operations.length === 0;
}

/**
 * Detect weakened guardrails between two snapshots: deny-to-allow,
 * unknown-to-allow (a previously UNKNOWN-generating policy removed),
 * mandatory obligation loss, broader exception scope, weakened authority
 * (owner/precedence change) and removed compensating controls. Output is
 * deterministically ordered; an empty result means no regression detected.
 */
export function detectPolicyRegression(
  previous: PolicySnapshot,
  current: PolicySnapshot,
): { findings: readonly RegressionFinding[]; hasRegression: boolean } {
  const findings: RegressionFinding[] = [];
  const prevPolicies = new Map(previous.policies.map(p => [p.policyId, p]));
  const currPolicies = new Map(current.policies.map(p => [p.policyId, p]));

  for (const [policyId, prev] of [...prevPolicies.entries()].sort((a, b) => compareCodePoint(a[0], b[0]))) {
    const curr = currPolicies.get(policyId);
    if (curr === undefined) {
      if (applicabilityEmpty(prev)) {
        findings.push({
          kind: 'UNKNOWN_TO_ALLOW',
          policyId,
          detail: `Policy ${policyId} with unknown applicability was removed`,
        });
      }
      for (const obligation of [...prev.obligations]
        .sort((a, b) => compareCodePoint(a.obligationId, b.obligationId))
        .filter(o => o.mandatory)) {
        findings.push({
          kind: 'OBLIGATION_LOSS',
          policyId,
          obligationId: obligation.obligationId,
          detail: `Mandatory obligation ${obligation.obligationId} lost with removed policy ${policyId}`,
        });
      }
      continue;
    }
    if (prev.effectOnMatch === 'DENY' && curr.effectOnMatch !== 'DENY') {
      findings.push({
        kind: 'DENY_TO_ALLOW',
        policyId,
        detail: `Policy ${policyId} relaxed from DENY to ${curr.effectOnMatch}`,
      });
    }
    if (
      prev.effectOnMatch === 'ALLOW_WITH_OBLIGATIONS' &&
      curr.effectOnMatch === 'ALLOW'
    ) {
      findings.push({
        kind: 'OBLIGATION_LOSS',
        policyId,
        detail: `Policy ${policyId} relaxed from ALLOW_WITH_OBLIGATIONS to ALLOW`,
      });
    }
    const prevMandatory = new Map(
      prev.obligations.filter(o => o.mandatory).map(o => [o.obligationId, o]),
    );
    const currMandatoryIds = new Set(
      curr.obligations.filter(o => o.mandatory).map(o => o.obligationId),
    );
    for (const obligationId of [...prevMandatory.keys()].sort(compareCodePoint)) {
      if (!currMandatoryIds.has(obligationId)) {
        findings.push({
          kind: 'OBLIGATION_LOSS',
          policyId,
          obligationId,
          detail: `Mandatory obligation ${obligationId} lost from policy ${policyId}`,
        });
      }
    }
    if (
      prev.ownerAuthority !== curr.ownerAuthority ||
      prev.precedenceDomain !== curr.precedenceDomain
    ) {
      findings.push({
        kind: 'WEAKENED_AUTHORITY',
        policyId,
        detail: `Policy ${policyId} authority changed owner/precedence domain`,
      });
    }
  }

  const prevWarrants = new Map(previous.warrants.map(w => [w.warrantId, w]));
  const currWarrants = new Map(current.warrants.map(w => [w.warrantId, w]));
  for (const [warrantId, prev] of [...prevWarrants.entries()].sort((a, b) => compareCodePoint(a[0], b[0]))) {
    const curr = currWarrants.get(warrantId);
    if (curr === undefined) continue;
    // Set-based scope comparison: any added element, any target-policy
    // change, or any maxUses increase is a broadening, even at identical
    // cardinality. Length-only checks miss same-size substitutions.
    const prevTargets = new Set(prev.targetPolicyIds);
    const currTargets = new Set(curr.targetPolicyIds);
    const targetChanged =
      prevTargets.size !== currTargets.size || [...currTargets].some(id => !prevTargets.has(id));
    const setBroadened = (
      prevSet: readonly string[],
      currSet: readonly string[],
    ): boolean => {
      const before = new Set(prevSet);
      return currSet.some(entry => !before.has(entry));
    };
    const broader =
      targetChanged ||
      setBroadened(prev.targetDomains, curr.targetDomains) ||
      setBroadened(prev.scopeNodeIds, curr.scopeNodeIds) ||
      setBroadened(prev.scopeMutationDomains, curr.scopeMutationDomains) ||
      setBroadened(prev.targetObligations, curr.targetObligations) ||
      curr.maxUses > prev.maxUses;
    if (broader) {
      const kind: RegressionKind = 'BROADER_EXCEPTION_SCOPE';
      findings.push({
        kind,
        warrantId,
        detail: `Warrant ${warrantId} scope broadened beyond its previous bound`,
      });
    }
    const prevControls = new Set(prev.compensatingControls);
    const dropped = [...prevControls].sort(compareCodePoint).filter(control => !curr.compensatingControls.includes(control));
    if (dropped.length > 0) {
      findings.push({
        kind: 'REMOVED_COMPENSATING_CONTROL',
        warrantId,
        detail: `Warrant ${warrantId} dropped compensating controls: ${dropped.join(',')}`,
      });
    }
  }

  const ordered = findings.sort((a, b) =>
    compareCodePoint(a.kind, b.kind) ||
    compareCodePoint(a.policyId ?? '', b.policyId ?? '') ||
    compareCodePoint(a.warrantId ?? '', b.warrantId ?? '') ||
    compareCodePoint(a.detail, b.detail),
  );
  return deepFreeze({ findings: ordered, hasRegression: ordered.length > 0 });
}

// ─── Guardrail Coverage Map (GCM) ─────────────────────────────────────────────

function policyCoversOperation(
  policy: PolicyAuthorityCapsule,
  operation: string,
  domain: string,
): boolean {
  const domainHit =
    policy.applicability.domains.includes('*') || policy.applicability.domains.includes(domain);
  const operationHit =
    policy.applicability.operations.includes('*') || policy.applicability.operations.includes(operation);
  if (policy.applicability.domains.length === 0 && policy.applicability.operations.length === 0) {
    return false;
  }
  return policy.applicability.matchMode === 'ANY' ? domainHit || operationHit : domainHit && operationHit;
}

/**
 * Map protected operations/domains/nodes to effective policies and
 * obligations, exposing gaps. Deterministic; an operation with no
 * applicable policy is an explicit gap, never silent coverage.
 */
export function buildGuardrailCoverageMap(
  protectedOperations: readonly { operation: string; domain: string; nodeId?: string | undefined }[],
  policies: readonly PolicyAuthorityCapsule[],
): CoverageMap {
  const orderedPolicies = [...policies].sort((a, b) => compareCodePoint(a.policyId, b.policyId));
  const entries: CoverageEntry[] = protectedOperations.map(op => {
    const covering = orderedPolicies.filter(p => policyCoversOperation(p, op.operation, op.domain));
    const obligationIds = sortedStrings(
      [...new Set(covering.flatMap(p => p.obligations.map(o => o.obligationId)))],
    );
    const entry: CoverageEntry = {
      operation: op.operation,
      domain: op.domain,
      ...(op.nodeId === undefined ? {} : { nodeId: op.nodeId }),
      policyIds: covering.map(p => p.policyId),
      obligationIds,
      covered: covering.length > 0,
    };
    return entry;
  });
  entries.sort(
    (a, b) =>
      compareCodePoint(a.domain, b.domain) ||
      compareCodePoint(a.operation, b.operation) ||
      compareCodePoint(a.nodeId ?? '', b.nodeId ?? ''),
  );
  const gaps = entries.filter(e => !e.covered);
  return deepFreeze({ entries, gaps });
}

// ─── Exception Debt Register (EDR) ────────────────────────────────────────────

/** Open debt for a warrant. Debt is never silently discarded afterwards. */
export function openExceptionDebt(warrant: ExceptionWarrant): ExceptionDebtEntry {
  return deepFreeze({
    warrantId: warrant.warrantId,
    status: 'ACTIVE' as const,
    compensatingControls: [...warrant.compensatingControls],
    reviewTrigger: warrant.reviewTrigger,
  });
}

/**
 * Resolve debt only with an explicit resolution reference. Double resolution
 * and unknown warrants fail closed — resolved debt stays recorded.
 */
export function resolveExceptionDebt(
  register: readonly ExceptionDebtEntry[],
  warrantId: string,
  resolutionRef: string,
): Result<readonly ExceptionDebtEntry[]> {
  if (!resolutionRef || resolutionRef.trim().length === 0) {
    return fail('POLICY_DEBT_UNKNOWN_WARRANT', 'Debt resolution requires a resolution reference', warrantId);
  }
  const index = register.findIndex(e => e.warrantId === warrantId);
  if (index === -1) {
    return fail('POLICY_DEBT_UNKNOWN_WARRANT', `No debt recorded for warrant ${warrantId}`, warrantId);
  }
  const entry = register[index];
  if (entry === undefined || entry.status === 'RESOLVED') {
    return fail(
      'POLICY_DEBT_ALREADY_RESOLVED',
      `Debt for warrant ${warrantId} is already resolved`,
      warrantId,
    );
  }
  const next = register.map((e, i) =>
    i === index ? { ...e, status: 'RESOLVED' as const, resolutionRef } : e,
  );
  return { ok: true, value: deepFreeze(next) };
}

/**
 * Refresh review states from current use counts. Exhausted warrants become
 * STALE_REVIEW but are kept — review debt is never dropped by refresh.
 */
export function refreshDebtReviews(
  register: readonly ExceptionDebtEntry[],
  usesByWarrant: Readonly<Record<string, { uses: number; maxUses: number }>>,
): readonly ExceptionDebtEntry[] {
  return deepFreeze(
    register.map(entry => {
      if (entry.status !== 'ACTIVE') return entry;
      const state = usesByWarrant[entry.warrantId];
      if (state !== undefined && state.uses >= state.maxUses) {
        return { ...entry, status: 'STALE_REVIEW' as const };
      }
      return entry;
    }),
  );
}

// ─── Continuity Policy Binding (CPB) ──────────────────────────────────────────

/** Bind the exact policy identities/fingerprints/decision for M17/M18. */
export function bindContinuityPolicy(
  input: {
    projectId: string;
    taskIdentity: string;
    packDigest: string;
    decisionDigest: string;
    policies: readonly PolicyAuthorityCapsule[];
  },
): Result<ContinuityPolicyBinding> {
  if (!validId(input.projectId)) {
    return fail('POLICY_CONTINUITY_DRIFT', 'Continuity binding requires a valid projectId', input.projectId);
  }
  const fingerprints: Record<string, string> = {};
  for (const policy of [...input.policies].sort((a, b) => compareCodePoint(a.policyId, b.policyId))) {
    fingerprints[policy.policyId] = policy.semanticIdentity;
  }
  return {
    ok: true,
    value: deepFreeze({
      projectId: input.projectId,
      taskIdentity: input.taskIdentity,
      packDigest: input.packDigest,
      decisionDigest: input.decisionDigest,
      policyIdentities: sortedStrings(Object.keys(fingerprints)),
      policyFingerprints: fingerprints,
    }),
  };
}

/**
 * Revalidate continuity bindings: project, task, pack, decision and every
 * policy fingerprint must still match. Any drift fails closed.
 */
export function revalidateContinuityPolicy(
  binding: ContinuityPolicyBinding,
  current: {
    projectId: string;
    taskIdentity: string;
    packDigest: string;
    decisionDigest: string;
    policyFingerprints: Readonly<Record<string, string>>;
  },
): Result<{ revalidated: true }> {
  const drift: string[] = [];
  if (current.projectId !== binding.projectId) drift.push('projectId');
  if (current.taskIdentity !== binding.taskIdentity) drift.push('taskIdentity');
  if (current.packDigest !== binding.packDigest) drift.push('packDigest');
  if (current.decisionDigest !== binding.decisionDigest) drift.push('decisionDigest');
  const currentIds = sortedStrings(Object.keys(current.policyFingerprints));
  if (JSON.stringify(currentIds) !== JSON.stringify([...binding.policyIdentities])) {
    drift.push('policyIdentities');
  } else {
    for (const id of binding.policyIdentities) {
      if (current.policyFingerprints[id] !== binding.policyFingerprints[id]) {
        drift.push(`policy:${id}`);
      }
    }
  }
  if (drift.length > 0) {
    return fail(
      'POLICY_CONTINUITY_DRIFT',
      `Continuity drift detected in: ${drift.join(',')}`,
      drift[0],
    );
  }
  return { ok: true, value: deepFreeze({ revalidated: true as const }) };
}
