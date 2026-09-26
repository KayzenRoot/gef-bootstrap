import type{CreditEligibilityResult,DenominatorIntegrityManifest,EvidenceAcceptanceBinding,EvidenceAcceptanceBindingInput,OperationOptions,Result,WeightedCreditUnit}from'./types.js';
import{fail}from'./utils.js';
import{createEvidenceAcceptanceBinding as createBaseBinding,verifyEvidenceAcceptanceBinding as verifyBaseBinding,createWeightedCreditUnit as createBaseCredit,verifyWeightedCreditUnit as verifyBaseCredit,evaluateCreditEligibility as evaluateBaseEligibility}from'./s01-baseline.js';

const EVIDENCE_OWNERS=new Set(['M24_EVIDENCE','M25_PROOF','M27_ASSURANCE','EXTERNAL_CANONICAL']);
function ownerAllowed(owner:string){return EVIDENCE_OWNERS.has(owner);}

export function createEvidenceAcceptanceBinding(input:EvidenceAcceptanceBindingInput,options:OperationOptions):Result<EvidenceAcceptanceBinding>{
  if(input.owner==='M21_PROGRESS')return createBaseBinding(input,options);
  if(!ownerAllowed(input.owner))return fail('EVIDENCE_OWNER_INVALID','Evidence acceptance owner is outside the frozen M21 authority boundary',input.unitId);
  return createBaseBinding(input,options);
}
export function verifyEvidenceAcceptanceBinding(value:EvidenceAcceptanceBinding,options:OperationOptions):Result<boolean>{if(!ownerAllowed(value.owner))return{ok:true,value:false};return verifyBaseBinding(value,options);}
export function createWeightedCreditUnit(unit:Parameters<typeof createBaseCredit>[0],binding:EvidenceAcceptanceBinding,options:OperationOptions):Result<WeightedCreditUnit>{if(!ownerAllowed(binding.owner))return fail('EVIDENCE_OWNER_INVALID','Weighted credit requires an allowed external evidence/proof owner',unit.unitId);return createBaseCredit(unit,binding,options);}
export function verifyWeightedCreditUnit(value:WeightedCreditUnit,manifest:DenominatorIntegrityManifest,bindings:readonly EvidenceAcceptanceBinding[],options:OperationOptions):Result<boolean>{if(bindings.some(b=>!ownerAllowed(b.owner)))return{ok:true,value:false};return verifyBaseCredit(value,manifest,bindings,options);}
export function evaluateCreditEligibility(manifest:DenominatorIntegrityManifest,bindings:readonly EvidenceAcceptanceBinding[],options:OperationOptions):Result<CreditEligibilityResult>{const bad=bindings.find(b=>!ownerAllowed(b.owner));if(bad)return fail('EVIDENCE_OWNER_INVALID','Credit eligibility rejected an owner outside the frozen authority boundary',bad.unitId);return evaluateBaseEligibility(manifest,bindings,options);}
