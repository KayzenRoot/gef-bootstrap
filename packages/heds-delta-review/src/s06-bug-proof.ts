import type {
  BugProofDisposition,
  BugProofEvaluationInput,
  BugProofProbeEvidenceReceipt,
  BugProofProofState,
  BugProofReceipt,
  BugProofReplayGuard,
  BugProofReplayState,
  BugProofTestImpactInput,
} from './bug-proof-types.js';
import type { OperationOptions, Result, SemanticFinding } from './types.js';
import { createDownstreamProofHandoff, evaluateProofGraph } from '@gef-bootstrap/proof-graph';
import { createHedsFindingRegister } from './s05-finding.js';
import { verifyM25ProofHandoff } from './s02-source.js';
import { createSemanticFinding } from './s03-review.js';
import {
  compareCodePoint,
  deepFreeze,
  digestValue,
  fail,
  Guard,
  isSha256,
  ok,
  sortedUnique,
  stableStringify,
  validId,
} from './utils.js';

const LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;
const PROOF_STATES = new Set<BugProofProofState>(['PROVEN', 'UNPROVEN', 'STALE', 'CONFLICT', 'INDETERMINATE', 'TRUNCATED']);
const levelRank = (level: string) => LEVELS.indexOf(level as typeof LEVELS[number]);

function uncertaintyValidationFloor(uncertainty: BugProofTestImpactInput['result']['selection']['uncertainty']): number {
  if (uncertainty === 'BOUNDARY') return 3;
  if (uncertainty === 'SYSTEMIC' || uncertainty === 'CONFLICT' || uncertainty === 'UNKNOWN' || uncertainty === 'TRUNCATED') return 4;
  return 0;
}

function findingProjection(disposition: BugProofDisposition): { state: 'OPEN' | 'RESOLVED' | 'INDETERMINATE'; ruleId: string } {
  switch (disposition) {
    case 'REPRODUCED_DEFECT': return { state: 'OPEN', ruleId: 'U12-04-REPRODUCED-DEFECT' };
    case 'FALSE_POSITIVE': return { state: 'RESOLVED', ruleId: 'U12-04-FALSE-POSITIVE' };
    case 'HYPOTHESIS': return { state: 'INDETERMINATE', ruleId: 'U12-04-UNRESOLVED-HYPOTHESIS' };
    case 'INDETERMINATE': return { state: 'INDETERMINATE', ruleId: 'U12-04-INDETERMINATE' };
  }
}

function replayState(conflicts: ReadonlySet<string>, doubleCountedEvidence: ReadonlySet<string>, historyTruncated: boolean): BugProofReplayState {
  if (conflicts.size > 0 || doubleCountedEvidence.size > 0) return 'CONFLICT';
  return historyTruncated ? 'TRUNCATED' : 'CLEAR';
}

function sameSet(left: readonly string[], right: readonly string[]) {
  return sortedUnique(left).join('\u0000') === sortedUnique(right).join('\u0000');
}

function isCanonical(values: readonly string[]) {
  const normalized = sortedUnique(values);
  return values.length === normalized.length && values.every((value, index) => value === normalized[index]);
}

function digestM28(options: OperationOptions, kind: string, payload: unknown): Result<string> {
  if (options.digest.algorithm !== 'sha256') return fail('BPE26_M28_DIGEST_ALGORITHM', 'M28 proof binding requires SHA-256.', kind);
  try {
    const raw = options.digest.digest(`GEF:M28:${kind}\n${stableStringify(payload)}`);
    if (!/^[0-9a-f]{64}$/i.test(raw)) return fail('BPE26_M28_DIGEST_OUTPUT', 'M28 digest did not return SHA-256 hex.', kind);
    return ok(`sha256:${raw.toLowerCase()}`);
  } catch {
    return fail('BPE26_M28_DIGEST_FAILED', 'M28 digest capability failed.', kind);
  }
}

function validateTestImpactInput(input: BugProofTestImpactInput): Result<true> {
  const { result, handoff } = input;
  const selection = result.selection;
  if (result.waves.length > 4096 || selection.tests.length > 16384 || result.unresolved.length > 16384 || result.reusableTests.length > 16384) {
    return fail('BPE26_M28_INPUT_LIMIT', 'M28 selection exceeds the bounded Bug Proof input limit.');
  }
  if (![input.candidateDigest, input.mapDigest, input.policyDigest, input.profileDigest].every(isSha256)
    || !validId(input.platform)
    || levelRank(input.requiredLevel) < 0
    || handoff.consumerId !== 'M26_HEDS'
    || handoff.authority !== 'READ_ONLY_TEST_IMPACT'
    || handoff.candidateDigest !== input.candidateDigest
    || handoff.resultDigest !== result.digest
    || !isSha256(handoff.digest)) {
    return fail('BPE26_M28_BINDING_INVALID', 'M28 test-impact binding is malformed or crosses candidate context.');
  }
  if (!['READY', 'WIDENED', 'CORRECTION_REQUIRED', 'BLOCKED', 'INDETERMINATE', 'TRUNCATED'].includes(result.state)
    || levelRank(selection.level) < 0
    || !['NONE', 'LOCAL', 'BOUNDARY', 'SYSTEMIC', 'CONFLICT', 'UNKNOWN', 'TRUNCATED'].includes(selection.uncertainty)) {
    return fail('BPE26_M28_STATE_INVALID', 'M28 state, validation level, or uncertainty is invalid.');
  }
  if (!isCanonical(selection.tests) || !isCanonical(selection.reasons)
    || !isCanonical(result.reusableTests) || !isCanonical(result.unresolved)) {
    return fail('BPE26_M28_SELECTION_ORDER', 'M28 target, reason and result sets must be canonical and unique.');
  }
  if (input.mandatoryTargetIds.length > 16384 || input.finalAssuranceTargetIds.length > 16384
    || input.mandatoryTargetIds.length !== sortedUnique(input.mandatoryTargetIds).length
    || input.finalAssuranceTargetIds.length !== sortedUnique(input.finalAssuranceTargetIds).length) {
    return fail('BPE26_M28_REQUIRED_TARGETS_INVALID', 'Mandatory and assurance targets must be bounded, canonical unique IDs.');
  }
  if ([...selection.tests, ...result.reusableTests, ...result.unresolved, ...input.mandatoryTargetIds, ...input.finalAssuranceTargetIds].some(id => !validId(id))) {
    return fail('BPE26_M28_TARGET_ID_INVALID', 'M28 target identifier is invalid.');
  }
  return ok(true);
}

function verifyTestImpactDigests(input: BugProofTestImpactInput, options: OperationOptions): Result<true> {
  const { result, handoff } = input;
  const selection = result.selection;
  const selectionBody = {
    tests: selection.tests,
    level: selection.level,
    uncertainty: selection.uncertainty,
    reasons: selection.reasons,
    map: input.mapDigest,
    policy: input.policyDigest,
    profile: input.profileDigest,
    platform: input.platform,
  };
  const selectionDigest = digestM28(options, 'TSP28', selectionBody);
  if (!selectionDigest.ok) return selectionDigest;
  if (selectionDigest.value !== selection.digest) return fail('BPE26_M28_SELECTION_TAMPERED', 'M28 selection digest does not match its exact map, policy and platform context.');

  for (const wave of result.waves) {
    if (!validId(wave.id) || !isCanonical(wave.tests) || !isCanonical(wave.after) || !isCanonical(wave.exclusiveResources)
      || [...wave.tests, ...wave.after, ...wave.exclusiveResources].some(id => !validId(id))) {
      return fail('BPE26_M28_WAVE_INVALID', 'M28 validation wave must contain canonical bounded IDs.', wave.id);
    }
    const waveDigest = digestM28(options, 'VWS28', { tests: wave.tests, after: wave.after, exclusiveResources: wave.exclusiveResources });
    if (!waveDigest.ok) return waveDigest;
    if (waveDigest.value !== wave.id) return fail('BPE26_M28_WAVE_TAMPERED', 'M28 validation wave digest is invalid.', wave.id);
  }
  const resultDigest = digestM28(options, 'TIR28', {
    state: result.state,
    selection: result.selection,
    reusableTests: result.reusableTests,
    unresolved: result.unresolved,
    waves: result.waves,
  });
  if (!resultDigest.ok) return resultDigest;
  if (resultDigest.value !== result.digest) return fail('BPE26_M28_RESULT_TAMPERED', 'M28 result does not recompute from its selected targets and uncertainty.');
  const handoffDigest = digestM28(options, 'TIH28', {
    consumerId: handoff.consumerId,
    candidateDigest: handoff.candidateDigest,
    resultDigest: handoff.resultDigest,
    authority: 'READ_ONLY_TEST_IMPACT' as const,
  });
  if (!handoffDigest.ok) return handoffDigest;
  if (handoffDigest.value !== handoff.digest) return fail('BPE26_M28_HANDOFF_TAMPERED', 'M28 candidate handoff does not recompute.');
  return ok(true);
}

function validateTestImpactAssurance(input: BugProofTestImpactInput): Result<true> {
  const { result } = input;
  const selection = result.selection;
  if (levelRank(selection.level) < levelRank(input.requiredLevel)) return fail('BPE26_ASSURANCE_FLOOR_DOWNGRADE', 'Test selection fell below its declared assurance floor.');
  const uncertaintyFloor = uncertaintyValidationFloor(selection.uncertainty);
  if (levelRank(selection.level) < uncertaintyFloor) return fail('BPE26_UNCERTAINTY_NOT_WIDENED', 'M28 uncertainty did not conservatively widen the validation level.');
  const selected = new Set(selection.tests);
  for (const target of [...input.mandatoryTargetIds, ...input.finalAssuranceTargetIds]) {
    if (!selected.has(target)) return fail('BPE26_REQUIRED_TARGET_OMITTED', 'M28 selection omitted a mandatory or final-assurance target.', target);
  }
  if (result.unresolved.length > 0 && !['BLOCKED', 'INDETERMINATE', 'TRUNCATED'].includes(result.state)) {
    return fail('BPE26_UNRESOLVED_RESULT_OPTIMISTIC', 'M28 unresolved work cannot be represented as a ready result.');
  }
  if (selection.uncertainty !== 'NONE' && result.state === 'READY') {
    return fail('BPE26_RESULT_STATE_MISMATCH', 'M28 result state conflicts with its selection uncertainty.');
  }
  return ok(true);
}

function verifyTestImpact(input: BugProofTestImpactInput, options: OperationOptions): Result<true> {
  const validInput = validateTestImpactInput(input);
  if (!validInput.ok) return validInput;
  const validDigests = verifyTestImpactDigests(input, options);
  if (!validDigests.ok) return validDigests;
  return validateTestImpactAssurance(input);
}

function receiptPayload(receipt: BugProofReceipt) {
  const { receiptDigest: _receiptDigest, ...body } = receipt;
  return body;
}

function validateReceiptIdentity(receipt: BugProofReceipt): Result<true> {
  if (!validId(receipt.bugProofId) || !validId(receipt.findingId) || !isSha256(receipt.hypothesisDigest)
    || !validId(receipt.requirementClaimId) || !validId(receipt.invariantClaimId) || !validId(receipt.hypothesisClaimId)
    || !isSha256(receipt.sourceIdentityDigest) || !isSha256(receipt.proofPolicyDigest) || !isSha256(receipt.sourceAuthorityDigest)
    || !isSha256(receipt.proofSnapshotDigest) || !isSha256(receipt.proofEvaluationDigest) || !isSha256(receipt.m24ContextDigest)
    || !isSha256(receipt.testImpactResultDigest) || !isSha256(receipt.testImpactHandoffDigest) || !isSha256(receipt.receiptDigest)
    || !['HYPOTHESIS', 'REPRODUCED_DEFECT', 'FALSE_POSITIVE', 'INDETERMINATE'].includes(receipt.disposition)
    || !['READY', 'WIDENED', 'CORRECTION_REQUIRED', 'BLOCKED', 'INDETERMINATE', 'TRUNCATED'].includes(receipt.testImpactState)
    || !['NONE', 'LOCAL', 'BOUNDARY', 'SYSTEMIC', 'CONFLICT', 'UNKNOWN', 'TRUNCATED'].includes(receipt.testImpactUncertainty)
    || levelRank(receipt.testImpactValidationLevel) < 0 || levelRank(receipt.testImpactRequiredLevel) < 0) {
    return fail('BPR26_RECEIPT_INVALID', 'Bug-proof replay contains an invalid receipt.', receipt.bugProofId);
  }
  return ok(true);
}

function validateReceiptContext(receipt: BugProofReceipt): Result<true> {
  const targets = [...receipt.selectedTargetIds, ...receipt.mandatoryTargetIds, ...receipt.finalAssuranceTargetIds, ...receipt.unresolvedTestIds];
  const invalidInvalidation = receipt.invalidationVectorDigest === null
    ? receipt.invalidationChangedDependencyDigests.length > 0 || receipt.invalidationKnowledgeComplete !== null
    : !isSha256(receipt.invalidationVectorDigest) || receipt.invalidationChangedDependencyDigests.length === 0 || receipt.invalidationKnowledgeComplete === null;
  if (receipt.probeEvidence.length > 4096 || receipt.invalidationChangedDependencyDigests.length > 16384
    || !isCanonical(receipt.invalidationChangedDependencyDigests) || !isCanonical(receipt.selectedTargetIds)
    || !isCanonical(receipt.mandatoryTargetIds) || !isCanonical(receipt.finalAssuranceTargetIds)
    || !isCanonical(receipt.unresolvedTestIds) || !isCanonical(receipt.falsePositiveEvidenceIds) || !isCanonical(receipt.reasonCodes)
    || targets.some(id => !validId(id)) || receipt.invalidationChangedDependencyDigests.some(digest => !isSha256(digest))
    || receipt.reasonCodes.some(code => typeof code !== 'string' || !/^[A-Z0-9_:-]{1,128}$/.test(code)) || invalidInvalidation) {
    return fail('BPR26_CONTEXT_INVALID', 'Bug-proof replay contains malformed invalidation or selection context.', receipt.bugProofId);
  }
  return ok(true);
}

function validateReceiptProbeEvidence(receipt: BugProofReceipt, proofStates: readonly BugProofProofState[]): Result<true> {
  if (proofStates.some(state => !PROOF_STATES.has(state))) {
    return fail('BPR26_PROOF_STATE_INVALID', 'Bug-proof replay contains an unknown M25 proof state.', receipt.bugProofId);
  }
  for (const probe of receipt.probeEvidence) {
    const invalidRoleOrOutcome = !['POSITIVE', 'NEGATIVE'].includes(probe.role)
      || (probe.role === 'POSITIVE' && probe.expectedOutcome !== 'DEFECT_PRESENT')
      || (probe.role === 'NEGATIVE' && probe.expectedOutcome !== 'DEFECT_ABSENT')
      || !['DEFECT_PRESENT', 'DEFECT_ABSENT', 'NOT_RUN'].includes(probe.observedOutcome);
    if (!validId(probe.probeId) || !validId(probe.targetId) || !validId(probe.evidenceId)
      || !isSha256(probe.evidenceSemanticDigest) || invalidRoleOrOutcome
      || !PROOF_STATES.has(probe.proofState) || probe.accepted !== (probe.proofState === 'PROVEN')) {
      return fail('BPR26_PROBE_EVIDENCE_INVALID', 'Bug-proof replay contains an invalid or inconsistent probe/evidence binding.', receipt.bugProofId);
    }
  }
  return ok(true);
}

function receiptTargetsAreSelected(receipt: BugProofReceipt): boolean {
  const requiredTargets = [...receipt.probeEvidence.map(probe => probe.targetId), ...receipt.mandatoryTargetIds, ...receipt.finalAssuranceTargetIds];
  return requiredTargets.every(target => receipt.selectedTargetIds.includes(target));
}

function receiptHasCurrentReadyImpact(receipt: BugProofReceipt): boolean {
  return receipt.testImpactState === 'READY' && receipt.testImpactUncertainty === 'NONE'
    && receipt.unresolvedTestIds.length === 0
    && levelRank(receipt.testImpactValidationLevel) >= levelRank(receipt.testImpactRequiredLevel)
    && receipt.invalidationKnowledgeComplete !== false && receiptTargetsAreSelected(receipt);
}

function receiptProofIsProven(proofStates: readonly BugProofProofState[]): boolean {
  return proofStates.every(state => state === 'PROVEN');
}

function receiptProbesAreAccepted(receipt: BugProofReceipt): boolean {
  return receipt.probeEvidence.every(probe => probe.accepted);
}

function validateReproducedReceipt(receipt: BugProofReceipt, proofStates: readonly BugProofProofState[]): Result<true> {
  if (receipt.disposition !== 'REPRODUCED_DEFECT') return ok(true);
  const positives = receipt.probeEvidence.filter(probe => probe.role === 'POSITIVE');
  const negatives = receipt.probeEvidence.filter(probe => probe.role === 'NEGATIVE');
  const invalidEvidence = !receiptProofIsProven(proofStates) || !receiptProbesAreAccepted(receipt)
    || positives.length === 0 || negatives.length === 0
    || positives.some(probe => probe.observedOutcome !== 'DEFECT_PRESENT')
    || negatives.some(probe => probe.observedOutcome !== 'DEFECT_ABSENT');
  if (receipt.finding.state !== 'OPEN' || receipt.finding.ruleId !== 'U12-04-REPRODUCED-DEFECT'
    || invalidEvidence || !receiptHasCurrentReadyImpact(receipt)) {
    return fail('BPR26_DISPOSITION_MISMATCH', 'Only an OPEN U12-04 reproduced-defect finding may carry that disposition.', receipt.bugProofId);
  }
  return ok(true);
}

function validateFalsePositiveReceipt(receipt: BugProofReceipt, proofStates: readonly BugProofProofState[]): Result<true> {
  if (receipt.disposition !== 'FALSE_POSITIVE') {
    if (receipt.falsePositiveRationale !== null || receipt.falsePositiveEvidenceIds.length !== 0) {
      return fail('BPR26_FALSE_POSITIVE_UNEXPECTED', 'Non-false-positive receipt contains an unclassified adjudication.', receipt.bugProofId);
    }
    return ok(true);
  }
  const acceptedPositiveEvidence = new Set(receipt.probeEvidence
    .filter(probe => probe.role === 'POSITIVE' && probe.accepted && probe.observedOutcome === 'DEFECT_ABSENT')
    .map(probe => probe.evidenceId));
  const rationale = receipt.falsePositiveRationale;
  const validRationale = rationale !== null && rationale.trim().length >= 8 && rationale.trim().length <= 2048;
  const validEvidence = receipt.falsePositiveEvidenceIds.length > 0 && receipt.falsePositiveEvidenceIds.length <= 4096
    && receipt.falsePositiveEvidenceIds.every(id => acceptedPositiveEvidence.has(id));
  const validControls = receipt.probeEvidence.filter(probe => probe.role === 'NEGATIVE').every(probe => probe.observedOutcome === 'DEFECT_ABSENT')
    && receipt.probeEvidence.filter(probe => probe.role === 'POSITIVE').every(probe => probe.observedOutcome === 'DEFECT_ABSENT');
  if (receipt.finding.state !== 'RESOLVED' || receipt.finding.ruleId !== 'U12-04-FALSE-POSITIVE'
    || !validRationale || !validEvidence || receipt.predecessorFindingDigest === null
    || !receiptProofIsProven(proofStates) || !receiptProbesAreAccepted(receipt) || !validControls
    || !receiptHasCurrentReadyImpact(receipt)) {
    return fail('BPR26_FALSE_POSITIVE_LINEAGE_INVALID', 'False-positive replay requires accepted evidence, rationale and predecessor lineage.', receipt.bugProofId);
  }
  return ok(true);
}

function validateHypothesisReceipt(receipt: BugProofReceipt, proofStates: readonly BugProofProofState[]): Result<true> {
  if (['HYPOTHESIS', 'INDETERMINATE'].includes(receipt.disposition) && receipt.finding.state !== 'INDETERMINATE') {
    return fail('BPR26_HYPOTHESIS_FINDING_INVALID', 'An unreproduced hypothesis must remain an indeterminate finding.', receipt.bugProofId);
  }
  const positiveReproduction = receipt.probeEvidence.filter(probe => probe.role === 'POSITIVE')
    .every(probe => probe.observedOutcome === 'DEFECT_PRESENT');
  const negativeControlsHold = receipt.probeEvidence.filter(probe => probe.role === 'NEGATIVE')
    .every(probe => probe.observedOutcome === 'DEFECT_ABSENT');
  const hypothesisSuppressesReproduction = receipt.disposition === 'HYPOTHESIS' && receiptProbesAreAccepted(receipt)
    && receiptProofIsProven(proofStates) && receiptHasCurrentReadyImpact(receipt)
    && negativeControlsHold && positiveReproduction;
  if (hypothesisSuppressesReproduction) {
    return fail('BPR26_REPRODUCTION_SUPPRESSED', 'A fully current positive reproduction cannot be replayed as an unresolved hypothesis.', receipt.bugProofId);
  }
  return ok(true);
}

function validateUniqueEvidenceIds(receipt: BugProofReceipt): Result<true> {
  const ids = receipt.probeEvidence.map(probe => probe.evidenceId);
  if (ids.some(id => !validId(id)) || ids.length !== sortedUnique(ids).length) {
    return fail('BPR26_EVIDENCE_DOUBLE_COUNT', 'A bug-proof receipt must retain each evidence identity once.', receipt.bugProofId);
  }
  return ok(true);
}

function verifyReceipt(receipt: BugProofReceipt, options: OperationOptions): Result<true> {
  const identity = validateReceiptIdentity(receipt);
  if (!identity.ok) return identity;
  const expected = digestValue(options, 'BPE26', receiptPayload(receipt));
  if (!expected.ok) return expected;
  if (expected.value !== receipt.receiptDigest) return fail('BPR26_RECEIPT_TAMPERED', 'Bug-proof receipt does not match its semantic digest.', receipt.bugProofId);
  const { findingDigest: _findingDigest, ...findingInput } = receipt.finding;
  const verifiedFinding = createSemanticFinding(findingInput, options);
  if (!verifiedFinding.ok) return verifiedFinding;
  if (verifiedFinding.value.findingDigest !== receipt.finding.findingDigest
    || receipt.finding.findingId !== receipt.findingId
    || receipt.predecessorFindingDigest !== receipt.finding.supersedesFindingDigest) {
    return fail('BPR26_FINDING_BINDING_INVALID', 'Bug-proof finding identity or predecessor lineage does not match the receipt.', receipt.bugProofId);
  }
  const proofStates = [receipt.requirementProofState, receipt.invariantProofState, receipt.hypothesisProofState];
  const context = validateReceiptContext(receipt);
  if (!context.ok) return context;
  const probes = validateReceiptProbeEvidence(receipt, proofStates);
  if (!probes.ok) return probes;
  const reproduced = validateReproducedReceipt(receipt, proofStates);
  if (!reproduced.ok) return reproduced;
  const falsePositive = validateFalsePositiveReceipt(receipt, proofStates);
  if (!falsePositive.ok) return falsePositive;
  const hypothesis = validateHypothesisReceipt(receipt, proofStates);
  if (!hypothesis.ok) return hypothesis;
  const evidenceIds = validateUniqueEvidenceIds(receipt);
  if (!evidenceIds.ok) return evidenceIds;
  return ok(true);
}

function validateBugProofHeader(input: BugProofEvaluationInput): Result<true> {
  if (input.probes.length > 4096) return fail('BPE26_PROBE_LIMIT', 'Bug-proof probe/control count exceeds its bounded limit.', input.bugProofId);
  for (const id of [input.bugProofId, input.requirementClaimId, input.invariantClaimId, input.hypothesisClaimId, input.findingId, input.subjectId]) {
    if (!validId(id)) return fail('BPE26_ID_INVALID', 'Bug-proof identity contains an invalid stable ID.', id);
  }
  if (!isSha256(input.sourceIdentityDigest) || input.probes.length < 2) {
    return fail('BPE26_INPUT_INCOMPLETE', 'Bug-proof requires an exact source identity and positive plus negative probes.', input.bugProofId);
  }
  const positive = input.probes.filter(probe => probe.role === 'POSITIVE');
  const negative = input.probes.filter(probe => probe.role === 'NEGATIVE');
  if (positive.length === 0 || negative.length === 0) return fail('BPE26_CONTROLS_REQUIRED', 'At least one positive probe and one retained negative control are required.', input.bugProofId);
  return ok(true);
}

function validateProbe(probe: BugProofEvaluationInput['probes'][number], guard: Guard,
  identities: { probeIds: Set<string>; targetIds: Set<string>; evidenceIds: Set<string> }): Result<true> {
  const { probeIds, targetIds, evidenceIds } = identities;
  const step = guard.step(`probe:${probe.probeId}`);
  if (!step.ok) return step;
  if (!validId(probe.probeId) || !validId(probe.targetId) || !validId(probe.evidenceId)) return fail('BPE26_PROBE_ID_INVALID', 'Probe, M28 target and M24 evidence IDs must be stable.', probe.probeId);
  if (probeIds.has(probe.probeId) || targetIds.has(probe.targetId) || evidenceIds.has(probe.evidenceId)) return fail('BPE26_PROBE_DUPLICATE', 'Probe, target and evidence identities cannot be counted more than once.', probe.probeId);
  probeIds.add(probe.probeId);
  targetIds.add(probe.targetId);
  evidenceIds.add(probe.evidenceId);
  if (!['POSITIVE', 'NEGATIVE'].includes(probe.role)) return fail('BPE26_PROBE_ROLE_INVALID', 'Probe role must be explicitly positive or negative.', probe.probeId);
  if ((probe.role === 'POSITIVE' && probe.expectedOutcome !== 'DEFECT_PRESENT') || (probe.role === 'NEGATIVE' && probe.expectedOutcome !== 'DEFECT_ABSENT')) {
    return fail('BPE26_EXPECTATION_ROLE_MISMATCH', 'Probe expectation conflicts with its declared positive/negative role.', probe.probeId);
  }
  if (!['DEFECT_PRESENT', 'DEFECT_ABSENT', 'NOT_RUN'].includes(probe.observedOutcome)) return fail('BPE26_OUTCOME_INVALID', 'Probe observation is invalid.', probe.probeId);
  return ok(true);
}

function validateBugProofProbes(input: BugProofEvaluationInput, guard: Guard): Result<Set<string>> {
  const probeIds = new Set<string>();
  const targetIds = new Set<string>();
  const evidenceIds = new Set<string>();
  const identities = { probeIds, targetIds, evidenceIds };
  for (const probe of input.probes) {
    const valid = validateProbe(probe, guard, identities);
    if (!valid.ok) return valid;
  }
  return ok(targetIds);
}

function validateBugProofTestSelection(input: BugProofEvaluationInput, options: OperationOptions): Result<true> {
  const impact = verifyTestImpact(input.testImpact, options);
  if (!impact.ok) return impact;
  if (input.testImpact.candidateDigest !== input.sourceIdentityDigest) return fail('BPE26_CANDIDATE_SOURCE_MISMATCH', 'M28 candidate does not match the exact hypothesis source identity.', input.bugProofId);
  const selectedTargets = new Set(input.testImpact.result.selection.tests);
  for (const probe of input.probes) {
    if (!selectedTargets.has(probe.targetId)) return fail('BPE26_PROBE_TARGET_OMITTED', 'M28 did not select every declared positive and negative probe target.', probe.targetId);
  }
  return ok(true);
}

function validateBugProofInput(input: BugProofEvaluationInput, guard: Guard, options: OperationOptions): Result<true> {
  const header = validateBugProofHeader(input);
  if (!header.ok) return header;
  const probes = validateBugProofProbes(input, guard);
  if (!probes.ok) return probes;
  return validateBugProofTestSelection(input, options);
}

function validateM24M25ContextAndClaims(input: BugProofEvaluationInput): Result<true> {
  const { computation, proofSnapshot } = input;
  const manifest = computation.manifest;
  const firstEvaluation = computation.m24.evaluations[0];
  if (!firstEvaluation || manifest.projectId !== firstEvaluation.intent.projectId || manifest.lineageId !== firstEvaluation.intent.lineageId) {
    return fail('BPE26_M24_PROJECT_LINEAGE_MISMATCH', 'M24 and M25 project/lineage contexts do not match.', input.bugProofId);
  }
  if (proofSnapshot.projectId !== manifest.projectId || proofSnapshot.lineageId !== manifest.lineageId
    || proofSnapshot.proofPolicyDigest !== manifest.proofPolicyDigest) {
    return fail('BPE26_PROOF_CONTEXT_MISMATCH', 'Proof snapshot, manifest and evidence context do not share one exact project/proof context.', input.bugProofId);
  }
  if (input.currentProofSnapshotDigest !== proofSnapshot.snapshotDigest) return fail('BPE26_PROOF_SNAPSHOT_STALE', 'Bug proof requires the exact current M25 snapshot.', input.bugProofId);

  const claims = new Map(manifest.claims.map(claim => [claim.claimId, claim]));
  const requirement = claims.get(input.requirementClaimId);
  const invariant = claims.get(input.invariantClaimId);
  const hypothesis = claims.get(input.hypothesisClaimId);
  if (!requirement || !invariant || !hypothesis) return fail('BPE26_CLAIM_MISSING', 'Requirement, invariant and hypothesis must be canonical M25 claims.', input.bugProofId);
  for (const claim of [requirement, invariant, hypothesis]) {
    if (claim.projectId !== manifest.projectId || claim.lineageId !== manifest.lineageId
      || claim.proofPolicyDigest !== manifest.proofPolicyDigest || claim.sourceIdentityDigest !== input.sourceIdentityDigest) {
      return fail('BPE26_CLAIM_CONTEXT_MISMATCH', 'Requirement/invariant/hypothesis claim crosses exact source, project, lineage or proof policy.', claim.claimId);
    }
  }
  const obligations = new Map(manifest.obligations.map(obligation => [obligation.claimId, obligation]));
  const requirementObligation = obligations.get(input.requirementClaimId);
  const invariantObligation = obligations.get(input.invariantClaimId);
  const hypothesisObligation = obligations.get(input.hypothesisClaimId);
  if (!requirementObligation?.applicable || !requirementObligation.required || requirementObligation.mode !== 'ALL') {
    return fail('BPE26_REQUIREMENT_OBLIGATION_INVALID', 'Requirement claim must have an applicable required M25 obligation.', input.requirementClaimId);
  }
  if (invariantObligation?.applicable !== true || !invariantObligation.required || invariantObligation.mode !== 'ALL'
    || invariantObligation.dependencies.length !== 1 || invariantObligation.dependencies[0]?.kind !== 'CLAIM'
    || invariantObligation.dependencies[0]?.id !== input.requirementClaimId) {
    return fail('BPE26_REQUIREMENT_INVARIANT_LINK_MISSING', 'M25 invariant must depend on the declared requirement claim.', input.invariantClaimId);
  }
  const expectedEvidence = sortedUnique(input.probes.map(probe => probe.evidenceId));
  const actualEvidence = hypothesisObligation?.dependencies.filter(dependency => dependency.kind === 'EVIDENCE').map(dependency => dependency.id) ?? [];
  const claimDependencies = hypothesisObligation?.dependencies.filter(dependency => dependency.kind === 'CLAIM').map(dependency => dependency.id) ?? [];
  if (!hypothesisObligation?.applicable || !hypothesisObligation.required || hypothesisObligation.mode !== 'ALL'
    || !sameSet(actualEvidence, expectedEvidence) || !sameSet(claimDependencies, [input.invariantClaimId])
    || hypothesisObligation.dependencies.length !== expectedEvidence.length + 1) {
    return fail('BPE26_HYPOTHESIS_OBLIGATION_INCOMPLETE', 'Hypothesis obligation must require the invariant and every declared M24 probe/control evidence item.', input.hypothesisClaimId);
  }
  return ok(true);
}

type ProofGraphEvaluation = Extract<ReturnType<typeof evaluateProofGraph>, { ok: true }>['value'];
type ClaimProofResult = ProofGraphEvaluation['results'][number];
type BugProofProofFacts = {
  manifest: BugProofEvaluationInput['computation']['manifest'];
  evaluation: ProofGraphEvaluation;
  sourceAuthorityDigest: string;
  requirementProof: ClaimProofResult;
  invariantProof: ClaimProofResult;
  hypothesisProof: ClaimProofResult;
};
type BugProofEvidenceEntry = { semanticDigest: string; sourceIdentityDigest: string; claimIds: readonly string[]; kind: string; subjectId: string };

function evaluateM25Proof(input: BugProofEvaluationInput, proofOptions: import('@gef-bootstrap/proof-graph').OperationOptions,
  options: OperationOptions): Result<BugProofProofFacts> {
  const { computation, proofSnapshot } = input;
  const manifest = computation.manifest;
  const evaluated = evaluateProofGraph(computation, computation.m24.options, proofOptions);
  if (!evaluated.ok) return evaluated;
  const sourceAuthorityDigest = evaluated.value.sourceAuthorityDigest;
  if (!sourceAuthorityDigest || !isSha256(sourceAuthorityDigest)) return fail('BPE26_SOURCE_AUTHORITY_MISSING', 'M25 evaluation did not bind source authority.', input.bugProofId);
  const proofHandoff = createDownstreamProofHandoff(proofSnapshot, computation, 'M26_DELTA_REVIEW', computation.m24.options, proofOptions);
  if (!proofHandoff.ok) return proofHandoff;
  const proofGate = verifyM25ProofHandoff(proofHandoff.value, options, input.currentProofSnapshotDigest);
  if (!proofGate.ok) return proofGate;
  if (!proofGate.value.valid || !proofGate.value.current) return fail('BPE26_PROOF_HANDOFF_STALE', 'M25 proof handoff is not valid for the current exact snapshot.', input.bugProofId);
  if (proofSnapshot.sourceAuthorityDigest !== sourceAuthorityDigest || proofSnapshot.m24ContextDigest !== evaluated.value.m24ContextDigest) {
    return fail('BPE26_PROOF_BINDING_MISMATCH', 'M25 snapshot source authority or M24 context differs from recomputed proof.', input.bugProofId);
  }
  const proofByClaim = new Map(evaluated.value.results.map(result => [result.claimId, result]));
  const requirementProof = proofByClaim.get(input.requirementClaimId);
  const invariantProof = proofByClaim.get(input.invariantClaimId);
  const hypothesisProof = proofByClaim.get(input.hypothesisClaimId);
  if (!requirementProof || !invariantProof || !hypothesisProof) return fail('BPE26_PROOF_CLAIM_MISSING', 'M25 evaluation omitted a declared chain claim.', input.bugProofId);
  return ok({ manifest, evaluation: evaluated.value, sourceAuthorityDigest, requirementProof, invariantProof, hypothesisProof });
}

function indexM24Evidence(input: BugProofEvaluationInput, guard: Guard): Result<Map<string, BugProofEvidenceEntry>> {
  const evidenceById = new Map<string, BugProofEvidenceEntry>();
  let observedItems = 0;
  for (const evaluation of input.computation.m24.evaluations) {
    for (const item of evaluation.manifest.items) {
      const step = guard.step(`evidence-index:${item.evidenceId}`);
      if (!step.ok) return step;
      observedItems += 1;
      if (observedItems > 16384) return fail('BPE26_EVIDENCE_LIMIT', 'M24 evidence manifest exceeds the bounded Bug Proof input limit.', input.bugProofId);
      if (item.sourceIdentityDigest !== input.sourceIdentityDigest) return fail('BPE26_EVIDENCE_SOURCE_MISMATCH', 'M24 evidence manifest mixes exact source identities.', item.evidenceId);
      const previous = evidenceById.get(item.evidenceId);
      if (previous && (previous.semanticDigest !== item.semanticDigest || previous.sourceIdentityDigest !== item.sourceIdentityDigest
        || !sameSet(previous.claimIds, item.claimIds) || previous.kind !== item.kind || previous.subjectId !== item.subject.subjectId)) {
        return fail('BPE26_EVIDENCE_ID_CONFLICT', 'M24 context contains divergent semantics for one evidence ID.', item.evidenceId);
      }
      evidenceById.set(item.evidenceId, {
        semanticDigest: item.semanticDigest,
        sourceIdentityDigest: item.sourceIdentityDigest,
        claimIds: item.claimIds,
        kind: item.kind,
        subjectId: item.subject.subjectId,
      });
    }
  }
  return ok(evidenceById);
}

function bindProbeEvidence(input: BugProofEvaluationInput, evidenceById: ReadonlyMap<string, BugProofEvidenceEntry>,
  hypothesisProof: ClaimProofResult): Result<BugProofProbeEvidenceReceipt[]> {
  const dependencyStates = new Map(hypothesisProof.dependencyStates.map(dependency => [dependency.id, dependency.state]));
  const probeEvidence: BugProofProbeEvidenceReceipt[] = [];
  for (const probe of input.probes) {
    const evidence = evidenceById.get(probe.evidenceId);
    const state = dependencyStates.get(probe.evidenceId);
    if (!evidence || !state) return fail('BPE26_EVIDENCE_NOT_IN_EXACT_PROOF', 'Probe evidence is not present in both the M24 source manifest and M25 hypothesis obligation.', probe.evidenceId);
    if (evidence.kind !== 'TEST' || evidence.subjectId !== input.subjectId || !evidence.claimIds.includes(input.hypothesisClaimId)) {
      return fail('BPE26_EVIDENCE_TRACE_MISMATCH', 'Probe evidence must be a current test for the exact finding subject and hypothesis claim.', probe.evidenceId);
    }
    probeEvidence.push({ ...probe, evidenceSemanticDigest: evidence.semanticDigest, proofState: state, accepted: state === 'PROVEN' });
  }
  probeEvidence.sort((left, right) => compareCodePoint(`${left.role}:${left.probeId}`, `${right.role}:${right.probeId}`));
  return ok(probeEvidence);
}

type BugProofAssessment = { disposition: BugProofDisposition; reasons: string[]; predecessor: SemanticFinding | null };

function validateFalsePositiveAdjudication(input: BugProofEvaluationInput, facts: BugProofProofFacts,
  probes: readonly BugProofProbeEvidenceReceipt[], conditions: { currentEvidence: boolean; chainProven: boolean; selectionClear: boolean;
    invalidationComplete: boolean; controlsMatch: boolean; positiveRefuted: boolean }, options: OperationOptions): Result<true> {
  const falsePositive = input.falsePositive;
  if (!falsePositive) return ok(true);
  const priorReceipt = verifyReceipt(falsePositive.priorReceipt, options);
  if (!priorReceipt.ok) return priorReceipt;
  const acceptedEvidence = new Set(probes.filter(probe => probe.accepted).map(probe => probe.evidenceId));
  const positiveEvidence = new Set(probes.filter(probe => probe.role === 'POSITIVE').map(probe => probe.evidenceId));
  const { currentEvidence, chainProven, selectionClear, invalidationComplete, controlsMatch, positiveRefuted } = conditions;
  const rationaleValid = falsePositive.rationale.trim().length >= 8 && falsePositive.rationale.trim().length <= 2048;
  const predecessorIdentityMatches = falsePositive.priorReceipt.bugProofId === input.bugProofId
    && falsePositive.priorReceipt.requirementClaimId === input.requirementClaimId
    && falsePositive.priorReceipt.invariantClaimId === input.invariantClaimId
    && falsePositive.priorReceipt.hypothesisClaimId === input.hypothesisClaimId;
  const predecessorFindingMatches = stableStringify(falsePositive.priorFinding) === stableStringify(falsePositive.priorReceipt.finding);
  const predecessorValid = validId(falsePositive.priorFinding.findingId)
    && falsePositive.priorFinding.subjectId === input.subjectId
    && ['OPEN', 'INDETERMINATE'].includes(falsePositive.priorFinding.state)
    && falsePositive.priorFinding.findingId !== input.findingId
    && predecessorIdentityMatches && predecessorFindingMatches
    && falsePositive.priorReceipt.disposition === 'REPRODUCED_DEFECT'
    && falsePositive.priorReceipt.finding.subjectId === input.subjectId
    && falsePositive.priorReceipt.projectId === facts.manifest.projectId
    && falsePositive.priorReceipt.lineageId === facts.manifest.lineageId;
  const adjudicationEvidenceValid = falsePositive.evidenceIds.length > 0
    && falsePositive.evidenceIds.length === sortedUnique(falsePositive.evidenceIds).length
    && falsePositive.evidenceIds.every(id => acceptedEvidence.has(id) && positiveEvidence.has(id));
  if (!currentEvidence || !chainProven || !selectionClear || !invalidationComplete || !controlsMatch || !positiveRefuted
    || !rationaleValid || !predecessorValid || !adjudicationEvidenceValid) {
    return fail('BPE26_FALSE_POSITIVE_UNSUPPORTED', 'False-positive disposition requires current accepted exact-state evidence, complete controls, rationale, and unresolved predecessor lineage.', input.bugProofId);
  }
  return ok(true);
}

function assessBugProofDisposition(input: BugProofEvaluationInput, facts: BugProofProofFacts,
  probes: readonly BugProofProbeEvidenceReceipt[], options: OperationOptions): Result<BugProofAssessment> {
  const positives = probes.filter(probe => probe.role === 'POSITIVE');
  const currentEvidence = probes.every(probe => probe.accepted);
  const { requirementProof, invariantProof, hypothesisProof } = facts;
  const chainProven = requirementProof.state === 'PROVEN' && invariantProof.state === 'PROVEN' && hypothesisProof.state === 'PROVEN';
  const controlsMatch = probes.filter(probe => probe.role === 'NEGATIVE').every(probe => probe.observedOutcome === 'DEFECT_ABSENT');
  const positiveReproduced = positives.length > 0 && positives.every(probe => probe.observedOutcome === 'DEFECT_PRESENT');
  const positiveRefuted = positives.length > 0 && positives.every(probe => probe.observedOutcome === 'DEFECT_ABSENT');
  const selectionClear = input.testImpact.result.state === 'READY'
    && input.testImpact.result.selection.uncertainty === 'NONE'
    && input.testImpact.result.unresolved.length === 0;
  const invalidationComplete = input.proofSnapshot.invalidationKnowledgeComplete !== false;
  const falsePositive = input.falsePositive;
  const conditions = { currentEvidence, chainProven, selectionClear, invalidationComplete, controlsMatch, positiveRefuted };
  const reasons: string[] = [];
  let disposition: BugProofDisposition;

  if (falsePositive) {
    const validAdjudication = validateFalsePositiveAdjudication(input, facts, probes, conditions, options);
    if (!validAdjudication.ok) return validAdjudication;
    disposition = 'FALSE_POSITIVE';
    reasons.push('FALSE_POSITIVE_EXPLICIT_EVIDENCE_AND_LINEAGE');
  } else if (!currentEvidence || !chainProven || !selectionClear || !invalidationComplete) {
    disposition = 'INDETERMINATE';
    if (!currentEvidence) reasons.push('PROBE_EVIDENCE_NOT_CURRENT_ACCEPTED');
    if (!chainProven) reasons.push('M25_CHAIN_NOT_PROVEN');
    if (!selectionClear) reasons.push('M28_SELECTION_UNCERTAIN_OR_INCOMPLETE');
    if (!invalidationComplete) reasons.push('M25_INVALIDATION_KNOWLEDGE_INCOMPLETE');
  } else if (!controlsMatch) {
    disposition = 'INDETERMINATE';
    reasons.push('NEGATIVE_CONTROL_NOT_SATISFIED');
  } else if (positiveReproduced) {
    disposition = 'REPRODUCED_DEFECT';
    reasons.push('CURRENT_ACCEPTED_EXACT_STATE_REPRODUCTION');
  } else if (positives.some(probe => probe.observedOutcome === 'DEFECT_PRESENT')) {
    disposition = 'INDETERMINATE';
    reasons.push('POSITIVE_PROBES_DIVERGE');
  } else {
    disposition = 'HYPOTHESIS';
    reasons.push(positives.some(probe => probe.observedOutcome === 'NOT_RUN') ? 'POSITIVE_PROBE_NOT_RUN' : 'DEFECT_NOT_REPRODUCED');
  }

  const predecessor = disposition === 'FALSE_POSITIVE' ? falsePositive?.priorReceipt.finding ?? null : null;
  return ok({ disposition, reasons, predecessor });
}

export function evaluateBugProof(
  input: BugProofEvaluationInput,
  proofOptions: import('@gef-bootstrap/proof-graph').OperationOptions,
  options: OperationOptions,
): Result<BugProofReceipt> {
  const guard = new Guard(options);
  const validInput = validateBugProofInput(input, guard, options);
  if (!validInput.ok) return validInput;

  const validContext = validateM24M25ContextAndClaims(input);
  if (!validContext.ok) return validContext;
  const facts = evaluateM25Proof(input, proofOptions, options);
  if (!facts.ok) return facts;
  const evidenceIndex = indexM24Evidence(input, guard);
  if (!evidenceIndex.ok) return evidenceIndex;
  const probeEvidence = bindProbeEvidence(input, evidenceIndex.value, facts.value.hypothesisProof);
  if (!probeEvidence.ok) return probeEvidence;
  const { manifest, evaluation: evaluated, sourceAuthorityDigest, requirementProof, invariantProof, hypothesisProof } = facts.value;
  const probeEvidenceItems = probeEvidence.value;
  const assessment = assessBugProofDisposition(input, facts.value, probeEvidenceItems, options);
  if (!assessment.ok) return assessment;
  const falsePositive = input.falsePositive;
  const { disposition, reasons, predecessor } = assessment.value;

  const evidenceDigests = sortedUnique(probeEvidenceItems.map(probe => probe.evidenceSemanticDigest));
  const proofDigests = sortedUnique([evaluated.evaluationDigest, input.proofSnapshot.snapshotDigest, evaluated.m24ContextDigest]);
  const findingSemantics = findingProjection(disposition);
  const finding = createSemanticFinding({
    findingId: input.findingId,
    subjectId: input.subjectId,
    severity: input.severity,
    state: findingSemantics.state,
    ruleId: findingSemantics.ruleId,
    beforeSemanticDigest: predecessor?.afterSemanticDigest ?? null,
    afterSemanticDigest: input.sourceIdentityDigest,
    evidenceDigests,
    proofDigests,
    supersedesFindingDigest: predecessor?.findingDigest ?? null,
  }, options);
  if (!finding.ok) return finding;
  if (predecessor) {
    const register = createHedsFindingRegister([finding.value], [predecessor], options);
    if (!register.ok) return register;
  }

  const normalizedProbes = probeEvidenceItems.map(probe => ({ ...probe }));
  const hypothesisBody = {
    subjectId: input.subjectId,
    projectId: manifest.projectId,
    lineageId: manifest.lineageId,
    sourceIdentityDigest: input.sourceIdentityDigest,
    sourceAuthorityDigest,
    proofPolicyDigest: manifest.proofPolicyDigest,
    requirementClaimId: input.requirementClaimId,
    invariantClaimId: input.invariantClaimId,
    hypothesisClaimId: input.hypothesisClaimId,
    proofSnapshotDigest: input.proofSnapshot.snapshotDigest,
    m24ContextDigest: evaluated.m24ContextDigest,
    testImpactResultDigest: input.testImpact.result.digest,
    testImpactHandoffDigest: input.testImpact.handoff.digest,
    probeIdentity: normalizedProbes.map(probe => ({
      probeId: probe.probeId,
      targetId: probe.targetId,
      evidenceId: probe.evidenceId,
      role: probe.role,
      expectedOutcome: probe.expectedOutcome,
    })),
  };
  const hypothesisDigest = digestValue(options, 'BPI26', hypothesisBody);
  if (!hypothesisDigest.ok) return hypothesisDigest;
  const receiptBody = {
    bugProofId: input.bugProofId,
    hypothesisDigest: hypothesisDigest.value,
    requirementClaimId: input.requirementClaimId,
    invariantClaimId: input.invariantClaimId,
    hypothesisClaimId: input.hypothesisClaimId,
    findingId: input.findingId,
    projectId: manifest.projectId,
    lineageId: manifest.lineageId,
    sourceIdentityDigest: input.sourceIdentityDigest,
    proofPolicyDigest: manifest.proofPolicyDigest,
    sourceAuthorityDigest,
    proofSnapshotDigest: input.proofSnapshot.snapshotDigest,
    proofEvaluationDigest: evaluated.evaluationDigest,
    m24ContextDigest: evaluated.m24ContextDigest,
    invalidationVectorDigest: input.proofSnapshot.invalidationVectorDigest,
    invalidationChangedDependencyDigests: sortedUnique(input.proofSnapshot.invalidationChangedDependencyDigests),
    invalidationKnowledgeComplete: input.proofSnapshot.invalidationKnowledgeComplete,
    requirementProofState: requirementProof.state,
    invariantProofState: invariantProof.state,
    hypothesisProofState: hypothesisProof.state,
    testImpactState: input.testImpact.result.state,
    testImpactUncertainty: input.testImpact.result.selection.uncertainty,
    testImpactValidationLevel: input.testImpact.result.selection.level,
    testImpactRequiredLevel: input.testImpact.requiredLevel,
    selectedTargetIds: sortedUnique(input.testImpact.result.selection.tests),
    mandatoryTargetIds: sortedUnique(input.testImpact.mandatoryTargetIds),
    finalAssuranceTargetIds: sortedUnique(input.testImpact.finalAssuranceTargetIds),
    unresolvedTestIds: sortedUnique(input.testImpact.result.unresolved),
    testImpactResultDigest: input.testImpact.result.digest,
    testImpactHandoffDigest: input.testImpact.handoff.digest,
    probeEvidence: normalizedProbes,
    disposition,
    reasonCodes: sortedUnique(reasons),
    finding: finding.value,
    predecessorFindingDigest: predecessor?.findingDigest ?? null,
    falsePositiveRationale: disposition === 'FALSE_POSITIVE' ? falsePositive?.rationale.trim() ?? null : null,
    falsePositiveEvidenceIds: disposition === 'FALSE_POSITIVE' ? sortedUnique(falsePositive?.evidenceIds ?? []) : [],
  };
  const receiptDigest = digestValue(options, 'BPE26', receiptBody);
  return receiptDigest.ok ? ok(deepFreeze({ ...receiptBody, receiptDigest: receiptDigest.value })) : receiptDigest;
}

type ReplayAccumulator = {
  accepted: string[];
  acceptedSet: Set<string>;
  duplicates: string[];
  duplicateFindings: Set<string>;
  doubleCountedEvidence: Set<string>;
  conflicts: Set<string>;
  byContext: Map<string, string>;
  byFinding: Map<string, string>;
  evidenceOwner: Map<string, string>;
};

function processReplayReceipt(receipt: BugProofReceipt, accumulator: ReplayAccumulator, guard: Guard,
  options: OperationOptions): Result<true> {
  const step = guard.step(`bug-proof-replay:${receipt.bugProofId}`);
  if (!step.ok) return step;
  const verified = verifyReceipt(receipt, options);
  if (!verified.ok) return verified;
  if (accumulator.acceptedSet.has(receipt.receiptDigest)) {
    accumulator.duplicates.push(receipt.receiptDigest);
    return ok(true);
  }
  accumulator.acceptedSet.add(receipt.receiptDigest);
  const contextKey = `${receipt.bugProofId}:${receipt.hypothesisDigest}:${receipt.proofSnapshotDigest}:${receipt.testImpactResultDigest}`;
  const sameContext = accumulator.byContext.get(contextKey);
  if (sameContext && sameContext !== receipt.receiptDigest) accumulator.conflicts.add(receipt.bugProofId);
  else accumulator.byContext.set(contextKey, receipt.receiptDigest);
  const findingOwner = accumulator.byFinding.get(receipt.finding.findingDigest);
  if (findingOwner) {
    accumulator.duplicateFindings.add(receipt.finding.findingDigest);
    return ok(true);
  }
  accumulator.byFinding.set(receipt.finding.findingDigest, receipt.bugProofId);
  let reused = false;
  for (const probe of receipt.probeEvidence) {
    const owner = accumulator.evidenceOwner.get(probe.evidenceSemanticDigest);
    if (owner && owner !== receipt.bugProofId) {
      accumulator.doubleCountedEvidence.add(probe.evidenceSemanticDigest);
      accumulator.conflicts.add(owner);
      accumulator.conflicts.add(receipt.bugProofId);
      reused = true;
    } else accumulator.evidenceOwner.set(probe.evidenceSemanticDigest, receipt.bugProofId);
  }
  if (!reused) accumulator.accepted.push(receipt.receiptDigest);
  return ok(true);
}

export function createBugProofReplayGuard(history: readonly BugProofReceipt[], options: OperationOptions): Result<BugProofReplayGuard> {
  const limit = Math.max(1, Math.min(options.maxHistory ?? 4096, 65536));
  const processed = history.slice(0, limit).slice().sort((left, right) => compareCodePoint(`${left.bugProofId}:${left.receiptDigest}`, `${right.bugProofId}:${right.receiptDigest}`));
  const accumulator: ReplayAccumulator = {
    accepted: [], acceptedSet: new Set<string>(), duplicates: [], duplicateFindings: new Set<string>(),
    doubleCountedEvidence: new Set<string>(), conflicts: new Set<string>(), byContext: new Map<string, string>(),
    byFinding: new Map<string, string>(), evidenceOwner: new Map<string, string>(),
  };
  const guard = new Guard(options);

  for (const receipt of processed) {
    const result = processReplayReceipt(receipt, accumulator, guard, options);
    if (!result.ok) return result;
  }
  const historyTruncated = history.length > processed.length;
  const state = replayState(accumulator.conflicts, accumulator.doubleCountedEvidence, historyTruncated);
  const body = {
    state,
    acceptedReceiptDigests: sortedUnique(accumulator.accepted),
    duplicateReceiptDigests: sortedUnique(accumulator.duplicates),
    duplicateFindingDigests: sortedUnique([...accumulator.duplicateFindings]),
    doubleCountedEvidenceDigests: sortedUnique([...accumulator.doubleCountedEvidence]),
    conflictingBugProofIds: sortedUnique([...accumulator.conflicts]),
    historyTruncated,
    processedCount: processed.length,
    totalCount: history.length,
  };
  const digest = digestValue(options, 'BPR26', body);
  return digest.ok ? ok(deepFreeze({ ...body, guardDigest: digest.value })) : digest;
}
