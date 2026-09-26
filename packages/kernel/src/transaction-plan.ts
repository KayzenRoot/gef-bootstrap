import { createGefError } from "./errors.js";
import type { DigestPort, TransactionPortResult } from "./transaction-ports.js";
import {
  transactionSecurityClasses,
  type TransactionIntent,
  type TransactionPlan,
  type TransactionPlanBody,
  type TransactionSecurityClass,
} from "./transaction-types.js";

const securityRank = new Map<TransactionSecurityClass, number>(transactionSecurityClasses.map((value, index) => [value, index]));

function canonicalizeUnknown(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalizeUnknown);
  const source = value as Readonly<Record<string, unknown>>;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    const nested = source[key];
    if (nested !== undefined) output[key] = canonicalizeUnknown(nested);
  }
  return output;
}

export function stableTransactionSerialize(value: unknown): string {
  return JSON.stringify(canonicalizeUnknown(value));
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function normalizeIntent(intent: TransactionIntent): TransactionIntent {
  return Object.freeze({
    intentId: intent.intentId,
    kind: intent.kind,
    targetRef: intent.targetRef,
    securityClass: intent.securityClass,
    recoveryClass: intent.recoveryClass,
    dependsOn: sortedUnique(intent.dependsOn),
    ...(intent.desiredFingerprint === undefined ? {} : { desiredFingerprint: intent.desiredFingerprint }),
    ...(intent.payloadRef === undefined ? {} : { payloadRef: intent.payloadRef }),
    ...(intent.delegatedContractRef === undefined ? {} : { delegatedContractRef: intent.delegatedContractRef }),
  });
}

export function normalizeTransactionPlanBody(body: TransactionPlanBody): TransactionPlanBody {
  return Object.freeze({
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: Object.freeze({ ...body.targetBinding }),
    expectedPreState: Object.freeze([...body.expectedPreState].map((binding) => Object.freeze({ ...binding })).sort((a, b) => `${a.owner}:${a.key}`.localeCompare(`${b.owner}:${b.key}`))),
    securityClass: body.securityClass,
    authorizationRequirements: sortedUnique(body.authorizationRequirements),
    mutationSurface: sortedUnique(body.mutationSurface),
    intents: Object.freeze([...body.intents].map(normalizeIntent).sort((a, b) => a.intentId.localeCompare(b.intentId))),
    ordering: Object.freeze([...body.ordering].map((edge) => Object.freeze({ ...edge })).sort((a, b) => `${a.before}>${a.after}`.localeCompare(`${b.before}>${b.after}`))),
    verificationObligations: Object.freeze([...body.verificationObligations].map((value) => Object.freeze({ ...value })).sort((a, b) => a.verificationId.localeCompare(b.verificationId))),
    recoveryRequirements: Object.freeze([...body.recoveryRequirements].map((value) => Object.freeze({ ...value })).sort((a, b) => a.intentId.localeCompare(b.intentId))),
    externalEffectDeclarations: Object.freeze([...body.externalEffectDeclarations].map((value) => Object.freeze({ ...value })).sort((a, b) => a.effectId.localeCompare(b.effectId))),
    policyRefs: Object.freeze([...body.policyRefs].map((value) => Object.freeze({ ...value })).sort((a, b) => `${a.policyId}:${a.version}`.localeCompare(`${b.policyId}:${b.version}`))),
  });
}

function validationError(reason: string, summary: string, metadata?: Readonly<Record<string, unknown>>): TransactionPortResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m05-plan-${reason}`,
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

function hasPath(from: string, to: string, edges: ReadonlyMap<string, readonly string[]>, visited = new Set<string>()): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;
  visited.add(from);
  for (const next of edges.get(from) ?? []) if (hasPath(next, to, edges, visited)) return true;
  return false;
}

export function validateTransactionPlanBody(body: TransactionPlanBody): TransactionPortResult<true> {
  if (body.schemaVersion !== 1 || body.planContractVersion !== "1.0") return validationError("unsupported_version", "Unsupported transaction plan contract version");
  if (body.targetBinding.targetRef.trim().length === 0) return validationError("missing_target", "Transaction target binding is required");

  const ids = new Set<string>();
  for (const intent of body.intents) {
    if (intent.intentId.trim().length === 0 || ids.has(intent.intentId)) return validationError("duplicate_intent", "Transaction intent identifiers must be unique and non-empty", { intentId: intent.intentId });
    ids.add(intent.intentId);
    if (!body.mutationSurface.includes(intent.targetRef)) return validationError("surface_violation", "Transaction intent target is outside the admitted mutation surface", { intentId: intent.intentId, targetRef: intent.targetRef });
  }

  for (const declaration of body.externalEffectDeclarations) {
    if (!body.mutationSurface.includes(declaration.targetRef)) return validationError("surface_violation", "External effect target is outside the admitted mutation surface", { effectId: declaration.effectId, targetRef: declaration.targetRef });
  }

  const edges = new Map<string, string[]>();
  for (const intent of body.intents) edges.set(intent.intentId, []);
  for (const intent of body.intents) {
    for (const dependency of intent.dependsOn) {
      if (!ids.has(dependency)) return validationError("unknown_dependency", "Transaction intent depends on an unknown intent", { intentId: intent.intentId, dependency });
      edges.get(dependency)?.push(intent.intentId);
    }
  }
  for (const edge of body.ordering) {
    if (!ids.has(edge.before) || !ids.has(edge.after)) return validationError("unknown_ordering_intent", "Transaction ordering references an unknown intent", { before: edge.before, after: edge.after });
    edges.get(edge.before)?.push(edge.after);
  }

  for (const intentId of ids) {
    const direct = edges.get(intentId) ?? [];
    for (const next of direct) if (hasPath(next, intentId, edges)) return validationError("dependency_cycle", "Transaction intent dependency graph contains a cycle", { intentId });
  }

  const byTarget = new Map<string, TransactionIntent[]>();
  for (const intent of body.intents) {
    const list = byTarget.get(intent.targetRef) ?? [];
    list.push(intent);
    byTarget.set(intent.targetRef, list);
  }
  for (const [targetRef, intents] of byTarget) {
    for (let leftIndex = 0; leftIndex < intents.length; leftIndex += 1) {
      const left = intents[leftIndex];
      if (left === undefined) continue;
      for (let rightIndex = leftIndex + 1; rightIndex < intents.length; rightIndex += 1) {
        const right = intents[rightIndex];
        if (right === undefined) continue;
        if (!hasPath(left.intentId, right.intentId, edges) && !hasPath(right.intentId, left.intentId, edges)) return validationError("competing_target_effects", "Multiple intents affect the same target without deterministic ordering", { targetRef, left: left.intentId, right: right.intentId });
      }
    }
  }

  let requiredRank = 0;
  for (const intent of body.intents) requiredRank = Math.max(requiredRank, securityRank.get(intent.securityClass) ?? 0);
  for (const effect of body.externalEffectDeclarations) requiredRank = Math.max(requiredRank, securityRank.get(effect.securityClass) ?? 0);
  const declaredRank = securityRank.get(body.securityClass) ?? -1;
  if (declaredRank < requiredRank) return validationError("security_downgrade", "Transaction security class is below the highest contained effect");

  const recovery = new Map(body.recoveryRequirements.map((item) => [item.intentId, item] as const));
  for (const intent of body.intents) {
    if (intent.securityClass !== "S0_READ_ONLY" && intent.recoveryClass === "REVERSIBLE_MANAGED") {
      const requirement = recovery.get(intent.intentId);
      if (requirement === undefined || requirement.recoveryClass !== intent.recoveryClass) return validationError("missing_recovery_requirement", "Reversible managed intent is missing its recovery requirement", { intentId: intent.intentId });
    }
  }

  return { ok: true, value: true };
}

export function compileTransactionPlan(body: TransactionPlanBody, digest: DigestPort): TransactionPortResult<TransactionPlan> {
  const normalized = normalizeTransactionPlanBody(body);
  const valid = validateTransactionPlanBody(normalized);
  if (!valid.ok) return valid;
  const planDigest = digest.digest(stableTransactionSerialize(normalized));
  return { ok: true, value: Object.freeze({ ...normalized, planDigest }) };
}

export function verifyTransactionPlanDigest(plan: TransactionPlan, digest: DigestPort): boolean {
  const { planDigest: _ignored, ...body } = plan;
  return digest.digest(stableTransactionSerialize(normalizeTransactionPlanBody(body))) === plan.planDigest;
}

export function topologicalIntents(plan: TransactionPlan): TransactionPortResult<readonly TransactionIntent[]> {
  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();
  for (const intent of plan.intents) {
    dependencies.set(intent.intentId, new Set(intent.dependsOn));
    dependents.set(intent.intentId, new Set());
  }
  for (const edge of plan.ordering) dependencies.get(edge.after)?.add(edge.before);
  for (const [intentId, deps] of dependencies) for (const dep of deps) dependents.get(dep)?.add(intentId);

  const ready = [...dependencies.entries()].filter(([, deps]) => deps.size === 0).map(([id]) => id).sort();
  const ordered: TransactionIntent[] = [];
  const byId = new Map(plan.intents.map((intent) => [intent.intentId, intent] as const));
  while (ready.length > 0) {
    const id = ready.shift();
    if (id === undefined) break;
    const intent = byId.get(id);
    if (intent !== undefined) ordered.push(intent);
    for (const dependent of dependents.get(id) ?? []) {
      const deps = dependencies.get(dependent);
      deps?.delete(id);
      if (deps?.size === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (ordered.length !== plan.intents.length) return validationError("dependency_cycle", "Transaction intent dependency graph cannot be ordered");
  return { ok: true, value: Object.freeze(ordered) };
}
