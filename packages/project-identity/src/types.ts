export type AssuranceLevel = "STANDARD" | "ELEVATED" | "HIGH_ASSURANCE";
export type ProjectIdentityState = "UNADOPTED" | "IDENTITY_BOOTSTRAP_REQUIRED" | "ADOPTED_VALID" | "INVALID_PROJECT_ID" | "IDENTITY_CONFLICT";
export type RepositoryIdentityState = "RESOLVED_REMOTE_BOUND" | "RESOLVED_LOCAL_ONLY" | "UNRESOLVED_NO_REPOSITORY" | "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES" | "INVALID_OR_UNSAFE_REMOTE";
export type BindingStrength = "PROJECT_ONLY" | "IDENTITY_STATE" | "REPOSITORY_BOUND";
export type FingerprintDeltaClass = "BASELINE_CREATED" | "PROJECT_ID_CHANGED" | "PROJECT_IDENTITY_CONFIG_CHANGED" | "REPOSITORY_BINDING_CHANGED" | "IDENTITY_POLICY_VERSION_CHANGED" | "FINGERPRINT_ALGORITHM_CHANGED" | "MANIFEST_VERSION_CHANGED";
export type CollisionClass = "PROJECT_ID_REPOSITORY_MISMATCH" | "DUPLICATE_PROJECT_LINEAGE" | "REPOSITORY_BOUND_TO_DIFFERENT_PROJECT" | "LOCAL_BINDING_COLLISION" | "PROVIDER_BINDING_CONFLICT" | "STALE_IDENTITY_ARTIFACT" | "AMBIGUOUS_COPY_OR_FORK" | "REGISTRY_DUPLICATE_SUSPECTED";
export type IdentityTransitionOperation = "REKEY_PROJECT" | "REBIND_REPOSITORY" | "FORK_ADOPTION" | "IMPORT_RECOVERY";
export type IdentityInvalidationClass = "PROJECT_BOUND" | "REPOSITORY_BOUND";

export interface ProjectIdentityDocument { readonly adopted?: unknown; readonly projectId?: unknown; readonly repositoryBinding?: unknown }
export interface ProjectIdentityAssessmentContext { readonly identityPreviouslyEstablished?: boolean; readonly expectedProjectId?: string }
export interface ProjectIdentityAssessment { readonly state: ProjectIdentityState; readonly projectId?: string; readonly reasonCode?: string }
export interface FormalAdoptionIdentity { readonly adopted: true; readonly projectId: string }
export interface UuidV4Generator { (): string }
export interface DigestPort { readonly algorithm: string; digest(canonicalInput: string): string }

export interface RepositoryRemoteLocator {
  readonly transportIndependentHost: string;
  readonly normalizedRepositoryPath: string;
  readonly providerHint?: string;
}
export interface RepositoryIdentityProjection {
  readonly schemaVersion: 1;
  readonly state: RepositoryIdentityState;
  readonly bindingKind?: "REMOTE" | "LOCAL";
  readonly normalizedLocator?: RepositoryRemoteLocator;
  readonly stableProviderId?: string;
  readonly localBindingId?: string;
  readonly normalizationVersion: 1;
}
export interface RemoteObservation { readonly alias: string; readonly url: string; readonly providerHint?: string; readonly trustedStableProviderId?: string }
export type PersistedRepositoryBinding =
  | { readonly bindingKind: "REMOTE"; readonly normalizedLocator: RepositoryRemoteLocator; readonly stableProviderId?: string }
  | { readonly bindingKind: "LOCAL"; readonly localBindingId: string };
export type PersistedRepositoryBindingParseResult =
  | { readonly ok: true; readonly value: PersistedRepositoryBinding }
  | { readonly ok: false; readonly diagnostic: IdentityDiagnostic };
export interface RepositoryResolutionInput { readonly repositoryPresent: boolean; readonly remotes?: readonly RemoteObservation[]; readonly persistedBinding?: PersistedRepositoryBinding }
export interface RepositoryResolution { readonly projection: RepositoryIdentityProjection; readonly canonicalBindingPersisted: boolean; readonly candidateCount: number; readonly diagnostics: readonly IdentityDiagnostic[] }

export interface ProjectConfigIdentityProjection { readonly schemaVersion: 1; readonly projectId: string }
export interface ProjectFingerprintManifestV1 {
  readonly manifestVersion: 1;
  readonly projectId: string;
  readonly projectConfigIdentityProjection: ProjectConfigIdentityProjection;
  readonly repositoryIdentityProjection: RepositoryIdentityProjection;
  readonly identityPolicyVersion: string;
}
export interface ProjectFingerprint {
  readonly schemaVersion: 1;
  readonly manifestVersion: 1;
  readonly algorithm: string;
  readonly digest: string;
  readonly bindingStrength: "IDENTITY_STATE" | "REPOSITORY_BOUND";
  readonly repositoryProjectionState: RepositoryIdentityState;
}
export interface ProjectFingerprintSnapshot { readonly manifest: ProjectFingerprintManifestV1; readonly fingerprint: ProjectFingerprint; readonly deltaClasses: readonly FingerprintDeltaClass[] }
export interface ProjectOnlyBinding { readonly bindingStrength: "PROJECT_ONLY"; readonly projectId: string }

export interface IdentityDiagnostic { readonly code: string; readonly summary: string; readonly severity: "ERROR" | "WARNING"; readonly metadata?: Readonly<Record<string, unknown>> }
export interface CollisionAssessmentInput {
  readonly currentProjectId: string;
  readonly candidateProjectId: string;
  readonly currentRepository?: RepositoryIdentityProjection;
  readonly candidateRepository?: RepositoryIdentityProjection;
  readonly independentLineageClaimed?: boolean;
  readonly registryEvidenceOnly?: boolean;
  readonly artifactIsStale?: boolean;
  readonly copyOrForkAmbiguous?: boolean;
}
export interface CollisionAssessment {
  readonly collision: CollisionClass | null;
  readonly blocksGovernedMutation: boolean;
  readonly restriction: "NONE" | "LOCAL_SAFE_ONLY" | "BLOCK_ALL";
  readonly reasonCode: string;
}

export interface IdentityTransitionState {
  readonly projectId: string;
  readonly projectConfigFingerprint: string;
  readonly repositoryProjection?: RepositoryIdentityProjection;
  readonly repositoryProjectionFingerprint?: string;
  readonly identityFingerprint: string;
}
export interface ImportRecoveryEvidence {
  readonly sourceRef: string;
  readonly authorityRef: string;
  readonly collisionCheck: "NO_AUTHORITATIVE_CONFLICT";
}
export interface CreateIdentityTransitionPlanInput {
  readonly operation: IdentityTransitionOperation;
  readonly reason: string;
  readonly current: IdentityTransitionState;
  readonly newRepositoryProjection?: RepositoryIdentityProjection;
  readonly importRecoveryProjectId?: string;
  readonly importRecoveryEvidence?: ImportRecoveryEvidence;
  readonly assurance: AssuranceLevel;
  readonly collisionClass?: CollisionClass;
  readonly externalEffects?: readonly string[];
  readonly invalidationClasses?: readonly IdentityInvalidationClass[];
}
export interface IdentityTransitionPlan {
  readonly schemaVersion: 1;
  readonly operation: IdentityTransitionOperation;
  readonly reason: string;
  readonly assurance: AssuranceLevel;
  readonly collisionClass?: CollisionClass;
  readonly expectedProjectId: string;
  readonly expectedProjectConfigFingerprint: string;
  readonly expectedRepositoryProjectionFingerprint?: string;
  readonly oldIdentityFingerprint: string;
  readonly newProjectId?: string;
  readonly newRepositoryProjection?: RepositoryIdentityProjection;
  readonly importRecoveryEvidence?: ImportRecoveryEvidence;
  readonly invalidationClasses: readonly IdentityInvalidationClass[];
  readonly acknowledgementRequired: boolean;
  readonly externalEffects: readonly string[];
  readonly planAlgorithm: string;
  readonly planDigest: string;
}
export interface ApplyIdentityTransitionInput { readonly current: IdentityTransitionState; readonly acknowledged?: boolean; readonly workOrderAuthorized?: boolean; readonly externalEffectsAuthorized?: boolean }
export interface IdentityTransitionReceipt {
  readonly schemaVersion: 1;
  readonly operation: IdentityTransitionOperation;
  readonly reason: string;
  readonly oldProjectId: string;
  readonly newProjectId?: string;
  readonly oldRepositoryProjectionFingerprint?: string;
  readonly newRepositoryProjectionFingerprint?: string;
  readonly oldIdentityFingerprint: string;
  readonly newIdentityFingerprint: string;
  readonly invalidationClasses: readonly IdentityInvalidationClass[];
  readonly recoveryReference?: string;
  readonly externalEffects: readonly string[];
  readonly planAlgorithm: string;
  readonly planDigest: string;
}
export interface IdentityTransitionResult { readonly state: IdentityTransitionState; readonly receipt: IdentityTransitionReceipt }
