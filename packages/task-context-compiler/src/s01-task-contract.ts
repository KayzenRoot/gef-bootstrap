// M14 Task & Context Compiler - s01-task-contract.ts
// S01: Task Intent Envelope, Authority-Bound Context Unit, Context Dependency Closure
// Deterministic, read-only, startup-pure. No filesystem/network/Git mutation.

import type {
  TaskIntentEnvelopeInput,
  TaskIntentEnvelope,
  AuthorityBoundContextUnitInput,
  AuthorityBoundContextUnit,
  ContextDependencyClosure,
  DependencyEdge,
  OperationOptions,
  Result,
  ContextBudget,
} from './types.js';
import {
  compareCodePoint,
  validId,
  safeLimit,
  fail,
  cancelled,
  sha,
  deepFreeze,
  sortedStrings,
  DEFAULT_MAX_NODES,
  DEFAULT_MAX_EDGES,
  DEFAULT_MAX_DEPTH,
} from './utils.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TASK_CLASS_VALUES = new Set([
  'READ_ONLY_QUERY', 'CONTENT_GENERATION', 'CONTROLLED_MUTATION', 'HIGH_ASSURANCE_CRITICAL',
]);
const RISK_CLASS_VALUES = new Set(['STANDARD', 'ELEVATED', 'HIGH_ASSURANCE']);
const ABCU_ROLE_VALUES = new Set(['NORMATIVE', 'DESCRIPTIVE', 'DECISION', 'DEPENDENCY_CLOSURE', 'NEGATIVE']);
const APPLICABILITY_VALUES = new Set(['ACTIVE', 'INACTIVE', 'UNKNOWN', 'CONTRADICTORY']);
const SENSITIVITY_VALUES = new Set(['PUBLIC', 'INTERNAL', 'SENSITIVE_REFERENCE']);

function validateBindingPresence(input: {
  projectId: string; sourcePackIdentity: string; profileIdentity: string;
  profileDigest: string; policyVersion: string; checkpointIdentity: string;
}, subject: string): string | null {
  if (!validId(input.projectId)) return `${subject}: invalid projectId`;
  if (!input.sourcePackIdentity) return `${subject}: missing sourcePackIdentity`;
  if (!input.profileIdentity) return `${subject}: missing profileIdentity`;
  if (!input.profileDigest) return `${subject}: missing profileDigest`;
  if (!input.policyVersion) return `${subject}: missing policyVersion`;
  if (!input.checkpointIdentity) return `${subject}: missing checkpointIdentity`;
  return null;
}

// ─── Task Intent Envelope (TIE) ───────────────────────────────────────────────

/** Create a deterministic, identity-bound Task Intent Envelope. */
export function createTaskIntentEnvelope(
  input: TaskIntentEnvelopeInput,
  options: OperationOptions,
): Result<TaskIntentEnvelope> {
  const c = cancelled(options);
  if (c) return c;

  // Validate taskId
  if (!validId(input.taskId)) {
    return fail('TASK_CONTEXT_INTENT_INVALID', 'taskId is invalid or empty', input.taskId);
  }

  // Validate task class
  if (!TASK_CLASS_VALUES.has(input.taskClass)) {
    return fail('TASK_CONTEXT_INTENT_INVALID', `Unknown taskClass: ${input.taskClass}`, input.taskId);
  }

  // Validate risk class
  if (!RISK_CLASS_VALUES.has(input.riskClass)) {
    return fail('TASK_CONTEXT_INTENT_INVALID', `Unknown riskClass: ${input.riskClass}`, input.taskId);
  }

  // Validate objective
  if (!input.objectiveSummary || input.objectiveSummary.trim().length === 0) {
    return fail('TASK_CONTEXT_INTENT_INVALID', 'objectiveSummary is required', input.taskId);
  }

  // Validate domains
  if (!input.targetDomains || input.targetDomains.length === 0) {
    return fail('TASK_CONTEXT_INTENT_INVALID', 'At least one targetDomain is required', input.taskId);
  }

  // Validate bindings
  const bindingError = validateBindingPresence(input, input.taskId);
  if (bindingError) {
    return fail('TASK_CONTEXT_BINDING_STALE', bindingError, input.taskId);
  }

  // Validate budget (caller budgets can only NARROW, never silently amplify)
  if (input.callerBudget !== undefined) {
    const b = input.callerBudget;
    if (b.maxNodes !== undefined && (b.maxNodes < 1 || b.maxNodes > DEFAULT_MAX_NODES)) {
      return fail('TASK_CONTEXT_INTENT_INVALID', `callerBudget.maxNodes must be 1..${DEFAULT_MAX_NODES}`, input.taskId);
    }
    if (b.maxEdges !== undefined && (b.maxEdges < 1 || b.maxEdges > DEFAULT_MAX_EDGES)) {
      return fail('TASK_CONTEXT_INTENT_INVALID', `callerBudget.maxEdges must be 1..${DEFAULT_MAX_EDGES}`, input.taskId);
    }
    if (b.maxDepth !== undefined && (b.maxDepth < 1 || b.maxDepth > DEFAULT_MAX_DEPTH)) {
      return fail('TASK_CONTEXT_INTENT_INVALID', `callerBudget.maxDepth must be 1..${DEFAULT_MAX_DEPTH}`, input.taskId);
    }
  }

  // Build normalized semantic identity (insertion-order-independent)
  const normalizedDomains = sortedStrings(input.targetDomains);
  const normalizedCapabilities = sortedStrings(input.requiredCapabilities);

  const identityPayload = {
    taskId: input.taskId,
    taskClass: input.taskClass,
    riskClass: input.riskClass,
    objectiveSummary: input.objectiveSummary.trim(),
    targetDomains: normalizedDomains,
    requiredCapabilities: normalizedCapabilities,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
  };

  const digestResult = sha(options, identityPayload);
  if (!digestResult.ok) return digestResult;

  const envelope: TaskIntentEnvelope = deepFreeze({
    taskId: input.taskId,
    taskClass: input.taskClass,
    riskClass: input.riskClass,
    objectiveSummary: input.objectiveSummary.trim(),
    targetDomains: normalizedDomains,
    requiredCapabilities: normalizedCapabilities,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
    ...(input.callerBudget !== undefined ? { callerBudget: input.callerBudget } : {}),
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: envelope };
}

/** Validate project/source/profile mismatch for an existing TIE. */
export function validateTaskIntentEnvelopeBinding(
  envelope: TaskIntentEnvelope,
  expected: {
    projectId: string;
    sourcePackIdentity: string;
    policyVersion: string;
  },
): Result<true> {
  if (envelope.projectId !== expected.projectId) {
    return fail('CROSS_PROJECT_CONTEXT_FORBIDDEN',
      `TIE projectId mismatch: expected ${expected.projectId}, got ${envelope.projectId}`, envelope.taskId);
  }
  if (envelope.sourcePackIdentity !== expected.sourcePackIdentity) {
    return fail('CONTEXT_UNIT_STALE',
      `TIE sourcePackIdentity mismatch`, envelope.taskId);
  }
  if (envelope.policyVersion !== expected.policyVersion) {
    return fail('TASK_CONTEXT_BINDING_STALE',
      `TIE policyVersion mismatch`, envelope.taskId);
  }
  return { ok: true, value: true };
}

// ─── Authority-Bound Context Unit (ABCU) ──────────────────────────────────────

/** Create a deterministic, authority-bound context unit. */
export function createAuthorityBoundContextUnit(
  input: AuthorityBoundContextUnitInput,
  options: OperationOptions,
): Result<AuthorityBoundContextUnit> {
  const c = cancelled(options);
  if (c) return c;

  if (!validId(input.unitId)) {
    return fail('CONTEXT_UNIT_INVALID', 'unitId is invalid', input.unitId);
  }
  if (!input.domain) {
    return fail('CONTEXT_UNIT_INVALID', 'domain is required', input.unitId);
  }
  if (!ABCU_ROLE_VALUES.has(input.role)) {
    return fail('CONTEXT_UNIT_INVALID', `Unknown role: ${input.role}`, input.unitId);
  }
  if (!APPLICABILITY_VALUES.has(input.applicability)) {
    return fail('CONTEXT_UNIT_INVALID', `Unknown applicability: ${input.applicability}`, input.unitId);
  }
  if (!input.authorityRef) {
    return fail('CONTEXT_AUTHORITY_UNRESOLVED', 'authorityRef is required', input.unitId);
  }
  if (!input.sourceFingerprint) {
    return fail('CONTEXT_UNIT_STALE', 'sourceFingerprint is required', input.unitId);
  }
  if (!input.semanticPayloadRef) {
    return fail('CONTEXT_UNIT_INVALID', 'semanticPayloadRef is required', input.unitId);
  }
  if (input.sensitivity !== undefined && !SENSITIVITY_VALUES.has(input.sensitivity)) {
    return fail('CONTEXT_UNIT_INVALID', `Unknown sensitivity: ${input.sensitivity}`, input.unitId);
  }

  const bindingError = validateBindingPresence(input, input.unitId);
  if (bindingError) {
    return fail('CONTEXT_UNIT_STALE', bindingError, input.unitId);
  }

  // Sensitive references cannot carry raw payload
  if (input.sensitivity === 'SENSITIVE_REFERENCE' && input.semanticPayloadRef.startsWith('raw:')) {
    return fail('CONTEXT_UNIT_INVALID', 'SENSITIVE_REFERENCE units must use reference payloads, not raw values', input.unitId);
  }

  const identityPayload = {
    unitId: input.unitId,
    domain: input.domain,
    role: input.role,
    applicability: input.applicability,
    authorityRef: input.authorityRef,
    sourceFingerprint: input.sourceFingerprint,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
    semanticPayloadRef: input.semanticPayloadRef,
  };

  const digestResult = sha(options, identityPayload);
  if (!digestResult.ok) return digestResult;

  const unit: AuthorityBoundContextUnit = deepFreeze({
    ...input,
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: unit };
}

/** Validate ABCU binding against current project/source state. */
export function validateAbcuBinding(
  unit: AuthorityBoundContextUnit,
  currentBinding: {
    projectId: string;
    sourcePackIdentity: string;
    checkpointIdentity: string;
    currentFingerprints: readonly { id: string; fingerprint: string }[];
  },
): Result<true> {
  if (unit.projectId !== currentBinding.projectId) {
    return fail('CROSS_PROJECT_CONTEXT_FORBIDDEN', 'Cross-project context unit reuse is forbidden', unit.unitId);
  }
  if (unit.sourcePackIdentity !== currentBinding.sourcePackIdentity) {
    return fail('CONTEXT_UNIT_STALE', 'Source pack mismatch invalidates ABCU', unit.unitId);
  }
  if (unit.checkpointIdentity !== currentBinding.checkpointIdentity) {
    return fail('TASK_CONTEXT_BINDING_STALE', 'Checkpoint mismatch invalidates ABCU', unit.unitId);
  }
  // Check fingerprint freshness
  const fpMap = new Map(currentBinding.currentFingerprints.map(f => [f.id, f.fingerprint]));
  const currentFp = fpMap.get(unit.unitId);
  if (currentFp !== undefined && currentFp !== unit.sourceFingerprint) {
    return fail('CONTEXT_UNIT_STALE', 'Source fingerprint has changed; ABCU is stale', unit.unitId);
  }
  return { ok: true, value: true };
}

// ─── Context Dependency Closure (CDC) ─────────────────────────────────────────

export interface DependencyNode {
  readonly id: string;
  readonly dependencies: readonly string[];
}

/** Apply caller budget narrowing (budgets can only reduce, never amplify). */
export function applyCallerBudget(
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): { maxNodes: number; maxEdges: number; maxDepth: number } {
  const safeNodes = safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const safeEdges = safeLimit(options.maxEdges, DEFAULT_MAX_EDGES);
  const safeDepth = safeLimit(options.maxDepth, DEFAULT_MAX_DEPTH);

  // Caller budget can only NARROW, never amplify
  const maxNodes = callerBudget?.maxNodes !== undefined
    ? Math.min(safeNodes, callerBudget.maxNodes)
    : safeNodes;
  const maxEdges = callerBudget?.maxEdges !== undefined
    ? Math.min(safeEdges, callerBudget.maxEdges)
    : safeEdges;
  const maxDepth = callerBudget?.maxDepth !== undefined
    ? Math.min(safeDepth, callerBudget.maxDepth)
    : safeDepth;

  return { maxNodes, maxEdges, maxDepth };
}

/**
 * Compute the Context Dependency Closure.
 * Bounded, cycle-safe, cancellable BFS/DFS traversal.
 */
export function computeContextDependencyClosure(
  rootIds: readonly string[],
  nodeMap: ReadonlyMap<string, DependencyNode>,
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): Result<ContextDependencyClosure> {
  const c = cancelled(options);
  if (c) return c;

  const { maxNodes, maxEdges, maxDepth } = applyCallerBudget(callerBudget, options);

  const visited = new Set<string>();
  const edges: DependencyEdge[] = [];
  const cycles: string[][] = [];
  const unknownRefs: string[] = [];
  const stack: { id: string; depth: number; path: string[] }[] = [];

  // Initialize with root nodes
  for (const rootId of rootIds) {
    if (!visited.has(rootId)) {
      stack.push({ id: rootId, depth: 0, path: [rootId] });
    }
  }

  let edgeCount = 0;

  while (stack.length > 0) {
    const c2 = cancelled(options);
    if (c2) {
      const closure: ContextDependencyClosure = deepFreeze({
        rootUnitIds: [...rootIds],
        closedUnitIds: [...visited],
        edges: [...edges],
        state: 'CANCELLED',
        cycles: cycles.length > 0 ? cycles : undefined,
        unknownRefs: unknownRefs.length > 0 ? unknownRefs : undefined,
      });
      return { ok: true, value: closure };
    }

    const current = stack.pop()!;

    if (visited.has(current.id)) continue;
    if (visited.size >= maxNodes) {
      const closure: ContextDependencyClosure = deepFreeze({
        rootUnitIds: [...rootIds],
        closedUnitIds: [...visited],
        edges: [...edges],
        state: 'BUDGET_EXHAUSTED',
        cycles: cycles.length > 0 ? cycles : undefined,
        unknownRefs: unknownRefs.length > 0 ? unknownRefs : undefined,
      });
      return { ok: true, value: closure };
    }

    if (current.depth >= maxDepth) {
      const closure: ContextDependencyClosure = deepFreeze({
        rootUnitIds: [...rootIds],
        closedUnitIds: [...visited],
        edges: [...edges],
        state: 'BUDGET_EXHAUSTED',
        cycles: cycles.length > 0 ? cycles : undefined,
        unknownRefs: unknownRefs.length > 0 ? unknownRefs : undefined,
      });
      return { ok: true, value: closure };
    }

    visited.add(current.id);

    const node = nodeMap.get(current.id);
    if (!node) {
      // Unknown dependency — cannot be treated as no dependency
      unknownRefs.push(current.id);
      continue;
    }

    for (const depId of node.dependencies) {
      if (edgeCount >= maxEdges) {
        const closure: ContextDependencyClosure = deepFreeze({
          rootUnitIds: [...rootIds],
          closedUnitIds: [...visited],
          edges: [...edges],
          state: 'BUDGET_EXHAUSTED',
          unknownRefs: unknownRefs.length > 0 ? unknownRefs : undefined,
        });
        return { ok: true, value: closure };
      }

      edges.push({ fromId: current.id, toId: depId, edgeType: 'REQUIRED' });
      edgeCount++;

      // Cycle detection
      if (current.path.includes(depId)) {
        cycles.push([...current.path, depId]);
        continue;  // Do not follow cycle; record it
      }

      if (!visited.has(depId)) {
        stack.push({ id: depId, depth: current.depth + 1, path: [...current.path, depId] });
      }
    }
  }

  // Determine state
  let state: ContextDependencyClosure['state'] = 'COMPLETE';
  if (cycles.length > 0) state = 'CYCLE_DETECTED';
  else if (unknownRefs.length > 0) state = 'UNKNOWN_DEPENDENCY';

  const closure: ContextDependencyClosure = deepFreeze({
    rootUnitIds: [...rootIds],
    closedUnitIds: [...visited],
    edges: [...edges],
    state,
    cycles: cycles.length > 0 ? cycles : undefined,
    unknownRefs: unknownRefs.length > 0 ? unknownRefs : undefined,
  });

  return { ok: true, value: closure };
}
