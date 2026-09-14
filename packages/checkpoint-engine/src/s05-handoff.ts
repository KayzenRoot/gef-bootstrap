import type { CanonicalContinuationCapsule, CheckpointAdmissionReceipt, CheckpointFreshnessVector, CheckpointPortabilityEnvelope, CheckpointValidity, ContinuationHandoffContract, FreshnessEntry, OperationOptions, Result, ResumeReadinessCertificate } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, sha, sortedUnique } from './utils.js';

export function buildCheckpointFreshnessVector(capsule:CanonicalContinuationCapsule,observedIdentities:Readonly<Record<string,string|undefined>>,options:OperationOptions):Result<CheckpointFreshnessVector>{
  const c=cancelled(options);if(c)return c;
  const entries:FreshnessEntry[]=[...capsule.authorityBindings].sort((a,b)=>compareCodePoint(a.bindingId,b.bindingId)).map(b=>{const observed=observedIdentities[b.bindingId];return{bindingId:b.bindingId,state:observed===undefined?(b.required?'MISSING':'UNKNOWN'):observed===b.semanticIdentity?'CURRENT':'STALE',expectedIdentity:b.semanticIdentity,observedIdentity:observed??null};});
  const allCurrent=entries.every(e=>e.state==='CURRENT'||(!capsule.authorityBindings.find(b=>b.bindingId===e.bindingId)?.required&&e.state==='UNKNOWN'));
  const d=sha(options,{entries,allCurrent});if(!d.ok)return d;return{ok:true,value:deepFreeze({entries,allCurrent,vectorDigest:d.value})};
}

function admissionValidity(before:CanonicalContinuationCapsule|null,after:CanonicalContinuationCapsule):CheckpointValidity{
  if(before&&before.projectId!==after.projectId)return'PROJECT_MISMATCH';
  if(before&&before.lineageId!==after.lineageId)return'DIVERGENT';
  if(after.blockers.length>0)return'BLOCKED';
  return'VALID';
}

export function buildCheckpointAdmissionReceipt(before:CanonicalContinuationCapsule|null,after:CanonicalContinuationCapsule,options:OperationOptions):Result<CheckpointAdmissionReceipt>{
  const c=cancelled(options);if(c)return c;
  const semantic={validity:admissionValidity(before,after),beforeCheckpointDigest:before?.checkpointDigest??'GENESIS',afterCheckpointDigest:after.checkpointDigest,lineageId:after.lineageId,policyBindingDigest:after.policyBinding.bindingDigest,authorityIndexDigest:after.authorityIndex.indexDigest,blockerRefs:sortedUnique(after.blockers),nextLegalAction:after.nextLegalAction};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,admissionDigest:d.value})};
}

export function buildResumeReadinessCertificate(capsule:CanonicalContinuationCapsule,freshness:CheckpointFreshnessVector,portability:CheckpointPortabilityEnvelope,options:OperationOptions):Result<ResumeReadinessCertificate>{
  const required=new Set(capsule.authorityBindings.filter(b=>b.required).map(b=>b.bindingId));
  const missing=sortedUnique(freshness.entries.filter(e=>required.has(e.bindingId)&&e.state!=='CURRENT').map(e=>e.bindingId));
  const blockers=sortedUnique(capsule.blockers);const gaps=sortedUnique(portability.unsupportedCapabilities);
  const validity:CheckpointValidity=missing.length>0?'STALE_BINDING':blockers.length>0?'BLOCKED':gaps.length>0?'PARTIAL':'VALID';
  const semantic={validity,checkpointDigest:capsule.checkpointDigest,ready:validity==='VALID',missingBindingIds:missing,unresolvedBlockers:blockers,requiredCapabilityGaps:gaps};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({...semantic,certificateDigest:d.value})};
}

export function buildContinuationHandoffContract(capsule:CanonicalContinuationCapsule,readiness:ResumeReadinessCertificate,options:OperationOptions):Result<ContinuationHandoffContract>{
  if(readiness.checkpointDigest!==capsule.checkpointDigest)return{ok:false,diagnostics:[{code:'READINESS_CHECKPOINT_MISMATCH',message:'Resume readiness certificate is bound to another checkpoint'}]};
  const semantic={checkpointDigest:capsule.checkpointDigest,projectId:capsule.projectId,lineageId:capsule.lineageId,nextLegalAction:capsule.nextLegalAction,authorityIndexDigest:capsule.authorityIndex.indexDigest,policyBindingDigest:capsule.policyBinding.bindingDigest,readinessCertificateDigest:readiness.certificateDigest};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({...semantic,handoffDigest:d.value})};
}
