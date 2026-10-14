import { isProviderTestRef, type ProviderCheckConclusion, type ProviderCheckStatus, type ProviderTestExecutionOutcome } from '@gef-bootstrap/contracts';
import { deepFreeze } from './utils.js';

export type ProviderTestReportCollectionState = 'VERIFIED' | 'FAILED' | 'PENDING' | 'UNAVAILABLE' | 'DENIED' | 'STALE' | 'INVALID';

export interface ProviderTestReportCase {
  readonly testRef: string;
  readonly outcome: ProviderTestExecutionOutcome;
}

/** Authenticated, read-only facts collected from one exact GitHub Actions job log. */
export interface ProviderTestReportCollection {
  readonly state: ProviderTestReportCollectionState;
  readonly repository: string;
  readonly runId: string;
  readonly attempt: number;
  readonly headSha: string;
  readonly checkRunId: string;
  readonly checkName: string | null;
  readonly checkStatus: ProviderCheckStatus | null;
  readonly checkConclusion: ProviderCheckConclusion;
  readonly jobId: string | null;
  readonly reportUri: string | null;
  readonly reportDigest: string | null;
  readonly cases: readonly ProviderTestReportCase[];
  readonly reasonCodes: readonly string[];
}

export interface GitHubTestReportRequest {
  readonly repository: string;
  readonly runId: string;
  readonly attempt: number;
  readonly headSha: string;
  readonly checkRunId: string;
  readonly token?: string;
}

interface PrivateCollectionRecord {
  readonly snapshot: string;
  readonly reportBytes: Uint8Array | null;
  readonly reportDigest: string | null;
}

interface ParsedReport {
  readonly cases: readonly ProviderTestReportCase[];
  readonly bytes: Uint8Array;
  readonly invalidReason?: string;
}

type TapSummaryName = 'tests' | 'pass' | 'fail' | 'cancelled' | 'skipped' | 'todo';

interface ParsedTapResult {
  readonly counter: number;
  readonly title: string;
  readonly outcome: ProviderTestExecutionOutcome;
  readonly summaryName: Exclude<TapSummaryName, 'tests'>;
}

interface ProviderResponse<T> {
  readonly status: number;
  readonly value: T | null;
}

type ProviderTestReportFailureState = Exclude<ProviderTestReportCollectionState, 'VERIFIED'>;

type StageResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly state: ProviderTestReportFailureState; readonly reason: string };

const API_ROOT = 'https://api.github.com';
const MAX_TOKEN_LENGTH = 4096;
const MAX_API_BODY = 2 * 1024 * 1024;
const MAX_REPORT_BYTES = 24 * 1024 * 1024;
const MAX_WORKFLOW_JOBS = 512;
const MAX_TEST_CASES = 8192;
const SHA40 = /^[0-9a-f]{40}$/;
const DECIMAL_ID = /^\d{1,20}$/;
const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;
const COLLECTION_RECORDS = new WeakMap<object, PrivateCollectionRecord>();

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stableSnapshot(value: unknown): string {
  if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSnapshot).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record).sort((left, right) => left.localeCompare(right, 'en'))
      .map((key) => `${JSON.stringify(key)}:${stableSnapshot(record[key])}`).join(',');
    return `{${entries}}`;
  }
  throw new Error('UNSUPPORTED_COLLECTION_VALUE');
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  const hex = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
  return `sha256:${hex}`;
}

function snapshotFields(collection: ProviderTestReportCollection): string {
  return stableSnapshot({
    state: collection.state,
    repository: collection.repository,
    runId: collection.runId,
    attempt: collection.attempt,
    headSha: collection.headSha,
    checkRunId: collection.checkRunId,
    checkName: collection.checkName,
    checkStatus: collection.checkStatus,
    checkConclusion: collection.checkConclusion,
    jobId: collection.jobId,
    reportUri: collection.reportUri,
    reportDigest: collection.reportDigest,
    cases: collection.cases,
    reasonCodes: collection.reasonCodes,
  });
}

function createCollection(
  fields: Omit<ProviderTestReportCollection, 'cases'> & { readonly cases?: readonly ProviderTestReportCase[] },
  reportBytes: Uint8Array | null = null,
): ProviderTestReportCollection {
  const collection = deepFreeze({ ...fields, cases: fields.cases ?? [] }) as ProviderTestReportCollection;
  COLLECTION_RECORDS.set(collection, {
    snapshot: snapshotFields(collection),
    reportBytes,
    reportDigest: collection.reportDigest,
  });
  return collection;
}

/** Internal runtime provenance check. Public callers cannot create the module-private WeakMap entry. */
export function inspectProviderTestReportCollection(value: unknown): ProviderTestReportCollection | null {
  if (value === null || typeof value !== 'object') return null;
  const privateRecord = COLLECTION_RECORDS.get(value);
  if (privateRecord === undefined || !isRecord(value)) return null;
  const collection = value as unknown as ProviderTestReportCollection;
  try {
    if (snapshotFields(collection) !== privateRecord.snapshot) return null;
    if (collection.state === 'VERIFIED') {
      if (privateRecord.reportBytes === null || collection.reportDigest !== privateRecord.reportDigest) return null;
    } else if (privateRecord.reportBytes !== null) {
      return null;
    }
    return collection;
  } catch {
    return null;
  }
}

function requestIsValid(request: GitHubTestReportRequest): boolean {
  return isRecord(request)
    && Object.keys(request).every((key) => ['repository', 'runId', 'attempt', 'headSha', 'checkRunId', 'token'].includes(key))
    && typeof request.repository === 'string' && REPOSITORY.test(request.repository)
    && typeof request.runId === 'string' && DECIMAL_ID.test(request.runId)
    && Number.isSafeInteger(request.attempt) && request.attempt > 0 && request.attempt <= 1000
    && typeof request.headSha === 'string' && SHA40.test(request.headSha)
    && typeof request.checkRunId === 'string' && DECIMAL_ID.test(request.checkRunId)
    && (request.token === undefined || (typeof request.token === 'string'
      && request.token.length <= MAX_TOKEN_LENGTH
      && request.token.trim() === request.token && !/[\u0000-\u001f\u007f]/.test(request.token)));
}

function invalidRequestCollection(): ProviderTestReportCollection {
  return createCollection({
    state: 'INVALID',
    repository: 'unknown/unknown',
    runId: '0',
    attempt: 1,
    headSha: '0'.repeat(40),
    checkRunId: '0',
    checkName: null,
    checkStatus: null,
    checkConclusion: null,
    jobId: null,
    reportUri: null,
    reportDigest: null,
    cases: [],
    reasonCodes: ['GITHUB_TEST_REPORT_REQUEST_INVALID'],
  });
}

function failedCollection(
  request: GitHubTestReportRequest,
  state: Exclude<ProviderTestReportCollectionState, 'VERIFIED'>,
  reason: string,
): ProviderTestReportCollection {
  return createCollection({
    state,
    repository: request.repository,
    runId: request.runId,
    attempt: request.attempt,
    headSha: request.headSha,
    checkRunId: request.checkRunId,
    checkName: null,
    checkStatus: null,
    checkConclusion: null,
    jobId: null,
    reportUri: null,
    reportDigest: null,
    cases: [],
    reasonCodes: [reason],
  });
}

function parseProviderId(value: unknown): string | null {
  if (typeof value === 'string' && DECIMAL_ID.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  return null;
}

function responseFailure(status: number): { readonly state: 'DENIED' | 'UNAVAILABLE'; readonly reason: string } {
  if (status === 401 || status === 403) return { state: 'DENIED', reason: 'GITHUB_TEST_REPORT_API_DENIED' };
  if (status === 404) return { state: 'UNAVAILABLE', reason: 'GITHUB_TEST_REPORT_NOT_FOUND_OR_PRIVATE' };
  return { state: 'UNAVAILABLE', reason: 'GITHUB_TEST_REPORT_API_UNAVAILABLE' };
}

async function readBounded(response: Response, limit: number): Promise<Uint8Array | null> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) return null;
    const declaredBytes = Number(declaredLength);
    if (!Number.isSafeInteger(declaredBytes) || declaredBytes > limit) return null;
  }
  if (response.body === null) return new Uint8Array(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.length;
      if (length > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function getJson<T>(url: string, token: string): Promise<ProviderResponse<T>> {
  try {
    const response = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (response.status !== 200) return { status: response.status, value: null };
    const bytes = await readBounded(response, MAX_API_BODY);
    if (bytes === null) return { status: 413, value: null };
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as T;
    return { status: 200, value };
  } catch {
    return { status: 0, value: null };
  }
}

function reportCaseFromTitle(title: string, outcome: ProviderTestExecutionOutcome): ProviderTestReportCase | null {
  const separator = title.indexOf(' :: ');
  if (separator <= 0) return null;
  const path = title.slice(0, separator);
  const testRef = `${path}#${title}`;
  return isProviderTestRef(testRef) ? { testRef, outcome } : null;
}

function hasDuplicateReportCases(cases: readonly ProviderTestReportCase[]): boolean {
  const seen = new Set<string>();
  for (const entry of cases) {
    if (seen.has(entry.testRef)) return true;
    seen.add(entry.testRef);
  }
  return false;
}

const TAP_SUMMARY_NAMES: readonly TapSummaryName[] = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
const ANSI_CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g;
const ANSI_OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g;

interface ParsedTapStream {
  readonly counts: Partial<Record<TapSummaryName, number>>;
  readonly plan: number | null;
  readonly subtests: readonly string[];
  readonly results: readonly ParsedTapResult[];
}

function validGitHubTimestamp(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?Z$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= (daysInMonth[month - 1] ?? 0)
    && hour <= 23 && minute <= 59 && second <= 59;
}

function normalizeGitHubLogLine(value: string): string | null {
  const withoutAnsi = value.replace(ANSI_OSC, '').replace(ANSI_CSI, '');
  const timestamp = /^(\d{4}-\d{2}-\d{2}T[^ ]+) (.*)$/.exec(withoutAnsi);
  if (timestamp !== null) return validGitHubTimestamp(timestamp[1]!) ? timestamp[2]! : null;
  if (/^\d{4}-\d{2}-\d{2}T/.test(withoutAnsi)) return null;
  return withoutAnsi;
}

function decodeGitHubLog(bytes: Uint8Array): readonly string[] | null {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const lines = text.split(/\r?\n/).map(normalizeGitHubLogLine);
    return lines.some((line) => line === null) ? null : lines as string[];
  } catch {
    return null;
  }
}

function parseTapSummaryLine(line: string): { readonly name: TapSummaryName; readonly count: number } | null {
  const match = /^# (tests|pass|fail|cancelled|skipped|todo) (0|[1-9]\d*)$/.exec(line);
  if (match === null) return null;
  const count = Number(match[2]);
  return Number.isSafeInteger(count) ? { name: match[1] as TapSummaryName, count } : null;
}

function parseTapPlanLine(line: string): number | null {
  const match = /^1\.\.(0|[1-9]\d*)$/.exec(line);
  if (match === null) return null;
  const count = Number(match[1]);
  return Number.isSafeInteger(count) ? count : null;
}

function parseTapResultLine(line: string): ParsedTapResult | null {
  const match = /^(ok|not ok) ([1-9]\d*) - (.+?)(?: # (SKIP|TODO|CANCELLED|NOT EXECUTED)(?:\s+.*)?)?$/.exec(line);
  if (match === null || match[3]!.trim() !== match[3]) return null;
  const status = match[1];
  const counter = Number(match[2]);
  const annotation = match[4] ?? '';
  if (!Number.isSafeInteger(counter)) return null;
  if (annotation === 'SKIP') return { counter, title: match[3]!, outcome: 'SKIPPED', summaryName: 'skipped' };
  if (annotation === 'TODO') return { counter, title: match[3]!, outcome: 'SKIPPED', summaryName: 'todo' };
  if (annotation === 'CANCELLED' || annotation === 'NOT EXECUTED') {
    return { counter, title: match[3]!, outcome: 'NOT_EXECUTED', summaryName: 'cancelled' };
  }
  if (status === 'not ok') return { counter, title: match[3]!, outcome: 'FAILED', summaryName: 'fail' };
  return { counter, title: match[3]!, outcome: 'PASSED', summaryName: 'pass' };
}

function isTapRecordPrefix(line: string): boolean {
  return /^(?:not )?ok(?:\s|$)/.test(line) || /^# (?:tests|pass|fail|cancelled|skipped|todo)\b/.test(line)
    || /^1\.\./.test(line);
}

function collectTapStream(lines: readonly string[], startIndex: number): ParsedTapStream | null {
  const counts: Partial<Record<TapSummaryName, number>> = {};
  const subtests: string[] = [];
  const results: ParsedTapResult[] = [];
  let plan: number | null = null;
  let pendingSubtest: string | null = null;
  let summaryStarted = false;
  for (const rawLine of lines.slice(startIndex + 1)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    const summary = parseTapSummaryLine(line);
    if (summary !== null) {
      if (counts[summary.name] !== undefined || pendingSubtest !== null) return null;
      summaryStarted = true;
      counts[summary.name] = summary.count;
      continue;
    }
    if (summaryStarted) {
      if (line.startsWith('# Subtest:') || isTapRecordPrefix(line)) return null;
      continue;
    }
    if (line.startsWith('# Subtest:')) {
      const title = line.slice('# Subtest:'.length).trim();
      if (title.length === 0 || pendingSubtest !== null) return null;
      pendingSubtest = title;
      subtests.push(title);
      continue;
    }
    if (line.startsWith('1..')) {
      const parsedPlan = parseTapPlanLine(line);
      if (parsedPlan === null || plan !== null || pendingSubtest !== null) return null;
      plan = parsedPlan;
      continue;
    }
    const result = parseTapResultLine(line);
    if (result !== null) {
      if (pendingSubtest !== result.title) return null;
      pendingSubtest = null;
      results.push(result);
      if (results.length > MAX_TEST_CASES) return null;
      continue;
    }
    if (isTapRecordPrefix(line)) return null;
  }
  if (pendingSubtest !== null) return null;
  return { counts, plan, subtests, results };
}

function tapNamesAndCountersMatch(stream: ParsedTapStream): boolean {
  for (const [index, result] of stream.results.entries()) {
    if (result.counter !== index + 1 || stream.subtests[index] !== result.title) return false;
  }
  return stream.subtests.length === stream.results.length;
}

function tapSummaryMatches(stream: ParsedTapStream): boolean {
  if (stream.plan === null || stream.plan !== stream.results.length) return false;
  const observed: Record<TapSummaryName, number> = { tests: stream.results.length, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
  for (const result of stream.results) observed[result.summaryName] += 1;
  return TAP_SUMMARY_NAMES.every((name) => stream.counts[name] !== undefined && stream.counts[name] === observed[name]);
}

function parseTapReport(bytes: Uint8Array): ParsedReport | null {
  const lines = decodeGitHubLog(bytes);
  if (lines === null) return null;
  const starts = lines.flatMap((line, index) => line.trim() === 'TAP version 13' ? [index] : []);
  if (starts.length !== 1) return null;
  const stream = collectTapStream(lines, starts[0]!);
  if (stream === null || stream.results.length === 0 || !tapNamesAndCountersMatch(stream) || !tapSummaryMatches(stream)) return null;
  const cases = stream.results.flatMap((result) => {
    const reportCase = reportCaseFromTitle(result.title, result.outcome);
    return reportCase === null ? [] : [reportCase];
  });
  if (hasDuplicateReportCases(cases)) return { cases: [], bytes, invalidReason: 'GITHUB_TEST_REPORT_CASE_DUPLICATE' };
  return { cases: cases.sort((left, right) => left.testRef.localeCompare(right.testRef)), bytes };
}

function trustedDownloadHost(url: URL): boolean {
  return url.protocol === 'https:' && url.port.length === 0 && url.username.length === 0 && url.password.length === 0
    && ['.actions.githubusercontent.com', '.blob.core.windows.net', '.amazonaws.com']
      .some((suffix) => url.hostname.endsWith(suffix));
}

async function downloadJobLog(repository: string, jobId: string, token: string): Promise<{ readonly status: number; readonly bytes: Uint8Array | null }> {
  const endpoint = `${API_ROOT}/repos/${repository}/actions/jobs/${jobId}/logs`;
  let redirect: Response;
  try {
    redirect = await globalThis.fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return { status: 0, bytes: null };
  }
  if (![301, 302, 303].includes(redirect.status)) return { status: redirect.status, bytes: null };
  const location = redirect.headers.get('location');
  if (location === null) return { status: 502, bytes: null };
  let downloadUrl: URL;
  try {
    downloadUrl = new URL(location, API_ROOT);
  } catch {
    return { status: 502, bytes: null };
  }
  if (!trustedDownloadHost(downloadUrl)) return { status: 502, bytes: null };
  try {
    const response = await globalThis.fetch(downloadUrl, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
    });
    if (response.status !== 200) return { status: response.status, bytes: null };
    const bytes = await readBounded(response, MAX_REPORT_BYTES);
    return bytes === null ? { status: 413, bytes: null } : { status: 200, bytes };
  } catch {
    return { status: 0, bytes: null };
  }
}

interface WorkflowRunEvidence {
  readonly runUrl: string;
  readonly checkSuiteId: string;
}

interface WorkflowJobEvidence {
  readonly jobId: string;
  readonly jobName: string;
}

function validateWorkflowRun(request: GitHubTestReportRequest, value: unknown): StageResult<Record<string, unknown>> {
  if (!isRecord(value) || parseProviderId(value['id']) !== request.runId
    || typeof value['head_sha'] !== 'string' || !SHA40.test(value['head_sha'])
    || parseProviderId(value['check_suite_id']) === null
    || !isRecord(value['repository']) || typeof value['repository']['full_name'] !== 'string') {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_RUN_METADATA_INVALID' };
  }
  if (value['repository']['full_name'].toLowerCase() !== request.repository.toLowerCase()) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_REPOSITORY_MISMATCH' };
  }
  if (value['run_attempt'] !== request.attempt) {
    return { ok: false, state: 'STALE', reason: 'GITHUB_TEST_REPORT_ATTEMPT_MISMATCH' };
  }
  if (value['head_sha'] !== request.headSha) {
    return { ok: false, state: 'STALE', reason: 'GITHUB_TEST_REPORT_HEAD_MISMATCH' };
  }
  if (value['status'] !== 'completed') return { ok: false, state: 'PENDING', reason: 'GITHUB_TEST_RUN_PENDING' };
  return { ok: true, value };
}

async function readWorkflowRun(
  request: GitHubTestReportRequest,
  token: string,
): Promise<StageResult<WorkflowRunEvidence>> {
  const runUrl = `${API_ROOT}/repos/${request.repository}/actions/runs/${request.runId}/attempts/${request.attempt}`;
  const response = await getJson<unknown>(runUrl, token);
  if (response.value === null) {
    const failed = responseFailure(response.status);
    return { ok: false, state: failed.state, reason: failed.reason };
  }
  const validated = validateWorkflowRun(request, response.value);
  if (!validated.ok) return validated;
  return {
    ok: true,
    value: { runUrl, checkSuiteId: parseProviderId(validated.value['check_suite_id'])! },
  };
}

function jobReferencesCheckRun(value: unknown, repository: string, checkRunId: string): boolean {
  if (!isRecord(value) || typeof value['check_run_url'] !== 'string') return false;
  try {
    const checkRunUrl = new URL(value['check_run_url']);
    return checkRunUrl.origin === API_ROOT && checkRunUrl.pathname === `/repos/${repository}/check-runs/${checkRunId}`
      && checkRunUrl.search.length === 0 && checkRunUrl.hash.length === 0;
  } catch {
    return false;
  }
}

function validateWorkflowJob(request: GitHubTestReportRequest, value: unknown): StageResult<WorkflowJobEvidence> {
  if (!isRecord(value)) return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_JOB_INVALID' };
  const jobId = parseProviderId(value['id']);
  if (jobId === null || parseProviderId(value['run_id']) !== request.runId || value['run_attempt'] !== request.attempt) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_RUN_MISMATCH' };
  }
  if (value['head_sha'] !== request.headSha) return { ok: false, state: 'STALE', reason: 'GITHUB_TEST_REPORT_HEAD_MISMATCH' };
  if (value['status'] !== 'completed') return { ok: false, state: 'PENDING', reason: 'GITHUB_TEST_REPORT_JOB_PENDING' };
  if (value['conclusion'] === 'failure' || value['conclusion'] === 'timed_out') {
    return { ok: false, state: 'FAILED', reason: 'GITHUB_TEST_REPORT_JOB_FAILED' };
  }
  if (value['conclusion'] !== 'success') {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_JOB_NOT_SUCCESSFUL' };
  }
  if (typeof value['name'] !== 'string' || value['name'].length === 0 || value['name'].length > 512) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_JOB_INVALID' };
  }
  return { ok: true, value: { jobId, jobName: value['name'] } };
}

async function readWorkflowJob(
  request: GitHubTestReportRequest,
  runUrl: string,
  token: string,
): Promise<StageResult<WorkflowJobEvidence>> {
  const response = await getJson<unknown>(`${runUrl}/jobs?filter=latest&per_page=100`, token);
  if (response.value === null) {
    const failed = responseFailure(response.status);
    return { ok: false, state: failed.state, reason: failed.reason };
  }
  if (!isRecord(response.value) || !Array.isArray(response.value['jobs']) || response.value['jobs'].length > MAX_WORKFLOW_JOBS) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_JOB_LIST_INVALID' };
  }
  const matchingJobs = response.value['jobs'].filter((job) => jobReferencesCheckRun(job, request.repository, request.checkRunId));
  if (matchingJobs.length !== 1) return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_CHECK_UNBOUND' };
  return validateWorkflowJob(request, matchingJobs[0]);
}

function validateCheckRun(
  request: GitHubTestReportRequest,
  value: unknown,
  job: WorkflowJobEvidence,
  checkSuiteId: string,
): StageResult<string> {
  const reportUri = `https://github.com/${request.repository}/actions/runs/${request.runId}/job/${job.jobId}`;
  if (!isRecord(value) || parseProviderId(value['id']) !== request.checkRunId
    || typeof value['name'] !== 'string' || value['name'].length === 0 || value['name'].length > 512
    || typeof value['head_sha'] !== 'string' || !SHA40.test(value['head_sha'])
    || !isRecord(value['check_suite']) || parseProviderId(value['check_suite']['id']) === null
    || typeof value['details_url'] !== 'string') {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_CHECK_METADATA_INVALID' };
  }
  if (value['head_sha'] !== request.headSha) return { ok: false, state: 'STALE', reason: 'GITHUB_TEST_REPORT_HEAD_MISMATCH' };
  if (parseProviderId(value['check_suite']['id']) !== checkSuiteId) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_CHECK_SUITE_MISMATCH' };
  }
  if (value['details_url'] !== reportUri || value['name'] !== job.jobName) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_CHECK_JOB_MISMATCH' };
  }
  if (value['status'] !== 'completed') return { ok: false, state: 'PENDING', reason: 'GITHUB_TEST_REPORT_CHECK_PENDING' };
  if (value['conclusion'] === 'failure' || value['conclusion'] === 'timed_out') {
    return { ok: false, state: 'FAILED', reason: 'GITHUB_TEST_REPORT_CHECK_FAILED' };
  }
  if (value['conclusion'] !== 'success') {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_CHECK_NOT_SUCCESSFUL' };
  }
  return { ok: true, value: value['name'] };
}

async function readCheckRun(
  request: GitHubTestReportRequest,
  job: WorkflowJobEvidence,
  checkSuiteId: string,
  token: string,
): Promise<StageResult<string>> {
  const url = `${API_ROOT}/repos/${request.repository}/check-runs/${request.checkRunId}`;
  const response = await getJson<unknown>(url, token);
  if (response.value === null) {
    const failed = responseFailure(response.status);
    return { ok: false, state: failed.state, reason: failed.reason };
  }
  return validateCheckRun(request, response.value, job, checkSuiteId);
}

function reportLogFailureReason(status: number): string {
  if (status === 401 || status === 403) return 'GITHUB_TEST_REPORT_LOGS_DENIED';
  if (status === 404) return 'GITHUB_TEST_REPORT_LOGS_NOT_FOUND';
  return 'GITHUB_TEST_REPORT_LOGS_UNAVAILABLE';
}

async function readTestReport(
  request: GitHubTestReportRequest,
  jobId: string,
  token: string,
): Promise<StageResult<ParsedReport>> {
  const logResponse = await downloadJobLog(request.repository, jobId, token);
  if (logResponse.bytes === null) {
    const failed = responseFailure(logResponse.status);
    const reason = reportLogFailureReason(logResponse.status);
    return { ok: false, state: failed.state, reason };
  }
  const parsed = parseTapReport(logResponse.bytes);
  if (parsed === null) return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_TAP_INVALID' };
  if (parsed.invalidReason !== undefined) return { ok: false, state: 'INVALID', reason: parsed.invalidReason };
  return { ok: true, value: parsed };
}

/** Collects only by authenticated GitHub REST reads and exact job-log bytes; it performs no provider writes. */
export async function collectGitHubTestExecutionReport(
  request: GitHubTestReportRequest,
): Promise<ProviderTestReportCollection> {
  if (!requestIsValid(request)) return invalidRequestCollection();
  if (request.token === undefined || request.token.length === 0) {
    return failedCollection(request, 'UNAVAILABLE', 'GITHUB_TOKEN_MISSING');
  }
  if (typeof globalThis.fetch !== 'function') return failedCollection(request, 'UNAVAILABLE', 'GITHUB_FETCH_UNAVAILABLE');
  const runResult = await readWorkflowRun(request, request.token);
  if (!runResult.ok) return failedCollection(request, runResult.state, runResult.reason);
  const jobResult = await readWorkflowJob(request, runResult.value.runUrl, request.token);
  if (!jobResult.ok) return failedCollection(request, jobResult.state, jobResult.reason);
  const checkResult = await readCheckRun(request, jobResult.value, runResult.value.checkSuiteId, request.token);
  if (!checkResult.ok) return failedCollection(request, checkResult.state, checkResult.reason);
  const reportResult = await readTestReport(request, jobResult.value.jobId, request.token);
  if (!reportResult.ok) return failedCollection(request, reportResult.state, reportResult.reason);

  const jobId = jobResult.value.jobId;
  const reportUri = `https://github.com/${request.repository}/actions/runs/${request.runId}/job/${jobId}`;
  return createCollection({
    state: 'VERIFIED',
    repository: request.repository,
    runId: request.runId,
    attempt: request.attempt,
    headSha: request.headSha,
    checkRunId: request.checkRunId,
    checkName: checkResult.value,
    checkStatus: 'COMPLETED',
    checkConclusion: 'SUCCESS',
    jobId,
    reportUri,
    reportDigest: await sha256(reportResult.value.bytes),
    cases: reportResult.value.cases,
    reasonCodes: [],
  }, reportResult.value.bytes);
}
