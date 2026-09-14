// M16 Policy & Guardrail Engine - types.ts
// All types for M16 mechanisms: S01-S04.
// Strict deterministic TypeScript. No filesystem/network/Git/provider mutation.
//
// M16 owns deterministic policy representation, composition, decision
// receipts, enforcement bindings, exception semantics, drift/regression
// detection and continuity bindings. It never replaces product intent,
// source hierarchy, M15 pack compilation, M17/M18 continuity, or performs
// filesystem/Git/provider mutation.

import type {
  ExecutionPack,
  PackReceipt,
} from '@gef-bootstrap/execution-pack-compiler';

export type { ExecutionPack, PackReceipt };

// ─── Shared infrastructure ────────────────────────────────────────────────────

export interface DigestPort {
  algorithm: 'sha256';
  digest(input: string): string;
}

export interface CancellationPort {
  isCancelled(): boolean;
}

export interface OperationOptions {
  digest: DigestPort;
  cancellation?: CancellationPort | undefined;
  maxNodes?: number | undefined;
  maxEdges?: number | undefined;
  maxDepth?: number | undefined;
}

export interface Diagnostic {
  code: string;
  message: string;
  subject?: string | undefined;
}

export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

/** Guardrail decision algebra: exactly these four states, never fewer. */
export type PolicyDecision = 'ALLOW' | 'ALLOW_WITH_OBLIGATIONS' | 'DENY' | 'BLOCK_UNKNOWN';

/** Effects a policy rule may declare on match. BLOCK_UNKNOWN is derived, never declared. */
export type PolicyEffect = 'ALLOW' | 'ALLOW_WITH_OBLIGATIONS' | 'DENY';

// ─── S01 – Policy Model & Authority ───────────────────────────────────────────

export interface PolicyApplicability {
  readonly domains: readonly string[];
  readonly operations: readonly string[];
  readonly matchMode: 'ANY' | 'ALL';
}

export interface Obligation {
  readonly obligationId: string;
  readonly statement: string;
  readonly mandatory: boolean;
  readonly dependsOn: readonly string[];
  readonly conflictsWith: readonly string[];
}

/**
 * Policy Authority Capsule (PAC): versioned rule identity, owner/authority,
 * scope, applicability, precedence domain, declared effect, obligations,
 * evidence fingerprint and review trigger. Semantic identity is deterministic.
 */
export interface PolicyAuthorityCapsule {
  readonly policyId: string;
  readonly version: string;
  readonly ownerAuthority: string;
  readonly ownerProvenance: string;
  readonly scopeDomains: readonly string[];
  readonly applicability: PolicyApplicability;
  readonly precedenceDomain: string;
  readonly effectOnMatch: PolicyEffect;
  readonly obligations: readonly Obligation[];
  readonly evidenceFingerprint: string;
  readonly reviewTrigger: string;
  readonly schemaVersion: string;
  readonly semanticIdentity: string;
}

export interface PrecedenceDomain {
  readonly domain: string;
  /** Policy IDs from highest to lowest precedence within this domain. */
  readonly order: readonly string[];
}

export interface PolicyDomainLattice {
  readonly domains: readonly PrecedenceDomain[];
}

export type PrecedenceComparison = 'A_FIRST' | 'B_FIRST' | 'UNORDERED' | 'INCOMPARABLE';

/**
 * Exception Warrant (EW): explicit, identity-bound, scoped, bounded approval.
 * Never a global bypass: it names target policies, domains, obligations and
 * scope, carries compensating controls, and expires by review trigger or
 * bounded use count. Wall-clock time alone is not authority.
 */
export interface ExceptionWarrant {
  readonly warrantId: string;
  readonly targetPolicyIds: readonly string[];
  readonly targetDomains: readonly string[];
  readonly targetObligations: readonly string[];
  readonly scopeNodeIds: readonly string[];
  readonly scopeMutationDomains: readonly string[];
  readonly rationale: string;
  readonly compensatingControls: readonly string[];
  readonly approvedByAuthority: string;
  readonly approverProvenance: string;
  readonly reviewTrigger: string;
  readonly maxUses: number;
  readonly semanticFingerprint: string;
}

export interface PolicyProvenanceLink {
  readonly sourceRef: string;
  readonly policyId: string;
  readonly decisionRef: string;
}

// ─── S02 – Policy Evaluation & Composition ────────────────────────────────────

export interface PolicyRequest {
  readonly domains: readonly string[];
  readonly operations: readonly string[];
}

export type ApplicabilityState = 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' | 'BLOCKED';

export interface ApplicabilityAssessment {
  readonly policyId: string;
  readonly state: ApplicabilityState;
  readonly witness: string;
}

export interface PolicyAssessment {
  readonly policyId: string;
  readonly decision: PolicyDecision;
  readonly obligations: readonly Obligation[];
  readonly witness: string;
}

export interface ConflictRecord {
  readonly kind: 'AUTHORITY' | 'OBLIGATION';
  readonly policyIds: readonly string[];
  readonly detail: string;
}

export interface PolicyJoinResult {
  readonly decision: PolicyDecision;
  readonly obligations: readonly Obligation[];
  readonly denials: readonly string[];
  readonly unknowns: readonly string[];
  readonly conflicts: readonly ConflictRecord[];
}

export interface ObligationComposition {
  readonly order: readonly string[];
  readonly closedIds: readonly string[];
}

export interface ExceptionApplication {
  readonly warrantId: string;
  readonly relaxedObligations: readonly string[];
  readonly compensatingControls: readonly string[];
  readonly reviewTrigger: string;
}

/** Canonical lattice authority evidence sealed into the PDR. */
export interface LatticeAuthorityEvidence {
  /** Domains sorted by name; each order preserves its semantic precedence. */
  readonly domains: readonly { readonly domain: string; readonly order: readonly string[] }[];
  /** Deterministic fingerprint over the canonical domains/orders. */
  readonly evidenceFingerprint: string;
}

export interface PolicyDecisionReceipt {
  readonly packIdentity: string;
  readonly taskIdentity: string;
  readonly policyVersion: string;
  readonly decision: PolicyDecision;
  readonly obligations: readonly Obligation[];
  readonly denials: readonly string[];
  readonly unknowns: readonly string[];
  readonly conflicts: readonly ConflictRecord[];
  readonly exceptionsApplied: readonly ExceptionApplication[];
  readonly provenance: readonly PolicyProvenanceLink[];
  /**
   * Sorted `"<policyId>:<semanticIdentity>"` bindings. The ID prefix is
   * load-bearing: hashing bare fingerprint values would allow swapping
   * fingerprints across IDs to evade TOCTOU. Never trust values alone.
   */
  readonly policyFingerprints: readonly string[];
  /** Exact policy-ID to fingerprint binding for TOCTOU revalidation. */
  readonly policyFingerprintById: Readonly<Record<string, string>>;
  readonly policySetFingerprint: string;
  /** Exact request evidence the decision was evaluated under. */
  readonly request: PolicyRequest;
  /** Applicability witness set backing the decision, sorted by policy ID. */
  readonly applicabilityWitnesses: readonly ApplicabilityAssessment[];
  /** Mandatory domains required by the caller, sorted. */
  readonly mandatoryDomains: readonly string[];
  /** Mandatory domains with no applicable policy, sorted. */
  readonly unresolvedMandatoryDomains: readonly string[];
  /** Supported schema versions admitted at evaluation, sorted. */
  readonly supportedSchemas: readonly string[];
  /** Canonical lattice authority evidence the decision was evaluated under. */
  readonly latticeEvidence: LatticeAuthorityEvidence;
  readonly digest: string;
}

export interface FirewallStep {
  readonly domain: string;
  readonly decision: PolicyDecision;
  readonly shortCircuited: boolean;
  readonly unevaluatedDomains: readonly string[];
}

export interface DecidePolicyInput {
  readonly request: PolicyRequest;
  readonly policies: readonly PolicyAuthorityCapsule[];
  readonly lattice: PolicyDomainLattice;
  readonly mandatoryDomains: readonly string[];
  readonly supportedSchemas: readonly string[];
  readonly packBinding: {
    readonly packId: string;
    readonly taskIdentity: string;
    readonly policyVersion: string;
  };
}

// ─── S03 – Runtime Enforcement & Exceptions ───────────────────────────────────

export interface GuardedOperation {
  readonly nodeId: string;
  readonly mutationDomain: string;
  readonly operation: string;
}

export interface EnforcementProjection {
  readonly nodeId: string;
  readonly mutationDomain: string;
  readonly operation: string;
  readonly decision: PolicyDecision;
  readonly obligations: readonly Obligation[];
  readonly policySetFingerprint: string;
  readonly provenanceRef: string;
}

/**
 * Sealed verified GEM projection. The projection digest binds the exact
 * M15 pack identity/digest, task/policy bindings, node/domain/operation,
 * PDR digest, policy-set fingerprint and full obligation semantics. A
 * caller-constructed plain object with copied strings carries no valid
 * seal unless GEM itself produced it; leases verify the seal and re-run
 * GEM checks against the verified pack before issuing authority.
 */
export interface VerifiedEnforcementProjection extends EnforcementProjection {
  readonly packId: string;
  readonly packDigest: string;
  readonly taskIdentity: string;
  readonly policyVersion: string;
  readonly obligationDigest: string;
  readonly projectionDigest: string;
}

export interface MutationCapabilityLease {
  readonly leaseId: string;
  readonly projectId: string;
  readonly packId: string;
  readonly packDigest: string;
  readonly decisionDigest: string;
  readonly nodeId: string;
  readonly mutationDomain: string;
  readonly operation: string;
  readonly policySetFingerprint: string;
  /** Exact policy-ID to fingerprint binding sealed at lease time. */
  readonly policyFingerprintById: Readonly<Record<string, string>>;
  /** Seal of the verified GEM projection this lease was issued from. */
  readonly projectionDigest: string;
  readonly obligations: readonly Obligation[];
  readonly warrantIds: readonly string[];
  readonly warrantFingerprints: Readonly<Record<string, string>>;
  readonly warrantLimits: Readonly<Record<string, number>>;
  readonly reviewTrigger: string;
}

export interface LeaseCheckInput {
  readonly packDigest: string;
  /** Current policy fingerprints by policy ID; re-hashed and compared. */
  readonly currentPolicyFingerprints: Readonly<Record<string, string>>;
  readonly currentWarrantFingerprints: Readonly<Record<string, string>>;
  readonly warrantUses: Readonly<Record<string, number>>;
}

/**
 * Sealed validity-bound Exception Blast-Radius Cap. Issued only by
 * `checkExceptionBlastRadius` after policy/warrant validation; verified
 * independently by `applyExceptionWarrant`. A plain structural object with
 * matching sets carries no valid seal and is rejected. The digest binds
 * warrant identity/fingerprint, target policies, precedence domain, the
 * canonical affected set and the use-count bound.
 */
export interface BlastRadiusCap {
  readonly warrantId: string;
  readonly warrantFingerprint: string;
  readonly targetPolicyIds: readonly string[];
  readonly precedenceDomain: string;
  readonly nodeIds: readonly string[];
  readonly mutationDomains: readonly string[];
  readonly obligations: readonly string[];
  readonly useCount: number;
  readonly maxUses: number;
  readonly affectedSetFingerprint: string;
  readonly capDigest: string;
}

export interface WarrantApplication {
  readonly receipt: PolicyDecisionReceipt;
  readonly debt: ExceptionDebtEntry;
}

export type DependencyState = 'AVAILABLE' | 'UNAVAILABLE' | 'STALE' | 'UNSUPPORTED' | 'INDETERMINATE';

export interface PolicyDependency {
  readonly name: string;
  readonly state: DependencyState;
  readonly mandatory: boolean;
}

// ─── S04 – Regression, Audit & Handoff ────────────────────────────────────────

export interface PolicySnapshot {
  readonly policies: readonly PolicyAuthorityCapsule[];
  readonly warrants: readonly ExceptionWarrant[];
}

export type RegressionKind =
  | 'DENY_TO_ALLOW'
  | 'UNKNOWN_TO_ALLOW'
  | 'OBLIGATION_LOSS'
  | 'BROADER_EXCEPTION_SCOPE'
  | 'WEAKENED_AUTHORITY'
  | 'REMOVED_COMPENSATING_CONTROL';

export interface RegressionFinding {
  readonly kind: RegressionKind;
  readonly policyId?: string | undefined;
  readonly warrantId?: string | undefined;
  readonly obligationId?: string | undefined;
  readonly detail: string;
}

export type CoverageValidity = 'VALID' | 'UNSUPPORTED_SCHEMA' | 'NO_APPLICABLE_POLICY';

export interface CoverageEntry {
  readonly operation: string;
  readonly domain: string;
  readonly nodeId?: string | undefined;
  readonly policyIds: readonly string[];
  readonly obligationIds: readonly string[];
  readonly covered: boolean;
  /** Explicit validity: only VALID policies can cover. */
  readonly validity: CoverageValidity;
  /** Policies syntactically matching but excluded as invalid. */
  readonly excludedPolicyIds: readonly string[];
}

export interface CoverageMap {
  readonly entries: readonly CoverageEntry[];
  readonly gaps: readonly CoverageEntry[];
}

export type ExceptionDebtStatus = 'ACTIVE' | 'RESOLVED' | 'STALE_REVIEW';

export interface ExceptionDebtEntry {
  readonly warrantId: string;
  readonly status: ExceptionDebtStatus;
  readonly compensatingControls: readonly string[];
  readonly reviewTrigger: string;
  readonly resolutionRef?: string | undefined;
}

export interface ContinuityPolicyBinding {
  readonly projectId: string;
  readonly taskIdentity: string;
  readonly packDigest: string;
  readonly decisionDigest: string;
  readonly policyIdentities: readonly string[];
  readonly policyFingerprints: Readonly<Record<string, string>>;
}

// ─── Diagnostic codes (reserved vocabulary) ───────────────────────────────────
export const DIAGNOSTIC_CODES = {
  POLICY_CAPSULE_INVALID: 'POLICY_CAPSULE_INVALID',
  POLICY_DECISION_INVALID: 'POLICY_DECISION_INVALID',
  POLICY_LATTICE_INVALID: 'POLICY_LATTICE_INVALID',
  POLICY_PRECEDENCE_INCOMPARABLE: 'POLICY_PRECEDENCE_INCOMPARABLE',
  POLICY_WARRANT_INVALID: 'POLICY_WARRANT_INVALID',
  POLICY_WARRANT_EXHAUSTED: 'POLICY_WARRANT_EXHAUSTED',
  POLICY_WARRANT_SCOPE_EXCEEDED: 'POLICY_WARRANT_SCOPE_EXCEEDED',
  POLICY_WARRANT_CROSS_DOMAIN: 'POLICY_WARRANT_CROSS_DOMAIN',
  POLICY_PROVENANCE_BROKEN: 'POLICY_PROVENANCE_BROKEN',
  POLICY_OBLIGATION_UNKNOWN_DEPENDENCY: 'POLICY_OBLIGATION_UNKNOWN_DEPENDENCY',
  POLICY_OBLIGATION_DUPLICATE_NODE: 'POLICY_OBLIGATION_DUPLICATE_NODE',
  POLICY_OBLIGATION_CYCLE: 'POLICY_OBLIGATION_CYCLE',
  POLICY_OBLIGATION_BUDGET_EXHAUSTED: 'POLICY_OBLIGATION_BUDGET_EXHAUSTED',
  POLICY_MANDATORY_DOMAIN_UNRESOLVED: 'POLICY_MANDATORY_DOMAIN_UNRESOLVED',
  POLICY_RECEIPT_INVALID: 'POLICY_RECEIPT_INVALID',
  POLICY_GEM_PACK_RECEIPT_INVALID: 'POLICY_GEM_PACK_RECEIPT_INVALID',
  POLICY_GEM_UNKNOWN_NODE: 'POLICY_GEM_UNKNOWN_NODE',
  POLICY_GEM_UNDECLARED_MUTATION: 'POLICY_GEM_UNDECLARED_MUTATION',
  POLICY_GEM_DOMAIN_NOT_PERMITTED: 'POLICY_GEM_DOMAIN_NOT_PERMITTED',
  POLICY_GEM_POLICY_NOT_BOUND: 'POLICY_GEM_POLICY_NOT_BOUND',
  POLICY_PROJECTION_INVALID: 'POLICY_PROJECTION_INVALID',
  POLICY_CAP_INVALID: 'POLICY_CAP_INVALID',
  POLICY_LEASE_DECISION_NOT_PERMISSIVE: 'POLICY_LEASE_DECISION_NOT_PERMISSIVE',
  POLICY_LEASE_SCOPE_MISMATCH: 'POLICY_LEASE_SCOPE_MISMATCH',
  POLICY_LEASE_STALE_PACK: 'POLICY_LEASE_STALE_PACK',
  POLICY_LEASE_STALE_POLICY: 'POLICY_LEASE_STALE_POLICY',
  POLICY_LEASE_STALE_WARRANT: 'POLICY_LEASE_STALE_WARRANT',
  POLICY_DEGRADATION_BLOCKED: 'POLICY_DEGRADATION_BLOCKED',
  POLICY_CONTINUITY_DRIFT: 'POLICY_CONTINUITY_DRIFT',
  POLICY_DEBT_UNKNOWN_WARRANT: 'POLICY_DEBT_UNKNOWN_WARRANT',
  POLICY_DEBT_ALREADY_RESOLVED: 'POLICY_DEBT_ALREADY_RESOLVED',
  DIGEST_CAPABILITY_INVALID: 'DIGEST_CAPABILITY_INVALID',
  DIGEST_RESULT_INVALID: 'DIGEST_RESULT_INVALID',
  DIGEST_CAPABILITY_FAILURE: 'DIGEST_CAPABILITY_FAILURE',
  INPUT_CYCLE: 'INPUT_CYCLE',
  UNSUPPORTED_PROTOTYPE: 'UNSUPPORTED_PROTOTYPE',
  CANCELLED: 'CANCELLED',
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
