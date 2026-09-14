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
  evaluatePackReplay,
} from './s05-receipt.js';

// ─── Top-level compilation ────────────────────────────────────────────────────
export { compileExecutionPack } from './compile.js';
