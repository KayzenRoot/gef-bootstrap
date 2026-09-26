// M14 Task & Context Compiler - s04-safe-expansion.ts
// S04: Full-Context Safety Gate, Risk-Adaptive Context Aperture,
//      Dependency Shockwave Scanner, Unknown-Unknown Sentinel,
//      Context Expansion Ladder, Expansion Budget Envelope
// Deterministic, read-only, fail-closed on unknown unknowns.

import type {
  TaskIntentEnvelope,
  ContextSufficiencyProof,
  FcsgEvaluation,
  FcsgTrigger,
  RiskAdaptiveContextAperture,
  ApertureLevel,
  ShockwaveResult,
  UnknownUnknownSentinelResult,
  UusFinding,
  ContextExpansionLadder,
  ExpansionStep,
  ExpansionStage,
  ExpansionBudgetEnvelope,
  OperationOptions,
  Result,
  ContextBudget,
} from './types.js';
import {
  compareCodePoint,
  fail,
  cancelled,
  deepFreeze,
  safeLimit,
  DEFAULT_MAX_NODES,
  DEFAULT_MAX_EDGES,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_DOMAINS,
} from './utils.js';

const DEFAULT_MAX_BYTES = 10_485_760;    // 10 MB
const DEFAULT_MAX_ITERATIONS = 256;

// ─── Full-Context Safety Gate (FCSG) ──────────────────────────────────────────

export interface FcsgInput {
  readonly tie: TaskIntentEnvelope;
  readonly proof: ContextSufficiencyProof;
  readonly hasStaleCheckpointBinding: boolean;
  readonly hasStaleSourceBinding: boolean;
  readonly hasStaleProfileBinding: boolean;
  readonly hasPriorContextRegression: boolean;
  readonly hasDestructiveOperation: boolean;
  readonly hasHighRiskDomain: boolean;
  readonly callerRequiresBroaderInspection: boolean;
}

/**
 * Evaluate the Full-Context Safety Gate.
 * A CSP cannot be SUFFICIENT while a triggered FCSG obligation remains unexamined.
 */
export function evaluateFullContextSafetyGate(
  input: FcsgInput,
  options: OperationOptions,
): Result<FcsgEvaluation> {
  const c = cancelled(options);
  if (c) return c;

  const triggeredReasons: FcsgTrigger[] = [];

  // High-assurance task
  if (input.tie.riskClass === 'HIGH_ASSURANCE') {
    triggeredReasons.push('HIGH_ASSURANCE_TASK');
  }

  // Unresolved authority conflict
  if (input.proof.deficitVector.deficits.some(d => d.dimension === 'AUTHORITY')) {
    triggeredReasons.push('UNRESOLVED_AUTHORITY_CONFLICT');
  }

  // Incomplete dependency closure
  if (!input.proof.dependencyKnowledgeComplete) {
    triggeredReasons.push('INCOMPLETE_DEPENDENCY_CLOSURE');
  }

  // Destructive operation
  if (input.hasDestructiveOperation) {
    triggeredReasons.push('DESTRUCTIVE_IRREVERSIBLE_OPERATION');
  }

  // High-risk domain
  if (input.hasHighRiskDomain) {
    triggeredReasons.push('HIGH_RISK_DOMAIN');
  }

  // Stale bindings
  if (input.hasStaleCheckpointBinding) {
    triggeredReasons.push('STALE_CHECKPOINT_BINDING');
  }
  if (input.hasStaleSourceBinding) {
    triggeredReasons.push('STALE_SOURCE_BINDING');
  }
  if (input.hasStaleProfileBinding) {
    triggeredReasons.push('STALE_PROFILE_BINDING');
  }

  // Prior context regression
  if (input.hasPriorContextRegression) {
    triggeredReasons.push('PRIOR_CONTEXT_REGRESSION');
  }

  // Explicit caller/policy requirement
  if (input.callerRequiresBroaderInspection) {
    triggeredReasons.push('EXPLICIT_CALLER_OR_POLICY_REQUIREMENT');
  }

  const sortedTriggers = [...new Set(triggeredReasons)].sort(compareCodePoint) as FcsgTrigger[];
  const narrowContextPermitted = sortedTriggers.length === 0;

  // Determine minimum expansion stage required
  let requiredExpansionStage: ExpansionStage | undefined;
  if (!narrowContextPermitted) {
    if (sortedTriggers.includes('HIGH_ASSURANCE_TASK') || sortedTriggers.includes('UNRESOLVED_AUTHORITY_CONFLICT')) {
      requiredExpansionStage = 'AUTHORITY_DOMAIN';
    } else if (sortedTriggers.includes('INCOMPLETE_DEPENDENCY_CLOSURE')) {
      requiredExpansionStage = 'DEPENDENCY_NEIGHBORHOOD';
    } else {
      requiredExpansionStage = 'LOCAL_REQUIRED';
    }
  }

  const evaluation: FcsgEvaluation = deepFreeze({
    taskIdentity: input.tie.semanticIdentity,
    triggeredReasons: sortedTriggers,
    narrowContextPermitted,
    ...(requiredExpansionStage !== undefined ? { requiredExpansionStage } : {}),
  });

  return { ok: true, value: evaluation };
}

// ─── Risk-Adaptive Context Aperture (RACA) ────────────────────────────────────

/**
 * Compute the Risk-Adaptive Context Aperture.
 * Aperture expands by risk/unknowns, not token appetite.
 */
export function computeRiskAdaptiveContextAperture(
  tie: TaskIntentEnvelope,
  proof: ContextSufficiencyProof,
  fcsgEvaluation: FcsgEvaluation,
): RiskAdaptiveContextAperture {
  const unknownCount = proof.deficitVector.deficits.length;
  const expansionTriggers: string[] = fcsgEvaluation.triggeredReasons.map(r => String(r));

  let apertureLevel: ApertureLevel;

  if (!fcsgEvaluation.narrowContextPermitted) {
    if (tie.riskClass === 'HIGH_ASSURANCE' || unknownCount > 5) {
      apertureLevel = 'FULL_RELEVANT_SOURCE_PACK';
    } else if (unknownCount > 2) {
      apertureLevel = 'WIDE';
    } else {
      apertureLevel = 'STANDARD';
    }
  } else {
    apertureLevel = 'NARROW';
  }

  return deepFreeze({
    taskIdentity: tie.semanticIdentity,
    apertureLevel,
    riskClass: tie.riskClass,
    unknownCount,
    expansionTriggers,
  });
}

// ─── Dependency Shockwave Scanner (DSS) ───────────────────────────────────────

export interface DssSourceNode {
  readonly id: string;
  readonly domain: string;
  readonly dependentDomains: readonly string[];
}

/**
 * Bounded traversal estimating which authority domains can be invalidated by a task.
 * Fail-safe: exhausted budget or cancellation returns partial result with flags set.
 */
export function scanDependencyShockwave(
  originDomains: readonly string[],
  sourceGraph: readonly DssSourceNode[],
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): Result<ShockwaveResult> {
  const c = cancelled(options);
  if (c) return c;

  const maxNodes = callerBudget?.maxNodes !== undefined
    ? Math.min(safeLimit(options.maxNodes, DEFAULT_MAX_NODES), callerBudget.maxNodes)
    : safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const maxDepth = callerBudget?.maxDepth !== undefined
    ? Math.min(safeLimit(options.maxDepth, DEFAULT_MAX_DEPTH), callerBudget.maxDepth)
    : safeLimit(options.maxDepth, DEFAULT_MAX_DEPTH);

  // Build domain adjacency: domain -> set of dependent domains
  const adjacency = new Map<string, Set<string>>();
  for (const node of sourceGraph) {
    if (!adjacency.has(node.domain)) adjacency.set(node.domain, new Set());
    for (const dep of node.dependentDomains) {
      adjacency.get(node.domain)!.add(dep);
    }
  }

  const affected = new Set<string>();
  const queue: { domain: string; depth: number }[] = [];

  for (const domain of originDomains) {
    if (!affected.has(domain)) {
      affected.add(domain);
      queue.push({ domain, depth: 0 });
    }
  }

  let traversalDepth = 0;
  let budgetExhausted = false;
  let cancelledFlag = false;

  while (queue.length > 0) {
    const c2 = cancelled(options);
    if (c2) { cancelledFlag = true; break; }

    const current = queue.shift()!;
    if (current.depth >= maxDepth) { budgetExhausted = true; break; }
    if (affected.size >= maxNodes) { budgetExhausted = true; break; }

    traversalDepth = Math.max(traversalDepth, current.depth);
    const deps = adjacency.get(current.domain) ?? new Set();
    for (const dep of deps) {
      if (!affected.has(dep)) {
        affected.add(dep);
        queue.push({ domain: dep, depth: current.depth + 1 });
      }
    }
  }

  const result: ShockwaveResult = deepFreeze({
    originDomains: [...originDomains].sort(compareCodePoint),
    affectedDomainIds: [...affected].sort(compareCodePoint),
    traversalDepth,
    budgetExhausted,
    cancelled: cancelledFlag,
  });

  return { ok: true, value: result };
}

// ─── Unknown-Unknown Sentinel (UUS) ───────────────────────────────────────────

export interface UusInputGraph {
  readonly unitIds: readonly string[];
  readonly refs: readonly { fromId: string; toId: string }[];
  readonly aliasRefs: readonly { aliasId: string; targetId: string; stale: boolean }[];
  readonly importRefs: readonly { importId: string; resolved: boolean }[];
  readonly authorityGaps: readonly { domain: string; reason: string }[];
}

/**
 * Detect incomplete graph knowledge via dangling refs, unresolved aliases,
 * unbound imports and authority gaps.
 */
export function runUnknownUnknownSentinel(
  taskIdentity: string,
  graph: UusInputGraph,
  options: OperationOptions,
): Result<UnknownUnknownSentinelResult> {
  const c = cancelled(options);
  if (c) return c;

  const findings: UusFinding[] = [];
  const knownIds = new Set(graph.unitIds);

  // Dangling refs: references to non-existent nodes
  for (const ref of graph.refs) {
    if (!knownIds.has(ref.toId)) {
      findings.push({
        kind: 'DANGLING_REF',
        subject: ref.toId,
        detail: `Reference from ${ref.fromId} to unknown unit ${ref.toId}`,
      });
    }
  }

  // Unresolved aliases
  for (const alias of graph.aliasRefs) {
    if (alias.stale) {
      findings.push({
        kind: 'UNRESOLVED_ALIAS',
        subject: alias.aliasId,
        detail: `Alias ${alias.aliasId} -> ${alias.targetId} is stale`,
      });
    }
    if (!knownIds.has(alias.targetId)) {
      findings.push({
        kind: 'UNRESOLVED_ALIAS',
        subject: alias.aliasId,
        detail: `Alias ${alias.aliasId} points to unknown target ${alias.targetId}`,
      });
    }
  }

  // Unbound imports
  for (const imp of graph.importRefs) {
    if (!imp.resolved) {
      findings.push({
        kind: 'UNBOUND_IMPORT',
        subject: imp.importId,
        detail: `Import ${imp.importId} is not resolved`,
      });
    }
  }

  // Authority gaps
  for (const gap of graph.authorityGaps) {
    findings.push({
      kind: 'AUTHORITY_GAP',
      subject: gap.domain,
      detail: gap.reason,
    });
  }

  const sortedFindings = [...findings].sort((a, b) =>
    compareCodePoint(a.kind, b.kind) || compareCodePoint(a.subject, b.subject)
  );

  const result: UnknownUnknownSentinelResult = deepFreeze({
    taskIdentity,
    findings: sortedFindings,
    hasUnknowns: sortedFindings.length > 0,
  });

  return { ok: true, value: result };
}

// ─── Context Expansion Ladder (CEL) ───────────────────────────────────────────

/** Advance the expansion ladder by one stage. */
export function advanceExpansionLadder(
  tie: TaskIntentEnvelope,
  currentLadder: ContextExpansionLadder | undefined,
  trigger: string,
  addedObligations: readonly string[],
  options: OperationOptions,
): Result<ContextExpansionLadder> {
  const c = cancelled(options);
  if (c) return c;

  const STAGE_ORDER: ExpansionStage[] = [
    'LOCAL_REQUIRED',
    'DEPENDENCY_NEIGHBORHOOD',
    'AUTHORITY_DOMAIN',
    'CROSS_DOMAIN_REQUIRED',
    'FULL_RELEVANT_SOURCE_PACK',
    'BLOCKED_FOR_AUTHORITY_OR_DECISION',
  ];

  const currentStage = currentLadder?.currentStage ?? 'LOCAL_REQUIRED';
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const nextIndex = Math.min(currentIndex + 1, STAGE_ORDER.length - 1);
  const nextStage = STAGE_ORDER[nextIndex]!;

  // Expansion by model curiosity is forbidden; trigger must be substantive
  if (!trigger || trigger.trim().length === 0) {
    return fail('CONTEXT_COMPILATION_BLOCKED', 'Expansion trigger must be substantive; curiosity-driven expansion is forbidden');
  }

  const newStep: ExpansionStep = {
    stage: nextStage,
    trigger: trigger.trim(),
    addedObligations: [...addedObligations].sort(compareCodePoint),
  };

  const steps = [...(currentLadder?.steps ?? []), newStep];

  const ladder: ContextExpansionLadder = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    currentStage: nextStage,
    steps,
  });

  return { ok: true, value: ladder };
}

// ─── Expansion Budget Envelope (EBE) ─────────────────────────────────────────

/** Create a fresh Expansion Budget Envelope (caller budget can only NARROW safe defaults). */
export function createExpansionBudgetEnvelope(
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): ExpansionBudgetEnvelope {
  const safeNodes = safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const safeEdges = safeLimit(options.maxEdges, DEFAULT_MAX_EDGES);
  const safeDomains = safeLimit(options.maxNodes, DEFAULT_MAX_DOMAINS);

  const maxNodes = callerBudget?.maxNodes !== undefined
    ? Math.min(safeNodes, callerBudget.maxNodes) : safeNodes;
  const maxEdges = callerBudget?.maxEdges !== undefined
    ? Math.min(safeEdges, callerBudget.maxEdges) : safeEdges;
  const maxDomains = callerBudget?.maxDomains !== undefined
    ? Math.min(safeDomains, callerBudget.maxDomains) : safeDomains;
  const maxUnits = callerBudget?.maxUnits !== undefined
    ? Math.min(DEFAULT_MAX_NODES, callerBudget.maxUnits) : DEFAULT_MAX_NODES;

  return deepFreeze({
    maxNodes,
    maxEdges,
    maxBytes: DEFAULT_MAX_BYTES,
    maxDomains,
    maxIterations: DEFAULT_MAX_ITERATIONS,
    usedNodes: 0,
    usedEdges: 0,
    usedDomains: 0,
    usedIterations: 0,
    exhausted: false,
  });
}

/** Update budget usage. Returns new envelope or signals exhaustion. */
export function updateExpansionBudget(
  budget: ExpansionBudgetEnvelope,
  delta: { nodes?: number; edges?: number; domains?: number; iterations?: number },
): Result<ExpansionBudgetEnvelope> {
  const usedNodes = budget.usedNodes + (delta.nodes ?? 0);
  const usedEdges = budget.usedEdges + (delta.edges ?? 0);
  const usedDomains = budget.usedDomains + (delta.domains ?? 0);
  const usedIterations = budget.usedIterations + (delta.iterations ?? 0);

  const exhausted =
    usedNodes > budget.maxNodes ||
    usedEdges > budget.maxEdges ||
    usedDomains > budget.maxDomains ||
    usedIterations > budget.maxIterations;

  if (exhausted) {
    return fail('CONTEXT_BUDGET_EXCEEDED', 'Expansion budget envelope exhausted; expansion is incomplete');
  }

  const updated: ExpansionBudgetEnvelope = deepFreeze({
    ...budget,
    usedNodes,
    usedEdges,
    usedDomains,
    usedIterations,
    exhausted,
  });

  return { ok: true, value: updated };
}
