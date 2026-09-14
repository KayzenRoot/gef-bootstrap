export type AdoptionMode = 'NEW_PROJECT' | 'BROWNFIELD_INCREMENTAL' | 'BROWNFIELD_GOVERNED_MIGRATION' | 'OBSERVE_ONLY';
export type AdoptionState = 'UNASSESSED' | 'OBSERVED' | 'MODE_PROPOSED' | 'MODE_ADMITTED' | 'PARTIAL_GOVERNANCE' | 'GOVERNED' | 'MIGRATION_IN_PROGRESS' | 'BLOCKED' | 'ROLLED_BACK';
export type GovernanceMaturity = 'UNOBSERVED' | 'OBSERVED' | 'MAPPED' | 'GOVERNED_PARTIAL' | 'GOVERNED_CANONICAL' | 'DRIFTED' | 'BLOCKED';
export type NormalizationState = 'LEGACY_UNMAPPED' | 'LEGACY_MAPPED' | 'DUAL_BOUND' | 'GEF_CANONICAL_WITH_LEGACY_READ' | 'GEF_CANONICAL' | 'BLOCKED';
export type DriftClass = 'DRIFT_NONE' | 'DOCUMENTATION_DRIFT' | 'IMPLEMENTATION_DRIFT' | 'TEST_DRIFT' | 'GOVERNANCE_DRIFT' | 'ARCHITECTURAL_DRIFT' | 'INTENT_UNKNOWN' | 'CONFLICTING_INTENT' | 'LEGACY_ACCEPTED';
export type ReceiptValidity = 'VALID' | 'STALE' | 'PARTIAL' | 'BLOCKED' | 'PROJECT_MISMATCH' | 'SOURCE_PACK_MISMATCH' | 'POLICY_VERSION_UNSUPPORTED' | 'INDETERMINATE';
export type EquivalenceState = 'EQUIVALENT' | 'NON_EQUIVALENT' | 'INDETERMINATE' | 'UNSUPPORTED_MAPPING';
export type ReversibilityIndex = 'REVERSIBLE_BY_DELETE' | 'REVERSIBLE_BY_ALIAS_RESTORE' | 'REVERSIBLE_BY_TRANSACTION_ROLLBACK' | 'REQUIRES_MIGRATION_ROLLBACK' | 'IRREVERSIBILITY_UNKNOWN';
export type BridgeDirection = 'READ_ONLY' | 'BIDIRECTIONAL_PLANNED' | 'MIGRATION_ONLY';
export type LegacyMappingType = 'ALIAS' | 'PROJECTION' | 'ADAPTER' | 'LEGACY_ACCEPTANCE';
export type DriftResolution = 'ACCEPT_OBSERVED_AS_NORMATIVE' | 'UPDATE_NORMATIVE_TO_APPROVED_INTENT' | 'MIGRATE_IMPLEMENTATION_TO_NORMATIVE' | 'MAP_WITH_ALIAS' | 'LEGACY_ACCEPT_WITH_EXPIRY_OR_REVIEW_TRIGGER' | 'DEFER_QUARANTINED' | 'BLOCK';

export interface DigestPort { algorithm: 'sha256'; digest(input: string): string; }
export interface CancellationPort { isCancelled(): boolean; }
export interface OperationOptions { digest: DigestPort; cancellation?: CancellationPort; maxNodes?: number; maxEdges?: number; maxDepth?: number; }
export interface Diagnostic { code: string; message: string; subject?: string | undefined; }
export type Result<T> = { ok: true; value: T } | { ok: false; diagnostics: readonly Diagnostic[] };

export interface AdoptionIntentInput { projectId:string; mode:AdoptionMode; sourcePackIdentity:string; profileIdentity:string; profileDigest:string; policyVersion:string; decisionRef?:string|undefined; requestedDomains:readonly string[]; excludedDomains?:readonly string[]|undefined; riskClass:'STANDARD'|'ELEVATED'|'HIGH_ASSURANCE'; }
export interface AdoptionIntentCapsule extends AdoptionIntentInput { semanticIdentity:string; }
export interface GovernanceDomainState { domain:string; maturity:GovernanceMaturity; evidenceRefs?:readonly string[]|undefined; }
export interface GovernanceMaturityVector { projectId:string; domains:readonly GovernanceDomainState[]; semanticIdentity:string; }
export interface AdoptionSafetyEnvelope { allowedMutationSurfaces:readonly string[]; forbiddenSurfaces:readonly string[]; reversibleOperations:readonly string[]; preconditions:readonly string[]; requiredChecks:readonly string[]; abortConditions:readonly string[]; rollbackOwner:string; maxUnresolvedSeverity:'LOW'|'MEDIUM'|'HIGH'; }
export interface NewProjectSignals { explicitNewProjectIntent:boolean; conflictingCanonicalSystem:boolean; retainedHistory:boolean; existingReleaseEvidence:boolean; remoteProjectEvidence:boolean; }
export type NewProjectAssessment='TRUE_NEW'|'NEWNESS_UNCERTAIN';
export interface SeedNode { id:string; semanticClass:string; creationMode:'CREATE_FROM_EXPLICIT_INPUT'|'CREATE_SKELETON_REQUIRING_DECISION'|'EXPLICIT_NOT_APPLICABLE'; dependencies?:readonly string[]|undefined; decisionRefs?:readonly string[]|undefined; }
export interface BootstrapSeedGraph { nodes:readonly SeedNode[]; order:readonly string[]; }
export interface KernelEvaluation { complete:boolean; missing:readonly string[]; }
export interface ProvenanceRecord { artifactId:string; sourceRefs:readonly string[]; templateRef?:Readonly<{id:string;version:string;digest:string}>|undefined; semanticOwner:string; generatedDigest:string; validationState:'VALID'|'INCOMPLETE'; }
export interface TruthPair { domain:string; observed:unknown; normative?:unknown; driftClass:DriftClass; evidenceRefs:readonly string[]; legacyAcceptanceRef?:string|undefined; }
export interface LegacyCompatibilityMembrane { id:string; legacySourceIdentity:string; semanticClass:string; mappingType:LegacyMappingType; lossy:boolean; approvalRef?:string|undefined; sourceFingerprint:string; owner:string; mutationPermission?:'NONE'|undefined; }
export interface CompatibilityBridgeContract { id:string; sourceIdentity:string; targetSemanticClass:string; mappingVersion:string; direction:BridgeDirection; lossy:boolean; approvalRef?:string|undefined; conflictBehavior:'FAIL'|'SURFACE_DRIFT'; invalidationFingerprint:string; owner:string; reviewTrigger?:string|undefined; }
export interface AdoptionDependency { domain:string; dependsOn?:readonly string[]|undefined; }
export interface AdoptionSlice { targetDomains:readonly string[]; requiredDomains:readonly string[]; blockedDomains:readonly string[]; optionalCleanup:readonly string[]; }
export interface ProgressiveGovernanceEnvelope { projectId:string; targetDomains:readonly string[]; requiredDomains:readonly string[]; governedDomains:readonly string[]; blockedDomains:readonly string[]; requiredChecks:readonly string[]; safetyEnvelopeIdentity:string; rollbackPlanRef:string; semanticIdentity:string; }
export interface LegacyDebtRecord { id:string; domain:string; sourceBinding:string; driftClass:DriftClass; severity:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'; reason:string; affectedCapabilities:readonly string[]; promotionBlocker:boolean; invalidationCondition?:string|undefined; }
export interface LegacyDebtQuarantine { projectId:string; records:readonly LegacyDebtRecord[]; semanticIdentity:string; }
export interface NormalizationFrontier { projectId:string; domains:readonly {domain:string;state:NormalizationState}[]; }
export interface NormalizationBudget { maxDomains:number; maxMappings:number; maxMigrations:number; maxDependencyExpansion:number; }
export interface NormalizationUsage { domains:number; mappings:number; migrations:number; dependencyExpansion:number; }
export interface CapabilityRequirement { capability:string; domains:readonly {domain:string;minimum:GovernanceMaturity}[]; }
export interface CapabilityUnlock { capability:string; unlocked:boolean; reasons:readonly string[]; }
export interface ProofNodeInput { id:string; payloadDigest:string; dependencies?:readonly string[]|undefined; }
export interface ProofNode { id:string; digest:string; dependencies:readonly string[]; }
export interface GovernanceDeltaReceipt { projectId:string; beforeIdentity:string; afterIdentity:string; frontierMoved:readonly string[]; bridgesAdded:readonly string[]; bridgesRetired:readonly string[]; driftChanges:readonly string[]; quarantineChanges:readonly string[]; capabilitiesUnlocked:readonly string[]; capabilitiesInvalidated:readonly string[]; semanticIdentity:string; }
export interface SourceFingerprintBinding { id:string; fingerprint:string; }
export interface AdoptionReceiptInput { projectId:string; policyVersion:string; mode:AdoptionMode; intentCapsuleIdentity:string; sourcePackIdentity:string; profileIdentity:string; profileDigest:string; maturityVectorIdentity:string; normalizationFrontier:NormalizationFrontier; bridgeIds:readonly string[]; membraneIds:readonly string[]; sourceFingerprints:readonly SourceFingerprintBinding[]; driftSummary:readonly string[]; quarantineIds:readonly string[]; completedIncrementIds:readonly string[]; blockers:readonly string[]; safetyEnvelopeIdentity:string; capabilityUnlocks:readonly CapabilityUnlock[]; governedDomains:readonly string[]; ungovernedDomains:readonly string[]; blockedDomains:readonly string[]; nextSafeSlice?:AdoptionSlice|undefined; }
export interface AdoptionReceipt extends AdoptionReceiptInput { semanticIdentity:string; validity:ReceiptValidity; proofSpine:readonly ProofNode[]; }
export interface ReceiptCurrentBindings { projectId:string; sourcePackIdentity:string; profileIdentity:string; profileDigest:string; policyVersion:string; sourceFingerprints:readonly SourceFingerprintBinding[]; }
export interface AdoptionRegression { code:string; domain?:string|undefined; capability?:string|undefined; bindingId?:string|undefined; message:string; }
