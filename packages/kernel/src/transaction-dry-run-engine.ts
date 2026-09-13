import { dryRunTransaction as dryRunCore } from "./transaction-dry-run.js";
import { validateTransactionPlanBody, verifyTransactionPlanDigest } from "./transaction-plan-engine.js";
import { stableTransactionSerialize } from "./transaction-plan.js";
import type { TransactionPorts } from "./transaction-ports.js";
import type { DryRunReport, TransactionPlan } from "./transaction-types.js";

export async function dryRunTransaction(plan: TransactionPlan, ports: TransactionPorts): Promise<DryRunReport> {
  const valid = validateTransactionPlanBody(plan);
  if (valid.ok && verifyTransactionPlanDigest(plan, ports.digest)) return dryRunCore(plan, ports);
  const base = Object.freeze({
    schemaVersion: 1 as const,
    dryRunContractVersion: "1.0" as const,
    planDigest: plan.planDigest,
    outcome: "BLOCKED" as const,
    observedStateBindings: Object.freeze([]),
    intentResults: Object.freeze([]),
    findings: Object.freeze([{ code: "PLAN_INVALID", severity: "ERROR" as const, summary: "Transaction plan is invalid or its digest does not match" }]),
  });
  return Object.freeze({ ...base, reportDigest: ports.digest.digest(stableTransactionSerialize(base)) });
}
