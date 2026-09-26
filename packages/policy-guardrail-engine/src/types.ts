// M16 Policy & Guardrail Engine — canonical public types.
// Pure deterministic contracts. No filesystem/network/Git/provider mutation.

export type GuardrailDecision = 'ALLOW' | 'ALLOW_WITH_OBLIGATIONS' | 'DENY' | 'BLOCK_UNKNOWN';
export type PolicyEffect = 'REQUIRE' | 'FORBID';
export type ApplicabilityState = 'APPLIES' | 'DOES_NOT_APPLY' | 'UNKNOWN';
export type WarrantEffect = 'WAIVE_OBLIGATION' | 'WAIVE_DENY';
export type PolicyLifecycleStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface DigestPort { algorithm: 'sha256'; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }
export interface OperationOptions { digest: DigestPort; cancellation?: CancellationPort | undefined; maxNodes?: number | undefined; }
export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

export interface PolicyObligation {
  obligationId: string;
  domain: string;
  action: string;
  effect: PolicyEffect;
  dependsOn: readonly string[];
}

export interface PolicyAuthorityInput {
  policyId: string;
  version: string;
  owner: string;
  authorityRef: string;
  precedenceDomain: string;
  domains: readonly string[];
  appliesToOperations: readonly string[];
  appliesToNodeIds: readonly string[];
  requiredFacts: readonly string[];
  denyOperations: readonly string[];
  obligations: readonly PolicyObligation[];
  evidenceRefs: readonly string[];
  reviewTrigger: string;
  /** Explicit expiry/validity boundary. When omitted by legacy callers, reviewTrigger is promoted as the bound expiry reference. */
  expiryRef?: string | undefined;
  status: PolicyLifecycleStatus;
}

export interface PolicyAuthorityCapsule extends PolicyAuthorityInput {
  readonly expiryRef: string;
  readonly semanticDigest: string;
}

export interface PolicyDomainEntry {
  readonly domain: string;
  readonly policyIds: readonly string[];
  readonly authorityRefs: readonly string[];
}
export interface PolicyDomainLattice { readonly entries: readonly PolicyDomainEntry[]; }

export interface PolicyProvenanceEntry {
  readonly policyId: string;
  readonly policyDigest: string;
  readonly authorityRef: string;
  readonly evidenceRefs: readonly string[];
}
export interface PolicyProvenanceChain { readonly entries: readonly PolicyProvenanceEntry[]; }

export interface ExceptionWarrantInput {
  warrantId: string;
  approvalRef: string;
  policyDigestBindings: readonly string[];
  policyIds: readonly string[];
  obligationIds: readonly string[];
  domains: readonly string[];
  nodeIds: readonly string[];
  operations: readonly string[];
  permittedEffects: readonly WarrantEffect[];
  compensatingControls: readonly string[];
  reviewTrigger: string;
  /** Explicit expiry/validity boundary. When omitted by legacy callers, reviewTrigger is promoted as the bound expiry reference. */
  expiryRef?: string | undefined;
  status: PolicyLifecycleStatus;
}
export interface ExceptionWarrant extends ExceptionWarrantInput {
  readonly expiryRef: string;
  readonly warrantDigest: string;
}

export interface PolicyOperation {
  readonly nodeId: string;
  readonly operation: string;
  readonly domains: readonly string[];
}

export interface ApplicabilityWitness {
  readonly policyId: string;
  readonly state: ApplicabilityState;
  readonly reasons: readonly string[];
}
export interface ApplicabilityWitnessSet { readonly witnesses: readonly ApplicabilityWitness[]; }

export interface PolicyEvaluationFragment {
  readonly policyId: string;
  readonly obligations: readonly PolicyObligation[];
  readonly denials: readonly string[];
  readonly unknowns: readonly string[];
  readonly exceptionWarrantIds: readonly string[];
  readonly exceptionWarrantDigests?: readonly string[] | undefined;
}

export interface ObligationGraphNode { readonly obligationId: string; readonly dependsOn: readonly string[]; }
export interface ObligationCompositionGraph { readonly nodes: readonly ObligationGraphNode[]; readonly order: readonly string[]; }

export interface PolicyJoinResult {
  readonly obligations: readonly PolicyObligation[];
  readonly denials: readonly string[];
  readonly unknowns: readonly string[];
  readonly conflicts: readonly string[];
  readonly exceptionWarrantIds: readonly string[];
  readonly exceptionWarrantDigests: readonly string[];
}

export interface PolicyDecisionReceipt {
  readonly decision: GuardrailDecision;
  readonly operation: PolicyOperation;
  readonly mandatoryDomains: readonly string[];
  readonly obligations: readonly PolicyObligation[];
  readonly denials: readonly string[];
  readonly unknowns: readonly string[];
  readonly conflicts: readonly string[];
  readonly witnesses: ApplicabilityWitnessSet;
  readonly provenance: PolicyProvenanceChain;
  readonly exceptionWarrantIds: readonly string[];
  readonly exceptionWarrantDigests: readonly string[];
  readonly mandatoryDomainCoverageComplete: boolean;
  readonly receiptDigest: string;
}

export interface PolicyEvaluationInput {
  readonly policies: readonly PolicyAuthorityCapsule[];
  readonly operation: PolicyOperation;
  readonly mandatoryDomains: readonly string[];
  readonly facts: Readonly<Record<string, boolean>>;
  readonly exceptionWarrants: readonly ExceptionWarrant[];
}

export interface GuardrailEnforcementProjection {
  readonly allowed: boolean;
  readonly decision: GuardrailDecision;
  readonly nodeId: string;
  readonly operation: string;
  readonly mutationDomains: readonly string[];
  readonly obligationIds: readonly string[];
  readonly receiptDigest: string;
  readonly diagnostics: readonly Diagnostic[];
}

export interface MutationCapabilityLease {
  readonly leaseId: string;
  readonly nodeId: string;
  readonly operation: string;
  readonly mutationDomains: readonly string[];
  readonly receiptDigest: string;
  readonly policyFingerprint: string;
  readonly checkpointIdentity: string;
  readonly obligationIds: readonly string[];
  readonly nonce: string;
}

export interface ExceptionBlastRadiusRequest {
  readonly policyDigest: string;
  readonly policyId: string;
  readonly obligationId: string | null;
  readonly domain: string;
  readonly nodeId: string;
  readonly operation: string;
  readonly effect: WarrantEffect;
}

export interface PolicyDegradation {
  readonly decision: 'BLOCK_UNKNOWN';
  readonly reason: string;
  readonly diagnostics: readonly Diagnostic[];
}

export type PolicyRegressionKind =
  | 'DENY_TO_ALLOW'
  | 'UNKNOWN_TO_ALLOW'
  | 'OBLIGATION_LOSS'
  | 'EXCEPTION_BROADENED'
  | 'AUTHORITY_DOWNGRADE';

export interface ExceptionScopeSnapshot {
  readonly warrantId: string;
  readonly warrantDigest: string;
  readonly expiryRef: string;
  readonly domains: readonly string[];
  readonly nodeIds: readonly string[];
  readonly operations: readonly string[];
  readonly permittedEffects: readonly WarrantEffect[];
}

export interface PolicyRegressionSnapshot {
  readonly decision: GuardrailDecision;
  readonly obligationIds: readonly string[];
  readonly unknowns: readonly string[];
  readonly authorityBindings: readonly string[];
  readonly exceptionScopes: readonly ExceptionScopeSnapshot[];
}
export interface PolicyRegressionFinding { readonly kind: PolicyRegressionKind; readonly subject: string; }

export interface GuardrailCoverageEntry {
  readonly domain: string;
  readonly policyIds: readonly string[];
  readonly obligationIds: readonly string[];
  readonly operations: readonly string[];
}
export interface GuardrailCoverageMap { readonly entries: readonly GuardrailCoverageEntry[]; readonly uncoveredDomains: readonly string[]; }

export interface ExceptionDebtEntry {
  readonly warrantId: string;
  readonly reviewTrigger: string;
  readonly expiryRef: string;
  readonly compensatingControls: readonly string[];
  readonly unresolvedCompensatingControls: readonly string[];
  readonly warrantDigest: string;
}
export interface ExceptionDebtRegister { readonly entries: readonly ExceptionDebtEntry[]; readonly registerDigest: string; }

export interface ContinuityPolicyBinding {
  readonly checkpointIdentity: string;
  readonly policyFingerprint: string;
  readonly decisionReceiptDigest: string;
  readonly exceptionDebtDigest: string;
  readonly policyIds: readonly string[];
  readonly bindingDigest: string;
}
