import type{ActualOutcomeInput,CalibrationBiasSentinel,EstimationPolicy,ForecastIntervalEnvelope,ForecastRevisionReceipt,ForecastVsActualVarianceReceipt,ModelDriftSentinel,OperationOptions,RecalibrationEpoch,Result,RevisionReplayGuard,RobustThroughputEstimator}from'./types.js';
import{Guard,compareRational,createRational,digestValue,fail,isSafeNonNegativeInteger,ok}from'./utils.js';

const SHA=/^sha256:[0-9a-f]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function validId(value:string){return ID.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function validSha(value:string){return SHA.test(value);}

export function createForecastVsActualVarianceReceipt(envelope:ForecastIntervalEnvelope,actual:ActualOutcomeInput,options:OperationOptions):Result<ForecastVsActualVarianceReceipt>{
 if(envelope.availability!=='AVAILABLE'||envelope.lowerDurationMs===null||envelope.baseDurationMs===null||envelope.upperDurationMs===null)return fail('FAV22_FORECAST_UNAVAILABLE','Variance receipt requires an AVAILABLE historical forecast.');
 if(actual.forecastEnvelopeDigest!==envelope.envelopeDigest)return fail('FAV22_FORECAST_MISMATCH','Actual observation does not bind this forecast.');if(!validId(actual.actualId)||!['M43_TELEMETRY','EXTERNAL_CANONICAL'].includes(actual.owner)||!validSha(actual.sourceIdentityDigest)||!isSafeNonNegativeInteger(actual.elapsedMs)||!isSafeNonNegativeInteger(actual.observedAtEpochMs))return fail('FAV22_ACTUAL_INVALID','Actual outcome binding/time is invalid.');
 const outcome:ForecastVsActualVarianceReceipt['outcome']=actual.elapsedMs<envelope.lowerDurationMs?'BELOW_INTERVAL':actual.elapsedMs>envelope.upperDurationMs?'ABOVE_INTERVAL':'WITHIN_INTERVAL';const signedBaseVarianceMs=actual.elapsedMs-envelope.baseDurationMs;if(!Number.isSafeInteger(signedBaseVarianceMs))return fail('FAV22_VARIANCE_OVERFLOW','Actual/base variance exceeds safe integer range.');
 const body={actualId:actual.actualId,actualOwner:actual.owner,forecastEnvelopeDigest:envelope.envelopeDigest,elapsedMs:actual.elapsedMs,observedAtEpochMs:actual.observedAtEpochMs,sourceIdentityDigest:actual.sourceIdentityDigest,outcome,signedBaseVarianceMs};const digest=digestValue(options.digest,'FAV22',body);if(!digest.ok)return digest;return ok({...body,receiptDigest:digest.value});
}

export function detectCalibrationBias(receipts:readonly ForecastVsActualVarianceReceipt[],policy:EstimationPolicy,options:OperationOptions):Result<CalibrationBiasSentinel>{
 const byId=new Map<string,ForecastVsActualVarianceReceipt>();let conflict=false;const guard=new Guard(options);
 for(const receipt of receipts){const step=guard.step('CBS22');if(!step.ok)return step;const prior=byId.get(receipt.actualId);if(prior!==undefined&&prior.receiptDigest!==receipt.receiptDigest){conflict=true;break;}byId.set(receipt.actualId,receipt);}
 const ordered=[...byId.values()].sort((a,b)=>b.observedAtEpochMs-a.observedAtEpochMs||a.actualId.localeCompare(b.actualId)).slice(0,policy.calibrationWindow);const resolvedCount=ordered.length,containedCount=ordered.filter((r)=>r.outcome==='WITHIN_INTERVAL').length;let state:CalibrationBiasSentinel['state']='NONE';const reasons:string[]=[];
 if(conflict){state='CONFLICT';reasons.push('CONFLICTING_ACTUAL_OBSERVATION');}
 else if(resolvedCount>=3){const above=ordered.filter((r)=>r.outcome==='ABOVE_INTERVAL').length,below=ordered.filter((r)=>r.outcome==='BELOW_INTERVAL').length;if(above>=3&&above/resolvedCount>=0.6){state='OPTIMISTIC_BIAS';reasons.push('REPEATED_ABOVE_INTERVAL');}else if(below>=3&&below/resolvedCount>=0.6){state='PESSIMISTIC_BIAS';reasons.push('REPEATED_BELOW_INTERVAL');}else if(resolvedCount>=5&&containedCount*5<resolvedCount*4){state='UNDERCOVERAGE';reasons.push('INTERVAL_UNDERCOVERAGE');}}
 const body={state,resolvedCount,containedCount,reasonCodes:reasons};const digest=digestValue(options.digest,'CBS22',body);if(!digest.ok)return digest;return ok({...body,sentinelDigest:digest.value});
}

export function detectModelDrift(current:RobustThroughputEstimator|null,prior:RobustThroughputEstimator|null,bias:CalibrationBiasSentinel,denominatorEpochChanged:boolean,observationPolicyChanged:boolean,options:OperationOptions):Result<ModelDriftSentinel>{
 const reasons:string[]=[];let state:ModelDriftSentinel['state']='CURRENT';if(bias.state==='CONFLICT'){state='CONFLICT';reasons.push('CALIBRATION_CONFLICT');}
 else{
  if(denominatorEpochChanged)reasons.push('DENOMINATOR_EPOCH_CHANGED');if(observationPolicyChanged)reasons.push('OBSERVATION_POLICY_CHANGED');if(['OPTIMISTIC_BIAS','PESSIMISTIC_BIAS','UNDERCOVERAGE'].includes(bias.state))reasons.push(`CALIBRATION_${bias.state}`);
  if(current!==null&&prior!==null){const twicePrior=createRational(BigInt(prior.q2.numerator)*2n,BigInt(prior.q2.denominator),options,'MDS22_2X_PRIOR');if(!twicePrior.ok)return twicePrior;const twiceCurrent=createRational(BigInt(current.q2.numerator)*2n,BigInt(current.q2.denominator),options,'MDS22_2X_CURRENT');if(!twiceCurrent.ok)return twiceCurrent;if(compareRational(current.q2,twicePrior.value)>0||compareRational(prior.q2,twiceCurrent.value)>0)reasons.push('THROUGHPUT_REGIME_SHIFT');}
  if(reasons.length>0)state='DRIFTED';else if(current===null)state='INDETERMINATE';
 }
 const body={state,reasonCodes:[...new Set(reasons)].sort()};const digest=digestValue(options.digest,'MDS22',body);if(!digest.ok)return digest;return ok({...body,sentinelDigest:digest.value});
}

export function createRecalibrationEpoch(predecessorEpochId:string,newEpochId:string,drift:ModelDriftSentinel,bias:CalibrationBiasSentinel,sampleWindowDigest:string,policyDigest:string,options:OperationOptions):Result<RecalibrationEpoch>{
 if(!validId(predecessorEpochId)||!validId(newEpochId)||predecessorEpochId===newEpochId||!validSha(sampleWindowDigest)||!validSha(policyDigest))return fail('RCE22_BINDING_INVALID','Recalibration epoch bindings are invalid.');if(drift.state!=='DRIFTED'&&bias.state==='NONE')return fail('RCE22_TRIGGER_MISSING','Recalibration requires governed drift/bias trigger.');if(drift.state==='CONFLICT'||bias.state==='CONFLICT')return fail('RCE22_TRIGGER_CONFLICT','Conflicting calibration evidence cannot create a recalibration epoch.');
 const triggerDigests=[drift.sentinelDigest,bias.sentinelDigest].sort();const body={epochId:newEpochId,predecessorEpochId,triggerDigests,sampleWindowDigest,policyDigest};const digest=digestValue(options.digest,'RCE22',body);if(!digest.ok)return digest;return ok({...body,epochDigest:digest.value});
}

export function createForecastRevisionReceipt(revisionId:string,before:ForecastIntervalEnvelope,after:ForecastIntervalEnvelope,reasonCodes:readonly string[],options:OperationOptions):Result<ForecastRevisionReceipt>{
 if(!validId(revisionId)||before.envelopeDigest===after.envelopeDigest||reasonCodes.length===0||reasonCodes.some((r)=>!validId(r)))return fail('FRR22_REVISION_INVALID','Forecast revision identity/reasons are invalid.');const reasons=[...new Set(reasonCodes)].sort();const body={revisionId,beforeEnvelopeDigest:before.envelopeDigest,afterEnvelopeDigest:after.envelopeDigest,reasonCodes:reasons};const digest=digestValue(options.digest,'FRR22',body);if(!digest.ok)return digest;return ok({...body,revisionDigest:digest.value});
}

export function guardRevisionReplay(revisions:readonly ForecastRevisionReceipt[],options:OperationOptions):Result<RevisionReplayGuard>{
 const acceptedRevisionDigests:string[]=[],duplicateRevisionDigests:string[]=[],conflictRevisionIds:string[]=[];const digestSet=new Set<string>(),byId=new Map<string,string>(),guard=new Guard(options);
 for(const revision of revisions){const step=guard.step('RPG22');if(!step.ok)return step;if(digestSet.has(revision.revisionDigest)){duplicateRevisionDigests.push(revision.revisionDigest);continue;}digestSet.add(revision.revisionDigest);const prior=byId.get(revision.revisionId);if(prior!==undefined&&prior!==revision.revisionDigest){conflictRevisionIds.push(revision.revisionId);continue;}byId.set(revision.revisionId,revision.revisionDigest);acceptedRevisionDigests.push(revision.revisionDigest);}
 acceptedRevisionDigests.sort();duplicateRevisionDigests.sort();conflictRevisionIds.sort();const body={acceptedRevisionDigests,duplicateRevisionDigests,conflictRevisionIds};const digest=digestValue(options.digest,'RPG22',body);if(!digest.ok)return digest;return ok({...body,guardDigest:digest.value});
}
