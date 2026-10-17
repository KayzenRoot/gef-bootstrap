/**
 * U12-03: pure, source-bound orchestration state machine.
 * This module NEVER executes a mutation or grants actor authority: its caller
 * must validate admission/actor, persist snapshots atomically, and verify
 * immutable execution evidence before recording a VERIFIED receipt.
 */
import type { CompiledExecutionPack } from './types.js';

export type MarathonStatus = 'PENDING' | 'ACTIVE' | 'VERIFIED' | 'FAILED' | 'BLOCKED';
export type MarathonDigest = (canonical: string) => string;
export type MarathonResult<T> = { ok: true; value: T } | { ok: false; code: string };
export interface MarathonNode {
  readonly id: string;
  readonly deps: readonly string[];
  readonly reads: readonly string[];
  readonly writes: readonly string[];
}
export interface MarathonRequest {
  readonly workOrderId: string;
  readonly actor: string;
  readonly baseSha: string;
  readonly lockDigest: string;
  readonly nodes: readonly MarathonNode[];
}
export interface MarathonPlan extends MarathonRequest {
  readonly waves: readonly (readonly string[])[];
  readonly planDigest: string;
}
export interface MarathonStepState {
  readonly status: MarathonStatus;
  readonly intentId: string | null;
  readonly proofDigest: string | null;
}
export interface MarathonState {
  readonly planDigest: string;
  readonly paused: boolean;
  readonly steps: Readonly<Record<string, MarathonStepState>>;
  readonly stateDigest: string;
}
export type MarathonAction =
  | { readonly type: 'START'; readonly nodeId: string; readonly intentId: string }
  | { readonly type: 'SETTLE'; readonly nodeId: string; readonly intentId: string; readonly outcome: 'VERIFIED' | 'FAILED'; readonly proofDigest: string }
  | { readonly type: 'CANCEL'; readonly nodeId: string }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' };

const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const validId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);
const OK = <T>(value: T): MarathonResult<T> => ({ ok: true, value });
const BAD = <T>(code: string): MarathonResult<T> => ({ ok: false, code });
const compareText = (a: string, b: string): number => a.localeCompare(b);
const sorted = (xs: readonly string[]): string[] => [...xs].sort(compareText);
const unique = (xs: readonly string[]): boolean => xs.length === new Set(xs).size;
const canonical = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const o = value as Record<string, unknown>;
  const entries = Object.keys(o).sort(compareText).map(k => {
    const field = `${JSON.stringify(k)}:${canonical(o[k])}`;
    return field;
  });
  return `{${entries.join(',')}}`;
};
const hash = (digest: MarathonDigest, kind: string, data: unknown): string => {
  const value = digest(`GEF:V12:${kind}\n${canonical(data)}`);
  return `sha256:${value}`;
};
const safeDigest = (value: string): boolean => DIGEST.test(value);
const validPath = (p: string): boolean =>
  typeof p === 'string' && p.length > 0 && p.length <= 255 && !p.startsWith('/') &&
  !p.includes('\\') && !p.includes('\0') && !p.includes('*') && !p.includes('?') &&
  p.split('/').every(segment => segment.length > 0 && segment !== '.' && segment !== '..') &&
  !/^[A-Za-z]:/.test(p);
const intersects = (left: readonly string[], right: readonly string[]): boolean =>
  left.some(a => right.some(b => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)));

/** Reject a non-admitted/malformed graph and concurrent mutation collisions. */
export function compileMarathon(request: MarathonRequest, digest: MarathonDigest): MarathonResult<MarathonPlan> {
  if (!request || !Array.isArray(request.nodes) || !validId(request.workOrderId) || !validId(request.actor) || !SHA.test(request.baseSha) ||
      !safeDigest(request.lockDigest) || request.nodes.length === 0 || request.nodes.length > 512) return BAD('INVALID_BINDING');
  const raw: readonly MarathonNode[] = request.nodes;
  if (raw.some(n => !n || !validId(n.id) || !Array.isArray(n.deps) || !Array.isArray(n.reads) || !Array.isArray(n.writes) ||
      !unique(n.deps) || !unique(n.reads) || !unique(n.writes) || n.deps.some(d => !validId(d)) ||
      [...n.reads, ...n.writes].some(p => !validPath(p))) || !unique(raw.map(n => n.id))) return BAD('INVALID_NODE');
  if (raw.reduce((sum, n) => sum + n.deps.length, 0) > 4096) return BAD('EDGE_BUDGET');
  const byId = new Map(raw.map(n => [n.id, n]));
  if (raw.some(n => n.deps.some(d => !byId.has(d)))) return BAD('UNKNOWN_DEPENDENCY');
  const left = new Set(byId.keys()), done = new Set<string>(), waves: string[][] = [];
  while (left.size) {
    const wave = sorted([...left].filter(id => byId.get(id)!.deps.every(d => done.has(d))));
    if (!wave.length) return BAD('DEPENDENCY_CYCLE');
    for (let i = 0; i < wave.length; i++) for (let j = i + 1; j < wave.length; j++) {
      const a = byId.get(wave[i]!)!, b = byId.get(wave[j]!)!;
      if (intersects(a.writes, [...b.writes, ...b.reads]) || intersects(b.writes, a.reads)) return BAD('CONCURRENT_WRITE_CONFLICT');
    }
    waves.push(wave);
    for (const id of wave) { left.delete(id); done.add(id); }
  }
  const nodes = sorted(raw.map(n => n.id)).map(id => {
    const n = byId.get(id)!;
    return { id, deps: sorted(n.deps), reads: sorted(n.reads), writes: sorted(n.writes) };
  });
  const body = { workOrderId: request.workOrderId, actor: request.actor, baseSha: request.baseSha, lockDigest: request.lockDigest, nodes, waves };
  const planDigest = hash(digest, 'MARATHON_PLAN', body);
  if (!safeDigest(planDigest)) return BAD('INVALID_DIGEST_PORT');
  return OK({ ...body, planDigest });
}

function seal(planDigest: string, paused: boolean, steps: Record<string, MarathonStepState>, digest: MarathonDigest): MarathonState {
  const stateDigest = hash(digest, 'MARATHON_STATE', { planDigest, paused, steps });
  return { planDigest, paused, steps, stateDigest };
}
export function initialMarathonState(plan: MarathonPlan, digest: MarathonDigest): MarathonResult<MarathonState> {
  const compiled = compileMarathon(plan, digest);
  if (!compiled.ok || compiled.value.planDigest !== plan.planDigest) return BAD('PLAN_TAMPERED');
  const steps: Record<string, MarathonStepState> = Object.create(null) as Record<string, MarathonStepState>;
  for (const node of plan.nodes) steps[node.id] = { status: 'PENDING', intentId: null, proofDigest: null };
  return OK(seal(plan.planDigest, false, steps, digest));
}

/** Steps eligible for execution, not a command to execute them. */
export function readyMarathonNodes(plan: MarathonPlan, state: MarathonState, digest: MarathonDigest): MarathonResult<readonly string[]> {
  const valid = validateMarathonState(plan, state, digest);
  if (!valid.ok) return valid;
  if (state.paused) return OK([]);
  return OK(sorted(plan.nodes.filter(n => state.steps[n.id]?.status === 'PENDING' &&
      n.deps.every(d => state.steps[d]?.status === 'VERIFIED')).map(n => n.id)));
}

export function validateMarathonState(plan: MarathonPlan, state: MarathonState, digest: MarathonDigest): MarathonResult<true> {
  if (!state?.steps) return BAD('STATE_INVALID');
  const compiled = compileMarathon(plan, digest);
  if (!compiled.ok || compiled.value.planDigest !== plan.planDigest || state.planDigest !== plan.planDigest) return BAD('PLAN_STALE');
  const ids = sorted(plan.nodes.map(n => n.id));
  if (typeof state.paused !== 'boolean' || !state.steps || canonical(sorted(Object.keys(state.steps))) !== canonical(ids)) return BAD('STATE_NODES_MISMATCH');
  const usedIntents = new Set<string>();
  const graph = new Map(plan.nodes.map(node => [node.id, node]));
  for (const id of ids) {
    const s = state.steps[id];
    if (!s || !['PENDING', 'ACTIVE', 'VERIFIED', 'FAILED', 'BLOCKED'].includes(s.status) ||
        (s.status === 'PENDING' && (s.intentId !== null || s.proofDigest !== null)) ||
        (s.status === 'ACTIVE' && (!s.intentId || s.proofDigest !== null)) ||
        (['VERIFIED', 'FAILED'].includes(s.status) && (!s.intentId || !s.proofDigest || !safeDigest(s.proofDigest))) ||
        (s.status === 'BLOCKED' && (s.intentId !== null || s.proofDigest !== null))) return BAD('STATE_INVALID');
    if (s.intentId !== null) {
      if (!validId(s.intentId) || usedIntents.has(s.intentId)) return BAD('STATE_INTENT_REUSED');
      usedIntents.add(s.intentId);
    }
    if (s.status === 'ACTIVE' || s.status === 'VERIFIED' || s.status === 'FAILED') {
      if (!graph.get(id)?.deps.every(dep => state.steps[dep]?.status === 'VERIFIED')) return BAD('STATE_DEPENDENCY_VIOLATION');
    }
  }
  // Imported snapshots must uphold the same exclusion rule as live START.
  const active = ids.filter(id => state.steps[id]?.status === 'ACTIVE');
  for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
    const a = graph.get(active[i]!)!, b = graph.get(active[j]!)!;
    if (intersects(a.writes, [...b.writes, ...b.reads]) || intersects(b.writes, a.reads))
      return BAD('STATE_RESOURCE_CONFLICT');
  }
  const expected = hash(digest, 'MARATHON_STATE', { planDigest: state.planDigest, paused: state.paused, steps: state.steps });
  if (!safeDigest(expected) || expected !== state.stateDigest) return BAD('STATE_TAMPERED');
  return OK(true);
}

/** Check exact source/lock/actor before ANY state transition or evidence reuse. */
export function advanceMarathon(plan: MarathonPlan, state: MarathonState, action: MarathonAction,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string }, digest: MarathonDigest): MarathonResult<MarathonState> {
  if (!plan || !state || !current || !action) return BAD('INVALID_ACTION');
  if (current.baseSha !== plan.baseSha || current.lockDigest !== plan.lockDigest || current.actor !== plan.actor) return BAD('STALE_OR_WRONG_ACTOR');
  const v = validateMarathonState(plan, state, digest);
  if (!v.ok) return v;
  if (action.type === 'PAUSE' || action.type === 'RESUME') {
    const paused = action.type === 'PAUSE';
    return OK(paused === state.paused ? state : seal(plan.planDigest, paused, { ...state.steps }, digest));
  }
  const previous = state.steps[action.nodeId];
  if (!previous) return BAD('UNKNOWN_STEP_OR_INTENT');
  if (action.type === 'CANCEL') {
    if (previous.status === 'ACTIVE') return BAD('EFFECT_UNCERTAIN_RECONCILE');
    if (previous.status !== 'PENDING') return BAD('NOT_PENDING');
    const next = { ...state.steps };
    const blocked = new Set([action.nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of plan.nodes) if (!blocked.has(node.id) && node.deps.some(d => blocked.has(d))) {
        blocked.add(node.id); changed = true;
      }
    }
    for (const id of blocked) if (next[id]?.status === 'PENDING') {
      next[id] = { status: 'BLOCKED', intentId: null, proofDigest: null };
    }
    return OK(seal(plan.planDigest, state.paused, next, digest));
  }
  if (!validId(action.intentId)) return BAD('UNKNOWN_STEP_OR_INTENT');
  if (action.type === 'SETTLE' && previous.status === action.outcome &&
      previous.intentId === action.intentId && previous.proofDigest === action.proofDigest) return OK(state); // proven replay is a no-op
  const next = { ...state.steps };
  if (action.type === 'START') {
    if (state.paused) return BAD('PAUSED');
    if (previous.status === 'ACTIVE') return BAD('EFFECT_UNCERTAIN_RECONCILE');
    if (previous.status !== 'PENDING') return BAD('NOT_PENDING');
    if (Object.values(state.steps).some(s => s.intentId === action.intentId)) return BAD('INTENT_REUSED');
    const node = plan.nodes.find(n => n.id === action.nodeId)!;
    if (!node.deps.every(d => state.steps[d]?.status === 'VERIFIED')) return BAD('DEPENDENCY_NOT_VERIFIED');
    for (const other of plan.nodes) if (state.steps[other.id]?.status === 'ACTIVE') {
      if (intersects(node.writes, [...other.writes, ...other.reads]) || intersects(other.writes, node.reads))
        return BAD('ACTIVE_RESOURCE_CONFLICT');
    }
    next[action.nodeId] = { status: 'ACTIVE', intentId: action.intentId, proofDigest: null };
  } else {
    if (previous.status !== 'ACTIVE' || previous.intentId !== action.intentId) return BAD('UNBOUND_PROOF_OR_REPLAY');
    if (!safeDigest(action.proofDigest)) return BAD('INVALID_PROOF_DIGEST');
    next[action.nodeId] = { status: action.outcome, intentId: action.intentId, proofDigest: action.proofDigest };
    if (action.outcome === 'FAILED') {
      const blocked = new Set([action.nodeId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of plan.nodes) if (!blocked.has(node.id) && node.deps.some(d => blocked.has(d))) {
          blocked.add(node.id); changed = true;
        }
      }
      for (const id of blocked) if (id !== action.nodeId && next[id]?.status === 'PENDING') {
        next[id] = { status: 'BLOCKED', intentId: null, proofDigest: null };
      }
    }
  }
  return OK(seal(plan.planDigest, state.paused, next, digest));
}

/**
 * M15 integration boundary. Consume an already compiled execution pack rather
 * than accepting an unrelated executor graph. This projection never authorizes
 * a provider action: callers must validate ownership and receipt provenance.
 */
export function compileMarathonFromExecutionPack(
  compiled: CompiledExecutionPack,
  binding: Pick<MarathonRequest, 'workOrderId' | 'actor' | 'baseSha' | 'lockDigest'>,
  digest: MarathonDigest,
): MarathonResult<MarathonPlan> {
  const pack = compiled?.pack;
  const receipt = compiled?.receipt;
  const envelope = compiled?.envelope;
  const cert = compiled?.certificate;
  if (!pack || !receipt || !envelope || !cert ||
      !Array.isArray(receipt.diagnostics) || !Array.isArray(cert.missingItems) ||
      receipt.status !== 'VALID' || receipt.diagnostics.length !== 0 ||
      receipt.semanticDigest !== pack.semanticDigest ||
      receipt.contextDigest !== pack.contextDigest ||
      receipt.taskIdentity !== pack.taskIdentity ||
      receipt.contextIdentity !== pack.contextIdentity ||
      receipt.policyVersion !== pack.policyVersion ||
      receipt.capabilityIdentity !== pack.capabilityIdentity ||
      receipt.graphDigest !== pack.graphDigest ||
      receipt.toolPlanDigest !== pack.toolPlanDigest ||
      receipt.validationPlanDigest !== pack.validationPlanDigest ||
      envelope.packId !== pack.packId ||
      envelope.taskIdentity !== pack.taskIdentity ||
      envelope.contextIdentity !== pack.contextIdentity ||
      cert.packId !== pack.packId || cert.complete !== true ||
      cert.missingItems.length !== 0 ||
      !Array.isArray(pack.workDag) || !Array.isArray(pack.safeParallelWaves) ||
      pack.workDag.length === 0) return BAD('EXECUTION_PACK_NOT_ADMITTED');
  if (pack.workDag.some(node => !node || typeof node !== 'object') ||
      pack.safeParallelWaves.some(wave => !Array.isArray(wave) ||
        wave.some(id => !validId(id)))) return BAD('PACK_NODE_INCOMPLETE');

  const nodes: MarathonNode[] = pack.workDag.map(node => ({
    id: node.instructionId,
    deps: node.dependsOn,
    reads: node.targetFiles,
    // Conservative: M15 targets may be mutated. Never downgrade to read-only.
    writes: node.targetFiles,
  }));
  if (pack.workDag.some(node =>
    !Array.isArray(node.preconditions) || node.preconditions.length === 0 ||
    !Array.isArray(node.evidenceOutputs) || node.evidenceOutputs.length === 0 ||
    typeof node.mutationSpec !== 'string' || node.mutationSpec.trim() === '' ||
    !Array.isArray(node.targetFiles) || node.targetFiles.length === 0)) return BAD('PACK_NODE_INCOMPLETE');

  const plan = compileMarathon({ ...binding, nodes }, digest);
  if (!plan.ok) return plan;
  // The M15 safe-parallelism matrix is authoritative. Do not silently invent
  // wider waves or bypass a provider's strict serialization constraint.
  const m15Waves = pack.safeParallelWaves.map(wave => sorted(wave));
  const expected = plan.value.waves.map(wave => sorted(wave));
  if (canonical(m15Waves) !== canonical(expected)) return BAD('PACK_WAVE_MISMATCH');
  return plan;
}
