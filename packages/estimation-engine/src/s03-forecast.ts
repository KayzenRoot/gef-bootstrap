import type{BaselineSufficiencyGate,DeadlineComparison,DurationProjection,EstimationPolicy,FalsePrecisionDecision,ForecastIntervalEnvelope,OperationOptions,RiskAdjustmentVector,RiskModifierInput,RobustThroughputEstimator,ScenarioProjection,ScenarioTriad,Result,UnknownWorkReserve,UnknownWorkReserveInput}from'./types.js';
import{Guard,addSafeIntegers,compareRational,createRational,digestValue,exactDurationMs,fail,isSafeNonNegativeInteger,isSafePositiveInteger,ok}from'./utils.js';

const SHA=/^sha256:[0-9a-f]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function validId(value:string){return ID.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function validSha(value:string){return SHA.test(value);}
const RISK_OWNERS=['M43_TELEMETRY','M45_BENCHMARK','M63_EXECUTOR_PERFORMANCE','EXTERNAL_CANONICAL'] as const;

export function createUnknownWorkReserve(input:UnknownWorkReserveInput,projectId:string,lineageDigest:string,options:OperationOptions):Result<UnknownWorkReserve>{
 if(input.projectId!==projectId||input.lineageDigest!==lineageDigest)return fail('UWR22_LINEAGE_MISMATCH','Unknown-work reserve does not bind current project/lineage.');
 if(!validId(input.reserveId)||!RISK_OWNERS.includes(input.owner)||!validSha(input.lineageDigest)||!validSha(input.sourceIdentityDigest)||!validId(input.rationaleCode))return fail('UWR22_BINDING_INVALID','Unknown-work reserve binding/owner is invalid.');
 if(!isSafeNonNegativeInteger(input.numerator)||!isSafePositiveInteger(input.denominator)||input.numerator>input.denominator)return fail('UWR22_RESERVE_INVALID','Reserve fraction must be within 0..1 using safe integers.');
 const reserve=createRational(BigInt(input.numerator),BigInt(input.denominator),options,'UWR22_RATIONAL');if(!reserve.ok)return reserve;const body={...input,reserve:reserve.value};const digest=digestValue(options.digest,'UWR22',body);if(!digest.ok)return digest;return ok({...body,reserveDigest:digest.value});
}

export function createRiskAdjustmentVector(inputs:readonly RiskModifierInput[],projectId:string,lineageDigest:string,policy:EstimationPolicy,options:OperationOptions):Result<RiskAdjustmentVector>{
 const seen=new Set<string>(),modifiers:RiskModifierInput[]=[],guard=new Guard(options);
 for(const input of inputs){const step=guard.step('RAV22');if(!step.ok)return step;
  if(input.projectId!==projectId||input.lineageDigest!==lineageDigest)return fail('RAV22_LINEAGE_MISMATCH','Risk modifier does not bind current project/lineage.',input.modifierId);
  if(!validId(input.modifierId)||!RISK_OWNERS.includes(input.owner)||!validSha(input.lineageDigest)||!validSha(input.sourceIdentityDigest)||!isSafeNonNegativeInteger(input.baseAddedMs)||!isSafeNonNegativeInteger(input.conservativeAddedMs)||input.conservativeAddedMs<input.baseAddedMs)return fail('RAV22_MODIFIER_INVALID','Risk modifier is invalid.',input.modifierId);
  if(seen.has(input.modifierId))return fail('RAV22_DUPLICATE_MODIFIER','Duplicate risk modifier identity.',input.modifierId);seen.add(input.modifierId);modifiers.push(input);
 }
 modifiers.sort((a,b)=>a.modifierId.localeCompare(b.modifierId));const body={modifiers,missingRequired:policy.requireRiskInputs&&modifiers.length===0};const digest=digestValue(options.digest,'RAV22',body);if(!digest.ok)return digest;return ok({...body,vectorDigest:digest.value});
}

function sumRisk(risk:RiskAdjustmentVector,key:'baseAddedMs'|'conservativeAddedMs'):Result<number>{let total=0;for(const item of risk.modifiers){const next=addSafeIntegers(total,item[key]);if(!next.ok)return next;total=next.value;}return ok(total);}

export function createForecastIntervalEnvelope(duration:DurationProjection,reserve:UnknownWorkReserve|null,model:RobustThroughputEstimator|null,risk:RiskAdjustmentVector,asOfEpochMs:number,options:OperationOptions):Result<ForecastIntervalEnvelope>{
 if(!isSafeNonNegativeInteger(asOfEpochMs))return fail('FIE22_ASOF_INVALID','Injected asOfEpochMs is invalid.');
 if(duration.availability!=='AVAILABLE'||duration.lowerMs===null||duration.baseMs===null||duration.upperMs===null){const body={availability:duration.availability,asOfEpochMs,lowerDurationMs:null,baseDurationMs:null,upperDurationMs:null,lowerCompletionEpochMs:null,baseCompletionEpochMs:null,upperCompletionEpochMs:null};const digest=digestValue(options.digest,'FIE22',body);if(!digest.ok)return digest;return ok({...body,envelopeDigest:digest.value});}
 if(risk.missingRequired){const body={availability:'INDETERMINATE' as const,asOfEpochMs,lowerDurationMs:null,baseDurationMs:null,upperDurationMs:null,lowerCompletionEpochMs:null,baseCompletionEpochMs:null,upperCompletionEpochMs:null};const digest=digestValue(options.digest,'FIE22',body);if(!digest.ok)return digest;return ok({...body,envelopeDigest:digest.value});}
 const baseRisk=sumRisk(risk,'baseAddedMs'),conservativeRisk=sumRisk(risk,'conservativeAddedMs');if(!baseRisk.ok)return baseRisk;if(!conservativeRisk.ok)return conservativeRisk;
 let reserveMs=0;if(reserve!==null){if(model===null)return fail('FIE22_RESERVE_MODEL_MISSING','Unknown-work reserve requires an admitted throughput model.');const projected=exactDurationMs(reserve.reserve,model.q1);if(!projected.ok)return projected;reserveMs=projected.value;}
 const base=addSafeIntegers(duration.baseMs,baseRisk.value),upperRisk=addSafeIntegers(conservativeRisk.value,reserveMs);if(!base.ok)return base;if(!upperRisk.ok)return upperRisk;const upper=addSafeIntegers(duration.upperMs,upperRisk.value);if(!upper.ok)return upper;
 const lower=duration.lowerMs;if(!(lower<=base.value&&base.value<=upper.value))return fail('FIE22_INTERVAL_INVERTED','Forecast interval ordering is invalid.');
 const lowerCompletion=addSafeIntegers(asOfEpochMs,lower),baseCompletion=addSafeIntegers(asOfEpochMs,base.value),upperCompletion=addSafeIntegers(asOfEpochMs,upper.value);if(!lowerCompletion.ok)return lowerCompletion;if(!baseCompletion.ok)return baseCompletion;if(!upperCompletion.ok)return upperCompletion;
 const body={availability:'AVAILABLE' as const,asOfEpochMs,lowerDurationMs:lower,baseDurationMs:base.value,upperDurationMs:upper.value,lowerCompletionEpochMs:lowerCompletion.value,baseCompletionEpochMs:baseCompletion.value,upperCompletionEpochMs:upperCompletion.value};const digest=digestValue(options.digest,'FIE22',body);if(!digest.ok)return digest;return ok({...body,envelopeDigest:digest.value});
}

export function createScenarioTriad(envelope:ForecastIntervalEnvelope,options:OperationOptions):Result<ScenarioTriad>{
 if(envelope.availability!=='AVAILABLE'||envelope.lowerDurationMs===null||envelope.baseDurationMs===null||envelope.upperDurationMs===null||envelope.lowerCompletionEpochMs===null||envelope.baseCompletionEpochMs===null||envelope.upperCompletionEpochMs===null){const body={availability:envelope.availability,scenarios:[] as readonly ScenarioProjection[]};const digest=digestValue(options.digest,'SCT22',body);if(!digest.ok)return digest;return ok({...body,triadDigest:digest.value});}
 const values=[['OPTIMISTIC',envelope.lowerDurationMs,envelope.lowerCompletionEpochMs],['BASE',envelope.baseDurationMs,envelope.baseCompletionEpochMs],['CONSERVATIVE',envelope.upperDurationMs,envelope.upperCompletionEpochMs]] as const;const scenarios:ScenarioProjection[]=[];
 for(const[label,durationMs,completionEpochMs]of values){const core={label,durationMs,completionEpochMs};const digest=digestValue(options.digest,'SCT22_SCENARIO',core);if(!digest.ok)return digest;scenarios.push({...core,scenarioDigest:digest.value});}
 const body={availability:'AVAILABLE' as const,scenarios};const digest=digestValue(options.digest,'SCT22',body);if(!digest.ok)return digest;return ok({...body,triadDigest:digest.value});
}

export function applyFalsePrecisionBlocker(sufficiency:BaselineSufficiencyGate,model:RobustThroughputEstimator|null,options:OperationOptions):Result<FalsePrecisionDecision>{
 const reasons:string[]=[];if(sufficiency.state!=='AVAILABLE')reasons.push('ESTIMATION_NOT_AVAILABLE');if(model===null)reasons.push('MODEL_UNAVAILABLE');
 if(model!==null){if(model.sampleCount<5)reasons.push('SPARSE_SAMPLE_WINDOW');const twiceQ1=createRational(BigInt(model.q1.numerator)*2n,BigInt(model.q1.denominator),options,'FPB22_2X_Q1');if(!twiceQ1.ok)return twiceQ1;if(compareRational(model.q3,twiceQ1.value)>0)reasons.push('HIGH_DISPERSION');}
 const body={scalarEtaAllowed:reasons.length===0,reasonCodes:[...new Set(reasons)].sort()};const digest=digestValue(options.digest,'FPB22',body);if(!digest.ok)return digest;return ok({...body,decisionDigest:digest.value});
}

export function compareDeadline(envelope:ForecastIntervalEnvelope,deadlineEpochMs:number,options:OperationOptions):Result<DeadlineComparison>{
 if(!isSafeNonNegativeInteger(deadlineEpochMs))return fail('DCF22_DEADLINE_INVALID','Deadline must be an explicit safe integer epoch millisecond value.');if(envelope.availability!=='AVAILABLE'||envelope.lowerCompletionEpochMs===null||envelope.baseCompletionEpochMs===null||envelope.upperCompletionEpochMs===null)return fail('DCF22_FORECAST_UNAVAILABLE','Deadline comparison requires an AVAILABLE forecast.');
 const lowerDeltaMs=deadlineEpochMs-envelope.lowerCompletionEpochMs,baseDeltaMs=deadlineEpochMs-envelope.baseCompletionEpochMs,upperDeltaMs=deadlineEpochMs-envelope.upperCompletionEpochMs;if(![lowerDeltaMs,baseDeltaMs,upperDeltaMs].every(Number.isSafeInteger))return fail('DCF22_DELTA_OVERFLOW','Deadline comparison overflowed safe integer range.');
 const body={deadlineEpochMs,lowerDeltaMs,baseDeltaMs,upperDeltaMs,forecastEnvelopeDigest:envelope.envelopeDigest};const digest=digestValue(options.digest,'DCF22',body);if(!digest.ok)return digest;return ok({...body,comparisonDigest:digest.value});
}
