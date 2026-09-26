import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createCanonicalContinuationCapsule,
  buildCheckpointFreshnessVector,
  buildCheckpointPortabilityEnvelope,
  buildResumeReadinessCertificate,
  buildContinuationHandoffContract,
} from "../packages/checkpoint-engine/dist/public.js";
import {
  createResumeIntentCapsule,
  verifyContinuationHandoff,
  proveLineageContinuity,
  enforceResumeAuthorityBoundary,
  applyConversationIndependence,
  buildResumeMinimumSufficientContext,
  rehydrateHotState,
  buildContextTemperatureMap,
  buildResumeReadPlan,
  buildResumeDriftVector,
  detectOrphanWork,
  buildResumeConflictQuarantine,
  evaluateSafeReentry,
  buildResumeReceipt,
  buildSafeHandbackContract,
} from "../packages/resume-engine/dist/public.js";
import {
  createSourceBoundFieldClaim,
  createResponseSchemaEnvelope,
  createResponseContractCapsule,
  defaultMetricOwnershipMatrix,
  createBlockerProjection,
  createStateConflictWitness,
  createNextNecessaryActionCapsule,
  createResponseVerdictClaim,
  buildMachineResponseEnvelope,
  verifyMachineResponseEnvelope,
  buildHumanResponseProjection,
  verifyHumanResponseProjection,
} from "../packages/response-contract/dist/public.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const digest = { algorithm: "sha256", digest: value => createHash("sha256").update(value).digest("hex") };
const options = { digest };
const H = value => "sha256:" + createHash("sha256").update(value).digest("hex");
const matrixResult = defaultMetricOwnershipMatrix(options);
assert.equal(matrixResult.ok, true);
const matrix = matrixResult.value;

function resultValue(result) {
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}

function checkpointInput(overrides = {}) {
  return {
    schemaVersion: 1,
    projectId: "gef-bootstrap",
    moduleId: "GBS-M18",
    stageId: "WO009_IMPLEMENTATION",
    lineageId: "wo009-lineage",
    predecessorCheckpointDigest: H("previous-checkpoint"),
    admittedWorkOrderIds: ["GBS-V11-WO-009"],
    authorityBindings: [
      { bindingId: "source", domain: "SOURCE", semanticIdentity: H("1"), authorityRef: "repo:release-1.1", required: true },
      { bindingId: "policy", domain: "POLICY", semanticIdentity: H("2"), authorityRef: "policy:gef", required: true },
    ],
    policyBinding: {
      checkpointIdentity: "checkpoint-prev",
      policyFingerprint: H("policy-fingerprint"),
      decisionReceiptDigest: H("policy-decision"),
      exceptionDebtDigest: H("policy-debt"),
      policyIds: ["policy-1"],
      bindingDigest: H("policy-binding"),
    },
    claims: [
      { claimId: "claim-a", domain: "BUILD", status: "ACTIVE", maturity: 60, dependencyKeys: ["source:file-a"], authorityBindingIds: ["source", "policy"], evidenceRefs: ["ev:a"] },
      { claimId: "claim-b", domain: "BUILD", status: "DONE", maturity: 100, dependencyKeys: ["claim:claim-a"], authorityBindingIds: ["source"], evidenceRefs: ["ev:b"] },
    ],
    blockers: [],
    evidenceRefs: ["ev:root"],
    nextLegalAction: "RUN_WO_009_ASSURANCE",
    requiredCapabilities: ["node24"],
    ...overrides,
  };
}

function makeCheckpoint(overrides = {}) {
  return resultValue(createCanonicalContinuationCapsule(checkpointInput(overrides), options));
}

function canonical(checkpoint) {
  const freshness = resultValue(buildCheckpointFreshnessVector(checkpoint, { source: H("1"), policy: H("2") }, options));
  const portability = resultValue(buildCheckpointPortabilityEnvelope(checkpoint, ["node24"], options));
  const readiness = resultValue(buildResumeReadinessCertificate(checkpoint, freshness, portability, options));
  const handoff = resultValue(buildContinuationHandoffContract(checkpoint, readiness, options));
  return { freshness, portability, readiness, handoff };
}

function intent(checkpoint, overrides = {}) {
  return resultValue(createResumeIntentCapsule({
    resumeId: "resume-wo-009",
    projectId: checkpoint.projectId,
    expectedLineageId: checkpoint.lineageId,
    expectedCheckpointDigest: checkpoint.checkpointDigest,
    requestedNextAction: null,
    ...overrides,
  }, options));
}

function refs() {
  return [
    { refId: "checkpoint-core", dependencyKeys: ["checkpoint"], mandatory: true, preferredTemperature: "HOT" },
    { refId: "source-a", dependencyKeys: ["source:file-a", "claim:claim-a"], mandatory: true, preferredTemperature: "WARM" },
    { refId: "history-cold", dependencyKeys: ["history"], mandatory: false, preferredTemperature: "COLD" },
  ];
}

function observation(checkpoint, overrides = {}) {
  return {
    projectId: checkpoint.projectId,
    lineageId: checkpoint.lineageId,
    checkpointDigest: checkpoint.checkpointDigest,
    policyBindingDigest: checkpoint.policyBinding.bindingDigest,
    authorityIdentities: { source: H("1"), policy: H("2") },
    claimStates: { "claim-a": "ACTIVE:60", "claim-b": "DONE:100" },
    ...overrides,
  };
}

function resumeFixture(checkpoint = makeCheckpoint(), observed = {}) {
  const canonicalState = canonical(checkpoint);
  const resumeIntent = intent(checkpoint);
  const lineage = resultValue(proveLineageContinuity(resumeIntent, checkpoint, canonicalState.handoff, options));
  const authority = resultValue(enforceResumeAuthorityBoundary(resumeIntent, checkpoint, canonicalState.handoff, options));
  const conversation = resultValue(applyConversationIndependence([], {}, options));
  const context = resultValue(buildResumeMinimumSufficientContext(checkpoint, canonicalState.handoff, refs(), options));
  const hot = resultValue(rehydrateHotState([], canonicalState.handoff.handoffDigest, options));
  const temperature = resultValue(buildContextTemperatureMap(refs(), { "checkpoint-core": 100, "source-a": 80, "history-cold": 10 }, options));
  const readPlan = resultValue(buildResumeReadPlan(context, hot, temperature, options));
  const drift = resultValue(buildResumeDriftVector(checkpoint, observation(checkpoint, observed), options));
  const orphans = resultValue(detectOrphanWork(checkpoint, [], options));
  const quarantine = resultValue(buildResumeConflictQuarantine(drift, orphans, conversation, options));
  const decision = resultValue(evaluateSafeReentry(checkpoint, lineage, authority, canonicalState.readiness, drift, readPlan, orphans, options));
  const receipt = resultValue(buildResumeReceipt(resumeIntent, checkpoint, canonicalState.handoff, decision, readPlan, drift, orphans, quarantine, options));
  const handback = resultValue(buildSafeHandbackContract(decision, receipt, options));
  return {
    checkpoint, ...canonicalState, intent: resumeIntent, lineage, authority, conversation,
    context, hot, temperature, readPlan, drift, orphans, quarantine, decision, receipt, handback,
  };
}

function responseFor(fixture, settings = {}) {
  const checkpoint = fixture.checkpoint;
  const nextState = settings.nextState ?? (fixture.handback.nextLegalAction ? "KNOWN" : "UNKNOWN");
  const action = nextState === "KNOWN" ? fixture.handback.nextLegalAction : null;
  const actionSource = H("canonical-action-source:" + fixture.handoff.handoffDigest + ":" + nextState);
  const actionValidity = H("canonical-action-validity:" + fixture.handoff.handoffDigest);
  const nextAction = resultValue(createNextNecessaryActionCapsule(nextState, action, actionSource, actionValidity, options));
  const verdictName = settings.verdict ?? (fixture.decision.status === "READY" ? "SUCCESS" : "INDETERMINATE");
  const verdictClaim = resultValue(createResponseVerdictClaim(
    verdictName,
    H("canonical-verdict-source:" + checkpoint.checkpointDigest + ":" + verdictName),
    H("canonical-verdict-validity:" + fixture.receipt.receiptDigest),
    options,
  ));
  const validityBinding = H("canonical-field-validity:" + fixture.handoff.handoffDigest);
  const makeField = (name, value, freshness = "CURRENT", source = H("canonical-field-source:" + checkpoint.checkpointDigest + ":" + name)) =>
    resultValue(createSourceBoundFieldClaim({
      field: name,
      value,
      ownerDomain: "checkpoint",
      subjectId: name,
      sourceIdentityDigest: source,
      validityBindingDigest: validityBinding,
      freshness,
    }, options));
  const observedCheckpointDigest = settings.observedCheckpointDigest ?? checkpoint.checkpointDigest;
  const checkpointFreshness = settings.checkpointFreshness ?? "CURRENT";
  const fields = [
    makeField("project_id", checkpoint.projectId),
    makeField("phase", checkpoint.stageId),
    makeField("active_work_order", checkpoint.admittedWorkOrderIds.join(",")),
    makeField("checkpoint_digest", observedCheckpointDigest, checkpointFreshness, H("observed-checkpoint:" + observedCheckpointDigest)),
  ];
  const schema = resultValue(createResponseSchemaEnvelope("standard", ["structured"], options));
  const capsule = resultValue(createResponseContractCapsule({
    projectId: checkpoint.projectId,
    responseKind: "continuation",
    checkpointBindingDigest: checkpoint.checkpointDigest,
    resumeBindingDigest: fixture.receipt.receiptDigest,
    registryBindingDigest: H("project-registry:" + checkpoint.projectId),
    sourceClaims: fields,
    verdictInputDigest: verdictClaim.claimDigest,
    nextActionSourceDigest: actionSource,
    schema,
  }, options));
  const blockers = (settings.blockers ?? []).map((item, index) => resultValue(createBlockerProjection({
    blockerId: item.id,
    classification: "BLOCKING",
    disposition: "ACTIVE",
    sourceIdentityDigest: H("blocker-source:" + item.id + ":" + index),
    validityBindingDigest: validityBinding,
    freshness: "CURRENT",
    message: item.message,
  }, options)));
  const machine = resultValue(buildMachineResponseEnvelope({
    capsule,
    metrics: [],
    blockers,
    conflicts: settings.conflicts ?? [],
    nextAction,
    verdictClaim,
    requiredFields: ["project_id", "phase", "active_work_order", "checkpoint_digest"],
  }, matrix, options));
  const human = resultValue(buildHumanResponseProjection(machine, matrix, options));
  assert.equal(verifyMachineResponseEnvelope(machine, matrix, options).value, true);
  assert.equal(verifyHumanResponseProjection(human, machine, matrix, options).value, true);
  return { machine, human };
}

function assertSingularNextAction(response, expectedLine) {
  const lines = response.human.lines.filter(line => line.startsWith("next_action="));
  assert.deepEqual(lines, [expectedLine]);
  assert.equal(response.machine.nextAction.state === "KNOWN", expectedLine.startsWith("next_action=" + response.machine.nextAction.actionRef));
  assert.equal(response.human.semanticDigest, response.machine.semanticDigest);
}

test("CONT-RESUME-01: a new context resumes the canonical WO-009 action with no chat history", () => {
  const fixture = resumeFixture();
  assert.deepEqual(fixture.conversation.informationalClaimIds, []);
  assert.equal(fixture.conversation.authoritySource, "CANONICAL_CHECKPOINT_ONLY");
  assert.equal(fixture.decision.status, "READY");
  assert.equal(fixture.handback.nextLegalAction, fixture.checkpoint.nextLegalAction);
  const response = responseFor(fixture);
  assert.equal(response.machine.checkpointBindingDigest, fixture.checkpoint.checkpointDigest);
  assert.equal(response.machine.fields.find(field => field.field === "phase").value, fixture.checkpoint.stageId);
  assert.equal(response.machine.fields.find(field => field.field === "active_work_order").value, "GBS-V11-WO-009");
  assertSingularNextAction(response, "next_action=" + fixture.checkpoint.nextLegalAction);
});

test("CONT-RESUME-02: checkpoint and handoff conflict rejects lineage and emits no successor", () => {
  const fixture = resumeFixture();
  const forgedHandoff = { ...fixture.handoff, nextLegalAction: "SKIP_TO_RELEASE" };
  assert.equal(verifyContinuationHandoff(forgedHandoff, options).value, false);
  assert.equal(proveLineageContinuity(fixture.intent, fixture.checkpoint, forgedHandoff, options).ok, false);
  assert.equal(enforceResumeAuthorityBoundary(fixture.intent, fixture.checkpoint, forgedHandoff, options).ok, false);
  const conflict = resultValue(createStateConflictWitness(
    "checkpoint_handoff",
    [fixture.checkpoint.checkpointDigest, H("conflicting-checkpoint-source")],
    options,
  ));
  const response = responseFor(fixture, { nextState: "UNKNOWN", verdict: "CONFLICT", conflicts: [conflict] });
  assert.equal(response.machine.verdict.verdict, "CONFLICT");
  assert.equal(response.machine.nextAction.state, "UNKNOWN");
  assert.equal(response.machine.nextAction.actionRef, null);
  assertSingularNextAction(response, "next_action=UNKNOWN");
});

test("CONT-RESUME-03: a stale observed head requires replan and has no legal successor", () => {
  const staleObservedHead = H("branch-head-advanced");
  const fixture = resumeFixture(makeCheckpoint(), { checkpointDigest: staleObservedHead });
  assert.equal(fixture.drift.hasMaterialDrift, true);
  assert.equal(fixture.decision.status, "DRIFT_REQUIRES_REPLAN");
  assert.equal(fixture.handback.nextLegalAction, null);
  const response = responseFor(fixture, {
    nextState: "UNKNOWN",
    verdict: "INDETERMINATE",
    observedCheckpointDigest: staleObservedHead,
    checkpointFreshness: "STALE",
  });
  assert.equal(response.machine.verdict.verdict, "INDETERMINATE");
  assert.equal(response.machine.nextAction.actionRef, null);
  assertSingularNextAction(response, "next_action=UNKNOWN");
});

test("CONT-RESUME-04: planning, implementation, verification, review and blocked states keep one canonical action", () => {
  const phases = [
    ["PLANNING", "DEFINE_ADMITTED_WORK_ORDER"],
    ["IMPLEMENTATION", "EXECUTE_ADMITTED_SCOPE"],
    ["VERIFICATION", "RUN_REQUIRED_TEST_MATRIX"],
    ["REVIEW", "OWNER_AUDIT_EXACT_HEAD"],
  ];
  for (const [phase, action] of phases) {
    const fixture = resumeFixture(makeCheckpoint({
      stageId: phase,
      nextLegalAction: action,
    }));
    assert.equal(fixture.decision.status, "READY");
    const response = responseFor(fixture);
    assert.equal(response.machine.fields.find(field => field.field === "phase").value, phase);
    assert.equal(response.machine.nextAction.actionRef, action);
    assertSingularNextAction(response, "next_action=" + action);
  }

  const blockedFixture = resumeFixture(makeCheckpoint({
    stageId: "BLOCKED",
    blockers: ["REQUIRED_GATE_NOT_SATISFIED"],
    nextLegalAction: "RETRY_AFTER_GATE",
  }));
  assert.equal(blockedFixture.decision.status, "POLICY_BLOCKED");
  assert.equal(blockedFixture.handback.nextLegalAction, null);
  const blockedResponse = responseFor(blockedFixture, {
    nextState: "NONE",
    verdict: "BLOCKED",
    blockers: [{ id: "required-gate", message: "A required Work Order gate is unresolved" }],
  });
  assert.equal(blockedResponse.machine.verdict.verdict, "BLOCKED");
  assert.equal(blockedResponse.machine.nextAction.state, "NONE");
  assertSingularNextAction(blockedResponse, "next_action=NONE");
});

test("construction instructions make the canonical continuation mandatory for fresh chats", () => {
  const agents = readFileSync(resolve(ROOT, "AGENTS.md"), "utf8");
  const runbook = readFileSync(resolve(ROOT, "docs/V1.1-OPERATIONS-RUNBOOK.md"), "utf8");
  assert.match(agents, /Fresh-context construction routing/);
  assert.match(agents, /chat history.*informational/i);
  assert.match(agents, /one canonical next necessary action/i);
  assert.match(runbook, /Start every new project chat from canonical state/);
  assert.match(runbook, /NONE\/UNKNOWN/);
});
