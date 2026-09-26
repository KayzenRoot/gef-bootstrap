// M14 Task & Context Compiler - public.ts
// Public surface for @gef-bootstrap/task-context-compiler
// Re-exports all types and function APIs from S01-S05.
// No filesystem/network/Git/provider mutation.

// ─── Types ────────────────────────────────────────────────────────────────────
export type * from './types.js';

// ─── S01 – Task Model and Context Contract ─────────────────────────────────────
export {
  createTaskIntentEnvelope,
  validateTaskIntentEnvelopeBinding,
  createAuthorityBoundContextUnit,
  validateAbcuBinding,
  computeContextDependencyClosure,
  applyCallerBudget,
} from './s01-task-contract.js';
export type { DependencyNode } from './s01-task-contract.js';

// ─── S02 – Source Routing and Authority-Bound Selection ────────────────────────
export {
  routeTaskToSources,
  applyAuthorityBoundSelectionFilter,
  validateContextAuthorityMatrix,
  buildAuthorityNeighborhoodProjection,
  applyContextRedundancyBarrier,
  checkRoutingBudget,
} from './s02-source-routing.js';
export type { SourceRouteInput, AnpSourceInput } from './s02-source-routing.js';

// ─── S03 – Minimum Sufficient Context & Sufficiency Proof ─────────────────────
export {
  computeContextCutFrontier,
  buildSemanticCoverageLattice,
  buildContextDeficitVector,
  buildMinimumContextWitness,
  buildContextSufficiencyProof,
} from './s03-msc-proof.js';
export type { ObligationDefinition, BuildSufficiencyProofInput, ContextCutFrontierResult } from './s03-msc-proof.js';

// ─── S04 – Safe Expansion and Full-Context Gate ────────────────────────────────
export {
  evaluateFullContextSafetyGate,
  computeRiskAdaptiveContextAperture,
  scanDependencyShockwave,
  runUnknownUnknownSentinel,
  advanceExpansionLadder,
  createExpansionBudgetEnvelope,
  updateExpansionBudget,
} from './s04-safe-expansion.js';
export type { FcsgInput, DssSourceNode, UusInputGraph } from './s04-safe-expansion.js';

// ─── S05 – Context Receipt, Regression & Handoff ──────────────────────────────
export {
  computeContextSemanticDigest,
  buildTaskContextCapsule,
  computeSelectiveContextInvalidationGraph,
  detectContextRegression,
  buildExecutionHandoffContract,
  evaluateCapsuleValidity,
} from './s05-receipt-handoff.js';
export type { FingerprintBinding, PreviousCapsuleSnapshot, ValidityEvalInput } from './s05-receipt-handoff.js';
