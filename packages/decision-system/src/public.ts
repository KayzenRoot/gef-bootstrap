export const DECISION_SYSTEM_SCHEMA_VERSION = "1.0.0" as const;

export type DecisionStatus = "PROPOSED" | "FROZEN" | "SUPERSEDED" | "REJECTED" | "STALE";
export type AdrStatus = "PROPOSED" | "ACCEPTED" | "SUPERSEDED" | "REJECTED" | "STALE";

export interface SourceRef { id: string; fingerprint?: string }
export interface DecisionRecord {
  decisionId: string;
  domain: string;
  subjectKey: string;
  statement: string;
  rationale: string;
  owner: string;
  status: DecisionStatus;
  sourceRefs: readonly SourceRef[];
  adrIds: readonly string[];
  supersedesDecisionIds: readonly string[];
  consequences?: readonly string[];
}
export interface AdrRecord {
  adrId: string;
  title: string;
  status: AdrStatus;
  context: string;
  decision: string;
  consequences: readonly string[];
  decisionIds: readonly string[];
  sourceRefs: readonly SourceRef[];
  supersedesAdrIds: readonly string[];
  supersededByAdrIds: readonly string[];
}
export interface DecisionLedger {
  schemaVersion: typeof DECISION_SYSTEM_SCHEMA_VERSION;
  ledgerId: string;
  decisions: readonly DecisionRecord[];
  adrs: readonly AdrRecord[];
  lineageCoverage: "COMPLETE" | "INCOMPLETE";
}
export interface DecisionDiagnostic { code: string; message: string; ids?: readonly string[] }
export interface DecisionValidation { ok: boolean; diagnostics: readonly DecisionDiagnostic[] }
export interface TraversalOptions { maxNodes?: number; isCancelled?: () => boolean }

const DECISION_STATUSES = new Set<DecisionStatus>(["PROPOSED", "FROZEN", "SUPERSEDED", "REJECTED", "STALE"]);
const ADR_STATUSES = new Set<AdrStatus>(["PROPOSED", "ACCEPTED", "SUPERSEDED", "REJECTED", "STALE"]);
const RESERVED_IDS = new Set(["__proto__", "prototype", "constructor"]);
const SUBJECT_SEPARATOR = "\u0000";

const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value) && !RESERVED_IDS.has(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const stable = <T>(items: readonly T[], key: (item: T) => string) =>
  [...items].sort((a, b) => key(a).localeCompare(key(b), "en"));
const copyRef = (ref: SourceRef): SourceRef =>
  Object.freeze({ id: ref.id, ...(ref.fingerprint ? { fingerprint: ref.fingerprint } : {}) });
const subject = (decision: DecisionRecord) => `${decision.domain}${SUBJECT_SEPARATOR}${decision.subjectKey}`;
const splitSubject = (value: string): readonly [string, string] | null => {
  const index = value.indexOf(SUBJECT_SEPARATOR);
  if (index <= 0 || index === value.length - 1) return null;
  return [value.slice(0, index), value.slice(index + 1)] as const;
};

export function validateDecisionLedger(input: unknown): DecisionValidation {
  const diagnostics: DecisionDiagnostic[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, diagnostics: Object.freeze([{ code: "INVALID_LEDGER", message: "Ledger must be an object." }]) };
  }
  const ledger = input as Record<string, unknown>;
  if (ledger.schemaVersion !== DECISION_SYSTEM_SCHEMA_VERSION) diagnostics.push({ code: "UNSUPPORTED_SCHEMA_VERSION", message: "Unsupported decision-system schema version." });
  if (!validId(ledger.ledgerId)) diagnostics.push({ code: "INVALID_LEDGER_ID", message: "ledgerId is invalid." });
  if (!Array.isArray(ledger.decisions) || !Array.isArray(ledger.adrs)) {
    diagnostics.push({ code: "INVALID_COLLECTION", message: "decisions and adrs must be arrays." });
    return { ok: false, diagnostics: Object.freeze(diagnostics) };
  }

  const decisionIds = new Set<string>();
  const adrIds = new Set<string>();
  for (const raw of ledger.decisions) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      diagnostics.push({ code: "INVALID_DECISION", message: "Decision must be an object." });
      continue;
    }
    const decision = raw as Record<string, unknown>;
    if (!validId(decision.decisionId) || decisionIds.has(decision.decisionId)) diagnostics.push({ code: "DUPLICATE_OR_INVALID_DECISION_ID", message: "Decision ID invalid or duplicated." });
    else decisionIds.add(decision.decisionId);
    if (!nonEmpty(decision.domain) || !nonEmpty(decision.subjectKey)) diagnostics.push({ code: "INVALID_DECISION_SUBJECT", message: "Decision domain and subjectKey are required." });
    if (!nonEmpty(decision.statement) || !nonEmpty(decision.rationale) || !nonEmpty(decision.owner)) diagnostics.push({ code: "INCOMPLETE_DECISION", message: "Decision statement, rationale and owner are required." });
    if (!DECISION_STATUSES.has(decision.status as DecisionStatus)) diagnostics.push({ code: "INVALID_DECISION_STATUS", message: "Unknown decision status." });
    for (const key of ["sourceRefs", "adrIds", "supersedesDecisionIds"] as const) if (!Array.isArray(decision[key])) diagnostics.push({ code: "INVALID_DECISION_COLLECTION", message: `${key} must be an array.` });
  }

  for (const raw of ledger.adrs) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      diagnostics.push({ code: "INVALID_ADR", message: "ADR must be an object." });
      continue;
    }
    const adr = raw as Record<string, unknown>;
    if (!validId(adr.adrId) || adrIds.has(adr.adrId)) diagnostics.push({ code: "DUPLICATE_OR_INVALID_ADR_ID", message: "ADR ID invalid or duplicated." });
    else adrIds.add(adr.adrId);
    if (!nonEmpty(adr.title) || !nonEmpty(adr.context) || !nonEmpty(adr.decision)) diagnostics.push({ code: "INCOMPLETE_ADR", message: "ADR title, context and decision are required." });
    if (!ADR_STATUSES.has(adr.status as AdrStatus)) diagnostics.push({ code: "INVALID_ADR_STATUS", message: "Unknown ADR status." });
    for (const key of ["consequences", "decisionIds", "sourceRefs", "supersedesAdrIds", "supersededByAdrIds"] as const) if (!Array.isArray(adr[key])) diagnostics.push({ code: "INVALID_ADR_COLLECTION", message: `${key} must be an array.` });
  }

  const decisions = ledger.decisions as DecisionRecord[];
  const adrs = ledger.adrs as AdrRecord[];
  for (const decision of decisions) {
    if (!Array.isArray(decision.supersedesDecisionIds) || !Array.isArray(decision.adrIds)) continue;
    for (const targetId of decision.supersedesDecisionIds) {
      const target = decisions.find(item => item.decisionId === targetId);
      if (!target) diagnostics.push({ code: "MISSING_SUPERSESSION_TARGET", message: "Decision supersession target missing.", ids: [decision.decisionId, targetId] });
      else if (subject(target) !== subject(decision)) diagnostics.push({ code: "SUBJECT_MISMATCH_SUPERSESSION", message: "Decision supersession crosses subject without a governed migration bridge.", ids: [decision.decisionId, targetId] });
    }
    for (const adrId of decision.adrIds) {
      const adr = adrs.find(item => item.adrId === adrId);
      if (!adr) diagnostics.push({ code: "MISSING_ADR", message: "Decision ADR link target missing.", ids: [decision.decisionId, adrId] });
      else if (!adr.decisionIds.includes(decision.decisionId)) diagnostics.push({ code: "ADR_LINK_MISMATCH", message: "Decision↔ADR link is not bidirectional.", ids: [decision.decisionId, adrId] });
    }
  }
  for (const adr of adrs) {
    if (!Array.isArray(adr.decisionIds) || !Array.isArray(adr.supersedesAdrIds) || !Array.isArray(adr.supersededByAdrIds)) continue;
    for (const decisionId of adr.decisionIds) {
      const decision = decisions.find(item => item.decisionId === decisionId);
      if (!decision) diagnostics.push({ code: "MISSING_ADR_DECISION", message: "ADR references missing decision.", ids: [adr.adrId, decisionId] });
      else if (!decision.adrIds.includes(adr.adrId)) diagnostics.push({ code: "ADR_LINK_MISMATCH", message: "ADR↔decision link is not bidirectional.", ids: [adr.adrId, decisionId] });
    }
    for (const oldAdrId of adr.supersedesAdrIds) {
      const oldAdr = adrs.find(item => item.adrId === oldAdrId);
      if (!oldAdr) diagnostics.push({ code: "MISSING_ADR_SUPERSESSION_TARGET", message: "ADR supersession target missing.", ids: [adr.adrId, oldAdrId] });
      else if (!oldAdr.supersededByAdrIds.includes(adr.adrId)) diagnostics.push({ code: "ADR_SUPERSESSION_ASYMMETRY", message: "ADR supersession relation must be bidirectional.", ids: [adr.adrId, oldAdrId] });
    }
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics.map(item => Object.freeze({ ...item, ...(item.ids ? { ids: Object.freeze([...item.ids]) } : {}) })))
  };
}

export function assertValidDecisionLedger(input: unknown): DecisionLedger {
  const result = validateDecisionLedger(input);
  if (!result.ok) throw new Error(`INVALID_DECISION_LEDGER:${result.diagnostics.map(item => item.code).join(",")}`);
  const ledger = input as DecisionLedger;
  return Object.freeze({
    ...ledger,
    decisions: Object.freeze(ledger.decisions.map(decision => Object.freeze({
      ...decision,
      sourceRefs: Object.freeze(decision.sourceRefs.map(copyRef)),
      adrIds: Object.freeze([...decision.adrIds]),
      supersedesDecisionIds: Object.freeze([...decision.supersedesDecisionIds]),
      consequences: Object.freeze([...(decision.consequences ?? [])])
    }))),
    adrs: Object.freeze(ledger.adrs.map(adr => Object.freeze({
      ...adr,
      consequences: Object.freeze([...adr.consequences]),
      decisionIds: Object.freeze([...adr.decisionIds]),
      sourceRefs: Object.freeze(adr.sourceRefs.map(copyRef)),
      supersedesAdrIds: Object.freeze([...adr.supersedesAdrIds]),
      supersededByAdrIds: Object.freeze([...adr.supersededByAdrIds])
    })))
  });
}

export function decisionLedgerIndex(ledger: DecisionLedger) {
  const groups = new Map<string, string[]>();
  for (const decision of ledger.decisions) {
    const key = subject(decision);
    const ids = groups.get(key) ?? [];
    ids.push(decision.decisionId);
    groups.set(key, ids);
  }
  return Object.freeze([...groups]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([subjectKey, ids]) => Object.freeze({ subject: subjectKey, decisionIds: Object.freeze(ids.sort()) })));
}

export function decisionCapsule(ledger: DecisionLedger, decisionId: string) {
  const decision = ledger.decisions.find(item => item.decisionId === decisionId);
  if (!decision) throw new Error("DECISION_NOT_FOUND");
  return Object.freeze({
    decisionId: decision.decisionId,
    domain: decision.domain,
    subjectKey: decision.subjectKey,
    status: decision.status,
    statement: decision.statement,
    rationale: decision.rationale,
    owner: decision.owner,
    sourceRefs: Object.freeze(stable(decision.sourceRefs, ref => `${ref.id}:${ref.fingerprint ?? ""}`).map(copyRef)),
    adrIds: Object.freeze([...decision.adrIds].sort()),
    supersedesDecisionIds: Object.freeze([...decision.supersedesDecisionIds].sort())
  });
}
export const decisionIdentitySealInput = (ledger: DecisionLedger, decisionId: string) => JSON.stringify(decisionCapsule(ledger, decisionId));

export function adrIntegrityEnvelope(ledger: DecisionLedger, adrId: string) {
  const adr = ledger.adrs.find(item => item.adrId === adrId);
  if (!adr) throw new Error("ADR_NOT_FOUND");
  return Object.freeze({
    adrId: adr.adrId,
    status: adr.status,
    title: adr.title,
    context: adr.context,
    decision: adr.decision,
    consequences: Object.freeze([...adr.consequences]),
    decisionIds: Object.freeze([...adr.decisionIds].sort()),
    sourceRefs: Object.freeze(stable(adr.sourceRefs, ref => `${ref.id}:${ref.fingerprint ?? ""}`).map(copyRef)),
    supersedesAdrIds: Object.freeze([...adr.supersedesAdrIds].sort()),
    supersededByAdrIds: Object.freeze([...adr.supersededByAdrIds].sort())
  });
}

export function adrDeltaLens(before: AdrRecord, after: AdrRecord) {
  return Object.freeze({
    decisionChanged: before.decision !== after.decision,
    contextChanged: before.context !== after.context,
    consequencesChanged: JSON.stringify([...before.consequences].sort()) !== JSON.stringify([...after.consequences].sort()),
    representedDecisionsChanged: JSON.stringify([...before.decisionIds].sort()) !== JSON.stringify([...after.decisionIds].sort()),
    supersessionChanged: JSON.stringify([...before.supersedesAdrIds].sort()) !== JSON.stringify([...after.supersedesAdrIds].sort()),
    sourceBindingsChanged: JSON.stringify(stable(before.sourceRefs, ref => `${ref.id}:${ref.fingerprint ?? ""}`)) !== JSON.stringify(stable(after.sourceRefs, ref => `${ref.id}:${ref.fingerprint ?? ""}`))
  });
}

function lineageAdjacency(ledger: DecisionLedger) {
  const adjacency = new Map<string, string[]>();
  for (const decision of ledger.decisions) adjacency.set(decision.decisionId, []);
  for (const decision of ledger.decisions) {
    for (const oldId of decision.supersedesDecisionIds) adjacency.get(decision.decisionId)?.push(oldId);
  }
  for (const targets of adjacency.values()) targets.sort();
  return adjacency;
}

export function validateDecisionLineage(ledger: DecisionLedger, options: TraversalOptions = {}) {
  const maxNodes = options.maxNodes ?? 10_000;
  if (ledger.decisions.length > maxNodes) return { ok: false as const, code: "BUDGET_EXCEEDED", cycle: Object.freeze([] as string[]) };
  const adjacency = lineageAdjacency(ledger);
  const states = new Map<string, number>();
  const stack: string[] = [];
  let failure: { code: "CANCELLED" | "LINEAGE_CYCLE"; cycle: string[] } | null = null;

  const visit = (id: string): boolean => {
    if (options.isCancelled?.()) {
      failure = { code: "CANCELLED", cycle: [] };
      return false;
    }
    const state = states.get(id) ?? 0;
    if (state === 1) {
      const start = stack.indexOf(id);
      failure = { code: "LINEAGE_CYCLE", cycle: [...stack.slice(start), id] };
      return false;
    }
    if (state === 2) return true;
    states.set(id, 1);
    stack.push(id);
    for (const next of adjacency.get(id) ?? []) if (!visit(next)) return false;
    stack.pop();
    states.set(id, 2);
    return true;
  };

  for (const id of [...adjacency.keys()].sort()) {
    if (!visit(id)) {
      const resolvedFailure = failure ?? { code: "LINEAGE_CYCLE" as const, cycle: [] as string[] };
      return { ok: false as const, code: resolvedFailure.code, cycle: Object.freeze([...resolvedFailure.cycle]) };
    }
  }
  return { ok: true as const, code: "OK", cycle: Object.freeze([] as string[]) };
}

export function supersessionClosure(ledger: DecisionLedger, decisionId: string, options: TraversalOptions = {}) {
  if (ledger.lineageCoverage === "INCOMPLETE") return Object.freeze({ status: "UNKNOWN_COVERAGE" as const, decisionIds: Object.freeze([] as string[]) });
  const maxNodes = options.maxNodes ?? 10_000;
  const adjacency = lineageAdjacency(ledger);
  const seen = new Set<string>();
  const queue = [decisionId];
  while (queue.length) {
    if (options.isCancelled?.()) return Object.freeze({ status: "CANCELLED" as const, decisionIds: Object.freeze([...seen].sort()) });
    if (seen.size >= maxNodes) return Object.freeze({ status: "BUDGET_EXCEEDED" as const, decisionIds: Object.freeze([...seen].sort()) });
    const current = queue.shift()!;
    for (const next of adjacency.get(current) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return Object.freeze({ status: "EXACT" as const, decisionIds: Object.freeze([...seen].sort()) });
}

function supersededIds(ledger: DecisionLedger, subjectKey: string) {
  const ids = new Set<string>();
  for (const decision of ledger.decisions.filter(item => subject(item) === subjectKey)) {
    for (const oldId of decision.supersedesDecisionIds) ids.add(oldId);
  }
  return ids;
}

export function effectiveDecision(ledger: DecisionLedger, domain: string, subjectKey: string) {
  if (ledger.lineageCoverage === "INCOMPLETE") return Object.freeze({ status: "UNKNOWN" as const, decisionIds: Object.freeze([] as string[]) });
  const key = `${domain}${SUBJECT_SEPARATOR}${subjectKey}`;
  const lineage = validateDecisionLineage(ledger);
  if (!lineage.ok) return Object.freeze({ status: "CONFLICT" as const, decisionIds: Object.freeze([...lineage.cycle]) });
  const shadowed = supersededIds(ledger, key);
  const candidates = ledger.decisions
    .filter(decision => subject(decision) === key && decision.status === "FROZEN" && !shadowed.has(decision.decisionId))
    .map(decision => decision.decisionId)
    .sort();
  if (candidates.length === 1) return Object.freeze({ status: "RESOLVED" as const, decisionId: candidates[0]! });
  if (candidates.length > 1) return Object.freeze({ status: "CONFLICT" as const, decisionIds: Object.freeze(candidates) });
  const stale = ledger.decisions
    .filter(decision => subject(decision) === key && decision.status === "STALE" && !shadowed.has(decision.decisionId))
    .map(decision => decision.decisionId)
    .sort();
  if (stale.length) return Object.freeze({ status: "STALE" as const, decisionIds: Object.freeze(stale) });
  return Object.freeze({ status: "NONE" as const, decisionIds: Object.freeze([] as string[]) });
}

export function decisionConflicts(ledger: DecisionLedger) {
  const conflicts: { subject: string; code: string; decisionIds: readonly string[] }[] = [];
  for (const row of decisionLedgerIndex(ledger)) {
    const parsed = splitSubject(row.subject);
    if (!parsed) {
      conflicts.push({ subject: row.subject, code: "INVALID_SUBJECT_ENCODING", decisionIds: Object.freeze([...row.decisionIds]) });
      continue;
    }
    const [domain, subjectKey] = parsed;
    const result = effectiveDecision(ledger, domain, subjectKey);
    if (result.status === "CONFLICT") {
      conflicts.push({ subject: row.subject, code: "PARALLEL_OR_INVALID_FROZEN_LINEAGE", decisionIds: Object.freeze([...result.decisionIds].sort()) });
    }
  }
  return Object.freeze(conflicts.sort((a, b) => a.subject.localeCompare(b.subject, "en")).map(item => Object.freeze(item)));
}

export function decisionShadowSet(ledger: DecisionLedger, domain: string, subjectKey: string) {
  return Object.freeze([...supersededIds(ledger, `${domain}${SUBJECT_SEPARATOR}${subjectKey}`)].sort());
}

export function conflictIsolation(ledger: DecisionLedger, domain: string, subjectKey: string) {
  if (ledger.lineageCoverage === "INCOMPLETE") return Object.freeze({ status: "CONSERVATIVE_WIDENING_REQUIRED" as const, usable: false });
  const result = effectiveDecision(ledger, domain, subjectKey);
  return Object.freeze({ status: result.status, usable: result.status === "RESOLVED" });
}

export function decisionFreezeCandidate(ledger: DecisionLedger, decisionId: string) {
  const decision = ledger.decisions.find(item => item.decisionId === decisionId);
  if (!decision) return { ready: false, diagnostics: Object.freeze(["DECISION_NOT_FOUND"]) };
  const diagnostics: string[] = [];
  if (!decision.statement || !decision.rationale || !decision.owner) diagnostics.push("INCOMPLETE_DECISION");
  if (["STALE", "REJECTED", "SUPERSEDED"].includes(decision.status)) diagnostics.push("NON_FREEZABLE_STATUS");
  for (const adrId of decision.adrIds) {
    const adr = ledger.adrs.find(item => item.adrId === adrId);
    if (!adr || !adr.decisionIds.includes(decisionId)) diagnostics.push("ADR_LINK_MISMATCH");
  }
  const lineage = validateDecisionLineage(ledger);
  if (!lineage.ok) diagnostics.push(lineage.code);
  const effective = effectiveDecision(ledger, decision.domain, decision.subjectKey);
  if (effective.status === "CONFLICT" || effective.status === "UNKNOWN") diagnostics.push(`SUBJECT_${effective.status}`);
  return { ready: diagnostics.length === 0, diagnostics: Object.freeze([...new Set(diagnostics)].sort()) };
}

export function decisionStalenessVector(ledger: DecisionLedger, changedSourceId: string) {
  const affectedDecisionIds = ledger.decisions
    .filter(decision => decision.sourceRefs.some(ref => ref.id === changedSourceId))
    .map(decision => decision.decisionId)
    .sort();
  return Object.freeze({
    changedSourceId,
    affectedDecisionIds: Object.freeze(affectedDecisionIds),
    status: ledger.lineageCoverage === "COMPLETE" ? "EXACT" as const : "CONSERVATIVE_WIDENING_REQUIRED" as const
  });
}

export function frozenSnapshotGuard(before: DecisionRecord, after: DecisionRecord) {
  if (before.status !== "FROZEN" || before.decisionId !== after.decisionId) return { valid: true, code: "NOT_SAME_FROZEN_SNAPSHOT" as const };
  const semantic = (decision: DecisionRecord) => JSON.stringify({
    decisionId: decision.decisionId,
    domain: decision.domain,
    subjectKey: decision.subjectKey,
    statement: decision.statement,
    rationale: decision.rationale,
    owner: decision.owner,
    sourceRefs: stable(decision.sourceRefs, ref => `${ref.id}:${ref.fingerprint ?? ""}`),
    adrIds: [...decision.adrIds].sort(),
    supersedesDecisionIds: [...decision.supersedesDecisionIds].sort(),
    consequences: [...(decision.consequences ?? [])].sort()
  });
  return semantic(before) === semantic(after)
    ? { valid: true, code: "UNCHANGED" as const }
    : { valid: false, code: "FROZEN_SEMANTIC_MUTATION" as const };
}

export function frozenDecisionReceiptSeed(ledger: DecisionLedger, decisionId: string) {
  const candidate = decisionFreezeCandidate(ledger, decisionId);
  const decision = ledger.decisions.find(item => item.decisionId === decisionId);
  if (!decision) throw new Error("DECISION_NOT_FOUND");
  return Object.freeze({
    schemaVersion: ledger.schemaVersion,
    ledgerId: ledger.ledgerId,
    decision: decisionCapsule(ledger, decisionId),
    lineage: supersessionClosure(ledger, decisionId),
    effective: effectiveDecision(ledger, decision.domain, decision.subjectKey),
    freezeReadiness: candidate.ready ? "READY_CANDIDATE" : "NOT_READY",
    diagnostics: candidate.diagnostics,
    authorityNotice: "DECISION_ELIGIBILITY_ONLY" as const
  });
}
