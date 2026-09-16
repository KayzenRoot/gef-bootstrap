import type{DownstreamProofHandoff}from'@gef-bootstrap/proof-graph';
import type{AuthorityConsistencyGate,DependencyProjection,MixAndMatchWitness,OperationOptions,ProofBindingGate,Result,ReviewSourceProjection,SourceBindingGate,SourceCoverageManifest,SourceGapWitness,CoverageState}from'./types.js';
import{compareCodePoint,deepFreeze,digestValue,fail,ok,sortedUnique,validId,isSha256}from'./utils.js';

function coverageValid(v:CoverageState){return['COMPLETE','PARTIAL','CONFLICT','INDETERMINATE'].includes(v);}
export function createSourceCoverageManifest(projectId:string,lineageId:string,baseline:readonly ReviewSourceProjection[],candidate:readonly ReviewSourceProjection[],baselineCoverage:CoverageState,candidateCoverage:CoverageState,dependencyKnowledgeComplete:boolean,options:OperationOptions):Result<SourceCoverageManifest>{
 if(!validId(projectId)||!validId(lineageId)||!coverageValid(baselineCoverage)||!coverageValid(candidateCoverage))return fail('SCM26_INPUT_INVALID','Source coverage manifest identity/state is invalid.');
 for(const p of [...baseline,...candidate])if(p.projectId!==projectId||p.lineageId!==lineageId)return fail('SCM26_LINEAGE_MIX','Source projection belongs to another project/lineage.',p.subjectId);
 const body={projectId,lineageId,baselineCoverage,candidateCoverage,baselineProjectionDigests:sortedUnique(baseline.map(x=>x.projectionDigest)),candidateProjectionDigests:sortedUnique(candidate.map(x=>x.projectionDigest)),dependencyKnowledgeComplete};const d=digestValue(options,'SCM26',body);return d.ok?ok(deepFreeze({...body,manifestDigest:d.value})):d;
}

export function createSourceBindingGate(projections:readonly ReviewSourceProjection[],currentValidity:readonly {readonly subjectId:string;readonly validityBindingDigest:string}[],options:OperationOptions):Result<SourceBindingGate>{
 const current=new Map<string,string>();const conflicts=new Set<string>();
 for(const row of currentValidity){if(!validId(row.subjectId)||!isSha256(row.validityBindingDigest))return fail('SBG26_CURRENT_INVALID','Current validity binding is invalid.',row.subjectId);const e=current.get(row.subjectId);if(e&&e!==row.validityBindingDigest)conflicts.add(row.subjectId);else current.set(row.subjectId,row.validityBindingDigest);}
 const seen=new Map<string,string>(),stale=new Set<string>();
 for(const p of projections){const prior=seen.get(p.subjectId);if(prior&&prior!==p.projectionDigest)conflicts.add(p.subjectId);else seen.set(p.subjectId,p.projectionDigest);const c=current.get(p.subjectId);if(c===undefined||c!==p.validityBindingDigest)stale.add(p.subjectId);}
 const body={valid:conflicts.size===0&&stale.size===0,conflictingSubjectIds:sortedUnique([...conflicts]),staleSubjectIds:sortedUnique([...stale])};const d=digestValue(options,'SBG26',body);return d.ok?ok(deepFreeze({...body,gateDigest:d.value})):d;
}

export function createAuthorityConsistencyGate(projections:readonly ReviewSourceProjection[],options:OperationOptions):Result<AuthorityConsistencyGate>{
 const bySubject=new Map<string,{ownerId:string;sourceId:string}>(),conflicts=new Set<string>();
 for(const p of projections){const e=bySubject.get(p.subjectId);if(e&&(e.ownerId!==p.ownerId||e.sourceId!==p.sourceId))conflicts.add(p.subjectId);else if(!e)bySubject.set(p.subjectId,{ownerId:p.ownerId,sourceId:p.sourceId});}
 const body={valid:conflicts.size===0,conflictingSubjectIds:sortedUnique([...conflicts])};const d=digestValue(options,'ACG26',body);return d.ok?ok(deepFreeze({...body,gateDigest:d.value})):d;
}

export function createDependencyProjection(projections:readonly ReviewSourceProjection[],complete:boolean,options:OperationOptions):Result<DependencyProjection>{
 const map=new Map<string,Set<string>>();for(const p of projections)for(const dep of p.dependencyDigests){const set=map.get(dep)??new Set<string>();set.add(p.subjectId);map.set(dep,set);}
 const reverseEdges=[...map.entries()].map(([dependencyDigest,set])=>({dependencyDigest,subjectIds:sortedUnique([...set])})).sort((a,b)=>compareCodePoint(a.dependencyDigest,b.dependencyDigest));const body={reverseEdges,complete};const d=digestValue(options,'DPG26',body);return d.ok?ok(deepFreeze({...body,projectionDigest:d.value})):d;
}

export function verifyM25ProofHandoff(handoff:DownstreamProofHandoff|null,options:OperationOptions):Result<ProofBindingGate>{
 if(handoff===null){const body={valid:true,snapshotDigest:null,invalidationVectorDigest:null,unresolvedClaimIds:[]as string[]};const d=digestValue(options,'PBG26',body);return d.ok?ok(deepFreeze({...body,gateDigest:d.value})):d;}
 if(handoff.owner!=='M25_PROOF'||handoff.consumer!=='M26_DELTA_REVIEW')return fail('PBG26_OWNER_CONSUMER_INVALID','M25 proof handoff owner/consumer is invalid.');
 const base={owner:handoff.owner,consumer:handoff.consumer,snapshotDigest:handoff.snapshotDigest,proofStates:[...handoff.proofStates].sort((a,b)=>compareCodePoint(a.claimId,b.claimId)),selectedSupportIds:sortedUnique(handoff.selectedSupportIds),proofFingerprintDigests:sortedUnique(handoff.proofFingerprintDigests),invalidationVectorDigest:handoff.invalidationVectorDigest,unresolvedClaimIds:sortedUnique(handoff.unresolvedClaimIds),mayPerformDeltaReview:false as const,mayDecideAssurance:false as const,mayMutateDod:false as const,mayCalculateProgress:false as const,mayPromoteCheckpoint:false as const};
 const expected=digestValue(options,'DPH25',base);if(!expected.ok)return expected;const valid=expected.value===handoff.handoffDigest;
 const body={valid,snapshotDigest:valid?handoff.snapshotDigest:null,invalidationVectorDigest:valid?handoff.invalidationVectorDigest:null,unresolvedClaimIds:valid?sortedUnique(handoff.unresolvedClaimIds):[]};const d=digestValue(options,'PBG26',body);return d.ok?ok(deepFreeze({...body,gateDigest:d.value})):d;
}

export function createSourceGapWitness(missingSubjectIds:readonly string[],bindingGate:SourceBindingGate,authorityGate:AuthorityConsistencyGate,manifest:SourceCoverageManifest,options:OperationOptions):Result<SourceGapWitness>{
 const body={missingSubjectIds:sortedUnique(missingSubjectIds),staleSubjectIds:bindingGate.staleSubjectIds,conflictingSubjectIds:sortedUnique([...bindingGate.conflictingSubjectIds,...authorityGate.conflictingSubjectIds]),incompleteCoverage:manifest.baselineCoverage!=='COMPLETE'||manifest.candidateCoverage!=='COMPLETE',incompleteDependencies:!manifest.dependencyKnowledgeComplete};const d=digestValue(options,'SGW26',body);return d.ok?ok(deepFreeze({...body,witnessDigest:d.value})):d;
}

export function createMixAndMatchWitness(projectMismatch:boolean,lineageMismatch:boolean,baselineCandidateMismatch:boolean,options:OperationOptions):Result<MixAndMatchWitness>{
 const mixed=projectMismatch||lineageMismatch||baselineCandidateMismatch;const body={projectMismatch,lineageMismatch,baselineCandidateMismatch,mixed};const d=digestValue(options,'MMW26',body);return d.ok?ok(deepFreeze({...body,witnessDigest:d.value})):d;
}
