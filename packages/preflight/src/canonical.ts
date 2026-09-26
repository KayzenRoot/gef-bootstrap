import type { MutablePreflightCounters, PreflightCountersSnapshot, RequirementDigestPort } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const child = value[key];
    if (typeof child !== "function" && child !== undefined) out[key] = normalize(child);
  }
  return out;
}

export function stablePreflightStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function fingerprintRequirement(value: unknown, digest: RequirementDigestPort): string {
  return `${digest.algorithm}:${digest.digest(stablePreflightStringify(value))}`;
}

export function incrementCounter(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function createMutableCounters(): MutablePreflightCounters {
  return {
    environmentReads: new Map(),
    gitReads: new Map(),
    providerReads: 0,
    toolResolutions: new Map(),
    toolProbes: new Map(),
    cacheHits: 0,
    skippedByPrerequisite: 0,
  };
}

function sortedRecord(map: ReadonlyMap<string, number>): Readonly<Record<string, number>> {
  return Object.freeze(Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b))));
}

export function snapshotCounters(counters: MutablePreflightCounters): PreflightCountersSnapshot {
  return Object.freeze({
    environmentReads: sortedRecord(counters.environmentReads),
    gitReads: sortedRecord(counters.gitReads),
    providerReads: counters.providerReads,
    toolResolutions: sortedRecord(counters.toolResolutions),
    toolProbes: sortedRecord(counters.toolProbes),
    cacheHits: counters.cacheHits,
    skippedByPrerequisite: counters.skippedByPrerequisite,
  });
}
