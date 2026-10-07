// GBS-MOD-WO-001 (D) — changed-path closure onto the M28 test-impact selection.
//
// M28 already answers "which tests are impacted by these changed *sources*". This module is the
// bridge from a Git changed-path set to that source set, plus the floor that keeps the two
// honest: a path the caller cannot attribute to a known source must not silently collapse into
// "no impacted tests", and the tier the change-impact classifier proved must not be undercut by
// a narrow selection.
//
// It reuses `selectImpactedTests` and `progressiveValidationLevel` rather than adding a second
// impact engine. The output is advisory selection plus an explicit floor: it never claims to
// authorize skipping a check that another authority still requires.

import type { AssuranceInput, OperationOptions, Result, SelectionPlan, TestMap, ValidationLevel } from './types.js';
import { selectImpactedTests } from './s02-selection-reuse.js';
import { progressiveValidationLevel } from './s03-regression-radius.js';
import { Guard, LEVELS, digest, fail, maxLevel, ok, unique } from './utils.js';

export const GATE_CLOSURE_VERSION = '1.0';

export const gateClosureObstructions = Object.freeze([
  'PATH_NOT_ATTRIBUTED_TO_A_KNOWN_SOURCE',
  'SOURCE_PATH_INDEX_INCOMPLETE',
  'DEPENDENCY_CLOSURE_UNKNOWN',
] as const);
export type GateClosureObstruction = (typeof gateClosureObstructions)[number];

export interface GateClosureInput {
  /** A real M28 map, built by the caller from the repository's own source/test specs. */
  readonly map: TestMap;
  /** Authoritative path -> source-id attribution. A path absent from this index is unattributed. */
  readonly sourcePathIndex: Readonly<Record<string, readonly string[]>>;
  /** Every repository path the change touched, including deletions, moves and renames. */
  readonly changedPaths: readonly string[];
  readonly assurance: AssuranceInput;
  readonly platform: string;
  /** Validation ladder floor proven by the change-impact classifier. */
  readonly tierFloor: ValidationLevel;
  /** True only when the caller proved the path attribution covers the whole changed set. */
  readonly attributionComplete: boolean;
}

export interface GateClosureResult {
  readonly version: string;
  readonly changedPathCount: number;
  readonly changedSourceIds: readonly string[];
  readonly unattributedPaths: readonly string[];
  readonly selection: SelectionPlan;
  /** max(tier floor, ladder level derived from impact and uncertainty). */
  readonly effectiveFloor: ValidationLevel;
  readonly tierFloor: ValidationLevel;
  readonly obstructions: readonly GateClosureObstruction[];
  readonly fullSuiteRequired: boolean;
  readonly closureDigest: string;
}

export const GATE_CLOSURE_DIAGNOSTIC_CODES = Object.freeze({
  GATE_CLOSURE_INPUT_INVALID: 'GATE_CLOSURE_INPUT_INVALID',
} as const);

const TIER_TO_LEVEL: Readonly<Record<string, ValidationLevel>> = Object.freeze({
  LOW: 'L1',
  STANDARD: 'L2',
  ELEVATED: 'L4',
  HIGH_ASSURANCE: 'L5',
});

/**
 * Maps a change-impact tier onto the M28 validation ladder.
 *
 * An unrecognized tier maps to `L5`: an unclassified risk must never buy a weaker floor.
 */
export function tierToValidationLevel(tier: string): ValidationLevel {
  return TIER_TO_LEVEL[tier] ?? 'L5';
}

export function assertGateClosureInput(input: GateClosureInput): Result<true> {
  const invalid = (message: string, subject?: string): Result<true> =>
    fail(GATE_CLOSURE_DIAGNOSTIC_CODES.GATE_CLOSURE_INPUT_INVALID, message, subject);
  if (input === null || typeof input !== 'object') return invalid('Gate closure input must be an object');
  if (!Array.isArray(input.changedPaths) || input.changedPaths.length === 0) {
    return invalid('changedPaths must be a non-empty array');
  }
  if (input.changedPaths.some((path) => typeof path !== 'string' || path.length === 0)) {
    return invalid('changedPaths entries must be non-empty strings');
  }
  if (input.map === null || typeof input.map !== 'object' || !Array.isArray(input.map.sources)) {
    return invalid('map must be a built M28 TestMap');
  }
  if (input.sourcePathIndex === null || typeof input.sourcePathIndex !== 'object' || Array.isArray(input.sourcePathIndex)) {
    return invalid('sourcePathIndex must be a plain object');
  }
  // The index is caller-supplied authority: a non-array or non-string entry would otherwise be
  // iterated as junk source ids, so it is refused rather than coerced.
  for (const [path, attributed] of Object.entries(input.sourcePathIndex)) {
    if (!Array.isArray(attributed) || attributed.some((sourceId) => typeof sourceId !== 'string' || sourceId.length === 0)) {
      return invalid('sourcePathIndex values must be arrays of non-empty source ids', path);
    }
  }
  if (typeof input.platform !== 'string' || input.platform.length === 0) return invalid('platform must be a non-empty string');
  if (!LEVELS.includes(input.tierFloor)) return invalid('tierFloor must be a known validation level', input.tierFloor);
  return ok(true as const);
}

/**
 * Closes changed paths onto the M28 selection and derives the effective validation floor.
 *
 * Unattributed paths are reported individually so the caller can widen with evidence instead of
 * guessing, and any obstruction forces at least `L4` — the same widening `selectImpactedTests`
 * applies when its own dependency knowledge is incomplete.
 */
export function compileGateClosure(input: GateClosureInput, options: OperationOptions): Result<GateClosureResult> {
  const inputCheck = assertGateClosureInput(input);
  if (inputCheck.ok !== true) return inputCheck;
  const guard = new Guard(options);

  const obstructions: GateClosureObstruction[] = [];
  const knownSourceIds = new Set(input.map.sources.map((source) => source.id));
  const changedSourceIds: string[] = [];
  const unattributedPaths: string[] = [];

  for (const path of unique(input.changedPaths)) {
    const step = guard.step(path);
    if (step.ok !== true) return step;
    const attributed = input.sourcePathIndex[path];
    if (attributed === undefined || attributed.length === 0) {
      unattributedPaths.push(path);
      continue;
    }
    let resolvedAll = true;
    for (const sourceId of attributed) {
      if (!knownSourceIds.has(sourceId)) {
        resolvedAll = false;
        continue;
      }
      changedSourceIds.push(sourceId);
    }
    if (!resolvedAll) unattributedPaths.push(path);
  }

  if (unattributedPaths.length > 0) obstructions.push('PATH_NOT_ATTRIBUTED_TO_A_KNOWN_SOURCE');
  if (input.attributionComplete !== true) obstructions.push('SOURCE_PATH_INDEX_INCOMPLETE');
  if (input.map.complete !== true) obstructions.push('DEPENDENCY_CLOSURE_UNKNOWN');

  const widened = obstructions.length > 0;
  const selection = selectImpactedTests(
    input.map,
    changedSourceIds,
    input.platform,
    widened ? { ...input.assurance, requiredLevel: maxLevel(input.assurance.requiredLevel, 'L4') } : input.assurance,
    options,
  );
  if (selection.ok !== true) return selection;
  const plan = selection.value;

  const derived = progressiveValidationLevel({
    direct: changedSourceIds.length > 0,
    closure: changedSourceIds.length > 0,
    boundary: widened,
    risk: widened,
    exact: input.tierFloor === 'L5',
    assuranceFloor: input.tierFloor,
    uncertainty: plan.uncertainty,
  });
  const effectiveFloor = maxLevel(derived, input.tierFloor);

  const body = {
    version: GATE_CLOSURE_VERSION,
    changedPathCount: input.changedPaths.length,
    changedSourceIds: unique(changedSourceIds),
    unattributedPaths: unique(unattributedPaths),
    selection: {
      tests: plan.tests,
      level: plan.level,
      uncertainty: plan.uncertainty,
      reasons: plan.reasons,
      digest: plan.digest,
    },
    effectiveFloor,
    tierFloor: input.tierFloor,
    obstructions: unique(obstructions) as readonly GateClosureObstruction[],
    fullSuiteRequired: effectiveFloor === 'L4' || effectiveFloor === 'L5',
  };

  const digestResult = digest(options, 'GATE_CLOSURE', body);
  if (digestResult.ok !== true) return digestResult;

  return ok({ ...body, closureDigest: digestResult.value });
}