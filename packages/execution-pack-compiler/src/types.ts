// M15 Execution Pack Compiler - types.ts
// All types for M15 mechanisms: S01-S05.
// Strict deterministic TypeScript. No filesystem/network/Git/provider mutation.
//
// Admitted upstream interface: the M14 Task Context Capsule and Execution
// Handoff Contract are consumed opaquely through AdmittedContextInput.
// Only capsules with contextValidity 'VALID' and readyForM15Consumption may
// reach compilation; every binding is rechecked exactly, never inferred.

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
 * Minimal admitted view of an M14 Task Context Capsule plus its Execution
 * Handoff Contract. The compiler never reopens M14 authority reasoning; it
 * only rechecks exact bindings and the handoff readiness flag, failing closed.
 */
export interface AdmittedContextInput extends Binding {
  readonly contextIdentity: string;
  readonly contextDigest: string;
  /** M14 ReceiptValidity; only 'VALID' is consumable by M15. */
  readonly contextValidity: string;
  /** Mirrors ExecutionHandoffContract.readyForM15Consumption. */
  readonly readyForConsumption: boolean;
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

// ─── S01 – Execution Pack Contract ────────────────────────────────────────────

export interface ExecutionPackEnvelope extends Binding {
  readonly packId: string;
  readonly contextIdentity: string;
  readonly envelopeDigest: string;
}

export interface ProvenanceEntry {
  readonly instructionId: string;
  readonly authorityRefs: readonly string[];
  readonly decisionRefs: readonly string[];
}

export interface PromptChecklist {
  readonly objective: boolean;
  readonly workGraph: boolean;
  readonly validations: boolean;
  readonly rollback: boolean;
  readonly evidenceSlots: boolean;
  readonly stopCondition: boolean;
  readonly noDiscoveryBoundary: boolean;
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
}

export interface ExecutorCapabilityOffer {
  readonly capabilityIdentity: string;
  readonly capabilities: readonly string[];
  readonly tools: readonly string[];
}

// ─── S02 – Work Graph & Critical Path ─────────────────────────────────────────

export interface WorkNode extends Instruction {
  wave: number;
  critical: boolean;
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
}

export interface ReadOnceContextIndex {
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

// ─── S05 – Pack Receipt & Regression ──────────────────────────────────────────

export interface PackSemanticDigestInput {
  readonly packId: string;
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
  readonly capabilityIdentity: string;
  readonly contextIdentity: string;
  readonly instructionIdentities: readonly string[];
  readonly criticalPath: readonly string[];
  readonly waves: readonly (readonly string[])[];
  readonly validationIds: readonly string[];
  readonly guardrailPolicyIds: readonly string[];
  readonly toolKeys: readonly string[];
}

export interface DriftCheckInput {
  readonly currentBindings: Binding & { contextIdentity: string };
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
  contextIdentity: string;
  instructions: readonly Instruction[];
  workDag: readonly WorkNode[];
  criticalPath: readonly string[];
  safeParallelWaves: readonly (readonly string[])[];
  validations: readonly ValidationRequirement[];
  readOnceIndex: Readonly<Record<string, readonly string[]>>;
  negativeSearchLedger: readonly string[];
  toolBlueprint: readonly ToolInvocation[];
  cognitionBudget: CognitionBudget;
  noDiscoveryBoundary: readonly string[];
  guardrailBindings: readonly string[];
  evidenceSlots: readonly string[];
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
}

// ─── Top-level compilation ────────────────────────────────────────────────────

export interface CompileExecutionPackInput {
  readonly packId: string;
  readonly context: AdmittedContextInput;
  readonly instructions: readonly Instruction[];
  readonly validations: readonly ValidationRequirement[];
  readonly requiredCapability: ExecutorCapabilityContract;
  readonly capabilityOffer: ExecutorCapabilityOffer;
  readonly guardrailBindings: readonly GuardrailBinding[];
  readonly provenanceEntries: readonly ProvenanceEntry[];
  readonly cognitionBudget: CognitionBudget;
  readonly toolBlueprint: readonly ToolInvocation[];
  readonly readOnceEntries: Readonly<Record<string, readonly string[]>>;
  readonly negativeSearchLedger: readonly string[];
  readonly noDiscoveryBoundary: readonly string[];
  readonly checklist: PromptChecklist;
}

export interface CompiledExecutionPack {
  readonly pack: ExecutionPack;
  readonly receipt: PackReceipt;
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
  PACK_CONTEXT_STALE: 'PACK_CONTEXT_STALE',
  PACK_CONTEXT_NOT_READY: 'PACK_CONTEXT_NOT_READY',
  PACK_POLICY_STALE: 'PACK_POLICY_STALE',
  PACK_CAPABILITY_MISMATCH: 'PACK_CAPABILITY_MISMATCH',
  PACK_CAPABILITY_MISSING: 'PACK_CAPABILITY_MISSING',
  PACK_PROVENANCE_MISSING: 'PACK_PROVENANCE_MISSING',
  PACK_PROVENANCE_UNKNOWN_INSTRUCTION: 'PACK_PROVENANCE_UNKNOWN_INSTRUCTION',
  PACK_GRAPH_EMPTY: 'PACK_GRAPH_EMPTY',
  PACK_GRAPH_DUPLICATE_NODE: 'PACK_GRAPH_DUPLICATE_NODE',
  PACK_GRAPH_UNKNOWN_DEPENDENCY: 'PACK_GRAPH_UNKNOWN_DEPENDENCY',
  PACK_GRAPH_CYCLE: 'PACK_GRAPH_CYCLE',
  PACK_GRAPH_BUDGET_EXHAUSTED: 'PACK_GRAPH_BUDGET_EXHAUSTED',
  PACK_GRAPH_INVALID: 'PACK_GRAPH_INVALID',
  PACK_GUARDRAIL_UNBOUND: 'PACK_GUARDRAIL_UNBOUND',
  PACK_GUARDRAIL_UNKNOWN_NODE: 'PACK_GUARDRAIL_UNKNOWN_NODE',
  PACK_GUARDRAIL_DUPLICATE_NODE: 'PACK_GUARDRAIL_DUPLICATE_NODE',
  PACK_VALIDATION_UNCLOSED: 'PACK_VALIDATION_UNCLOSED',
  PACK_VALIDATION_UNKNOWN_TARGET: 'PACK_VALIDATION_UNKNOWN_TARGET',
  PACK_ROLLBACK_MISSING: 'PACK_ROLLBACK_MISSING',
  PACK_COMPLETENESS_FAILED: 'PACK_COMPLETENESS_FAILED',
  PACK_NDB_VIOLATION: 'PACK_NDB_VIOLATION',
  PACK_BUDGET_EXHAUSTED: 'PACK_BUDGET_EXHAUSTED',
  PACK_BUDGET_INVALID: 'PACK_BUDGET_INVALID',
  PACK_ROCI_UNKNOWN_KEY: 'PACK_ROCI_UNKNOWN_KEY',
  PACK_ROCI_INVALID: 'PACK_ROCI_INVALID',
  PACK_AMBIGUITY_ESCALATED: 'PACK_AMBIGUITY_ESCALATED',
  PACK_TOOL_BLUEPRINT_INVALID: 'PACK_TOOL_BLUEPRINT_INVALID',
  PACK_FCC_UNKNOWN_NODE: 'PACK_FCC_UNKNOWN_NODE',
  PACK_EVIDENCE_SLOT_INVALID: 'PACK_EVIDENCE_SLOT_INVALID',
  PACK_RECEIPT_INVALID: 'PACK_RECEIPT_INVALID',
  PACK_REPLAY_REJECTED: 'PACK_REPLAY_REJECTED',
  DIGEST_CAPABILITY_INVALID: 'DIGEST_CAPABILITY_INVALID',
  DIGEST_RESULT_INVALID: 'DIGEST_RESULT_INVALID',
  DIGEST_CAPABILITY_FAILURE: 'DIGEST_CAPABILITY_FAILURE',
  INPUT_CYCLE: 'INPUT_CYCLE',
  UNSUPPORTED_PROTOTYPE: 'UNSUPPORTED_PROTOTYPE',
  CANCELLED: 'CANCELLED',
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
