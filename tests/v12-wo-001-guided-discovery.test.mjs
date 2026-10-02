import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as m14 from '../packages/task-context-compiler/dist/public.js';

const digest = {
  algorithm: 'sha256',
  digest: value => createHash('sha256').update(value).digest('hex'),
};
const options = { digest };

const binding = {
  sessionIdentity: 'session-greenfield-1',
  projectId: 'project-gef',
  sourcePackIdentity: 'source-pack-v12-1',
  profileIdentity: 'profile-universal-core',
  profileDigest: 'sha256:profile-1',
  policyVersion: 'policy-v1',
  checkpointIdentity: 'checkpoint-main-8e63',
};

function hasGuidedDiscoveryApi() {
  assert.equal(typeof m14.createGuidedDiscoveryAnswerCapsule, 'function');
  assert.equal(typeof m14.buildGuidedDiscoveryPlan, 'function');
  return typeof m14.createGuidedDiscoveryAnswerCapsule === 'function'
    && typeof m14.buildGuidedDiscoveryPlan === 'function';
}

function answer(questionId, overrides = {}) {
  return m14.createGuidedDiscoveryAnswerCapsule({
    binding,
    questionId,
    state: 'DECIDED',
    answer: `Answer for ${questionId}`,
    recordedBy: 'owner:kaizenroot',
    sourceBindings: [{ sourceId: `source-${questionId}`, fingerprint: `fp-${questionId}` }],
    ...overrides,
  }, options);
}

function question(questionId, overrides = {}) {
  return {
    questionId,
    prompt: `Material question ${questionId}?`,
    domain: 'SCOPE',
    material: true,
    blocking: false,
    brownfieldGap: true,
    sourceBindings: [{ sourceId: `source-${questionId}`, fingerprint: `fp-${questionId}` }],
    ...overrides,
  };
}

function currentSources(questions, extra = []) {
  return [
    ...questions.flatMap(item => item.sourceBindings),
    ...extra,
  ];
}

test('source-bound answer capsules are attributable, version-bound and deterministic', () => {
  if (!hasGuidedDiscoveryApi()) return;

  const sourcePair = [
    { sourceId: 'source-a', fingerprint: 'fp-a' },
    { sourceId: 'source-b', fingerprint: 'fp-b' },
  ];
  const one = answer('q-decided', { sourceBindings: sourcePair }).value;
  const reordered = m14.createGuidedDiscoveryAnswerCapsule({
    binding,
    questionId: 'q-decided',
    state: 'DECIDED',
    answer: 'Answer for q-decided',
    recordedBy: 'owner:kaizenroot',
    sourceBindings: [...sourcePair].reverse(),
  }, options).value;
  const nextSourceVersion = m14.createGuidedDiscoveryAnswerCapsule({
    binding: { ...binding, sourcePackIdentity: 'source-pack-v12-2' },
    questionId: 'q-decided',
    state: 'DECIDED',
    answer: 'Answer for q-decided',
    recordedBy: 'owner:kaizenroot',
    sourceBindings: [{ sourceId: 'source-q-decided', fingerprint: 'fp-q-decided' }],
  }, options).value;

  assert.equal(one.schemaVersion, 1);
  assert.equal(one.semanticIdentity, reordered.semanticIdentity);
  assert.notEqual(one.semanticIdentity, nextSourceVersion.semanticIdentity);
  assert.equal(one.recordedBy, 'owner:kaizenroot');
  assert.deepEqual(one.sourceBindings, sourcePair);
  assert.equal(Object.isFrozen(one), true);
  assert.equal(m14.createGuidedDiscoveryAnswerCapsule({
    binding,
    questionId: 'q-assumed',
    state: 'ASSUMED',
    answer: 'Use the existing project convention',
    recordedBy: 'owner:kaizenroot',
    sourceBindings: [{ sourceId: 'source-q-assumed', fingerprint: 'fp-q-assumed' }],
  }, options).ok, false, 'ASSUMED requires an explicit rationale');
});

test('greenfield asks only unanswered material questions and reopens only stale dependent capsules', () => {
  if (!hasGuidedDiscoveryApi()) return;

  const questions = [
    question('q-scope'),
    question('q-platform'),
    question('q-security', { domain: 'SECURITY', blocking: true }),
    question('q-noise', { material: false }),
  ];
  const accepted = answer('q-scope').value;
  const staleDependent = answer('q-platform', {
    sourceBindings: [{ sourceId: 'source-q-platform', fingerprint: 'old-platform-fp' }],
  }).value;
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'STANDARD',
    questions,
    answerCapsules: [accepted, staleDependent],
    currentSourceFingerprints: currentSources(questions),
  }, options);

  assert.equal(result.ok, true);
  assert.equal(result.value.state, 'QUESTIONS_REMAIN');
  assert.deepEqual(result.value.questionIds, ['q-security', 'q-platform']);
  assert.deepEqual(result.value.preservedCapsuleIds, [accepted.semanticIdentity]);
  assert.deepEqual(result.value.invalidatedCapsuleIds, [staleDependent.semanticIdentity]);
  assert.deepEqual(result.value.unresolvedQuestionIds, ['q-platform', 'q-security']);
});

test('fully answered greenfield discovery does not ask duplicate questions', () => {
  if (!hasGuidedDiscoveryApi()) return;
  const questions = [question('q-scope'), question('q-platform')];
  const capsules = questions.map(item => answer(item.questionId).value);
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'STANDARD',
    questions,
    answerCapsules: capsules,
    currentSourceFingerprints: currentSources(questions),
  }, options);

  assert.equal(result.value.state, 'NO_OPEN_QUESTIONS');
  assert.deepEqual(result.value.questionIds, []);
});

test('an answer capsule cannot satisfy a question bound to different canonical sources', () => {
  if (!hasGuidedDiscoveryApi()) return;
  const item = question('q-scope');
  const unboundAnswer = answer('q-scope', {
    sourceBindings: [{ sourceId: 'unrelated-source', fingerprint: 'fp-unrelated' }],
  }).value;
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'STANDARD',
    questions: [item],
    answerCapsules: [unboundAnswer],
    currentSourceFingerprints: [...currentSources([item]), { sourceId: 'unrelated-source', fingerprint: 'fp-unrelated' }],
  }, options);

  assert.equal(result.value.state, 'QUESTIONS_REMAIN');
  assert.deepEqual(result.value.questionIds, ['q-scope']);
  assert.deepEqual(result.value.invalidatedCapsuleIds, [unboundAnswer.semanticIdentity]);
  assert.deepEqual(result.value.preservedCapsuleIds, []);
});

test('brownfield discovery asks only declared gaps and preserves accepted source answers', () => {
  if (!hasGuidedDiscoveryApi()) return;
  const questions = [
    question('q-accepted', { brownfieldGap: false, domain: 'ARCHITECTURE' }),
    question('q-gap', { brownfieldGap: true, domain: 'REQUIREMENTS' }),
    question('q-not-a-gap', { brownfieldGap: false, domain: 'SECURITY' }),
  ];
  const accepted = answer('q-accepted').value;
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'BROWNFIELD',
    operationMode: 'STANDARD',
    questions,
    answerCapsules: [accepted],
    currentSourceFingerprints: currentSources(questions),
  }, options);

  assert.deepEqual(result.value.questionIds, ['q-gap']);
  assert.deepEqual(result.value.preservedCapsuleIds, [accepted.semanticIdentity]);
});

test('question rounds default to at most seven and FAST cannot omit blocking questions', () => {
  if (!hasGuidedDiscoveryApi()) return;
  const questions = Array.from({ length: 9 }, (_, index) => question(`q-${String(index + 1).padStart(2, '0')}`));
  questions[8] = { ...questions[8], questionId: 'q-security-blocker', blocking: true, domain: 'SECURITY' };
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'FAST',
    questions,
    answerCapsules: [],
    currentSourceFingerprints: currentSources(questions),
  }, options);

  assert.equal(result.value.questionIds.length, 7);
  assert.equal(result.value.questionIds.includes('q-security-blocker'), true);
  assert.equal(result.value.unresolvedQuestionIds.length, 9);

  const blocked = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'FAST',
    maxQuestions: 2,
    questions: [
      question('security-auth', { blocking: true, domain: 'SECURITY' }),
      question('assurance-risk', { blocking: true, domain: 'HIGH_ASSURANCE' }),
      question('schema-auth', { blocking: true, domain: 'SECURITY' }),
      question('normal-gap'),
    ],
    answerCapsules: [],
    currentSourceFingerprints: [
      ...question('security-auth', { blocking: true, domain: 'SECURITY' }).sourceBindings,
      ...question('assurance-risk', { blocking: true, domain: 'HIGH_ASSURANCE' }).sourceBindings,
      ...question('schema-auth', { blocking: true, domain: 'SECURITY' }).sourceBindings,
      ...question('normal-gap').sourceBindings,
    ],
  }, options);
  assert.equal(blocked.value.state, 'BLOCKED');
  assert.deepEqual(blocked.value.questionIds, []);
  assert.deepEqual(blocked.value.unresolvedBlockingQuestionIds, ['assurance-risk', 'schema-auth', 'security-auth']);
});

test('frozen authority conflicts block discovery instead of overwriting answers', () => {
  if (!hasGuidedDiscoveryApi()) return;
  const candidate = question('q-scope');
  const result = m14.buildGuidedDiscoveryPlan({
    binding,
    projectMode: 'GREENFIELD',
    operationMode: 'FAST',
    questions: [candidate],
    answerCapsules: [],
    currentSourceFingerprints: currentSources([candidate]),
    authorityConflicts: ['adr:0010-vs-scope'],
  }, options);

  assert.equal(result.value.state, 'BLOCKED');
  assert.deepEqual(result.value.questionIds, []);
  assert.deepEqual(result.value.authorityConflictRefs, ['adr:0010-vs-scope']);
});
