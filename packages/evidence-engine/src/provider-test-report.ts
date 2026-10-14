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

interface ReportFile {
  readonly name: string;
  readonly bytes: Uint8Array;
}

interface ParsedReport {
  readonly cases: readonly ProviderTestReportCase[];
  readonly bytes: Uint8Array;
  readonly invalidReason?: string;
}

interface ProviderResponse<T> {
  readonly status: number;
  readonly value: T | null;
}

const API_ROOT = 'https://api.github.com';
const MAX_TOKEN_LENGTH = 4096;
const MAX_API_BODY = 2 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const MAX_REPORT_BYTES = 24 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 512;
const MAX_TEST_CASES = 8192;
const SHA40 = /^[0-9a-f]{40}$/;
const DECIMAL_ID = /^\d{1,20}$/;
const REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;
const COLLECTION_RECORDS = new WeakMap<object, PrivateCollectionRecord>();
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) === 1 ? 0xedb88320 : 0);
    table[index] = value >>> 0;
  }
  return table;
})();

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
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSnapshot(record[key])}`).join(',')}}`;
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

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipPathIsSafe(path: string): boolean {
  if (path.length === 0 || path.startsWith('/') || path.includes('\\') || /^[A-Za-z]:/.test(path)) return false;
  return path.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
}

function findEndRecord(bytes: Uint8Array): number {
  const earliest = Math.max(0, bytes.length - 65557);
  for (let offset = bytes.length - 22; offset >= earliest; offset -= 1) {
    if (readUInt32(bytes, offset) === 0x06054b50) return offset;
  }
  return -1;
}

function readUInt16(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error('ZIP_BOUNDS');
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function readUInt32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) return -1;
  return (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) | (bytes[offset + 3]! << 24)) >>> 0;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream !== 'function') return null;
  try {
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    const body = new Blob([copy.buffer]).stream();
    const reader = body.pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat)).getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.length;
      if (length > MAX_REPORT_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(item.value);
    }
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  } catch {
    return null;
  }
}

async function extractTextFiles(archive: Uint8Array): Promise<readonly ReportFile[] | null> {
  if (archive.length < 22 || archive.length > MAX_ARCHIVE_BYTES) return null;
  const endOffset = findEndRecord(archive);
  if (endOffset < 0) return null;
  const diskNumber = readUInt16(archive, endOffset + 4);
  const centralDiskNumber = readUInt16(archive, endOffset + 6);
  const entriesOnDisk = readUInt16(archive, endOffset + 8);
  const entryCount = readUInt16(archive, endOffset + 10);
  const centralSize = readUInt32(archive, endOffset + 12);
  const centralOffset = readUInt32(archive, endOffset + 16);
  const commentLength = readUInt16(archive, endOffset + 20);
  if (diskNumber !== 0 || centralDiskNumber !== 0 || entriesOnDisk !== entryCount
    || entryCount < 1 || entryCount > MAX_ZIP_ENTRIES || centralSize === 0xffffffff || centralOffset === 0xffffffff
    || endOffset + 22 + commentLength !== archive.length || centralOffset + centralSize > endOffset) return null;

  const reports: ReportFile[] = [];
  let totalReportBytes = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(archive, offset) !== 0x02014b50) return null;
    const flags = readUInt16(archive, offset + 8);
    const method = readUInt16(archive, offset + 10);
    const expectedCrc = readUInt32(archive, offset + 16);
    const compressedSize = readUInt32(archive, offset + 20);
    const uncompressedSize = readUInt32(archive, offset + 24);
    const nameLength = readUInt16(archive, offset + 28);
    const extraLength = readUInt16(archive, offset + 30);
    const commentSize = readUInt16(archive, offset + 32);
    const localOffset = readUInt32(archive, offset + 42);
    const nameStart = offset + 46;
    const nextOffset = nameStart + nameLength + extraLength + commentSize;
    if (nextOffset > centralOffset + centralSize || localOffset >= centralOffset || compressedSize === 0xffffffff
      || uncompressedSize === 0xffffffff || (flags & 1) !== 0 || (flags & 0x40) !== 0) return null;
    let name: string;
    try {
      name = new TextDecoder('utf-8', { fatal: true }).decode(archive.subarray(nameStart, nameStart + nameLength));
    } catch {
      return null;
    }
    if (!zipPathIsSafe(name)) return null;
    if (!name.endsWith('/')) {
      if (readUInt32(archive, localOffset) !== 0x04034b50) return null;
      const localFlags = readUInt16(archive, localOffset + 6);
      const localMethod = readUInt16(archive, localOffset + 8);
      const localNameLength = readUInt16(archive, localOffset + 26);
      const localExtraLength = readUInt16(archive, localOffset + 28);
      const localNameStart = localOffset + 30;
      const dataStart = localNameStart + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > centralOffset || localFlags !== flags || localMethod !== method || localNameLength !== nameLength
        || new TextDecoder('utf-8', { fatal: true }).decode(archive.subarray(localNameStart, localNameStart + localNameLength)) !== name) return null;
      if (name.toLowerCase().endsWith('.txt') && uncompressedSize <= MAX_REPORT_BYTES) {
        if (totalReportBytes + uncompressedSize > MAX_ARCHIVE_BYTES) return null;
        const compressed = archive.subarray(dataStart, dataEnd);
        const bytes = method === 0 ? new Uint8Array(compressed)
          : method === 8 ? await inflateRaw(compressed) : null;
        if (bytes === null) return null;
        if ((method !== 0 && method !== 8) || bytes.length !== uncompressedSize || crc32(bytes) !== expectedCrc) return null;
        totalReportBytes += bytes.length;
        if (totalReportBytes > MAX_ARCHIVE_BYTES) return null;
        reports.push({ name, bytes });
      }
    }
    offset = nextOffset;
  }
  return offset === centralOffset + centralSize ? reports : null;
}

function reportCaseFromTitle(title: string, outcome: ProviderTestExecutionOutcome): ProviderTestReportCase | null {
  const separator = title.indexOf(' :: ');
  if (separator <= 0) return null;
  const path = title.slice(0, separator);
  const testRef = `${path}#${title}`;
  return isProviderTestRef(testRef) ? { testRef, outcome } : null;
}

function parseSpecReport(bytes: Uint8Array): ParsedReport | null {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  const clean = text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  const counts: Record<string, number> = {};
  const summaryNames = new Set(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']);
  const cases: ProviderTestReportCase[] = [];
  const observed = { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const summary = /^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/.exec(line);
    if (summary !== null) {
      const name = summary[1]!;
      if (!summaryNames.has(name) || counts[name] !== undefined) return null;
      counts[name] = Number(summary[2]);
      continue;
    }
    const record = /^\s*(✔|✖|﹣|○) (.+) \((\d+(?:\.\d+)?ms)\)(?: #(.+))?$/.exec(line);
    if (record === null) continue;
    const symbol = record[1]!;
    const title = record[2]!;
    const annotation = (record[4] ?? '').trim();
    observed.tests += 1;
    let outcome: ProviderTestExecutionOutcome;
    if (symbol === '✖') {
      observed.fail += 1;
      outcome = 'FAILED';
    } else if (annotation === 'TODO') {
      observed.todo += 1;
      outcome = 'SKIPPED';
    } else if (annotation.startsWith('CANCELLED')) {
      observed.cancelled += 1;
      outcome = 'NOT_EXECUTED';
    } else if (symbol === '﹣' || symbol === '○') {
      observed.skipped += 1;
      outcome = 'SKIPPED';
    } else {
      observed.pass += 1;
      outcome = 'PASSED';
    }
    const reportCase = reportCaseFromTitle(title, outcome);
    if (reportCase !== null) cases.push(reportCase);
    if (cases.length > MAX_TEST_CASES) return null;
  }
  if ([...summaryNames].some((name) => counts[name] === undefined)) return null;
  if (observed.tests !== counts['tests'] || observed.pass !== counts['pass'] || observed.fail !== counts['fail']
    || observed.cancelled !== counts['cancelled'] || observed.skipped !== counts['skipped'] || observed.todo !== counts['todo']) return null;
  const seen = new Set<string>();
  for (const entry of cases) {
    if (seen.has(entry.testRef)) return { cases: [], bytes, invalidReason: 'GITHUB_TEST_REPORT_CASE_DUPLICATE' };
    seen.add(entry.testRef);
  }
  return { cases: cases.sort((left, right) => left.testRef.localeCompare(right.testRef)), bytes };
}

function trustedDownloadHost(url: URL): boolean {
  return url.protocol === 'https:' && url.username.length === 0 && url.password.length === 0
    && ['.actions.githubusercontent.com', '.blob.core.windows.net', '.amazonaws.com']
      .some((suffix) => url.hostname.endsWith(suffix));
}

async function downloadJobLog(repository: string, jobId: string, token: string): Promise<{ readonly status: number; readonly archive: Uint8Array | null }> {
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
    return { status: 0, archive: null };
  }
  if (![301, 302, 303].includes(redirect.status)) return { status: redirect.status, archive: null };
  const location = redirect.headers.get('location');
  if (location === null) return { status: 502, archive: null };
  let downloadUrl: URL;
  try {
    downloadUrl = new URL(location, API_ROOT);
  } catch {
    return { status: 502, archive: null };
  }
  if (!trustedDownloadHost(downloadUrl)) return { status: 502, archive: null };
  try {
    const response = await globalThis.fetch(downloadUrl, {
      method: 'GET',
      headers: { Accept: 'application/zip' },
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
    });
    if (response.status !== 200) return { status: response.status, archive: null };
    const archive = await readBounded(response, MAX_ARCHIVE_BYTES);
    return archive === null ? { status: 413, archive: null } : { status: 200, archive };
  } catch {
    return { status: 0, archive: null };
  }
}

/** Collects only by authenticated GitHub REST reads and exact job-log bytes; it performs no provider writes. */
export async function collectGitHubTestExecutionReport(
  request: GitHubTestReportRequest,
): Promise<ProviderTestReportCollection> {
  if (!requestIsValid(request)) {
    return invalidRequestCollection();
  }
  if (request.token === undefined || request.token.length === 0) {
    return failedCollection(request, 'UNAVAILABLE', 'GITHUB_TOKEN_MISSING');
  }
  if (typeof globalThis.fetch !== 'function') return failedCollection(request, 'UNAVAILABLE', 'GITHUB_FETCH_UNAVAILABLE');

  const runUrl = `${API_ROOT}/repos/${request.repository}/actions/runs/${request.runId}/attempts/${request.attempt}`;
  const runResponse = await getJson<unknown>(runUrl, request.token);
  if (runResponse.value === null) {
    const failed = responseFailure(runResponse.status);
    return failedCollection(request, failed.state, failed.reason);
  }
  const run = runResponse.value;
  if (!isRecord(run) || parseProviderId(run['id']) !== request.runId
    || typeof run['head_sha'] !== 'string' || !SHA40.test(run['head_sha'])
    || parseProviderId(run['check_suite_id']) === null
    || !isRecord(run['repository']) || typeof run['repository']['full_name'] !== 'string') {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_RUN_METADATA_INVALID');
  }
  if (run['repository']['full_name'].toLowerCase() !== request.repository.toLowerCase()) {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_REPOSITORY_MISMATCH');
  }
  if (run['run_attempt'] !== request.attempt) {
    return failedCollection(request, 'STALE', 'GITHUB_TEST_REPORT_ATTEMPT_MISMATCH');
  }
  if (run['head_sha'] !== request.headSha) {
    return failedCollection(request, 'STALE', 'GITHUB_TEST_REPORT_HEAD_MISMATCH');
  }
  if (run['status'] !== 'completed') return failedCollection(request, 'PENDING', 'GITHUB_TEST_RUN_PENDING');

  const jobsUrl = `${runUrl}/jobs?filter=latest&per_page=100`;
  const jobsResponse = await getJson<unknown>(jobsUrl, request.token);
  if (jobsResponse.value === null) {
    const failed = responseFailure(jobsResponse.status);
    return failedCollection(request, failed.state, failed.reason);
  }
  if (!isRecord(jobsResponse.value) || !Array.isArray(jobsResponse.value['jobs']) || jobsResponse.value['jobs'].length > MAX_ZIP_ENTRIES) {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_JOB_LIST_INVALID');
  }
  const matchingJobs = jobsResponse.value['jobs'].filter((entry) => {
    if (!isRecord(entry) || typeof entry['check_run_url'] !== 'string') return false;
    try {
      const checkRunUrl = new URL(entry['check_run_url']);
      return checkRunUrl.origin === API_ROOT && checkRunUrl.pathname === `/repos/${request.repository}/check-runs/${request.checkRunId}`
        && checkRunUrl.search.length === 0 && checkRunUrl.hash.length === 0;
    } catch {
      return false;
    }
  });
  if (matchingJobs.length !== 1) return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_CHECK_UNBOUND');
  const job = matchingJobs[0];
  if (!isRecord(job)) return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_JOB_INVALID');
  const jobId = parseProviderId(job['id']);
  if (jobId === null || parseProviderId(job['run_id']) !== request.runId || job['run_attempt'] !== request.attempt) {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_RUN_MISMATCH');
  }
  if (job['head_sha'] !== request.headSha) return failedCollection(request, 'STALE', 'GITHUB_TEST_REPORT_HEAD_MISMATCH');
  if (job['status'] !== 'completed') return failedCollection(request, 'PENDING', 'GITHUB_TEST_REPORT_JOB_PENDING');
  if (job['conclusion'] === 'failure' || job['conclusion'] === 'timed_out') {
    return failedCollection(request, 'FAILED', 'GITHUB_TEST_REPORT_JOB_FAILED');
  }
  if (job['conclusion'] !== 'success') {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_JOB_NOT_SUCCESSFUL');
  }

  const checkUrl = `${API_ROOT}/repos/${request.repository}/check-runs/${request.checkRunId}`;
  const checkResponse = await getJson<unknown>(checkUrl, request.token);
  if (checkResponse.value === null) {
    const failed = responseFailure(checkResponse.status);
    return failedCollection(request, failed.state, failed.reason);
  }
  const check = checkResponse.value;
  const reportUri = `https://github.com/${request.repository}/actions/runs/${request.runId}/job/${jobId}`;
  if (!isRecord(check) || parseProviderId(check['id']) !== request.checkRunId
    || typeof check['name'] !== 'string' || check['name'].length === 0 || check['name'].length > 512
    || typeof check['head_sha'] !== 'string' || !SHA40.test(check['head_sha'])
    || !isRecord(check['check_suite']) || parseProviderId(check['check_suite']['id']) === null
    || typeof check['details_url'] !== 'string') {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_CHECK_METADATA_INVALID');
  }
  if (check['head_sha'] !== request.headSha) return failedCollection(request, 'STALE', 'GITHUB_TEST_REPORT_HEAD_MISMATCH');
  if (parseProviderId(check['check_suite']['id']) !== parseProviderId(run['check_suite_id'])) {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_CHECK_SUITE_MISMATCH');
  }
  if (check['details_url'] !== reportUri || check['name'] !== job['name']) {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_CHECK_JOB_MISMATCH');
  }
  if (check['status'] !== 'completed') return failedCollection(request, 'PENDING', 'GITHUB_TEST_REPORT_CHECK_PENDING');
  if (check['conclusion'] === 'failure' || check['conclusion'] === 'timed_out') {
    return failedCollection(request, 'FAILED', 'GITHUB_TEST_REPORT_CHECK_FAILED');
  }
  if (check['conclusion'] !== 'success') {
    return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_CHECK_NOT_SUCCESSFUL');
  }

  const logResponse = await downloadJobLog(request.repository, jobId, request.token);
  if (logResponse.archive === null) {
    const failed = responseFailure(logResponse.status);
    const reason = logResponse.status === 403 || logResponse.status === 401 ? 'GITHUB_TEST_REPORT_LOGS_DENIED'
      : logResponse.status === 404 ? 'GITHUB_TEST_REPORT_LOGS_NOT_FOUND' : 'GITHUB_TEST_REPORT_LOGS_UNAVAILABLE';
    return failedCollection(request, failed.state, reason);
  }
  let textFiles: readonly ReportFile[] | null;
  try {
    textFiles = await extractTextFiles(logResponse.archive);
  } catch {
    textFiles = null;
  }
  if (textFiles === null) return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_ARCHIVE_INVALID');
  const parsedReports = textFiles.flatMap((file) => {
    const parsed = parseSpecReport(file.bytes);
    return parsed === null ? [] : [{ file, parsed }];
  });
  const invalidReport = parsedReports.find(({ parsed }) => parsed.invalidReason !== undefined);
  if (invalidReport !== undefined) return failedCollection(request, 'INVALID', invalidReport.parsed.invalidReason!);
  const validReports = parsedReports.filter(({ parsed }) => parsed.invalidReason === undefined);
  if (validReports.length !== 1) return failedCollection(request, 'INVALID', 'GITHUB_TEST_REPORT_AMBIGUOUS_OR_MISSING');
  const report = validReports[0]!.parsed;
  return createCollection({
    state: 'VERIFIED',
    repository: request.repository,
    runId: request.runId,
    attempt: request.attempt,
    headSha: request.headSha,
    checkRunId: request.checkRunId,
    checkName: check['name'],
    checkStatus: 'COMPLETED',
    checkConclusion: 'SUCCESS',
    jobId,
    reportUri,
    reportDigest: await sha256(report.bytes),
    cases: report.cases,
    reasonCodes: [],
  }, report.bytes);
}
