// M15 Execution Pack Compiler - s02-work-graph.ts
// S02: Executable Work DAG (EWD), Semantic Critical Path (SCP),
//      Safe Parallelism Matrix (SPM), Reasoning Branch Suppressor (RBS),
//      Atomic Increment Boundary (AIB).
// Deterministic, bounded, cycle-safe, cancellation-aware. No side effects.

import type {
  AtomicIncrement,
  BranchSuppressionResult,
  EvidenceSlot,
  ExecutableInstruction,
  ExecutableWorkDag,
  Instruction,
  OperationOptions,
  ReasoningBranch,
  Result,
  WorkNode,
} from './types.js';
import {
  cancelled,
  compareCodePoint,
  compareStringArrays,
  deepFreeze,
  fail,
  safeLimit,
  sortedStrings,
  DEFAULT_MAX_EDGES,
  DEFAULT_MAX_NODES,
} from './utils.js';

// ─── Executable Work DAG (EWD) ────────────────────────────────────────────────

/**
 * Compile instructions into a deterministic topological work DAG.
 * Duplicate nodes, unknown dependencies and cycles fail closed, as do nodes
 * missing preconditions, mutation specifications or evidence outputs — the
 * executor must never infer what the pack does not declare.
 * Traversal is bounded and cancellation-aware; ties break by code point.
 */
export function computeExecutableWorkDag(
  instructions: readonly ExecutableInstruction[],
  options: OperationOptions,
): Result<ExecutableWorkDag> {
  const c = cancelled(options);
  if (c) return c;

  if (instructions.length === 0) {
    return fail('PACK_GRAPH_EMPTY', 'Work DAG requires at least one instruction');
  }

  const maxNodes = safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const maxEdges = safeLimit(options.maxEdges, DEFAULT_MAX_EDGES);
  if (instructions.length > maxNodes) {
    return fail(
      'PACK_GRAPH_BUDGET_EXHAUSTED',
      `Node budget exhausted: ${instructions.length} nodes exceed limit ${maxNodes}`,
    );
  }

  const byId = new Map<string, ExecutableInstruction>();
  for (const instruction of instructions) {
    if (byId.has(instruction.instructionId)) {
      return fail(
        'PACK_GRAPH_DUPLICATE_NODE',
        `Duplicate work node: ${instruction.instructionId}`,
        instruction.instructionId,
      );
    }
    if (!Array.isArray(instruction.preconditions) || instruction.preconditions.length === 0) {
      return fail(
        'PACK_NODE_PRECONDITION_MISSING',
        `Work node ${instruction.instructionId} declares no preconditions`,
        instruction.instructionId,
      );
    }
    if (!instruction.mutationSpec || instruction.mutationSpec.trim().length === 0) {
      return fail(
        'PACK_NODE_MUTATION_SPEC_MISSING',
        `Work node ${instruction.instructionId} declares no mutation specification`,
        instruction.instructionId,
      );
    }
    if (!Array.isArray(instruction.evidenceOutputs) || instruction.evidenceOutputs.length === 0) {
      return fail(
        'PACK_NODE_EVIDENCE_MISSING',
        `Work node ${instruction.instructionId} declares no evidence outputs`,
        instruction.instructionId,
      );
    }
    byId.set(instruction.instructionId, instruction);
  }

  let edgeCount = 0;
  const dependents = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of byId.keys()) {
    dependents.set(id, []);
    indegree.set(id, 0);
  }
  for (const instruction of instructions) {
    const uniqueDeps = [...new Set(instruction.dependsOn)].sort(compareCodePoint);
    for (const dep of uniqueDeps) {
      const target = byId.get(dep);
      if (target === undefined) {
        return fail(
          'PACK_GRAPH_UNKNOWN_DEPENDENCY',
          `Instruction ${instruction.instructionId} depends on unknown node ${dep}`,
          dep,
        );
      }
      if (dep === instruction.instructionId) {
        return fail(
          'PACK_GRAPH_CYCLE',
          `Instruction ${instruction.instructionId} depends on itself`,
          instruction.instructionId,
        );
      }
      edgeCount += 1;
      if (edgeCount > maxEdges) {
        return fail(
          'PACK_GRAPH_BUDGET_EXHAUSTED',
          `Edge budget exhausted: more than ${maxEdges} dependency edges`,
        );
      }
      const list = dependents.get(dep);
      if (list !== undefined) list.push(instruction.instructionId);
      indegree.set(instruction.instructionId, (indegree.get(instruction.instructionId) ?? 0) + 1);
    }
  }

  // Deterministic Kahn traversal: ready set always processed in code-point order,
  // each layer forming one execution wave.
  const waves: string[][] = [];
  const waveOf = new Map<string, number>();
  let ready = sortedStrings(
    [...byId.keys()].filter(id => (indegree.get(id) ?? 0) === 0),
  );
  let processed = 0;
  while (ready.length > 0) {
    const cancelledResult = cancelled(options);
    if (cancelledResult !== null) return cancelledResult;
    const waveIndex = waves.length;
    waves.push([...ready]);
    const next: string[] = [];
    for (const id of ready) {
      waveOf.set(id, waveIndex);
      processed += 1;
      const outs = dependents.get(id) ?? [];
      for (const dependent of outs) {
        const remaining = (indegree.get(dependent) ?? 1) - 1;
        indegree.set(dependent, remaining);
        if (remaining === 0) next.push(dependent);
      }
    }
    ready = sortedStrings(next);
  }

  if (processed !== byId.size) {
    const cyclic = sortedStrings([...byId.keys()].filter(id => !waveOf.has(id)));
    return fail(
      'PACK_GRAPH_CYCLE',
      `Dependency cycle detected involving: ${cyclic.join(', ')}`,
      cyclic[0] ?? 'unknown',
    );
  }

  const nodes: WorkNode[] = instructions.map(instruction => {
    const mutating = instruction.mutationDomains.length > 0;
    return {
      ...instruction,
      targetFiles: [...instruction.targetFiles],
      dependsOn: [...instruction.dependsOn].sort(compareCodePoint),
      mutationDomains: [...instruction.mutationDomains],
      validationIds: [...instruction.validationIds],
      provenanceRefs: [...instruction.provenanceRefs],
      preconditions: [...instruction.preconditions],
      evidenceOutputs: [...instruction.evidenceOutputs],
      wave: waveOf.get(instruction.instructionId) ?? 0,
      critical: false,
      rollbackHook: mutating ? (instruction.rollbackPlan ?? 'pending:rrp') : 'none:read-only',
      readinessRef: mutating ? `rrp:${instruction.instructionId}` : 'rrp:not-required',
    };
  });
  nodes.sort((a, b) => a.wave - b.wave || compareCodePoint(a.instructionId, b.instructionId));
  const order = nodes.map(n => n.instructionId);
  const frozenWaves = waves.map(w => Object.freeze([...w]) as readonly string[]);

  return {
    ok: true,
    value: deepFreeze({ nodes, order, waves: frozenWaves }),
  };
}

// ─── Semantic Critical Path (SCP) ────────────────────────────────────────────

/**
 * Identify the serial semantic dependency chain: the longest dependency path
 * by node count. Ties break deterministically to the lexicographically
 * smallest path (code-point comparison), never by input order.
 */
export function computeSemanticCriticalPath(
  instructions: readonly Instruction[],
  options: OperationOptions,
): Result<readonly string[]> {
  const c = cancelled(options);
  if (c) return c;

  if (instructions.length === 0) {
    return fail('PACK_GRAPH_EMPTY', 'Critical path requires at least one instruction');
  }

  const byId = new Map<string, Instruction>();
  for (const instruction of instructions) {
    if (byId.has(instruction.instructionId)) {
      return fail(
        'PACK_GRAPH_DUPLICATE_NODE',
        `Duplicate work node: ${instruction.instructionId}`,
        instruction.instructionId,
      );
    }
    byId.set(instruction.instructionId, instruction);
  }

  const memo = new Map<string, readonly string[]>();
  const visiting = new Set<string>();

  function bestPathEndingAt(id: string): Result<readonly string[]> {
    const cached = memo.get(id);
    if (cached !== undefined) return { ok: true, value: cached };
    if (visiting.has(id)) {
      return fail('PACK_GRAPH_CYCLE', `Dependency cycle detected at ${id}`, id);
    }
    const node = byId.get(id);
    if (node === undefined) {
      return fail('PACK_GRAPH_UNKNOWN_DEPENDENCY', `Unknown node ${id}`, id);
    }
    visiting.add(id);
    let best: readonly string[] = [id];
    for (const dep of sortedStrings([...new Set(node.dependsOn)])) {
      if (!byId.has(dep)) {
        return fail(
          'PACK_GRAPH_UNKNOWN_DEPENDENCY',
          `Instruction ${id} depends on unknown node ${dep}`,
          dep,
        );
      }
      const parent = bestPathEndingAt(dep);
      if (!parent.ok) return parent;
      const candidate = [...parent.value, id] as readonly string[];
      if (candidate.length > best.length || (candidate.length === best.length && compareStringArrays(candidate, best) < 0)) {
        best = candidate;
      }
    }
    visiting.delete(id);
    memo.set(id, best);
    return { ok: true, value: best };
  }

  let global: readonly string[] = [];
  for (const id of sortedStrings([...byId.keys()])) {
    const cancelledResult = cancelled(options);
    if (cancelledResult !== null) return cancelledResult;
    const candidate = bestPathEndingAt(id);
    if (!candidate.ok) return candidate;
    if (candidate.value.length > global.length || (candidate.value.length === global.length && compareStringArrays(candidate.value, global) < 0)) {
      global = candidate.value;
    }
  }
  return { ok: true, value: deepFreeze([...global]) };
}

// ─── Safe Parallelism Matrix (SPM) ───────────────────────────────────────────

/** Build the canonical pair key for an explicitly allowed overlap. */
export function overlapPairKey(first: string, second: string): string {
  const pair = [first, second].sort(compareCodePoint);
  return `${pair[0]}|${pair[1]}`;
}

/**
 * Refine dependency waves so two mutations overlapping the same mutation
 * domain never share a wave unless an explicit safety proof (allowedPairs)
 * permits that exact pair. Dependencies always dominate throughput: waves are
 * only ever split, never merged or reordered.
 */
export function computeSafeParallelismMatrix(
  waves: readonly (readonly string[])[],
  instructions: readonly Instruction[],
  allowedPairs: readonly string[] = [],
): Result<readonly (readonly string[])[]> {
  const allowed = new Set(allowedPairs);
  const domainsById = new Map<string, readonly string[]>();
  for (const instruction of instructions) {
    domainsById.set(instruction.instructionId, instruction.mutationDomains);
  }

  const refined: string[][] = [];
  for (const wave of waves) {
    const subwaves: string[][] = [];
    const owners: Array<Map<string, string>> = [];
    for (const nodeId of wave) {
      const domains = domainsById.get(nodeId);
      if (domains === undefined) {
        return fail('PACK_GRAPH_UNKNOWN_DEPENDENCY', `Unknown node in wave: ${nodeId}`, nodeId);
      }
      let placed = false;
      for (let s = 0; s < subwaves.length; s++) {
        const ownerMap = owners[s];
        const subwave = subwaves[s];
        if (ownerMap === undefined || subwave === undefined) continue;
        let conflict = false;
        for (const domain of domains) {
          const owner = ownerMap.get(domain);
          if (owner !== undefined && !allowed.has(overlapPairKey(owner, nodeId))) {
            conflict = true;
            break;
          }
        }
        if (!conflict) {
          subwave.push(nodeId);
          for (const domain of domains) ownerMap.set(domain, nodeId);
          placed = true;
          break;
        }
      }
      if (!placed) {
        subwaves.push([nodeId]);
        const ownerMap = new Map<string, string>();
        for (const domain of domains) ownerMap.set(domain, nodeId);
        owners.push(ownerMap);
      }
    }
    for (const subwave of subwaves) refined.push(subwave);
  }
  return {
    ok: true,
    value: deepFreeze(refined.map(w => [...w])),
  };
}

// ─── Reasoning Branch Suppressor (RBS) ───────────────────────────────────────

/**
 * Suppress speculative branches already decided canonically; anything
 * undecided or lacking a canonical ref escalates instead of being guessed.
 * Total function: suppression is data, never a silent inference.
 */
export function suppressReasoningBranches(
  branches: readonly ReasoningBranch[],
): BranchSuppressionResult {
  const suppressed: string[] = [];
  const escalated: string[] = [];
  for (const branch of branches) {
    if (branch.decided && branch.canonicalRef !== undefined && branch.canonicalRef.length > 0) {
      suppressed.push(branch.branchId);
    } else {
      escalated.push(branch.branchId);
    }
  }
  return deepFreeze({
    suppressed: suppressed.sort(compareCodePoint),
    escalated: escalated.sort(compareCodePoint),
  });
}

// ─── Atomic Increment Boundary (AIB) ─────────────────────────────────────────

/**
 * Partition execution waves into independently verifiable, rollback-capable
 * increments so partial progress stays resumable and auditable. Each wave
 * becomes one increment carrying its postcondition evidence slots.
 */
export function createAtomicIncrementBoundary(
  waves: readonly (readonly string[])[],
  evidenceSlots: readonly EvidenceSlot[],
): readonly AtomicIncrement[] {
  const slotsByInstruction = new Map<string, string[]>();
  for (const slot of evidenceSlots) {
    const list = slotsByInstruction.get(slot.instructionId);
    if (list === undefined) slotsByInstruction.set(slot.instructionId, [slot.slotId]);
    else list.push(slot.slotId);
  }
  return deepFreeze(
    waves.map((wave, index) => {
      const slotIds = wave.flatMap(id => slotsByInstruction.get(id) ?? []).sort(compareCodePoint);
      return {
        incrementId: `aib-${String(index + 1).padStart(3, '0')}`,
        nodeIds: [...wave],
        evidenceSlotIds: slotIds,
      };
    }),
  );
}
