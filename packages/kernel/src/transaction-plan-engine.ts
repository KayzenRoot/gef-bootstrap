import type { DigestPort, TransactionPortResult } from "./transaction-ports.js";
import {
  compileTransactionPlan as compileCore,
  normalizeTransactionPlanBody,
  stableTransactionSerialize,
  topologicalIntents,
  validateTransactionPlanBody as validateCore,
  verifyTransactionPlanDigest as verifyCore,
} from "./transaction-plan.js";
import {
  transactionSecurityClasses,
  type RecoveryClass,
  type StatePredicate,
  type TransactionIntentKind,
  type TransactionPlan,
  type TransactionPlanBody,
} from "./transaction-types.js";
import { createGefError } from "./errors.js";

const intentKinds = new Set<TransactionIntentKind>([
  "CREATE_MANAGED_ARTIFACT",
  "UPDATE_MANAGED_ARTIFACT",
  "REMOVE_MANAGED_ARTIFACT",
  "MOVE_MANAGED_ARTIFACT",
  "DELEGATED_TRANSITION",
  "EXTERNAL_SAGA_EFFECT",
]);
const managedIntentKinds = new Set<TransactionIntentKind>([
  "CREATE_MANAGED_ARTIFACT",
  "UPDATE_MANAGED_ARTIFACT",
  "REMOVE_MANAGED_ARTIFACT",
  "MOVE_MANAGED_ARTIFACT",
  "DELEGATED_TRANSITION",
]);
const recoveryClasses = new Set<RecoveryClass>([
  "REVERSIBLE_MANAGED",
  "COMPENSATABLE_EXTERNAL",
  "IRREVERSIBLE_OR_UNPROVEN",
  "NO_EFFECT",
]);
const statePredicates = new Set<StatePredicate>(["EXACT", "COMPATIBLE"]);
const securityClasses = new Set<string>(transactionSecurityClasses);
const bindingStrengths = new Set(["PROJECT", "REPOSITORY", "PROJECT_AND_REPOSITORY", "OPERATIONAL_ONLY"]);

function runtimeError(reason: string, summary: string, metadata?: Readonly<Record<string, unknown>>): TransactionPortResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m05-plan-runtime-${reason}`,
      category: "PRECONDITION",
      reason: `transaction_plan.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      ...(metadata === undefined ? {} : { metadata }),
    }),
  };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function objectValue(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredArrays(source: Readonly<Record<string, unknown>>): boolean {
  return [
    "expectedPreState",
    "authorizationRequirements",
    "mutationSurface",
    "intents",
    "ordering",
    "verificationObligations",
    "recoveryRequirements",
    "externalEffectDeclarations",
    "policyRefs",
  ].every((key) => Array.isArray(source[key]));
}

export function validateTransactionPlanRuntime(body: unknown): TransactionPortResult<true> {
  if (!objectValue(body)) return runtimeError("malformed_plan", "Transaction plan must be an object");
  if (body.schemaVersion !== 1 || body.planContractVersion !== "1.0") return runtimeError("unsupported_version", "Unsupported transaction plan contract version");
  if (!objectValue(body.targetBinding) || !nonEmpty(body.targetBinding.targetRef) || !bindingStrengths.has(body.targetBinding.bindingStrength)) return runtimeError("missing_target", "Transaction target binding is invalid or missing");
  if (!requiredArrays(body)) return runtimeError("malformed_plan", "Transaction plan required collection fields must be arrays");
  if (!securityClasses.has(body.securityClass)) return runtimeError("invalid_security_class", "Transaction security class is invalid");

  const plan = body as unknown as TransactionPlanBody;

  for (const requirement of plan.authorizationRequirements) if (!nonEmpty(requirement)) return runtimeError("invalid_authorization_requirement", "Authorization requirement references must be non-empty");
  for (const target of plan.mutationSurface) if (!nonEmpty(target)) return runtimeError("invalid_mutation_surface", "Mutation surface entries must be non-empty");

  for (const binding of plan.expectedPreState) {
    if (!objectValue(binding) || !nonEmpty(binding.key) || !nonEmpty(binding.owner) || !nonEmpty(binding.value)) return runtimeError("invalid_state_binding", "Transaction state binding contains an empty required field");
    if (!statePredicates.has(binding.predicate)) return runtimeError("unsupported_state_predicate", "Transaction state predicate is unsupported", { key: binding.key, predicate: binding.predicate });
  }

  for (const intent of plan.intents) {
    if (!objectValue(intent) || !nonEmpty(intent.intentId) || !nonEmpty(intent.targetRef) || !Array.isArray(intent.dependsOn)) return runtimeError("invalid_intent", "Transaction intent contains an invalid required field");
    if (!intentKinds.has(intent.kind)) return runtimeError("unsupported_intent_kind", "Transaction intent kind is unsupported", { intentId: intent.intentId, kind: intent.kind });
    if (!securityClasses.has(intent.securityClass)) return runtimeError("invalid_intent_security_class", "Transaction intent security class is invalid", { intentId: intent.intentId });
    if (!recoveryClasses.has(intent.recoveryClass)) return runtimeError("invalid_recovery_class", "Transaction intent recovery class is invalid", { intentId: intent.intentId });
    for (const dependency of intent.dependsOn) if (!nonEmpty(dependency)) return runtimeError("invalid_dependency", "Transaction intent dependency references must be non-empty", { intentId: intent.intentId });
  }

  const recoveryByIntent = new Map<string, RecoveryClass>();
  for (const requirement of plan.recoveryRequirements) {
    if (!objectValue(requirement) || !nonEmpty(requirement.intentId) || !recoveryClasses.has(requirement.recoveryClass)) return runtimeError("invalid_recovery_requirement", "Recovery requirement is malformed");
    if (recoveryByIntent.has(requirement.intentId)) return runtimeError("duplicate_recovery_requirement", "Recovery requirements must be unique per intent", { intentId: requirement.intentId });
    recoveryByIntent.set(requirement.intentId, requirement.recoveryClass);
  }

  for (const intent of plan.intents) {
    if (managedIntentKinds.has(intent.kind) && intent.securityClass !== "S0_READ_ONLY") {
      const declaredRecovery = recoveryByIntent.get(intent.intentId);
      if (declaredRecovery === undefined || declaredRecovery !== intent.recoveryClass) return runtimeError("missing_recovery_requirement", "S1+ managed intent requires a matching declared recovery requirement", { intentId: intent.intentId });
    }
  }

  const externalIds = new Set<string>();
  for (const declaration of plan.externalEffectDeclarations) {
    if (!objectValue(declaration) || !nonEmpty(declaration.effectId) || externalIds.has(declaration.effectId)) return runtimeError("duplicate_external_effect", "External effect identifiers must be unique and non-empty", { effectId: objectValue(declaration) ? declaration.effectId : undefined });
    externalIds.add(declaration.effectId);
    if (!nonEmpty(declaration.owner) || !nonEmpty(declaration.targetRef)) return runtimeError("invalid_external_effect", "External effect declaration contains an empty required field", { effectId: declaration.effectId });
    if (!securityClasses.has(declaration.securityClass)) return runtimeError("invalid_external_security_class", "External effect security class is invalid", { effectId: declaration.effectId });
  }

  for (const edge of plan.ordering) if (!objectValue(edge) || !nonEmpty(edge.before) || !nonEmpty(edge.after)) return runtimeError("invalid_ordering", "Transaction ordering edges require non-empty before/after intent identifiers");
  for (const obligation of plan.verificationObligations) if (!objectValue(obligation) || !nonEmpty(obligation.verificationId) || !["STAGED", "POST_STATE", "EXTERNAL"].includes(obligation.phase)) return runtimeError("invalid_verification_obligation", "Verification obligation is malformed");
  for (const policy of plan.policyRefs) if (!objectValue(policy) || !nonEmpty(policy.policyId) || !nonEmpty(policy.version)) return runtimeError("invalid_policy_ref", "Policy references must contain non-empty id and version");

  const elevatedOrIrreversible =
    plan.securityClass === "S4_ELEVATED_DESTRUCTIVE" ||
    plan.intents.some((intent) => intent.securityClass === "S4_ELEVATED_DESTRUCTIVE" || intent.recoveryClass === "IRREVERSIBLE_OR_UNPROVEN") ||
    plan.externalEffectDeclarations.some((effect) => effect.securityClass === "S4_ELEVATED_DESTRUCTIVE");
  if (elevatedOrIrreversible && plan.authorizationRequirements.length === 0) return runtimeError("missing_elevated_authorization_requirement", "S4 or irreversible/unproven effects require an explicit authorization requirement");

  return { ok: true, value: true };
}

export function validateTransactionPlanBody(body: TransactionPlanBody): TransactionPortResult<true> {
  const runtime = validateTransactionPlanRuntime(body);
  if (!runtime.ok) return runtime;
  return validateCore(body);
}

export function compileTransactionPlan(body: TransactionPlanBody, digest: DigestPort): TransactionPortResult<TransactionPlan> {
  const runtime = validateTransactionPlanRuntime(body);
  if (!runtime.ok) return runtime;
  return compileCore(body, digest);
}

export function verifyTransactionPlanDigest(plan: TransactionPlan, digest: DigestPort): boolean {
  return validateTransactionPlanRuntime(plan).ok && verifyCore(plan, digest);
}

export { normalizeTransactionPlanBody, stableTransactionSerialize, topologicalIntents };
