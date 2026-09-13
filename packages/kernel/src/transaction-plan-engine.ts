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
const recoveryClasses = new Set<RecoveryClass>([
  "REVERSIBLE_MANAGED",
  "COMPENSATABLE_EXTERNAL",
  "IRREVERSIBLE_OR_UNPROVEN",
  "NO_EFFECT",
]);
const statePredicates = new Set<StatePredicate>(["EXACT", "COMPATIBLE"]);
const securityClasses = new Set<string>(transactionSecurityClasses);

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

export function validateTransactionPlanRuntime(body: TransactionPlanBody): TransactionPortResult<true> {
  if (body.schemaVersion !== 1 || body.planContractVersion !== "1.0") return runtimeError("unsupported_version", "Unsupported transaction plan contract version");
  if (!nonEmpty(body.targetBinding?.targetRef)) return runtimeError("missing_target", "Transaction target binding is required");
  if (!securityClasses.has(body.securityClass)) return runtimeError("invalid_security_class", "Transaction security class is invalid");

  for (const binding of body.expectedPreState) {
    if (!nonEmpty(binding.key) || !nonEmpty(binding.owner) || !nonEmpty(binding.value)) return runtimeError("invalid_state_binding", "Transaction state binding contains an empty required field");
    if (!statePredicates.has(binding.predicate)) return runtimeError("unsupported_state_predicate", "Transaction state predicate is unsupported", { key: binding.key, predicate: binding.predicate });
  }

  for (const intent of body.intents) {
    if (!nonEmpty(intent.intentId) || !nonEmpty(intent.targetRef)) return runtimeError("invalid_intent", "Transaction intent contains an empty required field");
    if (!intentKinds.has(intent.kind)) return runtimeError("unsupported_intent_kind", "Transaction intent kind is unsupported", { intentId: intent.intentId, kind: intent.kind });
    if (!securityClasses.has(intent.securityClass)) return runtimeError("invalid_intent_security_class", "Transaction intent security class is invalid", { intentId: intent.intentId });
    if (!recoveryClasses.has(intent.recoveryClass)) return runtimeError("invalid_recovery_class", "Transaction intent recovery class is invalid", { intentId: intent.intentId });
  }

  const externalIds = new Set<string>();
  for (const declaration of body.externalEffectDeclarations) {
    if (!nonEmpty(declaration.effectId) || externalIds.has(declaration.effectId)) return runtimeError("duplicate_external_effect", "External effect identifiers must be unique and non-empty", { effectId: declaration.effectId });
    externalIds.add(declaration.effectId);
    if (!nonEmpty(declaration.owner) || !nonEmpty(declaration.targetRef)) return runtimeError("invalid_external_effect", "External effect declaration contains an empty required field", { effectId: declaration.effectId });
    if (!securityClasses.has(declaration.securityClass)) return runtimeError("invalid_external_security_class", "External effect security class is invalid", { effectId: declaration.effectId });
  }

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
