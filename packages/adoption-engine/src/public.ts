export type * from './types.js';
export {
  createAdoptionIntentCapsule,
  validateAdoptionIntentCapsule,
  invalidateAdoptionAdmission,
  validateAdoptionTransition,
  buildGovernanceMaturityVector,
  validateAdoptionSafetyEnvelope,
  assessNewProject,
  validateBootstrapTemplateBinding,
  buildBootstrapSeedGraph,
  evaluateMinimalGovernanceKernel,
  maturitySatisfies
} from './policy.js';
export {
  reconcileBrownfieldTruth,
  validateLegacyCompatibilityMembrane,
  validateCompatibilityBridge,
  validateLegacyBindingFreshness,
  validateDriftResolution,
  planAdoptionSlice,
  buildProgressiveGovernanceEnvelope,
  createLegacyDebtRecord,
  buildLegacyDebtQuarantine,
  validateNormalizationTransition,
  buildNormalizationFrontier,
  probeSemanticEquivalence,
  enforceNormalizationBudget,
  classifyReversibility,
  evaluateDestructivePromotion
} from './brownfield.js';
export {
  evaluateCapabilityUnlock,
  buildAdoptionProofSpine,
  computeProofInvalidation,
  buildGovernanceDeltaReceipt,
  buildAdoptionReceipt,
  evaluateReceiptValidity,
  detectAdoptionRegression
} from './receipt.js';

import type { OperationOptions, ProvenanceRecord, Result } from './types.js';
import { compareCodePoint, deepFreeze, fail, sha } from './utils.js';

export function projectBootstrapProvenance(input:{artifactId:string;sourceRefs:readonly string[];templateRef?:Readonly<{id:string;version:string;digest:string}>;semanticOwner:string;payloadIdentity:string;applyReceiptRef?:string;validationState:'VALID'|'INCOMPLETE'},options:OperationOptions):Result<ProvenanceRecord> {
  if(!input.artifactId||!input.semanticOwner||!input.payloadIdentity)return fail('PROVENANCE_BINDING_MISSING','Bootstrap provenance bindings are incomplete',input.artifactId);
  const sourceRefs=[...input.sourceRefs].sort(compareCodePoint);
  if(input.templateRef&&(!input.templateRef.id||!input.templateRef.version||!input.templateRef.digest))return fail('PROVENANCE_TEMPLATE_BINDING_INVALID','Bootstrap provenance template binding is incomplete',input.artifactId);
  const generated=sha(options,{artifactId:input.artifactId,sourceRefs,templateRef:input.templateRef,semanticOwner:input.semanticOwner,payloadIdentity:input.payloadIdentity,applyReceiptRef:input.applyReceiptRef,validationState:input.validationState});
  if(!generated.ok)return generated;
  return {ok:true,value:deepFreeze({artifactId:input.artifactId,sourceRefs,...(input.templateRef?{templateRef:{...input.templateRef}}:{}),semanticOwner:input.semanticOwner,generatedDigest:generated.value,...(input.applyReceiptRef?{applyReceiptRef:input.applyReceiptRef}:{}),validationState:input.validationState})};
}
