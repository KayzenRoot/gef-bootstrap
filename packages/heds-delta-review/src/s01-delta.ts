import type{DeltaChangeInventory,HedsAuthorityBoundary,HedsIntentCapsule,HedsIntentInput,OperationOptions,Result,ReviewSourceInput,ReviewSourceProjection,SemanticDeltaEntry,SemanticStateIdentity,CrossLineageWitness}from'./types.js';
import{allSha,compareCodePoint,deepFreeze,digestValue,fail,ok,sortedUnique,validId}from'./utils.js';

function uniqueValid(values:readonly string[]){return values.length===new Set(values).size&&values.every(validId);}

export function createHedsIntent(input:HedsIntentInput,options:OperationOptions):Result<HedsIntentCapsule>{
 if(![input.intentId,input.projectId,input.lineageId,input.baselineId,input.candidateId].every(validId)||!validId(input.purpose))return fail('HIC26_ID_INVALID','HEDS intent identifiers are invalid.');
 if(!/^sha256:[0-9a-f]{64}$/.test(input.reviewPolicyDigest)||!uniqueValid(input.requestedSubjectIds))return fail('HIC26_BINDING_INVALID','HEDS intent policy or requested subjects are invalid.');
 const body={...input,requestedSubjectIds:sortedUnique(input.requestedSubjectIds)};const d=digestValue(options,'HIC26',body);return d.ok?ok(deepFreeze({...body,intentDigest:d.value})):d;
}

export function createHedsAuthorityBoundary(intent:HedsIntentCapsule,options:OperationOptions):Result<HedsAuthorityBoundary>{
 const body={intentDigest:intent.intentDigest,authority:'SEMANTIC_DELTA_REVIEW_ONLY' as const,mayValidateEvidence:false as const,mayDecideProof:false as const,mayDecideAssurance:false as const,maySelectTests:false as const,mayOperateGit:false as const,mayPromoteCheckpoint:false as const,mayCalculateProgress:false as const,mayComputeProjectStatus:false as const};
 const d=digestValue(options,'HAB26',body);return d.ok?ok(deepFreeze({...body,boundaryDigest:d.value})):d;
}

export function createSemanticStateIdentity(stateId:string,projectId:string,lineageId:string,coverageDigest:string,sourceProjectionDigests:readonly string[],options:OperationOptions):Result<SemanticStateIdentity>{
 if(![stateId,projectId,lineageId].every(validId)||!allSha([coverageDigest,...sourceProjectionDigests]))return fail('SSI26_INPUT_INVALID','Semantic state identity inputs are invalid.');
 const body={stateId,projectId,lineageId,coverageDigest,sourceProjectionDigests:sortedUnique(sourceProjectionDigests)};const d=digestValue(options,'SSI26',body);return d.ok?ok(deepFreeze({stateId,projectId,lineageId,coverageDigest,semanticDigest:d.value})):d;
}

export function sealReviewSourceProjection(input:ReviewSourceInput,options:OperationOptions):Result<ReviewSourceProjection>{
 if(![input.subjectId,input.sourceId,input.ownerId,input.projectId,input.lineageId].every(validId))return fail('RSP26_ID_INVALID','Review source identifiers are invalid.',input.subjectId);
 if(!allSha([input.semanticDigest,input.validityBindingDigest,...input.dependencyDigests]))return fail('RSP26_DIGEST_INVALID','Review source semantic or validity bindings are invalid.',input.subjectId);
 const body={...input,dependencyDigests:sortedUnique(input.dependencyDigests)};const d=digestValue(options,'RSP26',body);return d.ok?ok(deepFreeze({...body,projectionDigest:d.value})):d;
}

export function createCrossLineageWitness(baseline:SemanticStateIdentity,candidate:SemanticStateIdentity,options:OperationOptions):Result<CrossLineageWitness>{
 const body={projectMatch:baseline.projectId===candidate.projectId,lineageMatch:baseline.lineageId===candidate.lineageId};const comparisonAdmissible=body.projectMatch&&body.lineageMatch;const d=digestValue(options,'XLG26',{...body,comparisonAdmissible,baseline:baseline.semanticDigest,candidate:candidate.semanticDigest});return d.ok?ok(deepFreeze({...body,comparisonAdmissible,witnessDigest:d.value})):d;
}

function mapSources(items:readonly ReviewSourceProjection[],side:string):Result<Map<string,ReviewSourceProjection>>{
 const map=new Map<string,ReviewSourceProjection>();
 for(const item of items){const existing=map.get(item.subjectId);if(existing)return fail('DCI26_DUPLICATE_SUBJECT',`Duplicate ${side} subject projection.`,item.subjectId);map.set(item.subjectId,item);}return ok(map);
}
function symmetric(a:readonly string[],b:readonly string[]){const aa=new Set(a),bb=new Set(b);return sortedUnique([...a.filter(x=>!bb.has(x)),...b.filter(x=>!aa.has(x))]);}
function deltaEntry(subjectId:string,before:ReviewSourceProjection|undefined,after:ReviewSourceProjection|undefined,coverageComplete:boolean,options:OperationOptions):Result<SemanticDeltaEntry>{
 if(before&&!after&&!coverageComplete)return fail('DCI26_REMOVAL_UNPROVEN','Subject absence cannot be classified as REMOVED without complete comparison coverage.',subjectId);
 const semanticChanged=before===undefined||after===undefined||before.semanticDigest!==after.semanticDigest;
 const authorityChanged=before===undefined||after===undefined||before.ownerId!==after.ownerId||before.sourceId!==after.sourceId;
 const validityChanged=before===undefined||after===undefined||before.validityBindingDigest!==after.validityBindingDigest;
 const changedDependencyDigests=symmetric(before?.dependencyDigests??[],after?.dependencyDigests??[]);
 let changeClass:'ADDED'|'REMOVED'|'MODIFIED'|'UNCHANGED';
 if(!before&&after)changeClass='ADDED';else if(before&&!after)changeClass='REMOVED';else if(semanticChanged||authorityChanged||validityChanged||changedDependencyDigests.length>0)changeClass='MODIFIED';else changeClass='UNCHANGED';
 const body={subjectId,changeClass,beforeProjectionDigest:before?.projectionDigest??null,afterProjectionDigest:after?.projectionDigest??null,semanticChanged,authorityChanged,validityChanged,changedDependencyDigests};const d=digestValue(options,'SDL26',body);return d.ok?ok(deepFreeze({...body,deltaDigest:d.value})):d;
}

export function createDeltaChangeInventory(baseline:SemanticStateIdentity,candidate:SemanticStateIdentity,baselineSources:readonly ReviewSourceProjection[],candidateSources:readonly ReviewSourceProjection[],coverageComplete:boolean,options:OperationOptions):Result<DeltaChangeInventory>{
 const lineage=createCrossLineageWitness(baseline,candidate,options);if(!lineage.ok)return lineage;if(!lineage.value.comparisonAdmissible)return fail('DCI26_LINEAGE_MISMATCH','Baseline and candidate are not in the same project lineage.');
 const bm=mapSources(baselineSources,'baseline');if(!bm.ok)return bm;const cm=mapSources(candidateSources,'candidate');if(!cm.ok)return cm;
 const ids=sortedUnique([...bm.value.keys(),...cm.value.keys()]);const entries:SemanticDeltaEntry[]=[];
 for(const id of ids){const r=deltaEntry(id,bm.value.get(id),cm.value.get(id),coverageComplete,options);if(!r.ok)return r;entries.push(r.value);}
 entries.sort((a,b)=>compareCodePoint(a.subjectId,b.subjectId));const body={baselineIdentityDigest:baseline.semanticDigest,candidateIdentityDigest:candidate.semanticDigest,coverageComplete,entries};const d=digestValue(options,'DCI26',body);return d.ok?ok(deepFreeze({...body,inventoryDigest:d.value})):d;
}
