import type { CanonicalContinuationCapsule, CheckpointPortabilityEnvelope, CheckpointSizeAssessment, ColdHistoryEvictionMap, ContinuationMinimumSufficientState, HistoricalPointer, HistoricalPointerCompaction, OperationOptions, Result } from './types.js';
import { bounded, cancelled, compareCodePoint, deepFreeze, sha, sortedUnique } from './utils.js';

export function buildContinuationMinimumSufficientState(capsule:CanonicalContinuationCapsule,options:OperationOptions):Result<ContinuationMinimumSufficientState>{
  const c=cancelled(options);if(c)return c;
  const active=capsule.claims.filter(x=>x.status!=='STALE'&&x.status!=='QUARANTINED');
  const requiredBindingIds=sortedUnique([...capsule.authorityBindings.filter(b=>b.required).map(b=>b.bindingId),...active.flatMap(x=>x.authorityBindingIds)]);
  const evidenceRefs=sortedUnique([...capsule.evidenceRefs,...active.flatMap(x=>x.evidenceRefs)]);
  const semantic={projectId:capsule.projectId,moduleId:capsule.moduleId,stageId:capsule.stageId,checkpointDigest:capsule.checkpointDigest,nextLegalAction:capsule.nextLegalAction,activeClaimIds:sortedUnique(active.map(x=>x.claimId)),requiredAuthorityBindingIds:requiredBindingIds,evidenceRefs,blockerRefs:sortedUnique(capsule.blockers)};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,stateDigest:d.value})};
}

export function compactHistoricalPointers(pointers:readonly HistoricalPointer[],requiredCheckpointDigests:readonly string[],options:OperationOptions):Result<HistoricalPointerCompaction>{
  const required=new Set(requiredCheckpointDigests);const seen=new Set<string>();const kept:HistoricalPointer[]=[];
  for(const p of [...pointers].sort((a,b)=>compareCodePoint(`${a.checkpointDigest}:${a.relation}`,`${b.checkpointDigest}:${b.relation}`))){const key=`${p.checkpointDigest}:${p.relation}`;if(seen.has(key))continue;seen.add(key);if(p.relation==='PREDECESSOR'||p.relation==='ROLLBACK_SOURCE'||p.relation==='EVIDENCE'||required.has(p.checkpointDigest))kept.push(p);}
  const d=sha(options,kept);if(!d.ok)return d;return{ok:true,value:deepFreeze({pointers:kept,compactionDigest:d.value})};
}

export function buildCheckpointPortabilityEnvelope(capsule:CanonicalContinuationCapsule,availableCapabilities:readonly string[],options:OperationOptions):Result<CheckpointPortabilityEnvelope>{
  const available=new Set(availableCapabilities);const unsupported=sortedUnique(capsule.requiredCapabilities.filter(c=>!available.has(c)));
  const semantic={schemaVersion:1 as const,projectId:capsule.projectId,lineageId:capsule.lineageId,checkpointDigest:capsule.checkpointDigest,requiredCapabilities:sortedUnique(capsule.requiredCapabilities),unsupportedCapabilities:unsupported};
  const d=sha(options,semantic);if(!d.ok)return d;return{ok:true,value:deepFreeze({...semantic,envelopeDigest:d.value})};
}

export function buildColdHistoryEvictionMap(entries:readonly {checkpointDigest:string;retainedByRefs:readonly string[]}[],options:OperationOptions):Result<ColdHistoryEvictionMap>{
  const normalized=[...entries].map(e=>({checkpointDigest:e.checkpointDigest,retainedByRefs:sortedUnique(e.retainedByRefs)})).sort((a,b)=>compareCodePoint(a.checkpointDigest,b.checkpointDigest));const d=sha(options,normalized);if(!d.ok)return d;return{ok:true,value:deepFreeze({entries:normalized,mapDigest:d.value})};
}

export function assessCheckpointSize(capsule:CanonicalContinuationCapsule,options:OperationOptions):CheckpointSizeAssessment{
  const nodes=capsule.claims.length+capsule.authorityBindings.length+capsule.stateVector.entries.length;
  const refs=capsule.admittedWorkOrderIds.length+capsule.evidenceRefs.length+capsule.blockers.length+capsule.requiredCapabilities.length+capsule.claims.reduce((n,c)=>n+c.dependencyKeys.length+c.authorityBindingIds.length+c.evidenceRefs.length,0);
  return deepFreeze(bounded(options,nodes,refs));
}
