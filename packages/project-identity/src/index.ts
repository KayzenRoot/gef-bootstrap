import type { GefError } from "@gef-bootstrap/contracts";

export type AssuranceLevel = "STANDARD" | "ELEVATED" | "HIGH_ASSURANCE";
export type ProjectIdentityState =
  | "UNADOPTED"
  | "IDENTITY_BOOTSTRAP_REQUIRED"
  | "ADOPTED_VALID"
  | "INVALID_PROJECT_ID"
  | "IDENTITY_CONFLICT";

export type RepositoryIdentityState =
  | "RESOLVED_REMOTE_BOUND"
  | "RESOLVED_LOCAL_ONLY"
  | "UNRESOLVED_NO_REPOSITORY"
  | "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES"
  | "INVALID_OR_UNSAFE_REMOTE";

export type BindingStrength = "PROJECT_ONLY" | "IDENTITY_STATE" | "REPOSITORY_BOUND";
export type FingerprintDeltaClass =
  | "BASELINE_CREATED"
  | "PROJECT_ID_CHANGED"
  | "PROJECT_IDENTITY_CONFIG_CHANGED"
  | "REPOSITORY_BINDING_CHANGED"
  | "IDENTITY_POLICY_VERSION_CHANGED"
  | "FINGERPRINT_ALGORITHM_CHANGED"
  | "MANIFEST_VERSION_CHANGED";

export type CollisionClass =
  | "PROJECT_ID_REPOSITORY_MISMATCH"
  | "DUPLICATE_PROJECT_LINEAGE"
  | "REPOSITORY_BOUND_TO_DIFFERENT_PROJECT"
  | "LOCAL_BINDING_COLLISION"
  | "PROVIDER_BINDING_CONFLICT"
  | "STALE_IDENTITY_ARTIFACT"
  | "AMBIGUOUS_COPY_OR_FORK"
  | "REGISTRY_DUPLICATE_SUSPECTED";

export type IdentityTransitionOperation = "REKEY_PROJECT" | "REBIND_REPOSITORY" | "FORK_ADOPTION" | "IMPORT_RECOVERY";
export type IdentityInvalidationClass = "PROJECT_BOUND" | "REPOSITORY_BOUND";

export interface ProjectIdentityDocument {
  readonly adopted?: unknown;
  readonly projectId?: unknown;
  readonly repositoryBinding?: unknown;
}

export interface ProjectIdentityAssessment {
  readonly state: ProjectIdentityState;
  readonly projectId?: string;
  readonly reasonCode?: string;
}

export interface UuidV4Generator {
  (): string;
}

export interface DigestPort {
  readonly algorithm: string;
  digest(canonicalInput: string): string;
}

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

export interface RemoteObservation {
  readonly alias: string;
  readonly url: string;
  readonly providerHint?: string;
  readonly trustedStableProviderId?: string;
}

export type PersistedRepositoryBinding =
  | {
      readonly bindingKind: "REMOTE";
      readonly normalizedLocator: RepositoryRemoteLocator;
      readonly stableProviderId?: string;
    }
  | {
      readonly bindingKind: "LOCAL";
      readonly localBindingId: string;
    };

export interface RepositoryResolutionInput {
  readonly repositoryPresent: boolean;
  readonly remotes?: readonly RemoteObservation[];
  readonly persistedBinding?: PersistedRepositoryBinding;
}

export interface RepositoryResolution {
  readonly projection: RepositoryIdentityProjection;
  readonly canonicalBindingPersisted: boolean;
  readonly candidateCount: number;
  readonly diagnostics: readonly IdentityDiagnostic[];
}

export interface ProjectConfigIdentityProjection {
  readonly schemaVersion: 1;
  readonly projectId: string;
}

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

export interface ProjectFingerprintSnapshot {
  readonly manifest: ProjectFingerprintManifestV1;
  readonly fingerprint: ProjectFingerprint;
  readonly deltaClasses: readonly FingerprintDeltaClass[];
}

export interface ProjectOnlyBinding {
  readonly bindingStrength: "PROJECT_ONLY";
  readonly projectId: string;
}

export interface IdentityDiagnostic {
  readonly code: string;
  readonly summary: string;
  readonly severity: "ERROR" | "WARNING";
  readonly metadata?: Readonly<Record<string, unknown>>;
}

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
  readonly reasonCode: string;
}

export interface IdentityTransitionState {
  readonly projectId: string;
  readonly projectConfigFingerprint: string;
  readonly repositoryProjection?: RepositoryIdentityProjection;
  readonly repositoryProjectionFingerprint?: string;
  readonly identityFingerprint: string;
}

export interface CreateIdentityTransitionPlanInput {
  readonly operation: IdentityTransitionOperation;
  readonly reason: string;
  readonly current: IdentityTransitionState;
  readonly newRepositoryProjection?: RepositoryIdentityProjection;
  readonly importRecoveryProjectId?: string;
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
  readonly invalidationClasses: readonly IdentityInvalidationClass[];
  readonly acknowledgementRequired: boolean;
  readonly externalEffects: readonly string[];
  readonly planAlgorithm: string;
  readonly planDigest: string;
}

export interface ApplyIdentityTransitionInput {
  readonly current: IdentityTransitionState;
  readonly acknowledged?: boolean;
  readonly workOrderAuthorized?: boolean;
  readonly externalEffectsAuthorized?: boolean;
}

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
  readonly externalEffects: readonly string[];
  readonly planAlgorithm: string;
  readonly planDigest: string;
}

export interface IdentityTransitionResult {
  readonly state: IdentityTransitionState;
  readonly receipt: IdentityTransitionReceipt;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SAFE_STABLE_ID = /^[A-Za-z0-9._:-]{1,256}$/;
const SAFE_LOCAL_BINDING_ID = /^[A-Za-z0-9._:-]{1,256}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableNormalize);
  if (!isRecord(value)) return value;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) output[key] = stableNormalize(value[key]);
  return output;
}

export function canonicalIdentityStringify(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

export function isCanonicalProjectId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

export function generateProjectId(generator: UuidV4Generator): string {
  const value = generator();
  if (!isCanonicalProjectId(value)) throw new Error("gef.identity.generated_project_id_invalid");
  return value;
}

export function assessProjectIdentity(document: ProjectIdentityDocument | null | undefined): ProjectIdentityAssessment {
  if (!document || document.adopted !== true) return { state: "UNADOPTED" };
  if (document.projectId === undefined || document.projectId === null || document.projectId === "") {
    return { state: "IDENTITY_BOOTSTRAP_REQUIRED", reasonCode: "gef.identity.bootstrap_required" };
  }
  if (!isCanonicalProjectId(document.projectId)) {
    return { state: "INVALID_PROJECT_ID", reasonCode: "gef.identity.project_id_invalid" };
  }
  return { state: "ADOPTED_VALID", projectId: document.projectId };
}

export function createProjectOnlyBinding(projectId: unknown): ProjectOnlyBinding {
  if (!isCanonicalProjectId(projectId)) throw new Error("gef.identity.project_id_invalid");
  return { bindingStrength: "PROJECT_ONLY", projectId };
}

function hostLooksUnsafe(host: string): boolean {
  return host.length === 0 || host.length > 253 || /[\s\\/@?#]/.test(host) || host.includes("..");
}

function normalizeRepositoryPath(rawPath: string): string | null {
  let path = rawPath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (path.endsWith(".git")) path = path.slice(0, -4);
  if (path.length === 0 || path.length > 1024 || /[\u0000-\u001f\u007f?#]/.test(path)) return null;
  const segments = path.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) return null;
  return segments.join("/");
}

export function normalizeRemoteLocator(observation: RemoteObservation): RepositoryRemoteLocator | null {
  const raw = observation.url.trim();
  if (raw.length === 0 || raw.length > 4096 || /[\u0000-\u001f\u007f]/.test(raw)) return null;

  let host: string;
  let path: string;
  if (raw.includes("://") && !/^https:\/\//i.test(raw) && !/^ssh:\/\//i.test(raw)) return null;
  if (/^https:\/\//i.test(raw) || /^ssh:\/\//i.test(raw)) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return null;
    }
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "https:" && protocol !== "ssh:") return null;
    host = parsed.hostname.toLowerCase();
    path = parsed.pathname;
  } else {
    const scp = /^(?:[^@\s/:]+@)?([^\s/:]+):(.+)$/.exec(raw);
    if (!scp || scp[1] === undefined || scp[2] === undefined) return null;
    host = scp[1].toLowerCase();
    path = scp[2].split(/[?#]/, 1)[0] ?? "";
  }

  if (hostLooksUnsafe(host)) return null;
  const normalizedRepositoryPath = normalizeRepositoryPath(path);
  if (!normalizedRepositoryPath) return null;
  return {
    transportIndependentHost: host,
    normalizedRepositoryPath,
    ...(observation.providerHint ? { providerHint: observation.providerHint } : {}),
  };
}

function stableProviderId(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return SAFE_STABLE_ID.test(value) ? value : undefined;
}

export function repositoryLocatorEqual(a: RepositoryRemoteLocator | undefined, b: RepositoryRemoteLocator | undefined): boolean {
  if (!a || !b) return false;
  return a.transportIndependentHost === b.transportIndependentHost && a.normalizedRepositoryPath === b.normalizedRepositoryPath;
}

export function repositoryIdentityEqual(a: RepositoryIdentityProjection | undefined, b: RepositoryIdentityProjection | undefined): boolean {
  if (!a || !b) return false;
  if (a.state !== b.state || a.bindingKind !== b.bindingKind) return false;
  if (a.bindingKind === "LOCAL") return Boolean(a.localBindingId && b.localBindingId && a.localBindingId === b.localBindingId);
  if (a.bindingKind === "REMOTE") {
    if (a.stableProviderId !== undefined && b.stableProviderId !== undefined) return a.stableProviderId === b.stableProviderId;
    return repositoryLocatorEqual(a.normalizedLocator, b.normalizedLocator);
  }
  return a.state === "UNRESOLVED_NO_REPOSITORY";
}

function persistedRemoteMatches(binding: Extract<PersistedRepositoryBinding, { bindingKind: "REMOTE" }>, candidate: RepositoryIdentityProjection): boolean {
  if (candidate.bindingKind !== "REMOTE") return false;
  if (binding.stableProviderId !== undefined && candidate.stableProviderId !== undefined) return binding.stableProviderId === candidate.stableProviderId;
  return repositoryLocatorEqual(binding.normalizedLocator, candidate.normalizedLocator);
}

function remoteCandidateKey(projection: RepositoryIdentityProjection): string {
  if (projection.stableProviderId) return `stable:${projection.stableProviderId}`;
  const locator = projection.normalizedLocator;
  return locator ? `locator:${locator.transportIndependentHost}/${locator.normalizedRepositoryPath}` : "invalid";
}

export function resolveRepositoryIdentity(input: RepositoryResolutionInput): RepositoryResolution {
  if (!input.repositoryPresent) {
    return {
      projection: { schemaVersion: 1, state: "UNRESOLVED_NO_REPOSITORY", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: 0,
      diagnostics: [],
    };
  }

  const remotes = input.remotes ?? [];
  if (remotes.length === 0) {
    if (input.persistedBinding?.bindingKind === "LOCAL" && SAFE_LOCAL_BINDING_ID.test(input.persistedBinding.localBindingId)) {
      return {
        projection: { schemaVersion: 1, state: "RESOLVED_LOCAL_ONLY", bindingKind: "LOCAL", localBindingId: input.persistedBinding.localBindingId, normalizationVersion: 1 },
        canonicalBindingPersisted: true,
        candidateCount: 0,
        diagnostics: [],
      };
    }
    return {
      projection: { schemaVersion: 1, state: "RESOLVED_LOCAL_ONLY", bindingKind: "LOCAL", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: 0,
      diagnostics: [{ code: "gef.identity.local_binding_required", summary: "Local-only repository requires a persisted repositoryBindingId before repository-bound use.", severity: "WARNING" }],
    };
  }

  const candidates = new Map<string, RepositoryIdentityProjection>();
  for (const remote of remotes) {
    const locator = normalizeRemoteLocator(remote);
    const trustedId = stableProviderId(remote.trustedStableProviderId);
    if (!locator || (remote.trustedStableProviderId !== undefined && trustedId === undefined)) {
      return {
        projection: { schemaVersion: 1, state: "INVALID_OR_UNSAFE_REMOTE", normalizationVersion: 1 },
        canonicalBindingPersisted: false,
        candidateCount: 0,
        diagnostics: [{ code: "gef.identity.remote_invalid_or_unsafe", summary: "A repository remote could not be normalized safely.", severity: "ERROR", metadata: { alias: remote.alias } }],
      };
    }
    const projection: RepositoryIdentityProjection = {
      schemaVersion: 1,
      state: "RESOLVED_REMOTE_BOUND",
      bindingKind: "REMOTE",
      normalizedLocator: locator,
      ...(trustedId ? { stableProviderId: trustedId } : {}),
      normalizationVersion: 1,
    };
    const key = remoteCandidateKey(projection);
    const previous = candidates.get(key);
    if (previous && !repositoryIdentityEqual(previous, projection)) {
      return {
        projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
        canonicalBindingPersisted: false,
        candidateCount: candidates.size + 1,
        diagnostics: [{ code: "gef.identity.provider_binding_conflict", summary: "Trusted provider identity maps to conflicting repository locators.", severity: "ERROR" }],
      };
    }
    candidates.set(key, projection);
  }

  const unique = [...candidates.values()];
  const persisted = input.persistedBinding;
  if (persisted?.bindingKind === "REMOTE") {
    const matches = unique.filter((candidate) => persistedRemoteMatches(persisted, candidate));
    if (matches.length === 1) {
      const selected = matches[0];
      if (!selected) throw new Error("gef.identity.internal_missing_candidate");
      const stableId = persisted.stableProviderId ?? selected.stableProviderId;
      return {
        projection: { ...selected, ...(stableId ? { stableProviderId: stableId } : {}) },
        canonicalBindingPersisted: true,
        candidateCount: unique.length,
        diagnostics: [],
      };
    }
    return {
      projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: unique.length,
      diagnostics: [{ code: "gef.identity.persisted_remote_mismatch", summary: "Persisted repository binding does not match observed remote candidates.", severity: "ERROR" }],
    };
  }

  if (persisted?.bindingKind === "LOCAL") {
    return {
      projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
      canonicalBindingPersisted: false,
      candidateCount: unique.length,
      diagnostics: [{ code: "gef.identity.binding_kind_conflict", summary: "Persisted local binding conflicts with observed remote repository state.", severity: "ERROR" }],
    };
  }

  if (unique.length === 1) {
    const selected = unique[0];
    if (!selected) throw new Error("gef.identity.internal_missing_candidate");
    return {
      projection: selected,
      canonicalBindingPersisted: false,
      candidateCount: 1,
      diagnostics: [{ code: "gef.identity.remote_binding_materialization_required", summary: "Single safe remote candidate must be explicitly persisted before canonical repository-bound use.", severity: "WARNING" }],
    };
  }

  return {
    projection: { schemaVersion: 1, state: "CONFLICT_MULTIPLE_CANONICAL_CANDIDATES", normalizationVersion: 1 },
    canonicalBindingPersisted: false,
    candidateCount: unique.length,
    diagnostics: [{ code: "gef.identity.multiple_remote_candidates", summary: "Multiple repository candidates require explicit governed binding.", severity: "ERROR" }],
  };
}

export function repositoryResolutionSatisfiesBound(resolution: RepositoryResolution): boolean {
  if (!resolution.canonicalBindingPersisted) return false;
  const projection = resolution.projection;
  if (projection.state === "RESOLVED_REMOTE_BOUND") return projection.bindingKind === "REMOTE" && projection.normalizedLocator !== undefined;
  if (projection.state === "RESOLVED_LOCAL_ONLY") return projection.bindingKind === "LOCAL" && Boolean(projection.localBindingId);
  return false;
}

export function createFingerprintManifest(projectId: unknown, repositoryIdentityProjection: RepositoryIdentityProjection, identityPolicyVersion: string): ProjectFingerprintManifestV1 {
  if (!isCanonicalProjectId(projectId)) throw new Error("gef.identity.project_id_invalid");
  if (!identityPolicyVersion || identityPolicyVersion.length > 128) throw new Error("gef.identity.policy_version_invalid");
  return {
    manifestVersion: 1,
    projectId,
    projectConfigIdentityProjection: { schemaVersion: 1, projectId },
    repositoryIdentityProjection,
    identityPolicyVersion,
  };
}

function classifyFingerprintDelta(previous: ProjectFingerprintSnapshot | undefined, manifest: ProjectFingerprintManifestV1, algorithm: string): FingerprintDeltaClass[] {
  if (!previous) return ["BASELINE_CREATED"];
  const deltas: FingerprintDeltaClass[] = [];
  if (previous.fingerprint.manifestVersion !== manifest.manifestVersion) deltas.push("MANIFEST_VERSION_CHANGED");
  if (previous.fingerprint.algorithm !== algorithm) deltas.push("FINGERPRINT_ALGORITHM_CHANGED");
  if (previous.manifest.projectId !== manifest.projectId) deltas.push("PROJECT_ID_CHANGED");
  if (canonicalIdentityStringify(previous.manifest.projectConfigIdentityProjection) !== canonicalIdentityStringify(manifest.projectConfigIdentityProjection)) deltas.push("PROJECT_IDENTITY_CONFIG_CHANGED");
  if (canonicalIdentityStringify(previous.manifest.repositoryIdentityProjection) !== canonicalIdentityStringify(manifest.repositoryIdentityProjection)) deltas.push("REPOSITORY_BINDING_CHANGED");
  if (previous.manifest.identityPolicyVersion !== manifest.identityPolicyVersion) deltas.push("IDENTITY_POLICY_VERSION_CHANGED");
  return deltas;
}

export function createProjectFingerprint(
  manifest: ProjectFingerprintManifestV1,
  bindingStrength: "IDENTITY_STATE" | "REPOSITORY_BOUND",
  digestPort: DigestPort,
  previous?: ProjectFingerprintSnapshot,
  repositoryBindingPersisted = false,
): ProjectFingerprintSnapshot {
  if (!digestPort.algorithm || digestPort.algorithm.length > 128) throw new Error("gef.identity.digest_algorithm_invalid");
  if (bindingStrength === "REPOSITORY_BOUND") {
    const projection = manifest.repositoryIdentityProjection;
    const materiallyBound =
      (projection.state === "RESOLVED_REMOTE_BOUND" && projection.bindingKind === "REMOTE" && projection.normalizedLocator !== undefined) ||
      (projection.state === "RESOLVED_LOCAL_ONLY" && projection.bindingKind === "LOCAL" && Boolean(projection.localBindingId));
    if (!repositoryBindingPersisted || !materiallyBound) throw new Error("gef.identity.repository_bound_requirement_unsatisfied");
  }
  const digest = digestPort.digest(canonicalIdentityStringify(manifest));
  if (!digest || digest.length > 1024) throw new Error("gef.identity.digest_invalid");
  return {
    manifest,
    fingerprint: {
      schemaVersion: 1,
      manifestVersion: 1,
      algorithm: digestPort.algorithm,
      digest,
      bindingStrength,
      repositoryProjectionState: manifest.repositoryIdentityProjection.state,
    },
    deltaClasses: classifyFingerprintDelta(previous, manifest, digestPort.algorithm),
  };
}

const BINDING_RANK: Readonly<Record<BindingStrength, number>> = { PROJECT_ONLY: 1, IDENTITY_STATE: 2, REPOSITORY_BOUND: 3 };

export function bindingStrengthSatisfies(actual: BindingStrength, required: BindingStrength): boolean {
  return BINDING_RANK[actual] >= BINDING_RANK[required];
}

function sameLocalBinding(a: RepositoryIdentityProjection | undefined, b: RepositoryIdentityProjection | undefined): boolean {
  return a?.bindingKind === "LOCAL" && b?.bindingKind === "LOCAL" && Boolean(a.localBindingId && b.localBindingId && a.localBindingId === b.localBindingId);
}

function providerConflict(a: RepositoryIdentityProjection | undefined, b: RepositoryIdentityProjection | undefined): boolean {
  if (a?.bindingKind !== "REMOTE" || b?.bindingKind !== "REMOTE") return false;
  if (a.stableProviderId === undefined || b.stableProviderId === undefined) return false;
  return a.stableProviderId !== b.stableProviderId && repositoryLocatorEqual(a.normalizedLocator, b.normalizedLocator);
}

export function assessIdentityCollision(input: CollisionAssessmentInput): CollisionAssessment {
  if (!isCanonicalProjectId(input.currentProjectId) || !isCanonicalProjectId(input.candidateProjectId)) {
    return { collision: "AMBIGUOUS_COPY_OR_FORK", blocksGovernedMutation: true, reasonCode: "gef.identity.collision_input_invalid" };
  }
  if (input.artifactIsStale) return { collision: "STALE_IDENTITY_ARTIFACT", blocksGovernedMutation: true, reasonCode: "gef.identity.stale_identity_artifact" };
  if (input.copyOrForkAmbiguous) return { collision: "AMBIGUOUS_COPY_OR_FORK", blocksGovernedMutation: true, reasonCode: "gef.identity.copy_or_fork_ambiguous" };
  if (providerConflict(input.currentRepository, input.candidateRepository)) {
    return { collision: "PROVIDER_BINDING_CONFLICT", blocksGovernedMutation: true, reasonCode: "gef.identity.provider_binding_conflict" };
  }
  const sameProject = input.currentProjectId === input.candidateProjectId;
  const repositoryComparable = input.currentRepository !== undefined && input.candidateRepository !== undefined;
  const sameRepository = repositoryComparable && repositoryIdentityEqual(input.currentRepository, input.candidateRepository);

  if (input.registryEvidenceOnly && sameProject && repositoryComparable && !sameRepository) {
    return { collision: "REGISTRY_DUPLICATE_SUSPECTED", blocksGovernedMutation: false, reasonCode: "gef.identity.registry_duplicate_suspected" };
  }
  if (sameLocalBinding(input.currentRepository, input.candidateRepository) && input.independentLineageClaimed) {
    return { collision: "LOCAL_BINDING_COLLISION", blocksGovernedMutation: true, reasonCode: "gef.identity.local_binding_collision" };
  }
  if (sameProject && (!repositoryComparable || sameRepository)) return { collision: null, blocksGovernedMutation: false, reasonCode: "gef.identity.same_lineage_compatible" };
  if (sameProject && input.independentLineageClaimed) return { collision: "DUPLICATE_PROJECT_LINEAGE", blocksGovernedMutation: true, reasonCode: "gef.identity.duplicate_project_lineage" };
  if (sameProject && repositoryComparable && !sameRepository) return { collision: "PROJECT_ID_REPOSITORY_MISMATCH", blocksGovernedMutation: true, reasonCode: "gef.identity.project_repository_mismatch" };
  if (!sameProject && sameRepository) return { collision: "REPOSITORY_BOUND_TO_DIFFERENT_PROJECT", blocksGovernedMutation: true, reasonCode: "gef.identity.repository_bound_to_different_project" };
  return { collision: null, blocksGovernedMutation: false, reasonCode: "gef.identity.independent_bindings" };
}

function assuranceRank(value: AssuranceLevel): number {
  return value === "STANDARD" ? 1 : value === "ELEVATED" ? 2 : 3;
}

function projectionDigest(projection: RepositoryIdentityProjection | undefined, digestPort: DigestPort): string | undefined {
  return projection ? digestPort.digest(canonicalIdentityStringify(projection)) : undefined;
}

function defaultInvalidation(operation: IdentityTransitionOperation): readonly IdentityInvalidationClass[] {
  return operation === "REBIND_REPOSITORY" ? ["REPOSITORY_BOUND"] : ["PROJECT_BOUND", "REPOSITORY_BOUND"];
}

export function createIdentityTransitionPlan(
  input: CreateIdentityTransitionPlanInput,
  digestPort: DigestPort,
  uuidGenerator: UuidV4Generator,
): IdentityTransitionPlan {
  if (!isCanonicalProjectId(input.current.projectId)) throw new Error("gef.identity.current_project_id_invalid");
  if (!input.reason || input.reason.length > 512) throw new Error("gef.identity.transition_reason_invalid");
  if (input.operation === "REBIND_REPOSITORY" && input.newRepositoryProjection === undefined) throw new Error("gef.identity.rebind_target_required");
  if (input.operation !== "REBIND_REPOSITORY" && input.operation !== "IMPORT_RECOVERY" && input.importRecoveryProjectId !== undefined) {
    throw new Error("gef.identity.caller_supplied_project_id_forbidden");
  }

  let newProjectId: string | undefined;
  if (input.operation === "REKEY_PROJECT" || input.operation === "FORK_ADOPTION") newProjectId = generateProjectId(uuidGenerator);
  if (input.operation === "IMPORT_RECOVERY") {
    if (!isCanonicalProjectId(input.importRecoveryProjectId) || input.importRecoveryProjectId === input.current.projectId) {
      throw new Error("gef.identity.import_recovery_project_id_invalid");
    }
    newProjectId = input.importRecoveryProjectId;
  }

  const externalEffects = [...(input.externalEffects ?? [])];
  const acknowledgementRequired = input.operation === "FORK_ADOPTION" || input.operation === "REKEY_PROJECT" || input.operation === "IMPORT_RECOVERY" || assuranceRank(input.assurance) >= assuranceRank("ELEVATED");
  const body = {
    schemaVersion: 1 as const,
    operation: input.operation,
    reason: input.reason,
    assurance: input.assurance,
    ...(input.collisionClass ? { collisionClass: input.collisionClass } : {}),
    expectedProjectId: input.current.projectId,
    expectedProjectConfigFingerprint: input.current.projectConfigFingerprint,
    ...(input.current.repositoryProjectionFingerprint ? { expectedRepositoryProjectionFingerprint: input.current.repositoryProjectionFingerprint } : {}),
    oldIdentityFingerprint: input.current.identityFingerprint,
    ...(newProjectId ? { newProjectId } : {}),
    ...(input.newRepositoryProjection ? { newRepositoryProjection: input.newRepositoryProjection } : {}),
    invalidationClasses: [...(input.invalidationClasses ?? defaultInvalidation(input.operation))],
    acknowledgementRequired,
    externalEffects,
  };
  const planDigest = digestPort.digest(canonicalIdentityStringify(body));
  if (!planDigest) throw new Error("gef.identity.plan_digest_invalid");
  return { ...body, planAlgorithm: digestPort.algorithm, planDigest };
}

function assertCurrentMatchesPlan(plan: IdentityTransitionPlan, current: IdentityTransitionState): void {
  if (current.projectId !== plan.expectedProjectId || current.projectConfigFingerprint !== plan.expectedProjectConfigFingerprint) {
    throw new Error("gef.identity.transition_plan_stale");
  }
  if ((current.repositoryProjectionFingerprint ?? undefined) !== (plan.expectedRepositoryProjectionFingerprint ?? undefined)) {
    throw new Error("gef.identity.transition_plan_stale");
  }
  if (current.identityFingerprint !== plan.oldIdentityFingerprint) throw new Error("gef.identity.transition_plan_stale");
}

export function applyIdentityTransitionPlan(
  plan: IdentityTransitionPlan,
  input: ApplyIdentityTransitionInput,
  digestPort: DigestPort,
): IdentityTransitionResult {
  assertCurrentMatchesPlan(plan, input.current);
  if (digestPort.algorithm !== plan.planAlgorithm) throw new Error("gef.identity.transition_digest_algorithm_changed");
  if (plan.acknowledgementRequired && !input.acknowledged) throw new Error("gef.identity.transition_acknowledgement_required");
  if (plan.operation === "REBIND_REPOSITORY" && plan.assurance === "STANDARD" && !input.workOrderAuthorized) {
    throw new Error("gef.identity.work_order_authorization_required");
  }
  if (plan.externalEffects.length > 0 && !input.externalEffectsAuthorized) throw new Error("gef.identity.external_effect_authorization_required");

  const projectId = plan.newProjectId ?? input.current.projectId;
  const repositoryProjection = plan.newRepositoryProjection ?? input.current.repositoryProjection;
  const repositoryProjectionFingerprint = projectionDigest(repositoryProjection, digestPort);
  const identityFingerprint = digestPort.digest(canonicalIdentityStringify({ projectId, repositoryProjection }));
  if (!identityFingerprint) throw new Error("gef.identity.new_identity_digest_invalid");

  const state: IdentityTransitionState = {
    projectId,
    projectConfigFingerprint: input.current.projectConfigFingerprint,
    ...(repositoryProjection ? { repositoryProjection } : {}),
    ...(repositoryProjectionFingerprint ? { repositoryProjectionFingerprint } : {}),
    identityFingerprint,
  };
  const receipt: IdentityTransitionReceipt = {
    schemaVersion: 1,
    operation: plan.operation,
    reason: plan.reason,
    oldProjectId: input.current.projectId,
    ...(plan.newProjectId ? { newProjectId: plan.newProjectId } : {}),
    ...(input.current.repositoryProjectionFingerprint ? { oldRepositoryProjectionFingerprint: input.current.repositoryProjectionFingerprint } : {}),
    ...(repositoryProjectionFingerprint ? { newRepositoryProjectionFingerprint: repositoryProjectionFingerprint } : {}),
    oldIdentityFingerprint: input.current.identityFingerprint,
    newIdentityFingerprint: identityFingerprint,
    invalidationClasses: plan.invalidationClasses,
    externalEffects: plan.externalEffects,
    planAlgorithm: plan.planAlgorithm,
    planDigest: plan.planDigest,
  };
  return { state, receipt };
}

export function identityDiagnosticsToGefError(diagnostics: readonly IdentityDiagnostic[], commandId?: string, runId?: string): GefError {
  const first = diagnostics[0];
  return {
    schemaVersion: 1,
    id: `identity:${first?.code ?? "unknown"}`,
    category: first?.severity === "WARNING" ? "PRECONDITION" : "INTEGRITY",
    reasonCode: first?.code ?? "gef.identity.invalid",
    severity: first?.severity === "WARNING" ? "WARNING" : "ERROR",
    summary: first?.summary ?? "Project identity validation failed.",
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    effectStatus: "NONE",
    ...(commandId ? { commandId } : {}),
    ...(runId ? { runId } : {}),
    causes: diagnostics.slice(1, 8).map((item, index) => ({ id: `identity-${index + 1}`, reasonCode: item.code, summary: item.summary })),
    evidenceRefs: [],
    remediations: [{ actionId: "gef.identity.resolve" }],
    metadata: { diagnostics: diagnostics.slice(0, 16).map((item) => ({ code: item.code, severity: item.severity })) },
  };
}
