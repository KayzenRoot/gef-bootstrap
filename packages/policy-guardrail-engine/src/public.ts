// M16 Policy & Guardrail Engine — public surface.
export type * from './types.js';
export { createPolicyAuthorityCapsule, guardrailDecisionAlgebra, buildPolicyDomainLattice, createExceptionWarrant, buildPolicyProvenanceChain } from './s01-authority.js';
export { buildApplicabilityWitnessSet, buildObligationCompositionGraph, conflictPreservingPolicyJoin, evaluateGuardrailShortCircuit, buildPolicyDecisionReceipt, evaluatePolicies } from './s02-composition.js';
export { checkExceptionBlastRadius, enforceGuardrailMembrane, issueMutationCapabilityLease, checkPolicyToctou, failClosedDegradation } from './s03-enforcement.js';
export { computePolicySemanticFingerprint, buildGuardrailCoverageMap, buildExceptionDebtRegister, createPolicyRegressionSnapshot, detectPolicyRegression, buildContinuityPolicyBinding } from './s04-regression.js';
