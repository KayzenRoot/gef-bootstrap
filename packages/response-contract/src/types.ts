export type FreshnessState='CURRENT'|'STALE'|'CONFLICT'|'UNKNOWN';
export type MetricAvailability='AVAILABLE'|'NOT_YET_BASELINED'|'NOT_APPLICABLE'|'STALE'|'CONFLICT'|'UNKNOWN';
export type ConfidenceLevel='LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';
export type ResponseVerdict='SUCCESS'|'PARTIAL'|'BLOCKED'|'INDETERMINATE'|'RECOVERY_REQUIRED'|'CONFLICT';
export type BlockerClassification='INFO'|'WARNING'|'BLOCKING'|'RECOVERY'|'CONFLICT';
export type BlockerDisposition='ACTIVE'|'RESOLVED'|'UNKNOWN';
export type NextActionState='KNOWN'|'NONE'|'UNKNOWN';
export type MetricOwner='M21_PROGRESS'|'M22_ESTIMATION'|'M23_PROJECT_STATUS'|'EXTERNAL_CANONICAL';

export interface DigestPort{readonly algorithm:'sha256';digest(input:string):string;}
export interface CancellationPort{isCancelled():boolean;}
export interface OperationOptions{readonly digest:DigestPort;readonly cancellation?:CancellationPort|undefined;readonly maxFields?:number|undefined;readonly maxRefs?:number|undefined;readonly maxBytes?:number|undefined;}
export interface Diagnostic{readonly code:string;readonly message:string;readonly subject?:string|undefined;}
export type Result<T>={readonly ok:true;readonly value:T}|{readonly ok:false;readonly diagnostics:readonly Diagnostic[]};

export interface SourceBoundFieldClaimInput{readonly field:string;readonly value:string;readonly ownerDomain:string;readonly subjectId:string;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly freshness:FreshnessState;}
export interface SourceBoundFieldClaim extends SourceBoundFieldClaimInput{readonly valueDigest:string;readonly claimDigest:string;}
export interface ProvenanceFieldBinding{readonly field:string;readonly claimDigests:readonly string[];}
export interface ResponseProvenanceIndex{readonly bindings:readonly ProvenanceFieldBinding[];readonly indexDigest:string;}
export interface ResponseSchemaEnvelope{readonly schemaVersion:1;readonly profile:string;readonly requiredCapabilities:readonly string[];readonly schemaDigest:string;}
export interface ResponseContractCapsuleInput{readonly projectId:string;readonly responseKind:string;readonly checkpointBindingDigest:string;readonly resumeBindingDigest:string;readonly registryBindingDigest:string;readonly sourceClaims:readonly SourceBoundFieldClaim[];readonly verdictInputDigest:string;readonly nextActionSourceDigest:string;readonly schema:ResponseSchemaEnvelope;}
export interface ResponseContractCapsule extends ResponseContractCapsuleInput{readonly provenanceIndex:ResponseProvenanceIndex;readonly capsuleDigest:string;}
export interface ResponseAuthorityBoundary{readonly capsuleDigest:string;readonly authoritySource:'EXTERNAL_CANONICAL_ONLY';readonly mayCreateCanonicalFacts:false;readonly mayComputeProgress:false;readonly mayComputeEta:false;readonly mayComputeProjectStatus:false;readonly boundaryDigest:string;}

export interface MetricOwnershipEntry{readonly metricKey:string;readonly owner:MetricOwner;}
export interface MetricOwnershipMatrix{readonly entries:readonly MetricOwnershipEntry[];readonly matrixDigest:string;}
export interface BaselineAvailabilityWitness{readonly metricKey:string;readonly owner:MetricOwner;readonly baselineDigest:string;readonly observationDigest:string;readonly witnessDigest:string;}
export interface ConfidenceEnvelope{readonly sourceLevel:ConfidenceLevel;readonly projectedLevel:ConfidenceLevel;readonly ownerDigest:string;readonly envelopeDigest:string;}
export interface MetricRange{readonly min:number;readonly max:number;}
export interface DelegatedMetricClaimInput{readonly metricKey:string;readonly owner:MetricOwner;readonly availability:MetricAvailability;readonly scalarValue?:number|string|null|undefined;readonly rangeValue?:MetricRange|null|undefined;readonly unit?:string|null|undefined;readonly precision?:number|null|undefined;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly baseline?:BaselineAvailabilityWitness|null|undefined;readonly confidence?:ConfidenceEnvelope|null|undefined;}
export interface DelegatedMetricClaim{readonly metricKey:string;readonly owner:MetricOwner;readonly availability:MetricAvailability;readonly scalarValue:number|string|null;readonly rangeValue:MetricRange|null;readonly unit:string|null;readonly precision:number|null;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly baseline:BaselineAvailabilityWitness|null;readonly baselineDigest:string|null;readonly confidence:ConfidenceEnvelope|null;readonly claimDigest:string;}

export interface BlockerProjectionInput{readonly blockerId:string;readonly classification:BlockerClassification;readonly disposition:BlockerDisposition;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly freshness:FreshnessState;readonly message:string;}
export interface BlockerProjection extends BlockerProjectionInput{readonly blockerDigest:string;}
export interface StateConflictWitness{readonly subject:string;readonly sourceDigests:readonly string[];readonly hasConflict:boolean;readonly witnessDigest:string;}
export interface NextNecessaryActionCapsule{readonly state:NextActionState;readonly actionRef:string|null;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly capsuleDigest:string;}
export interface ResponseVerdictClaim{readonly verdict:ResponseVerdict;readonly sourceIdentityDigest:string;readonly validityBindingDigest:string;readonly claimDigest:string;}
export interface VerdictDecision{readonly verdict:ResponseVerdict;readonly reasons:readonly string[];readonly verdictDigest:string;}

export interface ResponseSizeAssessment{readonly fieldCount:number;readonly referenceCount:number;readonly byteCount:number;readonly withinLimits:boolean;readonly disposition:'WITHIN_LIMITS'|'EXPANSION_REFERENCE_REQUIRED';readonly assessmentDigest:string;}
export interface RedactionAssessment{readonly safe:boolean;readonly rejectedFields:readonly string[];readonly assessmentDigest:string;}

export interface MachineResponseEnvelope{readonly schema:ResponseSchemaEnvelope;readonly projectId:string;readonly responseKind:string;readonly checkpointBindingDigest:string;readonly resumeBindingDigest:string;readonly registryBindingDigest:string;readonly fields:readonly SourceBoundFieldClaim[];readonly metrics:readonly DelegatedMetricClaim[];readonly blockers:readonly BlockerProjection[];readonly conflicts:readonly StateConflictWitness[];readonly nextAction:NextNecessaryActionCapsule;readonly verdictClaim:ResponseVerdictClaim;readonly verdict:VerdictDecision;readonly provenanceIndex:ResponseProvenanceIndex;readonly semanticDigest:string;readonly machineDigest:string;}
export interface HumanResponseProjection{readonly semanticDigest:string;readonly lines:readonly string[];readonly materialClaimDigests:readonly string[];readonly projectionDigest:string;}
export interface ResponseIntegrityReceipt{readonly schemaDigest:string;readonly semanticDigest:string;readonly machineDigest:string;readonly humanProjectionDigest:string|null;readonly sourceClaimDigests:readonly string[];readonly metricClaimDigests:readonly string[];readonly blockerDigests:readonly string[];readonly valid:boolean;readonly receiptDigest:string;}
export interface CompatibilityRequirement{readonly supportedSchemaVersions:readonly number[];readonly supportedProfiles:readonly string[];readonly capabilities:readonly string[];}
export interface CompatibilityDecision{readonly compatible:boolean;readonly missingCapabilities:readonly string[];readonly reasons:readonly string[];readonly decisionDigest:string;}
export interface ResponseBindingObservation{readonly checkpointBindingDigest:string;readonly resumeBindingDigest:string;readonly registryBindingDigest:string;readonly metricValidityBindings?:Readonly<Record<string,string>>|undefined;readonly fieldValidityBindings?:Readonly<Record<string,string>>|undefined;readonly verdictValidityBinding?:string|undefined;}
export interface StaleResponseReport{readonly stale:boolean;readonly staleSubjects:readonly string[];readonly reportDigest:string;}
