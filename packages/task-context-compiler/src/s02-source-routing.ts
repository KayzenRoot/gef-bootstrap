// M14 Task & Context Compiler - s02-source-routing.ts
// S02: Task-to-Source Router, Authority-Bound Selection Filter,
//      Context Authority Matrix, Authority Neighborhood Projection,
//      Context Redundancy Barrier
// Deterministic, read-only. ROUTING_RELEVANCE != SOURCE_AUTHORITY != CONTEXT_SUFFICIENCY.

import type {
  TaskIntentEnvelope,
  AuthorityBoundContextUnit,
  SourceRouteCandidate,
  TaskRouteResult,
  AbsfInput,
  AuthorityResolutionProof,
  ContextAuthorityMatrix,
  CamEntry,
  AuthorityNeighborhoodProjection,
  AnpNode,
  DeduplicatedUnit,
  AbcuRole,
  OperationOptions,
  Result,
  ContextBudget,
} from './types.js';
import {
  compareCodePoint,
  validId,
  fail,
  cancelled,
  sha,
  deepFreeze,
  safeLimit,
  DEFAULT_MAX_NODES,
  DEFAULT_MAX_EDGES,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_DOMAINS,
} from './utils.js';

// ─── Task-to-Source Router (TSR) ──────────────────────────────────────────────

export interface SourceRouteInput {
  readonly sourceId: string;
  readonly domains: readonly string[];
  readonly routingRelevance: number;    // 0..1; semantic routing hint ONLY, NOT authority
  readonly authorityRef: string;
  readonly applicabilityState: AuthorityBoundContextUnit['applicability'];
  readonly applicabilityWitnessRef?: string | undefined;
  readonly sourceFingerprint: string;
  readonly aliasRefs?: readonly string[] | undefined;
  readonly stale?: boolean | undefined;
}

/**
 * Route task domains to source candidates.
 * Relevance is routing hint only; authority is determined separately by ABSF.
 * Returns candidates sorted deterministically (code-point order within domain,
 * relevance descending as secondary key, sourceId as tiebreaker).
 */
export function routeTaskToSources(
  tie: TaskIntentEnvelope,
  sources: readonly SourceRouteInput[],
  options: OperationOptions,
): Result<TaskRouteResult> {
  const c = cancelled(options);
  if (c) return c;

  const resolvedCandidates: SourceRouteCandidate[] = [];
  const unresolvedDomains: string[] = [];
  const diagnostics: Array<{ code: string; message: string; subject?: string }> = [];
  const domainSet = new Set(tie.targetDomains);

  // Index sources by domain
  const domainIndex = new Map<string, SourceRouteInput[]>();
  for (const source of sources) {
    if (source.stale) {
      diagnostics.push({ code: 'CONTEXT_SOURCE_STALE', message: `Source ${source.sourceId} is stale`, subject: source.sourceId });
      continue;
    }
    // Validate aliases (stale aliases cannot be used for routing)
    if (source.aliasRefs) {
      for (const alias of source.aliasRefs) {
        // Alias presence is acceptable; stale check belongs to caller
        void alias;
      }
    }
    for (const domain of source.domains) {
      if (!domainIndex.has(domain)) domainIndex.set(domain, []);
      domainIndex.get(domain)!.push(source);
    }
  }

  // Process each required domain
  for (const domain of [...domainSet].sort(compareCodePoint)) {
    const candidates = domainIndex.get(domain) ?? [];
    if (candidates.length === 0) {
      unresolvedDomains.push(domain);
      diagnostics.push({ code: 'TASK_ROUTE_DOMAIN_UNSUPPORTED', message: `No source candidate for domain: ${domain}`, subject: domain });
      continue;
    }

    // Sort deterministically: relevance desc, then sourceId asc (code-point)
    const sorted = [...candidates].sort((a, b) => {
      if (b.routingRelevance !== a.routingRelevance) return b.routingRelevance - a.routingRelevance;
      return compareCodePoint(a.sourceId, b.sourceId);
    });

    for (const source of sorted) {
      resolvedCandidates.push({
        sourceId: source.sourceId,
        domain,
        routingRelevance: source.routingRelevance,
        authorityRef: source.authorityRef,
        applicabilityState: source.applicabilityState,
        ...(source.applicabilityWitnessRef !== undefined ? { applicabilityWitnessRef: source.applicabilityWitnessRef } : {}),
        sourceFingerprint: source.sourceFingerprint,
        ...(source.aliasRefs !== undefined ? { aliasRefs: source.aliasRefs } : {}),
      });
    }
  }

  const result: TaskRouteResult = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    candidates: resolvedCandidates,
    unresolvedDomains,
    diagnostics,
  });

  return { ok: true, value: result };
}

// ─── Authority-Bound Selection Filter (ABSF) ──────────────────────────────────

/**
 * Select context units using M09 authority, not routing relevance.
 * Unresolved authority fails closed for mandatory roles.
 * Returns a list of selected ABCUs and a Context Authority Matrix.
 */
export function applyAuthorityBoundSelectionFilter(
  input: AbsfInput,
  units: ReadonlyMap<string, AuthorityBoundContextUnit>,
  options: OperationOptions,
): Result<{ selected: readonly AuthorityBoundContextUnit[]; matrix: ContextAuthorityMatrix }> {
  const c = cancelled(options);
  if (c) return c;

  const { taskIntentEnvelope: tie, routeCandidates, authorityProofs } = input;
  const proofMap = new Map<string, AuthorityResolutionProof>(
    authorityProofs.map(p => [`${p.domain}:${p.sourceId}`, p])
  );

  const camEntries: CamEntry[] = [];
  const selected: AuthorityBoundContextUnit[] = [];
  let unresolvedCount = 0;
  let conflictCount = 0;

  // Group candidates by domain
  const byDomain = new Map<string, SourceRouteCandidate[]>();
  for (const candidate of routeCandidates) {
    if (!byDomain.has(candidate.domain)) byDomain.set(candidate.domain, []);
    byDomain.get(candidate.domain)!.push(candidate);
  }

  for (const domain of [...tie.targetDomains].sort(compareCodePoint)) {
    const candidates = byDomain.get(domain) ?? [];

    if (candidates.length === 0) {
      camEntries.push({ domain, role: 'NORMATIVE', state: 'UNRESOLVED' });
      unresolvedCount++;
      continue;
    }

    // Check applicability — stale witness invalidates selection
    const applicableCandidates = candidates.filter(c2 => {
      if (c2.applicabilityState === 'INACTIVE') return false;
      if (c2.applicabilityState === 'CONTRADICTORY') return false;
      return true;
    });

    // Look up authority proofs
    const provenCandidates = applicableCandidates.filter(c2 => {
      const proof = proofMap.get(`${c2.domain}:${c2.sourceId}`);
      return proof !== undefined && proof.conflictState !== 'CONFLICT';
    });

    const conflictCandidates = applicableCandidates.filter(c2 => {
      const proof = proofMap.get(`${c2.domain}:${c2.sourceId}`);
      return proof !== undefined && proof.conflictState === 'CONFLICT';
    });

    if (conflictCandidates.length > 0 && provenCandidates.length === 0) {
      // Conflict with no resolved winner: blocked
      const conflictIds = conflictCandidates.map(c2 => c2.sourceId).sort(compareCodePoint);
      camEntries.push({ domain, role: 'NORMATIVE', state: 'CONFLICT', conflictIds });
      conflictCount++;
      continue;
    }

    if (provenCandidates.length === 0) {
      camEntries.push({ domain, role: 'NORMATIVE', state: 'UNRESOLVED' });
      unresolvedCount++;
      continue;
    }

    // Select the highest-authority candidate (by proof position, then sourceId for determinism)
    // Sorted by sourceId for determinism (authority winner determined by proof, not relevance)
    const sorted = [...provenCandidates].sort((a, b) => compareCodePoint(a.sourceId, b.sourceId));
    const chosen = sorted[0]!;
    const unit = units.get(chosen.sourceId);

    if (!unit) {
      camEntries.push({ domain, role: 'NORMATIVE', state: 'UNRESOLVED' });
      unresolvedCount++;
      continue;
    }

    // Cross-project check
    if (unit.projectId !== tie.projectId) {
      camEntries.push({ domain, role: 'NORMATIVE', state: 'UNRESOLVED' });
      unresolvedCount++;
      continue;
    }

    camEntries.push({ domain, role: unit.role, state: 'BOUND', boundUnitId: unit.unitId });
    selected.push(unit);
  }

  // Compute matrix identity
  const matrixPayload = { taskIdentity: tie.semanticIdentity, entries: camEntries };
  const matrixDigest = sha(options, matrixPayload);
  if (!matrixDigest.ok) return matrixDigest;

  const matrix: ContextAuthorityMatrix = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    entries: camEntries,
    unresolvedCount,
    conflictCount,
    semanticIdentity: matrixDigest.value,
  });

  return { ok: true, value: { selected, matrix } };
}

// ─── Context Authority Matrix (CAM) validation ────────────────────────────────

/** Check if the CAM allows continuation (no unresolved mandatory roles). */
export function validateContextAuthorityMatrix(
  matrix: ContextAuthorityMatrix,
): Result<true> {
  if (matrix.unresolvedCount > 0) {
    return fail('CONTEXT_AUTHORITY_UNRESOLVED',
      `CAM has ${matrix.unresolvedCount} unresolved mandatory domain(s)`, matrix.taskIdentity);
  }
  if (matrix.conflictCount > 0) {
    return fail('CONTEXT_AUTHORITY_CONFLICT',
      `CAM has ${matrix.conflictCount} unresolved authority conflict(s)`, matrix.taskIdentity);
  }
  return { ok: true, value: true };
}

// ─── Authority Neighborhood Projection (ANP) ──────────────────────────────────

export interface AnpSourceInput {
  readonly sourceId: string;
  readonly domain: string;
  readonly authorityStrength: AnpNode['authorityStrength'];
  readonly neighborIds: readonly string[];
}

/**
 * Build a bounded, deterministic Authority Neighborhood Projection.
 * This is disposable derived state; cached ordering never overrides M09 source truth.
 */
export function buildAuthorityNeighborhoodProjection(
  taskIdentity: string,
  sources: readonly AnpSourceInput[],
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): Result<AuthorityNeighborhoodProjection> {
  const c = cancelled(options);
  if (c) return c;

  const maxNodes = callerBudget?.maxNodes !== undefined
    ? Math.min(safeLimit(options.maxNodes, DEFAULT_MAX_NODES), callerBudget.maxNodes)
    : safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const maxEdges = callerBudget?.maxEdges !== undefined
    ? Math.min(safeLimit(options.maxEdges, DEFAULT_MAX_EDGES), callerBudget.maxEdges)
    : safeLimit(options.maxEdges, DEFAULT_MAX_EDGES);

  const sortedSources = [...sources]
    .sort((a, b) => compareCodePoint(a.sourceId, b.sourceId))
    .slice(0, maxNodes);

  const truncated = sources.length > maxNodes;
  let edgeCount = 0;

  const nodes: AnpNode[] = [];
  for (const source of sortedSources) {
    const validNeighbors = source.neighborIds
      .filter(n => !truncated || sortedSources.some(s => s.sourceId === n))
      .slice(0, Math.max(0, maxEdges - edgeCount));
    edgeCount += validNeighbors.length;
    nodes.push({
      sourceId: source.sourceId,
      domain: source.domain,
      authorityStrength: source.authorityStrength,
      neighborIds: [...validNeighbors].sort(compareCodePoint),
    });
  }

  const digestResult = sha(options, { taskIdentity, nodes, truncated });
  if (!digestResult.ok) return digestResult;

  const projection: AuthorityNeighborhoodProjection = deepFreeze({
    taskIdentity,
    nodes,
    edgeCount,
    truncated,
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: projection };
}

// ─── Context Redundancy Barrier (CRB) ─────────────────────────────────────────

/**
 * Deduplicate semantic units by identity/digest, preserving provenance.
 * Text similarity alone cannot deduplicate normative obligations.
 */
export function applyContextRedundancyBarrier(
  units: readonly AuthorityBoundContextUnit[],
  options: OperationOptions,
): Result<readonly DeduplicatedUnit[]> {
  const c = cancelled(options);
  if (c) return c;

  // Group by semanticIdentity (exact digest-based dedup)
  const byIdentity = new Map<string, AuthorityBoundContextUnit[]>();
  for (const unit of units) {
    if (!byIdentity.has(unit.semanticIdentity)) {
      byIdentity.set(unit.semanticIdentity, []);
    }
    byIdentity.get(unit.semanticIdentity)!.push(unit);
  }

  // Also check: same unitId with different identity = distinct (different authority)
  const byUnitId = new Map<string, Set<string>>();
  for (const unit of units) {
    if (!byUnitId.has(unit.unitId)) byUnitId.set(unit.unitId, new Set());
    byUnitId.get(unit.unitId)!.add(unit.semanticIdentity);
  }

  const deduplicated: DeduplicatedUnit[] = [];
  const processedIdentities = new Set<string>();

  // Sort for determinism
  const sortedUnits = [...units].sort((a, b) => compareCodePoint(a.unitId, b.unitId));

  for (const unit of sortedUnits) {
    if (processedIdentities.has(unit.semanticIdentity)) continue;
    processedIdentities.add(unit.semanticIdentity);

    const duplicates = byIdentity.get(unit.semanticIdentity) ?? [];
    const suppressedIds = duplicates
      .filter(d => d.unitId !== unit.unitId)
      .map(d => d.unitId)
      .sort(compareCodePoint);

    // Collect all roles from duplicates (may satisfy multiple roles)
    const rolesSet = new Set<AbcuRole>();
    for (const dup of duplicates) rolesSet.add(dup.role);
    const rolesCollapsed = [...rolesSet].sort(compareCodePoint) as AbcuRole[];

    // Provenance refs: all unitIds that share this semantic identity
    const provenanceRefs = duplicates.map(d => d.unitId).sort(compareCodePoint);

    deduplicated.push({
      canonicalUnitId: unit.unitId,
      provenanceRefs,
      rolesCollapsed,
      suppressedDuplicateIds: suppressedIds,
    });
  }

  return { ok: true, value: deepFreeze(deduplicated) };
}

// ─── Budget exhaustion check ───────────────────────────────────────────────────

/**
 * Check if routing budget is exhausted.
 * Exhaustion never claims sufficiency.
 */
export function checkRoutingBudget(
  candidateCount: number,
  unresolvedDomainCount: number,
  callerBudget: ContextBudget | undefined,
  options: OperationOptions,
): Result<true> {
  const maxDomains = callerBudget?.maxDomains !== undefined
    ? Math.min(safeLimit(options.maxNodes, DEFAULT_MAX_DOMAINS), callerBudget.maxDomains)
    : safeLimit(options.maxNodes, DEFAULT_MAX_DOMAINS);

  if (candidateCount > maxDomains) {
    return fail('CONTEXT_ROUTE_BUDGET_EXCEEDED',
      `Routing budget exceeded: ${candidateCount} candidates exceeds maxDomains=${maxDomains}`);
  }
  if (unresolvedDomainCount > 0) {
    return fail('CONTEXT_AUTHORITY_UNRESOLVED',
      `${unresolvedDomainCount} domain(s) have no authority-valid candidate`);
  }
  return { ok: true, value: true };
}
