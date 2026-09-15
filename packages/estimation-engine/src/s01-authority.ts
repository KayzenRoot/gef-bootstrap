import type{BaselineSufficiencyGate,EstimationAuthorityBoundary,EstimationBindingManifest,EstimationIntentCapsule,EstimationIntentInput,EstimationPolicy,EstimationPolicyInput,DenominatorEpochCompatibilityWitness,DenominatorEpochCompatibilityWitnessInput,M21EstimationBaselineHandoff,OperationOptions,ProgressBaselineAdmission,ProgressHistoryEntry,Result,TemporalObservation,TemporalObservationAuthorityIndex,TemporalObservationInput}from'./types.js';
import{Guard,digestValue,fail,isSafeNonNegativeInteger,isSafePositiveInteger,ok,stableStringify}from'./utils.js';

const SHA=/^sha256:[0-9a-f]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function validId(value:string):boolean{return ID.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function validSha(value:string):boolean{return SHA.test(value);}

export const M22_MECHANISMS=Object.freeze([
 'EIC22','EAB22','PBA22','OAI22','BSG22','EBM22',
 'TPS22','SNW22','TPW22','RTE22','RWV22','DPK22',
 'FIE22','SCT22','UWR22','RAV22','FPB22','DCF22',
 'FAV22','CBS22','MDS22','RCE22','FRR22','RPG22',
 'ESC22','EIR22','ESD22','ECS22','DMH22','SEH22'
] as const);

export function createEstimationIntentCapsule(input:EstimationIntentInput,options:OperationOptions):Result<EstimationIntentCapsule>{
 if(!validId(input.projectId)||!validSha(input.lineageDigest)||!validSha(input.baselineHandoffDigest))return fail('EIC22_BINDING_INVALID','Estimation intent bindings are invalid.');
 if(input.horizon!=='PROJECT_COMPLETION'||!['FORECAST_INTERVAL','SCENARIOS','HANDOFFS'].includes(input.requestedOutput))return fail('EIC22_OUTPUT_INVALID','Unsupported estimation horizon/output family.');
 if(!isSafeNonNegativeInteger(input.asOfEpochMs))return fail('EIC22_ASOF_INVALID','asOfEpochMs must be an injected safe non-negative integer.');
 const digest=digestValue(options.digest,'EIC22',input);if(!digest.ok)return digest;
 return ok({...input,intentDigest:digest.value});
}

export function createEstimationAuthorityBoundary(intent:EstimationIntentCapsule,options:OperationOptions):Result<EstimationAuthorityBoundary>{
 const body={intentDigest:intent.intentDigest,authority:'ESTIMATION_ONLY' as const,mayCalculateProgress:false as const,mayComputeProjectStatus:false as const,mayDecideEvidence:false as const,mayCollectTelemetry:false as const,productionWeightIsTime:false as const};
 const digest=digestValue(options.digest,'EAB22',body);if(!digest.ok)return digest;
 const{intentDigest:_,...authority}=body;void _;
 return ok({...authority,boundaryDigest:digest.value});
}

function verifyForeignBaselineHandoff(value:M21EstimationBaselineHandoff,options:OperationOptions):Result<boolean>{
 if(value.owner!=='M21_PROGRESS'||value.consumer!=='M22_ESTIMATION'||value.snapshotDigests.length===0||value.snapshotDigests.length!==value.semanticDigests.length)return ok(false);
 if(!value.snapshotDigests.every(validSha)||!value.semanticDigests.every(validSha)||!validSha(value.handoffDigest))return ok(false);
 try{
  if(options.digest.algorithm!=='sha256')return fail('DIGEST_ALGORITHM_INVALID','M22 requires SHA-256.');
  const raw=options.digest.digest(stableStringify({owner:value.owner,consumer:value.consumer,snapshotDigests:value.snapshotDigests,semanticDigests:value.semanticDigests}));
  if(!/^[0-9a-f]{64}$/i.test(raw))return fail('DIGEST_OUTPUT_INVALID','Injected digest capability returned invalid SHA-256.');
  return ok(`sha256:${raw.toLowerCase()}`===value.handoffDigest);
 }catch{return fail('DIGEST_CAPABILITY_FAILED','Could not verify M21 handoff digest.');}
}

export function admitProgressBaseline(handoff:M21EstimationBaselineHandoff,history:readonly ProgressHistoryEntry[],intent:EstimationIntentCapsule,options:OperationOptions,epochCompatibilityInputs:readonly DenominatorEpochCompatibilityWitnessInput[]=[]):Result<ProgressBaselineAdmission>{
 const guard=new Guard(options);const vh=verifyForeignBaselineHandoff(handoff,options);if(!vh.ok)return vh;if(!vh.value)return fail('PBA22_HANDOFF_TAMPERED','M21 estimation baseline handoff failed verification.');
 if(handoff.handoffDigest!==intent.baselineHandoffDigest)return fail('PBA22_INTENT_MISMATCH','Intent does not bind the supplied M21 baseline handoff.');
 if(history.length!==handoff.snapshotDigests.length)return fail('PBA22_HISTORY_CARDINALITY','Progress history must exactly cover the M21 handoff.');
 const witnesses:DenominatorEpochCompatibilityWitness[]=[];const witnessKeys=new Map<string,DenominatorEpochCompatibilityWitness>();
 for(const input of epochCompatibilityInputs){const step=guard.step('PBA22_EPOCH_WITNESS');if(!step.ok)return step;if(input.owner!=='M21_PROGRESS'||!validId(input.witnessId)||!validId(input.projectId)||!validSha(input.lineageDigest)||!validId(input.fromEpochId)||!validId(input.toEpochId)||input.fromEpochId===input.toEpochId||!validSha(input.fromManifestDigest)||!validSha(input.toManifestDigest)||!validSha(input.translationDigest)||!validSha(input.sourceIdentityDigest))return fail('PBA22_EPOCH_WITNESS_INVALID','Denominator epoch compatibility witness is invalid.',input.witnessId);const d=digestValue(options.digest,'PBA22_EPOCH_WITNESS',input);if(!d.ok)return d;const witness={...input,witnessDigest:d.value};const key=`${input.fromEpochId}|${input.fromManifestDigest}->${input.toEpochId}|${input.toManifestDigest}`;if(witnessKeys.has(key))return fail('PBA22_EPOCH_WITNESS_DUPLICATE','Duplicate denominator epoch compatibility witness.',input.witnessId);witnessKeys.set(key,witness);witnesses.push(witness);}
 const sorted=[...history].sort((a,b)=>a.sequence-b.sequence||a.snapshotDigest.localeCompare(b.snapshotDigest));
 let projectId:string|undefined,lineageDigest:string|undefined;const seenSequence=new Set<number>(),seenSnapshot=new Set<string>();
 for(let i=0;i<sorted.length;i+=1){
  const step=guard.step('PBA22');if(!step.ok)return step;const entry=sorted[i];if(entry===undefined)return fail('PBA22_HISTORY_INVALID','Missing progress history entry.');
  if(!validSha(entry.snapshotDigest)||!validSha(entry.semanticDigest)||!validSha(entry.lineageDigest)||!validSha(entry.manifestDigest)||!validId(entry.projectId)||!validId(entry.epochId))return fail('PBA22_ENTRY_BINDING_INVALID','Progress history entry binding is invalid.',entry.snapshotDigest);
  if(!Number.isSafeInteger(entry.sequence)||entry.sequence<0||!isSafeNonNegativeInteger(entry.numerator)||!isSafePositiveInteger(entry.denominator)||entry.numerator>entry.denominator)return fail('PBA22_PROGRESS_INVALID','Progress history fraction/sequence is invalid.',entry.snapshotDigest);
  if(entry.completeness!=='COMPLETE')return fail('PBA22_BASELINE_NOT_COMPLETE','M22 admits only COMPLETE project-level M21 snapshots.',entry.snapshotDigest);
  if(seenSequence.has(entry.sequence)||seenSnapshot.has(entry.snapshotDigest))return fail('PBA22_HISTORY_DUPLICATE','Progress history contains duplicate identity or sequence.',entry.snapshotDigest);
  seenSequence.add(entry.sequence);seenSnapshot.add(entry.snapshotDigest);
  if(i===0){projectId=entry.projectId;lineageDigest=entry.lineageDigest;}
  if(entry.projectId!==projectId||entry.lineageDigest!==lineageDigest)return fail('PBA22_CROSS_LINEAGE','Progress history mixes project/lineage authority.',entry.snapshotDigest);
  if(handoff.snapshotDigests[i]!==entry.snapshotDigest||handoff.semanticDigests[i]!==entry.semanticDigest)return fail('PBA22_HANDOFF_ORDER_MISMATCH','Progress history ordering must match the M21 handoff exactly.',entry.snapshotDigest);
  const prior=i>0?sorted[i-1]:undefined;if(prior!==undefined&&(prior.epochId!==entry.epochId||prior.manifestDigest!==entry.manifestDigest)){const key=`${prior.epochId}|${prior.manifestDigest}->${entry.epochId}|${entry.manifestDigest}`,w=witnessKeys.get(key);if(w===undefined||w.projectId!==entry.projectId||w.lineageDigest!==entry.lineageDigest)return fail('PBA22_EPOCH_CONFLICT','Denominator epoch transition lacks a compatible M21 witness.',entry.snapshotDigest);}
 }
 const current=sorted.at(-1);if(current===undefined||projectId===undefined||lineageDigest===undefined)return fail('PBA22_HISTORY_EMPTY','Progress history is empty.');
 if(intent.projectId!==projectId||intent.lineageDigest!==lineageDigest)return fail('PBA22_INTENT_LINEAGE_MISMATCH','Intent project/lineage differs from M21 baseline.');
 const body={projectId,lineageDigest,epochId:current.epochId,manifestDigest:current.manifestDigest,handoffDigest:handoff.handoffDigest,epochCompatibilityWitnessDigests:witnesses.map(w=>w.witnessDigest).sort(),entries:sorted,currentSnapshotDigest:current.snapshotDigest,currentSemanticDigest:current.semanticDigest,currentNumerator:current.numerator,currentDenominator:current.denominator,currentCompleteness:current.completeness};
 const digest=digestValue(options.digest,'PBA22',body);if(!digest.ok)return digest;
 return ok({...body,admissionDigest:digest.value});
}

export function createTemporalObservationAuthorityIndex(inputs:readonly TemporalObservationInput[],baseline:ProgressBaselineAdmission,options:OperationOptions):Result<TemporalObservationAuthorityIndex>{
 const guard=new Guard(options);const observations:TemporalObservation[]=[];const duplicateObservationIds:string[]=[];const seenIds=new Set<string>();const seenInputs=new Map<string,TemporalObservationInput>();
 for(const input of inputs){
  const step=guard.step('OAI22');if(!step.ok)return step;
  if(!validId(input.observationId)||!['M43_TELEMETRY','EXTERNAL_CANONICAL'].includes(input.owner)||!validSha(input.lineageDigest)||!validSha(input.beforeSnapshotDigest)||!validSha(input.afterSnapshotDigest)||!validSha(input.sourceIdentityDigest))return fail('OAI22_OBSERVATION_INVALID','Temporal observation authority/binding is invalid.',input.observationId);
  if(input.projectId!==baseline.projectId||input.lineageDigest!==baseline.lineageDigest)return fail('OAI22_CROSS_LINEAGE','Temporal observation does not share baseline project/lineage.',input.observationId);
  const before=baseline.entries.find((entry)=>entry.snapshotDigest===input.beforeSnapshotDigest),after=baseline.entries.find((entry)=>entry.snapshotDigest===input.afterSnapshotDigest);if(before===undefined||after===undefined)return fail('OAI22_SNAPSHOT_UNKNOWN','Temporal observation references unknown progress snapshots.',input.observationId);if(before.epochId!==after.epochId||input.epochId!==before.epochId)return fail('OAI22_EPOCH_MISMATCH','Temporal observation must remain within one compatible denominator epoch.',input.observationId);
  if(!isSafePositiveInteger(input.elapsedMs)||!isSafeNonNegativeInteger(input.observedAtEpochMs))return fail('OAI22_TEMPORAL_INVALID','Elapsed/observed time must be safe integer milliseconds.',input.observationId);
  if(seenIds.has(input.observationId)){const prior=seenInputs.get(input.observationId);if(prior===undefined||stableStringify(prior)!==stableStringify(input))return fail('OAI22_DUPLICATE_CONFLICT','Same observation identity was resealed with different content.',input.observationId);duplicateObservationIds.push(input.observationId);continue;}seenIds.add(input.observationId);seenInputs.set(input.observationId,input);
  const digest=digestValue(options.digest,'OAI22_OBSERVATION',input);if(!digest.ok)return digest;observations.push({...input,observationDigest:digest.value});
 }
 observations.sort((a,b)=>a.observedAtEpochMs-b.observedAtEpochMs||a.observationId.localeCompare(b.observationId));
 const body={projectId:baseline.projectId,lineageDigest:baseline.lineageDigest,observations,duplicateObservationIds:[...new Set(duplicateObservationIds)].sort()};
 const digest=digestValue(options.digest,'OAI22',body);if(!digest.ok)return digest;return ok({...body,indexDigest:digest.value});
}

export function createEstimationPolicy(input:EstimationPolicyInput,options:OperationOptions):Result<EstimationPolicy>{
 if(!Number.isSafeInteger(input.maxWindowSamples)||input.maxWindowSamples<3||input.maxWindowSamples>4096)return fail('ESTIMATION_POLICY_WINDOW_INVALID','maxWindowSamples must be 3..4096.');
 if(!isSafePositiveInteger(input.staleAfterMs)||!Number.isSafeInteger(input.calibrationWindow)||input.calibrationWindow<1||input.calibrationWindow>4096||!validId(input.policyVersion))return fail('ESTIMATION_POLICY_INVALID','Estimation policy values are invalid.');
 const body={...input,minIndependentSamples:3 as const};const digest=digestValue(options.digest,'ESTIMATION_POLICY',body);if(!digest.ok)return digest;return ok({...body,policyDigest:digest.value});
}

export function evaluateBaselineSufficiency(baseline:ProgressBaselineAdmission,index:TemporalObservationAuthorityIndex,policy:EstimationPolicy,asOfEpochMs:number,options:OperationOptions):Result<BaselineSufficiencyGate>{
 if(!isSafeNonNegativeInteger(asOfEpochMs))return fail('BSG22_ASOF_INVALID','Injected asOfEpochMs is invalid.');
 let state:BaselineSufficiencyGate['state']='AVAILABLE';const reasons:string[]=[];
 const entries=new Map(baseline.entries.map((entry)=>[entry.snapshotDigest,entry] as const));
 const uniquePairs=new Set<string>();let independent=0;
 for(const observation of index.observations){
  const before=entries.get(observation.beforeSnapshotDigest),after=entries.get(observation.afterSnapshotDigest);
  if(before===undefined||after===undefined){reasons.push('OBSERVATION_SNAPSHOT_UNKNOWN');continue;}
  if(before.sequence>=after.sequence){reasons.push('OBSERVATION_ORDER_INVALID');continue;}
  if(observation.observedAtEpochMs>asOfEpochMs){state='CONFLICT';reasons.push('OBSERVATION_FROM_FUTURE');continue;}
  if(asOfEpochMs-observation.observedAtEpochMs>policy.staleAfterMs){if(state!=='CONFLICT')state='STALE';reasons.push('OBSERVATION_STALE');continue;}
  const key=`${observation.beforeSnapshotDigest}->${observation.afterSnapshotDigest}`;if(uniquePairs.has(key)){reasons.push('DUPLICATE_PROGRESS_PAIR');continue;}uniquePairs.add(key);
  const delta=BigInt(after.numerator)*BigInt(before.denominator)-BigInt(before.numerator)*BigInt(after.denominator);
  if(delta<0n){reasons.push('PROGRESS_REGRESSION_EXCLUDED');continue;}if(delta===0n){reasons.push('ZERO_PROGRESS_EXCLUDED');continue;}independent+=1;
 }
 if(index.duplicateObservationIds.length>0)reasons.push('DUPLICATE_OBSERVATION_ID');
 if(state==='AVAILABLE'&&independent<policy.minIndependentSamples){state='NOT_YET_BASELINED';reasons.push('INSUFFICIENT_INDEPENDENT_SAMPLES');}
 if(state==='AVAILABLE'&&baseline.currentCompleteness!=='COMPLETE'){state='INDETERMINATE';reasons.push('CURRENT_BASELINE_INCOMPLETE');}
 const body={state,independentSampleCount:independent,reasonCodes:[...new Set(reasons)].sort()};const digest=digestValue(options.digest,'BSG22',body);if(!digest.ok)return digest;return ok({...body,gateDigest:digest.value});
}

export function createEstimationBindingManifest(baseline:ProgressBaselineAdmission,index:TemporalObservationAuthorityIndex,policy:EstimationPolicy,riskInputDigest:string|null,calibrationEpochId:string,options:OperationOptions):Result<EstimationBindingManifest>{
 if(riskInputDigest!==null&&!validSha(riskInputDigest))return fail('EBM22_RISK_BINDING_INVALID','Risk input digest must be SHA-256 or null.');if(!validId(calibrationEpochId))return fail('EBM22_CALIBRATION_EPOCH_INVALID','Calibration epoch id is invalid.');
 const body={projectId:baseline.projectId,lineageDigest:baseline.lineageDigest,baselineAdmissionDigest:baseline.admissionDigest,observationIndexDigest:index.indexDigest,denominatorEpochId:baseline.epochId,policyDigest:policy.policyDigest,riskInputDigest,calibrationEpochId};
 const digest=digestValue(options.digest,'EBM22',body);if(!digest.ok)return digest;return ok({...body,manifestDigest:digest.value});
}
