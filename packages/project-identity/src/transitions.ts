import { canonicalIdentityStringify } from "./canonical.js";
import { canonicalizeRepositoryIdentityProjection } from "./projection.js";
import { generateProjectId, isCanonicalProjectId } from "./project-id.js";
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
const SAFE_RECOVERY_REF = /^[A-Za-z0-9._:-]{1,128}$/;
const VALID_INVALIDATIONS = new Set<IdentityInvalidationClass>(["PROJECT_BOUND", "REPOSITORY_BOUND"]);

function assuranceRank(value: AssuranceLevel): number {
  return value === "STANDARD" ? 1 : value === "ELEVATED" ? 2 : 3;
}

function projectionDigest(projection: RepositoryIdentityProjection | undefined, digestPort: DigestPort): string | undefined {
  return projection ? digestPort.digest(canonicalIdentityStringify(canonicalizeRepositoryIdentityProjection(projection))) : undefined;
}

function defaultInvalidation(operation: IdentityTransitionOperation): readonly IdentityInvalidationClass[] {
  return operation === "REBIND_REPOSITORY" ? ["REPOSITORY_BOUND"] : ["PROJECT_BOUND", "REPOSITORY_BOUND"];
}

function requiredInvalidation(operation: IdentityTransitionOperation, requested: readonly IdentityInvalidationClass[] | undefined): readonly IdentityInvalidationClass[] {
  if (requested?.some((item) => !VALID_INVALIDATIONS.has(item))) throw new Error("gef.identity.invalidation_class_invalid");
  const all = new Set<IdentityInvalidationClass>([...defaultInvalidation(operation), ...(requested ?? [])]);
  return ["PROJECT_BOUND", "REPOSITORY_BOUND"].filter((item): item is IdentityInvalidationClass => all.has(item as IdentityInvalidationClass));
}

function planBody(plan: IdentityTransitionPlan): Omit<IdentityTransitionPlan, "planAlgorithm" | "planDigest"> {
  const { planAlgorithm: _algorithm, planDigest: _digest, ...body } = plan;
  return body;
}

function canonicalCurrentState(current: IdentityTransitionState): IdentityTransitionState {
  if (!isCanonicalProjectId(current.projectId)) throw new Error("gef.identity.current_project_id_invalid");
  if (!current.projectConfigFingerprint || !current.identityFingerprint) throw new Error("gef.identity.current_state_fingerprint_invalid");
  if (current.repositoryProjection === undefined) {
    if (current.repositoryProjectionFingerprint !== undefined) throw new Error("gef.identity.repository_projection_fingerprint_orphaned");
    return current;
  }
  const repositoryProjection = canonicalizeRepositoryIdentityProjection(current.repositoryProjection);
  return { ...current, repositoryProjection };
}

export function createIdentityTransitionPlan(
  input: CreateIdentityTransitionPlanInput,
  digestPort: DigestPort,
  uuidGenerator?: UuidV4Generator,
): IdentityTransitionPlan {
  const current = canonicalCurrentState(input.current);
  if (!SAFE_REASON_CODE.test(input.reason)) throw new Error("gef.identity.transition_reason_invalid");
  if (input.collisionClass === "REGISTRY_DUPLICATE_SUSPECTED") throw new Error("gef.identity.registry_suspicion_transition_blocked");
  if (input.operation === "REBIND_REPOSITORY" && input.newRepositoryProjection === undefined) throw new Error("gef.identity.rebind_target_required");
  if (input.operation !== "IMPORT_RECOVERY" && input.importRecoveryProjectId !== undefined) throw new Error("gef.identity.caller_supplied_project_id_forbidden");
  if (input.operation !== "IMPORT_RECOVERY" && input.importRecoveryEvidence !== undefined) throw new Error("gef.identity.import_recovery_evidence_forbidden");

  let newRepositoryProjection: RepositoryIdentityProjection | undefined;
  if (input.newRepositoryProjection !== undefined) newRepositoryProjection = canonicalizeRepositoryIdentityProjection(input.newRepositoryProjection, true);

  let newProjectId: string | undefined;
  if (input.operation === "REKEY_PROJECT" || input.operation === "FORK_ADOPTION") newProjectId = generateProjectId(uuidGenerator);
  if (input.operation === "IMPORT_RECOVERY") {
    if (!isCanonicalProjectId(input.importRecoveryProjectId) || input.importRecoveryProjectId === current.projectId) {
      throw new Error("gef.identity.import_recovery_project_id_invalid");
    }
    if (!input.importRecoveryEvidence || input.importRecoveryEvidence.collisionCheck !== "NO_AUTHORITATIVE_CONFLICT") {
      throw new Error("gef.identity.import_recovery_evidence_required");
    }
    if (!SAFE_RECOVERY_REF.test(input.importRecoveryEvidence.sourceRef) || !SAFE_RECOVERY_REF.test(input.importRecoveryEvidence.authorityRef)) {
      throw new Error("gef.identity.import_recovery_reference_invalid");
    }
    newProjectId = input.importRecoveryProjectId;
  }

  const externalEffects = [...new Set(input.externalEffects ?? [])].sort();
  if (externalEffects.length > 32 || externalEffects.some((effect) => !SAFE_EXTERNAL_EFFECT_ID.test(effect))) throw new Error("gef.identity.external_effect_id_invalid");
  const acknowledgementRequired = input.operation === "FORK_ADOPTION" || input.operation === "REKEY_PROJECT" || input.operation === "IMPORT_RECOVERY" || assuranceRank(input.assurance) >= assuranceRank("ELEVATED");
  const body = {
    schemaVersion: 1 as const,
    operation: input.operation,
    reason: input.reason,
    assurance: input.assurance,
    ...(input.collisionClass ? { collisionClass: input.collisionClass } : {}),
    expectedProjectId: current.projectId,
    expectedProjectConfigFingerprint: current.projectConfigFingerprint,
    ...(current.repositoryProjectionFingerprint ? { expectedRepositoryProjectionFingerprint: current.repositoryProjectionFingerprint } : {}),
    oldIdentityFingerprint: current.identityFingerprint,
    ...(newProjectId ? { newProjectId } : {}),
    ...(newRepositoryProjection ? { newRepositoryProjection } : {}),
    ...(input.operation === "IMPORT_RECOVERY" && input.importRecoveryEvidence ? { importRecoveryEvidence: input.importRecoveryEvidence } : {}),
    invalidationClasses: requiredInvalidation(input.operation, input.invalidationClasses),
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
  const current = canonicalCurrentState(input.current);
  assertCurrentMatchesPlan(plan, current);
  if (plan.acknowledgementRequired && !input.acknowledged) throw new Error("gef.identity.transition_acknowledgement_required");
  if (plan.operation === "REBIND_REPOSITORY" && plan.assurance === "STANDARD" && !input.workOrderAuthorized) {
    throw new Error("gef.identity.work_order_authorization_required");
  }
  if (plan.externalEffects.length > 0 && !input.externalEffectsAuthorized) throw new Error("gef.identity.external_effect_authorization_required");

  const projectId = plan.newProjectId ?? current.projectId;
  const repositoryProjection = plan.newRepositoryProjection ?? current.repositoryProjection;
  const canonicalProjection = repositoryProjection ? canonicalizeRepositoryIdentityProjection(repositoryProjection) : undefined;
  const repositoryProjectionFingerprint = projectionDigest(canonicalProjection, digestPort);
  const identityFingerprint = digestPort.digest(canonicalIdentityStringify({ projectId, repositoryProjection: canonicalProjection }));
  if (!identityFingerprint) throw new Error("gef.identity.new_identity_digest_invalid");

  const state: IdentityTransitionState = {
    projectId,
    projectConfigFingerprint: current.projectConfigFingerprint,
    ...(canonicalProjection ? { repositoryProjection: canonicalProjection } : {}),
    ...(repositoryProjectionFingerprint ? { repositoryProjectionFingerprint } : {}),
    identityFingerprint,
  };
  const receipt = {
    schemaVersion: 1 as const,
    operation: plan.operation,
    reason: plan.reason,
    oldProjectId: current.projectId,
    ...(plan.newProjectId ? { newProjectId: plan.newProjectId } : {}),
    ...(current.repositoryProjectionFingerprint ? { oldRepositoryProjectionFingerprint: current.repositoryProjectionFingerprint } : {}),
    ...(repositoryProjectionFingerprint ? { newRepositoryProjectionFingerprint: repositoryProjectionFingerprint } : {}),
    oldIdentityFingerprint: current.identityFingerprint,
    newIdentityFingerprint: identityFingerprint,
    invalidationClasses: plan.invalidationClasses,
    ...(plan.importRecoveryEvidence ? { recoveryReference: plan.importRecoveryEvidence.authorityRef } : {}),
    externalEffects: plan.externalEffects,
    planAlgorithm: plan.planAlgorithm,
    planDigest: plan.planDigest,
  };
  return { state, receipt };
}
