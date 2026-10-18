/**
 * U12-03: provider-neutral, fail-closed execution of a SINGLE Marathon step.
 * No autonomous privilege or release authority is introduced here.
 * The caller is responsible for admitting the executor and implementing
 * durable state storage and provider/evidence verification.
 */
import type { MarathonDigest, MarathonPlan, MarathonResult, MarathonState } from './v12-marathon.js';
import { recoverPersistedMarathon, persistMarathonTransition } from './v12-marathon-persistence.js';
import type { MarathonSettlementProofPort, MarathonStateStore } from './v12-marathon-persistence.js';

export interface MarathonStepProvider {
  /** Actual external side effects may happen; call only AFTER durable START. */
  execute(input: {
    readonly plan: MarathonPlan;
    readonly nodeId: string;
    readonly intentId: string;
    readonly persistedStartDigest: string;
  }): Promise<{ readonly outcome: 'VERIFIED' | 'FAILED'; readonly proofDigest: string }>;
}

export interface MarathonExecutionPorts {
  readonly provider: MarathonStepProvider;
  readonly proofAuthority: MarathonSettlementProofPort;
}
export async function executeMarathonStep(
  plan: MarathonPlan,
  store: MarathonStateStore,
  nodeId: string,
  intentId: string,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
  ports: MarathonExecutionPorts,
): Promise<MarathonResult<MarathonState>> {
  const provider = ports?.provider;
  const proofAuthority = ports?.proofAuthority;
  if (typeof provider?.execute !== 'function' ||
      typeof proofAuthority?.verify !== 'function')
    return { ok: false, code: 'EXECUTION_PORT_MISSING' };

  // Rehydrate and check the true durable state before issuing an intent.
  const recovery = await recoverPersistedMarathon(plan, store, current, digest);
  if (!recovery.ok) return recovery;
  if (!recovery.value.readyNodeIds.includes(nodeId))
    return { ok: false, code: 'STEP_NOT_DURABLY_READY' };

  // After this commit, a crash leaves ACTIVE behind. That state is ambiguous
  // and cannot be restarted without external reconciliation.
  const started = await persistMarathonTransition(
    plan, store, { type: 'START', nodeId, intentId }, current, digest,
  );
  if (!started.ok) return started;

  let result: { readonly outcome: 'VERIFIED' | 'FAILED'; readonly proofDigest: string };
  try {
    result = await provider.execute({
      plan, nodeId, intentId, persistedStartDigest: started.value.stateDigest,
    });
  } catch {
    // Provider could have mutated before failing. Do NOT mark FAILED or retry.
    return { ok: false, code: 'PROVIDER_OUTCOME_UNKNOWN_RECONCILE' };
  }
  if (!result || (result.outcome !== 'VERIFIED' && result.outcome !== 'FAILED')) {
    return { ok: false, code: 'PROVIDER_RESULT_UNVERIFIABLE_RECONCILE' };
  }

  // Never accept the provider's digest directly: verify an actual evidence
  // receipt via the required external proof authority before the CAS settle.
  return persistMarathonTransition(
    plan, store,
    { type: 'SETTLE', nodeId, intentId, outcome: result.outcome,
      proofDigest: result.proofDigest },
    current, digest, proofAuthority,
  );
}

/** Read-only provider lookup for an intent that was persisted before a crash. */
export interface MarathonReconciliationProvider {
  lookup(input: {
    readonly plan: MarathonPlan;
    readonly nodeId: string;
    readonly intentId: string;
  }): Promise<
    | { readonly status: 'UNKNOWN' }
    | { readonly status: 'VERIFIED' | 'FAILED'; readonly proofDigest: string }
  >;
}

/**
 * Recover one ambiguous ACTIVE step by looking up authoritative provider
 * evidence. Never invokes execute(), never invents success for an unknown
 * result, and never overwrites a concurrent settlement.
 */
export async function reconcileMarathonStep(
  plan: MarathonPlan,
  store: MarathonStateStore,
  nodeId: string,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
  provider: MarathonReconciliationProvider,
  proofAuthority: MarathonSettlementProofPort,
): Promise<MarathonResult<MarathonState>> {
  if (!provider || typeof provider.lookup !== 'function' ||
      !proofAuthority || typeof proofAuthority.verify !== 'function')
    return { ok: false, code: 'RECONCILIATION_PORT_MISSING' };

  const recovery = await recoverPersistedMarathon(plan, store, current, digest);
  if (!recovery.ok) return recovery;

  // Store and plan are validated again at persistMarathonTransition. This
  // preliminary read only identifies the previously recorded durable intent.
  let state: MarathonState | null;
  try {
    state = await store.read(plan.planDigest);
  } catch {
    return { ok: false, code: 'PERSISTENCE_UNAVAILABLE' };
  }
  if (!state) return { ok: false, code: 'SNAPSHOT_MISSING_REQUIRES_RECONCILIATION' };
  const step = state.steps[nodeId];
  if (!step?.intentId || step.status !== 'ACTIVE')
    return { ok: false, code: 'RECONCILIATION_STEP_NOT_ACTIVE' };

  let result: Awaited<ReturnType<MarathonReconciliationProvider['lookup']>>;
  try {
    result = await provider.lookup({ plan, nodeId, intentId: step.intentId });
  } catch {
    return { ok: false, code: 'RECONCILIATION_LOOKUP_UNAVAILABLE' };
  }
  if (!result || result.status === 'UNKNOWN')
    return { ok: false, code: 'RECONCILIATION_PROOF_PENDING' };
  if (result.status !== 'VERIFIED' && result.status !== 'FAILED')
    return { ok: false, code: 'RECONCILIATION_PROOF_INVALID' };

  return persistMarathonTransition(
    plan, store,
    { type: 'SETTLE', nodeId, intentId: step.intentId,
      outcome: result.status, proofDigest: result.proofDigest },
    current, digest, proofAuthority,
  );
}
