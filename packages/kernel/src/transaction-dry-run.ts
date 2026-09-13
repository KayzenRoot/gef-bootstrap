import { createGefError } from "./errors.js";
import { stableTransactionSerialize, validateTransactionPlanBody, verifyTransactionPlanDigest } from "./transaction-plan.js";
import type { TransactionPorts } from "./transaction-ports.js";
import { evaluateStateBinding } from "./transaction-state.js";
import type { DryRunIntentResult, DryRunOutcome, DryRunReport, TransactionFinding, TransactionPlan, TransactionStateBinding } from "./transaction-types.js";

function intentAction(kind: TransactionPlan["intents"][number]["kind"]): DryRunIntentResult["action"] {
  switch (kind) {
    case "CREATE_MANAGED_ARTIFACT": return "WOULD_CREATE";
    case "UPDATE_MANAGED_ARTIFACT": return "WOULD_UPDATE";
    case "REMOVE_MANAGED_ARTIFACT": return "WOULD_REMOVE";
    case "MOVE_MANAGED_ARTIFACT": return "WOULD_MOVE";
    case "DELEGATED_TRANSITION": return "WOULD_DELEGATE";
    case "EXTERNAL_SAGA_EFFECT": return "WOULD_EXTERNAL_EFFECT";
  }
}

function reportDigest(report: Omit<DryRunReport, "reportDigest">, ports: TransactionPorts): string {
  return ports.digest.digest(stableTransactionSerialize(report));
}

function finish(plan: TransactionPlan, ports: TransactionPorts, outcome: DryRunOutcome, observedStateBindings: readonly TransactionStateBinding[], intentResults: readonly DryRunIntentResult[], findings: readonly TransactionFinding[]): DryRunReport {
  const base: Omit<DryRunReport, "reportDigest"> = Object.freeze({
    schemaVersion: 1,
    dryRunContractVersion: "1.0",
    planDigest: plan.planDigest,
    outcome,
    observedStateBindings: Object.freeze([...observedStateBindings]),
    intentResults: Object.freeze([...intentResults]),
    findings: Object.freeze([...findings]),
  });
  return Object.freeze({ ...base, reportDigest: reportDigest(base, ports) });
}

export async function dryRunTransaction(plan: TransactionPlan, ports: TransactionPorts): Promise<DryRunReport> {
  const bodyValid = validateTransactionPlanBody(plan);
  if (!bodyValid.ok || !verifyTransactionPlanDigest(plan, ports.digest)) {
    const finding: TransactionFinding = Object.freeze({ code: "PLAN_INVALID", severity: "ERROR", summary: "Transaction plan is invalid or its digest does not match" });
    return finish(plan, ports, "BLOCKED", [], [], [finding]);
  }

  const observed: TransactionStateBinding[] = [];
  const findings: TransactionFinding[] = [];
  let stale = false;
  let conflict = false;
  let indeterminate = false;

  for (const binding of plan.expectedPreState) {
    const result = await evaluateStateBinding(binding, ports);
    if (!result.ok) {
      indeterminate = true;
      findings.push(Object.freeze({ code: result.error.reasonCode, severity: "ERROR", summary: result.error.summary }));
      continue;
    }
    observed.push(Object.freeze({ ...binding, value: result.value.observedValue }));
    if (!result.value.matches) {
      stale = true;
      findings.push(Object.freeze({ code: "STATE_STALE", severity: "ERROR", summary: `Required state binding ${binding.key} no longer satisfies ${binding.predicate}` }));
    }
  }

  const intentResults: DryRunIntentResult[] = [];
  let allManagedNoChange = plan.intents.length > 0;
  for (const intent of plan.intents) {
    const current = await ports.state.observeTargetFingerprint(intent.targetRef);
    if (!current.ok) {
      findings.push(Object.freeze({ code: current.error.reasonCode, severity: "ERROR", summary: current.error.summary, intentId: intent.intentId, targetRef: intent.targetRef }));
      indeterminate = true;
      continue;
    }
    const desiredMatches = intent.desiredFingerprint !== undefined && current.value === intent.desiredFingerprint && intent.kind !== "REMOVE_MANAGED_ARTIFACT";
    const removeAlreadyAbsent = intent.kind === "REMOVE_MANAGED_ARTIFACT" && current.value === undefined;
    const noChange = desiredMatches || removeAlreadyAbsent;
    if (!noChange) allManagedNoChange = false;
    intentResults.push(Object.freeze({
      intentId: intent.intentId,
      targetRef: intent.targetRef,
      action: noChange ? "NO_CHANGE" : intentAction(intent.kind),
      ...(current.value === undefined ? {} : { currentFingerprint: current.value }),
      ...(intent.desiredFingerprint === undefined ? {} : { desiredFingerprint: intent.desiredFingerprint }),
    }));
  }

  if (plan.externalEffectDeclarations.length > 0) {
    if (ports.externalEffects === undefined) {
      indeterminate = true;
      findings.push(Object.freeze({ code: "EXTERNAL_OBSERVATION_UNAVAILABLE", severity: "ERROR", summary: "External effect observation capability is unavailable" }));
    } else {
      for (const declaration of plan.externalEffectDeclarations) {
        const external = await ports.externalEffects.observeEffect(declaration);
        if (!external.ok || external.value === "UNKNOWN") {
          indeterminate = true;
          findings.push(Object.freeze({ code: external.ok ? "EXTERNAL_EFFECT_UNKNOWN" : external.error.reasonCode, severity: "ERROR", summary: external.ok ? `External effect ${declaration.effectId} state is unknown` : external.error.summary, targetRef: declaration.targetRef }));
        } else if (external.value === "PRESENT") {
          conflict = true;
          findings.push(Object.freeze({ code: "EXTERNAL_EFFECT_PRESENT", severity: "ERROR", summary: `External effect ${declaration.effectId} is already present and requires owning-saga reconciliation`, targetRef: declaration.targetRef }));
        }
      }
    }
  }

  if (conflict) return finish(plan, ports, "CONFLICT", observed, intentResults, findings);
  if (stale) return finish(plan, ports, "STALE", observed, intentResults, findings);
  if (indeterminate) return finish(plan, ports, "INDETERMINATE", observed, intentResults, findings);

  const noEffects = plan.intents.length === 0 && plan.externalEffectDeclarations.length === 0;
  const managedNoop = allManagedNoChange && plan.externalEffectDeclarations.length === 0;
  return finish(plan, ports, noEffects || managedNoop ? "NOOP" : "READY", observed, intentResults, findings);
}

export function dryRunErrorToGefError(report: DryRunReport) {
  return createGefError({
    id: `m05-dry-run-${report.reportDigest}`,
    category: report.outcome === "STALE" || report.outcome === "CONFLICT" ? "PRECONDITION" : "CAPABILITY",
    reason: `transaction_dry_run.${report.outcome.toLowerCase()}`,
    severity: "ERROR",
    summary: `Transaction dry run ended as ${report.outcome}`,
    retryability: "NEVER",
    recoverability: "NONE_REQUIRED",
    terminal: "BLOCKED",
    metadata: { planDigest: report.planDigest, reportDigest: report.reportDigest },
  });
}
