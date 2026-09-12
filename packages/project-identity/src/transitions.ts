import { canonicalIdentityStringify } from "./canonical.js";
import { generateProjectId, isCanonicalProjectId } from "./project-id.js";
import { canonicalRepositoryProjection } from "./repository.js";
import type {
  AssuranceLevel,
  ApplyIdentityTransitionInput,
  CreateIdentityTransitionPlanInput,
  DigestPort,
  IdentityInvalidationClass,
  IdentityTransitionOperation,
  IdentityTransitionPlan,
  IdentityTransitionResult,
  IdentityTransitionState,
  RepositoryIdentityProjection,
  UuidV4Generator,
} from "./types.js";

const SAFE_REASON_CODE = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_EXTERNAL_EFFECT_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function assuranceRank(value: AssuranceLevel): number {
  return value === "STANDARD" ? 1 : value === "ELEVATED" ? 2 : 3;
}

function projectionDigest(projection: RepositoryIdentityProjection | undefined, digestPort: DigestPort): string | undefined {
  return projection ? digestPort.digest(canonicalIdentityStringify(canonicalRepositoryProjection(projection))) : undefined;
}

function defaultInvalidation(operation: IdentityTransitionOperation): readonly IdentityInvalidationClass[] {
  return operation === "REBIND_REPOSITORY" ? ["REPOSITORY_BOUND"] : ["PROJECT_BOUND", "REPOSITORY_BOUND"];
}

function isMaterialRepositoryProjection(projection: RepositoryIdentityProjection): boolean {
  if (projection.state === "RESOLVED_REMOTE_BOUND") return projection.bindingKind === "REMOTE" && projection.normalizedLocator !== undefined;
  if (projection.state === "RESOLVED_LOCAL_ONLY") return projection.bindingKind === "LOCAL" && Boolean(projection.localBindingId);
  return false;
}

function planBody(plan: IdentityTransitionPlan): Omit<IdentityTransitionPlan, "planAlgorithm" | "planDigest"> {
  const { planAlgorithm: _algorithm, planDigest: _digest, ...body } = plan;
  return body;
}

export function createIdentityTransitionPlan(
  input: CreateIdentityTransitionPlanInput,
  digestPort: DigestPort,
  uuidGenerator?: UuidV4Generator,
): IdentityTransitionPlan {
  if (!isCanonicalProjectId(input.current.projectId)) throw new Error("gef.identity.current_project_id_invalid");
  if (!SAFE_REASON_CODE.test(input.reason)) throw new Error("gef.identity.transition_reason_invalid");
  if (input.collisionClass === "REGISTRY_DUPLICATE_SUSPECTED") throw new Error("gef.identity.registry_suspicion_transition_blocked");
  if (input.operation === "REBIND_REPOSITORY" && input.newRepositoryProjection === undefined) throw new Error("gef.identity.rebind_target_required");
  if (input.newRepositoryProjection !== undefined && !isMaterialRepositoryProjection(input.newRepositoryProjection)) throw new Error("gef.identity.repository_transition_target_not_materialized");
  if (input.operation !== "IMPORT_RECOVERY" && input.importRecoveryProjectId !== undefined) throw new Error("gef.identity.caller_supplied_project_id_forbidden");

  let newProjectId: string | undefined;
  if (input.operation === "REKEY_PROJECT" || input.operation === "FORK_ADOPTION") newProjectId = generateProjectId(uuidGenerator);
  if (input.operation === "IMPORT_RECOVERY") {
    if (!isCanonicalProjectId(input.importRecoveryProjectId) || input.importRecoveryProjectId === input.current.projectId) {
      throw new Error("gef.identity.import_recovery_project_id_invalid");
    }
    newProjectId = input.importRecoveryProjectId;
  }

  const externalEffects = [...(input.externalEffects ?? [])];
  if (externalEffects.some((effect) => !SAFE_EXTERNAL_EFFECT_ID.test(effect))) throw new Error("gef.identity.external_effect_id_invalid");
  const acknowledgementRequired = input.operation === "FORK_ADOPTION" || input.operation === "REKEY_PROJECT" || input.operation === "IMPORT_RECOVERY" || assuranceRank(input.assurance) >= assuranceRank("ELEVATED");
  const newRepositoryProjection = input.newRepositoryProjection ? canonicalRepositoryProjection(input.newRepositoryProjection) : undefined;
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
    ...(newRepositoryProjection ? { newRepositoryProjection } : {}),
    invalidationClasses: [...(input.invalidationClasses ?? defaultInvalidation(input.operation))],
    acknowledgementRequired,
    externalEffects,
  };
  const planDigest = digestPort.digest(canonicalIdentityStringify(body));
  if (!planDigest) throw new Error("gef.identity.plan_digest_invalid");
  return { ...body, planAlgorithm: digestPort.algorithm, planDigest };
}

function assertPlanIntegrity(plan: IdentityTransitionPlan, digestPort: DigestPort): void {
  if (digestPort.algorithm !== plan.planAlgorithm) throw new Error("gef.identity.transition_digest_algorithm_changed");
  const actual = digestPort.digest(canonicalIdentityStringify(planBody(plan)));
  if (actual !== plan.planDigest) throw new Error("gef.identity.transition_plan_integrity_invalid");
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
  assertPlanIntegrity(plan, digestPort);
  assertCurrentMatchesPlan(plan, input.current);
  if (plan.acknowledgementRequired && !input.acknowledged) throw new Error("gef.identity.transition_acknowledgement_required");
  if (plan.operation === "REBIND_REPOSITORY" && plan.assurance === "STANDARD" && !input.workOrderAuthorized) {
    throw new Error("gef.identity.work_order_authorization_required");
  }
  if (plan.externalEffects.length > 0 && !input.externalEffectsAuthorized) throw new Error("gef.identity.external_effect_authorization_required");

  const projectId = plan.newProjectId ?? input.current.projectId;
  const repositoryProjection = plan.newRepositoryProjection ?? input.current.repositoryProjection;
  const canonicalProjection = repositoryProjection ? canonicalRepositoryProjection(repositoryProjection) : undefined;
  const repositoryProjectionFingerprint = projectionDigest(canonicalProjection, digestPort);
  const identityFingerprint = digestPort.digest(canonicalIdentityStringify({ projectId, repositoryProjection: canonicalProjection }));
  if (!identityFingerprint) throw new Error("gef.identity.new_identity_digest_invalid");

  const state: IdentityTransitionState = {
    projectId,
    projectConfigFingerprint: input.current.projectConfigFingerprint,
    ...(canonicalProjection ? { repositoryProjection: canonicalProjection } : {}),
    ...(repositoryProjectionFingerprint ? { repositoryProjectionFingerprint } : {}),
    identityFingerprint,
  };
  const receipt = {
    schemaVersion: 1 as const,
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
