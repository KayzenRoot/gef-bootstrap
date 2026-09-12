import { isCanonicalProjectId } from "./project-id.js";
import { repositoryIdentityEqual, repositoryLocatorEqual } from "./repository.js";
import type { CollisionAssessment, CollisionAssessmentInput, RepositoryIdentityProjection } from "./types.js";

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
    return { collision: "AMBIGUOUS_COPY_OR_FORK", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.collision_input_invalid" };
  }
  if (input.artifactIsStale) return { collision: "STALE_IDENTITY_ARTIFACT", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.stale_identity_artifact" };
  if (input.copyOrForkAmbiguous) return { collision: "AMBIGUOUS_COPY_OR_FORK", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.copy_or_fork_ambiguous" };
  if (providerConflict(input.currentRepository, input.candidateRepository)) {
    return { collision: "PROVIDER_BINDING_CONFLICT", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.provider_binding_conflict" };
  }

  const sameProject = input.currentProjectId === input.candidateProjectId;
  const repositoryComparable = input.currentRepository !== undefined && input.candidateRepository !== undefined;
  const sameRepository = repositoryComparable && repositoryIdentityEqual(input.currentRepository, input.candidateRepository);

  if (input.registryEvidenceOnly && sameProject && repositoryComparable && !sameRepository) {
    return { collision: "REGISTRY_DUPLICATE_SUSPECTED", blocksGovernedMutation: false, restriction: "LOCAL_SAFE_ONLY", reasonCode: "gef.identity.registry_duplicate_suspected" };
  }
  if (sameLocalBinding(input.currentRepository, input.candidateRepository) && input.independentLineageClaimed) {
    return { collision: "LOCAL_BINDING_COLLISION", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.local_binding_collision" };
  }
  if (sameProject && (!repositoryComparable || sameRepository)) {
    return { collision: null, blocksGovernedMutation: false, restriction: "NONE", reasonCode: "gef.identity.same_lineage_compatible" };
  }
  if (sameProject && input.independentLineageClaimed) {
    return { collision: "DUPLICATE_PROJECT_LINEAGE", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.duplicate_project_lineage" };
  }
  if (sameProject && repositoryComparable && !sameRepository) {
    return { collision: "PROJECT_ID_REPOSITORY_MISMATCH", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.project_repository_mismatch" };
  }
  if (!sameProject && sameRepository) {
    return { collision: "REPOSITORY_BOUND_TO_DIFFERENT_PROJECT", blocksGovernedMutation: true, restriction: "BLOCK_ALL", reasonCode: "gef.identity.repository_bound_to_different_project" };
  }
  return { collision: null, blocksGovernedMutation: false, restriction: "NONE", reasonCode: "gef.identity.independent_bindings" };
}
