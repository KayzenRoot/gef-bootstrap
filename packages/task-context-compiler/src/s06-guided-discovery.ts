// M14 Task & Context Compiler - S06 Guided Discovery
// Deterministic, source-bound discovery rounds; no model, filesystem, network or provider calls.

import type { OperationOptions, Result } from './types.js';
import { compareCodePoint, deepFreeze, fail, sha, validId } from './utils.js';

export type GuidedDiscoveryAnswerState = 'DECIDED' | 'ASSUMED' | 'UNRESOLVED' | 'NOT_APPLICABLE';
export type GuidedDiscoveryProjectMode = 'GREENFIELD' | 'BROWNFIELD';
export type GuidedDiscoveryOperationMode = 'STANDARD' | 'FAST';
export type GuidedDiscoveryPlanState = 'QUESTIONS_REMAIN' | 'NO_OPEN_QUESTIONS' | 'BLOCKED' | 'INDETERMINATE';

/** The version context that makes discovery answers reusable only in the same project state. */
export interface GuidedDiscoveryBinding {
  readonly sessionIdentity: string;
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
}

export interface DiscoverySourceBinding {
  readonly sourceId: string;
  readonly fingerprint: string;
}

export interface GuidedDiscoveryAnswerCapsuleInput {
  readonly binding: GuidedDiscoveryBinding;
  readonly questionId: string;
  readonly state: GuidedDiscoveryAnswerState;
  readonly answer?: string | undefined;
  readonly rationale?: string | undefined;
  readonly recordedBy: string;
  readonly sourceBindings: readonly DiscoverySourceBinding[];
}

/** Stable, attributable discovery answer receipt. Timestamps are deliberately excluded from identity. */
export interface GuidedDiscoveryAnswerCapsule extends GuidedDiscoveryAnswerCapsuleInput {
  readonly schemaVersion: 1;
  readonly semanticIdentity: string;
}

export interface GuidedDiscoveryQuestion {
  readonly questionId: string;
  readonly prompt: string;
  readonly domain: string;
  readonly material: boolean;
  /** Security/HIGH_ASSURANCE blockers are prioritized and cannot be dropped by FAST mode. */
  readonly blocking?: boolean | undefined;
  /** In brownfield mode, only explicit gap questions are eligible for a new round. */
  readonly brownfieldGap?: boolean | undefined;
  readonly sourceBindings: readonly DiscoverySourceBinding[];
}

export interface CurrentDiscoverySourceFingerprint extends DiscoverySourceBinding {}

export interface BuildGuidedDiscoveryPlanInput {
  readonly binding: GuidedDiscoveryBinding;
  readonly projectMode: GuidedDiscoveryProjectMode;
  readonly operationMode: GuidedDiscoveryOperationMode;
  readonly questions: readonly GuidedDiscoveryQuestion[];
  readonly answerCapsules: readonly GuidedDiscoveryAnswerCapsule[];
  readonly currentSourceFingerprints: readonly CurrentDiscoverySourceFingerprint[];
  readonly authorityConflicts?: readonly string[] | undefined;
  /** Caller may narrow the round; the safe upper bound is seven questions. */
  readonly maxQuestions?: number | undefined;
}

export interface GuidedDiscoveryPlan {
  readonly state: GuidedDiscoveryPlanState;
  readonly questionIds: readonly string[];
  readonly unresolvedQuestionIds: readonly string[];
  readonly unresolvedBlockingQuestionIds: readonly string[];
  readonly preservedCapsuleIds: readonly string[];
  readonly invalidatedCapsuleIds: readonly string[];
  readonly authorityConflictRefs: readonly string[];
  readonly staleQuestionIds: readonly string[];
  readonly maxQuestions: number;
  readonly semanticIdentity: string;
}

function validateBinding(binding: GuidedDiscoveryBinding): string | null {
  for (const [field, value] of Object.entries(binding)) {
    if (typeof value !== 'string' || value.trim().length === 0) return `Missing guided-discovery binding ${field}`;
  }
  for (const field of ['sessionIdentity', 'projectId', 'sourcePackIdentity', 'profileIdentity', 'policyVersion', 'checkpointIdentity'] as const) {
    if (!validId(binding[field])) return `Invalid guided-discovery binding ${field}`;
  }
  return null;
}

function normalizeSourceBindings(bindings: readonly DiscoverySourceBinding[]): Result<readonly DiscoverySourceBinding[]> {
  if (bindings.length === 0) return fail('DISCOVERY_SOURCE_BINDING_MISSING', 'At least one source binding is required');
  const sorted = [...bindings]
    .map(binding => ({ sourceId: binding.sourceId.trim(), fingerprint: binding.fingerprint.trim() }))
    .sort((a, b) => compareCodePoint(a.sourceId, b.sourceId) || compareCodePoint(a.fingerprint, b.fingerprint));
  for (let index = 0; index < sorted.length; index++) {
    const binding = sorted[index]!;
    if (!validId(binding.sourceId) || !binding.fingerprint) {
      return fail('DISCOVERY_SOURCE_BINDING_INVALID', 'Source ID and fingerprint must both be present', binding.sourceId);
    }
    if (index > 0 && sorted[index - 1]!.sourceId === binding.sourceId) {
      return fail('DISCOVERY_SOURCE_BINDING_DUPLICATE', 'A capsule may bind a source only once', binding.sourceId);
    }
  }
  return { ok: true, value: deepFreeze(sorted) };
}

/** Create an immutable source- and version-bound answer capsule. */
export function createGuidedDiscoveryAnswerCapsule(
  input: GuidedDiscoveryAnswerCapsuleInput,
  options: OperationOptions,
): Result<GuidedDiscoveryAnswerCapsule> {
  const cancelled = options.cancellation?.isCancelled();
  if (cancelled) return fail('CANCELLED', 'Operation cancelled');

  const bindingError = validateBinding(input.binding);
  if (bindingError) return fail('DISCOVERY_BINDING_INVALID', bindingError, input.questionId);
  if (!validId(input.questionId)) return fail('DISCOVERY_QUESTION_INVALID', 'questionId is invalid or empty');
  if (!validId(input.recordedBy)) return fail('DISCOVERY_ATTRIBUTION_MISSING', 'recordedBy must identify the answer author', input.questionId);

  const answer = input.answer?.trim();
  const rationale = input.rationale?.trim();
  if (input.state === 'DECIDED' && !answer) {
    return fail('DISCOVERY_ANSWER_MISSING', 'DECIDED answers require answer text', input.questionId);
  }
  if (input.state === 'ASSUMED' && (!answer || !rationale)) {
    return fail('DISCOVERY_ASSUMPTION_UNJUSTIFIED', 'ASSUMED answers require answer text and an explicit rationale', input.questionId);
  }
  if (input.state === 'UNRESOLVED' && answer) {
    return fail('DISCOVERY_UNRESOLVED_HAS_ANSWER', 'UNRESOLVED capsules cannot carry a decided answer', input.questionId);
  }
  if (input.state === 'NOT_APPLICABLE' && (!rationale || answer)) {
    return fail('DISCOVERY_NOT_APPLICABLE_UNJUSTIFIED', 'NOT_APPLICABLE requires a rationale and cannot carry an answer', input.questionId);
  }
  if (!['DECIDED', 'ASSUMED', 'UNRESOLVED', 'NOT_APPLICABLE'].includes(input.state)) {
    return fail('DISCOVERY_STATE_INVALID', 'Unknown discovery answer state', input.questionId);
  }

  const sourceBindings = normalizeSourceBindings(input.sourceBindings);
  if (!sourceBindings.ok) return sourceBindings;

  const payload = {
    schemaVersion: 1 as const,
    binding: { ...input.binding },
    questionId: input.questionId,
    state: input.state,
    ...(answer !== undefined ? { answer } : {}),
    ...(rationale !== undefined ? { rationale } : {}),
    recordedBy: input.recordedBy.trim(),
    sourceBindings: sourceBindings.value,
  };
  const identity = sha(options, payload);
  if (!identity.ok) return identity;
  return {
    ok: true,
    value: deepFreeze({ ...payload, semanticIdentity: identity.value }),
  };
}

function sameBinding(left: GuidedDiscoveryBinding, right: GuidedDiscoveryBinding): boolean {
  return left.sessionIdentity === right.sessionIdentity
    && left.projectId === right.projectId
    && left.sourcePackIdentity === right.sourcePackIdentity
    && left.profileIdentity === right.profileIdentity
    && left.profileDigest === right.profileDigest
    && left.policyVersion === right.policyVersion
    && left.checkpointIdentity === right.checkpointIdentity;
}

function sourcesAreCurrent(bindings: readonly DiscoverySourceBinding[], sources: ReadonlyMap<string, string>): boolean {
  return bindings.every(binding => sources.get(binding.sourceId) === binding.fingerprint);
}

function coversQuestionSources(
  capsuleBindings: readonly DiscoverySourceBinding[],
  questionBindings: readonly DiscoverySourceBinding[],
): boolean {
  return questionBindings.every(questionBinding => capsuleBindings.some(capsuleBinding =>
    capsuleBinding.sourceId === questionBinding.sourceId
      && capsuleBinding.fingerprint === questionBinding.fingerprint,
  ));
}

/**
 * Compile only the next bounded discovery round. Existing M14 authority and
 * source fingerprints remain the input truth; FAST changes no blocker rules.
 */
export function buildGuidedDiscoveryPlan(
  input: BuildGuidedDiscoveryPlanInput,
  options: OperationOptions,
): Result<GuidedDiscoveryPlan> {
  if (options.cancellation?.isCancelled()) return fail('CANCELLED', 'Operation cancelled');
  const bindingError = validateBinding(input.binding);
  if (bindingError) return fail('DISCOVERY_BINDING_INVALID', bindingError, input.binding.sessionIdentity);
  if (!['GREENFIELD', 'BROWNFIELD'].includes(input.projectMode)) {
    return fail('DISCOVERY_PROJECT_MODE_INVALID', 'projectMode must be GREENFIELD or BROWNFIELD');
  }
  if (!['STANDARD', 'FAST'].includes(input.operationMode)) {
    return fail('DISCOVERY_OPERATION_MODE_INVALID', 'operationMode must be STANDARD or FAST');
  }

  const maxQuestions = input.maxQuestions ?? 7;
  if (!Number.isInteger(maxQuestions) || maxQuestions < 1 || maxQuestions > 7) {
    return fail('DISCOVERY_ROUND_LIMIT_INVALID', 'maxQuestions must narrow the round to an integer from 1 to 7');
  }

  const currentSources = new Map<string, string>();
  for (const source of input.currentSourceFingerprints) {
    if (!validId(source.sourceId) || !source.fingerprint.trim()) {
      return fail('DISCOVERY_SOURCE_BINDING_INVALID', 'Current source ID and fingerprint are required', source.sourceId);
    }
    if (currentSources.has(source.sourceId)) {
      return fail('DISCOVERY_SOURCE_BINDING_DUPLICATE', 'Current source fingerprints must have unique source IDs', source.sourceId);
    }
    currentSources.set(source.sourceId, source.fingerprint);
  }

  const questionById = new Map<string, GuidedDiscoveryQuestion>();
  for (const question of input.questions) {
    if (!validId(question.questionId) || !question.prompt.trim() || !validId(question.domain)) {
      return fail('DISCOVERY_QUESTION_INVALID', 'Question ID, prompt and domain are required', question.questionId);
    }
    if (questionById.has(question.questionId)) {
      return fail('DISCOVERY_QUESTION_DUPLICATE', 'Discovery question IDs must be unique', question.questionId);
    }
    const normalized = normalizeSourceBindings(question.sourceBindings);
    if (!normalized.ok) return normalized;
    questionById.set(question.questionId, { ...question, sourceBindings: normalized.value });
  }

  const conflicts = [...new Set((input.authorityConflicts ?? []).map(ref => ref.trim()).filter(Boolean))].sort(compareCodePoint);
  const preservedCapsuleIds: string[] = [];
  const invalidatedCapsuleIds: string[] = [];
  const validCapsulesByQuestion = new Map<string, GuidedDiscoveryAnswerCapsule>();

  for (const capsule of input.answerCapsules) {
    const recreated = createGuidedDiscoveryAnswerCapsule({
      binding: capsule.binding,
      questionId: capsule.questionId,
      state: capsule.state,
      answer: capsule.answer,
      rationale: capsule.rationale,
      recordedBy: capsule.recordedBy,
      sourceBindings: capsule.sourceBindings,
    }, options);
    if (!recreated.ok || recreated.value.semanticIdentity !== capsule.semanticIdentity || capsule.schemaVersion !== 1) {
      return fail('DISCOVERY_CAPSULE_INTEGRITY', 'Answer capsule does not match its semantic receipt', capsule.semanticIdentity);
    }
    const question = questionById.get(capsule.questionId);
    if (!sameBinding(capsule.binding, input.binding)
      || !sourcesAreCurrent(capsule.sourceBindings, currentSources)
      || !question
      || !coversQuestionSources(capsule.sourceBindings, question.sourceBindings)) {
      invalidatedCapsuleIds.push(capsule.semanticIdentity);
      continue;
    }
    if (validCapsulesByQuestion.has(capsule.questionId)) {
      return fail('DISCOVERY_ANSWER_AMBIGUOUS', 'More than one current answer capsule exists for a question', capsule.questionId);
    }
    validCapsulesByQuestion.set(capsule.questionId, capsule);
    preservedCapsuleIds.push(capsule.semanticIdentity);
  }

  const staleQuestionIds: string[] = [];
  const eligibleQuestions = [...questionById.values()].filter(question =>
    question.material && (input.projectMode !== 'BROWNFIELD' || question.brownfieldGap === true),
  );
  for (const question of eligibleQuestions) {
    if (!sourcesAreCurrent(question.sourceBindings, currentSources)) staleQuestionIds.push(question.questionId);
  }

  const authorityConflictRefs = conflicts;
  const unresolvedQuestionIds = eligibleQuestions
    .filter(question => {
      const capsule = validCapsulesByQuestion.get(question.questionId);
      return capsule === undefined || capsule.state === 'UNRESOLVED';
    })
    .map(question => question.questionId)
    .sort(compareCodePoint);
  const unresolvedBlockingQuestionIds = eligibleQuestions
    .filter(question => question.blocking === true && unresolvedQuestionIds.includes(question.questionId))
    .map(question => question.questionId)
    .sort(compareCodePoint);

  let state: GuidedDiscoveryPlanState;
  let questionIds: string[] = [];
  if (authorityConflictRefs.length > 0) {
    state = 'BLOCKED';
  } else if (staleQuestionIds.length > 0) {
    state = 'INDETERMINATE';
  } else if (unresolvedBlockingQuestionIds.length > maxQuestions) {
    state = 'BLOCKED';
  } else if (unresolvedQuestionIds.length === 0) {
    state = 'NO_OPEN_QUESTIONS';
  } else {
    state = 'QUESTIONS_REMAIN';
    const pending = unresolvedQuestionIds
      .map(questionId => questionById.get(questionId)!)
      .sort((a, b) => Number(b.blocking === true) - Number(a.blocking === true) || compareCodePoint(a.questionId, b.questionId));
    questionIds = pending.slice(0, maxQuestions).map(question => question.questionId);
  }

  const sortedPreserved = [...preservedCapsuleIds].sort(compareCodePoint);
  const sortedInvalidated = [...invalidatedCapsuleIds].sort(compareCodePoint);
  const sortedStaleQuestions = [...staleQuestionIds].sort(compareCodePoint);
  const digestInput = {
    binding: input.binding,
    projectMode: input.projectMode,
    operationMode: input.operationMode,
    state,
    questionIds,
    unresolvedQuestionIds,
    unresolvedBlockingQuestionIds,
    preservedCapsuleIds: sortedPreserved,
    invalidatedCapsuleIds: sortedInvalidated,
    authorityConflictRefs,
    staleQuestionIds: sortedStaleQuestions,
    maxQuestions,
  };
  const identity = sha(options, digestInput);
  if (!identity.ok) return identity;
  return {
    ok: true,
    value: deepFreeze({
      ...digestInput,
      questionIds: [...questionIds],
      unresolvedQuestionIds: [...unresolvedQuestionIds],
      unresolvedBlockingQuestionIds: [...unresolvedBlockingQuestionIds],
      preservedCapsuleIds: sortedPreserved,
      invalidatedCapsuleIds: sortedInvalidated,
      authorityConflictRefs,
      staleQuestionIds: sortedStaleQuestions,
      semanticIdentity: identity.value,
    }),
  };
}
