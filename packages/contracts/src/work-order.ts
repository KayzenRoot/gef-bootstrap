/**
 * GBS-MOD-WO-001 (A) — versioned machine-readable Work Order contract.
 *
 * A Work Order is the only authority an executor may act on. Its prose form is written for
 * reviewers; this module is the deterministic form machines route on. Parsing is fail-closed:
 * a missing field, an unknown field, a malformed pattern or an ambiguous write boundary is a
 * diagnostic, never a silently defaulted contract.
 *
 * Ambiguity is treated as a defect rather than a precedence question. The canonical ambiguity
 * case is a path admitted by both `writeAllowed` and `writeForbidden`: there is no correct
 * executor behaviour, so the contract is rejected instead of resolved.
 *
 * Architecture A8: every externally persisted contract carries an explicit `schemaVersion`, and
 * readers must not silently discard unknown fields — here that means an unknown field fails.
 */

export const WORK_ORDER_CONTRACT_VERSION = "1.0";
export const SUPPORTED_WORK_ORDER_CONTRACT_VERSIONS = Object.freeze(["1.0"] as const);

export const workOrderRiskClasses = Object.freeze(["LOW", "STANDARD", "ELEVATED", "HIGH_ASSURANCE"] as const);
export type WorkOrderRiskClass = (typeof workOrderRiskClasses)[number];

/** Ordered least to most demanding. Used only to prove monotonicity, never to weaken a floor. */
export const workOrderRiskOrder: readonly WorkOrderRiskClass[] = workOrderRiskClasses;

export interface WorkOrderTriggeredSource {
  readonly path: string;
  readonly trigger: string;
}

export interface WorkOrderBindings {
  readonly branch: string;
  readonly issue?: number;
  readonly planningPullRequest?: number;
  readonly pullRequest?: number;
}

export interface WorkOrderContract {
  readonly schemaVersion: string;
  readonly workOrderId: string;
  readonly repository: string;
  readonly risk: WorkOrderRiskClass;
  readonly baseSha: string;
  readonly bindings: WorkOrderBindings;
  readonly mustRead: readonly string[];
  readonly readIfTriggered: readonly WorkOrderTriggeredSource[];
  readonly writeAllowed: readonly string[];
  readonly writeForbidden: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly evidenceObligations: readonly string[];
  readonly scope: readonly string[];
  readonly outOfScope: readonly string[];
  readonly dependencies: readonly string[];
  readonly stopCondition: string;
}

export interface WorkOrderDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly subject?: string;
}

export type WorkOrderParseResult =
  | { readonly ok: true; readonly value: WorkOrderContract }
  | { readonly ok: false; readonly diagnostics: readonly WorkOrderDiagnostic[] };

export const WORK_ORDER_DIAGNOSTIC_CODES = Object.freeze({
  CONTRACT_NOT_OBJECT: "WORK_ORDER_CONTRACT_NOT_OBJECT",
  SCHEMA_VERSION_UNSUPPORTED: "WORK_ORDER_SCHEMA_VERSION_UNSUPPORTED",
  FIELD_MISSING: "WORK_ORDER_FIELD_MISSING",
  FIELD_INVALID: "WORK_ORDER_FIELD_INVALID",
  FIELD_UNKNOWN: "WORK_ORDER_FIELD_UNKNOWN",
  LIST_EMPTY: "WORK_ORDER_LIST_EMPTY",
  LIST_DUPLICATE: "WORK_ORDER_LIST_DUPLICATE",
  LIST_ENTRY_INVALID: "WORK_ORDER_LIST_ENTRY_INVALID",
  PATTERN_INVALID: "WORK_ORDER_PATTERN_INVALID",
  WRITE_AUTHORITY_AMBIGUOUS: "WORK_ORDER_WRITE_AUTHORITY_AMBIGUOUS",
  TRIGGER_DUPLICATE: "WORK_ORDER_TRIGGER_DUPLICATE",
  STOP_CONDITION_INVALID: "WORK_ORDER_STOP_CONDITION_INVALID",
} as const);

export type WorkOrderDiagnosticCode =
  (typeof WORK_ORDER_DIAGNOSTIC_CODES)[keyof typeof WORK_ORDER_DIAGNOSTIC_CODES];

const REQUIRED_TOP_LEVEL_FIELDS = Object.freeze([
  "schemaVersion",
  "workOrderId",
  "repository",
  "risk",
  "baseSha",
  "bindings",
  "mustRead",
  "readIfTriggered",
  "writeAllowed",
  "writeForbidden",
  "requiredChecks",
  "evidenceObligations",
  "scope",
  "outOfScope",
  "dependencies",
  "stopCondition",
] as const);

const OPTIONAL_BINDING_FIELDS = Object.freeze(["branch", "issue", "planningPullRequest", "pullRequest"] as const);

/**
 * Canonical string ordering by UTF-16 code point.
 *
 * `localeCompare` is deliberately avoided: collation depends on locale and ICU build, so the same
 * repository state could produce two different receipt digests on two runners. Code-point order is
 * locale-independent, which is what an exact-state receipt requires.
 */
function compareCodePoint(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Characters outside the supported glob language. */
const PROHIBITED_PATTERN_CHARACTERS = Object.freeze(["\\", "\u0000", "~", "[", "]", "{", "}"]);

const SHA40 = /^[0-9a-f]{40}$/;
const WORK_ORDER_ID = /^GBS-[A-Z\d]+(?:-[A-Z\d]+)*-\d{3}$/;
const REPOSITORY = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

/**
 * Normalizes a repository-relative path or glob to its comparison form.
 *
 * Separators are unified, `./` prefixes and repeated separators are removed, and a trailing
 * separator is dropped. `..` segments are preserved here on purpose: the change-impact
 * classifier reports them as a traversal finding, and a pattern that legitimately needs
 * `..` must not be silently collapsed into something else.
 */
export function normalizeWorkOrderPath(value: string): string {
  const kept: string[] = [];
  for (const segment of value.replaceAll("\\", "/").split("/")) {
    if (segment === "" || segment === ".") continue;
    kept.push(segment);
  }
  return kept.join("/");
}

/** True when the value is a syntactically usable repository-relative path glob. */
export function isValidWorkOrderPattern(value: string): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return false;
  if (value.includes("//")) return false;
  if (value.startsWith("/")) return false;
  if (/[A-Za-z]:/.test(value)) return false;
  if (value.endsWith("/")) return false;
  for (const character of ["\\", "\0", "~", "[", "]", "{", "}"]) {
    if (value.includes(character)) return false;
  }
  const segments = value.split("/");
  if (!segments.every((segment) => segment.length > 0)) return false;
  if (segments.length === 1 && segments[0] === "**") return false;
  let previousWasGlobstar = false;
  for (const segment of segments) {
    if (segment === "**") {
      // `**/**` is redundant; rejecting it keeps one unambiguous spelling per intent.
      if (previousWasGlobstar) return false;
      previousWasGlobstar = true;
      continue;
    }
    // A bare `*` segment would silently admit every path at that depth.
    if (segment === "*") return false;
    if (segment.includes("**")) return false;
    previousWasGlobstar = false;
  }
  return true;
}

/** Deterministic ordered search-probe derivation. Never escapes into a real regex. */
function globMatcher(pattern: string): (candidate: string) => boolean {
  const segments = normalizeWorkOrderPath(pattern).split("/");

  const matches = (candidateSegments: readonly string[]): boolean => {
    const matchFrom = (patternIndex: number, candidateIndex: number): boolean => {
      if (patternIndex === segments.length) return candidateIndex === candidateSegments.length;
      const segment = segments[patternIndex] ?? "";
      if (segment === "**") {
        // A trailing `**` covers the subtree below the directory it names, never the directory
        // itself: a Git path names a file, so `dir/**` must not authorise a rename of `dir`.
        if (patternIndex === segments.length - 1) return candidateIndex < candidateSegments.length;
        for (let next = candidateIndex; next <= candidateSegments.length; next += 1) {
          if (matchFrom(patternIndex + 1, next)) return true;
        }
        return false;
      }
      if (candidateIndex >= candidateSegments.length) return false;
      if (!segmentMatches(segment, candidateSegments[candidateIndex] ?? "")) return false;
      return matchFrom(patternIndex + 1, candidateIndex + 1);
    };
    return matchFrom(0, 0);
  };

  return (candidate: string): boolean => {
    if (candidate.length === 0) return false;
    return matches(normalizeWorkOrderPath(candidate).split("/"));
  };
}

function segmentMatches(patternSegment: string, candidateSegment: string): boolean {
  if (!patternSegment.includes(singleStarLiteral) && !patternSegment.includes("?")) {
    return patternSegment === candidateSegment;
  }
  let patternIndex = 0;
  let candidateIndex = 0;
  let starIndex = -1;
  let starMatch = 0;
  while (candidateIndex < candidateSegment.length) {
    const patternCharacter = patternSegment[patternIndex];
    if (patternIndex < patternSegment.length && (patternCharacter === "?" || patternCharacter === candidateSegment[candidateIndex])) {
      patternIndex += 1;
      candidateIndex += 1;
      continue;
    }
    if (patternIndex < patternSegment.length && patternCharacter === singleStarLiteral) {
      starIndex = patternIndex;
      starMatch = candidateIndex;
      patternIndex += 1;
      continue;
    }
    if (starIndex >= 0) {
      patternIndex = starIndex + 1;
      starMatch += 1;
      candidateIndex = starMatch;
      continue;
    }
    return false;
  }
  while (patternIndex < patternSegment.length && patternSegment[patternIndex] === singleStarLiteral) {
    patternIndex += 1;
  }
  return patternIndex === patternSegment.length;
}

const singleStarLiteral = "*";
const globMatcherCache = new Map<string, (candidate: string) => boolean>();

/** True when `path` is admitted by at least one of `patterns`. */
export function matchesWorkOrderPattern(path: string, patterns: readonly string[]): boolean {
  if (typeof path !== "string" || !Array.isArray(patterns)) return false;
  for (const pattern of patterns) {
    let matcher = globMatcherCache.get(pattern);
    if (matcher === undefined) {
      matcher = globMatcher(pattern);
      globMatcherCache.set(pattern, matcher);
    }
    if (matcher(path)) return true;
  }
  return false;
}

/** True when a candidate path is well formed enough to carry write authority at all. */
export function isAuthorizableWorkOrderPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0 || path.length > 4096) return false;
  const segments = normalizeWorkOrderPath(path).split("/");
  // `..` escapes the repository and `.` names nothing; neither may be authorised.
  return !segments.includes("..") && !segments.includes(".");
}

/**
 * Resolves the effective write authority for one path.
 *
 * A path that cannot be authorized is `FORBIDDEN`, never `UNCLASSIFIED`: an executor must not be
 * able to write by presenting a malformed path that no pattern happens to match. `AMBIGUOUS` is
 * also reachable without bypassing `parseWorkOrderContract`, because overlapping *prefixes* such
 * as `packages/contracts/**` and `packages/contracts/src/**` are rejected as contract entries while
 * still resolving per-path, so it is reported rather than silently resolved.
 */
export function resolveWriteAuthority(
  path: string,
  writeAllowed: readonly string[],
  writeForbidden: readonly string[],
): "ALLOWED" | "FORBIDDEN" | "AMBIGUOUS" | "UNCLASSIFIED" {
  if (!isAuthorizableWorkOrderPath(path)) return "FORBIDDEN";
  const allowed = matchesWorkOrderPattern(path, writeAllowed);
  const forbidden = matchesWorkOrderPattern(path, writeForbidden);
  if (allowed && forbidden) return "AMBIGUOUS";
  if (forbidden) return "FORBIDDEN";
  if (allowed) return "ALLOWED";
  return "UNCLASSIFIED";
}

interface ParseState {
  readonly diagnostics: WorkOrderDiagnostic[];
}

/**
 * Renders an untrusted value for a diagnostic subject.
 *
 * A subject is operator-facing text, never canonical data. Objects and arrays are reduced to their
 * type rather than stringified implicitly, so a malformed field can never reach a report as
 * `[object Object]`.
 */
function describe(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "object") return "object";
  return typeof value;
}

function report(state: ParseState, code: string, message: string, subject?: string): void {
  const diagnostic = subject === undefined ? { code, message } : { code, message, subject };
  state.diagnostics.push(diagnostic);
}

function parseStringList(
  state: ParseState,
  raw: unknown,
  field: string,
  options: { readonly allowEmpty: boolean; readonly patternOnly: boolean },
): readonly string[] | null {
  if (!Array.isArray(raw)) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, `${field} must be an array`, field);
    return null;
  }
  if (!options.allowEmpty && raw.length === 0) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.LIST_EMPTY, `${field} must not be empty`, field);
    return null;
  }
  const seen = new Set<string>();
  let valid = true;
  for (const entry of raw) {
    if (typeof entry !== "string" || entry.trim() !== entry || entry.length === 0) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.LIST_ENTRY_INVALID, `${field} entries must be non-empty trimmed strings`, field);
      valid = false;
      continue;
    }
    if (options.patternOnly && !isValidWorkOrderPattern(entry)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.PATTERN_INVALID, `${field} entry is not a supported relative glob`, entry);
      valid = false;
      continue;
    }
    const normalized = normalizeWorkOrderPath(entry);
    if (seen.has(normalized)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.LIST_DUPLICATE, `${field} contains a duplicate entry`, entry);
      valid = false;
      continue;
    }
    seen.add(normalized);
  }
  return valid ? [...seen].sort(compareCodePoint) : null;
}

function parseBindings(state: ParseState, raw: unknown): WorkOrderBindings | null {
  if (!isRecord(raw)) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, "bindings must be an object", "bindings");
    return null;
  }
  let valid = true;
  for (const key of Object.keys(raw).sort(compareCodePoint)) {
    if (!(OPTIONAL_BINDING_FIELDS as readonly string[]).includes(key)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_UNKNOWN, `bindings.${key} is not a known binding field`, `bindings.${key}`);
      valid = false;
    }
  }
  const branch = raw["branch"];
  if (branch === undefined) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_MISSING, "bindings.branch is required", "bindings.branch");
    valid = false;
  } else if (typeof branch !== "string" || !BRANCH.test(branch) || branch.includes("..")) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, "bindings.branch must be a simple relative branch name", "bindings.branch");
    valid = false;
  }
  const bindings: Record<string, unknown> = {};
  if (typeof branch === "string") bindings["branch"] = branch;
  for (const key of ["issue", "planningPullRequest", "pullRequest"] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (!isPositiveInteger(value)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, `bindings.${key} must be a positive integer`, `bindings.${key}`);
      valid = false;
      continue;
    }
    bindings[key] = value;
  }
  return valid ? (bindings as unknown as WorkOrderBindings) : null;
}

function compareTriggeredSources(left: WorkOrderTriggeredSource, right: WorkOrderTriggeredSource): number {
  return compareCodePoint(left.path, right.path) || compareCodePoint(left.trigger, right.trigger);
}

function parseTriggeredSources(state: ParseState, raw: unknown): readonly WorkOrderTriggeredSource[] | null {
  if (!Array.isArray(raw)) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, "readIfTriggered must be an array", "readIfTriggered");
    return null;
  }
  const seen = new Set<string>();
  const out: WorkOrderTriggeredSource[] = [];
  let valid = true;
  for (const entry of raw) {
    if (!isRecord(entry)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, "readIfTriggered entries must be objects", "readIfTriggered");
      valid = false;
      continue;
    }
    for (const key of Object.keys(entry).sort(compareCodePoint)) {
      if (key !== "path" && key !== "trigger") {
        report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_UNKNOWN, `readIfTriggered.${key} is not a known field`, `readIfTriggered.${key}`);
        valid = false;
      }
    }
    const path = entry["path"];
    const trigger = entry["trigger"];
    if (typeof path !== "string" || !isValidWorkOrderPattern(path)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.PATTERN_INVALID, "readIfTriggered.path must be a supported relative glob", describe(path));
      valid = false;
      continue;
    }
    if (typeof trigger !== "string" || trigger.trim() !== trigger || trigger.length === 0) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, "readIfTriggered.trigger must be a non-empty trimmed string", describe(trigger));
      valid = false;
      continue;
    }
    const key = `${normalizeWorkOrderPath(path)} ${trigger}`;
    if (seen.has(key)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.TRIGGER_DUPLICATE, "readIfTriggered contains a duplicate path/trigger pair", path);
      valid = false;
      continue;
    }
    seen.add(key);
    out.push({ path: normalizeWorkOrderPath(path), trigger });
  }
  if (!valid) return null;
  return [...out].sort(compareTriggeredSources);
}

/**
 * Parses an untrusted document into a `WorkOrderContract`.
 *
 * Diagnostics are accumulated rather than thrown so a caller can report every authority defect
 * at once; the contract is produced only when the diagnostic list is empty.
 */
/** Checks the document envelope: object shape, contract version and known top-level fields. */
function checkEnvelope(state: ParseState, input: Record<string, unknown>): void {
  const schemaVersion = input["schemaVersion"];
  if (schemaVersion === undefined) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_MISSING, "schemaVersion is required", "schemaVersion");
  } else if (typeof schemaVersion !== "string" || !SUPPORTED_WORK_ORDER_CONTRACT_VERSIONS.includes(schemaVersion as "1.0")) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.SCHEMA_VERSION_UNSUPPORTED, "schemaVersion is not a supported contract version", describe(schemaVersion));
  }
  for (const key of Object.keys(input).sort(compareCodePoint)) {
    if (!(REQUIRED_TOP_LEVEL_FIELDS as readonly string[]).includes(key)) {
      report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_UNKNOWN, `${key} is not a known work order contract field`, key);
    }
  }
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (input[field] === undefined) report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_MISSING, `${field} is required`, field);
  }
}

const IDENTITY_FIELDS: readonly { readonly field: string; readonly pattern: RegExp; readonly message: string }[] = Object.freeze([
  { field: "workOrderId", pattern: WORK_ORDER_ID, message: "workOrderId must match GBS-...-NNN" },
  { field: "repository", pattern: REPOSITORY, message: "repository must be owner/name" },
  { field: "risk", pattern: /^(?:LOW|STANDARD|ELEVATED|HIGH_ASSURANCE)$/, message: "risk must be a known work order risk class" },
  { field: "baseSha", pattern: SHA40, message: "baseSha must be a 40 character lowercase commit id" },
]);

/** Checks the identity fields that bind a contract to one repository, one revision and one class. */
function checkIdentityFields(state: ParseState, input: Record<string, unknown>): void {
  for (const { field, pattern, message } of IDENTITY_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (typeof value === "string" && pattern.test(value)) continue;
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.FIELD_INVALID, message, describe(value));
  }
  const stopCondition = input["stopCondition"];
  const stopConditionBlank = typeof stopCondition !== "string" || stopCondition.trim() !== stopCondition || stopCondition.length === 0;
  if (stopCondition !== undefined && stopConditionBlank) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.STOP_CONDITION_INVALID, "stopCondition must be a non-empty trimmed string", describe(stopCondition));
  }
}

/**
 * Parses an untrusted document into a `WorkOrderContract`.
 *
 * Diagnostics are accumulated rather than thrown so a caller can report every authority defect at
 * once; the contract is produced only when the diagnostic list is empty.
 */
export function parseWorkOrderContract(input: unknown): WorkOrderParseResult {
  const state: ParseState = { diagnostics: [] };
  if (!isRecord(input)) {
    report(state, WORK_ORDER_DIAGNOSTIC_CODES.CONTRACT_NOT_OBJECT, "work order contract must be a plain object");
    return { ok: false, diagnostics: state.diagnostics };
  }

  checkEnvelope(state, input);
  checkIdentityFields(state, input);

  const bindings = input["bindings"] === undefined ? null : parseBindings(state, input["bindings"]);
  const mustRead = input["mustRead"] === undefined ? null : parseStringList(state, input["mustRead"], "mustRead", { allowEmpty: true, patternOnly: true });
  const readIfTriggered = input["readIfTriggered"] === undefined ? null : parseTriggeredSources(state, input["readIfTriggered"]);
  const writeAllowed = input["writeAllowed"] === undefined ? null : parseStringList(state, input["writeAllowed"], "writeAllowed", { allowEmpty: true, patternOnly: true });
  const writeForbidden = input["writeForbidden"] === undefined ? null : parseStringList(state, input["writeForbidden"], "writeForbidden", { allowEmpty: true, patternOnly: true });
  const requiredChecks = input["requiredChecks"] === undefined ? null : parseStringList(state, input["requiredChecks"], "requiredChecks", { allowEmpty: false, patternOnly: false });
  const evidenceObligations = input["evidenceObligations"] === undefined ? null : parseStringList(state, input["evidenceObligations"], "evidenceObligations", { allowEmpty: false, patternOnly: false });
  const scope = input["scope"] === undefined ? null : parseStringList(state, input["scope"], "scope", { allowEmpty: false, patternOnly: false });
  const outOfScope = input["outOfScope"] === undefined ? null : parseStringList(state, input["outOfScope"], "outOfScope", { allowEmpty: false, patternOnly: false });
  const dependencies = input["dependencies"] === undefined ? null : parseStringList(state, input["dependencies"], "dependencies", { allowEmpty: true, patternOnly: false });

  // An ambiguous write boundary has no correct executor behaviour, so it is a parse failure
  // rather than something resolved by precedence at use time.
  if (writeAllowed !== null && writeForbidden !== null) {
    for (const pattern of [...writeAllowed, ...writeForbidden]) {
      if (matchesWorkOrderPattern(pattern, writeAllowed) && matchesWorkOrderPattern(pattern, writeForbidden)) {
        report(state, WORK_ORDER_DIAGNOSTIC_CODES.WRITE_AUTHORITY_AMBIGUOUS, "a pattern is admitted by both writeAllowed and writeForbidden", pattern);
      }
    }
  }

  if (state.diagnostics.length > 0) return { ok: false, diagnostics: state.diagnostics };

  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: input["schemaVersion"] as string,
      workOrderId: input["workOrderId"] as string,
      repository: input["repository"] as string,
      risk: input["risk"] as WorkOrderRiskClass,
      baseSha: input["baseSha"] as string,
      bindings: Object.freeze({ ...bindings }) as WorkOrderBindings,
      mustRead: Object.freeze(mustRead as readonly string[]),
      readIfTriggered: Object.freeze(readIfTriggered as readonly WorkOrderTriggeredSource[]),
      writeAllowed: Object.freeze(writeAllowed as readonly string[]),
      writeForbidden: Object.freeze(writeForbidden as readonly string[]),
      requiredChecks: Object.freeze(requiredChecks as readonly string[]),
      evidenceObligations: Object.freeze(evidenceObligations as readonly string[]),
      scope: Object.freeze(scope as readonly string[]),
      outOfScope: Object.freeze(outOfScope as readonly string[]),
      dependencies: Object.freeze(dependencies as readonly string[]),
      stopCondition: input["stopCondition"] as string,
    }),
  };
}

export interface WorkOrderDigestPort {
  readonly algorithm: string;
  digest(input: string): string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort(compareCodePoint)) {
    const child = value[key];
    if (typeof child !== "function" && child !== undefined) out[key] = canonicalize(child);
  }
  return out;
}

export function stableWorkOrderStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/**
 * Exact-state identity of a parsed contract. Two contracts with the same digest authorize
 * exactly the same execution.
 */
export function workOrderContractDigest(contract: WorkOrderContract, digest: WorkOrderDigestPort): string {
  const canonicalForm = `GEF:WORK_ORDER_CONTRACT:${WORK_ORDER_CONTRACT_VERSION}\n${stableWorkOrderStringify(contract)}`;
  return `${digest.algorithm}:${digest.digest(canonicalForm)}`;
}

export function maxWorkOrderRisk(left: WorkOrderRiskClass, right: WorkOrderRiskClass): WorkOrderRiskClass {
  return workOrderRiskOrder.indexOf(left) >= workOrderRiskOrder.indexOf(right) ? left : right;
}