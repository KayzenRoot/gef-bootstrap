// M16 Policy & Guardrail Engine - s01-policy-model.ts
// S01: Policy Authority Capsule (PAC), Guardrail Decision Algebra (GDA),
//      Policy Domain Lattice (PDL), Exception Warrant (EW),
//      Policy Provenance Chain (PPC).
// Deterministic, read-only, startup-pure. No filesystem/network/Git mutation.
// Newest-wins, majority vote, model confidence and path/array order are
// forbidden authority mechanisms: precedence comes only from the explicit
// per-domain lattice, never from version recency or input ordering.

import type {
  ExceptionWarrant,
  Obligation,
  OperationOptions,
  PolicyApplicability,
  PolicyAuthorityCapsule,
  PolicyDecision,
  PolicyDomainLattice,
  PolicyEffect,
  PolicyProvenanceLink,
  PrecedenceComparison,
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

const EFFECT_VALUES: ReadonlySet<string> = new Set(['ALLOW', 'ALLOW_WITH_OBLIGATIONS', 'DENY']);
const DECISION_VALUES: ReadonlySet<string> = new Set([
  'ALLOW',
  'ALLOW_WITH_OBLIGATIONS',
  'DENY',
  'BLOCK_UNKNOWN',
]);

function validateObligationShape(obligation: Obligation, policyId: string): string | null {
  if (!validId(obligation.obligationId)) return `Policy ${policyId}: invalid obligationId`;
  if (!obligation.statement || obligation.statement.trim().length === 0) {
    return `Policy ${policyId}: obligation ${obligation.obligationId} has no statement`;
  }
  return null;
}

// ─── Policy Authority Capsule (PAC) ───────────────────────────────────────────

/** Create a versioned, identity-bound policy authority capsule. */
export function createPolicyAuthorityCapsule(
  input: {
    policyId: string;
    version: string;
    ownerAuthority: string;
    ownerProvenance: string;
    scopeDomains: readonly string[];
    applicability: PolicyApplicability;
    precedenceDomain: string;
    effectOnMatch: PolicyEffect;
    obligations: readonly Obligation[];
    evidenceFingerprint: string;
    reviewTrigger: string;
    schemaVersion: string;
  },
  options: OperationOptions,
): Result<PolicyAuthorityCapsule> {
  const c = cancelled(options);
  if (c) return c;

  if (!validId(input.policyId)) {
    return fail('POLICY_CAPSULE_INVALID', 'policyId is invalid or empty', input.policyId);
  }
  if (!input.version || input.version.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy version is required', input.policyId);
  }
  if (!input.ownerAuthority || input.ownerAuthority.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy owner authority is required', input.policyId);
  }
  if (!input.ownerProvenance || input.ownerProvenance.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy owner provenance is required', input.policyId);
  }
  if (input.scopeDomains.length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy scope domains are required', input.policyId);
  }
  if (!input.precedenceDomain || input.precedenceDomain.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy precedence domain is required', input.policyId);
  }
  if (!EFFECT_VALUES.has(input.effectOnMatch)) {
    return fail(
      'POLICY_DECISION_INVALID',
      `Unknown policy effect: ${input.effectOnMatch}`,
      input.policyId,
    );
  }
  if (input.applicability.matchMode !== 'ANY' && input.applicability.matchMode !== 'ALL') {
    return fail('POLICY_CAPSULE_INVALID', 'Applicability matchMode must be ANY or ALL', input.policyId);
  }
  for (const obligation of input.obligations) {
    const shapeError = validateObligationShape(obligation, input.policyId);
    if (shapeError) return fail('POLICY_CAPSULE_INVALID', shapeError, input.policyId);
  }
  if (!input.evidenceFingerprint || input.evidenceFingerprint.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy evidence fingerprint is required', input.policyId);
  }
  if (!input.reviewTrigger || input.reviewTrigger.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy review trigger is required', input.policyId);
  }
  if (!input.schemaVersion || input.schemaVersion.trim().length === 0) {
    return fail('POLICY_CAPSULE_INVALID', 'Policy schema version is required', input.policyId);
  }

  const digest = sha(options, {
    policyId: input.policyId,
    version: input.version,
    ownerAuthority: input.ownerAuthority,
    ownerProvenance: input.ownerProvenance,
    scopeDomains: sortedStrings(input.scopeDomains),
    applicability: {
      domains: sortedStrings(input.applicability.domains),
      operations: sortedStrings(input.applicability.operations),
      matchMode: input.applicability.matchMode,
    },
    precedenceDomain: input.precedenceDomain,
    effectOnMatch: input.effectOnMatch,
    obligations: sortedStrings(
      input.obligations.map(o =>
        JSON.stringify({
          id: o.obligationId,
          statement: o.statement,
          mandatory: o.mandatory,
          dependsOn: [...o.dependsOn].sort(compareCodePoint),
          conflictsWith: [...o.conflictsWith].sort(compareCodePoint),
        }),
      ),
    ),
    evidenceFingerprint: input.evidenceFingerprint,
    reviewTrigger: input.reviewTrigger,
    schemaVersion: input.schemaVersion,
  });
  if (!digest.ok) return digest;

  return {
    ok: true,
    value: deepFreeze({
      policyId: input.policyId,
      version: input.version,
      ownerAuthority: input.ownerAuthority,
      ownerProvenance: input.ownerProvenance,
      scopeDomains: sortedStrings(input.scopeDomains),
      applicability: {
        domains: sortedStrings(input.applicability.domains),
        operations: sortedStrings(input.applicability.operations),
        matchMode: input.applicability.matchMode,
      },
      precedenceDomain: input.precedenceDomain,
      effectOnMatch: input.effectOnMatch,
      obligations: [...input.obligations].sort((a, b) => compareCodePoint(a.obligationId, b.obligationId)),
      evidenceFingerprint: input.evidenceFingerprint,
      reviewTrigger: input.reviewTrigger,
      schemaVersion: input.schemaVersion,
      semanticIdentity: digest.value,
    }),
  };
}

// ─── Guardrail Decision Algebra (GDA) ─────────────────────────────────────────

/**
 * Combine decisions with set semantics: DENY is never erased by ALLOW,
 * BLOCK_UNKNOWN is never converted to permissive success, and an empty set
 * is BLOCK_UNKNOWN (unknown), never ALLOW. Order-independent by construction.
 */
export function combineDecisions(decisions: readonly PolicyDecision[]): PolicyDecision {
  let hasDeny = false;
  let hasUnknown = false;
  let hasObligated = false;
  for (const decision of decisions) {
    if (!DECISION_VALUES.has(decision)) return 'BLOCK_UNKNOWN';
    if (decision === 'DENY') hasDeny = true;
    else if (decision === 'BLOCK_UNKNOWN') hasUnknown = true;
    else if (decision === 'ALLOW_WITH_OBLIGATIONS') hasObligated = true;
  }
  if (hasDeny) return 'DENY';
  if (hasUnknown) return 'BLOCK_UNKNOWN';
  if (hasObligated) return 'ALLOW_WITH_OBLIGATIONS';
  return decisions.length === 0 ? 'BLOCK_UNKNOWN' : 'ALLOW';
}

/** Permissive outcomes: execution may proceed (possibly with obligations). */
export function isPermissiveDecision(decision: PolicyDecision): boolean {
  return decision === 'ALLOW' || decision === 'ALLOW_WITH_OBLIGATIONS';
}

// ─── Policy Domain Lattice (PDL) ─────────────────────────────────────────────

/**
 * Compare two policies inside one precedence domain using only the explicit
 * lattice order. Different domains are INCOMPARABLE: no global rank may
 * override an unrelated authority domain. Policies absent from the order
 * are UNORDERED — version recency, input position and timestamps confer
 * no authority.
 */
export function comparePolicyPrecedence(
  lattice: PolicyDomainLattice,
  domain: string,
  policyA: string,
  policyB: string,
): PrecedenceComparison {
  const entry = lattice.domains.find(d => d.domain === domain);
  if (entry === undefined) return 'INCOMPARABLE';
  if (policyA === policyB) return 'A_FIRST';
  const indexA = entry.order.indexOf(policyA);
  const indexB = entry.order.indexOf(policyB);
  if (indexA === -1 || indexB === -1) return 'UNORDERED';
  if (indexA < indexB) return 'A_FIRST';
  if (indexA > indexB) return 'B_FIRST';
  return 'UNORDERED';
}

/**
 * Assert that two policies live in different precedence domains and therefore
 * neither suppresses the other. Returns the pair sorted for determinism.
 */
export function assertDomainIndependent(
  policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>,
  policyA: string,
  policyB: string,
): Result<readonly [string, string]> {
  const a = policiesById.get(policyA);
  const b = policiesById.get(policyB);
  if (a === undefined || b === undefined) {
    return fail('POLICY_PRECEDENCE_INCOMPARABLE', 'Unknown policy in domain independence check');
  }
  if (a.precedenceDomain === b.precedenceDomain) {
    return fail(
      'POLICY_PRECEDENCE_INCOMPARABLE',
      `Policies ${policyA} and ${policyB} share precedence domain ${a.precedenceDomain}`,
      a.precedenceDomain,
    );
  }
  const pair: readonly [string, string] =
    compareCodePoint(policyA, policyB) <= 0 ? [policyA, policyB] : [policyB, policyA];
  return { ok: true, value: deepFreeze(pair) };
}

// ─── Exception Warrant (EW) ───────────────────────────────────────────────────

/** Create an explicit, bounded exception warrant. Missing fields fail closed. */
export function createExceptionWarrant(
  input: {
    warrantId: string;
    targetPolicyIds: readonly string[];
    targetDomains: readonly string[];
    targetObligations: readonly string[];
    scopeNodeIds: readonly string[];
    scopeMutationDomains: readonly string[];
    rationale: string;
    compensatingControls: readonly string[];
    approvedByAuthority: string;
    approverProvenance: string;
    reviewTrigger: string;
    maxUses: number;
  },
  options: OperationOptions,
): Result<ExceptionWarrant> {
  const c = cancelled(options);
  if (c) return c;

  if (!validId(input.warrantId)) {
    return fail('POLICY_WARRANT_INVALID', 'warrantId is invalid or empty', input.warrantId);
  }
  if (input.targetPolicyIds.length === 0) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant must name target policies', input.warrantId);
  }
  if (input.targetDomains.length === 0 && input.targetObligations.length === 0) {
    return fail(
      'POLICY_WARRANT_INVALID',
      'Warrant must name target domains or obligations',
      input.warrantId,
    );
  }
  if (!input.rationale || input.rationale.trim().length === 0) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant rationale is required', input.warrantId);
  }
  if (input.compensatingControls.length === 0) {
    return fail(
      'POLICY_WARRANT_INVALID',
      'Warrant requires compensating controls',
      input.warrantId,
    );
  }
  if (!input.approvedByAuthority || input.approvedByAuthority.trim().length === 0) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant approving authority is required', input.warrantId);
  }
  if (!input.approverProvenance || input.approverProvenance.trim().length === 0) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant approver provenance is required', input.warrantId);
  }
  if (!input.reviewTrigger || input.reviewTrigger.trim().length === 0) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant review trigger is required', input.warrantId);
  }
  if (!Number.isInteger(input.maxUses) || input.maxUses < 1) {
    return fail('POLICY_WARRANT_INVALID', 'Warrant maxUses must be a positive integer', input.warrantId);
  }

  const fingerprint = sha(options, {
    warrantId: input.warrantId,
    targetPolicyIds: sortedStrings(input.targetPolicyIds),
    targetDomains: sortedStrings(input.targetDomains),
    targetObligations: sortedStrings(input.targetObligations),
    scopeNodeIds: sortedStrings(input.scopeNodeIds),
    scopeMutationDomains: sortedStrings(input.scopeMutationDomains),
    rationale: input.rationale,
    compensatingControls: sortedStrings(input.compensatingControls),
    approvedByAuthority: input.approvedByAuthority,
    approverProvenance: input.approverProvenance,
    reviewTrigger: input.reviewTrigger,
    maxUses: input.maxUses,
  });
  if (!fingerprint.ok) return fingerprint;

  return {
    ok: true,
    value: deepFreeze({
      warrantId: input.warrantId,
      targetPolicyIds: sortedStrings(input.targetPolicyIds),
      targetDomains: sortedStrings(input.targetDomains),
      targetObligations: sortedStrings(input.targetObligations),
      scopeNodeIds: sortedStrings(input.scopeNodeIds),
      scopeMutationDomains: sortedStrings(input.scopeMutationDomains),
      rationale: input.rationale,
      compensatingControls: sortedStrings(input.compensatingControls),
      approvedByAuthority: input.approvedByAuthority,
      approverProvenance: input.approverProvenance,
      reviewTrigger: input.reviewTrigger,
      maxUses: input.maxUses,
      semanticFingerprint: fingerprint.value,
    }),
  };
}

/** A warrant with uses at or beyond maxUses is exhausted and authorizes nothing. */
export function isWarrantExhausted(warrant: ExceptionWarrant, uses: number): boolean {
  return uses >= warrant.maxUses;
}

// ─── Policy Provenance Chain (PPC) ────────────────────────────────────────────

/**
 * Build the source-to-policy-to-decision trace. Every link must carry all
 * three references; gaps fail closed instead of producing a partial chain.
 */
export function buildPolicyProvenanceChain(
  links: readonly PolicyProvenanceLink[],
): Result<readonly PolicyProvenanceLink[]> {
  if (links.length === 0) {
    return fail('POLICY_PROVENANCE_BROKEN', 'Provenance chain requires at least one link');
  }
  for (const link of links) {
    if (!link.sourceRef || link.sourceRef.trim().length === 0) {
      return fail('POLICY_PROVENANCE_BROKEN', 'Provenance link is missing its source reference');
    }
    if (!link.policyId || link.policyId.trim().length === 0) {
      return fail('POLICY_PROVENANCE_BROKEN', 'Provenance link is missing its policy reference');
    }
    if (!link.decisionRef || link.decisionRef.trim().length === 0) {
      return fail('POLICY_PROVENANCE_BROKEN', 'Provenance link is missing its decision reference');
    }
  }
  const chain = [...links].sort(
    (a, b) =>
      compareCodePoint(a.policyId, b.policyId) ||
      compareCodePoint(a.sourceRef, b.sourceRef) ||
      compareCodePoint(a.decisionRef, b.decisionRef),
  );
  return { ok: true, value: deepFreeze(chain) };
}

/** Verify a decision is fully traced: at least one link names it with policy and source. */
export function verifyProvenanceCoverage(
  chain: readonly PolicyProvenanceLink[],
  decisionRef: string,
): Result<readonly PolicyProvenanceLink[]> {
  const covering = chain.filter(l => l.decisionRef === decisionRef);
  if (covering.length === 0) {
    return fail(
      'POLICY_PROVENANCE_BROKEN',
      `Decision ${decisionRef} has no provenance coverage`,
      decisionRef,
    );
  }
  return { ok: true, value: deepFreeze([...covering]) };
}
