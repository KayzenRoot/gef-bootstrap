/**
 * U12-03: bounded, storage-agnostic persistence boundary for Marathon.
 *
 * Implementations of MarathonStateStore MUST provide durable atomic CAS.
 * Neither this adapter nor an accepted CAS result is authority to execute
 * privileged side effects or accept a proof. A pending operation is persisted
 * as ACTIVE before a caller invokes the provider. After a crash, ACTIVE is
 * ambiguous and is NEVER retried automatically.
 */
import {
  advanceMarathon, initialMarathonState, readyMarathonNodes, validateMarathonState,
} from './v12-marathon.js';
import type {
  MarathonAction, MarathonDigest, MarathonPlan, MarathonResult, MarathonState,
} from './v12-marathon.js';

export interface MarathonStateStore {
  /** A null response means there is no durable snapshot, NOT permission to reset. */
  read(planDigest: string): Promise<MarathonState | null>;
  /** Must atomically compare the prior durable digest and write the new snapshot. */
  compareAndSwap(planDigest: string, expectedStateDigest: string, next: MarathonState): Promise<boolean>;
  /** Optional durable create-if-absent with atomic, collision-resistant key ownership. */
  createIfAbsent?(planDigest: string, initial: MarathonState): Promise<boolean>;
}

/**
 * External verifier MUST check a real provider/evidence receipt bound to this
 * plan, intent and exact state. A digest format alone is not a proof.
 */
export interface MarathonSettlementProofPort {
  verify(
    plan: MarathonPlan, prior: MarathonState,
    action: Extract<MarathonAction, { type: 'SETTLE' }>,
  ): Promise<boolean>;
}

export interface MarathonRecoveryDecision {
  readonly status: 'READY' | 'PAUSED' | 'RECONCILIATION_REQUIRED';
  /** ACTIVE receipts must be reconciled with authoritative provider evidence. */
  readonly unresolvedIntentIds: readonly string[];
  /** PENDING nodes safe to consider next, not permission to execute effects. */
  readonly readyNodeIds: readonly string[];
  readonly stateDigest: string;
}

/**
 * Atomically initialize a brand new Marathon. A previous durable record is
 * NEVER overwritten or treated as permission to replay provider mutations.
 * The store must provide real durable create-if-absent, not read-then-write.
 */
export async function initializePersistedMarathon(
  plan: MarathonPlan,
  store: MarathonStateStore,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
): Promise<MarathonResult<MarathonState>> {
  if (!plan || !store || typeof store.createIfAbsent !== 'function' || !current ||
      current.baseSha !== plan.baseSha || current.lockDigest !== plan.lockDigest ||
      current.actor !== plan.actor) return { ok: false, code: 'PERSISTENCE_INITIALIZATION_INVALID' };
  const created = initialMarathonState(plan, digest);
  if (!created.ok) return created;
  try {
    const saved = await store.createIfAbsent(plan.planDigest, created.value);
    if (!saved) return { ok: false, code: 'SNAPSHOT_EXISTS_REQUIRES_RECOVERY' };
    return created;
  } catch {
    return { ok: false, code: 'PERSISTENCE_UNAVAILABLE' };
  }
}

/**
 * Loads and validates a durable snapshot before any continuation. Refuses
 * missing snapshots rather than guessing whether an earlier process mutated
 * the world before crashing.
 */
export async function recoverPersistedMarathon(
  plan: MarathonPlan,
  store: MarathonStateStore,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
): Promise<MarathonResult<MarathonRecoveryDecision>> {
  if (!store || typeof store.read !== 'function' || !plan || !current ||
      current.baseSha !== plan.baseSha || current.lockDigest !== plan.lockDigest ||
      current.actor !== plan.actor) return { ok: false, code: 'RECOVERY_BINDING_INVALID' };
  try {
    const state = await store.read(plan.planDigest);
    if (!state) return { ok: false, code: 'SNAPSHOT_MISSING_REQUIRES_RECONCILIATION' };
    const checked = validateMarathonState(plan, state, digest);
    if (!checked.ok) return { ok: false, code: checked.code };
    const active = plan.nodes.filter(n => state.steps[n.id]?.status === 'ACTIVE');
    const unresolvedIntentIds = active.map(n => state.steps[n.id]!.intentId!);
    const next = readyMarathonNodes(plan, state, digest);
    if (!next.ok) return { ok: false, code: next.code };
    // An independent pending step can progress only if no in-flight mutation
    // overlaps its read/write closure. This is a candidate list, not a replay.
    const readyNodeIds = next.value.filter(id => {
      const n = plan.nodes.find(node => node.id === id)!;
      return active.every(a => {
        const overlaps = (xs: readonly string[], ys: readonly string[]) =>
          xs.some(left => ys.some(right =>
            left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)));
        return !overlaps(a.writes, [...n.writes, ...n.reads]) &&
          !overlaps(n.writes, a.reads);
      });
    });
    return { ok: true, value: {
      status: unresolvedIntentIds.length ? 'RECONCILIATION_REQUIRED' : state.paused ? 'PAUSED' : 'READY',
      unresolvedIntentIds,
      readyNodeIds,
      stateDigest: state.stateDigest,
    } };
  } catch {
    return { ok: false, code: 'PERSISTENCE_UNAVAILABLE' };
  }
}

/**
 * Atomic state transition with optimistic concurrency. A rejected CAS NEVER
 * authorizes provider execution. The caller must reload, verify and reconcile.
 */
export async function persistMarathonTransition(
  plan: MarathonPlan,
  store: MarathonStateStore,
  action: MarathonAction,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
  proofAuthority?: MarathonSettlementProofPort,
): Promise<MarathonResult<MarathonState>> {
  if (!store || typeof store.read !== 'function' ||
      typeof store.compareAndSwap !== 'function' || !plan || !action || !current)
    return { ok: false, code: 'PERSISTENCE_BINDING_INVALID' };
  if (current.baseSha !== plan.baseSha || current.lockDigest !== plan.lockDigest ||
      current.actor !== plan.actor) return { ok: false, code: 'STALE_OR_WRONG_ACTOR' };
  try {
    const old = await store.read(plan.planDigest);
    if (!old) return { ok: false, code: 'SNAPSHOT_MISSING_REQUIRES_RECONCILIATION' };
    const next = advanceMarathon(plan, old, action, current, digest);
    if (!next.ok) return next;
    if (action.type === 'SETTLE') {
      if (!proofAuthority || typeof proofAuthority.verify !== 'function')
        return { ok: false, code: 'SETTLEMENT_PROOF_AUTHORITY_REQUIRED' };
      let trusted = false;
      try {
        trusted = await proofAuthority.verify(plan, old, action);
      } catch {
        return { ok: false, code: 'SETTLEMENT_PROOF_VERIFICATION_UNAVAILABLE' };
      }
      if (trusted !== true) return { ok: false, code: 'SETTLEMENT_PROOF_NOT_VERIFIED' };
    }
    if (next.value.stateDigest === old.stateDigest) return next;
    const saved = await store.compareAndSwap(plan.planDigest, old.stateDigest, next.value);
    return saved ? next : { ok: false, code: 'PERSISTENCE_CAS_CONFLICT' };
  } catch {
    return { ok: false, code: 'PERSISTENCE_UNAVAILABLE' };
  }
}
