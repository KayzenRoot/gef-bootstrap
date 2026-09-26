export type RegistryState = 'ACTIVE' | 'STALE' | 'QUARANTINED' | 'TOMBSTONED' | 'UNKNOWN';
export type RegistryMatch = 'EXACT' | 'POSSIBLE' | 'CONFLICT' | 'ABSENT' | 'UNKNOWN';
export type RegistryMutationKind = 'ADD' | 'UPDATE' | 'TOMBSTONE';
export type FreshnessState = 'SAME' | 'CHANGED' | 'MISSING' | 'UNKNOWN';

export interface DigestPort { readonly algorithm:'sha256'; digest(input:string):string; }
export interface CancellationPort { isCancelled():boolean; }
export interface OperationOptions { readonly digest:DigestPort; readonly cancellation?:CancellationPort|undefined; readonly maxEntries?:number|undefined; readonly maxRefs?:number|undefined; }
export interface Diagnostic { readonly code:string; readonly message:string; readonly subject?:string|undefined; }
export type Result<T> = {readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface RegistryIdentityEnvelopeInput { readonly projectId:string; readonly lineageId:string; readonly repositoryIdentityDigest:string; readonly sourceIdentityDigest:string; }
export interface RegistryIdentityEnvelope extends RegistryIdentityEnvelopeInput { readonly envelopeDigest:string; }
export interface RegistryProvenanceChain { readonly sourceDigests:readonly string[]; readonly chainDigest:string; }
export interface ProjectRegistryEntryInput {
  readonly identity:RegistryIdentityEnvelope;
  readonly checkpointDigest:string|null;
  readonly aliases:readonly string[];
  readonly metadataRefs:readonly string[];
  readonly knowledgeRefs:readonly string[];
  readonly state:RegistryState;
  readonly provenance:RegistryProvenanceChain;
  readonly privateLocatorRef?:string|null|undefined;
}
export interface ProjectRegistryEntry {
  readonly projectId:string;
  readonly lineageId:string;
  readonly repositoryIdentityDigest:string;
  readonly sourceIdentityDigest:string;
  readonly identityEnvelopeDigest:string;
  readonly checkpointDigest:string|null;
  readonly aliases:readonly string[];
  readonly metadataRefs:readonly string[];
  readonly knowledgeRefs:readonly string[];
  readonly state:RegistryState;
  readonly provenanceDigest:string;
  readonly provenanceSourceDigests:readonly string[];
  readonly privateLocatorRef:string|null;
  readonly entryDigest:string;
}
export interface RegistryAuthorityBoundary { readonly entryDigest:string; readonly authoritySource:'EXTERNAL_CANONICAL_ONLY'; readonly routingOnly:true; readonly mayCreateIdentity:false; readonly mayPromoteCheckpoint:false; readonly boundaryDigest:string; }
export interface RegistryMutationIntentInput { readonly mutationId:string; readonly kind:RegistryMutationKind; readonly expectedVersion:string; readonly projectId:string; readonly proposedEntryDigest:string|null; }
export interface RegistryMutationIntent extends RegistryMutationIntentInput { readonly intentDigest:string; }

export interface RegistryIndexBucket { readonly key:string; readonly entryDigests:readonly string[]; }
export interface ProjectRegistryIndex { readonly entries:readonly ProjectRegistryEntry[]; readonly byProjectId:readonly RegistryIndexBucket[]; readonly byLineageId:readonly RegistryIndexBucket[]; readonly byRepositoryIdentity:readonly RegistryIndexBucket[]; readonly byAlias:readonly RegistryIndexBucket[]; readonly indexDigest:string; }
export interface RegistryCollisionFinding { readonly kind:'PROJECT_ID_CONFLICT'|'LINEAGE_CONFLICT'|'REPOSITORY_IDENTITY_COLLISION'|'ALIAS_AMBIGUITY'; readonly key:string; readonly entryDigests:readonly string[]; }
export interface RegistryCollisionWitness { readonly findings:readonly RegistryCollisionFinding[]; readonly hasConflict:boolean; readonly witnessDigest:string; }
export interface AliasAdmissionCapsule { readonly alias:string; readonly projectId:string; readonly lineageId:string; readonly repositoryIdentityDigest:string; readonly capsuleDigest:string; }
export interface RegistryQuery { readonly projectId?:string|undefined; readonly lineageId?:string|undefined; readonly repositoryIdentityDigest?:string|undefined; readonly alias?:string|undefined; readonly aliasAdmission?:AliasAdmissionCapsule|undefined; }
export interface RegistryQueryPlan { readonly indexes:readonly ('PROJECT_ID'|'LINEAGE_ID'|'REPOSITORY_IDENTITY'|'ALIAS')[]; readonly bounded:true; readonly planDigest:string; }
export interface RegistryQueryResult { readonly match:RegistryMatch; readonly entryDigests:readonly string[]; readonly selectedEntryDigest:string|null; readonly reasons:readonly string[]; readonly resultDigest:string; }
export interface RepositoryKnowledgeItem { readonly knowledgeId:string; readonly domain:string; readonly refId:string; readonly dependencyKeys:readonly string[]; readonly validityBindingDigest:string; }
export interface RepositoryKnowledgeMap { readonly items:readonly RepositoryKnowledgeItem[]; readonly currentBindingDigest:string; readonly mapDigest:string; }
export interface NegativeRegistryKnowledgeEntry { readonly keyKind:'PROJECT_ID'|'LINEAGE_ID'|'REPOSITORY_IDENTITY'|'ALIAS'|'CAPABILITY'; readonly key:string; readonly absenceProofDigest:string; readonly validityBindingDigest:string; }
export interface NegativeRegistryKnowledge { readonly entries:readonly NegativeRegistryKnowledgeEntry[]; readonly knowledgeDigest:string; }

export interface RegistrySemanticVersion { readonly snapshotDigest:string; readonly version:string; }
export interface RegistryPromotionFence { readonly expectedVersion:string; readonly intentDigest:string; readonly fenceDigest:string; }
export interface RegistrySplitBrainReport { readonly baseVersion:string; readonly successorVersions:readonly string[]; readonly divergent:boolean; readonly reportDigest:string; }
export interface RegistryFreshnessObservation { readonly identityEnvelopeDigest?:string|null|undefined; readonly repositoryIdentityDigest?:string|null|undefined; readonly checkpointDigest?:string|null|undefined; readonly knowledgeBindingDigest?:string|null|undefined; }
export interface RegistryFreshnessVector { readonly projectId:string; readonly identity:FreshnessState; readonly repository:FreshnessState; readonly checkpoint:FreshnessState; readonly knowledge:FreshnessState; readonly stale:boolean; readonly vectorDigest:string; }
export interface StaleEntryQuarantine { readonly activeEntryDigests:readonly string[]; readonly quarantinedEntryDigests:readonly string[]; readonly quarantineDigest:string; }
export interface RegistryRepairPlan { readonly projectId:string; readonly actions:readonly string[]; readonly requiresCanonicalRefresh:boolean; readonly planDigest:string; }
export interface NegativeDiagnosticCacheEntry { readonly failureFingerprint:string; readonly subject:string; readonly validityBindingDigest:string; }
export interface NegativeDiagnosticCache { readonly entries:readonly NegativeDiagnosticCacheEntry[]; readonly cacheDigest:string; }
export interface TombstoneLineageRecord { readonly projectId:string; readonly lineageId:string; readonly predecessorEntryDigest:string; readonly mutationIntentDigest:string; readonly provenanceDigest:string; readonly tombstoneDigest:string; }

export interface RegistrySizeAssessment { readonly entryCount:number; readonly referenceCount:number; readonly withinLimits:boolean; readonly assessmentDigest:string; }
export interface RegistrySnapshotCapsule { readonly schemaVersion:1; readonly entries:readonly ProjectRegistryEntry[]; readonly tombstones:readonly TombstoneLineageRecord[]; readonly collisions:RegistryCollisionWitness; readonly semanticVersion:string; readonly snapshotDigest:string; }
export interface RegistryAdmissionReceipt { readonly mutationId:string; readonly kind:RegistryMutationKind; readonly projectId:string; readonly beforeVersion:string; readonly afterVersion:string; readonly intentDigest:string; readonly fenceDigest:string; readonly beforeSnapshotDigest:string; readonly afterSnapshotDigest:string; readonly affectedEntryDigests:readonly string[]; readonly receiptDigest:string; }
export interface RegistryPublicEntry { readonly projectId:string; readonly lineageId:string; readonly repositoryIdentityDigest:string; readonly checkpointDigest:string|null; readonly aliases:readonly string[]; readonly metadataRefs:readonly string[]; readonly knowledgeRefs:readonly string[]; readonly state:RegistryState; readonly entryDigest:string; }
export interface RegistryPrivacyProjection { readonly entries:readonly RegistryPublicEntry[]; readonly projectionDigest:string; }
export interface RegistryPortabilityEnvelope { readonly schemaVersion:1; readonly projection:RegistryPrivacyProjection; readonly requiredCapabilities:readonly string[]; readonly missingCapabilities:readonly string[]; readonly envelopeDigest:string; }
export interface RegistryCompactionMap { readonly retainedRefs:readonly string[]; readonly droppedDuplicateRefs:readonly string[]; readonly requiredRefs:readonly string[]; readonly compactionDigest:string; }
export interface RegistryHandoffProject { readonly projectId:string; readonly lineageId:string; readonly repositoryIdentityDigest:string; readonly checkpointDigest:string|null; readonly state:RegistryState; }
export interface RegistryHandoffContract { readonly snapshotDigest:string; readonly semanticVersion:string; readonly projects:readonly RegistryHandoffProject[]; readonly unresolved:readonly string[]; readonly handoffDigest:string; }
export interface RegistryIntegrityReceipt { readonly snapshotDigest:string; readonly semanticVersion:string; readonly entryDigests:readonly string[]; readonly valid:boolean; readonly receiptDigest:string; }
export interface RegistryStorePort { load():RegistrySnapshotCapsule; compareAndSwap(expectedVersion:string,next:RegistrySnapshotCapsule):boolean; snapshot():RegistrySnapshotCapsule; }
