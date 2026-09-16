import type{DeltaChangeInventory,DeltaTraceReceipt,DependencyProjection,ImpactFrontier,OperationOptions,Result,ReviewCandidate,ReviewCandidateIndex,ReviewCarryForward,ReviewSourceProjection,SemanticDeltaMatrix,SemanticFinding,SemanticFindingInput}from'./types.js';
import{allSha,compareCodePoint,deepFreeze,digestValue,fail,ok,sortedUnique,validId}from'./utils.js';

export function createSemanticDeltaMatrix(inventory:DeltaChangeInventory,proofInvalidatedSubjectIds:readonly string[],options:OperationOptions):Result<SemanticDeltaMatrix>{
 if(proofInvalidatedSubjectIds.some(x=>!validId(x)))return fail('SDM26_PROOF_SUBJECT_INVALID','Proof-invalidated subject identifier is invalid.');const invalid=new Set(proofInvalidatedSubjectIds);const rows=[];
 for(const entry of inventory.entries){const base={subjectId:entry.subjectId,changeClass:entry.changeClass,semanticChanged:entry.semanticChanged,authorityChanged:entry.authorityChanged,validityChanged:entry.validityChanged,proofInvalidated:invalid.has(entry.subjectId)};const d=digestValue(options,'SDM26_ROW',base);if(!d.ok)return d;rows.push({...base,rowDigest:d.value});}
 rows.sort((a,b)=>compareCodePoint(a.subjectId,b.subjectId));const body={inventoryDigest:inventory.inventoryDigest,rows};const d=digestValue(options,'SDM26',body);return d.ok?ok(deepFreeze({...body,matrixDigest:d.value})):d;
}

export function createImpactFrontier(matrix:SemanticDeltaMatrix,dependencies:DependencyProjection,allKnownSubjectIds:readonly string[],options:OperationOptions):Result<ImpactFrontier>{
 if(allKnownSubjectIds.some(x=>!validId(x)))return fail('IFP26_SUBJECT_INVALID','Known subject identifier is invalid.');const direct=new Set(matrix.rows.filter(r=>r.changeClass!=='UNCHANGED'||r.proofInvalidated).map(r=>r.subjectId));const affected=new Set(direct);const changedDependencyDigests=new Set<string>();
 // Subject IDs may also be declared as dependency identities by owner projections; resolve both exact subject edges and row digests.
 for(const row of matrix.rows)if(direct.has(row.subjectId)){changedDependencyDigests.add(row.subjectId);changedDependencyDigests.add(row.rowDigest);}
 let advanced=true;while(advanced){advanced=false;for(const edge of dependencies.reverseEdges){if(!affected.has(edge.dependencyDigest)&&!changedDependencyDigests.has(edge.dependencyDigest))continue;for(const subject of edge.subjectIds)if(!affected.has(subject)){affected.add(subject);changedDependencyDigests.add(subject);advanced=true;}}}
 const widened=!dependencies.complete;if(widened)for(const id of allKnownSubjectIds)affected.add(id);const body={directlyImpactedSubjectIds:sortedUnique([...direct]),transitivelyImpactedSubjectIds:sortedUnique([...affected]),widened};const d=digestValue(options,'IFP26',body);return d.ok?ok(deepFreeze({...body,frontierDigest:d.value})):d;
}

export function createReviewCandidateIndex(inventory:DeltaChangeInventory,frontier:ImpactFrontier,candidateSources:readonly ReviewSourceProjection[],proofFingerprintDigests:readonly string[],options:OperationOptions):Result<ReviewCandidateIndex>{
 if(!allSha(proofFingerprintDigests))return fail('RCI26_PROOF_DIGEST_INVALID','Proof fingerprint digest is invalid.');const sourceMap=new Map(candidateSources.map(x=>[x.subjectId,x]));const deltaMap=new Map(inventory.entries.map(x=>[x.subjectId,x]));const candidates:ReviewCandidate[]=[];
 for(const subjectId of frontier.transitivelyImpactedSubjectIds){const delta=deltaMap.get(subjectId);const source=sourceMap.get(subjectId);const base={subjectId,deltaDigest:delta?.deltaDigest??inventory.inventoryDigest,sourceProjectionDigest:source?.projectionDigest??null,proofFingerprintDigests:sortedUnique(proofFingerprintDigests)};const d=digestValue(options,'RCI26_ITEM',base);if(!d.ok)return d;candidates.push({...base,candidateDigest:d.value});}
 candidates.sort((a,b)=>compareCodePoint(a.subjectId,b.subjectId));const d=digestValue(options,'RCI26',candidates);return d.ok?ok(deepFreeze({candidates,indexDigest:d.value})):d;
}

export function createReviewCarryForward(subjectId:string,currentSource:ReviewSourceProjection|null,proofFingerprintDigests:readonly string[],reviewPolicyDigest:string,priorReviewDigest:string|null,priorCompatibilityDigest:string|null,options:OperationOptions):Result<ReviewCarryForward>{
 if(!validId(subjectId)||!allSha([reviewPolicyDigest,priorReviewDigest,priorCompatibilityDigest,...proofFingerprintDigests]))return fail('RCF26_INPUT_INVALID','Review carry-forward bindings are invalid.',subjectId);
 const compatBody={subjectId,sourceProjectionDigest:currentSource?.projectionDigest??null,semanticDigest:currentSource?.semanticDigest??null,ownerId:currentSource?.ownerId??null,sourceId:currentSource?.sourceId??null,validityBindingDigest:currentSource?.validityBindingDigest??null,proofFingerprintDigests:sortedUnique(proofFingerprintDigests),reviewPolicyDigest};const c=digestValue(options,'RCF26_COMPAT',compatBody);if(!c.ok)return c;
 let state:'REUSE'|'REVIEW'|'INDETERMINATE';const reasons:string[]=[];
 if(currentSource===null){state='INDETERMINATE';reasons.push('CURRENT_SOURCE_MISSING');}else if(priorReviewDigest===null||priorCompatibilityDigest===null){state='REVIEW';reasons.push('NO_PRIOR_REVIEW');}else if(priorCompatibilityDigest===c.value){state='REUSE';reasons.push('EXACT_COMPATIBILITY');}else{state='REVIEW';reasons.push('RELEVANT_BINDING_CHANGED');}
 const body={subjectId,state,priorReviewDigest,currentCompatibilityDigest:c.value,reasonCodes:reasons};const d=digestValue(options,'RCF26',body);return d.ok?ok(deepFreeze({...body,decisionDigest:d.value})):d;
}

export function createSemanticFinding(input:SemanticFindingInput,options:OperationOptions):Result<SemanticFinding>{
 if(!validId(input.findingId)||!validId(input.subjectId)||!validId(input.ruleId))return fail('SFC26_ID_INVALID','Finding identifier is invalid.',input.findingId);
 if(!['CRITICAL','HIGH','MEDIUM','LOW','INFO'].includes(input.severity)||!['OPEN','RESOLVED','SUPERSEDED','INDETERMINATE'].includes(input.state))return fail('SFC26_STATE_INVALID','Finding severity/state is invalid.',input.findingId);
 if(!allSha([input.beforeSemanticDigest,input.afterSemanticDigest,input.supersedesFindingDigest,...input.evidenceDigests,...input.proofDigests]))return fail('SFC26_DIGEST_INVALID','Finding bindings are invalid.',input.findingId);
 if((input.state==='RESOLVED'||input.state==='SUPERSEDED')&&input.supersedesFindingDigest===null)return fail('SFC26_LINEAGE_REQUIRED','Resolved/superseded finding requires lineage binding.',input.findingId);
 const body={...input,evidenceDigests:sortedUnique(input.evidenceDigests),proofDigests:sortedUnique(input.proofDigests)};const d=digestValue(options,'SFC26',body);return d.ok?ok(deepFreeze({...body,findingDigest:d.value})):d;
}

export function createDeltaTraceReceipt(baselineIdentityDigest:string,candidateIdentityDigest:string,inventory:DeltaChangeInventory,frontier:ImpactFrontier,index:ReviewCandidateIndex,findings:readonly SemanticFinding[],options:OperationOptions):Result<DeltaTraceReceipt>{
 if(!allSha([baselineIdentityDigest,candidateIdentityDigest]))return fail('DTR26_IDENTITY_INVALID','Delta trace state identities are invalid.');const body={baselineIdentityDigest,candidateIdentityDigest,inventoryDigest:inventory.inventoryDigest,frontierDigest:frontier.frontierDigest,candidateIndexDigest:index.indexDigest,findingDigests:sortedUnique(findings.map(x=>x.findingDigest))};const d=digestValue(options,'DTR26',body);return d.ok?ok(deepFreeze({...body,receiptDigest:d.value})):d;
}
