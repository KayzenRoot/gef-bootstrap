/**
 * U12-03: pure, source-bound orchestration state machine.
 * This module NEVER executes a mutation or grants actor authority: its caller
 * must validate admission/actor, persist snapshots atomically, and verify
 * immutable execution evidence before recording a VERIFIED receipt.
 */
import type { CompiledExecutionPack } from './types.js';
import { evaluatePackReplay } from './s05-receipt.js';

export type MarathonStatus = 'PENDING' | 'ACTIVE' | 'VERIFIED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';
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
  /** Trusted M15 Safe Parallelism Matrix refinement; still validated against the DAG. */
  readonly admittedWaves?: readonly (readonly string[])[];
}
export interface MarathonPlan extends MarathonRequest {
  readonly waves: readonly (readonly string[])[];
  readonly planDigest: string;
}
export interface MarathonStepState {
  readonly status: MarathonStatus;
  readonly intentId: string | null;
  readonly proofDigest: string | null;
  /** Persisted terminal stop provenance; SKIPPED never satisfies dependencies. */
  readonly stopReasonCode?: string | null;
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
  | { readonly type: 'SKIP'; readonly nodeId: string; readonly reasonCode: string }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' };

const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const validId = (value: unknown): value is string => typeof value === 'string' && ID.test(value);
const OK = <T>(value: T): MarathonResult<T> => ({ ok: true, value });
const BAD = <T>(code: string): MarathonResult<T> => ({ ok: false, code });
/** Locale-independent code-unit ordering for cross-platform state fingerprints. */
const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
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
/** One conservative path-exclusion rule for waves, live START, recovery and operator. */
export const marathonNodesConflict = (a: MarathonNode, b: MarathonNode): boolean =>
  intersects(a.writes, [...b.writes, ...b.reads]) ||
  intersects(b.writes, a.reads);


function isInvalidMarathonNode(n: MarathonNode): boolean {
  return !n || !validId(n.id) || !Array.isArray(n.deps) ||
    !Array.isArray(n.reads) || !Array.isArray(n.writes) ||
    !unique(n.deps) || !unique(n.reads) || !unique(n.writes) ||
    n.deps.some(dep => !validId(dep)) ||
    [...n.reads, ...n.writes].some(path => !validPath(path));
}

function waveHasWriteConflict(
  wave: readonly string[], byId: ReadonlyMap<string, MarathonNode>,
): boolean {
  for (let i = 0; i < wave.length; i++) {
    for (let j = i + 1; j < wave.length; j++) {
      const a = byId.get(wave[i]!)!;
      const b = byId.get(wave[j]!)!;
      if (marathonNodesConflict(a, b)) return true;
    }
  }
  return false;
}

function buildMarathonWaves(
  byId: ReadonlyMap<string, MarathonNode>,
): MarathonResult<string[][]> {
  const left = new Set(byId.keys());
  const done = new Set<string>();
  const waves: string[][] = [];
  while (left.size > 0) {
    const wave = sorted([...left].filter(id => byId.get(id)!.deps.every(d => done.has(d))));
    if (wave.length === 0) return BAD('DEPENDENCY_CYCLE');
    if (waveHasWriteConflict(wave, byId)) return BAD('CONCURRENT_WRITE_CONFLICT');
    waves.push(wave);
    for (const id of wave) {
      left.delete(id);
      done.add(id);
    }
  }
  return OK(waves);
}

/**
 * M15 may split an ordinary dependency wave to serialize overlapping mutation
 * domains even when file targets are distinct. Preserve that safe refinement
 * without accepting omitted nodes, dependency inversion, duplicate IDs,
 * out-of-order causality or concurrent conflicting file writes.
 */
function verifyAdmittedMarathonWaves(
  byId: ReadonlyMap<string, MarathonNode>,
  candidate: readonly (readonly string[])[],
): MarathonResult<string[][]> {
  if (!Array.isArray(candidate) || candidate.length === 0 ||
      candidate.length > byId.size)
    return BAD('PACK_WAVE_MISMATCH');
  const done = new Set<string>();
  const waves: string[][] = [];
  for (const rawWave of candidate) {
    if (!Array.isArray(rawWave) || rawWave.length === 0 ||
        rawWave.length > byId.size || rawWave.some(id => !validId(id) ||
          !byId.has(id) || done.has(id)) ||
        new Set(rawWave).size !== rawWave.length)
      return BAD('PACK_WAVE_MISMATCH');
    if (rawWave.some(id => !byId.get(id)!.deps.every(dep => done.has(dep))))
      return BAD('PACK_WAVE_MISMATCH');
    const wave = sorted(rawWave);
    if (waveHasWriteConflict(wave, byId)) return BAD('CONCURRENT_WRITE_CONFLICT');
    waves.push(wave);
    for (const id of wave) done.add(id);
  }
  if (done.size !== byId.size) return BAD('PACK_WAVE_MISMATCH');
  return OK(waves);
}

/** Reject a non-admitted/malformed graph and concurrent mutation collisions. */
export function compileMarathon(request: MarathonRequest, digest: MarathonDigest): MarathonResult<MarathonPlan> {
  if (!request || !Array.isArray(request.nodes) || !validId(request.workOrderId) || !validId(request.actor) || !SHA.test(request.baseSha) ||
      !safeDigest(request.lockDigest) || request.nodes.length === 0 || request.nodes.length > 512) return BAD('INVALID_BINDING');
  const raw: readonly MarathonNode[] = request.nodes;
  if (raw.some(isInvalidMarathonNode) || !unique(raw.map(n => n.id))) return BAD('INVALID_NODE');
  if (raw.reduce((sum, n) => sum + n.deps.length, 0) > 4096) return BAD('EDGE_BUDGET');
  const byId = new Map(raw.map(n => [n.id, n]));
  if (raw.some(n => n.deps.some(d => !byId.has(d)))) return BAD('UNKNOWN_DEPENDENCY');
  const waveResult = request.admittedWaves === undefined
    ? buildMarathonWaves(byId)
    : verifyAdmittedMarathonWaves(byId, request.admittedWaves);
  if (!waveResult.ok) return waveResult;
  const waves = waveResult.value;
  const nodes = sorted(raw.map(n => n.id)).map(id => {
    const n = byId.get(id)!;
    return { id, deps: sorted(n.deps), reads: sorted(n.reads), writes: sorted(n.writes) };
  });
  const body = {
    workOrderId: request.workOrderId, actor: request.actor, baseSha: request.baseSha,
    lockDigest: request.lockDigest, nodes, waves,
    ...(request.admittedWaves === undefined ? {} : { admittedWaves: waves }),
  };
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

function invalidMarathonStep(s: MarathonStepState | undefined): boolean {
  if (!s || !['PENDING', 'ACTIVE', 'VERIFIED', 'FAILED', 'BLOCKED', 'SKIPPED'].includes(s.status))
    return true;
  if (s.status === 'PENDING')
    return s.intentId !== null || s.proofDigest !== null || s.stopReasonCode != null;
  if (s.status === 'BLOCKED')
    return s.intentId !== null || s.proofDigest !== null ||
      (s.stopReasonCode != null && !validId(s.stopReasonCode));
  if (s.status === 'SKIPPED')
    return s.intentId !== null || s.proofDigest !== null || !validId(s.stopReasonCode);
  if (s.status === 'ACTIVE')
    return !s.intentId || s.proofDigest !== null || s.stopReasonCode != null;
  return !s.intentId || !s.proofDigest || !safeDigest(s.proofDigest) ||
    (s.status === 'VERIFIED' && s.stopReasonCode != null) ||
    (s.status === 'FAILED' && s.stopReasonCode != null && !validId(s.stopReasonCode));
}

function invalidActiveResourceOverlap(
  ids: readonly string[],
  graph: ReadonlyMap<string, MarathonNode>,
): boolean {
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = graph.get(ids[i]!)!;
      const b = graph.get(ids[j]!)!;
      if (marathonNodesConflict(a, b)) return true;
    }
  }
  return false;
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
    if (!s || invalidMarathonStep(s)) return BAD('STATE_INVALID');
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
  if (invalidActiveResourceOverlap(active, graph)) return BAD('STATE_RESOURCE_CONFLICT');
  const expected = hash(digest, 'MARATHON_STATE', { planDigest: state.planDigest, paused: state.paused, steps: state.steps });
  if (!safeDigest(expected) || expected !== state.stateDigest) return BAD('STATE_TAMPERED');
  return OK(true);
}

function blockPendingDescendants(
  plan: MarathonPlan, steps: Record<string, MarathonStepState>,
  rootId: string, includeRoot: boolean, reasonCode: string = 'DEPENDENCY_STOPPED',
): void {
  const blocked = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of plan.nodes) {
      if (blocked.has(node.id) || !node.deps.some(dep => blocked.has(dep))) continue;
      blocked.add(node.id);
      changed = true;
    }
  }
  for (const id of blocked) {
    if ((includeRoot || id !== rootId) && steps[id]?.status === 'PENDING')
      steps[id] = { status: 'BLOCKED', intentId: null, proofDigest: null,
        stopReasonCode: id === rootId ? 'OPERATOR_CANCELLED' : reasonCode };
  }
}

function cancelMarathonNode(
  plan: MarathonPlan, state: MarathonState,
  action: Extract<MarathonAction, { type: 'CANCEL' }>,
  previous: MarathonStepState, digest: MarathonDigest,
): MarathonResult<MarathonState> {
  if (previous.status === 'ACTIVE') return BAD('EFFECT_UNCERTAIN_RECONCILE');
  if (previous.status !== 'PENDING') return BAD('NOT_PENDING');
  const next = { ...state.steps };
  blockPendingDescendants(plan, next, action.nodeId, true, 'DEPENDENCY_CANCELLED');
  return OK(seal(plan.planDigest, state.paused, next, digest));
}

function skipMarathonNode(
  plan: MarathonPlan, state: MarathonState,
  action: Extract<MarathonAction, { type: 'SKIP' }>,
  previous: MarathonStepState, digest: MarathonDigest,
): MarathonResult<MarathonState> {
  if (previous.status === 'ACTIVE') return BAD('EFFECT_UNCERTAIN_RECONCILE');
  if (previous.status !== 'PENDING') return BAD('NOT_PENDING');
  if (!validId(action.reasonCode)) return BAD('INVALID_STOP_REASON');
  const next = { ...state.steps };
  next[action.nodeId] = { status: 'SKIPPED', intentId: null, proofDigest: null,
    stopReasonCode: action.reasonCode };
  // SKIPPED is NEVER proof that the work happened. Dependents cannot run.
  blockPendingDescendants(plan, next, action.nodeId, false, 'DEPENDENCY_SKIPPED');
  return OK(seal(plan.planDigest, state.paused, next, digest));
}

function conflictingActiveMarathonNode(
  plan: MarathonPlan, state: MarathonState, node: MarathonNode,
): boolean {
  for (const other of plan.nodes) {
    if (state.steps[other.id]?.status !== 'ACTIVE') continue;
    if (marathonNodesConflict(node, other)) return true;
  }
  return false;
}

function startMarathonNode(
  plan: MarathonPlan, state: MarathonState,
  action: Extract<MarathonAction, { type: 'START' }>,
  previous: MarathonStepState, digest: MarathonDigest,
): MarathonResult<MarathonState> {
  if (state.paused) return BAD('PAUSED');
  if (previous.status === 'ACTIVE') return BAD('EFFECT_UNCERTAIN_RECONCILE');
  if (previous.status !== 'PENDING') return BAD('NOT_PENDING');
  if (Object.values(state.steps).some(step => step.intentId === action.intentId))
    return BAD('INTENT_REUSED');
  const node = plan.nodes.find(candidate => candidate.id === action.nodeId)!;
  if (!node.deps.every(dep => state.steps[dep]?.status === 'VERIFIED'))
    return BAD('DEPENDENCY_NOT_VERIFIED');
  if (conflictingActiveMarathonNode(plan, state, node))
    return BAD('ACTIVE_RESOURCE_CONFLICT');
  const next = { ...state.steps };
  next[action.nodeId] = { status: 'ACTIVE', intentId: action.intentId, proofDigest: null };
  return OK(seal(plan.planDigest, state.paused, next, digest));
}

function settleMarathonNode(
  plan: MarathonPlan, state: MarathonState,
  action: Extract<MarathonAction, { type: 'SETTLE' }>,
  previous: MarathonStepState, digest: MarathonDigest,
): MarathonResult<MarathonState> {
  if (action.outcome !== 'VERIFIED' && action.outcome !== 'FAILED')
    return BAD('INVALID_SETTLEMENT_OUTCOME');
  if (previous.status === action.outcome && previous.intentId === action.intentId &&
      previous.proofDigest === action.proofDigest) return OK(state);
  if (previous.status !== 'ACTIVE' || previous.intentId !== action.intentId)
    return BAD('UNBOUND_PROOF_OR_REPLAY');
  if (!safeDigest(action.proofDigest)) return BAD('INVALID_PROOF_DIGEST');
  const next = { ...state.steps };
  next[action.nodeId] = {
    status: action.outcome, intentId: action.intentId, proofDigest: action.proofDigest,
    ...(action.outcome === 'FAILED' ? { stopReasonCode: 'ATTESTED_PROVIDER_FAILURE' } : {}),
  };
  if (action.outcome === 'FAILED')
    blockPendingDescendants(plan, next, action.nodeId, false, 'DEPENDENCY_FAILED');
  return OK(seal(plan.planDigest, state.paused, next, digest));
}

/** Check exact source/lock/actor before ANY state transition or evidence reuse. */
export function advanceMarathon(
  plan: MarathonPlan, state: MarathonState, action: MarathonAction,
  current: { readonly baseSha: string; readonly lockDigest: string; readonly actor: string },
  digest: MarathonDigest,
): MarathonResult<MarathonState> {
  if (!plan || !state || !current || !action ||
      !['START', 'SETTLE', 'CANCEL', 'SKIP', 'PAUSE', 'RESUME'].includes(action.type))
    return BAD('INVALID_ACTION');
  if (current.baseSha !== plan.baseSha || current.lockDigest !== plan.lockDigest ||
      current.actor !== plan.actor) return BAD('STALE_OR_WRONG_ACTOR');
  const validated = validateMarathonState(plan, state, digest);
  if (!validated.ok) return validated;
  if (action.type === 'PAUSE' || action.type === 'RESUME') {
    const paused = action.type === 'PAUSE';
    if (paused === state.paused) return OK(state);
    return OK(seal(plan.planDigest, paused, { ...state.steps }, digest));
  }
  const previous = state.steps[action.nodeId];
  if (!previous) return BAD('UNKNOWN_STEP_OR_INTENT');
  if (action.type === 'CANCEL')
    return cancelMarathonNode(plan, state, action, previous, digest);
  if (action.type === 'SKIP')
    return skipMarathonNode(plan, state, action, previous, digest);
  if (!validId(action.intentId)) return BAD('UNKNOWN_STEP_OR_INTENT');
  if (action.type === 'START')
    return startMarathonNode(plan, state, action, previous, digest);
  return settleMarathonNode(plan, state, action, previous, digest);
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

  // Same M15 verifier used for native pack replay: never accept a set of
  // matching caller-controlled digest strings as an admitted execution pack.
  // M17/M18 separately enforces canonical work-order and actor authority.
  try {
    const replay = evaluatePackReplay(receipt, pack, {
      digest: { algorithm: 'sha256', digest },
    });
    if (!replay.replayable) return BAD('EXECUTION_PACK_NOT_ADMITTED');
  } catch {
    // Imported provider JSON can violate TypeScript shapes at runtime.
    return BAD('EXECUTION_PACK_NOT_ADMITTED');
  }

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

  // Preserve the authenticated M15 SPM refinement, rather than recomputing
  // maximally parallel topological waves from dependencies alone. The compiler
  // still checks every declared node, dependency and concurrent file conflict.
  return compileMarathon({
    ...binding, nodes, admittedWaves: pack.safeParallelWaves,
  }, digest);
}
