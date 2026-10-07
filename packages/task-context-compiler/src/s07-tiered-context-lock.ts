// GBS-MOD-WO-001 (C) — risk-tiered Context Lock compilation.
//
// A Context Lock used to be one fixed document size. This module makes the *amount* of required
// context a deterministic function of the tier the change-impact classifier proved, so a narrow
// governance change loads the narrow authority set while a release-sensitive change loads the
// full proof obligations.
//
// Two invariants make the narrower tier safe:
//
//   1. A declared tier below the derived floor BLOCKS. The caller can raise assurance, never
//      lower it — the same rule M27 enforces for `requestedClass`.
//   2. Expansion is additive and explained. Every included source carries the reason it was
//      required, and every excluded one carries the trigger that was not observed, so the
//      receipt states what a narrower aperture left out instead of implying completeness.
//
// No side effects: repository facts arrive as arguments, never as reads.

import type { OperationOptions, Result } from './types.js';
import { compareCodePoint, deepFreeze, fail, sha, sortedStrings } from './utils.js';

export const TIERED_CONTEXT_LOCK_VERSION = '1.0';

export const contextLockTiers = Object.freeze(['LOW', 'STANDARD', 'ELEVATED', 'HIGH_ASSURANCE'] as const);
export type ContextLockTier = (typeof contextLockTiers)[number];

export const contextLockTierOrder: readonly ContextLockTier[] = contextLockTiers;

export function maxContextLockTier(left: ContextLockTier, right: ContextLockTier): ContextLockTier {
  return contextLockTierOrder.indexOf(left) >= contextLockTierOrder.indexOf(right) ? left : right;
}

/** Canonical sources every tier needs: authority routing plus current promoted project state. */
const BASE_SOURCES: readonly string[] = Object.freeze([
  '.engineering/SOURCE-HIERARCHY.md',
  '.engineering/CHECKPOINT.json',
  '.engineering/CHECKPOINT.md',
]);

const TIER_SOURCES: Readonly<Record<ContextLockTier, readonly string[]>> = Object.freeze({
  LOW: Object.freeze([]),
  STANDARD: Object.freeze([
    '.engineering/ARCHITECTURE.md',
    '.engineering/BACKLOG.md',
    '.engineering/DECISIONS-LEDGER.md',
  ]),
  ELEVATED: Object.freeze([
    '.engineering/DEFINITION-OF-DONE.md',
    '.engineering/DECISIONS-SUPERSESSION-MAP.md',
    '.engineering/REQUIREMENTS.md',
    '.engineering/SCOPE.md',
    '.engineering/SECURITY.md',
    '.engineering/TEST-BENCHMARK-PLAN.md',
  ]),
  HIGH_ASSURANCE: Object.freeze([
    '.engineering/CONSTITUTION-LOCK.md',
    '.engineering/DEPLOYMENT.md',
    '.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md',
  ]),
});

export const TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES = Object.freeze({
  LOCK_INPUT_INVALID: 'TIERED_CONTEXT_LOCK_INPUT_INVALID',
  LOCK_SOURCE_INVALID: 'TIERED_CONTEXT_LOCK_SOURCE_INVALID',
  LOCK_TIER_BELOW_FLOOR: 'TIERED_CONTEXT_LOCK_TIER_BELOW_FLOOR',
  LOCK_AUTHORITY_CONFLICT: 'TIERED_CONTEXT_LOCK_AUTHORITY_CONFLICT',
  LOCK_CHANGED_STATE_UNPROVEN: 'TIERED_CONTEXT_LOCK_CHANGED_STATE_UNPROVEN',
} as const);

export type TieredContextLockDiagnosticCode =
  (typeof TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES)[keyof typeof TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES];

export interface TieredContextLockInput {
  readonly taskIdentity: string;
  readonly workOrderId: string;
  readonly workOrderPath: string;
  readonly contextLockPath: string;
  /** Tier proven by the change-impact classifier. */
  readonly floorTier: ContextLockTier;
  /** Tier the caller intends to work at; may exceed the floor, never fall below it. */
  readonly declaredTier: ContextLockTier;
  readonly baseSha: string;
  readonly headSha: string;
  readonly affectedPaths: readonly string[];
  readonly readIfTriggered: readonly { readonly path: string; readonly trigger: string }[];
  /** Authority domains the changed paths actually touched. */
  readonly triggeredDomains: readonly string[];
  readonly obligations: readonly string[];
  readonly authorityConflict?: boolean;
  readonly changedStateUnproven?: boolean;
}

export interface ContextSourceInclusion {
  readonly path: string;
  readonly reason: string;
}

export interface ContextSourceExclusion {
  readonly path: string;
  readonly reason: string;
}

export interface TieredContextLock {
  readonly schemaVersion: string;
  readonly lockId: string;
  readonly taskIdentity: string;
  readonly workOrderId: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly tier: ContextLockTier;
  readonly floorTier: ContextLockTier;
  readonly state: 'COMPILED' | 'EXPANDED';
  readonly requiredSources: readonly string[];
  readonly includedSources: readonly ContextSourceInclusion[];
  readonly excludedTriggeredSources: readonly ContextSourceExclusion[];
  readonly affectedPaths: readonly string[];
  readonly obligations: readonly string[];
  readonly specialistGateRequired: boolean;
  readonly expansionReasons: readonly string[];
  readonly lockDigest: string;
}

const SHA40 = /^[0-9a-f]{40}$/;
const RELATIVE_PATH = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;

function isCleanRelativePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return false;
  if (!RELATIVE_PATH.test(value)) return false;
  // A traversal segment is syntactically valid but semantically escapes the repository; it is a
  // rejection, not something to normalize away.
  return !value.split('/').includes('..');
}

function dedupeSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodePoint);
}

/**
 * Compiles the tiered Context Lock.
 *
 * Returns `LOCK_TIER_BELOW_FLOOR` rather than silently using the floor: a caller that believes it
 * may work at a weaker tier than the change proves has a governance defect worth surfacing, and
 * quietly repairing it would hide the disagreement from the audit.
 */
export function compileTieredContextLock(
  input: TieredContextLockInput,
  options: OperationOptions,
): Result<TieredContextLock> {
  if (input === null || typeof input !== 'object') {
    return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, 'Context lock input must be an object');
  }
  if (!contextLockTiers.includes(input.declaredTier) || !contextLockTiers.includes(input.floorTier)) {
    return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, 'Declared and floor tiers must be known tiers');
  }
  if (!SHA40.test(input.baseSha) || !SHA40.test(input.headSha)) {
    return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, 'Base and head must be 40 character commit ids');
  }
  for (const [field, value] of [
    ['workOrderPath', input.workOrderPath],
    ['contextLockPath', input.contextLockPath],
  ] as const) {
    if (!isCleanRelativePath(value)) {
      return fail(
        TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID,
        `${field} must be a clean repository-relative path`,
        value,
      );
    }
  }
  for (const [field, value] of [
    ['affectedPaths', input.affectedPaths],
    ['readIfTriggered', input.readIfTriggered],
    ['triggeredDomains', input.triggeredDomains],
    ['obligations', input.obligations],
  ] as const) {
    if (!Array.isArray(value)) {
      return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, `${field} must be an array`, field);
    }
  }
  for (const path of input.affectedPaths) {
    if (!isCleanRelativePath(path)) {
      return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID, 'Affected paths must be clean repository-relative paths', path);
    }
  }
  for (const domain of input.triggeredDomains) {
    if (typeof domain !== 'string' || domain.trim().length === 0) {
      return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, 'triggeredDomains entries must be non-empty strings');
    }
  }
  for (const obligation of input.obligations) {
    if (typeof obligation !== 'string' || obligation.trim().length === 0) {
      return fail(TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_INPUT_INVALID, 'obligations entries must be non-empty strings');
    }
  }

  const tier = maxContextLockTier(input.declaredTier, input.floorTier);
  const expansionReasons: string[] = [];

  if (input.authorityConflict === true) {
    return fail(
      TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_AUTHORITY_CONFLICT,
      'Authority conflict must be resolved before a Context Lock can be compiled',
    );
  }
  if (input.changedStateUnproven === true) {
    return fail(
      TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_CHANGED_STATE_UNPROVEN,
      'An unproven changed state cannot be bound into a Context Lock',
    );
  }
  if (contextLockTierOrder.indexOf(input.declaredTier) < contextLockTierOrder.indexOf(input.floorTier)) {
    return fail(
      TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_TIER_BELOW_FLOOR,
      `Declared tier ${input.declaredTier} is below the derived floor ${input.floorTier}`,
      input.declaredTier,
    );
  }

  const included = new Map<string, ContextSourceInclusion>();
  const include = (path: string, reason: string): void => {
    if (included.has(path)) return;
    included.set(path, { path, reason });
  };

  include(input.workOrderPath, 'EXECUTED_WORK_ORDER');
  include(input.contextLockPath, 'EXECUTED_CONTEXT_LOCK');
  for (const path of BASE_SOURCES) include(path, 'BASE_AUTHORITY');
  for (const path of input.affectedPaths) include(path, 'AFFECTED_PATH');

  // Additive expansion for every tier at or below the proven tier. LOW contributes no extra
  // canonical sources beyond the base authority set, so it is skipped rather than looped.
  for (const candidateTier of contextLockTierOrder) {
    if (candidateTier === 'LOW') continue;
    if (contextLockTierOrder.indexOf(candidateTier) > contextLockTierOrder.indexOf(tier)) continue;
    for (const path of TIER_SOURCES[candidateTier]) include(path, `TIER:${candidateTier}`);
    expansionReasons.push(`TIER_SOURCES:${candidateTier}`);
  }

  const triggeredDomains = new Set(input.triggeredDomains);
  const excludedTriggeredSources: ContextSourceExclusion[] = [];
  for (const entry of input.readIfTriggered) {
    if (!isCleanRelativePath(entry.path) || entry.trigger.trim().length === 0) {
      return fail(
        TIERED_CONTEXT_LOCK_DIAGNOSTIC_CODES.LOCK_SOURCE_INVALID,
        'readIfTriggered entries need a clean relative path and a non-empty trigger',
        String(entry.path),
      );
    }
    if (triggeredDomains.has(entry.trigger)) {
      include(entry.path, `TRIGGERED:${entry.trigger}`);
      expansionReasons.push(`TRIGGERED_SOURCE:${entry.trigger}`);
      continue;
    }
    excludedTriggeredSources.push({ path: entry.path, reason: `NOT_TRIGGERED:${entry.trigger}` });
  }

  const specialistGateRequired = contextLockTierOrder.indexOf(tier) >= contextLockTierOrder.indexOf('HIGH_ASSURANCE');
  const requiredSources = dedupeSorted([...included.keys()]);
  const obligations = dedupeSorted(input.obligations);

  const body = {
    schemaVersion: TIERED_CONTEXT_LOCK_VERSION,
    taskIdentity: input.taskIdentity,
    workOrderId: input.workOrderId,
    baseSha: input.baseSha,
    headSha: input.headSha,
    tier,
    floorTier: input.floorTier,
    requiredSources,
    includedSources: [...included.values()].sort((left, right) => compareCodePoint(left.path, right.path)),
    excludedTriggeredSources: excludedTriggeredSources.sort((left, right) => compareCodePoint(left.path, right.path)),
    affectedPaths: dedupeSorted(input.affectedPaths),
    obligations,
    specialistGateRequired,
  };

  const digestResult = sha(options, body);
  if (!digestResult.ok) return digestResult;

  // `EXPANDED` means a READ_IF_TRIGGERED source fired because the change actually touched its
  // domain. Tier sources are not "expansion": they are the tier's fixed set, and each one already
  // carries its `TIER:<tier>` reason.
  const state: TieredContextLock['state'] =
    excludedTriggeredSources.length !== input.readIfTriggered.length ? 'EXPANDED' : 'COMPILED';

  return {
    ok: true,
    value: deepFreeze({
      ...body,
      lockId: `gef.context-lock.${input.workOrderId.toLowerCase()}.${input.headSha.slice(0, 12)}`,
      state,
      expansionReasons: sortedStrings([...new Set(expansionReasons)]),
      lockDigest: digestResult.value,
    }),
  };
}
