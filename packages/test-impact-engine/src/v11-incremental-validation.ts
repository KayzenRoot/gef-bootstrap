import type {
  AssuranceInput,
  OperationOptions,
  Result,
  SelectionPlan,
  TestImpactHandoff,
  TestImpactResult,
  TestMap,
  Uncertainty,
  ValidationLevel,
} from "./types.js";
import { buildTestMap, platformRelevant } from "./s01-source-test-map.js";
import { selectImpactedTests } from "./s02-selection-reuse.js";
import { progressiveValidationLevel } from "./s03-regression-radius.js";
import { createTestImpactHandoff, createTestImpactResult } from "./s04-uncertainty-handoff.js";
import { digest, fail, isSha, maxLevel, ok, unique } from "./utils.js";

export type SelectorConfidence = "CERTAIN" | "INDETERMINATE";
export type BrownfieldValidationPosture =
  | "GREENFIELD"
  | "BROWNFIELD_SHADOW_PROVEN"
  | "BROWNFIELD_UNPROVEN";
export type IncrementalValidationState = "READY" | "WIDENED" | "INDETERMINATE" | "BLOCKED";
export type IntermediateSuppression = "DEFER_TO_PROOF_REUSE" | "PROHIBITED";

export interface CapsuleValidationProjection {
  readonly state: "COMPILED" | "INDETERMINATE" | "STALE" | "REJECTED";
  readonly certainty: "SUFFICIENT" | "INSUFFICIENT";
  readonly capsuleFingerprint: string;
  readonly ladderLevel: ValidationLevel;
  readonly tests: readonly string[];
  readonly escalation: readonly { trigger: string; escalateTo: ValidationLevel }[];
  readonly finalSweepRequired: boolean;
}

export interface CompileIncrementalValidationInput {
  readonly candidateDigest: string;
  readonly platform: string;
  readonly map: TestMap;
  readonly changedSources: readonly string[];
  readonly assurance: AssuranceInput;
  readonly selectorConfidence: SelectorConfidence;
  readonly brownfieldPosture: BrownfieldValidationPosture;
  readonly capsule: CapsuleValidationProjection;
}

export interface IncrementalValidationPlan {
  readonly state: IncrementalValidationState;
  readonly tests: readonly string[];
  readonly level: ValidationLevel;
  readonly assuranceFloor: ValidationLevel;
  readonly uncertainty: Uncertainty;
  readonly reasons: readonly string[];
  readonly intermediateSuppression: IntermediateSuppression;
  readonly fullSuiteRequired: boolean;
  readonly finalSweepRequired: boolean;
  readonly bindings: {
    readonly candidateDigest: string;
    readonly capsuleFingerprint: string;
    readonly mapDigest: string;
    readonly policyDigest: string;
    readonly profileDigest: string;
    readonly platform: string;
  };
  readonly result: TestImpactResult;
  readonly handoff: TestImpactHandoff;
  readonly digest: string;
}

const RAW_SHA256 = /^[0-9a-f]{64}$/;
const LEVELS = new Set<ValidationLevel>(["L0", "L1", "L2", "L3", "L4", "L5"]);
const CAPSULE_STATES = new Set<CapsuleValidationProjection["state"]>([
  "COMPILED",
  "INDETERMINATE",
  "STALE",
  "REJECTED",
]);
const BROWNFIELD_STATES = new Set<BrownfieldValidationPosture>([
  "GREENFIELD",
  "BROWNFIELD_SHADOW_PROVEN",
  "BROWNFIELD_UNPROVEN",
]);

function capsuleFloor(level: ValidationLevel, assuranceFloor: ValidationLevel): ValidationLevel {
  return progressiveValidationLevel({
    direct: level === "L1",
    closure: level === "L2",
    boundary: level === "L3",
    risk: level === "L4",
    exact: level === "L5",
    assuranceFloor,
  });
}

function allRelevantTests(map: TestMap, platform: string): readonly string[] {
  return unique(map.tests.filter((test) => platformRelevant(test, platform)).map((test) => test.id));
}

function selectionDigest(
  tests: readonly string[],
  level: ValidationLevel,
  uncertainty: Uncertainty,
  reasons: readonly string[],
  input: CompileIncrementalValidationInput,
  options: OperationOptions,
): Result<string> {
  return digest(options, "IVSEL11", {
    tests,
    level,
    uncertainty,
    reasons,
    mapDigest: input.map.digest,
    candidateDigest: input.candidateDigest,
    capsuleFingerprint: input.capsule.capsuleFingerprint,
    policyDigest: input.assurance.policyDigest,
    profileDigest: input.assurance.profileDigest,
    platform: input.platform,
  });
}

function makePlan(
  input: CompileIncrementalValidationInput,
  state: IncrementalValidationState,
  tests: readonly string[],
  level: ValidationLevel,
  assuranceFloor: ValidationLevel,
  uncertainty: Uncertainty,
  reasons: readonly string[],
  intermediateSuppression: IntermediateSuppression,
  fullSuiteRequired: boolean,
  finalSweepRequired: boolean,
  options: OperationOptions,
): Result<IncrementalValidationPlan> {
  const normalizedTests = unique(tests);
  const normalizedReasons = unique(reasons);
  const sd = selectionDigest(normalizedTests, level, uncertainty, normalizedReasons, input, options);
  if (!sd.ok) return sd;
  const selection: SelectionPlan = {
    tests: normalizedTests,
    level,
    uncertainty,
    reasons: normalizedReasons,
    digest: sd.value,
  };
  const result = createTestImpactResult({ selection, state }, options);
  if (!result.ok) return result;
  const handoff = createTestImpactHandoff(
    "v11.incremental-validation",
    input.candidateDigest,
    result.value,
    options,
  );
  if (!handoff.ok) return handoff;

  const bindings = {
    candidateDigest: input.candidateDigest,
    capsuleFingerprint: input.capsule.capsuleFingerprint,
    mapDigest: input.map.digest,
    policyDigest: input.assurance.policyDigest,
    profileDigest: input.assurance.profileDigest,
    platform: input.platform,
  };
  const body = {
    state,
    tests: normalizedTests,
    level,
    assuranceFloor,
    uncertainty,
    reasons: normalizedReasons,
    intermediateSuppression,
    fullSuiteRequired,
    finalSweepRequired,
    bindings,
    resultDigest: result.value.digest,
    handoffDigest: handoff.value.digest,
    authority: handoff.value.authority,
  };
  const d = digest(options, "IVP11", body);
  if (!d.ok) return d;
  return ok(Object.freeze({
    state,
    tests: normalizedTests,
    level,
    assuranceFloor,
    uncertainty,
    reasons: normalizedReasons,
    intermediateSuppression,
    fullSuiteRequired,
    finalSweepRequired,
    bindings: Object.freeze(bindings),
    result: result.value,
    handoff: handoff.value,
    digest: d.value,
  }));
}

/**
 * V1.1 orchestration over M28.
 * It may widen validation, but it never decides whether historical proof can suppress execution.
 */
export function compileIncrementalValidationPlan(
  input: CompileIncrementalValidationInput,
  options: OperationOptions,
): Result<IncrementalValidationPlan> {
  if (options.cancellation?.isCancelled()) {
    return fail("OPERATION_CANCELLED", "Incremental validation planning was cancelled.");
  }
  if (
    !isSha(input.candidateDigest) ||
    !isSha(input.assurance.policyDigest) ||
    !isSha(input.assurance.profileDigest) ||
    !isSha(input.map.digest)
  ) {
    return fail("INCREMENTAL_BINDING_INVALID", "Candidate/map/policy/profile digest binding is invalid.");
  }
  if (!RAW_SHA256.test(input.capsule.capsuleFingerprint)) {
    return fail("INCREMENTAL_CAPSULE_INVALID", "Capsule fingerprint must be raw lowercase SHA-256.");
  }
  if (
    !CAPSULE_STATES.has(input.capsule.state) ||
    !LEVELS.has(input.capsule.ladderLevel) ||
    !BROWNFIELD_STATES.has(input.brownfieldPosture) ||
    (input.selectorConfidence !== "CERTAIN" && input.selectorConfidence !== "INDETERMINATE") ||
    !input.platform
  ) {
    return fail("INCREMENTAL_INPUT_INVALID", "Incremental validation input contains an unsupported enum/value.");
  }
  if (
    !Array.isArray(input.capsule.escalation) ||
    input.capsule.escalation.length === 0 ||
    input.capsule.escalation.some((entry) => !entry.trigger || !LEVELS.has(entry.escalateTo))
  ) {
    return fail("INCREMENTAL_CAPSULE_INVALID", "Capsule escalation rules are missing or invalid.");
  }

  // Never trust a mutable TestMap object by shape alone. Rebuild it through M28 and require
  // the canonical digest/complete bit to match before it can influence a smaller test radius.
  const rebuiltMap = buildTestMap(input.map.sources, input.map.tests, options);
  if (!rebuiltMap.ok) return rebuiltMap;
  if (rebuiltMap.value.digest !== input.map.digest || rebuiltMap.value.complete !== input.map.complete) {
    return fail("INCREMENTAL_TEST_MAP_INVALID", "TestMap content does not match its canonical M28 seal.");
  }

  const assuranceFloor = capsuleFloor(input.capsule.ladderLevel, input.assurance.requiredLevel);
  const platformSuite = allRelevantTests(input.map, input.platform);
  const byId = new Map(input.map.tests.map((test) => [test.id, test]));
  const mandatory = unique(input.capsule.tests);
  const unknownMandatory = mandatory.filter((id) => !byId.has(id));
  const platformFilteredMandatory = mandatory.filter((id) => {
    const test = byId.get(id);
    return test !== undefined && !platformRelevant(test, input.platform);
  });
  const mandatoryRelevant = mandatory.filter((id) => {
    const test = byId.get(id);
    return test !== undefined && platformRelevant(test, input.platform);
  });

  const finalSweepRequired =
    input.capsule.finalSweepRequired ||
    assuranceFloor === "L5" ||
    input.assurance.requiredLevel === "L5" ||
    input.capsule.ladderLevel === "L5";

  const capsuleUnavailable =
    input.capsule.state !== "COMPILED" ||
    input.capsule.certainty !== "SUFFICIENT";

  if (capsuleUnavailable) {
    const blocked = input.capsule.state === "STALE" || input.capsule.state === "REJECTED";
    const level = maxLevel(assuranceFloor, "L4");
    return makePlan(
      input,
      blocked ? "BLOCKED" : "INDETERMINATE",
      unique([...platformSuite, ...mandatoryRelevant, ...unknownMandatory]),
      level,
      assuranceFloor,
      blocked ? "CONFLICT" : "UNKNOWN",
      [
        "CAPSULE_NOT_EXECUTABLE",
        ...unknownMandatory.map((id) => `CAPSULE_TEST_UNMAPPED:${id}`),
        ...platformFilteredMandatory.map((id) => `CAPSULE_TEST_PLATFORM_FILTERED:${id}`),
      ],
      "PROHIBITED",
      true,
      finalSweepRequired,
      options,
    );
  }

  const baseSelection = selectImpactedTests(
    input.map,
    input.changedSources,
    input.platform,
    { ...input.assurance, requiredLevel: assuranceFloor },
    options,
  );
  if (!baseSelection.ok) return baseSelection;

  let level = baseSelection.value.level;
  let uncertainty = baseSelection.value.uncertainty;
  let state: IncrementalValidationState =
    uncertainty === "NONE" ? "READY" : "WIDENED";
  const reasons = [...baseSelection.value.reasons];
  let fullSuiteRequired = level === "L4" || level === "L5";
  let intermediateSuppression: IntermediateSuppression =
    uncertainty === "NONE" ? "DEFER_TO_PROOF_REUSE" : "PROHIBITED";

  if (input.selectorConfidence === "INDETERMINATE") {
    level = maxLevel(level, "L4");
    uncertainty = "UNKNOWN";
    state = "INDETERMINATE";
    fullSuiteRequired = true;
    intermediateSuppression = "PROHIBITED";
    reasons.push("SELECTOR_CONFIDENCE_INDETERMINATE");
  }

  if (input.brownfieldPosture === "BROWNFIELD_UNPROVEN") {
    level = maxLevel(level, "L4");
    if (state === "READY") state = "WIDENED";
    fullSuiteRequired = true;
    intermediateSuppression = "PROHIBITED";
    reasons.push("BROWNFIELD_SHADOW_ASSURANCE_MISSING");
  }

  if (unknownMandatory.length > 0) {
    level = maxLevel(level, "L4");
    uncertainty = "UNKNOWN";
    state = "INDETERMINATE";
    fullSuiteRequired = true;
    intermediateSuppression = "PROHIBITED";
    for (const id of unknownMandatory) reasons.push(`CAPSULE_TEST_UNMAPPED:${id}`);
  }
  for (const id of platformFilteredMandatory) {
    reasons.push(`CAPSULE_TEST_PLATFORM_FILTERED:${id}`);
  }

  if (level === "L4" || level === "L5") fullSuiteRequired = true;
  if (finalSweepRequired && level === "L5") fullSuiteRequired = true;

  const selected = fullSuiteRequired
    ? unique([...platformSuite, ...mandatoryRelevant, ...unknownMandatory])
    : unique([...baseSelection.value.tests, ...mandatoryRelevant]);

  return makePlan(
    input,
    state,
    selected,
    level,
    assuranceFloor,
    uncertainty,
    reasons,
    intermediateSuppression,
    fullSuiteRequired,
    finalSweepRequired,
    options,
  );
}
