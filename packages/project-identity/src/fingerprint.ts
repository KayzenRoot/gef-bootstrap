import { canonicalIdentityStringify } from "./canonical.js";
import { canonicalizeRepositoryIdentityProjection } from "./projection.js";
import { isCanonicalProjectId } from "./project-id.js";
import type {
  BindingStrength,
  DigestPort,
  FingerprintDeltaClass,
  ProjectFingerprintManifestV1,
  ProjectFingerprintSnapshot,
  RepositoryIdentityProjection,
} from "./types.js";

export function createFingerprintManifest(projectId: unknown, repositoryIdentityProjection: RepositoryIdentityProjection, identityPolicyVersion: string): ProjectFingerprintManifestV1 {
  if (!isCanonicalProjectId(projectId)) throw new Error("gef.identity.project_id_invalid");
  if (!identityPolicyVersion || identityPolicyVersion.length > 128) throw new Error("gef.identity.policy_version_invalid");
  return {
    manifestVersion: 1,
    projectId,
    projectConfigIdentityProjection: { schemaVersion: 1, projectId },
    repositoryIdentityProjection: canonicalizeRepositoryIdentityProjection(repositoryIdentityProjection),
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
  if (manifest.manifestVersion !== 1) throw new Error("gef.identity.manifest_version_invalid");
  const canonicalManifest = createFingerprintManifest(manifest.projectId, manifest.repositoryIdentityProjection, manifest.identityPolicyVersion);
  if (canonicalIdentityStringify(manifest.projectConfigIdentityProjection) !== canonicalIdentityStringify(canonicalManifest.projectConfigIdentityProjection)) throw new Error("gef.identity.project_config_projection_invalid");
  if (!digestPort.algorithm || digestPort.algorithm.length > 128) throw new Error("gef.identity.digest_algorithm_invalid");
  if (bindingStrength === "REPOSITORY_BOUND") {
    const projection = canonicalManifest.repositoryIdentityProjection;
    const materiallyBound =
      (projection.state === "RESOLVED_REMOTE_BOUND" && projection.bindingKind === "REMOTE" && projection.normalizedLocator !== undefined) ||
      (projection.state === "RESOLVED_LOCAL_ONLY" && projection.bindingKind === "LOCAL" && Boolean(projection.localBindingId));
    if (!repositoryBindingPersisted || !materiallyBound) throw new Error("gef.identity.repository_bound_requirement_unsatisfied");
  }
  const digest = digestPort.digest(canonicalIdentityStringify(canonicalManifest));
  if (!digest || digest.length > 1024) throw new Error("gef.identity.digest_invalid");
  return {
    manifest: canonicalManifest,
    fingerprint: {
      schemaVersion: 1,
      manifestVersion: 1,
      algorithm: digestPort.algorithm,
      digest,
      bindingStrength,
      repositoryProjectionState: canonicalManifest.repositoryIdentityProjection.state,
    },
    deltaClasses: classifyFingerprintDelta(previous, canonicalManifest, digestPort.algorithm),
  };
}

const BINDING_RANK: Readonly<Record<BindingStrength, number>> = { PROJECT_ONLY: 1, IDENTITY_STATE: 2, REPOSITORY_BOUND: 3 };

export function bindingStrengthSatisfies(actual: BindingStrength, required: BindingStrength): boolean {
  return BINDING_RANK[actual] >= BINDING_RANK[required];
}
