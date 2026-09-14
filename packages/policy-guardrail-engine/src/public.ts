// M16 Policy & Guardrail Engine - public.ts
// Public surface for @gef-bootstrap/policy-guardrail-engine
// Re-exports all types and function APIs from S01-S04.
// No filesystem/network/Git/provider mutation.

// ─── Types ────────────────────────────────────────────────────────────────────
export type * from './types.js';
export { DIAGNOSTIC_CODES } from './types.js';
export type { DiagnosticCode } from './types.js';

// ─── S01 – Policy Model & Authority ───────────────────────────────────────────
export {
  createPolicyAuthorityCapsule,
  combineDecisions,
  isPermissiveDecision,
  comparePolicyPrecedence,
  assertDomainIndependent,
  createExceptionWarrant,
  isWarrantExhausted,
  buildPolicyProvenanceChain,
  verifyProvenanceCoverage,
} from './s01-policy-model.js';

// ─── S02 – Policy Evaluation & Composition ────────────────────────────────────
export {
  composeObligations,
  buildApplicabilityWitnessSet,
  joinPolicyAssessments,
  issuePolicyDecisionReceipt,
  verifyPolicyDecisionReceipt,
  validatePolicyDomainLattice,
  bindPolicyFingerprints,
  applyShortCircuitFirewall,
  decidePolicy,
} from './s02-evaluation.js';

// ─── S03 – Runtime Enforcement & Exceptions ───────────────────────────────────
export {
  projectDecisionToNodes,
  issueMutationLease,
  checkExceptionBlastRadius,
  applyExceptionWarrant,
  revalidateLeaseAtMutation,
  evaluateFailClosedDegradation,
  authorizeMutation,
} from './s03-enforcement.js';

// ─── S04 – Regression, Audit & Handoff ───────────────────────────────────────
export {
  computePolicySemanticFingerprint,
  detectPolicyRegression,
  buildGuardrailCoverageMap,
  openExceptionDebt,
  resolveExceptionDebt,
  refreshDebtReviews,
  bindContinuityPolicy,
  revalidateContinuityPolicy,
} from './s04-regression.js';
