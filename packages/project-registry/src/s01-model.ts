import { isCanonicalProjectId } from '@gef-bootstrap/project-identity';
import type { OperationOptions, ProjectRegistryEntry, ProjectRegistryEntryInput, RegistryAuthorityBoundary, RegistryIdentityEnvelope, RegistryIdentityEnvelopeInput, RegistryMutationIntent, RegistryMutationIntentInput, RegistryProvenanceChain, Result } from './types.js';
import { cancelled, deepFreeze, fail, isSha256, secretLike, sha, sortedUnique, validId, validOpaqueRef, validateRefs } from './utils.js';

export function createRegistryIdentityEnvelope(input:RegistryIdentityEnvelopeInput,options:OperationOptions):Result<RegistryIdentityEnvelope>{
 const c=cancelled(options);if(c)return c;
 if(!isCanonicalProjectId(input.projectId))return fail('REGISTRY_PROJECT_ID_INVALID','Project ID must be the canonical M03 lowercase UUIDv4');
 if(!validId(input.lineageId))return fail('REGISTRY_LINEAGE_ID_INVALID','Lineage ID is invalid');
 if(!isSha256(input.repositoryIdentityDigest)||!isSha256(input.sourceIdentityDigest))return fail('REGISTRY_IDENTITY_DIGEST_INVALID','Identity envelope requires SHA-256 bindings');
 const core={projectId:input.projectId,lineageId:input.lineageId,repositoryIdentityDigest:input.repositoryIdentityDigest,sourceIdentityDigest:input.sourceIdentityDigest};
 const d=sha(options,core);if(!d.ok)return d;return{ok:true,value:deepFreeze({...core,envelopeDigest:d.value})};
}

export function verifyRegistryIdentityEnvelope(value:RegistryIdentityEnvelope,options:OperationOptions):Result<boolean>{const r=createRegistryIdentityEnvelope(value,options);return r.ok?{ok:true,value:r.value.envelopeDigest===value.envelopeDigest}:r;}

export function createRegistryProvenanceChain(sourceDigests:readonly string[],options:OperationOptions):Result<RegistryProvenanceChain>{
 const c=cancelled(options);if(c)return c;
 if(sourceDigests.length===0||sourceDigests.some(x=>!isSha256(x)))return fail('REGISTRY_PROVENANCE_INVALID','Provenance requires one or more SHA-256 source bindings');
 const source=sortedUnique(sourceDigests);const d=sha(options,{sourceDigests:source});if(!d.ok)return d;return{ok:true,value:deepFreeze({sourceDigests:source,chainDigest:d.value})};
}

export function verifyRegistryProvenanceChain(value:RegistryProvenanceChain,options:OperationOptions):Result<boolean>{const r=createRegistryProvenanceChain(value.sourceDigests,options);return r.ok?{ok:true,value:r.value.chainDigest===value.chainDigest}:r;}

export function createProjectRegistryEntry(input:ProjectRegistryEntryInput,options:OperationOptions):Result<ProjectRegistryEntry>{
 const c=cancelled(options);if(c)return c;
 const iv=verifyRegistryIdentityEnvelope(input.identity,options);if(!iv.ok)return iv as Result<ProjectRegistryEntry>;if(!iv.value)return fail('REGISTRY_IDENTITY_ENVELOPE_TAMPERED','Identity envelope digest mismatch');
 const pv=verifyRegistryProvenanceChain(input.provenance,options);if(!pv.ok)return pv as Result<ProjectRegistryEntry>;if(!pv.value)return fail('REGISTRY_PROVENANCE_TAMPERED','Provenance chain digest mismatch');
 if(input.checkpointDigest!==null&&!isSha256(input.checkpointDigest))return fail('REGISTRY_CHECKPOINT_DIGEST_INVALID','Checkpoint binding must be null or SHA-256');
 if(!validateRefs(input.aliases)||!validateRefs(input.metadataRefs)||!validateRefs(input.knowledgeRefs))return fail('REGISTRY_REFERENCE_INVALID','Aliases and metadata/knowledge references must be unique bounded opaque identifiers');
 if([...input.aliases,...input.metadataRefs,...input.knowledgeRefs].some(secretLike))return fail('REGISTRY_SECRET_LIKE_REFERENCE','Portable registry references cannot use secret-like identifiers');
 const privateLocatorRef=input.privateLocatorRef??null;if(privateLocatorRef!==null&&(!validOpaqueRef(privateLocatorRef)||secretLike(privateLocatorRef)))return fail('REGISTRY_PRIVATE_LOCATOR_REF_INVALID','Private locator must be an opaque non-secret reference');
 const core={projectId:input.identity.projectId,lineageId:input.identity.lineageId,repositoryIdentityDigest:input.identity.repositoryIdentityDigest,sourceIdentityDigest:input.identity.sourceIdentityDigest,identityEnvelopeDigest:input.identity.envelopeDigest,checkpointDigest:input.checkpointDigest,aliases:sortedUnique(input.aliases),metadataRefs:sortedUnique(input.metadataRefs),knowledgeRefs:sortedUnique(input.knowledgeRefs),state:input.state,provenanceDigest:input.provenance.chainDigest,provenanceSourceDigests:input.provenance.sourceDigests,privateLocatorRef};
 const d=sha(options,core);if(!d.ok)return d;return{ok:true,value:deepFreeze({...core,entryDigest:d.value})};
}

export function verifyProjectRegistryEntry(value:ProjectRegistryEntry,options:OperationOptions):Result<boolean>{
 if(!isCanonicalProjectId(value.projectId)||!validId(value.lineageId)||!isSha256(value.repositoryIdentityDigest)||!isSha256(value.sourceIdentityDigest)||!isSha256(value.identityEnvelopeDigest)||!isSha256(value.provenanceDigest)||!isSha256(value.entryDigest))return{ok:true,value:false};
 if(value.checkpointDigest!==null&&!isSha256(value.checkpointDigest))return{ok:true,value:false};
 if(!validateRefs(value.aliases)||!validateRefs(value.metadataRefs)||!validateRefs(value.knowledgeRefs)||value.provenanceSourceDigests.length===0||value.provenanceSourceDigests.some(x=>!isSha256(x)))return{ok:true,value:false};
 const identity=createRegistryIdentityEnvelope({projectId:value.projectId,lineageId:value.lineageId,repositoryIdentityDigest:value.repositoryIdentityDigest,sourceIdentityDigest:value.sourceIdentityDigest},options);if(!identity.ok||identity.value.envelopeDigest!==value.identityEnvelopeDigest)return{ok:true,value:false};
 const provenance=createRegistryProvenanceChain(value.provenanceSourceDigests,options);if(!provenance.ok||provenance.value.chainDigest!==value.provenanceDigest)return{ok:true,value:false};
 const core={projectId:value.projectId,lineageId:value.lineageId,repositoryIdentityDigest:value.repositoryIdentityDigest,sourceIdentityDigest:value.sourceIdentityDigest,identityEnvelopeDigest:value.identityEnvelopeDigest,checkpointDigest:value.checkpointDigest,aliases:sortedUnique(value.aliases),metadataRefs:sortedUnique(value.metadataRefs),knowledgeRefs:sortedUnique(value.knowledgeRefs),state:value.state,provenanceDigest:value.provenanceDigest,provenanceSourceDigests:sortedUnique(value.provenanceSourceDigests),privateLocatorRef:value.privateLocatorRef};
 const d=sha(options,core);return d.ok?{ok:true,value:d.value===value.entryDigest}:d;
}

export function buildRegistryAuthorityBoundary(entry:ProjectRegistryEntry,options:OperationOptions):Result<RegistryAuthorityBoundary>{
 const v=verifyProjectRegistryEntry(entry,options);if(!v.ok)return v as Result<RegistryAuthorityBoundary>;if(!v.value)return fail('REGISTRY_ENTRY_TAMPERED','Cannot establish authority boundary from invalid entry');
 const core={entryDigest:entry.entryDigest,authoritySource:'EXTERNAL_CANONICAL_ONLY' as const,routingOnly:true as const,mayCreateIdentity:false as const,mayPromoteCheckpoint:false as const};
 const d=sha(options,core);if(!d.ok)return d;return{ok:true,value:deepFreeze({...core,boundaryDigest:d.value})};
}

export function createRegistryMutationIntent(input:RegistryMutationIntentInput,options:OperationOptions):Result<RegistryMutationIntent>{
 const c=cancelled(options);if(c)return c;
 if(!validId(input.mutationId)||!isCanonicalProjectId(input.projectId)||!isSha256(input.expectedVersion))return fail('REGISTRY_MUTATION_INTENT_INVALID','Mutation identity, project identity or expected version is invalid');
 if(input.kind==='TOMBSTONE'){if(input.proposedEntryDigest!==null)return fail('REGISTRY_TOMBSTONE_PAYLOAD_FORBIDDEN','Tombstone intent cannot carry a replacement entry');}
 else if(input.proposedEntryDigest===null||!isSha256(input.proposedEntryDigest))return fail('REGISTRY_MUTATION_ENTRY_REQUIRED','ADD/UPDATE requires an exact proposed entry digest');
 const core={mutationId:input.mutationId,kind:input.kind,expectedVersion:input.expectedVersion,projectId:input.projectId,proposedEntryDigest:input.proposedEntryDigest};const d=sha(options,core);if(!d.ok)return d;return{ok:true,value:deepFreeze({...core,intentDigest:d.value})};
}

export function verifyRegistryMutationIntent(value:RegistryMutationIntent,options:OperationOptions):Result<boolean>{const r=createRegistryMutationIntent(value,options);return r.ok?{ok:true,value:r.value.intentDigest===value.intentDigest}:r;}
