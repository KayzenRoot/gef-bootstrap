// M14 Task & Context Compiler - s03-msc-proof.ts
// S03: Context Sufficiency Proof, Context Cut Frontier, Semantic Coverage Lattice,
//      Context Deficit Vector, Minimum Context Witness, Minimum Sufficient Context
// Deterministic, read-only. Correctness-first; optimization is subordinate.

import type {
  TaskIntentEnvelope,
  AuthorityBoundContextUnit,
  ContextDependencyClosure,
  ContextSufficiencyProof,
  SemanticCoverageLattice,
  ObligationCoverage,
  ContextDeficitVector,
  DeficitEntry,
  MinimumContextWitness,
  WitnessEntry,
  ExclusionEntry,
  OperationOptions,
  Result,
  ContextBudget,
  SufficiencyState,
} from './types.js';
import {
  compareCodePoint,
  fail,
  cancelled,
  sha,
  deepFreeze,
} from './utils.js';

// ─── Obligation contract ───────────────────────────────────────────────────────

export interface ObligationDefinition {
  readonly obligationId: string;
  readonly domain: string;
  readonly requiredRoles: readonly AuthorityBoundContextUnit['role'][];
  readonly mandatory: boolean;
}

// ─── Context Cut Frontier (CCF) ───────────────────────────────────────────────

export interface ContextCutFrontierResult {
  readonly taskIdentity: string;
  /** Unit IDs after which additional context cannot change currently required obligations. */
  readonly frontierUnitIds: readonly string[];
  readonly complete: boolean;
}

/**
 * Find the deterministic cut in the source/dependency graph
 * after which additional context cannot change currently required obligations.
 */
export function computeContextCutFrontier(
  tie: TaskIntentEnvelope,
  selectedUnits: readonly AuthorityBoundContextUnit[],
  closure: ContextDependencyClosure,
): ContextCutFrontierResult {
  // Frontier: units whose required domains are fully covered by the closed set
  const closedIds = new Set(closure.closedUnitIds);
  const requiredDomains = new Set(tie.targetDomains);

  // Find units that cover required domains
  const coveringUnits = selectedUnits.filter(u =>
    requiredDomains.has(u.domain) && closedIds.has(u.unitId)
  );

  const frontierUnitIds = [...coveringUnits]
    .sort((a, b) => compareCodePoint(a.unitId, b.unitId))
    .map(u => u.unitId);

  const complete = closure.state === 'COMPLETE';

  return deepFreeze({
    taskIdentity: tie.semanticIdentity,
    frontierUnitIds,
    complete,
  });
}

// ─── Semantic Coverage Lattice (SCL) ──────────────────────────────────────────

/**
 * Build Semantic Coverage Lattice.
 * Coverage is per obligation/domain, never a scalar similarity score.
 */
export function buildSemanticCoverageLattice(
  tie: TaskIntentEnvelope,
  obligations: readonly ObligationDefinition[],
  selectedUnits: readonly AuthorityBoundContextUnit[],
  options: OperationOptions,
): Result<SemanticCoverageLattice> {
  const c = cancelled(options);
  if (c) return c;

  const unitsByDomain = new Map<string, AuthorityBoundContextUnit[]>();
  for (const unit of selectedUnits) {
    if (!unitsByDomain.has(unit.domain)) unitsByDomain.set(unit.domain, []);
    unitsByDomain.get(unit.domain)!.push(unit);
  }

  const coverageEntries: ObligationCoverage[] = [];
  let overallBlocked = false;
  let overallUncovered = false;
  let overallPartial = false;

  for (const obligation of [...obligations].sort((a, b) => compareCodePoint(a.obligationId, b.obligationId))) {
    const domainUnits = unitsByDomain.get(obligation.domain) ?? [];

    if (domainUnits.length === 0) {
      const state = obligation.mandatory ? 'UNCOVERED' : 'UNCOVERED';
      coverageEntries.push({
        obligationId: obligation.obligationId,
        domain: obligation.domain,
        coverageState: state,
        coveringUnitIds: [],
        partialReasons: ['No context units available for this domain'],
      });
      if (obligation.mandatory) overallUncovered = true;
      continue;
    }

    // Check applicability
    const activeUnits = domainUnits.filter(u => u.applicability === 'ACTIVE');
    const unknownUnits = domainUnits.filter(u => u.applicability === 'UNKNOWN');
    const contradictoryUnits = domainUnits.filter(u => u.applicability === 'CONTRADICTORY');

    if (contradictoryUnits.length > 0) {
      coverageEntries.push({
        obligationId: obligation.obligationId,
        domain: obligation.domain,
        coverageState: 'BLOCKED',
        coveringUnitIds: contradictoryUnits.map(u => u.unitId).sort(compareCodePoint),
        partialReasons: ['Contradictory applicability state'],
      });
      overallBlocked = true;
      continue;
    }

    // Check required roles are covered
    const coveredRoles = new Set(activeUnits.map(u => u.role));
    const uncoveredRoles = obligation.requiredRoles.filter(r => !coveredRoles.has(r));

    if (uncoveredRoles.length === 0 && activeUnits.length > 0) {
      coverageEntries.push({
        obligationId: obligation.obligationId,
        domain: obligation.domain,
        coverageState: 'COVERED',
        coveringUnitIds: activeUnits.map(u => u.unitId).sort(compareCodePoint),
      });
    } else if (activeUnits.length > 0 && uncoveredRoles.length > 0) {
      const reasons: string[] = uncoveredRoles.map(r => `Missing role: ${r}`);
      if (unknownUnits.length > 0) reasons.push(`${unknownUnits.length} units with unknown applicability`);
      coverageEntries.push({
        obligationId: obligation.obligationId,
        domain: obligation.domain,
        coverageState: 'PARTIAL',
        coveringUnitIds: activeUnits.map(u => u.unitId).sort(compareCodePoint),
        partialReasons: reasons,
      });
      if (obligation.mandatory) overallPartial = true;
    } else {
      const reasons: string[] = ['No active units for required roles'];
      if (unknownUnits.length > 0) reasons.push(`${unknownUnits.length} units with unknown applicability`);
      coverageEntries.push({
        obligationId: obligation.obligationId,
        domain: obligation.domain,
        coverageState: 'UNCOVERED',
        coveringUnitIds: [],
        partialReasons: reasons,
      });
      if (obligation.mandatory) overallUncovered = true;
    }
  }

  const overallCoverage =
    overallBlocked ? 'BLOCKED' :
    overallUncovered ? 'UNCOVERED' :
    overallPartial ? 'PARTIAL' :
    'COVERED';

  const digestResult = sha(options, { taskIdentity: tie.semanticIdentity, obligations: coverageEntries });
  if (!digestResult.ok) return digestResult;

  const lattice: SemanticCoverageLattice = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    obligations: coverageEntries,
    overallCoverage,
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: lattice };
}

// ─── Context Deficit Vector (CDV) ─────────────────────────────────────────────

/**
 * Build the Context Deficit Vector.
 * Non-empty CDV means expansion is required, never silently skipped.
 */
export function buildContextDeficitVector(
  tie: TaskIntentEnvelope,
  lattice: SemanticCoverageLattice,
  closure: ContextDependencyClosure,
  authorityMatrix: { unresolvedCount: number; conflictCount: number },
  riskClass: TaskIntentEnvelope['riskClass'],
): ContextDeficitVector {
  const deficits: DeficitEntry[] = [];

  // Authority deficits
  if (authorityMatrix.unresolvedCount > 0) {
    deficits.push({
      dimension: 'AUTHORITY',
      domain: '*',
      reason: `${authorityMatrix.unresolvedCount} mandatory domain(s) have unresolved authority`,
    });
  }
  if (authorityMatrix.conflictCount > 0) {
    deficits.push({
      dimension: 'AUTHORITY',
      domain: '*',
      reason: `${authorityMatrix.conflictCount} authority conflict(s) remain unresolved`,
    });
  }

  // Coverage deficits from lattice
  for (const entry of lattice.obligations) {
    if (entry.coverageState === 'UNCOVERED' || entry.coverageState === 'PARTIAL') {
      deficits.push({
        dimension: 'AUTHORITY',
        domain: entry.domain,
        reason: `Obligation ${entry.obligationId} is ${entry.coverageState.toLowerCase()}`,
      });
    }
    if (entry.coverageState === 'BLOCKED') {
      deficits.push({
        dimension: 'AUTHORITY',
        domain: entry.domain,
        reason: `Obligation ${entry.obligationId} is blocked by contradictory applicability`,
      });
    }
  }

  // Dependency deficits
  if (closure.state === 'UNKNOWN_DEPENDENCY') {
    const unknownList = (closure.unknownRefs ?? []).join(', ');
    deficits.push({
      dimension: 'DEPENDENCY',
      domain: '*',
      reason: `Unknown dependencies prevent closure: ${unknownList}`,
    });
  }
  if (closure.state === 'CYCLE_DETECTED') {
    deficits.push({
      dimension: 'DEPENDENCY',
      domain: '*',
      reason: `Dependency cycles detected; must be resolved before context is sufficient`,
    });
  }
  if (closure.state === 'BUDGET_EXHAUSTED') {
    deficits.push({
      dimension: 'DEPENDENCY',
      domain: '*',
      reason: 'Dependency closure budget exhausted; closure may be incomplete',
    });
  }
  if (closure.state === 'CANCELLED') {
    deficits.push({
      dimension: 'DEPENDENCY',
      domain: '*',
      reason: 'Dependency closure was cancelled',
    });
  }

  // Safety/risk deficit for high-risk tasks without full coverage
  if (riskClass === 'HIGH_ASSURANCE' || riskClass === 'ELEVATED') {
    const uncoveredMandatory = lattice.obligations.filter(
      o => o.coverageState !== 'COVERED'
    );
    if (uncoveredMandatory.length > 0) {
      deficits.push({
        dimension: 'SAFETY',
        domain: '*',
        reason: `Risk class ${riskClass} requires full coverage but ${uncoveredMandatory.length} obligation(s) are not COVERED`,
      });
    }
  }

  const sortedDeficits = [...deficits].sort((a, b) =>
    compareCodePoint(a.dimension, b.dimension) || compareCodePoint(a.domain, b.domain)
  );

  return deepFreeze({
    taskIdentity: tie.semanticIdentity,
    deficits: sortedDeficits,
    isEmpty: sortedDeficits.length === 0,
  });
}

// ─── Minimum Context Witness (MCW) ────────────────────────────────────────────

/**
 * Build Minimum Context Witness: records why every included/excluded unit is included/excluded.
 */
export function buildMinimumContextWitness(
  tie: TaskIntentEnvelope,
  selectedUnits: readonly AuthorityBoundContextUnit[],
  allAvailableUnits: readonly AuthorityBoundContextUnit[],
  lattice: SemanticCoverageLattice,
  options: OperationOptions,
): Result<MinimumContextWitness> {
  const c = cancelled(options);
  if (c) return c;

  const selectedIds = new Set(selectedUnits.map(u => u.unitId));
  const coverageMap = new Map<string, string[]>();
  for (const entry of lattice.obligations) {
    for (const unitId of entry.coveringUnitIds) {
      if (!coverageMap.has(unitId)) coverageMap.set(unitId, []);
      coverageMap.get(unitId)!.push(entry.obligationId);
    }
  }

  const includedUnits: WitnessEntry[] = [];
  for (const unit of [...selectedUnits].sort((a, b) => compareCodePoint(a.unitId, b.unitId))) {
    const obligationIds = (coverageMap.get(unit.unitId) ?? []).sort(compareCodePoint);
    const inclusionReason = obligationIds.length > 0
      ? `Covers obligations: ${obligationIds.join(', ')}`
      : `Required for domain ${unit.domain} with role ${unit.role}`;
    includedUnits.push({ unitId: unit.unitId, inclusionReason, obligationIds });
  }

  const excludedNeighbors: ExclusionEntry[] = [];
  for (const unit of [...allAvailableUnits].sort((a, b) => compareCodePoint(a.unitId, b.unitId))) {
    if (selectedIds.has(unit.unitId)) continue;
    let exclusionReason = '';
    if (!tie.targetDomains.includes(unit.domain)) {
      exclusionReason = `Domain ${unit.domain} is not a target domain for this task`;
    } else if (unit.applicability === 'INACTIVE') {
      exclusionReason = 'Unit is INACTIVE for this context';
    } else if (unit.applicability === 'CONTRADICTORY') {
      exclusionReason = 'Unit has CONTRADICTORY applicability';
    } else {
      exclusionReason = 'Unit is not required by the minimum sufficient context for current obligations';
    }
    excludedNeighbors.push({ unitId: unit.unitId, exclusionReason });
  }

  const digestResult = sha(options, {
    taskIdentity: tie.semanticIdentity,
    includedUnits,
    excludedNeighbors,
  });
  if (!digestResult.ok) return digestResult;

  const witness: MinimumContextWitness = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    includedUnits,
    excludedNeighbors,
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: witness };
}

// ─── Context Sufficiency Proof (CSP) ──────────────────────────────────────────

export interface BuildSufficiencyProofInput {
  readonly tie: TaskIntentEnvelope;
  readonly lattice: SemanticCoverageLattice;
  readonly deficitVector: ContextDeficitVector;
  readonly witness: MinimumContextWitness;
  readonly closure: ContextDependencyClosure;
  readonly validityFingerprints: readonly string[];
  readonly exclusionJustifications: readonly string[];
  readonly callerBudget?: ContextBudget | undefined;
}

/**
 * Build the Context Sufficiency Proof.
 * Follows the M14 S03 algorithm contract strictly.
 * Correctness > minimization.
 */
export function buildContextSufficiencyProof(
  input: BuildSufficiencyProofInput,
  options: OperationOptions,
): Result<ContextSufficiencyProof> {
  const c = cancelled(options);
  if (c) return c;

  const { tie, lattice, deficitVector, witness, closure, validityFingerprints } = input;

  // Determine sufficiency state
  let sufficiencyState: SufficiencyState;

  if (closure.state === 'CANCELLED') {
    sufficiencyState = 'INDETERMINATE';
  } else if (!deficitVector.isEmpty) {
    // CDV non-empty → expansion required
    sufficiencyState = 'EXPANSION_REQUIRED';
  } else if (lattice.overallCoverage === 'BLOCKED') {
    sufficiencyState = 'BLOCKED';
  } else if (lattice.overallCoverage === 'COVERED' && closure.state === 'COMPLETE') {
    sufficiencyState = 'SUFFICIENT';
  } else if (lattice.overallCoverage === 'PARTIAL' || lattice.overallCoverage === 'UNCOVERED') {
    sufficiencyState = 'EXPANSION_REQUIRED';
  } else {
    sufficiencyState = 'INDETERMINATE';
  }

  const dependencyKnowledgeComplete =
    closure.state === 'COMPLETE' ||
    (closure.state !== 'UNKNOWN_DEPENDENCY' && closure.state !== 'CYCLE_DETECTED' &&
      closure.state !== 'BUDGET_EXHAUSTED' && closure.state !== 'CANCELLED');

  const digestResult = sha(options, {
    taskIdentity: tie.semanticIdentity,
    sufficiencyState,
    coverageLatticeIdentity: lattice.semanticIdentity,
    deficitVector: deficitVector.deficits,
    witnessIdentity: witness.semanticIdentity,
    closureState: closure.state,
    validityFingerprints: [...validityFingerprints].sort(compareCodePoint),
  });
  if (!digestResult.ok) return digestResult;

  const proof: ContextSufficiencyProof = deepFreeze({
    taskIdentity: tie.semanticIdentity,
    sufficiencyState,
    coverageLattice: lattice,
    deficitVector,
    witness,
    dependencyClosure: closure,
    validityFingerprints: [...validityFingerprints].sort(compareCodePoint),
    exclusionJustifications: [...input.exclusionJustifications].sort(compareCodePoint),
    dependencyKnowledgeComplete,
    semanticIdentity: digestResult.value,
  });

  return { ok: true, value: proof };
}
