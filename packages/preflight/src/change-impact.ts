/**
 * GBS-MOD-WO-001 (B) — deterministic change-impact and risk classification.
 *
 * Classification is a pure function of the changed-path set plus declared repository facts. It
 * never reads Git, the filesystem, a provider or a model. Two executors holding the same input
 * must reach the same tier, the same obligations and the same digest, which is what makes the
 * `GEF Gate` receipt reproducible rather than advisory.
 *
 * Fail-closed direction only: UNKNOWN, suspicious path conditions, conflicts and unclassified
 * writes raise the floor. There is no input, and no wording of an input, that lowers a floor
 * below what the changed paths prove.
 */

import type { RequirementDigestPort } from "./types.js";
import { stablePreflightStringify } from "./canonical.js";

/** Bumped whenever the classification tables below change meaning. Part of every receipt. */
export const CHANGE_IMPACT_POLICY_VERSION = "1.0";

export const changeImpactTiers = Object.freeze(["LOW", "STANDARD", "ELEVATED", "HIGH_ASSURANCE"] as const);
export type ChangeImpactTier = (typeof changeImpactTiers)[number];

/** Ordered least to most demanding; `maxTier` never returns a weaker tier than either input. */
export const changeImpactTierOrder: readonly ChangeImpactTier[] = changeImpactTiers;

export function maxChangeImpactTier(left: ChangeImpactTier, right: ChangeImpactTier): ChangeImpactTier {
  return changeImpactTierOrder.indexOf(left) >= changeImpactTierOrder.indexOf(right) ? left : right;
}

export const changePathKinds = Object.freeze([
  "EXECUTOR_CONTRACT",
  "CI_ROUTING",
  "DEPENDENCY_MANIFEST",
  "BUILD_CONFIG",
  "CANONICAL_CHECKPOINT",
  "MACHINE_SCHEMA",
  "DECISION_RECORD",
  "WORK_ORDER",
  "CONTEXT_LOCK",
  "CHECKPOINT_DELTA",
  "EVIDENCE",
  "GOVERNANCE_DOC",
  "NORMATIVE_AUTHORITY_DOC",
  "PLANNING_DOC",
  "OPERATOR_DOC",
  "PRODUCT_CODE",
  "TEST_PROOF",
  "TEST_FIXTURE",
  "UNKNOWN",
  "UNKNOWN_SUSPICIOUS",
] as const);
export type ChangePathKind = (typeof changePathKinds)[number];

/** Source-Hierarchy authority domains a changed path can touch. */
export const changeDomains = Object.freeze([
  "REPOSITORY_STATE",
  "PROJECT_STATE",
  "DECISION",
  "SCOPE",
  "REQUIREMENT",
  "ARCHITECTURE",
  "SECURITY",
  "COMPLETION",
  "EXECUTION",
  "VALIDATION",
  "PLANNING",
  "FUTURE_WORK",
  "GOVERNANCE",
  "UNKNOWN",
] as const);
export type ChangeDomain = (typeof changeDomains)[number];

export const CHANGE_IMPACT_DIAGNOSTIC_CODES = Object.freeze({
  CHANGED_PATH_ABSOLUTE: "CHANGE_PATH_ABSOLUTE",
  CHANGED_PATH_TRAVERSAL: "CHANGE_PATH_TRAVERSAL",
  CHANGED_PATH_CONTROL_CHARACTER: "CHANGE_PATH_CONTROL_CHARACTER",
  CHANGED_PATH_BACKSLASH: "CHANGE_PATH_BACKSLASH",
  CHANGED_PATH_CASE_VARIANT: "CHANGE_PATH_CASE_VARIANT",
  CHANGED_PATH_ENCODED_SEPARATOR: "CHANGE_PATH_ENCODED_SEPARATOR",
  CHANGED_PATH_EMPTY: "CHANGE_PATH_EMPTY",
  CHANGED_PATH_NOT_STRING: "CHANGE_PATH_NOT_STRING",
  CHANGED_PATH_DUPLICATE: "CHANGE_PATH_DUPLICATE",
} as const);
export type ChangeImpactDiagnosticCode =
  (typeof CHANGE_IMPACT_DIAGNOSTIC_CODES)[keyof typeof CHANGE_IMPACT_DIAGNOSTIC_CODES];

export const changeObligations = Object.freeze([
  "GIT_DIFF_INTEGRITY",
  "JSON_SCHEMA_PARSE",
  "SOURCE_HIERARCHY_BINDING",
  "CHECKPOINT_PARITY",
  "PIPELINE_INTEGRITY",
  "SECRET_CONFIG_SECURITY",
  "DEPENDENCY_SUPPLY_CHAIN",
  "STATIC_ANALYSIS",
  "CROSS_PLATFORM_REGRESSION",
  "RELEASE_ASSURANCE",
  "SPECIALIST_REVIEW",
] as const);
export type ChangeObligation = (typeof changeObligations)[number];

/**
 * Every governance-only change still owes this base set.
 *
 * This is the Work Order's explicit floor for the governance fast path: a narrower gate is
 * permitted only because these validations survive it, not because the change looked harmless.
 */
const ALWAYS_REQUIRED_OBLIGATIONS: readonly ChangeObligation[] = Object.freeze([
  "GIT_DIFF_INTEGRITY",
  "JSON_SCHEMA_PARSE",
  "SOURCE_HIERARCHY_BINDING",
  "SECRET_CONFIG_SECURITY",
]);

interface KindRule {
  readonly kind: ChangePathKind;
  readonly domain: ChangeDomain;
  /** Minimum tier this kind can never drop below, whatever the caller declares. */
  readonly tierFloor: ChangeImpactTier;
  /** Obligations this kind always adds on top of the base set. */
  readonly obligations: readonly ChangeObligation[];
  /** True when the kind may participate in the governance-only fast path. */
  readonly governanceEligible: boolean;
}

/**
 * Canonical authority documents and the Source-Hierarchy domain each one controls.
 *
 * A document named here is normative, not descriptive: changing it changes what the project
 * requires, so it never earns a LOW tier and never joins the governance-only fast path. Scope and
 * Requirements are reached here rather than through a filename guess, which keeps the `SCOPE` and
 * `REQUIREMENT` authority domains reachable from the classification table.
 */
const GOVERNANCE_DOC_DOMAIN: Readonly<Record<string, ChangeDomain>> = Object.freeze({
  "SCOPE.md": "SCOPE",
  "REQUIREMENTS.md": "REQUIREMENT",
  "SOURCE-HIERARCHY.md": "GOVERNANCE",
  "CHECKPOINT-LOCK.md": "PROJECT_STATE",
  "DECISIONS-LEDGER.md": "DECISION",
  "DECISIONS-SUPERSESSION-MAP.md": "DECISION",
  "ARCHITECTURE.md": "ARCHITECTURE",
  "SECURITY.md": "SECURITY",
  "DEPLOYMENT.md": "COMPLETION",
  "DEFINITION-OF-DONE.md": "COMPLETION",
  "TEST-BENCHMARK-PLAN.md": "VALIDATION",
  "BACKLOG.md": "FUTURE_WORK",
  "GITHUB-FIRST-CODEX-WORKFLOW.md": "EXECUTION",
  "EXECUTOR-ACCELERATION-CONTRACT.md": "EXECUTION",
  "GITHUB-ACCELERATION-PROFILE.md": "EXECUTION",
  "CONSTITUTION-LOCK.md": "GOVERNANCE",
});

/** True for a document sitting directly in `.engineering/`, where frozen canonical sources live. */
function isRootEngineeringDocument(path: string): boolean {
  return path.startsWith(".engineering/") && !path.slice(".engineering/".length).includes("/");
}

const NO_OBLIGATIONS: readonly ChangeObligation[] = Object.freeze([]);

const KIND_RULE_TABLE: readonly KindRule[] = [
  { kind: "EXECUTOR_CONTRACT", domain: "EXECUTION", tierFloor: "STANDARD", obligations: NO_OBLIGATIONS, governanceEligible: true },
  {
    kind: "CI_ROUTING",
    domain: "VALIDATION",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["PIPELINE_INTEGRITY"]),
    governanceEligible: false,
  },
  {
    kind: "DEPENDENCY_MANIFEST",
    domain: "SECURITY",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["DEPENDENCY_SUPPLY_CHAIN"]),
    governanceEligible: false,
  },
  {
    kind: "BUILD_CONFIG",
    domain: "ARCHITECTURE",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["CROSS_PLATFORM_REGRESSION"]),
    governanceEligible: false,
  },
  {
    kind: "CANONICAL_CHECKPOINT",
    domain: "PROJECT_STATE",
    tierFloor: "STANDARD",
    obligations: Object.freeze(["CHECKPOINT_PARITY"]),
    governanceEligible: false,
  },
  {
    kind: "MACHINE_SCHEMA",
    domain: "ARCHITECTURE",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["JSON_SCHEMA_PARSE", "CROSS_PLATFORM_REGRESSION"]),
    governanceEligible: false,
  },
  {
    kind: "DECISION_RECORD",
    domain: "DECISION",
    tierFloor: "ELEVATED",
    obligations: NO_OBLIGATIONS,
    governanceEligible: false,
  },
  { kind: "WORK_ORDER", domain: "EXECUTION", tierFloor: "STANDARD", obligations: NO_OBLIGATIONS, governanceEligible: true },
  { kind: "CONTEXT_LOCK", domain: "EXECUTION", tierFloor: "STANDARD", obligations: NO_OBLIGATIONS, governanceEligible: true },
  {
    kind: "CHECKPOINT_DELTA",
    domain: "PROJECT_STATE",
    tierFloor: "STANDARD",
    obligations: NO_OBLIGATIONS,
    governanceEligible: true,
  },
  { kind: "EVIDENCE", domain: "VALIDATION", tierFloor: "LOW", obligations: NO_OBLIGATIONS, governanceEligible: true },
  { kind: "GOVERNANCE_DOC", domain: "GOVERNANCE", tierFloor: "LOW", obligations: NO_OBLIGATIONS, governanceEligible: true },
  {
    kind: "NORMATIVE_AUTHORITY_DOC",
    domain: "GOVERNANCE",
    tierFloor: "ELEVATED",
    obligations: NO_OBLIGATIONS,
    governanceEligible: false,
  },
  { kind: "PLANNING_DOC", domain: "PLANNING", tierFloor: "LOW", obligations: NO_OBLIGATIONS, governanceEligible: true },
  { kind: "OPERATOR_DOC", domain: "COMPLETION", tierFloor: "LOW", obligations: NO_OBLIGATIONS, governanceEligible: true },
  {
    kind: "PRODUCT_CODE",
    domain: "ARCHITECTURE",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["STATIC_ANALYSIS", "CROSS_PLATFORM_REGRESSION"]),
    governanceEligible: false,
  },
  {
    kind: "TEST_PROOF",
    domain: "VALIDATION",
    tierFloor: "STANDARD",
    obligations: Object.freeze(["CROSS_PLATFORM_REGRESSION"]),
    governanceEligible: false,
  },
  { kind: "TEST_FIXTURE", domain: "VALIDATION", tierFloor: "STANDARD", obligations: NO_OBLIGATIONS, governanceEligible: false },
  {
    kind: "UNKNOWN",
    domain: "UNKNOWN",
    tierFloor: "ELEVATED",
    obligations: Object.freeze(["STATIC_ANALYSIS", "CROSS_PLATFORM_REGRESSION"]),
    governanceEligible: false,
  },
  {
    kind: "UNKNOWN_SUSPICIOUS",
    domain: "UNKNOWN",
    tierFloor: "HIGH_ASSURANCE",
    obligations: Object.freeze(["STATIC_ANALYSIS", "CROSS_PLATFORM_REGRESSION", "SPECIALIST_REVIEW"]),
    governanceEligible: false,
  },
];

const KIND_RULES: readonly KindRule[] = Object.freeze(KIND_RULE_TABLE);

const RULE_BY_KIND: ReadonlyMap<ChangePathKind, KindRule> = new Map(KIND_RULES.map((rule) => [rule.kind, rule]));

export interface NormalizedChangePath {
  readonly raw: string;
  readonly normalized: string;
  readonly findings: readonly ChangeImpactDiagnosticCode[];
}

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function diagnose(raw: string): readonly ChangeImpactDiagnosticCode[] {
  const findings: ChangeImpactDiagnosticCode[] = [];
  if (raw.length === 0) return [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_EMPTY];
  if (CONTROL_CHARACTERS.test(raw)) findings.push(CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_CONTROL_CHARACTER);
  if (raw.includes("\\")) findings.push(CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_BACKSLASH);
  if (/%2f|%5c/i.test(raw)) findings.push(CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_ENCODED_SEPARATOR);
  if (raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) findings.push(CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_ABSOLUTE);
  const segments = raw.replace(/\\/g, "/").split("/");
  if (segments.includes("..")) findings.push(CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_TRAVERSAL);
  return findings;
}

/**
 * Comparison form of a repository-relative path: separators unified, empty and `.` segments
 * dropped. `..` is preserved so `diagnose` can report traversal instead of silently resolving it.
 */
function normalizeChangePathText(value: string): string {
  const kept: string[] = [];
  for (const segment of value.replace(/\\/g, "/").split("/")) {
    if (segment === "" || segment === ".") continue;
    kept.push(segment);
  }
  return kept.join("/");
}

export function normalizeChangePath(raw: string): NormalizedChangePath {
  const findings = diagnose(raw);
  return {
    raw,
    normalized: findings.length === 0 ? normalizeChangePathText(raw) : "",
    findings,
  };
}

function compareCodePoint(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function basename(path: string): string {
  const index = path.lastIndexOf("/");
  return index < 0 ? path : path.slice(index + 1);
}

function matchesGlob(path: string, segments: readonly string[]): boolean {
  if (segments.length === 0) return false;
  return matchesGlobSegments(segments, 0, path.split("/"), 0);
}

function matchesGlobSegments(
  segments: readonly string[],
  patternIndex: number,
  candidate: readonly string[],
  candidateIndex: number,
): boolean {
  if (patternIndex === segments.length) return candidateIndex === candidate.length;
  const segment = segments[patternIndex] ?? "";
  if (segment === "**") {
    if (patternIndex === segments.length - 1) return true;
    for (let next = candidateIndex; next <= candidate.length; next += 1) {
      if (matchesGlobSegments(segments, patternIndex + 1, candidate, next)) return true;
    }
    return false;
  }
  if (candidateIndex >= candidate.length) return false;
  if (!segmentMatchesLiteral(segment, candidate[candidateIndex] ?? "")) return false;
  return matchesGlobSegments(segments, patternIndex + 1, candidate, candidateIndex + 1);
}

function segmentMatchesLiteral(patternSegment: string, candidateSegment: string): boolean {
  const patternParts = patternSegment.split("*");
  if (patternParts.length === 1) return patternSegment === candidateSegment;
  let cursor = 0;
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    if (part === undefined || part.length === 0) continue;
    const found = candidateSegment.indexOf(part, cursor);
    if (found < 0) return false;
    if (index === 0 && found !== 0) return false;
    cursor = found + part.length;
  }
  const last = patternParts[patternParts.length - 1];
  return last !== undefined && last.length > 0 ? candidateSegment.endsWith(last) : candidateSegment.length >= cursor;
}

/**
 * Ordered classification table. The first matching rule wins, so narrower protected surfaces
 * are tested before the broader directory they live in.
 */
const CLASSIFICATION_RULES: readonly { readonly pattern: string; readonly kind: ChangePathKind }[] = Object.freeze([
  { pattern: "AGENTS.md", kind: "EXECUTOR_CONTRACT" },
  { pattern: "packages/AGENTS.md", kind: "EXECUTOR_CONTRACT" },
  { pattern: "tests/AGENTS.md", kind: "EXECUTOR_CONTRACT" },
  { pattern: "docs/**/AGENTS.md", kind: "EXECUTOR_CONTRACT" },
  { pattern: ".github/workflows/**", kind: "CI_ROUTING" },
  { pattern: ".github/actions/**", kind: "CI_ROUTING" },
  { pattern: ".github/CODEOWNERS", kind: "CI_ROUTING" },
  { pattern: ".github/copilot-instructions.md", kind: "CI_ROUTING" },
  { pattern: ".github/agents/**", kind: "CI_ROUTING" },
  { pattern: "package.json", kind: "DEPENDENCY_MANIFEST" },
  { pattern: "package-lock.json", kind: "DEPENDENCY_MANIFEST" },
  { pattern: "**/package.json", kind: "DEPENDENCY_MANIFEST" },
  { pattern: "**/package-lock.json", kind: "DEPENDENCY_MANIFEST" },
  { pattern: "tsconfig.json", kind: "BUILD_CONFIG" },
  { pattern: "tsconfig.base.json", kind: "BUILD_CONFIG" },
  { pattern: "**/tsconfig*.json", kind: "BUILD_CONFIG" },
  { pattern: ".engineering/CHECKPOINT.md", kind: "CANONICAL_CHECKPOINT" },
  { pattern: ".engineering/CHECKPOINT.json", kind: "CANONICAL_CHECKPOINT" },
  { pattern: ".engineering/schemas/**", kind: "MACHINE_SCHEMA" },
  { pattern: ".engineering/decisions/**", kind: "DECISION_RECORD" },
  { pattern: ".engineering/work-orders/**", kind: "WORK_ORDER" },
  { pattern: ".engineering/context-locks/**", kind: "CONTEXT_LOCK" },
  { pattern: ".engineering/evidence/**", kind: "EVIDENCE" },
  { pattern: ".engineering/checkpoint-deltas/**", kind: "CHECKPOINT_DELTA" },
  { pattern: ".engineering/**/*.ts", kind: "PRODUCT_CODE" },
  { pattern: ".engineering/**/*.mts", kind: "PRODUCT_CODE" },
  { pattern: ".engineering/**/*.mjs", kind: "PRODUCT_CODE" },
  { pattern: ".engineering/**/*.js", kind: "PRODUCT_CODE" },
  { pattern: ".engineering/**", kind: "GOVERNANCE_DOC" },
  { pattern: "planning/**", kind: "PLANNING_DOC" },
  { pattern: "packages/**/*.ts", kind: "PRODUCT_CODE" },
  { pattern: "packages/**/*.mts", kind: "PRODUCT_CODE" },
  { pattern: "packages/**/*.mjs", kind: "PRODUCT_CODE" },
  { pattern: "packages/**/*.js", kind: "PRODUCT_CODE" },
  { pattern: "tools/**/*.mjs", kind: "PRODUCT_CODE" },
  { pattern: "tools/**/*.ts", kind: "PRODUCT_CODE" },
  { pattern: "tests/**/*.test.mjs", kind: "TEST_PROOF" },
  { pattern: "tests/**", kind: "TEST_FIXTURE" },
  { pattern: "docs/**", kind: "OPERATOR_DOC" },
  { pattern: "README.md", kind: "OPERATOR_DOC" },
]);

export interface ChangePathClassification {
  readonly path: string;
  readonly normalized: string;
  readonly kind: ChangePathKind;
  readonly domain: ChangeDomain;
  readonly unclassified: boolean;
  readonly findings: readonly ChangeImpactDiagnosticCode[];
}

export function classifyChangePath(path: unknown): ChangePathClassification {
  if (typeof path !== "string") {
    return {
      path: String(path),
      normalized: "",
      kind: "UNKNOWN_SUSPICIOUS",
      domain: "UNKNOWN",
      unclassified: true,
      findings: [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_NOT_STRING],
    };
  }
  const normalized = normalizeChangePath(path);
  if (normalized.findings.length > 0) {
    return {
      path,
      normalized: "",
      kind: "UNKNOWN_SUSPICIOUS",
      domain: "UNKNOWN",
      unclassified: true,
      findings: normalized.findings,
    };
  }
  const target = normalized.normalized;
  const governanceDomain = GOVERNANCE_DOC_DOMAIN[basename(target)];
  for (const rule of CLASSIFICATION_RULES) {
    if (!matchesGlob(target, rule.pattern.split("/"))) continue;
    const kindRule = RULE_BY_KIND.get(rule.kind);
    if (kindRule === undefined) continue;
    const domain = rule.kind === "GOVERNANCE_DOC" && governanceDomain !== undefined ? governanceDomain : kindRule.domain;
    // The root of `.engineering` holds frozen canonical sources; its subdirectories hold evidence,
    // deltas and locks. A root-level document this table does not name is therefore still
    // normative authority and widens rather than being trusted as descriptive prose.
    if (rule.kind === "GOVERNANCE_DOC" && (governanceDomain === undefined || isRootEngineeringDocument(target))) {
      const normative = RULE_BY_KIND.get("NORMATIVE_AUTHORITY_DOC");
      if (normative !== undefined) {
        return { path, normalized: target, kind: normative.kind, domain, unclassified: false, findings: [] };
      }
    }
    return { path, normalized: target, kind: kindRule.kind, domain, unclassified: false, findings: [] };
  }
  // A path that reaches here but matches a rule only case-insensitively is a case variant of a
  // real surface. On a case-insensitive filesystem it may be the same file, so neither spelling
  // can be trusted to classify: report it instead of guessing.
  const lowered = target.toLowerCase();
  for (const rule of CLASSIFICATION_RULES) {
    if (matchesGlob(lowered, rule.pattern.toLowerCase().split("/"))) {
      return {
        path,
        normalized: "",
        kind: "UNKNOWN_SUSPICIOUS",
        domain: "UNKNOWN",
        unclassified: true,
        findings: [CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_CASE_VARIANT],
      };
    }
  }
  return { path, normalized: target, kind: "UNKNOWN", domain: "UNKNOWN", unclassified: true, findings: [] };
}

export interface ChangeImpactFacts {
  /** Set when the caller proves the repository declares this Work Order at a higher risk. */
  readonly declaredRisk?: ChangeImpactTier;
  /** Set when the caller observed a protected-surface mutation (tag, version, release, deployment). */
  readonly protectedSurfaceTouched?: boolean;
  /** Set when the caller observed a release-sensitive branch or lifecycle condition. */
  readonly releaseLifecycle?: boolean;
  /** Set when the caller cannot enumerate the changed-path set exactly. */
  readonly changedStateUnproven?: boolean;
  /** Set when the caller observed an authority conflict affecting the classification. */
  readonly authorityConflict?: boolean;
  /** Set when a rename/move/delete condition was observed and is not fully resolved. */
  readonly unresolvedRename?: boolean;
}

export interface ChangeImpactInput {
  readonly changedPaths: readonly unknown[];
  readonly facts?: ChangeImpactFacts;
}

export interface ChangeImpactResult {
  readonly policyVersion: string;
  readonly state: "CLASSIFIED" | "BLOCKED";
  readonly tier: ChangeImpactTier;
  /** Tier derived from the changed paths and facts alone, before any declared risk is applied. */
  readonly tierFloor: ChangeImpactTier;
  /** Tier contributed by the declared risk; `LOW` when the caller declared nothing. */
  readonly declaredTier: ChangeImpactTier;
  readonly governanceFastPath: "PERMITTED" | "REFUSED";
  readonly governanceFastPathRefusals: readonly string[];
  readonly paths: readonly ChangePathClassification[];
  readonly kinds: readonly ChangePathKind[];
  readonly domains: readonly ChangeDomain[];
  readonly unclassifiedPaths: readonly string[];
  readonly suspiciousPaths: readonly string[];
  readonly obligations: readonly ChangeObligation[];
  readonly escalateReasons: readonly string[];
  readonly impactDigest: string;
}

const TIER_FOR_RISK: Readonly<Record<ChangeImpactTier, ChangeImpactTier>> = Object.freeze({
  LOW: "LOW",
  STANDARD: "STANDARD",
  ELEVATED: "ELEVATED",
  HIGH_ASSURANCE: "HIGH_ASSURANCE",
});

/**
 * Classifies a changed-path set into a tier, an obligation set and a governance fast-path verdict.
 *
 * The result is a snapshot, not a verdict: the caller still has to bind it to an exact head and
 * the gate still has to decide. It never throws and never partially classifies.
 */
export function classifyChangeImpact(input: ChangeImpactInput, digest: RequirementDigestPort): ChangeImpactResult {
  const facts = input.facts ?? {};
  const paths = [...input.changedPaths.map((path) => classifyChangePath(path))].sort((left, right) =>
    compareCodePoint(left.path, right.path),
  );
  const escalateReasons: string[] = [];
  const refusalReasons: string[] = [];

  if (paths.length === 0) {
    // Nothing proven changed means nothing proven narrow. An empty diff is not a licence.
    escalateReasons.push("EMPTY_CHANGED_STATE_UNPROVEN");
  }

  const seenNormalized = new Set<string>();
  for (const classification of paths) {
    if (classification.kind === "UNKNOWN_SUSPICIOUS") {
      escalateReasons.push(`SUSPICIOUS_PATH_CONDITION:${classification.findings.join("+")}`);
      refusalReasons.push(`SUSPICIOUS_PATH_CONDITION:${classification.path}`);
      continue;
    }
    if (classification.unclassified) {
      escalateReasons.push(`UNCLASSIFIED_PATH:${classification.path}`);
      refusalReasons.push(`UNCLASSIFIED_PATH:${classification.path}`);
      continue;
    }
    const rule = RULE_BY_KIND.get(classification.kind);
    if (rule === undefined || !rule.governanceEligible) {
      refusalReasons.push(`NON_GOVERNANCE_CHANGE:${classification.kind}:${classification.path}`);
    }
    if (!seenNormalized.has(classification.normalized)) {
      seenNormalized.add(classification.normalized);
    } else {
      escalateReasons.push(`${CHANGE_IMPACT_DIAGNOSTIC_CODES.CHANGED_PATH_DUPLICATE}:${classification.path}`);
    }
  }

  if (factPresent(facts.changedStateUnproven)) {
    escalateReasons.push("CHANGED_STATE_UNPROVEN");
    refusalReasons.push("CHANGED_STATE_UNPROVEN");
  }
  if (factPresent(facts.authorityConflict)) {
    escalateReasons.push("AUTHORITY_CONFLICT");
    refusalReasons.push("AUTHORITY_CONFLICT");
  }
  if (factPresent(facts.unresolvedRename)) {
    escalateReasons.push("UNRESOLVED_RENAME");
    refusalReasons.push("UNRESOLVED_RENAME");
  }
  if (factPresent(facts.protectedSurfaceTouched)) {
    escalateReasons.push("PROTECTED_SURFACE_TOUCHED");
    refusalReasons.push("PROTECTED_SURFACE_TOUCHED");
  }
  // A release-significant candidate is never governance-only, whatever its changed paths say.
  if (factPresent(facts.releaseLifecycle)) refusalReasons.push("RELEASE_LIFECYCLE");

  let tier: ChangeImpactTier = "LOW";
  for (const classification of paths) {
    const rule = RULE_BY_KIND.get(classification.kind);
    if (rule === undefined) continue;
    tier = maxChangeImpactTier(tier, rule.tierFloor);
  }
  for (const reason of escalateReasons) {
    if (reason.startsWith("SUSPICIOUS_PATH_CONDITION") || reason.startsWith("PROTECTED_SURFACE_TOUCHED")) {
      tier = maxChangeImpactTier(tier, "HIGH_ASSURANCE");
      continue;
    }
    // Every other escalation reason is at minimum ELEVATED: widening, never narrowing.
    tier = maxChangeImpactTier(tier, "ELEVATED");
  }
  if (factPresent(facts.releaseLifecycle)) tier = maxChangeImpactTier(tier, "HIGH_ASSURANCE");
  if (factPresent(facts.authorityConflict) || factPresent(facts.changedStateUnproven)) tier = maxChangeImpactTier(tier, "HIGH_ASSURANCE");

  // A declared risk may raise the tier and can never lower it below what the paths proved. A
  // declared value this table does not recognise is a broken authority input, not a low risk: it
  // escalates to the strongest tier and is reported.
  const declaredRisk = facts.declaredRisk;
  const declaredTierUnchecked = declaredRisk === undefined ? undefined : TIER_FOR_RISK[declaredRisk];
  const declaredTier: ChangeImpactTier | undefined =
    declaredRisk === undefined ? undefined : (declaredTierUnchecked ?? "HIGH_ASSURANCE");
  if (declaredRisk !== undefined && declaredTierUnchecked === undefined) {
    escalateReasons.push(`UNDECLARED_RISK_CLASS:${String(declaredRisk)}`);
    refusalReasons.push(`UNDECLARED_RISK_CLASS:${String(declaredRisk)}`);
    tier = maxChangeImpactTier(tier, "HIGH_ASSURANCE");
  }
  const effectiveTier = declaredTier === undefined ? tier : maxChangeImpactTier(tier, declaredTier);

  const obligationSet = new Set<ChangeObligation>(ALWAYS_REQUIRED_OBLIGATIONS);
  for (const classification of paths) {
    const rule = RULE_BY_KIND.get(classification.kind);
    if (rule === undefined) continue;
    for (const obligation of rule.obligations) obligationSet.add(obligation);
  }
  if (effectiveTier === "HIGH_ASSURANCE") {
    obligationSet.add("RELEASE_ASSURANCE");
    obligationSet.add("SPECIALIST_REVIEW");
  }
  if (effectiveTier !== "LOW") obligationSet.add("CROSS_PLATFORM_REGRESSION");

  const governanceFastPath: "PERMITTED" | "REFUSED" = refusalReasons.length === 0 && paths.length > 0 ? "PERMITTED" : "REFUSED";
  const blocked =
    suspiciousPathsOf(paths).length > 0 || factPresent(facts.authorityConflict) || factPresent(facts.changedStateUnproven);

  const sortedObligations = [...obligationSet].sort();
  const sortedKinds = [...new Set(paths.map((classification) => classification.kind))].sort();
  const sortedDomains = [...new Set(paths.map((classification) => classification.domain))].sort();

  const body = {
    policyVersion: CHANGE_IMPACT_POLICY_VERSION,
    state: blocked ? ("BLOCKED" as const) : ("CLASSIFIED" as const),
    tier: effectiveTier,
    tierFloor: tier,
    declaredTier: declaredTier ?? null,
    governanceFastPath,
    governanceFastPathRefusals: [...new Set(refusalReasons)].sort(),
    paths: paths.map((classification) => ({
      path: classification.path,
      normalized: classification.normalized,
      kind: classification.kind,
      domain: classification.domain,
      unclassified: classification.unclassified,
      findings: classification.findings,
    })),
    kinds: sortedKinds,
    domains: sortedDomains,
    obligations: sortedObligations,
    escalateReasons: [...new Set(escalateReasons)].sort(),
    facts: {
      declaredRisk: declaredRisk ?? null,
      protectedSurfaceTouched: facts.protectedSurfaceTouched ?? false,
      releaseLifecycle: facts.releaseLifecycle ?? false,
      changedStateUnproven: facts.changedStateUnproven ?? false,
      authorityConflict: facts.authorityConflict ?? false,
      unresolvedRename: facts.unresolvedRename ?? false,
    },
  };

  const impactDigest = `${digest.algorithm}:${digest.digest(
    `GEF:CHANGE_IMPACT:${CHANGE_IMPACT_POLICY_VERSION}\n${stablePreflightStringify(body)}`,
  )}`;

  return Object.freeze({
    policyVersion: CHANGE_IMPACT_POLICY_VERSION,
    state: body.state,
    tier: body.tier,
    tierFloor: body.tierFloor,
    declaredTier: declaredTier ?? "LOW",
    governanceFastPath,
    governanceFastPathRefusals: Object.freeze(body.governanceFastPathRefusals),
    paths: Object.freeze(body.paths),
    kinds: Object.freeze(sortedKinds),
    domains: Object.freeze(sortedDomains),
    unclassifiedPaths: Object.freeze(paths.filter((c) => c.unclassified).map((c) => c.path)),
    suspiciousPaths: Object.freeze(suspiciousPathsOf(paths)),
    obligations: Object.freeze(sortedObligations),
    escalateReasons: Object.freeze(body.escalateReasons),
    impactDigest,
  });
}

function suspiciousPathsOf(paths: readonly ChangePathClassification[]): readonly string[] {
  return paths.filter((classification) => classification.kind === "UNKNOWN_SUSPICIOUS").map((classification) => classification.path);
}

/**
 * Reads a declared fact flag.
 *
 * A caller that passes a truthy non-boolean means something; treating only `=== true` as a signal
 * would let a malformed fact silently drop an escalation. Anything that is not `undefined` or
 * `false` is therefore read as present.
 */
function factPresent(value: unknown): boolean {
  return value !== undefined && value !== false;
}
