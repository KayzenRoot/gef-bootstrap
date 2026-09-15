import type{BaselineSufficiencyGate,DurationProjection,EstimationPolicy,OperationOptions,ProgressBaselineAdmission,ProgressRegressionEvent,RemainingWorkVector,Result,RobustThroughputEstimator,SampleExclusion,SampleNormalizationWitness,TemporalObservationAuthorityIndex,TemporalProgressSample,ThroughputWindow}from'./types.js';
import{Guard,compareRational,createRational,digestValue,exactDurationMs,fail,isSafeNonNegativeInteger,ok,parseRational,subtractFractions}from'./utils.js';

export function normalizeTemporalSamples(baseline:ProgressBaselineAdmission,index:TemporalObservationAuthorityIndex,policy:EstimationPolicy,asOfEpochMs:number,options:OperationOptions):Result<SampleNormalizationWitness>{
 if(!isSafeNonNegativeInteger(asOfEpochMs))return fail('SNW22_ASOF_INVALID','asOfEpochMs must be injected safe integer milliseconds.');
 const guard=new Guard(options),entries=new Map(baseline.entries.map((entry)=>[entry.snapshotDigest,entry] as const));
 const acceptedSamples:TemporalProgressSample[]=[],exclusions:SampleExclusion[]=[],regressions:ProgressRegressionEvent[]=[];const seenPairs=new Set<string>();
 const exclude=(observationId:string,observationDigest:string,reason:SampleExclusion['reason']):Result<true>=>{const core={observationId,observationDigest,reason};const d=digestValue(options.digest,'SNW22_EXCLUSION',core);if(!d.ok)return d;exclusions.push({...core,exclusionDigest:d.value});return ok(true);};
 for(const observation of index.observations){
  const step=guard.step('SNW22');if(!step.ok)return step;
  const before=entries.get(observation.beforeSnapshotDigest),after=entries.get(observation.afterSnapshotDigest);
  if(before===undefined||after===undefined){const x=exclude(observation.observationId,observation.observationDigest,'INVALID_BINDING');if(!x.ok)return x;continue;}
  if(before.sequence>=after.sequence){const x=exclude(observation.observationId,observation.observationDigest,'INVALID_BINDING');if(!x.ok)return x;continue;}
  if(before.epochId!==after.epochId||before.epochId!==observation.epochId){const x=exclude(observation.observationId,observation.observationDigest,'EPOCH_MISMATCH');if(!x.ok)return x;continue;}
  if(observation.observedAtEpochMs>asOfEpochMs||asOfEpochMs-observation.observedAtEpochMs>policy.staleAfterMs){const x=exclude(observation.observationId,observation.observationDigest,'STALE');if(!x.ok)return x;continue;}
  const pair=`${before.snapshotDigest}->${after.snapshotDigest}`;if(seenPairs.has(pair)){const x=exclude(observation.observationId,observation.observationDigest,'REPLAY');if(!x.ok)return x;continue;}seenPairs.add(pair);
  const delta=subtractFractions(after.numerator,after.denominator,before.numerator,before.denominator,options,'TPS22_WORK_DELTA');if(!delta.ok)return delta;const parts=parseRational(delta.value);
  if(parts.numerator<0n){
   const magnitude=createRational(-parts.numerator,parts.denominator,options,'TPS22_REGRESSION_DELTA');if(!magnitude.ok)return magnitude;
   const core={observationId:observation.observationId,beforeSnapshotDigest:before.snapshotDigest,afterSnapshotDigest:after.snapshotDigest,regressionDelta:magnitude.value};const d=digestValue(options.digest,'TPS22_REGRESSION',core);if(!d.ok)return d;regressions.push({...core,eventDigest:d.value});
   const x=exclude(observation.observationId,observation.observationDigest,'PROGRESS_REGRESSION');if(!x.ok)return x;continue;
  }
  if(parts.numerator===0n){const x=exclude(observation.observationId,observation.observationDigest,'ZERO_PROGRESS');if(!x.ok)return x;continue;}
  const throughput=createRational(parts.numerator,parts.denominator*BigInt(observation.elapsedMs),options,'TPS22_THROUGHPUT');if(!throughput.ok)return throughput;
  const core={observationDigest:observation.observationDigest,observationId:observation.observationId,elapsedMs:observation.elapsedMs,workDelta:delta.value,throughput:throughput.value,observedAtEpochMs:observation.observedAtEpochMs};const d=digestValue(options.digest,'TPS22',core);if(!d.ok)return d;acceptedSamples.push({...core,sampleDigest:d.value});
 }
 acceptedSamples.sort((a,b)=>a.observedAtEpochMs-b.observedAtEpochMs||a.observationId.localeCompare(b.observationId));
 exclusions.sort((a,b)=>a.observationId.localeCompare(b.observationId)||a.reason.localeCompare(b.reason));regressions.sort((a,b)=>a.observationId.localeCompare(b.observationId));
 const body={acceptedSamples,exclusions,regressions};const digest=digestValue(options.digest,'SNW22',body);if(!digest.ok)return digest;return ok({...body,witnessDigest:digest.value});
}

export function createThroughputWindow(witness:SampleNormalizationWitness,policy:EstimationPolicy,options:OperationOptions):Result<ThroughputWindow>{
 const guard=new Guard(options);for(const sample of witness.acceptedSamples){const step=guard.step('TPW22');if(!step.ok)return step;void sample;}
 const ordered=[...witness.acceptedSamples].sort((a,b)=>a.observedAtEpochMs-b.observedAtEpochMs||a.observationId.localeCompare(b.observationId));const selected=ordered.slice(Math.max(0,ordered.length-policy.maxWindowSamples));const selectedSet=new Set(selected.map((s)=>s.sampleDigest));const excludedSampleDigests=ordered.filter((s)=>!selectedSet.has(s.sampleDigest)).map((s)=>s.sampleDigest).sort();
 const body={samples:selected,excludedSampleDigests,maxWindowSamples:policy.maxWindowSamples};const digest=digestValue(options.digest,'TPW22',body);if(!digest.ok)return digest;return ok({...body,windowDigest:digest.value});
}

function nearestRank(sorted:readonly TemporalProgressSample[],numerator:number,denominator:number):TemporalProgressSample|undefined{
 if(sorted.length===0)return undefined;const rank=Math.ceil(sorted.length*numerator/denominator);return sorted[Math.max(0,rank-1)];
}
export function createRobustThroughputEstimator(window:ThroughputWindow,options:OperationOptions):Result<RobustThroughputEstimator>{
 if(window.samples.length<3)return fail('RTE22_INSUFFICIENT_SAMPLES','Robust throughput model requires at least three accepted samples.');
 const sorted=[...window.samples].sort((a,b)=>compareRational(a.throughput,b.throughput)||a.sampleDigest.localeCompare(b.sampleDigest));const q1s=nearestRank(sorted,1,4),q2s=nearestRank(sorted,1,2),q3s=nearestRank(sorted,3,4);if(q1s===undefined||q2s===undefined||q3s===undefined)return fail('RTE22_QUANTILE_FAILED','Could not derive deterministic throughput quantiles.');
 const body={q1:q1s.throughput,q2:q2s.throughput,q3:q3s.throughput,sampleCount:window.samples.length};const digest=digestValue(options.digest,'RTE22',body);if(!digest.ok)return digest;return ok({...body,modelDigest:digest.value});
}

export function createRemainingWorkVector(baseline:ProgressBaselineAdmission,options:OperationOptions):Result<RemainingWorkVector>{
 const remainingNumerator=BigInt(baseline.currentDenominator)-BigInt(baseline.currentNumerator);if(remainingNumerator<0n)return fail('RWV22_PROGRESS_INVALID','Current progress exceeds denominator.');const remaining=createRational(remainingNumerator,BigInt(baseline.currentDenominator),options,'RWV22_REMAINING');if(!remaining.ok)return remaining;
 const complete=baseline.currentCompleteness==='COMPLETE'&&remainingNumerator===0n;const body={snapshotDigest:baseline.currentSnapshotDigest,epochId:baseline.epochId,remaining:remaining.value,complete};const digest=digestValue(options.digest,'RWV22',body);if(!digest.ok)return digest;return ok({...body,vectorDigest:digest.value});
}

export function projectDuration(remaining:RemainingWorkVector,model:RobustThroughputEstimator|null,sufficiency:BaselineSufficiencyGate,options:OperationOptions):Result<DurationProjection>{
 if(remaining.complete){const body={availability:'AVAILABLE' as const,lowerMs:0,baseMs:0,upperMs:0,modelDigest:model?.modelDigest??null};const digest=digestValue(options.digest,'DPK22',body);if(!digest.ok)return digest;return ok({...body,projectionDigest:digest.value});}
 if(sufficiency.state!=='AVAILABLE'||model===null){const body={availability:sufficiency.state,lowerMs:null,baseMs:null,upperMs:null,modelDigest:model?.modelDigest??null};const digest=digestValue(options.digest,'DPK22',body);if(!digest.ok)return digest;return ok({...body,projectionDigest:digest.value});}
 const lower=exactDurationMs(remaining.remaining,model.q3),base=exactDurationMs(remaining.remaining,model.q2),upper=exactDurationMs(remaining.remaining,model.q1);if(!lower.ok)return lower;if(!base.ok)return base;if(!upper.ok)return upper;
 if(!(lower.value<=base.value&&base.value<=upper.value))return fail('DPK22_INTERVAL_INVERTED','Exact duration projection produced an invalid interval.');
 const body={availability:'AVAILABLE' as const,lowerMs:lower.value,baseMs:base.value,upperMs:upper.value,modelDigest:model.modelDigest};const digest=digestValue(options.digest,'DPK22',body);if(!digest.ok)return digest;return ok({...body,projectionDigest:digest.value});
}
