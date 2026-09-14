// M15 Execution Pack Compiler - s04-cognition.ts
// S04: Executor Cognition Budget (ECB), Tool Invocation Blueprint (TIB),
//      Read-Once Context Index (ROCI), Negative Search Ledger (NSL),
//      Ambiguity Escalation Trigger (AET).
// Observable executor controls, never authority signals. No side effects.

import type {
  AmbiguityItem,
  BudgetConsumption,
  CognitionBudget,
  CognitionBudgetState,
  ReadOnceConsumption,
  ReadOnceContextIndex,
  Result,
  ToolInvocation,
} from './types.js';
import { compareCodePoint, deepFreeze, fail, sortedStrings } from './utils.js';

// ─── Executor Cognition Budget (ECB) ──────────────────────────────────────────

function validBudgetValue(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/** Create a bounded discovery/reasoning allowance. Non-positive limits are invalid. */
export function createExecutorCognitionBudget(
  limits: CognitionBudget,
): Result<CognitionBudgetState> {
  if (
    !validBudgetValue(limits.maxReads) ||
    !validBudgetValue(limits.maxSearches) ||
    !validBudgetValue(limits.maxToolCalls) ||
    !validBudgetValue(limits.maxAmbiguityBranches)
  ) {
    return fail('PACK_BUDGET_INVALID', 'Cognition budget limits must be positive integers');
  }
  return {
    ok: true,
    value: deepFreeze({
      limits: { ...limits },
      used: { reads: 0, searches: 0, toolCalls: 0, ambiguityBranches: 0 },
    }),
  };
}

/**
 * Consume from the budget. Exhaustion is explicit and fail-closed: the
 * dimension that overflowed is named instead of silently clamping.
 */
export function consumeCognitionBudget(
  state: CognitionBudgetState,
  use: Partial<BudgetConsumption>,
): Result<CognitionBudgetState> {
  const next: BudgetConsumption = {
    reads: state.used.reads + (use.reads ?? 0),
    searches: state.used.searches + (use.searches ?? 0),
    toolCalls: state.used.toolCalls + (use.toolCalls ?? 0),
    ambiguityBranches: state.used.ambiguityBranches + (use.ambiguityBranches ?? 0),
  };
  if (next.reads < 0 || next.searches < 0 || next.toolCalls < 0 || next.ambiguityBranches < 0) {
    return fail('PACK_BUDGET_INVALID', 'Budget consumption cannot be negative');
  }
  const over: Array<[string, number, number]> = [
    ['reads', next.reads, state.limits.maxReads],
    ['searches', next.searches, state.limits.maxSearches],
    ['toolCalls', next.toolCalls, state.limits.maxToolCalls],
    ['ambiguityBranches', next.ambiguityBranches, state.limits.maxAmbiguityBranches],
  ];
  for (const [dimension, usedValue, limit] of over) {
    if (usedValue > limit) {
      return fail(
        'PACK_BUDGET_EXHAUSTED',
        `Cognition budget exhausted for ${dimension}: ${usedValue} exceeds ${limit}`,
        dimension,
      );
    }
  }
  return { ok: true, value: deepFreeze({ limits: state.limits, used: next }) };
}

// ─── Tool Invocation Blueprint (TIB) ──────────────────────────────────────────

/**
 * Preselect permitted tool classes with inputs and fallback path.
 * Output order is deterministic (by tool, purpose, node refs), never input order.
 */
export function buildToolInvocationBlueprint(
  invocations: readonly ToolInvocation[],
): Result<readonly ToolInvocation[]> {
  for (const invocation of invocations) {
    if (!invocation.tool || invocation.tool.trim().length === 0) {
      return fail('PACK_TOOL_BLUEPRINT_INVALID', 'Tool invocation requires a tool name');
    }
    if (!invocation.purpose || invocation.purpose.trim().length === 0) {
      return fail(
        'PACK_TOOL_BLUEPRINT_INVALID',
        `Tool invocation for ${invocation.tool} requires a purpose`,
        invocation.tool,
      );
    }
  }
  const blueprint = [...invocations]
    .map(invocation => ({
      tool: invocation.tool,
      purpose: invocation.purpose,
      afterNodeIds: sortedStrings(invocation.afterNodeIds),
    }))
    .sort(
      (a, b) =>
        compareCodePoint(a.tool, b.tool) ||
        compareCodePoint(a.purpose, b.purpose) ||
        compareCodePoint(a.afterNodeIds.join('\u0000'), b.afterNodeIds.join('\u0000')),
    );
  return { ok: true, value: deepFreeze(blueprint) };
}

// ─── Read-Once Context Index (ROCI) ───────────────────────────────────────────

/**
 * Build direct pointers into TCC units so the executor never rescans
 * already-consumed context. Consumption is tracked explicitly: the first
 * consume is fresh, repeats are marked reused without rereading.
 */
export function buildReadOnceContextIndex(
  entries: Readonly<Record<string, readonly string[]>>,
): Result<ReadOnceContextIndex> {
  const keys = Object.keys(entries);
  if (keys.length === 0) {
    return fail('PACK_ROCI_INVALID', 'Read-once index requires at least one entry');
  }
  for (const key of keys) {
    if (!key || key.trim().length === 0) {
      return fail('PACK_ROCI_INVALID', 'Read-once index keys must be non-empty');
    }
  }
  const frozenEntries: Record<string, readonly string[]> = {};
  for (const key of keys.sort(compareCodePoint)) {
    const value = entries[key];
    frozenEntries[key] = Object.freeze([...(value ?? [])]);
  }
  return { ok: true, value: deepFreeze({ entries: frozenEntries }) };
}

/** Consume one index entry; repeats return the same value flagged as reused. */
export function consumeReadOnce(
  index: ReadOnceContextIndex,
  key: string,
  consumedKeys: readonly string[],
): Result<ReadOnceConsumption> {
  const value = index.entries[key];
  if (value === undefined) {
    return fail('PACK_ROCI_UNKNOWN_KEY', `Unknown read-once index key: ${key}`, key);
  }
  const reused = consumedKeys.includes(key);
  const consumed = reused ? [...consumedKeys] : [...consumedKeys, key].sort(compareCodePoint);
  return {
    ok: true,
    value: deepFreeze({ value: [...value], consumedKeys: consumed, reused }),
  };
}

// ─── Negative Search Ledger (NSL) ─────────────────────────────────────────────

/** Normalize a ledger query so equivalent searches share one entry. */
export function normalizeLedgerQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

/**
 * Record a validity-bound known absence so executors never repeat a failed
 * search. Total function: recording is monotonic and order-independent.
 */
export function recordNegativeSearch(
  ledger: readonly string[],
  query: string,
): readonly string[] {
  const normalized = normalizeLedgerQuery(query);
  if (normalized.length === 0) return ledger;
  return Object.freeze(sortedStrings([...new Set([...ledger, normalized])]));
}

/** Reuse a proven-negative result instead of re-searching. Total function. */
export function checkNegativeSearch(
  ledger: readonly string[],
  query: string,
): { knownAbsent: boolean } {
  return { knownAbsent: ledger.includes(normalizeLedgerQuery(query)) };
}

// ─── Ambiguity Escalation Trigger (AET) ───────────────────────────────────────

/**
 * Stop execution when new ambiguity would require product/policy authority.
 * Unresolved topics escalate (fail closed); fully resolved sets pass through.
 */
export function evaluateAmbiguityEscalation(
  items: readonly AmbiguityItem[],
): Result<readonly string[]> {
  const unresolved = items
    .filter(item => !item.resolved)
    .map(item => item.topic)
    .sort(compareCodePoint);
  if (unresolved.length > 0) {
    return fail(
      'PACK_AMBIGUITY_ESCALATED',
      `Unresolved ambiguity requires product/policy authority: ${unresolved.join(', ')}`,
      unresolved[0],
    );
  }
  const resolved = items.map(item => item.topic).sort(compareCodePoint);
  return { ok: true, value: deepFreeze(resolved) };
}
