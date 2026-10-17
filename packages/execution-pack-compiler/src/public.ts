// M15 Execution Pack Compiler - public.ts
// Public surface for @gef-bootstrap/execution-pack-compiler
// Re-exports all types and function APIs from S01-S05 plus the top-level
// compileExecutionPack orchestrator.
// No filesystem/network/Git/provider mutation.

// ─── Types (including reused M14 contract types) ──────────────────────────────
export type * from './types.js';
export { DIAGNOSTIC_CODES } from './types.js';
export type { DiagnosticCode } from './types.js';

// ─── S01 – Execution Pack Contract ────────────────────────────────────────────
export {
  createExecutionPackEnvelope,
  buildInstructionProvenanceMap,
  validateExecutorCapabilityContract,
  issuePromptCompletenessCertificate,
  checkNoDiscoveryBoundary,
} from './s01-pack-contract.js';

// ─── S02 – Work Graph & Critical Path ─────────────────────────────────────────
export {
  computeExecutableWorkDag,
  computeSemanticCriticalPath,
  computeSafeParallelismMatrix,
  overlapPairKey,
  suppressReasoningBranches,
  createAtomicIncrementBoundary,
} from './s02-work-graph.js';

// ─── S03 – Guardrails, Validation & Rollback ──────────────────────────────────
export {
  buildGuardrailBindingTable,
  buildValidationClosureMatrix,
  proveRollbackReadiness,
  computeFailureContainmentCell,
  createPostconditionEvidenceSlot,
} from './s03-guardrails.js';

// ─── S04 – Executor Cognition & Tool Plan ─────────────────────────────────────
export {
  createExecutorCognitionBudget,
  consumeCognitionBudget,
  buildToolInvocationBlueprint,
  buildReadOnceContextIndex,
  validateReadOnceContextBinding,
  consumeReadOnce,
  consumeReadOnceBound,
  normalizeLedgerQuery,
  recordNegativeSearch,
  checkNegativeSearch,
  evaluateAmbiguityEscalation,
} from './s04-cognition.js';

// ─── S05 – Pack Receipt & Regression ──────────────────────────────────────────
export {
  buildPackDigestInput,
  computePackSemanticDigest,
  computeWorkGraphDigest,
  computeToolPlanDigest,
  computeValidationPlanDigest,
  computeSealedDigests,
  findSealedDigestDrift,
  buildExecutionPackReceipt,
  statusForDiagnosticCode,
  checkPreInvocationDrift,
  reducePromptEntropy,
  isReplayAuthorizedReceipt,
  evaluatePackReplay,
} from './s05-receipt.js';

// ─── Top-level compilation ────────────────────────────────────────────────────
export { compileExecutionPack } from './compile.js';

// ─── V1.1 Execution Capsule projection ───────────────────────────────────────
export * from './execution-capsule.js';

// ─── S06 – Canonical Planning Completeness and Owner-Change Impact ────────────
export {
  CANONICAL_PLANNING_DOMAINS,
  analyzeCanonicalPlan,
} from './s06-canonical-planning-analysis.js';
export type {
  CanonicalPlanningDomain,
  PlanningKnowledgeState,
  CanonicalPlanningState,
  CanonicalPlanBinding,
  CanonicalPlanRequirement,
  CanonicalPlanProof,
  PlanningSourceFingerprint,
  CanonicalDomainDependency,
  PlanningOwnerChange,
  UnknownAuthorityDomain,
  CanonicalPlanAnalysisInput,
  RequirementProofLink,
  CanonicalRequirementAssessment,
  CanonicalPlanningUnknown,
  OwnerChangeImpact,
  CanonicalPlanAnalysis,
} from './s06-canonical-planning-analysis.js';

// U12-03: source-bound Marathon planning and receipt state machine.
export { compileMarathonFromExecutionPack } from './v12-marathon.js';
export { compileMarathon, initialMarathonState, readyMarathonNodes, validateMarathonState, advanceMarathon } from './v12-marathon.js';
export type { MarathonStatus, MarathonDigest, MarathonResult, MarathonNode, MarathonRequest, MarathonPlan, MarathonStepState, MarathonState, MarathonAction } from './v12-marathon.js';

// U12-03: durable-state CAS integration boundary (no provider side effects).
export { initializePersistedMarathon, recoverPersistedMarathon, persistMarathonTransition } from './v12-marathon-persistence.js';
export type { MarathonStateStore, MarathonRecoveryDecision, MarathonSettlementProofPort } from './v12-marathon-persistence.js';

// U12-03: bounded single-step provider bridge using durable START and verified settlement.
export { executeMarathonStep } from './v12-marathon-runner.js';
export type { MarathonStepProvider } from './v12-marathon-runner.js';

// U12-03: reconcile an ambiguous persisted intent without re-executing provider mutations.
export { reconcileMarathonStep } from './v12-marathon-runner.js';
export type { MarathonReconciliationProvider } from './v12-marathon-runner.js';

// U12-03: concrete local crash-safe durable CAS snapshot store, no implicit lock recovery.
export { createFileBackedMarathonStore } from './v12-marathon-file-store.js';

// U12-03: sealed, read-only operator continuation decisions.
export { describeMarathonNextActions } from './v12-marathon-operator.js';
export type { MarathonNextAction, MarathonNodeDecision, MarathonOperatorView } from './v12-marathon-operator.js';
