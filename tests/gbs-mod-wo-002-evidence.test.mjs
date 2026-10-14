import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import * as contracts from '../packages/contracts/dist/index.js';
import * as evidence from '../packages/evidence-engine/dist/public.js';
import * as assurance from '../packages/assurance-pipeline/dist/public.js';

const parseProviderEvidenceInput = contracts.parseProviderEvidenceInput;
const createProviderEvidenceBundle = evidence.createProviderEvidenceBundle;
const verifyProviderEvidenceBundle = evidence.verifyProviderEvidenceBundle;
const createProviderAuditPacket = assurance.createProviderAuditPacket;
const revalidateProviderAuditPacket = assurance.revalidateProviderAuditPacket;
const collectGitHubTestExecutionReport = evidence.collectGitHubTestExecutionReport;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const gitSha = (value) => createHash('sha1').update(value).digest('hex');
const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
function zipReport(path, text) {
  const name = Buffer.from(path);
  const raw = Buffer.from(text);
  const compressed = deflateRawSync(raw);
  const checksum = crc32(raw);
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);
  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(0, 42);
  name.copy(central, 46);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length + compressed.length, 16);
  return Buffer.concat([local, compressed, central, end]);
}
const stableStringify = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};
const resealProviderBundle = (bundle) => {
  const { bundleDigest: _bundleDigest, ...body } = bundle;
  return {
    ...body,
    bundleDigest: `sha256:${sha(`WOB2:PROVIDER_EVIDENCE_BUNDLE\n${stableStringify(body)}`)}`,
  };
};
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
const TEST_FILE = 'tests/gbs-mod-wo-002-evidence.test.mjs';
const TEST_RUN_ID = '123';
const TEST_CHECK_ID = '1001';

function checkRunFixtures(headSha = HEAD_SHA) {
  return requiredContextFixtures.map((context, index) => ({
    recordId: index === 0 ? TEST_CHECK_ID : `check-record-${index + 1}`,
    runId: index === 0 ? TEST_RUN_ID : `check-run-${index + 1}`,
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

const acceptanceTestRefs = {
  A1: `${TEST_FILE}#${TEST_FILE} :: A1 base binding mismatch is STALE and cannot become PASS`,
  A2: `${TEST_FILE}#${TEST_FILE} :: A2 missing and pending required checks remain NOT_VERIFIED and PENDING`,
  A3: `${TEST_FILE}#${TEST_FILE} :: A3 duplicate display names do not satisfy a different required context identity`,
  A4: `${TEST_FILE}#${TEST_FILE} :: A4 a newer attempt on an earlier SHA supersedes an older passing attempt and is STALE`,
  A5: `${TEST_FILE}#${TEST_FILE} :: A5 executor PASS prose cannot override a failed raw provider check`,
  A6: `${TEST_FILE}#${TEST_FILE} :: A6 changed head, lock, ruleset, tree, or blob identity makes a prior packet STALE`,
  A7: `${TEST_FILE}#${TEST_FILE} :: A7 denied, unavailable, or partial provider collection is NOT_VERIFIED even when check-shaped claims pass`,
  A8: `${TEST_FILE}#${TEST_FILE} :: A8 acceptance criterion without a proof mapping remains UNPROVEN`,
};

function testExecutionReceipts(checkRun, overrides = {}) {
  return Object.entries(acceptanceTestRefs).map(([criterionId, testRef], index) => {
    const receipt = {
      receiptId: `test-receipt-${criterionId.toLowerCase()}`,
      checkRunRecordId: checkRun.recordId,
      runId: checkRun.runId,
      attempt: checkRun.attempt,
      headSha: checkRun.headSha,
      testRef,
      outcome: 'PASSED',
      reportUri: `${sourceUri}/artifacts/${index + 1}`,
      reportDigest: `sha256:${sha(JSON.stringify({ criterionId, testRef, outcome: 'PASSED', headSha: checkRun.headSha }))}`,
    };
    return { ...receipt, ...(overrides[criterionId] ?? {}) };
  });
}

function specReport(outcomes = {}, { omitted = [], duplicates = [], todo = false } = {}) {
  const omittedRefs = new Set(omitted);
  const cases = Object.values(acceptanceTestRefs).flatMap((testRef) => {
    if (omittedRefs.has(testRef)) return [];
    const outcome = outcomes[testRef] ?? 'PASSED';
    const title = testRef.slice(testRef.indexOf('#') + 1);
    const symbol = outcome === 'PASSED' || outcome === 'NOT_EXECUTED' ? '✔' : outcome === 'FAILED' ? '✖' : '﹣';
    const annotation = outcome === 'NOT_EXECUTED' ? ' # CANCELLED by signal' : '';
    return [{ testRef, line: `${symbol} ${title} (1.0ms)${annotation}`, outcome }];
  });
  if (todo) cases.push({ testRef: null, line: '✔ unrelated todo (1.0ms) # TODO', outcome: 'TODO' });
  for (const testRef of duplicates) {
    const title = testRef.slice(testRef.indexOf('#') + 1);
    cases.push({ testRef, line: `✖ ${title} (1.1ms)`, outcome: 'FAILED' });
  }
  const passed = cases.filter(({ outcome }) => outcome === 'PASSED').length;
  const failed = cases.filter(({ outcome }) => outcome === 'FAILED').length;
  const skipped = cases.filter(({ outcome }) => outcome === 'SKIPPED').length;
  const cancelled = cases.filter(({ outcome }) => outcome === 'NOT_EXECUTED').length;
  const todoCount = cases.filter(({ outcome }) => outcome === 'TODO').length;
  const report = [
    ...cases.map(({ line }) => line),
    `ℹ tests ${cases.length}`,
    'ℹ suites 0',
    `ℹ pass ${passed}`,
    `ℹ fail ${failed}`,
    `ℹ cancelled ${cancelled}`,
    `ℹ skipped ${skipped}`,
    `ℹ todo ${todoCount}`,
    'ℹ duration_ms 10.0',
  ].join('\n');
  return { report, cases };
}

function fakeGitHubReportApi(options = {}) {
  const attempt = options.attempt ?? 1;
  const report = options.report ?? specReport(options.outcomes, options).report;
  const reportBytes = Buffer.from(report);
  const archiveBytes = zipReport('job/test-output.txt', report);
  if (options.corruptArchive === true) archiveBytes[50] ^= 0xff;
  if (options.multiDiskArchive === true) archiveBytes.writeUInt16LE(1, archiveBytes.length - 22 + 4);
  const downloadUrl = 'https://results-receiver.actions.githubusercontent.com/job-report.zip';
  const runHeadSha = options.runHeadSha ?? HEAD_SHA;
  const runAttempt = options.runAttempt ?? attempt;
  const runRepository = options.runRepository ?? 'KayzenRoot/gef-bootstrap';
  const runCheckSuiteId = options.runCheckSuiteId ?? '5678';
  const jobRunId = options.jobRunId ?? TEST_RUN_ID;
  const jobAttempt = options.jobAttempt ?? attempt;
  const jobHeadSha = options.jobHeadSha ?? runHeadSha;
  const jobCheckRunId = options.jobCheckRunId ?? TEST_CHECK_ID;
  const logsStatus = options.logsStatus ?? 302;
  return {
    reportBytes,
    fetch: async (input, init = {}) => {
      const requestUrl = new URL(String(input));
      const headers = new Headers(init.headers);
      if (requestUrl.origin === 'https://api.github.com') {
        assert.equal(headers.get('authorization'), 'Bearer fixture-token');
        assert.equal(headers.get('x-github-api-version'), '2022-11-28');
      } else {
        assert.equal(headers.has('authorization'), false, 'signed download requests must not receive the GitHub token');
      }
      if (requestUrl.pathname === `/repos/KayzenRoot/gef-bootstrap/actions/runs/${TEST_RUN_ID}/attempts/${attempt}`) {
        return Response.json({
          id: Number(TEST_RUN_ID), run_attempt: runAttempt, head_sha: runHeadSha,
          check_suite_id: Number(runCheckSuiteId),
          status: 'completed', conclusion: 'success', repository: { full_name: runRepository },
        });
      }
      if (requestUrl.pathname === `/repos/KayzenRoot/gef-bootstrap/actions/runs/${TEST_RUN_ID}/attempts/${attempt}/jobs`) {
        return Response.json({ jobs: [{
          id: Number(jobCheckRunId), run_id: Number(jobRunId), run_attempt: jobAttempt, head_sha: jobHeadSha,
          check_run_url: `https://api.github.com/repos/KayzenRoot/gef-bootstrap/check-runs/${jobCheckRunId}`,
          name: options.jobName ?? 'Repository validation', status: 'completed', conclusion: options.jobConclusion ?? 'success',
        }] });
      }
      if (requestUrl.pathname === `/repos/KayzenRoot/gef-bootstrap/check-runs/${TEST_CHECK_ID}`) {
        return Response.json({
          id: Number(TEST_CHECK_ID), name: options.checkName ?? options.jobName ?? 'Repository validation',
          head_sha: options.checkHeadSha ?? runHeadSha,
          status: options.checkStatus ?? 'completed', conclusion: options.checkConclusion ?? options.jobConclusion ?? 'success',
          check_suite: { id: Number(options.checkSuiteId ?? '5678') },
          details_url: options.checkDetailsUrl ?? `https://github.com/KayzenRoot/gef-bootstrap/actions/runs/${TEST_RUN_ID}/job/${TEST_CHECK_ID}`,
        });
      }
      if (requestUrl.pathname === `/repos/KayzenRoot/gef-bootstrap/actions/jobs/${TEST_CHECK_ID}/logs`) {
        if (logsStatus !== 302) return new Response(null, { status: logsStatus });
        return new Response(null, { status: 302, headers: { location: downloadUrl } });
      }
      if (String(input) === downloadUrl) return new Response(archiveBytes, {
        status: 200,
        headers: options.archiveContentLength === undefined ? {} : { 'content-length': options.archiveContentLength },
      });
      throw new Error('Unexpected provider request');
    },
  };
}

async function collectVerifiedReport(options = {}) {
  const api = fakeGitHubReportApi(options);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = api.fetch;
  try {
    const collection = await collectGitHubTestExecutionReport({
      repository: 'KayzenRoot/gef-bootstrap',
      runId: TEST_RUN_ID,
      attempt: options.requestAttempt ?? options.attempt ?? 1,
      headSha: options.requestHeadSha ?? HEAD_SHA,
      checkRunId: options.requestCheckRunId ?? TEST_CHECK_ID,
      token: options.noToken === true ? undefined : options.token ?? 'fixture-token',
    });
    return { collection, reportBytes: api.reportBytes };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const defaultTestReportCollection = (await collectVerifiedReport()).collection;

function providerInput(overrides = {}) {
  const checkRuns = checkRunFixtures();
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
    checkRuns,
    testExecutionReceipts: [],
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

function collect(input, expected = expectedBinding(), reportCollections = [defaultTestReportCollection]) {
  return createProviderEvidenceBundle(parseProviderEvidenceInput(input), expected, operationOptions, reportCollections);
}

if (typeof parseProviderEvidenceInput !== 'function') {
  test('versioned provider evidence contract is exported', () => {
    assert.equal(typeof parseProviderEvidenceInput, 'function');
  });
} else {
  test('authenticated Actions report collection binds raw report bytes to a case, job, attempt, and HEAD', async () => {
    const { collection, reportBytes } = await collectVerifiedReport();
    assert.equal(collection.state, 'VERIFIED');
    assert.equal(collection.runId, TEST_RUN_ID);
    assert.equal(collection.attempt, 1);
    assert.equal(collection.headSha, HEAD_SHA);
    assert.equal(collection.checkRunId, TEST_CHECK_ID);
    assert.equal(collection.reportDigest, `sha256:${sha(reportBytes)}`);
    assert.equal(collection.reportUri, `https://github.com/KayzenRoot/gef-bootstrap/actions/runs/${TEST_RUN_ID}/job/${TEST_CHECK_ID}`);
    assert.deepEqual(collection.cases.find(({ testRef }) => testRef === acceptanceTestRefs.A1), {
      testRef: acceptanceTestRefs.A1,
      outcome: 'PASSED',
    });
  });

  test('missing or denied report access remains unavailable with its exact reason', async () => {
    const missingToken = await collectVerifiedReport({ noToken: true });
    const emptyToken = await collectVerifiedReport({ token: '' });
    const denied = await collectVerifiedReport({ logsStatus: 403 });
    assert.equal(missingToken.collection.state, 'UNAVAILABLE');
    assert.ok(missingToken.collection.reasonCodes.includes('GITHUB_TOKEN_MISSING'));
    assert.equal(emptyToken.collection.state, 'UNAVAILABLE');
    assert.ok(emptyToken.collection.reasonCodes.includes('GITHUB_TOKEN_MISSING'));
    assert.equal(denied.collection.state, 'DENIED');
    assert.ok(denied.collection.reasonCodes.includes('GITHUB_TEST_REPORT_LOGS_DENIED'));
    const packet = createPacketForSource(providerInput(), 'A1', {}, [denied.collection]);
    assert.equal(packet.ok, true, JSON.stringify(packet));
    assert.equal(packet.value.acceptanceProofs[0].verdict, 'NOT_VERIFIED');
    assert.ok(packet.value.acceptanceProofs[0].reasonCodes.includes('GITHUB_TEST_REPORT_LOGS_DENIED'));
  });

  test('stale SHA, wrong attempt, mismatched check, and foreign run cannot authenticate a test report', async () => {
    const stale = await collectVerifiedReport({ runHeadSha: 'b'.repeat(40) });
    const attempt = await collectVerifiedReport({ runAttempt: 2 });
    const check = await collectVerifiedReport({ jobCheckRunId: '9999' });
    const run = await collectVerifiedReport({ jobRunId: '9998' });
    for (const collection of [stale.collection, attempt.collection, check.collection, run.collection]) {
      assert.notEqual(collection.state, 'VERIFIED');
      assert.equal(collection.cases.length, 0);
    }
    assert.ok(stale.collection.reasonCodes.includes('GITHUB_TEST_REPORT_HEAD_MISMATCH'));
    assert.ok(attempt.collection.reasonCodes.includes('GITHUB_TEST_REPORT_ATTEMPT_MISMATCH'));
    assert.ok(check.collection.reasonCodes.includes('GITHUB_TEST_REPORT_CHECK_UNBOUND'));
    assert.ok(run.collection.reasonCodes.includes('GITHUB_TEST_REPORT_RUN_MISMATCH'));
  });

  test('missing, failed, skipped, and duplicate report cases never become passing cases', async () => {
    const missing = await collectVerifiedReport({ omitted: [acceptanceTestRefs.A1] });
    const failed = await collectVerifiedReport({ outcomes: { [acceptanceTestRefs.A1]: 'FAILED' } });
    const skipped = await collectVerifiedReport({ outcomes: { [acceptanceTestRefs.A1]: 'SKIPPED' } });
    const duplicate = await collectVerifiedReport({ duplicates: [acceptanceTestRefs.A1] });
    assert.equal(missing.collection.state, 'VERIFIED');
    assert.equal(missing.collection.cases.some(({ testRef }) => testRef === acceptanceTestRefs.A1), false);
    assert.equal(failed.collection.cases.find(({ testRef }) => testRef === acceptanceTestRefs.A1).outcome, 'FAILED');
    assert.equal(skipped.collection.cases.find(({ testRef }) => testRef === acceptanceTestRefs.A1).outcome, 'SKIPPED');
    assert.equal(duplicate.collection.state, 'INVALID');
    assert.ok(duplicate.collection.reasonCodes.includes('GITHUB_TEST_REPORT_CASE_DUPLICATE'));
  });

  test('Node test TODO results are not confused with passed tests or rejected as malformed output', async () => {
    const { collection } = await collectVerifiedReport({ todo: true });
    assert.equal(collection.state, 'VERIFIED');
    assert.equal(collection.cases.length, 8);
  });

  test('corrupt report bytes and a failed authenticated job are rejected with exact reasons', async () => {
    const corrupt = await collectVerifiedReport({ corruptArchive: true });
    const multiDisk = await collectVerifiedReport({ multiDiskArchive: true });
    const invalidLength = await collectVerifiedReport({ archiveContentLength: 'not-a-length' });
    const failedJob = await collectVerifiedReport({ jobConclusion: 'failure' });
    assert.equal(corrupt.collection.state, 'INVALID');
    assert.ok(corrupt.collection.reasonCodes.includes('GITHUB_TEST_REPORT_ARCHIVE_INVALID'));
    assert.equal(multiDisk.collection.state, 'INVALID');
    assert.ok(multiDisk.collection.reasonCodes.includes('GITHUB_TEST_REPORT_ARCHIVE_INVALID'));
    assert.notEqual(invalidLength.collection.state, 'VERIFIED');
    assert.equal(failedJob.collection.state, 'FAILED');
    assert.ok(failedJob.collection.reasonCodes.includes('GITHUB_TEST_REPORT_JOB_FAILED'));
  });

  test('the authenticated Check Run must agree with the job and workflow suite', async () => {
    const suite = await collectVerifiedReport({ checkSuiteId: '9999' });
    const name = await collectVerifiedReport({ checkName: 'Different check' });
    const details = await collectVerifiedReport({ checkDetailsUrl: 'https://github.com/KayzenRoot/gef-bootstrap/actions/runs/999/job/1001' });
    for (const collection of [suite.collection, name.collection, details.collection]) assert.notEqual(collection.state, 'VERIFIED');
    assert.ok(suite.collection.reasonCodes.includes('GITHUB_TEST_REPORT_CHECK_SUITE_MISMATCH'));
    assert.ok(name.collection.reasonCodes.includes('GITHUB_TEST_REPORT_CHECK_JOB_MISMATCH'));
    assert.ok(details.collection.reasonCodes.includes('GITHUB_TEST_REPORT_CHECK_JOB_MISMATCH'));
  });

  test('altering a report collection digest invalidates its authenticated provenance', async () => {
    const { collection } = await collectVerifiedReport();
    const altered = structuredClone(collection);
    altered.reportDigest = `sha256:${sha('different report bytes')}`;
    const result = collect(providerInput(), expectedBinding(), [altered]);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some(({ code }) => code === 'GHE24_TEST_REPORT_COLLECTION_UNVERIFIED'));
  });

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

  test('caller-provided test receipts are rejected even when their asserted binding is complete', () => {
    const original = providerInput();
    const forged = parseProviderEvidenceInput({
      ...original,
      testExecutionReceipts: testExecutionReceipts(original.checkRuns[0]),
    });
    assert.equal(forged.ok, false);
    assert.ok(forged.diagnostics.some(({ code }) => code === 'GHE01_TEST_RECEIPTS_UNAUTHENTICATED'));
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
  test(`${TEST_FILE} :: A1 base binding mismatch is STALE and cannot become PASS`, () => {
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

  test(`${TEST_FILE} :: A2 missing and pending required checks remain NOT_VERIFIED and PENDING`, () => {
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

  test(`${TEST_FILE} :: A3 duplicate display names do not satisfy a different required context identity`, () => {
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

  test(`${TEST_FILE} :: A4 a newer attempt on an earlier SHA supersedes an older passing attempt and is STALE`, () => {
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

  test(`${TEST_FILE} :: A7 denied, unavailable, or partial provider collection is NOT_VERIFIED even when check-shaped claims pass`, () => {
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
  return criterionIds.map((criterionId) => ({
    criterionId,
    testRefs: [acceptanceTestRefs[criterionId]],
    checkRunRefs: [bundle.checkRuns[0].evidenceRef],
  }));
}

function auditInput(overrides = {}, sourceInput = providerInput(), reportCollections = [defaultTestReportCollection]) {
  const normalized = collect(sourceInput, expectedBinding(), reportCollections);
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

function createPacketForSource(sourceInput, criterionId = 'A1', inputOverrides = {}, reportCollections = [defaultTestReportCollection]) {
  const normalized = collect(sourceInput, expectedBinding(), reportCollections);
  assert.equal(normalized.ok, true, JSON.stringify(normalized));
  const binding = auditBinding(normalized.value.expectedBinding);
  return createProviderAuditPacket(auditInput({
    evidenceBundle: normalized.value,
    candidateBinding: binding,
    currentBinding: binding,
    actualChangedPaths: [...normalized.value.expectedBinding.changedPaths],
    acceptanceMappings: auditMappings(normalized.value, [criterionId]),
    ...inputOverrides,
  }, sourceInput, reportCollections), operationOptions);
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

  test('a changed test file and a fabricated test name cannot prove an acceptance criterion', () => {
    const input = auditInput();
    input.acceptanceMappings[0].testRefs = [
      'tests/gbs-mod-wo-002-evidence.test.mjs#this test name was never executed',
    ];
    const result = createProviderAuditPacket(input, operationOptions);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'UNPROVEN');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_CASE_NOT_FOUND_IN_VERIFIED_REPORT'));
  });

  test('a caller-fabricated complete receipt cannot prove a test without authenticated report bytes', () => {
    const source = providerInput({ testExecutionReceipts: testExecutionReceipts(providerInput().checkRuns[0]) });
    const parsed = parseProviderEvidenceInput(source);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.diagnostics.some(({ code }) => code === 'GHE01_TEST_RECEIPTS_UNAUTHENTICATED'));
  });

  test('a provider check without any case-level test receipt leaves the criterion UNPROVEN', () => {
    const result = createPacketForSource(providerInput(), 'A1', {}, []);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'UNPROVEN');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_REPORT_COLLECTION_NOT_PROVIDED'));
  });

  test('an exact-head test execution receipt is emitted with its provider run and report identity', () => {
    const result = createPacketForSource(providerInput());
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'PASS');
    assert.deepEqual(result.value.acceptanceProofs[0].testEvidence.map((receipt) => ({
      testRef: receipt.testRef,
      runId: receipt.runId,
      attempt: receipt.attempt,
      headSha: receipt.headSha,
      outcome: receipt.outcome,
      reportUri: receipt.reportUri,
      reportDigest: receipt.reportDigest,
      verdict: receipt.verdict,
    })), [{
      testRef: acceptanceTestRefs.A1,
      runId: TEST_RUN_ID,
      attempt: 1,
      headSha: HEAD_SHA,
      outcome: 'PASSED',
      reportUri: defaultTestReportCollection.reportUri,
      reportDigest: defaultTestReportCollection.reportDigest,
      verdict: 'PASS',
    }]);
  });

  test('a missing case in the verified report remains UNPROVEN', async () => {
    const missing = (await collectVerifiedReport({ omitted: [acceptanceTestRefs.A1] })).collection;
    const result = createPacketForSource(providerInput(), 'A1', {}, [missing]);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'UNPROVEN');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_CASE_NOT_FOUND_IN_VERIFIED_REPORT'));
  });

  test('a failed case in the verified report fails its acceptance proof despite a successful enclosing check', async () => {
    const failed = (await collectVerifiedReport({ outcomes: { [acceptanceTestRefs.A1]: 'FAILED' } })).collection;
    const result = createPacketForSource(providerInput(), 'A1', {}, [failed]);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'FAILED');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_EXECUTION_FAILED'));
  });

  test('an unexecuted case in the verified report remains NOT_VERIFIED', async () => {
    const unexecuted = (await collectVerifiedReport({ outcomes: { [acceptanceTestRefs.A1]: 'NOT_EXECUTED' } })).collection;
    assert.equal(unexecuted.state, 'VERIFIED');
    assert.equal(unexecuted.cases.find(({ testRef }) => testRef === acceptanceTestRefs.A1).outcome, 'NOT_EXECUTED');
    const result = createPacketForSource(providerInput(), 'A1', {}, [unexecuted]);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'NOT_VERIFIED');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_EXECUTION_NOT_RUN'));
  });

  test('a skipped case in the verified report remains NOT_VERIFIED', async () => {
    const skipped = (await collectVerifiedReport({ outcomes: { [acceptanceTestRefs.A1]: 'SKIPPED' } })).collection;
    const result = createPacketForSource(providerInput(), 'A1', {}, [skipped]);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'NOT_VERIFIED');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('TEST_EXECUTION_SKIPPED'));
  });

  test('a passing report from an earlier SHA is STALE and cannot prove its acceptance test', async () => {
    const stale = (await collectVerifiedReport({ runHeadSha: 'b'.repeat(40) })).collection;
    const result = createPacketForSource(providerInput(), 'A1', {}, [stale]);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.acceptanceProofs[0].verdict, 'STALE');
    assert.ok(result.value.acceptanceProofs[0].reasonCodes.includes('GITHUB_TEST_REPORT_HEAD_MISMATCH'));
  });

  test('an altered test receipt invalidates the Evidence Bundle digest', () => {
    const input = providerInput();
    const normalized = collect(input);
    assert.equal(normalized.ok, true, JSON.stringify(normalized));
    const alteredBundle = structuredClone(normalized.value);
    alteredBundle.testExecutionReceipts[0].reportDigest = `sha256:${sha('altered-report')}`;
    const result = createProviderAuditPacket(auditInput({ evidenceBundle: alteredBundle }, input), operationOptions);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some(({ code }) => code === 'M27_AUDIT_EVIDENCE_DIGEST_INVALID'));
  });

  test('an altered execution outcome cannot become PASS by recomputing the bundle digest', () => {
    const normalized = collect(providerInput());
    assert.equal(normalized.ok, true, JSON.stringify(normalized));
    const alteredBundle = structuredClone(normalized.value);
    alteredBundle.testExecutionReceipts[0].outcome = 'NOT_EXECUTED';
    const resealedBundle = resealProviderBundle(alteredBundle);
    assert.equal(verifyProviderEvidenceBundle(resealedBundle, operationOptions).value, false);
    const result = createProviderAuditPacket(auditInput({ evidenceBundle: resealedBundle }), operationOptions);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.ok(result.diagnostics.some(({ code }) => code === 'M27_AUDIT_EVIDENCE_DIGEST_INVALID'));
  });

  test(`${TEST_FILE} :: A5 executor PASS prose cannot override a failed raw provider check`, () => {
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

  test(`${TEST_FILE} :: A6 changed head, lock, ruleset, tree, or blob identity makes a prior packet STALE`, () => {
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

  test(`${TEST_FILE} :: A8 acceptance criterion without a proof mapping remains UNPROVEN`, () => {
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
