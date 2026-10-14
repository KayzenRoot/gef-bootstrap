import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as contracts from '../packages/contracts/dist/index.js';
import * as evidence from '../packages/evidence-engine/dist/public.js';
import * as assurance from '../packages/assurance-pipeline/dist/public.js';

const parseProviderEvidenceInput = contracts.parseProviderEvidenceInput;
const createProviderEvidenceBundle = evidence.createProviderEvidenceBundle;
const verifyProviderEvidenceBundle = evidence.verifyProviderEvidenceBundle;
const createProviderAuditPacket = assurance.createProviderAuditPacket;
const revalidateProviderAuditPacket = assurance.revalidateProviderAuditPacket;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const gitSha = (value) => createHash('sha1').update(value).digest('hex');
const BASE_SHA = '58ace6c66c292faf5a61e431bbaccadcbc404287';
const HEAD_SHA = 'a'.repeat(40);
const LOCK_DIGEST = `sha256:${sha('effective-wo002-lock')}`;
const RULESET_DIGEST = `sha256:${sha('required-ruleset')}`;
const sourceUri = 'https://github.com/KayzenRoot/gef-bootstrap/actions/runs/123';
const contextId = 'github:app:15368:repository-validation';
const digest = { algorithm: 'sha256', digest: (value) => sha(value) };
const operationOptions = { digest, maxUnits: 10000, maxHistory: 100 };
const requiredContextFixtures = [
  { contextId, displayName: 'Repository validation', checkKind: 'TEST' },
  { contextId: 'github:app:15368:pipeline-integrity', displayName: 'Pipeline integrity', checkKind: 'STATUS' },
  { contextId: 'github:app:15368:gitleaks-secrets', displayName: 'Gitleaks secrets', checkKind: 'SECURITY' },
  { contextId: 'github:app:15368:trivy-filesystem-configuration', displayName: 'Trivy filesystem and configuration', checkKind: 'SECURITY' },
];

function checkRunFixtures(headSha = HEAD_SHA) {
  return requiredContextFixtures.map((context, index) => ({
    recordId: `check-record-${index + 1}`,
    runId: `check-run-${index + 1}`,
    attempt: 1,
    contextId: context.contextId,
    displayName: context.displayName,
    checkKind: context.checkKind,
    headSha,
    status: 'COMPLETED',
    conclusion: 'SUCCESS',
    sourceUri,
  }));
}

function providerInput(overrides = {}) {
  return {
    schemaVersion: '1.0',
    collectionId: 'collection-1',
    providerId: 'github',
    collectionState: 'COMPLETE',
    sourceUri,
    repository: { owner: 'KayzenRoot', name: 'gef-bootstrap' },
    pullRequest: { number: 460, baseSha: BASE_SHA, headSha: HEAD_SHA },
    workOrderId: 'GBS-MOD-WO-002',
    contextLockDigest: LOCK_DIGEST,
    changedPaths: [
      '.engineering/checkpoint-deltas/GBS-MOD-WO-002-IMPLEMENTATION-PROPOSED.md',
      '.engineering/evidence/GBS-MOD-WO-002-EVIDENCE.md',
      'packages/assurance-pipeline/src/provider-audit-packet.ts',
      'packages/assurance-pipeline/src/public.ts',
      'packages/contracts/src/index.ts',
      'packages/contracts/src/provider-evidence.ts',
      'packages/evidence-engine/src/provider-evidence.ts',
      'packages/evidence-engine/src/public.ts',
      'tests/gbs-mod-wo-002-evidence.test.mjs',
    ],
    sourceTrees: { baseTreeSha: gitSha('base-tree'), headTreeSha: gitSha('head-tree') },
    fileBlobs: [
      '.engineering/checkpoint-deltas/GBS-MOD-WO-002-IMPLEMENTATION-PROPOSED.md',
      '.engineering/evidence/GBS-MOD-WO-002-EVIDENCE.md',
      'packages/assurance-pipeline/src/provider-audit-packet.ts',
      'packages/assurance-pipeline/src/public.ts',
      'packages/contracts/src/index.ts',
      'packages/contracts/src/provider-evidence.ts',
      'packages/evidence-engine/src/provider-evidence.ts',
      'packages/evidence-engine/src/public.ts',
      'tests/gbs-mod-wo-002-evidence.test.mjs',
    ].map((path) => ({ path, blobSha: gitSha(path) })),
    ruleset: { rulesetId: '23566111', digest: RULESET_DIGEST },
    requiredContexts: requiredContextFixtures.map(({ contextId: id, displayName }) => ({ contextId: id, displayName })),
    checkRuns: checkRunFixtures(),
    workflowRuns: [
      {
        runId: 'workflow-run-1',
        attempt: 1,
        headSha: HEAD_SHA,
        status: 'COMPLETED',
        conclusion: 'SUCCESS',
        sourceUri,
        jobs: [
          {
            jobId: 'job-1',
            name: 'Repository validation',
            status: 'COMPLETED',
            conclusion: 'SUCCESS',
            sourceUri,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function expectedBinding(overrides = {}) {
  const input = providerInput();
  return {
    providerId: input.providerId,
    repository: input.repository,
    pullRequest: input.pullRequest,
    sourceTrees: input.sourceTrees,
    fileBlobs: input.fileBlobs,
    ruleset: input.ruleset,
    workOrderId: input.workOrderId,
    contextLockDigest: input.contextLockDigest,
    changedPaths: input.changedPaths,
    requiredContexts: input.requiredContexts,
    ...overrides,
  };
}

function collect(input, expected = expectedBinding()) {
  return createProviderEvidenceBundle(parseProviderEvidenceInput(input), expected, operationOptions);
}

if (typeof parseProviderEvidenceInput !== 'function') {
  test('versioned provider evidence contract is exported', () => {
    assert.equal(typeof parseProviderEvidenceInput, 'function');
  });
} else {
  test('provider evidence parser validates and canonically orders the versioned envelope', () => {
    const input = providerInput({ changedPaths: [...providerInput().changedPaths].reverse() });
    const parsed = parseProviderEvidenceInput(input);
    assert.equal(parsed.ok, true, JSON.stringify(parsed));
    assert.equal(parsed.value.schemaVersion, '1.0');
    assert.deepEqual(parsed.value.changedPaths, [...input.changedPaths].sort());
    assert.ok(parsed.value.requiredContexts.some(({ contextId: id }) => id === contextId));
    assert.equal(parsed.value.checkRuns[0].attempt, 1);
    assert.equal(parsed.value.checkRuns[0].checkKind, 'TEST');
    assert.equal(parsed.value.workflowRuns[0].jobs[0].jobId, 'job-1');
    assert.equal(Object.isFrozen(parsed.value), true);
  });

  test('unknown token and bulk-log fields are rejected without echoing their values', () => {
    const secret = 'ghp_do-not-copy-this-value';
    const parsed = parseProviderEvidenceInput({ ...providerInput(), token: secret, bulkLogs: 'private log data' });
    assert.equal(parsed.ok, false);
    assert.ok(parsed.diagnostics.some(({ code }) => code === 'GHE01_FIELD_UNKNOWN'));
    const rendered = JSON.stringify(parsed);
    assert.equal(rendered.includes(secret), false);
    assert.equal(rendered.includes('private log data'), false);
    const secretFieldName = parseProviderEvidenceInput({ ...providerInput(), ['ghp_abcdefghijklmnopqrstuvwxyz0123456789']: 'redacted' });
    assert.equal(secretFieldName.ok, false);
    assert.equal(JSON.stringify(secretFieldName).includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), false);
  });

  test('credential-shaped values in otherwise allowed fields are rejected without echoing the value', () => {
    const secret = 'Bearer ghp_abcdefghijklmnopqrstuvwxyz0123456789';
    const parsed = parseProviderEvidenceInput({
      ...providerInput(),
      checkRuns: [{ ...providerInput().checkRuns[0], displayName: secret }],
    });
    assert.equal(parsed.ok, false);
    assert.equal(JSON.stringify(parsed).includes(secret), false);
  });

  test('malformed SHA, duplicate context identity, and unsafe source URI fail closed', () => {
    const badSha = parseProviderEvidenceInput({
      ...providerInput(),
      pullRequest: { ...providerInput().pullRequest, headSha: 'not-a-sha' },
    });
    const duplicateContext = parseProviderEvidenceInput({
      ...providerInput(),
      requiredContexts: [
        { contextId, displayName: 'Repository validation' },
        { contextId, displayName: 'Another display name' },
      ],
    });
    const unsafeUri = parseProviderEvidenceInput({ ...providerInput(), sourceUri: 'file:///tmp/private.log' });
    assert.equal(badSha.ok, false);
    assert.equal(duplicateContext.ok, false);
    assert.equal(unsafeUri.ok, false);
  });

  test('ambiguous provider check and workflow job identities fail closed', () => {
    const original = providerInput();
    const duplicateCheckId = parseProviderEvidenceInput({
      ...original,
      checkRuns: [original.checkRuns[0], { ...original.checkRuns[1], recordId: original.checkRuns[0].recordId }],
    });
    const duplicateJobId = parseProviderEvidenceInput({
      ...original,
      workflowRuns: [{
        ...original.workflowRuns[0],
        jobs: [original.workflowRuns[0].jobs[0], { ...original.workflowRuns[0].jobs[0], name: 'Conflicting job' }],
      }],
    });
    assert.equal(duplicateCheckId.ok, false);
    assert.equal(duplicateJobId.ok, false);
    assert.ok(duplicateCheckId.diagnostics.some(({ code }) => code === 'GHE01_CHECK_ID_DUPLICATE'));
    assert.ok(duplicateJobId.diagnostics.some(({ code }) => code === 'GHE01_JOB_ID_DUPLICATE'));
  });

  test('provider object inspection exceptions become bounded diagnostics', () => {
    const hostile = new Proxy({}, { ownKeys() { throw new Error('sensitive provider exception'); } });
    const parsed = parseProviderEvidenceInput(hostile);
    assert.equal(parsed.ok, false);
    assert.deepEqual(parsed.diagnostics.map(({ code }) => code), ['GHE01_INPUT_UNREADABLE']);
    assert.equal(JSON.stringify(parsed).includes('sensitive provider exception'), false);
  });

  test('an evidence envelope without a changed path or required check context is invalid', () => {
    const noPaths = parseProviderEvidenceInput({ ...providerInput(), changedPaths: [] });
    const noRequiredContexts = parseProviderEvidenceInput({ ...providerInput(), requiredContexts: [] });
    assert.equal(noPaths.ok, false);
    assert.equal(noRequiredContexts.ok, false);
  });
}

if (typeof createProviderEvidenceBundle !== 'function' || typeof verifyProviderEvidenceBundle !== 'function') {
  test('M24 provider evidence normalizer is exported', () => {
    assert.equal(typeof createProviderEvidenceBundle, 'function');
    assert.equal(typeof verifyProviderEvidenceBundle, 'function');
  });
} else {
  test('A1 base binding mismatch is STALE and cannot become PASS', () => {
    const expected = expectedBinding({
      pullRequest: { number: 460, baseSha: 'b'.repeat(40), headSha: HEAD_SHA },
    });
    const result = collect(providerInput(), expected);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.verdict, 'STALE');
    assert.ok(result.value.reasonCodes.includes('BASE_SHA_MISMATCH'));

    const headMismatch = collect(providerInput(), expectedBinding({
      pullRequest: { number: 460, baseSha: BASE_SHA, headSha: 'd'.repeat(40) },
    }));
    assert.equal(headMismatch.ok, true);
    assert.equal(headMismatch.value.verdict, 'STALE');
    assert.ok(headMismatch.value.reasonCodes.includes('HEAD_SHA_MISMATCH'));
  });

  test('A2 missing and pending required checks remain NOT_VERIFIED and PENDING', () => {
    const second = { contextId: 'github:app:15368:new-required-check', displayName: 'New required check' };
    const input = providerInput({ requiredContexts: [providerInput().requiredContexts[0], second] });
    const missing = collect(input, expectedBinding({ requiredContexts: input.requiredContexts }));
    assert.equal(missing.ok, true, JSON.stringify(missing));
    assert.equal(missing.value.verdict, 'NOT_VERIFIED');
    assert.equal(missing.value.requiredContextResults.find((entry) => entry.contextId === second.contextId).verdict, 'NOT_VERIFIED');

    const pendingInput = providerInput({
      checkRuns: [{ ...providerInput().checkRuns[0], status: 'IN_PROGRESS', conclusion: null }],
    });
    const pending = collect(pendingInput);
    assert.equal(pending.ok, true, JSON.stringify(pending));
    assert.equal(pending.value.verdict, 'PENDING');
  });

  test('A3 duplicate display names do not satisfy a different required context identity', () => {
    const contexts = [
      { contextId, displayName: 'Build' },
      { contextId: 'github:app:15368:build-windows', displayName: 'Build' },
    ];
    const input = providerInput({ requiredContexts: contexts });
    const result = collect(input, expectedBinding({ requiredContexts: contexts }));
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.verdict, 'NOT_VERIFIED');
    assert.equal(result.value.requiredContextResults.length, 2);
    assert.equal(result.value.requiredContextResults[0].displayName, 'Build');
    assert.equal(result.value.requiredContextResults[1].displayName, 'Build');
    assert.equal(result.value.requiredContextResults.filter((entry) => entry.verdict === 'PASS').length, 1);
  });

  test('A4 a newer attempt on an earlier SHA supersedes an older passing attempt and is STALE', () => {
    const input = providerInput({
      checkRuns: [
        providerInput().checkRuns[0],
        { ...providerInput().checkRuns[0], recordId: 'check-record-2', attempt: 2, headSha: 'c'.repeat(40) },
      ],
    });
    const result = collect(input);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.verdict, 'STALE');
    assert.equal(result.value.checkRuns.find((entry) => entry.attempt === 1).selected, false);
    assert.equal(result.value.checkRuns.find((entry) => entry.attempt === 2).selected, true);
    assert.ok(result.value.reasonCodes.includes('CHECK_RUN_HEAD_MISMATCH'));
  });

  test('A7 denied, unavailable, or partial provider collection is NOT_VERIFIED even when check-shaped claims pass', () => {
    const denied = collect(providerInput({ collectionState: 'DENIED' }));
    const unavailable = collect(providerInput({ collectionState: 'UNAVAILABLE' }));
    const partial = collect(providerInput({ collectionState: 'PARTIAL' }));
    assert.equal(denied.ok, true, JSON.stringify(denied));
    assert.equal(unavailable.ok, true, JSON.stringify(unavailable));
    assert.equal(partial.ok, true, JSON.stringify(partial));
    assert.equal(denied.value.verdict, 'NOT_VERIFIED');
    assert.equal(unavailable.value.verdict, 'NOT_VERIFIED');
    assert.equal(partial.value.verdict, 'NOT_VERIFIED');
    assert.ok(denied.value.reasonCodes.includes('PROVIDER_DENIED'));
  });

  test('workflow attempts select only the latest attempt and bind its exact head', () => {
    const initial = providerInput().workflowRuns[0];
    const result = collect(providerInput({
      workflowRuns: [initial, { ...initial, attempt: 2, headSha: 'c'.repeat(40) }],
    }));
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.workflowRuns.find(({ attempt }) => attempt === 1).selected, false);
    assert.equal(result.value.workflowRuns.find(({ attempt }) => attempt === 2).selected, true);
    assert.equal(result.value.workflowRuns.find(({ attempt }) => attempt === 2).verdict, 'STALE');
  });

  test('provider evidence digest is deterministic and tampering is detected', () => {
    const input = providerInput();
    const first = collect(input);
    const reordered = collect({ ...input, checkRuns: [...input.checkRuns].reverse() });
    assert.equal(first.ok, true, JSON.stringify(first));
    assert.equal(reordered.ok, true, JSON.stringify(reordered));
    assert.equal(first.value.bundleDigest, reordered.value.bundleDigest);
    assert.deepEqual(verifyProviderEvidenceBundle(first.value, operationOptions), { ok: true, value: true });
    const tampered = verifyProviderEvidenceBundle({ ...first.value, verdict: 'FAILED' }, operationOptions);
    assert.equal(tampered.ok, true);
    assert.equal(tampered.value, false);
  });
}

function auditBinding(provider = expectedBinding(), ruleset = { rulesetId: '23566111', digest: RULESET_DIGEST }) {
  return { provider, ruleset };
}

function auditMappings(bundle, criterionIds = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']) {
  const testNames = {
    A1: 'base-binding-stale',
    A2: 'missing-and-pending',
    A3: 'duplicate-context-identity',
    A4: 'newer-attempt-old-sha',
    A5: 'executor-claim-does-not-override-provider',
    A6: 'packet-revalidation-after-head-change',
    A7: 'provider-denied-and-partial',
    A8: 'missing-criterion-proof-is-unproven',
  };
  return criterionIds.map((criterionId) => ({
    criterionId,
    testRefs: [`tests/gbs-mod-wo-002-evidence.test.mjs#${testNames[criterionId]}`],
    checkRunRefs: [bundle.checkRuns[0].evidenceRef],
  }));
}

function auditInput(overrides = {}, sourceInput = providerInput()) {
  const normalized = collect(sourceInput);
  assert.equal(normalized.ok, true, JSON.stringify(normalized));
  const binding = auditBinding(normalized.value.expectedBinding);
  return {
    evidenceBundle: normalized.value,
    candidateBinding: binding,
    currentBinding: binding,
    actualChangedPaths: [...normalized.value.expectedBinding.changedPaths],
    authorizationReceiptUri: 'https://github.com/KayzenRoot/gef-bootstrap/pull/460#issuecomment-6168359370',
    acceptanceMappings: auditMappings(normalized.value),
    unresolvedRiskIds: [],
    optionalReviewTools: [{ toolId: 'coderabbit', state: 'NOT_RUN' }],
    specialistReviewRequired: false,
    specialistReviewState: 'NOT_REQUIRED',
    checkpointDeltaStatus: 'PROPOSED_ONLY',
    ...overrides,
  };
}

if (typeof createProviderAuditPacket !== 'function' || typeof revalidateProviderAuditPacket !== 'function') {
  test('M27 exact-source audit packet API is exported', () => {
    assert.equal(typeof createProviderAuditPacket, 'function');
    assert.equal(typeof revalidateProviderAuditPacket, 'function');
  });
} else {
  test('M27 emits a bounded A1-A8 packet with exact source, no-go authority, and no self-approval', () => {
    const result = createProviderAuditPacket(auditInput(), operationOptions);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.verdict, 'PASS');
    assert.deepEqual(result.value.acceptanceProofs.map(({ criterionId }) => criterionId), ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']);
    assert.ok(result.value.acceptanceProofs.every(({ verdict }) => verdict === 'PASS'));
    assert.equal(result.value.acceptanceProofs[0].providerEvidence[0].sourceUri, sourceUri);
    assert.equal(result.value.authorizationReceiptUri, 'https://github.com/KayzenRoot/gef-bootstrap/pull/460#issuecomment-6168359370');
    assert.equal(result.value.ownerAudit, 'NOT_INDEPENDENT');
    assert.equal(result.value.checkpointDeltaStatus, 'PROPOSED_ONLY');
    assert.equal(result.value.mayApprove, false);
    assert.equal(result.value.mayMerge, false);
    assert.equal(result.value.mayPromoteCheckpoint, false);
    assert.equal(JSON.stringify(result.value).includes('executorClaims'), false);
  });

  test('A5 executor PASS prose cannot override a failed raw provider check', () => {
    const failedInput = providerInput({
      checkRuns: [{ ...providerInput().checkRuns[0], conclusion: 'FAILURE' }],
    });
    const normalized = collect(failedInput);
    assert.equal(normalized.ok, true, JSON.stringify(normalized));
    const result = createProviderAuditPacket(auditInput({
      evidenceBundle: normalized.value,
      candidateBinding: auditBinding(normalized.value.expectedBinding),
      currentBinding: auditBinding(normalized.value.expectedBinding),
      actualChangedPaths: [...normalized.value.expectedBinding.changedPaths],
      acceptanceMappings: auditMappings(normalized.value),
      executorClaims: ['A1=PASS; all checks green'],
    }, failedInput), operationOptions);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'FAILED');
    assert.equal(result.value.verdict, 'FAILED');
  });

  test('A6 changed head, lock, ruleset, tree, or blob identity makes a prior packet STALE', () => {
    const result = createProviderAuditPacket(auditInput(), operationOptions);
    assert.equal(result.ok, true, JSON.stringify(result));
    const mutations = [
      ['BASE_SHA_MISMATCH', (binding) => { binding.provider.pullRequest.baseSha = 'b'.repeat(40); }],
      ['HEAD_SHA_MISMATCH', (binding) => { binding.provider.pullRequest.headSha = 'b'.repeat(40); }],
      ['CONTEXT_LOCK_DIGEST_MISMATCH', (binding) => { binding.provider.contextLockDigest = `sha256:${sha('new-lock')}`; }],
      ['HEAD_TREE_SHA_MISMATCH', (binding) => { binding.provider.sourceTrees.headTreeSha = gitSha('new-head-tree'); }],
      ['FILE_BLOB_IDENTITIES_MISMATCH', (binding) => { binding.provider.fileBlobs[0].blobSha = gitSha('new-blob'); }],
      ['RULESET_DIGEST_MISMATCH', (binding) => {
        const newDigest = `sha256:${sha('new-ruleset')}`;
        binding.ruleset.digest = newDigest;
        binding.provider.ruleset.digest = newDigest;
      }],
      ['REQUIRED_CONTEXTS_MISMATCH', (binding) => { binding.provider.requiredContexts.push({ contextId: 'github:app:15368:extra', displayName: 'Extra' }); }],
      ['CHANGED_PATHS_MISMATCH', (binding) => {
        binding.provider.changedPaths[0] = '.engineering/evidence/GBS-MOD-WO-002-extra.md';
        binding.provider.fileBlobs[0].path = '.engineering/evidence/GBS-MOD-WO-002-extra.md';
      }],
    ];
    for (const [reason, mutate] of mutations) {
      const current = structuredClone(result.value.candidateBinding);
      mutate(current);
      const revalidated = revalidateProviderAuditPacket(result.value, current, operationOptions);
      assert.equal(revalidated.ok, true, JSON.stringify(revalidated));
      assert.equal(revalidated.value.state, 'STALE', reason);
      assert.ok(revalidated.value.reasonCodes.includes(reason), `${reason}: ${JSON.stringify(revalidated.value.reasonCodes)}`);
    }
    const tampered = revalidateProviderAuditPacket({ ...result.value, verdict: 'FAILED' }, result.value.candidateBinding, operationOptions);
    assert.equal(tampered.ok, true);
    assert.equal(tampered.value.state, 'INVALID');
  });

  test('A8 acceptance criterion without a proof mapping remains UNPROVEN', () => {
    const input = auditInput();
    input.acceptanceMappings = input.acceptanceMappings.filter(({ criterionId }) => criterionId !== 'A8');
    const result = createProviderAuditPacket(input, operationOptions);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs.find(({ criterionId }) => criterionId === 'A8').verdict, 'UNPROVEN');
    assert.equal(result.value.verdict, 'UNPROVEN');
  });

  test('out-of-scope paths block the packet and required specialist review cannot be inferred from an absent optional tool', () => {
    const scoped = auditInput({
      actualChangedPaths: [...expectedBinding().changedPaths, '.github/workflows/ci.yml'],
    });
    const blocked = createProviderAuditPacket(scoped, operationOptions);
    assert.equal(blocked.ok, true, JSON.stringify(blocked));
    assert.equal(blocked.value.verdict, 'STALE');
    assert.ok(blocked.value.reasonCodes.includes('WRITE_SCOPE_VIOLATION'));

    const reviewRequired = createProviderAuditPacket(auditInput({
      specialistReviewRequired: true,
      specialistReviewState: 'UNAVAILABLE',
    }), operationOptions);
    assert.equal(reviewRequired.ok, true, JSON.stringify(reviewRequired));
    assert.equal(reviewRequired.value.verdict, 'NOT_VERIFIED');
    assert.ok(reviewRequired.value.reasonCodes.includes('REQUIRED_SPECIALIST_REVIEW_NOT_VERIFIED'));
  });

  test('unknown packet inputs are rejected without copying raw logs or credential fields', () => {
    const secret = 'ghp_do-not-copy-this-value';
    const result = createProviderAuditPacket({ ...auditInput(), rawLogs: secret }, operationOptions);
    assert.equal(result.ok, false);
    assert.equal(JSON.stringify(result).includes(secret), false);
    const hostile = new Proxy({}, { ownKeys() { throw new Error('sensitive packet exception'); } });
    const unreadable = createProviderAuditPacket(hostile, operationOptions);
    assert.equal(unreadable.ok, false);
    assert.equal(JSON.stringify(unreadable).includes('sensitive packet exception'), false);
  });
}
