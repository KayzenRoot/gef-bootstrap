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

interface ZipEntryDescriptor {
  readonly name: string;
  readonly nameLength: number;
  readonly flags: number;
  readonly method: number;
  readonly expectedCrc: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localOffset: number;
  readonly nextOffset: number;
}

interface ZipDirectoryRange {
  readonly entryCount: number;
  readonly centralOffset: number;
  readonly centralEnd: number;
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

type ProviderTestReportFailureState = Exclude<ProviderTestReportCollectionState, 'VERIFIED'>;

type StageResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly state: ProviderTestReportFailureState; readonly reason: string };

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

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipPathIsSafe(path: string): boolean {
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  if (normalized.length === 0 || normalized.startsWith('/') || normalized.includes('\\') || /^[A-Za-z]:/.test(normalized)) return false;
  return normalized.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
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

function readZipDirectoryRange(archive: Uint8Array): ZipDirectoryRange | null {
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
  return { entryCount, centralOffset, centralEnd: centralOffset + centralSize };
}

function readZipEntryDescriptor(archive: Uint8Array, offset: number, centralOffset: number, centralEnd: number): ZipEntryDescriptor | null {
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
  if (nextOffset > centralEnd || localOffset >= centralOffset || compressedSize === 0xffffffff
    || uncompressedSize === 0xffffffff || (flags & 1) !== 0 || (flags & 0x40) !== 0) return null;
  let name: string;
  try {
    name = new TextDecoder('utf-8', { fatal: true }).decode(archive.subarray(nameStart, nameStart + nameLength));
  } catch {
    return null;
  }
  if (!zipPathIsSafe(name)) return null;
  return { name, nameLength, flags, method, expectedCrc, compressedSize, uncompressedSize, localOffset, nextOffset };
}

async function extractZipEntryText(
  archive: Uint8Array,
  entry: ZipEntryDescriptor,
  centralOffset: number,
  totalReportBytes: number,
): Promise<{ readonly valid: boolean; readonly report: ReportFile | null }> {
  if (entry.name.endsWith('/')) return { valid: true, report: null };
  if (readUInt32(archive, entry.localOffset) !== 0x04034b50) return { valid: false, report: null };
  const localCrc = readUInt32(archive, entry.localOffset + 14);
  const localCompressedSize = readUInt32(archive, entry.localOffset + 18);
  const localUncompressedSize = readUInt32(archive, entry.localOffset + 22);
  const localFlags = readUInt16(archive, entry.localOffset + 6);
  const localMethod = readUInt16(archive, entry.localOffset + 8);
  const localNameLength = readUInt16(archive, entry.localOffset + 26);
  const localExtraLength = readUInt16(archive, entry.localOffset + 28);
  const localNameStart = entry.localOffset + 30;
  const dataStart = localNameStart + localNameLength + localExtraLength;
  const dataEnd = dataStart + entry.compressedSize;
  let localName: string;
  try {
    localName = new TextDecoder('utf-8', { fatal: true }).decode(archive.subarray(localNameStart, localNameStart + localNameLength));
  } catch {
    return { valid: false, report: null };
  }
  const descriptorFlagSet = (entry.flags & 0x08) !== 0;
  if (dataEnd > centralOffset || localFlags !== entry.flags || localMethod !== entry.method
    || localNameLength !== entry.nameLength || localName !== entry.name
    || (!descriptorFlagSet && (localCrc !== entry.expectedCrc || localCompressedSize !== entry.compressedSize
      || localUncompressedSize !== entry.uncompressedSize))) return { valid: false, report: null };
  if (!entry.name.toLowerCase().endsWith('.txt') || entry.uncompressedSize > MAX_REPORT_BYTES) {
    return { valid: true, report: null };
  }
  if (totalReportBytes + entry.uncompressedSize > MAX_ARCHIVE_BYTES) return { valid: false, report: null };
  const compressed = archive.subarray(dataStart, dataEnd);
  let bytes: Uint8Array | null;
  if (entry.method === 0) bytes = new Uint8Array(compressed);
  else if (entry.method === 8) bytes = await inflateRaw(compressed);
  else return { valid: false, report: null };
  if (bytes?.length !== entry.uncompressedSize) return { valid: false, report: null };
  if (bytes === null || crc32(bytes) !== entry.expectedCrc) return { valid: false, report: null };
  return { valid: true, report: { name: entry.name, bytes } };
}

async function extractTextFiles(archive: Uint8Array): Promise<readonly ReportFile[] | null> {
  const directory = readZipDirectoryRange(archive);
  if (directory === null) return null;

  const reports: ReportFile[] = [];
  let totalReportBytes = 0;
  let offset = directory.centralOffset;
  for (let index = 0; index < directory.entryCount; index += 1) {
    const entry = readZipEntryDescriptor(archive, offset, directory.centralOffset, directory.centralEnd);
    if (entry === null) return null;
    const extracted = await extractZipEntryText(archive, entry, directory.centralOffset, totalReportBytes);
    if (!extracted.valid) return null;
    if (extracted.report !== null) {
      reports.push(extracted.report);
      totalReportBytes += extracted.report.bytes.length;
    }
    offset = entry.nextOffset;
  }
  return offset === directory.centralEnd ? reports : null;
}

function reportCaseFromTitle(title: string, outcome: ProviderTestExecutionOutcome): ProviderTestReportCase | null {
  const separator = title.indexOf(' :: ');
  if (separator <= 0) return null;
  const path = title.slice(0, separator);
  const testRef = `${path}#${title}`;
  return isProviderTestRef(testRef) ? { testRef, outcome } : null;
}

const SPEC_SUMMARY_NAMES = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'] as const;
type SpecSummaryName = typeof SPEC_SUMMARY_NAMES[number];
type SpecResultCounter = Exclude<SpecSummaryName, 'tests'>;

interface ParsedSpecLine {
  readonly kind: 'summary' | 'case';
  readonly name?: SpecSummaryName;
  readonly count?: number;
  readonly title?: string;
  readonly outcome?: ProviderTestExecutionOutcome;
  readonly counter?: SpecResultCounter;
}

function parseSpecLine(line: string): ParsedSpecLine | null {
  const summary = /^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/.exec(line);
  if (summary !== null) return { kind: 'summary', name: summary[1] as SpecSummaryName, count: Number(summary[2]) };
  const record = /^\s*[✔✖﹣○] (.+) \((\d+(?:\.\d+)?ms)\)(?: #(.+))?$/.exec(line);
  if (record === null) return null;
  const symbol = line.trimStart()[0]!;
  const annotation = (record[3] ?? '').trim();
  const title = record[1]!;
  if (symbol === '✖') return { kind: 'case', title, outcome: 'FAILED', counter: 'fail' };
  if (annotation === 'TODO') return { kind: 'case', title, outcome: 'SKIPPED', counter: 'todo' };
  if (annotation.startsWith('CANCELLED')) return { kind: 'case', title, outcome: 'NOT_EXECUTED', counter: 'cancelled' };
  if (symbol === '﹣' || symbol === '○') return { kind: 'case', title, outcome: 'SKIPPED', counter: 'skipped' };
  return { kind: 'case', title, outcome: 'PASSED', counter: 'pass' };
}

function specSummaryMatches(
  counts: Partial<Record<SpecSummaryName, number>>,
  observed: Record<SpecSummaryName, number>,
): boolean {
  return SPEC_SUMMARY_NAMES.every((name) => counts[name] !== undefined)
    && SPEC_SUMMARY_NAMES.every((name) => counts[name] === observed[name]);
}

function hasDuplicateReportCases(cases: readonly ProviderTestReportCase[]): boolean {
  const seen = new Set<string>();
  for (const entry of cases) {
    if (seen.has(entry.testRef)) return true;
    seen.add(entry.testRef);
  }
  return false;
}

function parseSpecReport(bytes: Uint8Array): ParsedReport | null {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  const clean = text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  const counts: Partial<Record<SpecSummaryName, number>> = {};
  const cases: ProviderTestReportCase[] = [];
  const observed: Record<SpecSummaryName, number> = { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
  for (const rawLine of clean.split(/\r?\n/)) {
    const parsed = parseSpecLine(rawLine.trimEnd());
    if (parsed === null) continue;
    if (parsed.kind === 'summary') {
      const name = parsed.name!;
      if (counts[name] !== undefined) return null;
      counts[name] = parsed.count!;
      continue;
    }
    observed.tests += 1;
    observed[parsed.counter!] += 1;
    if (observed.tests > MAX_TEST_CASES) return null;
    const reportCase = reportCaseFromTitle(parsed.title!, parsed.outcome!);
    if (reportCase !== null) cases.push(reportCase);
  }
  if (!specSummaryMatches(counts, observed)) return null;
  if (hasDuplicateReportCases(cases)) return { cases: [], bytes, invalidReason: 'GITHUB_TEST_REPORT_CASE_DUPLICATE' };
  const sortedCases = [...cases].sort((left, right) => left.testRef.localeCompare(right.testRef));
  return { cases: sortedCases, bytes };
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
  if (!isRecord(response.value) || !Array.isArray(response.value['jobs']) || response.value['jobs'].length > MAX_ZIP_ENTRIES) {
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
  if (logResponse.archive === null) {
    const failed = responseFailure(logResponse.status);
    const reason = reportLogFailureReason(logResponse.status);
    return { ok: false, state: failed.state, reason };
  }
  let textFiles: readonly ReportFile[] | null;
  try {
    textFiles = await extractTextFiles(logResponse.archive);
  } catch {
    textFiles = null;
  }
  if (textFiles === null) return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_ARCHIVE_INVALID' };
  const parsedReports = textFiles.flatMap((file) => {
    const parsed = parseSpecReport(file.bytes);
    return parsed === null ? [] : [parsed];
  });
  const invalidReport = parsedReports.find(({ invalidReason }) => invalidReason !== undefined);
  if (invalidReport !== undefined) return { ok: false, state: 'INVALID', reason: invalidReport.invalidReason! };
  const validReports = parsedReports.filter(({ invalidReason }) => invalidReason === undefined);
  if (validReports.length !== 1) {
    return { ok: false, state: 'INVALID', reason: 'GITHUB_TEST_REPORT_AMBIGUOUS_OR_MISSING' };
  }
  return { ok: true, value: validReports[0]! };
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
