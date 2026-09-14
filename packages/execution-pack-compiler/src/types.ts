// M15 Execution Pack Compiler - types.ts
// All types for M15 mechanisms: S01-S05.
// Strict deterministic TypeScript. No filesystem/network/Git/provider mutation.
//
// Direct M14 contract integration: the admitted upstream interface reuses the
// public M14 task-context contract types (TaskContextCapsule,
// ExecutionHandoffContract). M15 adds capability/executor data but never
// discards task identity, TCC digest, handoff validity or readiness semantics.
// Only VALID, ready handoffs reach compilation; every binding is rechecked
// exactly, never inferred.

import type {
  TaskContextCapsule,
  ExecutionHandoffContract,
} from '@gef-bootstrap/task-context-compiler';

export type { TaskContextCapsule, ExecutionHandoffContract };

export type PackStatus =
  | 'VALID'
  | 'STALE_CONTEXT'
  | 'STALE_POLICY'
  | 'CAPABILITY_MISMATCH'
  | 'GRAPH_INVALID'
  | 'BLOCKED'
  | 'INDETERMINATE';

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

/** Exact project/source/profile/policy/checkpoint/capability binding. All required. */
export interface Binding {
  projectId: string;
  sourcePackIdentity: string;
  profileIdentity: string;
  profileDigest: string;
  policyVersion: string;
  checkpointIdentity: string;
  capabilityIdentity: string;
}

export interface ContextReceipt extends Binding {
  contextIdentity: string;
  status: 'VALID';
  semanticDigest: string;
}

/**
 * Admitted M14 context: the Task Context Capsule plus its Execution Handoff
 * Contract, using the public M14 contract types directly. The compiler never
 * reopens M14 authority reasoning; it rechecks handoff digest binding,
 * capsule validity, readiness and exact bindings, failing closed.
 */
export interface AdmittedContextInput {
  readonly capsule: TaskContextCapsule;
  readonly handoff: ExecutionHandoffContract;
}

export interface Instruction {
  instructionId: string;
  objective: string;
  targetFiles: readonly string[];
  dependsOn: readonly string[];
  mutationDomains: readonly string[];
  validationIds: readonly string[];
  rollbackPlan?: string;
  provenanceRefs: readonly string[];
}

/**
 * First-class executable instruction. Every node carries explicit
 * preconditions, a mutation specification, and declared evidence outputs —
 * none of these may be silently inferred by the executor.
 */
export interface ExecutableInstruction extends Instruction {
  readonly preconditions: readonly string[];
  readonly mutationSpec: string;
  readonly evidenceOutputs: readonly string[];
}

// ─── S01 – Execution Pack Contract ────────────────────────────────────────────

export interface ExecutionPackEnvelope extends Binding {
  readonly packId: string;
  readonly taskIdentity: string;
  readonly contextIdentity: string;
  readonly envelopeDigest: string;
}

export interface ProvenanceEntry {
  readonly instructionId: string;
  readonly authorityRefs: readonly string[];
  readonly decisionRefs: readonly string[];
}

export interface PromptCompletenessCertificate {
  readonly packId: string;
  readonly complete: true;
  readonly missingItems: readonly string[];
}

export interface ExecutorCapabilityContract {
  capabilityIdentity: string;
  capabilities: readonly string[];
  tools: readonly string[];
  maxParallelism: number;
  /** Mutation permissions the executor must hold (e.g. 'fs:write:src/**'). */
  requiredMutationPermissions: readonly string[];
  /** Capabilities the executor must NOT offer. */
  forbiddenCapabilities: readonly string[];
  /** Capabilities declared unavailable in this environment; offering them is a lie. */
  unavailableCapabilities: readonly string[];
  /** Sandbox assumptions the executor must satisfy (e.g. 'no-network'). */
  sandboxAssumptions: readonly string[];
}

export interface ExecutorCapabilityOffer {
  readonly capabilityIdentity: string;
  readonly capabilities: readonly string[];
  readonly tools: readonly string[];
  readonly mutationPermissions: readonly string[];
  readonly sandboxCapabilities: readonly string[];
  /** Offered parallelism; when present it must not exceed the allowed limit. */
  readonly maxParallelism?: number | undefined;
}

// ─── S02 – Work Graph & Critical Path ─────────────────────────────────────────

export interface WorkNode extends ExecutableInstruction {
  wave: number;
  critical: boolean;
  /** Rollback hook: the rollback plan, or 'none:read-only' for pure reads. */
  rollbackHook: string;
  /** Rollback readiness reference: `rrp:<id>` when mutating, else 'rrp:not-required'. */
  readinessRef: string;
}

export interface ExecutableWorkDag {
  readonly nodes: readonly WorkNode[];
  /** Deterministic topological order (by wave, then code-point id). */
  readonly order: readonly string[];
  /** Deterministic execution waves; every dependency sits in an earlier wave. */
  readonly waves: readonly (readonly string[])[];
}

export interface ReasoningBranch {
  readonly branchId: string;
  readonly decided: boolean;
  readonly canonicalRef?: string | undefined;
}

export interface BranchSuppressionResult {
  readonly suppressed: readonly string[];
  readonly escalated: readonly string[];
}

export interface AtomicIncrement {
  readonly incrementId: string;
  readonly nodeIds: readonly string[];
  readonly evidenceSlotIds: readonly string[];
}

// ─── S03 – Guardrails, Validation & Rollback ──────────────────────────────────

export interface ValidationRequirement {
  validationId: string;
  command: string;
  scope: 'FOCUSED' | 'REGRESSION' | 'SECURITY';
  covers: readonly string[];
}

export interface InstructionValidationClosure {
  readonly instructionId: string;
  readonly validationIds: readonly string[];
}

export interface GuardrailBinding {
  readonly nodeId: string;
  readonly policyIds: readonly string[];
}

export interface RollbackProof {
  readonly instructionId: string;
  readonly rollbackPlan: string;
}

export interface FailureContainmentCell {
  readonly failedNodeId: string;
  readonly invalidatedNodeIds: readonly string[];
  readonly unaffectedNodeIds: readonly string[];
}

export interface EvidenceSlot {
  readonly slotId: string;
  readonly instructionId: string;
  readonly description: string;
}

// ─── S04 – Executor Cognition & Tool Plan ─────────────────────────────────────

export interface CognitionBudget {
  maxReads: number;
  maxSearches: number;
  maxToolCalls: number;
  maxAmbiguityBranches: number;
}

export interface BudgetConsumption {
  readonly reads: number;
  readonly searches: number;
  readonly toolCalls: number;
  readonly ambiguityBranches: number;
}

export interface CognitionBudgetState {
  readonly limits: CognitionBudget;
  readonly used: BudgetConsumption;
}

export interface ToolInvocation {
  tool: string;
  purpose: string;
  afterNodeIds: readonly string[];
  /** Concrete inputs the executor must pass. */
  inputs: readonly string[];
  /** Expected outputs the executor must produce. */
  expectedOutputs: readonly string[];
  /** Fallback path when the primary invocation cannot proceed. */
  fallbackPath: string;
}

/**
 * Read-once index bound to the active context/TCC identity. An index built
 * for another context must not be consumed; mismatch fails closed.
 */
export interface ReadOnceContextIndex {
  readonly contextIdentity: string;
  readonly entries: Readonly<Record<string, readonly string[]>>;
}

export interface ReadOnceConsumption {
  readonly value: readonly string[];
  readonly consumedKeys: readonly string[];
  readonly reused: boolean;
}

export interface AmbiguityItem {
  readonly topic: string;
  readonly resolved: boolean;
}

/**
 * Validity-bound negative search entry: the query identity plus the
 * source/context fingerprint under which the absence was proven. A stale
 * entry (different fingerprint or context) must not suppress a new search.
 */
export interface NegativeSearchEntry {
  readonly query: string;
  readonly fingerprint: string;
  readonly contextIdentity: string;
}

// ─── S05 – Pack Receipt & Regression ──────────────────────────────────────────

export interface PackSemanticDigestInput {
  readonly packId: string;
  readonly taskIdentity: string;
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly capabilityIdentity: string;
  readonly contextIdentity: string;
  readonly contextDigest: string;
  readonly objective: string;
  readonly stopCondition: string;
  readonly handbackSchema: string;
  readonly constraints: readonly string[];
  readonly allowedMutations: readonly string[];
  readonly forbiddenMutations: readonly string[];
  readonly proofObligations: readonly string[];
  /** Canonical JSON per instruction payload, order-independent. */
  readonly instructionPayloads: readonly string[];
  /** Canonical JSON per work-graph node, order-independent. */
  readonly workGraphPayloads: readonly string[];
  readonly criticalPath: readonly string[];
  readonly waves: readonly (readonly string[])[];
  /** Canonical JSON per validation, order-independent. */
  readonly validationPayloads: readonly string[];
  /**
   * Canonical JSON per guardrail node-to-policy mapping
   * ({nodeId, policyIds}), order-independent. Reassigning the same policy
   * IDs to different nodes changes the digest — flat policy ID lists are
   * never sufficient sealing.
   */
  readonly guardrailMappingPayloads: readonly string[];
  /** Canonical JSON per tool invocation, order-independent. */
  readonly toolPayloads: readonly string[];
  /** Entropy-reduced prompt lines; order is semantic and preserved. */
  readonly reducedPrompt: readonly string[];
  readonly noDiscoveryBoundary: readonly string[];
  /** Active context/TCC identity bound to the read-once index. */
  readonly readOnceIdentity: string;
  /** Canonical JSON per read-once entry ({key, values}), order-independent. */
  readonly readOncePayloads: readonly string[];
  /** Canonical JSON per negative-search entry, order-independent. */
  readonly negativeSearchPayloads: readonly string[];
  /** Canonical JSON of the cognition budget limits. */
  readonly cognitionBudgetPayload: string;
  /** Canonical JSON per provenance entry, order-independent. */
  readonly provenancePayloads: readonly string[];
  /** Canonical JSON per rollback proof, order-independent. */
  readonly rollbackPayloads: readonly string[];
  readonly evidenceSlotIds: readonly string[];
  /** Canonical JSON of the prompt completeness certificate assertions. */
  readonly completenessPayload: string;
}

/** The four digests sealing one pack, recomputed as a unit. */
export interface SealedDigests {
  readonly graphDigest: string;
  readonly toolPlanDigest: string;
  readonly validationPlanDigest: string;
  readonly semanticDigest: string;
}

export interface DriftCheckInput {
  readonly currentTaskIdentity: string;
  readonly currentBindings: Binding & { contextIdentity: string; contextDigest: string };
  readonly currentCapabilityIdentity: string;
}

export interface EntropyReductionResult {
  readonly reduced: readonly string[];
  readonly removedLines: number;
  readonly preservedMarkers: readonly string[];
}

export interface ReplayEvaluation {
  readonly replayable: boolean;
  readonly reason: string;
}

export interface ExecutionPack extends Binding {
  packId: string;
  taskIdentity: string;
  contextIdentity: string;
  contextDigest: string;
  objective: string;
  constraints: readonly string[];
  allowedMutations: readonly string[];
  forbiddenMutations: readonly string[];
  proofObligations: readonly string[];
  stopCondition: string;
  handbackSchema: string;
  instructions: readonly ExecutableInstruction[];
  workDag: readonly WorkNode[];
  criticalPath: readonly string[];
  safeParallelWaves: readonly (readonly string[])[];
  validations: readonly ValidationRequirement[];
  readOnceIndex: ReadOnceContextIndex;
  negativeSearchLedger: readonly NegativeSearchEntry[];
  toolBlueprint: readonly ToolInvocation[];
  cognitionBudget: CognitionBudget;
  noDiscoveryBoundary: readonly string[];
  guardrailBindings: readonly string[];
  /** First-class Guardrail Binding Table: canonical node-to-policy mapping. */
  guardrailTable: readonly GuardrailBinding[];
  evidenceSlots: readonly string[];
  rollbackProofs: readonly RollbackProof[];
  reducedPrompt: readonly string[];
  graphDigest: string;
  toolPlanDigest: string;
  validationPlanDigest: string;
  semanticDigest: string;
  provenanceMap: readonly ProvenanceEntry[];
  completenessCertificate: PromptCompletenessCertificate;
}

export interface PackReceipt {
  packId: string;
  status: PackStatus;
  semanticDigest: string;
  diagnostics: readonly string[];
  replayable: boolean;
  taskIdentity: string;
  contextIdentity: string;
  contextDigest: string;
  policyVersion: string;
  graphDigest: string;
  toolPlanDigest: string;
  validationPlanDigest: string;
  capabilityIdentity: string;
}

// ─── Top-level compilation ────────────────────────────────────────────────────

export interface CompileExecutionPackInput {
  readonly packId: string;
  readonly context: AdmittedContextInput;
  readonly objective: string;
  readonly constraints: readonly string[];
  readonly allowedMutations: readonly string[];
  readonly forbiddenMutations: readonly string[];
  readonly proofObligations: readonly string[];
  readonly stopCondition: string;
  readonly handbackSchema: string;
  readonly instructions: readonly ExecutableInstruction[];
  readonly validations: readonly ValidationRequirement[];
  readonly requiredCapability: ExecutorCapabilityContract;
  readonly capabilityOffer: ExecutorCapabilityOffer;
  readonly guardrailBindings: readonly GuardrailBinding[];
  readonly provenanceEntries: readonly ProvenanceEntry[];
  readonly reasoningBranches: readonly ReasoningBranch[];
  readonly ambiguities: readonly AmbiguityItem[];
  readonly cognitionBudget: CognitionBudget;
  readonly toolBlueprint: readonly ToolInvocation[];
  readonly readOnceEntries: Readonly<Record<string, readonly string[]>>;
  readonly negativeSearchLedger: readonly NegativeSearchEntry[];
  readonly noDiscoveryBoundary: readonly string[];
  readonly promptSections: readonly string[];
  readonly obligationMarkers: readonly string[];
}

export interface CompiledExecutionPack {
  readonly pack: ExecutionPack;
  readonly receipt: PackReceipt;
  readonly envelope: ExecutionPackEnvelope;
  readonly provenanceMap: readonly ProvenanceEntry[];
  readonly certificate: PromptCompletenessCertificate;
  readonly guardrailTable: readonly GuardrailBinding[];
  readonly validationClosures: readonly InstructionValidationClosure[];
  readonly rollbackProofs: readonly RollbackProof[];
  readonly evidenceSlots: readonly EvidenceSlot[];
  readonly criticalPath: readonly string[];
  readonly waves: readonly (readonly string[])[];
  readonly increments: readonly AtomicIncrement[];
}

// ─── Diagnostic codes (reserved vocabulary) ───────────────────────────────────
// These codes are reserved; semantics cannot be silently weakened.
export const DIAGNOSTIC_CODES = {
  PACK_BINDING_INVALID: 'PACK_BINDING_INVALID',
  PACK_TASK_IDENTITY_MISSING: 'PACK_TASK_IDENTITY_MISSING',
  PACK_SECTION_MISSING: 'PACK_SECTION_MISSING',
  PACK_MUTATION_NOT_PERMITTED: 'PACK_MUTATION_NOT_PERMITTED',
  PACK_CONTEXT_STALE: 'PACK_CONTEXT_STALE',
  PACK_CONTEXT_NOT_READY: 'PACK_CONTEXT_NOT_READY',
  PACK_POLICY_STALE: 'PACK_POLICY_STALE',
  PACK_CAPABILITY_MISMATCH: 'PACK_CAPABILITY_MISMATCH',
  PACK_CAPABILITY_MISSING: 'PACK_CAPABILITY_MISSING',
  PACK_FORBIDDEN_CAPABILITY_OFFERED: 'PACK_FORBIDDEN_CAPABILITY_OFFERED',
  PACK_PARALLELISM_EXCEEDED: 'PACK_PARALLELISM_EXCEEDED',
  PACK_SANDBOX_MISMATCH: 'PACK_SANDBOX_MISMATCH',
  PACK_PROVENANCE_MISSING: 'PACK_PROVENANCE_MISSING',
  PACK_PROVENANCE_UNKNOWN_INSTRUCTION: 'PACK_PROVENANCE_UNKNOWN_INSTRUCTION',
  PACK_GRAPH_EMPTY: 'PACK_GRAPH_EMPTY',
  PACK_GRAPH_DUPLICATE_NODE: 'PACK_GRAPH_DUPLICATE_NODE',
  PACK_GRAPH_UNKNOWN_DEPENDENCY: 'PACK_GRAPH_UNKNOWN_DEPENDENCY',
  PACK_GRAPH_CYCLE: 'PACK_GRAPH_CYCLE',
  PACK_GRAPH_BUDGET_EXHAUSTED: 'PACK_GRAPH_BUDGET_EXHAUSTED',
  PACK_GRAPH_INVALID: 'PACK_GRAPH_INVALID',
  PACK_NODE_PRECONDITION_MISSING: 'PACK_NODE_PRECONDITION_MISSING',
  PACK_NODE_EVIDENCE_MISSING: 'PACK_NODE_EVIDENCE_MISSING',
  PACK_NODE_MUTATION_SPEC_MISSING: 'PACK_NODE_MUTATION_SPEC_MISSING',
  PACK_GUARDRAIL_UNBOUND: 'PACK_GUARDRAIL_UNBOUND',
  PACK_GUARDRAIL_UNKNOWN_NODE: 'PACK_GUARDRAIL_UNKNOWN_NODE',
  PACK_GUARDRAIL_DUPLICATE_NODE: 'PACK_GUARDRAIL_DUPLICATE_NODE',
  PACK_VALIDATION_UNCLOSED: 'PACK_VALIDATION_UNCLOSED',
  PACK_VALIDATION_UNKNOWN_TARGET: 'PACK_VALIDATION_UNKNOWN_TARGET',
  PACK_ROLLBACK_MISSING: 'PACK_ROLLBACK_MISSING',
  PACK_COMPLETENESS_FAILED: 'PACK_COMPLETENESS_FAILED',
  PACK_NDB_VIOLATION: 'PACK_NDB_VIOLATION',
  PACK_REASONING_BRANCH_UNRESOLVED: 'PACK_REASONING_BRANCH_UNRESOLVED',
  PACK_BUDGET_EXHAUSTED: 'PACK_BUDGET_EXHAUSTED',
  PACK_BUDGET_INVALID: 'PACK_BUDGET_INVALID',
  PACK_ROCI_UNKNOWN_KEY: 'PACK_ROCI_UNKNOWN_KEY',
  PACK_ROCI_INVALID: 'PACK_ROCI_INVALID',
  PACK_ROCI_CONTEXT_MISMATCH: 'PACK_ROCI_CONTEXT_MISMATCH',
  PACK_AMBIGUITY_ESCALATED: 'PACK_AMBIGUITY_ESCALATED',
  PACK_TOOL_BLUEPRINT_INVALID: 'PACK_TOOL_BLUEPRINT_INVALID',
  PACK_FCC_UNKNOWN_NODE: 'PACK_FCC_UNKNOWN_NODE',
  PACK_EVIDENCE_SLOT_INVALID: 'PACK_EVIDENCE_SLOT_INVALID',
  PACK_RECEIPT_INVALID: 'PACK_RECEIPT_INVALID',
  PACK_REPLAY_REJECTED: 'PACK_REPLAY_REJECTED',
  PACK_ENTROPY_OBLIGATION_MISSING: 'PACK_ENTROPY_OBLIGATION_MISSING',
  PACK_TRUST_ANCHOR_MISSING: 'PACK_TRUST_ANCHOR_MISSING',
  PACK_TRUST_ANCHOR_NOT_VALID: 'PACK_TRUST_ANCHOR_NOT_VALID',
  DIGEST_CAPABILITY_INVALID: 'DIGEST_CAPABILITY_INVALID',
  DIGEST_RESULT_INVALID: 'DIGEST_RESULT_INVALID',
  DIGEST_CAPABILITY_FAILURE: 'DIGEST_CAPABILITY_FAILURE',
  INPUT_CYCLE: 'INPUT_CYCLE',
  UNSUPPORTED_PROTOTYPE: 'UNSUPPORTED_PROTOTYPE',
  CANCELLED: 'CANCELLED',
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
