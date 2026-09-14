import { buildContinuationMinimumSufficientState, verifyCanonicalContinuationCapsule } from '@gef-bootstrap/checkpoint-engine';
import type { CanonicalContinuationCapsule, ContinuationHandoffContract } from '@gef-bootstrap/checkpoint-engine';
import type { ContextTemperatureMap, HotStateEntry, HotStateRehydration, NegativeRehydrationCache, NegativeRehydrationCacheEntry, OperationOptions, Result, ResumeContextRef, ResumeMinimumSufficientContext, ResumeReadPlan, ResumeReadPlanStep } from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, isSha256, readBudget, sha, sortedUnique, validId } from './utils.js';
import { verifyContinuationHandoff } from './s01-intent.js';

const TEMP_RANK:Record<string,number>={HOT:0,WARM:1,COLD:2};

function verifyContext(context:ResumeMinimumSufficientContext,options:OperationOptions):Result<true>{
  const semantic={checkpointDigest:context.checkpointDigest,handoffDigest:context.handoffDigest,nextLegalAction:context.nextLegalAction,activeClaimIds:context.activeClaimIds,requiredAuthorityBindingIds:context.requiredAuthorityBindingIds,evidenceRefs:context.evidenceRefs,blockerRefs:context.blockerRefs,contextRefs:context.contextRefs};
  const d=sha(options,semantic);if(!d.ok)return d as Result<true>;return d.value===context.contextDigest?{ok:true,value:true}:fail('RMSC_TAMPERED','Resume minimum sufficient context digest does not match its payload');
}
function verifyHot(hot:HotStateRehydration,currentBinding:string,options:OperationOptions):Result<true>{
  const d=sha(options,{accepted:hot.accepted,rejectedRefIds:hot.rejectedRefIds});if(!d.ok)return d as Result<true>;
  if(d.value!==hot.rehydrationDigest)return fail('HOT_STATE_TAMPERED','Hot-state rehydration digest does not match its payload');
  if(hot.accepted.some(e=>e.validityBindingDigest!==currentBinding))return fail('HOT_STATE_STALE_BINDING','Accepted hot state is not bound to the current continuation handoff');
  return{ok:true,value:true};
}
function verifyTemperature(map:ContextTemperatureMap,options:OperationOptions):Result<true>{const d=sha(options,map.entries);if(!d.ok)return d as Result<true>;return d.value===map.mapDigest?{ok:true,value:true}:fail('TEMPERATURE_MAP_TAMPERED','Context temperature map digest does not match its payload');}
function verifyPlan(plan:ResumeReadPlan,options:OperationOptions):Result<true>{const d=sha(options,{steps:plan.steps,maxReads:plan.maxReads,expansionRequired:plan.expansionRequired});if(!d.ok)return d as Result<true>;return d.value===plan.planDigest?{ok:true,value:true}:fail('READ_PLAN_TAMPERED','Resume read plan digest does not match its payload');}
function verifyNegative(cache:NegativeRehydrationCache,options:OperationOptions):Result<true>{const d=sha(options,cache.entries);if(!d.ok)return d as Result<true>;return d.value===cache.cacheDigest?{ok:true,value:true}:fail('NEGATIVE_CACHE_TAMPERED','Negative rehydration cache digest does not match its payload');}

export function buildResumeMinimumSufficientContext(checkpoint:CanonicalContinuationCapsule,handoff:ContinuationHandoffContract,contextRefs:readonly ResumeContextRef[],options:OperationOptions):Result<ResumeMinimumSufficientContext>{
  const c=cancelled(options);if(c)return c;
  const cv=verifyCanonicalContinuationCapsule(checkpoint,{digest:options.digest,cancellation:options.cancellation});if(!cv.ok)return{ok:false,diagnostics:cv.diagnostics};
  const hv=verifyContinuationHandoff(handoff,options);if(!hv.ok)return hv as Result<ResumeMinimumSufficientContext>;
  if(handoff.checkpointDigest!==checkpoint.checkpointDigest||handoff.nextLegalAction!==checkpoint.nextLegalAction||handoff.authorityIndexDigest!==checkpoint.authorityIndex.indexDigest||handoff.policyBindingDigest!==checkpoint.policyBinding.bindingDigest)return fail('RMSC_HANDOFF_MISMATCH','Resume minimum context requires an exact M17 handoff/checkpoint binding');
  const ids=contextRefs.map(r=>r.refId);if(new Set(ids).size!==ids.length||contextRefs.some(r=>!validId(r.refId)))return fail('RMSC_REF_INVALID','Resume context references must have unique stable ids');
  const min=buildContinuationMinimumSufficientState(checkpoint,{digest:options.digest,cancellation:options.cancellation});if(!min.ok)return{ok:false,diagnostics:min.diagnostics};
  const refs=[...contextRefs].map(r=>({...r,dependencyKeys:sortedUnique(r.dependencyKeys)})).sort((a,b)=>compareCodePoint(a.refId,b.refId));
  const semantic={checkpointDigest:checkpoint.checkpointDigest,handoffDigest:handoff.handoffDigest,nextLegalAction:checkpoint.nextLegalAction,activeClaimIds:min.value.activeClaimIds,requiredAuthorityBindingIds:min.value.requiredAuthorityBindingIds,evidenceRefs:min.value.evidenceRefs,blockerRefs:min.value.blockerRefs,contextRefs:refs};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,contextDigest:d.value})};
}

export function rehydrateHotState(entries:readonly HotStateEntry[],currentValidityBindingDigest:string,options:OperationOptions):Result<HotStateRehydration>{
  const c=cancelled(options);if(c)return c;if(!isSha256(currentValidityBindingDigest))return fail('HOT_VALIDITY_INVALID','Hot-state validity binding must be a semantic digest');
  const ids=entries.map(e=>e.refId);if(new Set(ids).size!==ids.length||entries.some(e=>!validId(e.refId)||!isSha256(e.contentDigest)||!isSha256(e.validityBindingDigest)))return fail('HOT_STATE_INVALID','Hot-state entries require unique ids and semantic digests');
  const accepted=[...entries].filter(e=>e.validityBindingDigest===currentValidityBindingDigest).sort((a,b)=>compareCodePoint(a.refId,b.refId));
  const rejectedRefIds=sortedUnique(entries.filter(e=>e.validityBindingDigest!==currentValidityBindingDigest).map(e=>e.refId));
  const semantic={accepted,rejectedRefIds};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,rehydrationDigest:d.value})};
}

export function buildContextTemperatureMap(refs:readonly ResumeContextRef[],relevance:Readonly<Record<string,number|undefined>>,options:OperationOptions):Result<ContextTemperatureMap>{
  const c=cancelled(options);if(c)return c;const ids=refs.map(r=>r.refId);if(new Set(ids).size!==ids.length)return fail('TEMPERATURE_REF_DUPLICATE','Temperature map references must be unique');
  const entries=refs.map(ref=>{const raw=relevance[ref.refId]??(ref.mandatory?100:50);const score=Math.max(0,Math.min(100,Math.trunc(raw)));const temperature=score>=80?'HOT' as const:score>=40?'WARM' as const:'COLD' as const;return{refId:ref.refId,temperature,relevance:score};}).sort((a,b)=>compareCodePoint(a.refId,b.refId));
  const d=sha(options,entries);if(!d.ok)return d;return{ok:true,value:deepFreeze({entries,mapDigest:d.value})};
}

export function createNegativeRehydrationCache(entries:readonly NegativeRehydrationCacheEntry[],options:OperationOptions):Result<NegativeRehydrationCache>{
  const c=cancelled(options);if(c)return c;const ids=entries.map(e=>e.refId);if(new Set(ids).size!==ids.length||entries.some(e=>!validId(e.refId)||!isSha256(e.absenceProofDigest)||!isSha256(e.validityBindingDigest)))return fail('NEGATIVE_CACHE_INVALID','Negative cache entries require unique ids and proof/binding digests');
  const normalized=[...entries].sort((a,b)=>compareCodePoint(a.refId,b.refId));const d=sha(options,normalized);if(!d.ok)return d;return{ok:true,value:deepFreeze({entries:normalized,cacheDigest:d.value})};
}

export function buildResumeReadPlan(context:ResumeMinimumSufficientContext,hot:HotStateRehydration,temperature:ContextTemperatureMap,options:OperationOptions):Result<ResumeReadPlan>{
  const c=cancelled(options);if(c)return c;const vc=verifyContext(context,options);if(!vc.ok)return vc as Result<ResumeReadPlan>;const vh=verifyHot(hot,context.handoffDigest,options);if(!vh.ok)return vh as Result<ResumeReadPlan>;const vt=verifyTemperature(temperature,options);if(!vt.ok)return vt as Result<ResumeReadPlan>;
  const contextIds=new Set(context.contextRefs.map(r=>r.refId));if(hot.accepted.some(e=>!contextIds.has(e.refId)))return fail('HOT_STATE_OUTSIDE_CONTEXT','Hot-state reuse cannot suppress a reference outside the canonical resume context');
  const maxReads=readBudget(options);const hotIds=new Set(hot.accepted.map(e=>e.refId));const temps=new Map(temperature.entries.map(e=>[e.refId,e.temperature]));
  const candidates=context.contextRefs.filter(r=>!hotIds.has(r.refId)).map<ResumeReadPlanStep>(r=>({refId:r.refId,temperature:temps.get(r.refId)??r.preferredTemperature,reason:r.mandatory?'MINIMUM_SUFFICIENT_CONTEXT':'PROGRESSIVE_EXPANSION',mandatory:r.mandatory,dependencyKeys:sortedUnique(r.dependencyKeys)}));
  candidates.sort((a,b)=>Number(b.mandatory)-Number(a.mandatory)||(TEMP_RANK[a.temperature]??9)-(TEMP_RANK[b.temperature]??9)||compareCodePoint(a.refId,b.refId));
  const steps=candidates.slice(0,maxReads);const expansionRequired=candidates.length>maxReads;
  const semantic={steps,maxReads,expansionRequired};const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,planDigest:d.value})};
}

export function applyNegativeRehydrationCache(plan:ResumeReadPlan,cache:NegativeRehydrationCache,currentValidityBindingDigest:string,options:OperationOptions):Result<{plan:ResumeReadPlan;cacheHitRefIds:readonly string[]}>{
  const c=cancelled(options);if(c)return c;if(!isSha256(currentValidityBindingDigest))return fail('NEGATIVE_CACHE_BINDING_INVALID','Current negative-cache validity binding must be a semantic digest');const vp=verifyPlan(plan,options);if(!vp.ok)return vp as Result<{plan:ResumeReadPlan;cacheHitRefIds:readonly string[]}>;const vc=verifyNegative(cache,options);if(!vc.ok)return vc as Result<{plan:ResumeReadPlan;cacheHitRefIds:readonly string[]}>;
  const validNegative=new Set(cache.entries.filter(e=>e.validityBindingDigest===currentValidityBindingDigest).map(e=>e.refId));const cacheHitRefIds=sortedUnique(plan.steps.filter(s=>validNegative.has(s.refId)).map(s=>s.refId));
  const steps=plan.steps.filter(s=>!validNegative.has(s.refId));const expansionRequired=plan.expansionRequired||plan.steps.some(s=>s.mandatory&&validNegative.has(s.refId));const semantic={steps,maxReads:plan.maxReads,expansionRequired};const d=sha(options,semantic);if(!d.ok)return d;
  return{ok:true,value:deepFreeze({plan:{...semantic,planDigest:d.value},cacheHitRefIds})};
}
