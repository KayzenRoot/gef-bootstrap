// M14 Task & Context Compiler - types.ts
// All types for M14 mechanisms: S01-S05
// Strict deterministic TypeScript. No filesystem/network/Git mutation.

// ─── Shared infrastructure ────────────────────────────────────────────────────

export type DigestAlgorithm = 'sha256';
export interface DigestPort { algorithm: DigestAlgorithm; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }

export interface OperationOptions {
  digest: DigestPort;
  cancellation?: CancellationPort | undefined;
  maxNodes?: number | undefined;
  maxEdges?: number | undefined;
  maxDepth?: number | undefined;
}

export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

// ─── Identity bindings ─────────────────────────────────────────────────────────

/** Exact project/source/profile/policy/checkpoint binding. All required for safety. */
export interface ContextIdentityBinding {
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
}

// ─── S01 – Task Model and Context Contract ─────────────────────────────────────

/** Task class from planning sessions (maps to S01 T0-T3 levels). */
export type TaskClass =
  | 'READ_ONLY_QUERY'
  | 'CONTENT_GENERATION'
  | 'CONTROLLED_MUTATION'
  | 'HIGH_ASSURANCE_CRITICAL';

/** Risk classification for a task. */
export type RiskClass = 'STANDARD' | 'ELEVATED' | 'HIGH_ASSURANCE';

/**
 * Task Intent Envelope (TIE) – S01 primary mechanism.
 * Captures the task objective and invariant bindings.
 */
export interface TaskIntentEnvelopeInput {
  readonly taskId: string;
  readonly taskClass: TaskClass;
  readonly riskClass: RiskClass;
  readonly objectiveSummary: string;
  readonly targetDomains: readonly string[];
  readonly requiredCapabilities: readonly string[];
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly callerBudget?: ContextBudget | undefined;
}

/** Immutable, identity-bound Task Intent Envelope. */
export interface TaskIntentEnvelope extends TaskIntentEnvelopeInput {
  readonly semanticIdentity: string;   // SHA-256 over normalized content
}

/**
 * Authority-Bound Context Unit (ABCU) – S01.
 * A single context element with explicit authority, applicability and fingerprint binding.
 */
export type AbcuRole =
  | 'NORMATIVE'
  | 'DESCRIPTIVE'
  | 'DECISION'
  | 'DEPENDENCY_CLOSURE'
  | 'NEGATIVE';

export type ApplicabilityState =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNKNOWN'
  | 'CONTRADICTORY';

export interface AuthorityBoundContextUnitInput {
  readonly unitId: string;
  readonly domain: string;
  readonly role: AbcuRole;
  readonly applicability: ApplicabilityState;
  readonly authorityRef: string;
  readonly sourceFingerprint: string;
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly semanticPayloadRef: string;
  readonly sensitivity?: 'PUBLIC' | 'INTERNAL' | 'SENSITIVE_REFERENCE' | undefined;
}

export interface AuthorityBoundContextUnit extends AuthorityBoundContextUnitInput {
  readonly semanticIdentity: string;
}

/** Context Budget – caller-supplied limits that can only NARROW safe defaults. */
export interface ContextBudget {
  readonly maxNodes?: number | undefined;
  readonly maxEdges?: number | undefined;
  readonly maxDepth?: number | undefined;
  readonly maxUnits?: number | undefined;
  readonly maxDomains?: number | undefined;
}

// ─── S02 – Source Routing and Authority-Bound Selection ────────────────────────

/**
 * Task-to-Source Router (TSR) result.
 * Maps task domains to candidate sources, preserving provenance.
 */
export interface SourceRouteCandidate {
  readonly sourceId: string;
  readonly domain: string;
  readonly routingRelevance: number;    // 0..1, NOT authority
  readonly authorityRef: string;
  readonly applicabilityState: ApplicabilityState;
  readonly applicabilityWitnessRef?: string | undefined;
  readonly sourceFingerprint: string;
  readonly aliasRefs?: readonly string[] | undefined;
}

export interface TaskRouteResult {
  readonly taskIdentity: string;
  readonly candidates: readonly SourceRouteCandidate[];
  readonly unresolvedDomains: readonly string[];
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Authority-Bound Selection Filter (ABSF) – S02.
 * Selects from candidates using M09 authority, not routing relevance.
 */
export interface AbsfInput {
  readonly taskIntentEnvelope: TaskIntentEnvelope;
  readonly routeCandidates: readonly SourceRouteCandidate[];
  readonly authorityProofs: readonly AuthorityResolutionProof[];
}

export interface AuthorityResolutionProof {
  readonly domain: string;
  readonly sourceId: string;
  readonly proofRef: string;
  readonly conflictState: 'RESOLVED' | 'UNRESOLVED' | 'CONFLICT';
  readonly conflictingSourceIds?: readonly string[] | undefined;
}

/**
 * Context Authority Matrix (CAM) – S02.
 * Per-domain authority mapping; unresolved entries block compilation.
 */
export type CamRoleState = 'BOUND' | 'UNRESOLVED' | 'CONFLICT' | 'NOT_APPLICABLE';

export interface CamEntry {
  readonly domain: string;
  readonly role: AbcuRole;
  readonly state: CamRoleState;
  readonly boundUnitId?: string | undefined;
  readonly conflictIds?: readonly string[] | undefined;
}

export interface ContextAuthorityMatrix {
  readonly taskIdentity: string;
  readonly entries: readonly CamEntry[];
  readonly unresolvedCount: number;
  readonly conflictCount: number;
  readonly semanticIdentity: string;
}

/**
 * Authority Neighborhood Projection (ANP) – S02.
 * Bounded graph projection of authority relationships; disposable/derived.
 */
export interface AnpNode {
  readonly sourceId: string;
  readonly domain: string;
  readonly authorityStrength: 'PRIMARY' | 'SECONDARY' | 'ADVISORY';
  readonly neighborIds: readonly string[];
}

export interface AuthorityNeighborhoodProjection {
  readonly taskIdentity: string;
  readonly nodes: readonly AnpNode[];
  readonly edgeCount: number;
  readonly truncated: boolean;
  readonly semanticIdentity: string;
}

/**
 * Context Redundancy Barrier (CRB) – S02.
 * Deduplication result that preserves provenance while removing payload duplication.
 */
export interface DeduplicatedUnit {
  readonly canonicalUnitId: string;
  readonly provenanceRefs: readonly string[];
  readonly rolesCollapsed: readonly AbcuRole[];
  readonly suppressedDuplicateIds: readonly string[];
}

// ─── S03 – Minimum Sufficient Context & Sufficiency Proof ─────────────────────

/**
 * Context Dependency Closure (CDC) – S01/S03.
 * Bounded, cycle-safe closure of required dependencies.
 */
export type ClosureState =
  | 'COMPLETE'
  | 'CYCLE_DETECTED'
  | 'BUDGET_EXHAUSTED'
  | 'UNKNOWN_DEPENDENCY'
  | 'CANCELLED';

export interface DependencyEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly edgeType: 'REQUIRED' | 'OPTIONAL';
}

export interface ContextDependencyClosure {
  readonly rootUnitIds: readonly string[];
  readonly closedUnitIds: readonly string[];
  readonly edges: readonly DependencyEdge[];
  readonly state: ClosureState;
  readonly cycles?: readonly string[][] | undefined;
  readonly unknownRefs?: readonly string[] | undefined;
}

/**
 * Semantic Coverage Lattice (SCL) – S03.
 * Per-obligation coverage; never a scalar similarity score.
 */
export type CoverageState = 'COVERED' | 'PARTIAL' | 'UNCOVERED' | 'BLOCKED';

export interface ObligationCoverage {
  readonly obligationId: string;
  readonly domain: string;
  readonly coverageState: CoverageState;
  readonly coveringUnitIds: readonly string[];
  readonly partialReasons?: readonly string[] | undefined;
}

export interface SemanticCoverageLattice {
  readonly taskIdentity: string;
  readonly obligations: readonly ObligationCoverage[];
  readonly overallCoverage: CoverageState;
  readonly semanticIdentity: string;
}

/**
 * Context Deficit Vector (CDV) – S03.
 * Explicit missing dimensions; non-empty means expansion is required.
 */
export type DeficitDimension =
  | 'AUTHORITY'
  | 'DEPENDENCY'
  | 'DECISION'
  | 'SCOPE'
  | 'SAFETY'
  | 'EVIDENCE';

export interface DeficitEntry {
  readonly dimension: DeficitDimension;
  readonly domain: string;
  readonly reason: string;
}

export interface ContextDeficitVector {
  readonly taskIdentity: string;
  readonly deficits: readonly DeficitEntry[];
  readonly isEmpty: boolean;
}

/**
 * Minimum Context Witness (MCW) – S03.
 * Records inclusion/exclusion rationale for every unit in the context set.
 */
export interface WitnessEntry {
  readonly unitId: string;
  readonly inclusionReason: string;
  readonly obligationIds: readonly string[];
}

export interface ExclusionEntry {
  readonly unitId: string;
  readonly exclusionReason: string;
}

export interface MinimumContextWitness {
  readonly taskIdentity: string;
  readonly includedUnits: readonly WitnessEntry[];
  readonly excludedNeighbors: readonly ExclusionEntry[];
  readonly semanticIdentity: string;
}

/**
 * Context Sufficiency Proof (CSP) – S03.
 * Machine-readable proof of execution readiness.
 */
export type SufficiencyState =
  | 'SUFFICIENT'
  | 'EXPANSION_REQUIRED'
  | 'BLOCKED'
  | 'INDETERMINATE';

export type SufficiencyFailedState = Exclude<SufficiencyState, 'SUFFICIENT'>;

export interface ContextSufficiencyProof {
  readonly taskIdentity: string;
  readonly sufficiencyState: SufficiencyState;
  readonly coverageLattice: SemanticCoverageLattice;
  readonly deficitVector: ContextDeficitVector;
  readonly witness: MinimumContextWitness;
  readonly dependencyClosure: ContextDependencyClosure;
  readonly validityFingerprints: readonly string[];
  readonly exclusionJustifications: readonly string[];
  readonly dependencyKnowledgeComplete: boolean;
  readonly semanticIdentity: string;
}

// ─── S04 – Safe Expansion and Full-Context Gate ────────────────────────────────

/**
 * Full-Context Safety Gate (FCSG) – S04.
 * Determines if narrow context is safe; triggers must all be examined.
 */
export type FcsgTrigger =
  | 'HIGH_ASSURANCE_TASK'
  | 'UNRESOLVED_AUTHORITY_CONFLICT'
  | 'INCOMPLETE_DEPENDENCY_CLOSURE'
  | 'DESTRUCTIVE_IRREVERSIBLE_OPERATION'
  | 'HIGH_RISK_DOMAIN'
  | 'STALE_CHECKPOINT_BINDING'
  | 'STALE_SOURCE_BINDING'
  | 'STALE_PROFILE_BINDING'
  | 'PRIOR_CONTEXT_REGRESSION'
  | 'EXPLICIT_CALLER_OR_POLICY_REQUIREMENT';

export interface FcsgEvaluation {
  readonly taskIdentity: string;
  readonly triggeredReasons: readonly FcsgTrigger[];
  readonly narrowContextPermitted: boolean;
  readonly requiredExpansionStage?: ExpansionStage | undefined;
}

/**
 * Risk-Adaptive Context Aperture (RACA) – S04.
 * Aperture expands by risk/unknowns, not token appetite.
 */
export type ApertureLevel = 'NARROW' | 'STANDARD' | 'WIDE' | 'FULL_RELEVANT_SOURCE_PACK';

export interface RiskAdaptiveContextAperture {
  readonly taskIdentity: string;
  readonly apertureLevel: ApertureLevel;
  readonly riskClass: RiskClass;
  readonly unknownCount: number;
  readonly expansionTriggers: readonly string[];
}

/**
 * Dependency Shockwave Scanner (DSS) – S04.
 * Bounded traversal estimating which authority domains can be invalidated by a task.
 */
export interface ShockwaveResult {
  readonly originDomains: readonly string[];
  readonly affectedDomainIds: readonly string[];
  readonly traversalDepth: number;
  readonly budgetExhausted: boolean;
  readonly cancelled: boolean;
}

/**
 * Unknown-Unknown Sentinel (UUS) – S04.
 * Detects incomplete graph knowledge.
 */
export interface UusFinding {
  readonly kind: 'DANGLING_REF' | 'UNRESOLVED_ALIAS' | 'UNBOUND_IMPORT' | 'AUTHORITY_GAP';
  readonly subject: string;
  readonly detail: string;
}

export interface UnknownUnknownSentinelResult {
  readonly taskIdentity: string;
  readonly findings: readonly UusFinding[];
  readonly hasUnknowns: boolean;
}

/**
 * Context Expansion Ladder (CEL) – S04.
 * Deterministic expansion stages; never raw full repository by default.
 */
export type ExpansionStage =
  | 'LOCAL_REQUIRED'
  | 'DEPENDENCY_NEIGHBORHOOD'
  | 'AUTHORITY_DOMAIN'
  | 'CROSS_DOMAIN_REQUIRED'
  | 'FULL_RELEVANT_SOURCE_PACK'
  | 'BLOCKED_FOR_AUTHORITY_OR_DECISION';

export interface ExpansionStep {
  readonly stage: ExpansionStage;
  readonly trigger: string;
  readonly addedObligations: readonly string[];
}

export interface ContextExpansionLadder {
  readonly taskIdentity: string;
  readonly currentStage: ExpansionStage;
  readonly steps: readonly ExpansionStep[];
}

/**
 * Expansion Budget Envelope (EBE) – S04.
 * Hard caps on expansion; exhaustion is explicit and fail-closed.
 */
export interface ExpansionBudgetEnvelope {
  readonly maxNodes: number;
  readonly maxEdges: number;
  readonly maxBytes: number;
  readonly maxDomains: number;
  readonly maxIterations: number;
  readonly usedNodes: number;
  readonly usedEdges: number;
  readonly usedDomains: number;
  readonly usedIterations: number;
  readonly exhausted: boolean;
}

// ─── S05 – Context Receipt, Regression & Handoff ──────────────────────────────

/**
 * Task Context Capsule (TCC) – S05.
 * Immutable output binding all M14 results; only SUFFICIENT TCCs consumed by M15.
 */
export type ReceiptValidity =
  | 'VALID'
  | 'STALE'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'PROJECT_MISMATCH'
  | 'SOURCE_PACK_MISMATCH'
  | 'POLICY_UNSUPPORTED'
  | 'INDETERMINATE';

export interface TaskContextCapsuleInput {
  readonly taskIntentEnvelope: TaskIntentEnvelope;
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly selectedUnits: readonly AuthorityBoundContextUnit[];
  readonly authorityProofs: readonly AuthorityResolutionProof[];
  readonly sufficiencyProof: ContextSufficiencyProof;
  readonly expansionTrace: readonly ExpansionStep[];
  readonly exclusions: readonly ExclusionEntry[];
  readonly validity: ReceiptValidity;
}

export interface TaskContextCapsule extends TaskContextCapsuleInput {
  readonly semanticDigest: string;    // CSD – Context Semantic Digest
  readonly compiledAtMs: number;
}

/**
 * Context Semantic Digest (CSD) – S05.
 * SHA-256 over normalized semantic bindings, not timestamps or path order.
 */
export interface ContextSemanticDigestInput {
  readonly taskIdentity: string;
  readonly selectedUnitIdentities: readonly string[];
  readonly authorityProofRefs: readonly string[];
  readonly sufficiencyProofIdentity: string;
  readonly validityFingerprints: readonly string[];
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly policyVersion: string;
}

/**
 * Selective Context Invalidation Graph (SCIG) – S05.
 * Invalidates only portions whose bound fingerprints changed.
 */
export interface InvalidationNode {
  readonly unitId: string;
  readonly dependsOnFingerprints: readonly string[];
  readonly invalidated: boolean;
  readonly reason?: string | undefined;
}

export interface SelectiveContextInvalidationGraph {
  readonly capsuleIdentity: string;
  readonly nodes: readonly InvalidationNode[];
  readonly invalidatedCount: number;
  readonly conservativeExpansion: boolean;
}

/**
 * Context Regression Sentinel (CRS) – S05.
 * Detects authority downgrade, lost obligation coverage, etc.
 */
export type RegressionKind =
  | 'AUTHORITY_DOWNGRADE'
  | 'LOST_OBLIGATION_COVERAGE'
  | 'NEW_CONFLICT'
  | 'STALE_ALIAS'
  | 'DEPENDENCY_GROWTH'
  | 'UNSAFE_APERTURE_SHRINKAGE';

export interface RegressionFinding {
  readonly kind: RegressionKind;
  readonly domain?: string | undefined;
  readonly unitId?: string | undefined;
  readonly detail: string;
}

export interface ContextRegressionSentinelResult {
  readonly previousDigest: string;
  readonly currentDigest: string;
  readonly regressions: readonly RegressionFinding[];
  readonly hasRegression: boolean;
}

/**
 * Execution Handoff Contract (EHC) – S05.
 * M15 may consume only SUFFICIENT non-stale TCCs.
 * M15 cannot silently add authority-bearing context.
 */
export interface ExecutionHandoffContract {
  readonly capsuleSemanticDigest: string;
  readonly capsuleValidity: ReceiptValidity;
  readonly readyForM15Consumption: boolean;
  readonly blockerCodes: readonly string[];
  readonly handoffIdentity: string;
}

// ─── Compilation state ─────────────────────────────────────────────────────────

export type CompilationState =
  | 'COMPILING'
  | 'COMPILED_SUFFICIENT'
  | 'COMPILED_EXPANSION_REQUIRED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'INDETERMINATE';

export interface CompilationResult {
  readonly state: CompilationState;
  readonly capsule?: TaskContextCapsule | undefined;
  readonly handoffContract?: ExecutionHandoffContract | undefined;
  readonly diagnostics: readonly Diagnostic[];
}

// ─── Diagnostic codes (reserved vocabulary) ───────────────────────────────────
// These codes are reserved; semantics cannot be silently weakened.
export const DIAGNOSTIC_CODES = {
  TASK_CONTEXT_INTENT_INVALID: 'TASK_CONTEXT_INTENT_INVALID',
  TASK_CONTEXT_BINDING_STALE: 'TASK_CONTEXT_BINDING_STALE',
  CONTEXT_UNIT_INVALID: 'CONTEXT_UNIT_INVALID',
  CONTEXT_AUTHORITY_UNRESOLVED: 'CONTEXT_AUTHORITY_UNRESOLVED',
  CONTEXT_UNIT_STALE: 'CONTEXT_UNIT_STALE',
  CONTEXT_DEPENDENCY_MISSING: 'CONTEXT_DEPENDENCY_MISSING',
  CONTEXT_DEPENDENCY_CYCLE: 'CONTEXT_DEPENDENCY_CYCLE',
  CONTEXT_BUDGET_EXCEEDED: 'CONTEXT_BUDGET_EXCEEDED',
  CONTEXT_EXPANSION_REQUIRED: 'CONTEXT_EXPANSION_REQUIRED',
  CONTEXT_SUFFICIENCY_INDETERMINATE: 'CONTEXT_SUFFICIENCY_INDETERMINATE',
  FULL_CONTEXT_SAFETY_REQUIRED: 'FULL_CONTEXT_SAFETY_REQUIRED',
  CONTEXT_COMPILATION_BLOCKED: 'CONTEXT_COMPILATION_BLOCKED',
  CROSS_PROJECT_CONTEXT_FORBIDDEN: 'CROSS_PROJECT_CONTEXT_FORBIDDEN',
  TASK_ROUTE_TARGET_AMBIGUOUS: 'TASK_ROUTE_TARGET_AMBIGUOUS',
  TASK_ROUTE_DOMAIN_UNSUPPORTED: 'TASK_ROUTE_DOMAIN_UNSUPPORTED',
  CONTEXT_AUTHORITY_CONFLICT: 'CONTEXT_AUTHORITY_CONFLICT',
  CONTEXT_APPLICABILITY_UNRESOLVED: 'CONTEXT_APPLICABILITY_UNRESOLVED',
  CONTEXT_APPLICABILITY_STALE: 'CONTEXT_APPLICABILITY_STALE',
  CONTEXT_SOURCE_STALE: 'CONTEXT_SOURCE_STALE',
  CONTEXT_ALIAS_STALE: 'CONTEXT_ALIAS_STALE',
  CONTEXT_ROUTE_BUDGET_EXCEEDED: 'CONTEXT_ROUTE_BUDGET_EXCEEDED',
  CONTEXT_ROUTE_CANCELLED: 'CONTEXT_ROUTE_CANCELLED',
  CONTEXT_ROUTE_CYCLE: 'CONTEXT_ROUTE_CYCLE',
  CONTEXT_NEGATIVE_KNOWLEDGE_STALE: 'CONTEXT_NEGATIVE_KNOWLEDGE_STALE',
  CONTEXT_DEDUP_EQUIVALENCE_UNPROVEN: 'CONTEXT_DEDUP_EQUIVALENCE_UNPROVEN',
  DIGEST_CAPABILITY_INVALID: 'DIGEST_CAPABILITY_INVALID',
  CANCELLED: 'CANCELLED',
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
