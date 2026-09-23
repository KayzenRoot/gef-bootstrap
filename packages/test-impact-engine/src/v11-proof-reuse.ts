import type {
  CurrentBindings,
  FailureFingerprint,
  OperationOptions,
  ProofReuseReceipt,
  Result,
  ReuseState,
  TestMap,
  ValidationLevel,
} from "./types.js";
import { buildTestMap } from "./s01-source-test-map.js";
import { selectImpactedTests, validateReuse } from "./s02-selection-reuse.js";
import { digest, fail, isSha, ok, unique, validId } from "./utils.js";
import type { IncrementalValidationPlan } from "./v11-incremental-validation.js";
import { verifyIncrementalValidationPlan } from "./v11-incremental-validation.js";

export type ProofReusePlanState = "READY" | "NO_REUSE" | "INDETERMINATE" | "BLOCKED";
export type ProofReuseDecisionState =
  | ReuseState
  | "MISSING_RECEIPT"
  | "MISSING_BINDING"
  | "DUPLICATE_RECEIPT"
  | "DUPLICATE_BINDING"
  | "INVALIDATED_SOURCE"
  | "INVALIDATED_FAILURE"
  | "UPSTREAM_SUPPRESSION_PROHIBITED"
  | "FINAL_SWEEP_REQUIRED";

export interface CompileProofReuseInput {
  readonly candidateDigest: string;
  readonly platform: string;
  readonly policyDigest: string;
  readonly profileDigest: string;
  readonly map: TestMap;
  readonly validation: IncrementalValidationPlan;
  readonly receipts: readonly ProofReuseReceipt[];
  readonly currentBindings: readonly CurrentBindings[];
  readonly changedSources: readonly string[];
  readonly currentFailures: readonly FailureFingerprint[];
  readonly dependencyKnowledgeComplete: boolean;
}

export interface ProofReuseDecisionEntry {
  readonly testId: string;
  readonly state: ProofReuseDecisionState;
  readonly reusable: boolean;
  readonly suppressed: boolean;
  readonly reason: string;
}

export interface ProofReuseHandoff {
  readonly consumerId: "v11.proof-reuse";
  readonly candidateDigest: string;
  readonly planDigest: string;
  readonly authority: "READ_ONLY_TEST_IMPACT";
  readonly manufacturesProductionCredit: false;
  readonly digest: string;
}

export interface ProofReusePlan {
  readonly state: ProofReusePlanState;
  readonly selectedTests: readonly string[];
  readonly reusedTests: readonly string[];
  readonly testsToRun: readonly string[];
  readonly decisions: readonly ProofReuseDecisionEntry[];
  readonly finalSweepRequired: boolean;
  readonly manufacturesProductionCredit: false;
  readonly bindings: {
    readonly candidateDigest: string;
    readonly mapDigest: string;
    readonly validationPlanDigest: string;
    readonly validationHandoffDigest: string;
    readonly policyDigest: string;
    readonly profileDigest: string;
    readonly platform: string;
  };
  readonly handoff: ProofReuseHandoff;
  readonly digest: string;
}

const LEVELS = new Set<ValidationLevel>(["L0", "L1", "L2", "L3", "L4", "L5"]);

function validBinding(binding: CurrentBindings): boolean {
  return (
    validId(binding.testId) &&
    isSha(binding.testFingerprint) &&
    isSha(binding.sourceDigest) &&
    isSha(binding.dependencyDigest) &&
    isSha(binding.configDigest) &&
    isSha(binding.fixtureDigest) &&
    isSha(binding.toolchainDigest) &&
    isSha(binding.runtimeDigest) &&
    binding.platform.length > 0 &&
    isSha(binding.policyDigest) &&
    isSha(binding.candidateDigest)
  );
}

function validReceipt(receipt: ProofReuseReceipt): boolean {
  return (
    validBinding(receipt) &&
    validId(receipt.evidenceId) &&
    typeof receipt.acceptedPass === "boolean" &&
    (receipt.currentFailure === undefined || typeof receipt.currentFailure === "boolean") &&
    isSha(receipt.digest)
  );
}

function downstreamFailureClosure(
  map: TestMap,
  failures: readonly FailureFingerprint[],
): { readonly tests: ReadonlySet<string>; readonly unknownFailure: boolean } {
  const knownTests = new Map(map.tests.map((test) => [test.id, test]));
  const affectedTests = new Set<string>();
  const affectedSources = new Set<string>();
  let unknownFailure = false;

  for (const failure of failures) {
    const failedTest = knownTests.get(failure.testId);
    if (failedTest === undefined) {
      unknownFailure = true;
      continue;
    }
    affectedTests.add(failedTest.id);
    for (const sourceId of failedTest.sources) affectedSources.add(sourceId);
  }

  // A current test failure may represent a problem in any source in that test's proven source
  // closure. Widen through source dependencies first, then through tests sharing those sources and
  // downstream test dependencies. This is intentionally more conservative than test-id-only reuse.
  let moved = true;
  while (moved) {
    moved = false;

    for (const source of map.sources) {
      if (affectedSources.has(source.id)) continue;
      if ((source.dependsOn ?? []).some((dependency) => affectedSources.has(dependency))) {
        affectedSources.add(source.id);
        moved = true;
      }
    }

    for (const test of map.tests) {
      if (affectedTests.has(test.id)) continue;
      if (
        test.sources.some((sourceId) => affectedSources.has(sourceId)) ||
        (test.dependsOn ?? []).some((dependency) => affectedTests.has(dependency))
      ) {
        affectedTests.add(test.id);
        for (const sourceId of test.sources) affectedSources.add(sourceId);
        moved = true;
      }
    }
  }

  return { tests: affectedTests, unknownFailure };
}

function indexUnique<T extends { readonly testId: string }>(
  values: readonly T[],
): { readonly unique: ReadonlyMap<string, T>; readonly duplicates: ReadonlySet<string> } {
  const uniqueValues = new Map<string, T>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (uniqueValues.has(value.testId)) duplicates.add(value.testId);
    else uniqueValues.set(value.testId, value);
  }
  return { unique: uniqueValues, duplicates };
}

function makeHandoff(
  candidateDigest: string,
  planDigest: string,
  options: OperationOptions,
): Result<ProofReuseHandoff> {
  const body = {
    consumerId: "v11.proof-reuse" as const,
    candidateDigest,
    planDigest,
    authority: "READ_ONLY_TEST_IMPACT" as const,
    manufacturesProductionCredit: false as const,
  };
  const handoffDigest = digest(options, "PRH11", body);
  if (!handoffDigest.ok) return handoffDigest;
  return ok(Object.freeze({ ...body, digest: handoffDigest.value }));
}

export function compileProofReusePlan(
  input: CompileProofReuseInput,
  options: OperationOptions,
): Result<ProofReusePlan> {
  if (options.cancellation?.isCancelled()) {
    return fail("OPERATION_CANCELLED", "Proof reuse planning was cancelled.");
  }
  if (
    !isSha(input.candidateDigest) ||
    !isSha(input.policyDigest) ||
    !isSha(input.profileDigest) ||
    !isSha(input.map.digest) ||
    !input.platform ||
    !LEVELS.has(input.validation.level) ||
    typeof input.validation.finalSweepRequired !== "boolean" ||
    typeof input.dependencyKnowledgeComplete !== "boolean"
  ) {
    return fail("PROOF_REUSE_BINDING_INVALID", "Proof reuse input binding is invalid.");
  }
  const validationIntegrity = verifyIncrementalValidationPlan(input.validation, options);
  if (!validationIntegrity.ok) return validationIntegrity;
  if (
    input.validation.bindings.candidateDigest !== input.candidateDigest ||
    input.validation.bindings.mapDigest !== input.map.digest ||
    input.validation.bindings.policyDigest !== input.policyDigest ||
    input.validation.bindings.profileDigest !== input.profileDigest ||
    input.validation.bindings.platform !== input.platform
  ) {
    return fail(
      "PROOF_REUSE_VALIDATION_PLAN_MISMATCH",
      "Incremental validation plan does not bind the current candidate/map/policy/profile/platform.",
    );
  }
  if (
    input.changedSources.some((sourceId) => !validId(sourceId)) ||
    input.currentFailures.some((failure) => !validId(failure.testId) || !isSha(failure.fingerprint)) ||
    input.receipts.some((receipt) => !validReceipt(receipt)) ||
    input.currentBindings.some((binding) => !validBinding(binding))
  ) {
    return fail("PROOF_REUSE_INPUT_INVALID", "Receipt/current-binding/change/failure input is malformed.");
  }

  const rebuilt = buildTestMap(input.map.sources, input.map.tests, options);
  if (!rebuilt.ok) return rebuilt;
  if (rebuilt.value.digest !== input.map.digest || rebuilt.value.complete !== input.map.complete) {
    return fail("PROOF_REUSE_TEST_MAP_INVALID", "TestMap content does not match its canonical M28 seal.");
  }

  const selectedTests = unique(input.validation.tests);
  const mapTests = new Set(input.map.tests.map((test) => test.id));
  const selectedUnknown = selectedTests.filter((testId) => !mapTests.has(testId));

  const receiptIndex = indexUnique(input.receipts);
  const bindingIndex = indexUnique(input.currentBindings);
  const duplicateSelected = selectedTests.filter(
    (testId) => receiptIndex.duplicates.has(testId) || bindingIndex.duplicates.has(testId),
  );

  // CurrentBindings are authoritative only if they bind back to the current canonical map and
  // top-level candidate/policy/platform identity. Receipt/current self-agreement is insufficient.
  const currentMapByTest = new Map(input.map.tests.map((test) => [test.id, test]));
  for (const binding of input.currentBindings) {
    const currentTest = currentMapByTest.get(binding.testId);
    if (currentTest === undefined) continue;
    if (
      binding.testFingerprint !== currentTest.fingerprint ||
      binding.candidateDigest !== input.candidateDigest ||
      binding.policyDigest !== input.policyDigest ||
      binding.platform !== input.platform
    ) {
      return fail(
        "PROOF_REUSE_CURRENT_BINDING_INVALID",
        "Current binding does not match the canonical map/candidate/policy/platform identity.",
        binding.testId,
      );
    }
  }

  const impact = selectImpactedTests(
    input.map,
    unique(input.changedSources),
    input.platform,
    {
      requiredLevel: "L0",
      policyDigest: input.policyDigest,
      profileDigest: input.profileDigest,
    },
    options,
  );
  if (!impact.ok) return impact;

  const changedSourceUnknown =
    !input.map.complete ||
    !input.dependencyKnowledgeComplete ||
    impact.value.uncertainty !== "NONE";

  const sourceInvalidated = changedSourceUnknown
    ? new Set(selectedTests)
    : new Set(impact.value.tests);

  const failureClosure = downstreamFailureClosure(input.map, input.currentFailures);
  const failureKnowledgeUnknown =
    failureClosure.unknownFailure ||
    !input.map.complete ||
    !input.dependencyKnowledgeComplete;
  const failureInvalidated = failureKnowledgeUnknown && input.currentFailures.length > 0
    ? new Set(selectedTests)
    : new Set(failureClosure.tests);

  const upstreamBlocksReuse =
    input.validation.state !== "READY" ||
    input.validation.intermediateSuppression !== "DEFER_TO_PROOF_REUSE";
  const finalSweepBlocksReuse = input.validation.level === "L5";

  const decisions: ProofReuseDecisionEntry[] = [];
  const reused: string[] = [];
  const toRun: string[] = [];

  let indeterminate = selectedUnknown.length > 0 || duplicateSelected.length > 0 || changedSourceUnknown;
  if (failureKnowledgeUnknown && input.currentFailures.length > 0) indeterminate = true;

  for (const testId of selectedTests) {
    let entry: ProofReuseDecisionEntry;

    if (selectedUnknown.includes(testId)) {
      entry = {
        testId,
        state: "MISSING_BINDING",
        reusable: false,
        suppressed: false,
        reason: "SELECTED_TEST_NOT_IN_CURRENT_MAP",
      };
    } else if (receiptIndex.duplicates.has(testId)) {
      entry = {
        testId,
        state: "DUPLICATE_RECEIPT",
        reusable: false,
        suppressed: false,
        reason: "DUPLICATE_RECEIPT_IDENTITY",
      };
    } else if (bindingIndex.duplicates.has(testId)) {
      entry = {
        testId,
        state: "DUPLICATE_BINDING",
        reusable: false,
        suppressed: false,
        reason: "DUPLICATE_CURRENT_BINDING",
      };
    } else if (upstreamBlocksReuse) {
      entry = {
        testId,
        state: "UPSTREAM_SUPPRESSION_PROHIBITED",
        reusable: false,
        suppressed: false,
        reason: "INCREMENTAL_VALIDATION_DID_NOT_AUTHORIZE_REUSE_EVALUATION",
      };
    } else if (sourceInvalidated.has(testId) && input.changedSources.length > 0) {
      entry = {
        testId,
        state: "INVALIDATED_SOURCE",
        reusable: false,
        suppressed: false,
        reason: changedSourceUnknown ? "SOURCE_IMPACT_UNKNOWN_OR_INCOMPLETE" : "SOURCE_IMPACT_OVERLAP",
      };
    } else if (failureInvalidated.has(testId)) {
      entry = {
        testId,
        state: "INVALIDATED_FAILURE",
        reusable: false,
        suppressed: false,
        reason: failureKnowledgeUnknown ? "FAILURE_OVERLAP_UNKNOWN_OR_INCOMPLETE" : "CURRENT_FAILURE_OVERLAP",
      };
    } else {
      const receipt = receiptIndex.unique.get(testId);
      const current = bindingIndex.unique.get(testId);
      if (receipt === undefined) {
        entry = {
          testId,
          state: "MISSING_RECEIPT",
          reusable: false,
          suppressed: false,
          reason: "NO_PRIOR_RECEIPT",
        };
      } else if (current === undefined) {
        entry = {
          testId,
          state: "MISSING_BINDING",
          reusable: false,
          suppressed: false,
          reason: "CURRENT_BINDING_MISSING",
        };
      } else {
        const decision = validateReuse(receipt, current, options);
        if (!decision.ok) return decision;
        const canSuppress = decision.value.reusable && !finalSweepBlocksReuse;
        entry = {
          testId,
          state: finalSweepBlocksReuse && decision.value.reusable ? "FINAL_SWEEP_REQUIRED" : decision.value.state,
          reusable: decision.value.reusable,
          suppressed: canSuppress,
          reason: finalSweepBlocksReuse && decision.value.reusable
            ? "L5_FINAL_SWEEP_CANNOT_BE_SUPPRESSED"
            : decision.value.reason,
        };
      }
    }

    decisions.push(entry);
    if (entry.suppressed) reused.push(testId);
    else toRun.push(testId);
  }

  decisions.sort((a, b) => a.testId < b.testId ? -1 : a.testId > b.testId ? 1 : 0);
  let reusedTests = unique(reused);
  let testsToRun = unique(toRun);

  let state: ProofReusePlanState;
  if (input.validation.state === "BLOCKED") state = "BLOCKED";
  else if (indeterminate || input.validation.state === "INDETERMINATE") state = "INDETERMINATE";
  else if (reusedTests.length === 0) state = "NO_REUSE";
  else state = "READY";

  // A globally non-executable plan may carry diagnostic compatibility decisions, but it may not
  // authorize even partial suppression. This prevents consumers from ignoring the top-level state.
  if (state === "INDETERMINATE" || state === "BLOCKED") {
    reusedTests = [];
    testsToRun = selectedTests;
    for (let index = 0; index < decisions.length; index += 1) {
      const entry = decisions[index];
      if (entry !== undefined && entry.suppressed) {
        decisions[index] = Object.freeze({
          ...entry,
          suppressed: false,
          reason: `GLOBAL_${state}_NO_SUPPRESSION:${entry.reason}`,
        });
      }
    }
  }

  const bindings = {
    candidateDigest: input.candidateDigest,
    mapDigest: input.map.digest,
    validationPlanDigest: input.validation.digest,
    validationHandoffDigest: input.validation.handoff.digest,
    policyDigest: input.policyDigest,
    profileDigest: input.profileDigest,
    platform: input.platform,
  };

  const body = {
    state,
    selectedTests,
    reusedTests,
    testsToRun,
    decisions,
    finalSweepRequired: input.validation.finalSweepRequired,
    manufacturesProductionCredit: false as const,
    bindings,
  };
  const planDigest = digest(options, "PRP11", body);
  if (!planDigest.ok) return planDigest;

  const handoff = makeHandoff(input.candidateDigest, planDigest.value, options);
  if (!handoff.ok) return handoff;

  const frozenDecisions = Object.freeze(decisions.map((entry) => Object.freeze({ ...entry })));
  const frozenSelected = Object.freeze([...selectedTests]);
  const frozenReused = Object.freeze([...reusedTests]);
  const frozenToRun = Object.freeze([...testsToRun]);
  return ok(Object.freeze({
    ...body,
    selectedTests: frozenSelected,
    reusedTests: frozenReused,
    testsToRun: frozenToRun,
    decisions: frozenDecisions,
    bindings: Object.freeze(bindings),
    handoff: handoff.value,
    digest: planDigest.value,
  }));
}
