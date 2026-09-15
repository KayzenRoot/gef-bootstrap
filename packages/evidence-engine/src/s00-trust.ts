import type{AuthorityRootSet,EvidenceKind,OperationOptions,ProducerAuthorityDecision,Result,SourceAuthorityIndex,SubjectStateBinding,SubjectStateBindingInput}from'./types.js';
import{fail,isSha256,ok,sortedUnique}from'./utils.js';
import{authorizeProducer as authorizeProducerStructural,createSubjectStateBinding as createSubjectStateBindingStructural,verifyAuthorityRootSet,verifySubjectStateBinding as verifySubjectStateBindingStructural}from'./s01-manifest.js';

export interface TrustedOperationOptions extends OperationOptions{readonly trustedAuthorityRootDigests:readonly string[];}

export function verifyTrustedAuthorityRootSet(rootSet:AuthorityRootSet,options:TrustedOperationOptions):Result<boolean>{
 const structural=verifyAuthorityRootSet(rootSet,options);if(!structural.ok||!structural.value)return structural.ok?fail('SAI24_ROOT_SET_TAMPERED','Trusted authority requires a structurally verified root set.'):structural;
 const trusted=sortedUnique(options.trustedAuthorityRootDigests);if(trusted.length===0||trusted.some(x=>!isSha256(x)))return fail('SAI24_TRUST_ANCHOR_MISSING','Authoritative evidence operations require externally injected canonical root digests.');
 const trustedSet=new Set(trusted),untrusted=rootSet.roots.filter(r=>!trustedSet.has(r.rootDigest)).map(r=>r.rootId);
 if(untrusted.length>0)return fail('SAI24_ROOT_NOT_TRUSTED','Authority root is not present in the externally injected trust set.',untrusted.join(','));
 if(rootSet.conflictingRootIds.length>0)return fail('SAI24_TRUST_ROOT_CONFLICT','Conflicting canonical authority roots fail closed.',rootSet.conflictingRootIds.join(','));
 return ok(true);
}

export function authorizeProducer(index:SourceAuthorityIndex,rootSet:AuthorityRootSet,producerId:string,kind:EvidenceKind,claimIds:readonly string[],options:TrustedOperationOptions):Result<ProducerAuthorityDecision>{const trust=verifyTrustedAuthorityRootSet(rootSet,options);if(!trust.ok||!trust.value)return trust.ok?fail('SAI24_TRUST_REJECTED','Producer authorization requires trusted canonical roots.',producerId):trust;return authorizeProducerStructural(index,rootSet,producerId,kind,claimIds,options);}

function identityValid(value:SubjectStateBinding['headRevision'],domain:'GIT_COMMIT'|'GIT_TREE'|'RUNTIME'|'PLATFORM'){return value===null||value.domain===domain&&typeof value.value==='string'&&value.value.length>0&&value.value.length<=512&&(value.algorithm===null||typeof value.algorithm==='string'&&value.algorithm.length>0);}
export function verifySubjectIdentityDomains(subject:SubjectStateBinding):Result<boolean>{if(!identityValid(subject.baseRevision,'GIT_COMMIT')||!identityValid(subject.headRevision,'GIT_COMMIT')||!identityValid(subject.treeRevision,'GIT_TREE')||!identityValid(subject.runtimeIdentity,'RUNTIME')||!identityValid(subject.platformIdentity,'PLATFORM'))return fail('SSB24_IDENTITY_DOMAIN_INVALID','Subject binding uses an identity in the wrong runtime domain.',subject.subjectId);return ok(true);}
export function createSubjectStateBinding(input:SubjectStateBindingInput,options:OperationOptions):Result<SubjectStateBinding>{const structural=createSubjectStateBindingStructural(input,options);if(!structural.ok)return structural;const domains=verifySubjectIdentityDomains(structural.value);return domains.ok&&domains.value?structural:domains.ok?fail('SSB24_IDENTITY_DOMAIN_INVALID','Subject binding uses an identity in the wrong runtime domain.',input.subjectId):domains;}
export function verifySubjectStateBinding(value:SubjectStateBinding,options:OperationOptions):Result<boolean>{const structural=verifySubjectStateBindingStructural(value,options);if(!structural.ok||!structural.value)return structural;return verifySubjectIdentityDomains(value);}
