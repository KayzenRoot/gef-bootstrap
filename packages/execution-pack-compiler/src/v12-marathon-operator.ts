/**
 * U12-03: read-only next-action projection for Marathon operators.
 * Does not grant actor privilege, write to stores or execute providers.
 * Exact source/actor binding and sealed state are verified on every call.
 */
import { readyMarathonNodes, validateMarathonState } from './v12-marathon.js';
import type { MarathonDigest, MarathonPlan, MarathonResult, MarathonState, MarathonStatus } from './v12-marathon.js';

export type MarathonNextAction =
  | 'START' | 'RECONCILE' | 'RESUME' | 'INSPECT_FAILURE'
  | 'WAIT_DEPENDENCIES' | 'STOP_BLOCKED' | 'NONE';

export interface MarathonNodeDecision {
  readonly nodeId: string;
  readonly status: MarathonStatus;
  readonly action: MarathonNextAction;
  readonly reasonCode: string;
  readonly unresolvedDependencies: readonly string[];
  readonly intentId: string | null;
}

export interface MarathonOperatorView {
  readonly workOrderId: string;
  readonly actor: string;
  readonly baseSha: string;
  readonly lockDigest: string;
  readonly planDigest: string;
  readonly stateDigest: string;
  readonly paused: boolean;
  readonly decisions: readonly MarathonNodeDecision[];
  readonly eligibleStarts: readonly string[];
  /** This is a presentation recommendation, never authority for execution. */
  readonly nextLegalActions: readonly MarathonNextAction[];
}

function decideNode(
  plan: MarathonPlan, state: MarathonState, nodeId: string,
  eligible: ReadonlySet<string>,
): MarathonNodeDecision {
  const s = state.steps[nodeId]!;
  const node = plan.nodes.find(candidate => candidate.id === nodeId)!;
  const unresolvedDependencies = node.deps.filter(dep => state.steps[dep]?.status !== 'VERIFIED');
  let action: MarathonNextAction = 'NONE';
  let reasonCode = 'ALREADY_VERIFIED';
  if (s.status === 'ACTIVE') {
    action = 'RECONCILE';
    reasonCode = 'IN_FLIGHT_EFFECT_REQUIRES_PROOF';
  } else if (s.status === 'FAILED') {
    action = 'INSPECT_FAILURE';
    reasonCode = 'FIRST_FAILURE_RETAINED';
  } else if (s.status === 'BLOCKED') {
    action = 'STOP_BLOCKED';
    reasonCode = 'DEPENDENCY_OR_CANCELLATION_STOP';
  } else if (s.status === 'PENDING' && state.paused) {
    action = 'RESUME';
    reasonCode = 'OPERATOR_PAUSED';
  } else if (s.status === 'PENDING' && eligible.has(nodeId)) {
    action = 'START';
    reasonCode = 'ADMITTED_AND_DEPENDENCIES_VERIFIED';
  } else if (s.status === 'PENDING') {
    action = 'WAIT_DEPENDENCIES';
    reasonCode = 'DEPENDENCY_NOT_VERIFIED';
  }
  return {
    nodeId, status: s.status, action, reasonCode,
    unresolvedDependencies: [...unresolvedDependencies].sort((a, b) => a.localeCompare(b)),
    intentId: s.intentId,
  };
}

export function describeMarathonNextActions(
  plan: MarathonPlan, state: MarathonState,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
): MarathonResult<MarathonOperatorView> {
  if (!plan || !state || !current ||
      plan.actor !== current.actor ||
      plan.baseSha !== current.baseSha ||
      plan.lockDigest !== current.lockDigest)
    return { ok: false, code: 'OPERATOR_SOURCE_OR_ACTOR_DRIFT' };
  const validated = validateMarathonState(plan, state, digest);
  if (!validated.ok) return validated;
  const ready = readyMarathonNodes(plan, state, digest);
  if (!ready.ok) return ready;

  // The same read/write conflicts checked at provider START are excluded from
  // operator-recommended starts. A stale client can NEVER gain authority here.
  const active = plan.nodes.filter(node => state.steps[node.id]?.status === 'ACTIVE');
  const overlaps = (a: readonly string[], b: readonly string[]) =>
    a.some(left => b.some(right =>
      left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)));
  const eligibleStarts = ready.value.filter(id => {
    const node = plan.nodes.find(item => item.id === id)!;
    return active.every(other =>
      !overlaps(node.writes, [...other.writes, ...other.reads]) &&
      !overlaps(other.writes, node.reads));
  });
  const eligible = new Set(eligibleStarts);
  const ids = plan.nodes.map(node => node.id).sort((a, b) => a.localeCompare(b));
  const decisions = ids.map(id => decideNode(plan, state, id, eligible));
  const actions = [...new Set(decisions.map(item => item.action))];
  return { ok: true, value: {
    workOrderId: plan.workOrderId, actor: plan.actor,
    baseSha: plan.baseSha, lockDigest: plan.lockDigest,
    planDigest: plan.planDigest, stateDigest: state.stateDigest,
    paused: state.paused, decisions, eligibleStarts,
    nextLegalActions: actions,
  } };
}
