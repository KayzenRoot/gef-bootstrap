import type {
  ContinuityPolicyBinding, ExceptionDebtRegister, ExceptionScopeSnapshot, ExceptionWarrant, GuardrailCoverageMap,
  OperationOptions, PolicyAuthorityCapsule, PolicyDecisionReceipt, PolicyRegressionFinding, PolicyRegressionSnapshot, Result,
} from './types.js';
import { compareCodePoint, deepFreeze, isSubset, sha, sortedUnique } from './utils.js';

export function computePolicySemanticFingerprint(policies: readonly PolicyAuthorityCapsule[], warrants: readonly ExceptionWarrant[], options: OperationOptions): Result<string> {
  return sha(options,{ policies:[...policies].sort((a,b)=>compareCodePoint(a.policyId,b.policyId)).map(p=>({policyId:p.policyId,digest:p.semanticDigest,status:p.status,authorityRef:p.authorityRef,precedenceDomain:p.precedenceDomain})), warrants:[...warrants].sort((a,b)=>compareCodePoint(a.warrantId,b.warrantId)).map(w=>({warrantId:w.warrantId,digest:w.warrantDigest,status:w.status})) });
}

export function buildGuardrailCoverageMap(policies: readonly PolicyAuthorityCapsule[], mandatoryDomains: readonly string[]): GuardrailCoverageMap {
  const domains=sortedUnique([...mandatoryDomains,...policies.flatMap(p=>p.domains)]);
  const entries=domains.map(domain=>({domain,policyIds:sortedUnique(policies.filter(p=>p.status==='ACTIVE'&&p.domains.includes(domain)).map(p=>p.policyId)),obligationIds:sortedUnique(policies.filter(p=>p.status==='ACTIVE').flatMap(p=>p.obligations.filter(o=>o.domain===domain).map(o=>o.obligationId)))}));
  return deepFreeze({entries,uncoveredDomains:entries.filter(e=>mandatoryDomains.includes(e.domain)&&e.policyIds.length===0).map(e=>e.domain)});
}

export function buildExceptionDebtRegister(warrants: readonly ExceptionWarrant[], options: OperationOptions): Result<ExceptionDebtRegister> {
  const entries=[...warrants].filter(w=>w.status==='ACTIVE').sort((a,b)=>compareCodePoint(a.warrantId,b.warrantId)).map(w=>({warrantId:w.warrantId,reviewTrigger:w.reviewTrigger,compensatingControls:sortedUnique(w.compensatingControls),warrantDigest:w.warrantDigest}));
  const d=sha(options,entries); if(!d.ok)return d; return {ok:true,value:deepFreeze({entries,registerDigest:d.value})};
}

export function createPolicyRegressionSnapshot(receipt: PolicyDecisionReceipt, policies: readonly PolicyAuthorityCapsule[], warrants: readonly ExceptionWarrant[]): PolicyRegressionSnapshot {
  const exceptionScopes: ExceptionScopeSnapshot[]=[...warrants].filter(w=>w.status==='ACTIVE').sort((a,b)=>compareCodePoint(a.warrantId,b.warrantId)).map(w=>({warrantId:w.warrantId,domains:sortedUnique(w.domains),nodeIds:sortedUnique(w.nodeIds),operations:sortedUnique(w.operations),permittedEffects:[...w.permittedEffects].sort(compareCodePoint)}));
  return deepFreeze({decision:receipt.decision,obligationIds:sortedUnique(receipt.obligations.map(o=>o.obligationId)),unknowns:sortedUnique(receipt.unknowns),authorityBindings:sortedUnique(policies.filter(p=>p.status==='ACTIVE').flatMap(p=>p.domains.map(d=>`${d}:${p.authorityRef}`))),exceptionScopes});
}

function isAllow(d:string){return d==='ALLOW'||d==='ALLOW_WITH_OBLIGATIONS';}
export function detectPolicyRegression(previous: PolicyRegressionSnapshot, current: PolicyRegressionSnapshot): readonly PolicyRegressionFinding[] {
  const findings: PolicyRegressionFinding[]=[];
  if(previous.decision==='DENY'&&isAllow(current.decision))findings.push({kind:'DENY_TO_ALLOW',subject:'decision'});
  if((previous.decision==='BLOCK_UNKNOWN'||previous.unknowns.length>0)&&isAllow(current.decision)&&current.unknowns.length===0)findings.push({kind:'UNKNOWN_TO_ALLOW',subject:'decision'});
  for(const id of previous.obligationIds)if(!current.obligationIds.includes(id))findings.push({kind:'OBLIGATION_LOSS',subject:id});
  for(const binding of previous.authorityBindings)if(!current.authorityBindings.includes(binding))findings.push({kind:'AUTHORITY_DOWNGRADE',subject:binding});
  for(const cur of current.exceptionScopes){const prev=previous.exceptionScopes.find(x=>x.warrantId===cur.warrantId);if(prev&&(!isSubset(cur.domains,prev.domains)||!isSubset(cur.nodeIds,prev.nodeIds)||!isSubset(cur.operations,prev.operations)||!isSubset(cur.permittedEffects,prev.permittedEffects)))findings.push({kind:'EXCEPTION_BROADENED',subject:cur.warrantId});}
  return deepFreeze(findings.sort((a,b)=>compareCodePoint(`${a.kind}:${a.subject}`,`${b.kind}:${b.subject}`)));
}

export function buildContinuityPolicyBinding(checkpointIdentity:string,policyFingerprint:string,receipt:PolicyDecisionReceipt,debt:ExceptionDebtRegister,policies:readonly PolicyAuthorityCapsule[],options:OperationOptions):Result<ContinuityPolicyBinding>{
  const semantic={checkpointIdentity,policyFingerprint,decisionReceiptDigest:receipt.receiptDigest,exceptionDebtDigest:debt.registerDigest,policyIds:sortedUnique(policies.map(p=>p.policyId))}as const;
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,bindingDigest:d.value})};
}
