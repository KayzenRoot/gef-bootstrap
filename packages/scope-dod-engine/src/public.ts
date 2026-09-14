export const SCOPE_DOD_ENGINE_SCHEMA_VERSION = "1.0.0" as const;

export type WorkClassification = "NECESSARY" | "IMPORTANT" | "FUTURE" | "OUT_OF_SCOPE";
export type AdmissionPosture =
  | "AUTO_ADMIT_ELIGIBLE"
  | "HOLD_FOR_EXPLICIT_APPROVAL"
  | "DEFER_TO_FUTURE_OWNER"
  | "REJECT_CURRENT_SCOPE";
export type AuthorityKind = "CHECKPOINT" | "DECISION" | "SCOPE" | "DOD" | "ARCHITECTURE" | "REQUIREMENT" | "OTHER";

export interface AuthorityRef {
  id: string;
  kind: AuthorityKind;
  fingerprint?: string;
}

export interface ClassificationEvidence {
  requiredByCurrentScope: boolean;
  requiredByCurrentDod: boolean;
  requiredByCurrentRequirement: boolean;
  requiredByFrozenArchitecture: boolean;
  requiredByAcceptedDecision: boolean;
  valuableButNonBlocking: boolean;
  scheduledForLater: boolean;
  conflictsWithScope: boolean;
  ownershipBoundaryConflict: boolean;
  sourceRefs: readonly AuthorityRef[];
}

export interface WorkCandidate {
  schemaVersion: typeof SCOPE_DOD_ENGINE_SCHEMA_VERSION;
  candidateId: string;
  title: string;
  rationale: string;
  evidence: ClassificationEvidence;
}

export interface Diagnostic {
  code: string;
  message: string;
  ids?: readonly string[];
}

export type ClassificationResult =
  | Readonly<{
      status: "CLASSIFIED";
      candidateId: string;
      classification: WorkClassification;
      sourceRefs: readonly AuthorityRef[];
      authorityNotice: "CLASSIFICATION_ONLY";
    }>
  | Readonly<{
      status: "UNRESOLVED";
      candidateId: string;
      diagnostics: readonly Diagnostic[];
      authorityNotice: "CLASSIFICATION_ONLY";
    }>;

export type DodCriterionStatus = "SATISFIED" | "UNSATISFIED" | "BLOCKED" | "NOT_APPLICABLE";
export interface DodCriterion {
  criterionId: string;
  required: boolean;
  applicable: boolean;
  status: DodCriterionStatus;
  sourceRefs: readonly AuthorityRef[];
  evidenceRefs: readonly string[];
  nonApplicableRationale?: string;
}

export interface ScopeItem {
  itemId: string;
  classification: WorkClassification;
  authorizationRefs: readonly AuthorityRef[];
}

export interface ScopeSnapshot {
  schemaVersion: typeof SCOPE_DOD_ENGINE_SCHEMA_VERSION;
  snapshotId: string;
  sourceRefs: readonly AuthorityRef[];
  items: readonly ScopeItem[];
}

const RESERVED_IDS = new Set(["__proto__", "prototype", "constructor"]);
const CLASSIFICATIONS = new Set<WorkClassification>(["NECESSARY", "IMPORTANT", "FUTURE", "OUT_OF_SCOPE"]);
const DOD_STATUSES = new Set<DodCriterionStatus>(["SATISFIED", "UNSATISFIED", "BLOCKED", "NOT_APPLICABLE"]);
const AUTHORITY_KINDS = new Set<AuthorityKind>(["CHECKPOINT", "DECISION", "SCOPE", "DOD", "ARCHITECTURE", "REQUIREMENT", "OTHER"]);

const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value) && !RESERVED_IDS.has(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const bool = (value: unknown): value is boolean => typeof value === "boolean";
const compareText = (a: string, b: string) => a.localeCompare(b, "en");
const freezeDiagnostic = (diagnostic: Diagnostic): Diagnostic => Object.freeze({
  code: diagnostic.code,
  message: diagnostic.message,
  ...(diagnostic.ids ? { ids: Object.freeze([...diagnostic.ids]) } : {})
});
const freezeRef = (ref: AuthorityRef): AuthorityRef => Object.freeze({
  id: ref.id,
  kind: ref.kind,
  ...(ref.fingerprint ? { fingerprint: ref.fingerprint } : {})
});
const stableRefs = (refs: readonly AuthorityRef[]) => Object.freeze(
  [...refs].sort((a, b) => compareText(`${a.kind}:${a.id}:${a.fingerprint ?? ""}`, `${b.kind}:${b.id}:${b.fingerprint ?? ""}`)).map(freezeRef)
);

function validateAuthorityRefs(value: unknown, diagnostics: Diagnostic[], ownerId: string): value is readonly AuthorityRef[] {
  if (!Array.isArray(value)) {
    diagnostics.push({ code: "INVALID_SOURCE_REFS", message: "Authority references must be an array.", ids: [ownerId] });
    return false;
  }
  let ok = true;
  const seen = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      diagnostics.push({ code: "INVALID_SOURCE_REF", message: "Authority reference must be an object.", ids: [ownerId] });
      ok = false;
      continue;
    }
    const ref = raw as Record<string, unknown>;
    if (!validId(ref.id) || !AUTHORITY_KINDS.has(ref.kind as AuthorityKind)) {
      diagnostics.push({ code: "INVALID_SOURCE_REF", message: "Authority reference id/kind is invalid.", ids: [ownerId] });
      ok = false;
      continue;
    }
    const key = `${String(ref.kind)}\u0000${String(ref.id)}`;
    if (seen.has(key)) {
      diagnostics.push({ code: "DUPLICATE_SOURCE_REF", message: "Authority reference is duplicated.", ids: [ownerId, String(ref.id)] });
      ok = false;
    }
    seen.add(key);
    if (ref.fingerprint !== undefined && !nonEmpty(ref.fingerprint)) {
      diagnostics.push({ code: "INVALID_SOURCE_FINGERPRINT", message: "Fingerprint must be non-empty when present.", ids: [ownerId, String(ref.id)] });
      ok = false;
    }
  }
  return ok;
}

export function validateWorkCandidate(input: unknown): Readonly<{ ok: boolean; diagnostics: readonly Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze({ ok: false, diagnostics: Object.freeze([freezeDiagnostic({ code: "INVALID_CANDIDATE", message: "Candidate must be an object." })]) });
  }
  const candidate = input as Record<string, unknown>;
  const ownerId = validId(candidate.candidateId) ? candidate.candidateId : "UNKNOWN";
  if (candidate.schemaVersion !== SCOPE_DOD_ENGINE_SCHEMA_VERSION) diagnostics.push({ code: "UNSUPPORTED_SCHEMA_VERSION", message: "Unsupported Scope/DoD schema version." });
  if (!validId(candidate.candidateId)) diagnostics.push({ code: "INVALID_CANDIDATE_ID", message: "candidateId is invalid." });
  if (!nonEmpty(candidate.title) || !nonEmpty(candidate.rationale)) diagnostics.push({ code: "INCOMPLETE_CANDIDATE", message: "Candidate title and rationale are required.", ids: [ownerId] });
  if (!candidate.evidence || typeof candidate.evidence !== "object" || Array.isArray(candidate.evidence)) {
    diagnostics.push({ code: "INVALID_CLASSIFICATION_EVIDENCE", message: "Classification evidence must be an object.", ids: [ownerId] });
  } else {
    const evidence = candidate.evidence as Record<string, unknown>;
    const boolKeys = [
      "requiredByCurrentScope", "requiredByCurrentDod", "requiredByCurrentRequirement", "requiredByFrozenArchitecture",
      "requiredByAcceptedDecision", "valuableButNonBlocking", "scheduledForLater", "conflictsWithScope", "ownershipBoundaryConflict"
    ] as const;
    for (const key of boolKeys) if (!bool(evidence[key])) diagnostics.push({ code: "INVALID_EVIDENCE_FLAG", message: `${key} must be boolean.`, ids: [ownerId] });
    validateAuthorityRefs(evidence.sourceRefs, diagnostics, ownerId);
  }
  return Object.freeze({ ok: diagnostics.length === 0, diagnostics: Object.freeze(diagnostics.map(freezeDiagnostic)) });
}

export function classifyWorkCandidate(input: WorkCandidate): ClassificationResult {
  const validation = validateWorkCandidate(input);
  if (!validation.ok) return Object.freeze({ status: "UNRESOLVED", candidateId: validId(input?.candidateId) ? input.candidateId : "UNKNOWN", diagnostics: validation.diagnostics, authorityNotice: "CLASSIFICATION_ONLY" });
  const e = input.evidence;
  const required = e.requiredByCurrentScope || e.requiredByCurrentDod || e.requiredByCurrentRequirement || e.requiredByFrozenArchitecture || e.requiredByAcceptedDecision;
  const conflict = e.conflictsWithScope || e.ownershipBoundaryConflict;
  if (required && conflict) {
    return Object.freeze({ status: "UNRESOLVED", candidateId: input.candidateId, diagnostics: Object.freeze([freezeDiagnostic({ code: "AUTHORITY_CONFLICT", message: "Candidate is simultaneously required and forbidden by supplied canonical evidence.", ids: [input.candidateId] })]), authorityNotice: "CLASSIFICATION_ONLY" });
  }
  if (conflict) return Object.freeze({ status: "CLASSIFIED", candidateId: input.candidateId, classification: "OUT_OF_SCOPE", sourceRefs: stableRefs(e.sourceRefs), authorityNotice: "CLASSIFICATION_ONLY" });
  if (required) {
    if (e.sourceRefs.length === 0) return Object.freeze({ status: "UNRESOLVED", candidateId: input.candidateId, diagnostics: Object.freeze([freezeDiagnostic({ code: "MISSING_NECESSARY_AUTHORITY", message: "NECESSARY classification requires at least one canonical source reference.", ids: [input.candidateId] })]), authorityNotice: "CLASSIFICATION_ONLY" });
    return Object.freeze({ status: "CLASSIFIED", candidateId: input.candidateId, classification: "NECESSARY", sourceRefs: stableRefs(e.sourceRefs), authorityNotice: "CLASSIFICATION_ONLY" });
  }
  if (e.scheduledForLater) return Object.freeze({ status: "CLASSIFIED", candidateId: input.candidateId, classification: "FUTURE", sourceRefs: stableRefs(e.sourceRefs), authorityNotice: "CLASSIFICATION_ONLY" });
  if (e.valuableButNonBlocking) return Object.freeze({ status: "CLASSIFIED", candidateId: input.candidateId, classification: "IMPORTANT", sourceRefs: stableRefs(e.sourceRefs), authorityNotice: "CLASSIFICATION_ONLY" });
  return Object.freeze({ status: "UNRESOLVED", candidateId: input.candidateId, diagnostics: Object.freeze([freezeDiagnostic({ code: "INSUFFICIENT_CLASSIFICATION_EVIDENCE", message: "Evidence does not support a governed classification.", ids: [input.candidateId] })]), authorityNotice: "CLASSIFICATION_ONLY" });
}

export function admissionForClassification(classification: WorkClassification): AdmissionPosture {
  switch (classification) {
    case "NECESSARY": return "AUTO_ADMIT_ELIGIBLE";
    case "IMPORTANT": return "HOLD_FOR_EXPLICIT_APPROVAL";
    case "FUTURE": return "DEFER_TO_FUTURE_OWNER";
    case "OUT_OF_SCOPE": return "REJECT_CURRENT_SCOPE";
  }
}

export function reclassificationDelta(before: WorkClassification, after: WorkClassification) {
  return Object.freeze({
    before,
    after,
    changed: before !== after,
    admissionChanged: admissionForClassification(before) !== admissionForClassification(after),
    scopeExpansion: before !== "NECESSARY" && after === "NECESSARY",
    necessaryErosion: before === "NECESSARY" && after !== "NECESSARY",
    explicitGovernanceRequired: before !== after
  });
}

export function validateDodCriteria(input: unknown): Readonly<{ ok: boolean; diagnostics: readonly Diagnostic[] }> {
  const diagnostics: Diagnostic[] = [];
  if (!Array.isArray(input)) return Object.freeze({ ok: false, diagnostics: Object.freeze([freezeDiagnostic({ code: "INVALID_DOD_SET", message: "DoD criteria must be an array." })]) });
  const seen = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      diagnostics.push({ code: "INVALID_DOD_CRITERION", message: "DoD criterion must be an object." });
      continue;
    }
    const criterion = raw as Record<string, unknown>;
    const id = validId(criterion.criterionId) ? criterion.criterionId : "UNKNOWN";
    if (!validId(criterion.criterionId) || seen.has(id)) diagnostics.push({ code: "DUPLICATE_OR_INVALID_DOD_ID", message: "criterionId is invalid or duplicated.", ids: [id] });
    else seen.add(id);
    if (!bool(criterion.required) || !bool(criterion.applicable)) diagnostics.push({ code: "INVALID_DOD_FLAGS", message: "required/applicable must be boolean.", ids: [id] });
    if (!DOD_STATUSES.has(criterion.status as DodCriterionStatus)) diagnostics.push({ code: "INVALID_DOD_STATUS", message: "Unknown DoD criterion status.", ids: [id] });
    validateAuthorityRefs(criterion.sourceRefs, diagnostics, id);
    if (!Array.isArray(criterion.evidenceRefs) || criterion.evidenceRefs.some(item => !validId(item))) diagnostics.push({ code: "INVALID_EVIDENCE_REFS", message: "evidenceRefs must contain valid stable IDs.", ids: [id] });
    if (criterion.applicable === false) {
      if (criterion.status !== "NOT_APPLICABLE") diagnostics.push({ code: "INVALID_NON_APPLICABLE_STATUS", message: "Non-applicable criterion must use NOT_APPLICABLE.", ids: [id] });
      if (!nonEmpty(criterion.nonApplicableRationale)) diagnostics.push({ code: "MISSING_NON_APPLICABLE_RATIONALE", message: "Non-applicable criterion requires rationale.", ids: [id] });
    }
    if (criterion.applicable === true && criterion.status === "NOT_APPLICABLE") diagnostics.push({ code: "INVALID_APPLICABLE_STATUS", message: "Applicable criterion cannot be NOT_APPLICABLE.", ids: [id] });
    if (criterion.required === true && criterion.applicable === true && criterion.status === "SATISFIED" && Array.isArray(criterion.evidenceRefs) && criterion.evidenceRefs.length === 0) diagnostics.push({ code: "MISSING_REQUIRED_EVIDENCE", message: "Satisfied required criterion requires evidence binding.", ids: [id] });
  }
  return Object.freeze({ ok: diagnostics.length === 0, diagnostics: Object.freeze(diagnostics.map(freezeDiagnostic)) });
}

export function evaluateDefinitionOfDone(criteria: readonly DodCriterion[]) {
  const validation = validateDodCriteria(criteria);
  const requiredApplicable = criteria.filter(item => item.required && item.applicable);
  const blockingIds = requiredApplicable
    .filter(item => item.status !== "SATISFIED" || item.evidenceRefs.length === 0)
    .map(item => item.criterionId)
    .sort(compareText);
  const satisfiedRequired = requiredApplicable.filter(item => item.status === "SATISFIED" && item.evidenceRefs.length > 0).length;
  return Object.freeze({
    complete: validation.ok && blockingIds.length === 0,
    requiredApplicableCount: requiredApplicable.length,
    satisfiedRequiredCount: satisfiedRequired,
    blockingCriterionIds: Object.freeze(blockingIds),
    diagnostics: validation.diagnostics,
    authorityNotice: "DOD_EVALUATION_ONLY" as const
  });
}

export type CriterionDriftKind = "ADDED" | "REMOVED" | "REQUIRED_CHANGED" | "APPLICABILITY_CHANGED";
export interface CriterionDriftFinding { kind: CriterionDriftKind; criterionId: string; blocking: boolean }

export function detectDodCriterionDrift(baseline: readonly DodCriterion[], candidate: readonly DodCriterion[]) {
  const base = new Map(baseline.map(item => [item.criterionId, item]));
  const next = new Map(candidate.map(item => [item.criterionId, item]));
  const findings: CriterionDriftFinding[] = [];
  for (const id of [...new Set([...base.keys(), ...next.keys()])].sort(compareText)) {
    const before = base.get(id);
    const after = next.get(id);
    if (!before && after) findings.push({ kind: "ADDED", criterionId: id, blocking: after.required });
    else if (before && !after) findings.push({ kind: "REMOVED", criterionId: id, blocking: before.required });
    else if (before && after) {
      if (before.required !== after.required) findings.push({ kind: "REQUIRED_CHANGED", criterionId: id, blocking: before.required || after.required });
      if (before.applicable !== after.applicable) findings.push({ kind: "APPLICABILITY_CHANGED", criterionId: id, blocking: before.required || after.required });
    }
  }
  return Object.freeze({
    blocking: findings.some(item => item.blocking),
    findings: Object.freeze(findings.map(item => Object.freeze({ ...item }))),
    authorityNotice: "DRIFT_DETECTION_ONLY" as const
  });
}

export function createScopeSnapshot(snapshot: ScopeSnapshot): ScopeSnapshot {
  if (snapshot.schemaVersion !== SCOPE_DOD_ENGINE_SCHEMA_VERSION) throw new Error("UNSUPPORTED_SCOPE_SCHEMA_VERSION");
  if (!validId(snapshot.snapshotId)) throw new Error("INVALID_SCOPE_SNAPSHOT_ID");
  const diagnostics: Diagnostic[] = [];
  validateAuthorityRefs(snapshot.sourceRefs, diagnostics, snapshot.snapshotId);
  const seen = new Set<string>();
  for (const item of snapshot.items) {
    if (!validId(item.itemId) || seen.has(item.itemId)) diagnostics.push({ code: "DUPLICATE_OR_INVALID_SCOPE_ITEM", message: "Scope item ID invalid or duplicated.", ids: [item.itemId] });
    else seen.add(item.itemId);
    if (!CLASSIFICATIONS.has(item.classification)) diagnostics.push({ code: "INVALID_SCOPE_CLASSIFICATION", message: "Scope item classification invalid.", ids: [item.itemId] });
    validateAuthorityRefs(item.authorizationRefs, diagnostics, item.itemId);
  }
  if (diagnostics.length > 0) throw new Error(`INVALID_SCOPE_SNAPSHOT:${diagnostics.map(item => item.code).join(",")}`);
  return Object.freeze({
    schemaVersion: SCOPE_DOD_ENGINE_SCHEMA_VERSION,
    snapshotId: snapshot.snapshotId,
    sourceRefs: stableRefs(snapshot.sourceRefs),
    items: Object.freeze([...snapshot.items].sort((a, b) => compareText(a.itemId, b.itemId)).map(item => Object.freeze({
      itemId: item.itemId,
      classification: item.classification,
      authorizationRefs: stableRefs(item.authorizationRefs)
    })))
  });
}

export const scopeSnapshotSealInput = (snapshot: ScopeSnapshot) => JSON.stringify(createScopeSnapshot(snapshot));

export type ScopeDriftCode =
  | "AUTHORIZED_ADDITION"
  | "UNAUTHORIZED_EXPANSION"
  | "REQUIRED_SCOPE_REMOVAL"
  | "REQUIRED_DOWNCLASSIFICATION"
  | "UNAUTHORIZED_UPCLASSIFICATION"
  | "OUT_OF_SCOPE_PRESENCE"
  | "AUTHORIZED_RECLASSIFICATION";
export interface ScopeDriftFinding {
  code: ScopeDriftCode;
  itemId: string;
  severity: "BLOCKING" | "ADVISORY";
  before?: WorkClassification;
  after?: WorkClassification;
  authorizationRefs: readonly AuthorityRef[];
}

const frozenDrift = (finding: ScopeDriftFinding): ScopeDriftFinding => Object.freeze({
  code: finding.code,
  itemId: finding.itemId,
  severity: finding.severity,
  ...(finding.before ? { before: finding.before } : {}),
  ...(finding.after ? { after: finding.after } : {}),
  authorizationRefs: stableRefs(finding.authorizationRefs)
});

export function detectScopeDrift(baselineInput: ScopeSnapshot, candidateInput: ScopeSnapshot) {
  const baseline = createScopeSnapshot(baselineInput);
  const candidate = createScopeSnapshot(candidateInput);
  const base = new Map(baseline.items.map(item => [item.itemId, item]));
  const next = new Map(candidate.items.map(item => [item.itemId, item]));
  const findings: ScopeDriftFinding[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const reclassified: string[] = [];
  for (const id of [...new Set([...base.keys(), ...next.keys()])].sort(compareText)) {
    const before = base.get(id);
    const after = next.get(id);
    if (!before && after) {
      added.push(id);
      if (after.classification === "OUT_OF_SCOPE") findings.push({ code: "OUT_OF_SCOPE_PRESENCE", itemId: id, severity: "BLOCKING", after: after.classification, authorizationRefs: after.authorizationRefs });
      else if (after.authorizationRefs.length > 0) findings.push({ code: "AUTHORIZED_ADDITION", itemId: id, severity: "ADVISORY", after: after.classification, authorizationRefs: after.authorizationRefs });
      else findings.push({ code: "UNAUTHORIZED_EXPANSION", itemId: id, severity: "BLOCKING", after: after.classification, authorizationRefs: [] });
      continue;
    }
    if (before && !after) {
      removed.push(id);
      if (before.classification === "NECESSARY") findings.push({ code: "REQUIRED_SCOPE_REMOVAL", itemId: id, severity: "BLOCKING", before: before.classification, authorizationRefs: [] });
      continue;
    }
    if (!before || !after) continue;
    if (before.classification !== after.classification) {
      reclassified.push(id);
      if (after.classification === "OUT_OF_SCOPE") findings.push({ code: "OUT_OF_SCOPE_PRESENCE", itemId: id, severity: "BLOCKING", before: before.classification, after: after.classification, authorizationRefs: after.authorizationRefs });
      else if (before.classification === "NECESSARY" && after.classification !== "NECESSARY") findings.push({ code: "REQUIRED_DOWNCLASSIFICATION", itemId: id, severity: "BLOCKING", before: before.classification, after: after.classification, authorizationRefs: after.authorizationRefs });
      else if (before.classification !== "NECESSARY" && after.classification === "NECESSARY" && after.authorizationRefs.length === 0) findings.push({ code: "UNAUTHORIZED_UPCLASSIFICATION", itemId: id, severity: "BLOCKING", before: before.classification, after: after.classification, authorizationRefs: [] });
      else if (after.authorizationRefs.length > 0) findings.push({ code: "AUTHORIZED_RECLASSIFICATION", itemId: id, severity: "ADVISORY", before: before.classification, after: after.classification, authorizationRefs: after.authorizationRefs });
      else findings.push({ code: "UNAUTHORIZED_EXPANSION", itemId: id, severity: "BLOCKING", before: before.classification, after: after.classification, authorizationRefs: [] });
    } else if (after.classification === "OUT_OF_SCOPE") {
      findings.push({ code: "OUT_OF_SCOPE_PRESENCE", itemId: id, severity: "BLOCKING", before: before.classification, after: after.classification, authorizationRefs: after.authorizationRefs });
    }
  }
  const ordered = findings.sort((a, b) => compareText(`${a.itemId}:${a.code}`, `${b.itemId}:${b.code}`)).map(frozenDrift);
  return Object.freeze({
    baselineId: baseline.snapshotId,
    candidateId: candidate.snapshotId,
    blocking: ordered.some(item => item.severity === "BLOCKING"),
    addedItemIds: Object.freeze(added),
    removedItemIds: Object.freeze(removed),
    reclassifiedItemIds: Object.freeze(reclassified),
    findings: Object.freeze(ordered),
    authorityNotice: "DETECTION_ONLY" as const
  });
}
