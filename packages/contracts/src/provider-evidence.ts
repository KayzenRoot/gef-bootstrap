/** Strict, versioned envelope for already collected provider facts. It performs no I/O. */
export const PROVIDER_EVIDENCE_SCHEMA_VERSION = '1.0' as const;

export type ProviderCollectionState = 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' | 'DENIED';
export type ProviderCheckStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED';
export type ProviderCheckKind = 'STATUS' | 'TEST' | 'SECURITY' | 'COVERAGE' | 'OTHER';
export type ProviderCheckConclusion =
  | 'SUCCESS'
  | 'FAILURE'
  | 'CANCELLED'
  | 'TIMED_OUT'
  | 'ACTION_REQUIRED'
  | 'NEUTRAL'
  | 'SKIPPED'
  | null;
export type ProviderTestExecutionOutcome = 'PASSED' | 'FAILED' | 'SKIPPED' | 'NOT_EXECUTED';

export interface ProviderRepositoryIdentity {
  readonly owner: string;
  readonly name: string;
}

export interface ProviderPullRequestIdentity {
  readonly number: number;
  readonly baseSha: string;
  readonly headSha: string;
}

export interface ProviderTreeIdentity {
  readonly baseTreeSha: string;
  readonly headTreeSha: string;
}

export interface ProviderFileBlobIdentity {
  readonly path: string;
  readonly blobSha: string;
}

export interface ProviderRulesetIdentity {
  readonly rulesetId: string;
  readonly digest: string;
}

export interface ProviderRequiredContext {
  /** Stable provider identity, such as app-id + required-context name. */
  readonly contextId: string;
  /** Human-readable only; never used to satisfy another context. */
  readonly displayName: string;
}

export interface ProviderCheckRun {
  readonly recordId: string;
  readonly runId: string;
  readonly attempt: number;
  readonly contextId: string;
  readonly displayName: string;
  readonly checkKind: ProviderCheckKind;
  readonly headSha: string;
  readonly status: ProviderCheckStatus;
  readonly conclusion: ProviderCheckConclusion;
  readonly sourceUri: string;
}

/** Provider-collected case-level result tied to one exact test check attempt and report. */
export interface ProviderTestExecutionReceipt {
  readonly receiptId: string;
  readonly checkRunRecordId: string;
  readonly runId: string;
  readonly attempt: number;
  readonly headSha: string;
  /** Exact source test selector: tests/gbs-mod-wo-002-*.test.mjs#test title. */
  readonly testRef: string;
  readonly outcome: ProviderTestExecutionOutcome;
  readonly reportUri: string;
  /** SHA-256 of raw case-result bytes collected from the authenticated Actions job log at reportUri. */
  readonly reportDigest: string;
}

export interface ProviderWorkflowJob {
  readonly jobId: string;
  readonly name: string;
  readonly status: ProviderCheckStatus;
  readonly conclusion: ProviderCheckConclusion;
  readonly sourceUri: string;
}

export interface ProviderWorkflowRun {
  readonly runId: string;
  readonly attempt: number;
  readonly headSha: string;
  readonly status: ProviderCheckStatus;
  readonly conclusion: ProviderCheckConclusion;
  readonly sourceUri: string;
  readonly jobs: readonly ProviderWorkflowJob[];
}

export interface ProviderEvidenceInput {
  readonly schemaVersion: typeof PROVIDER_EVIDENCE_SCHEMA_VERSION;
  readonly collectionId: string;
  readonly providerId: string;
  readonly collectionState: ProviderCollectionState;
  readonly sourceUri: string;
  readonly repository: ProviderRepositoryIdentity;
  readonly pullRequest: ProviderPullRequestIdentity;
  readonly sourceTrees: ProviderTreeIdentity;
  readonly fileBlobs: readonly ProviderFileBlobIdentity[];
  readonly ruleset: ProviderRulesetIdentity;
  readonly workOrderId: string;
  readonly contextLockDigest: string;
  readonly changedPaths: readonly string[];
  readonly requiredContexts: readonly ProviderRequiredContext[];
  readonly checkRuns: readonly ProviderCheckRun[];
  /** Legacy untrusted assertion field. The parser rejects every non-empty caller-supplied value. */
  readonly testExecutionReceipts?: readonly ProviderTestExecutionReceipt[];
  readonly workflowRuns: readonly ProviderWorkflowRun[];
}

export type ProviderEvidenceBinding = Pick<ProviderEvidenceInput,
  'providerId' | 'repository' | 'pullRequest' | 'sourceTrees' | 'fileBlobs' | 'ruleset' | 'workOrderId' | 'contextLockDigest' | 'changedPaths' | 'requiredContexts'>;

export interface ProviderEvidenceDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly subject?: string;
}

export type ProviderEvidenceParseResult =
  | { readonly ok: true; readonly value: ProviderEvidenceInput }
  | { readonly ok: false; readonly diagnostics: readonly ProviderEvidenceDiagnostic[] };

const TOP_LEVEL_FIELDS = [
  'schemaVersion', 'collectionId', 'providerId', 'collectionState', 'sourceUri', 'repository',
  'pullRequest', 'sourceTrees', 'fileBlobs', 'ruleset', 'workOrderId', 'contextLockDigest', 'changedPaths', 'requiredContexts', 'checkRuns',
  'testExecutionReceipts', 'workflowRuns',
] as const;
const CHECK_FIELDS = [
  'recordId', 'runId', 'attempt', 'contextId', 'displayName', 'checkKind', 'headSha', 'status', 'conclusion', 'sourceUri',
] as const;
const TEST_RECEIPT_FIELDS = [
  'receiptId', 'checkRunRecordId', 'runId', 'attempt', 'headSha', 'testRef', 'outcome', 'reportUri', 'reportDigest',
] as const;
const TEST_RECEIPT_FIELD_SET: ReadonlySet<string> = new Set(TEST_RECEIPT_FIELDS);
const WORKFLOW_FIELDS = ['runId', 'attempt', 'headSha', 'status', 'conclusion', 'sourceUri', 'jobs'] as const;
const JOB_FIELDS = ['jobId', 'name', 'status', 'conclusion', 'sourceUri'] as const;
const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const OWNER_OR_REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const CREDENTIAL_PATTERNS: readonly RegExp[] = [
  /\bgh[pousr]_\w{20,}/i,
  /\bgithub_pat_\w{20,}/i,
  /\bBearer\s+\S+/i,
  /\b(?:token|secret|password|authorization)\s*[:=]\s*\S+/i,
];

function containsCredentialShape(value: string): boolean {
  return CREDENTIAL_PATTERNS.some((pattern) => pattern.test(value));
}
const COLLECTION_STATES: ReadonlySet<string> = new Set(['COMPLETE', 'PARTIAL', 'UNAVAILABLE', 'DENIED']);
const CHECK_STATUSES: ReadonlySet<string> = new Set(['QUEUED', 'IN_PROGRESS', 'COMPLETED']);
const CHECK_KINDS: ReadonlySet<string> = new Set(['STATUS', 'TEST', 'SECURITY', 'COVERAGE', 'OTHER']);
const CHECK_CONCLUSIONS: ReadonlySet<string | null> = new Set([
  'SUCCESS', 'FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'NEUTRAL', 'SKIPPED', null,
]);
const TEST_EXECUTION_OUTCOMES: ReadonlySet<string> = new Set(['PASSED', 'FAILED', 'SKIPPED', 'NOT_EXECUTED']);
const MAX_DIAGNOSTICS = 64;
const MAX_CHANGED_PATHS = 1024;
const MAX_REQUIRED_CONTEXTS = 256;
const MAX_CHECK_RUNS = 4096;
const MAX_TEST_EXECUTION_RECEIPTS = 8192;
const MAX_WORKFLOW_RUNS = 1024;
const MAX_JOBS_PER_WORKFLOW = 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function safeText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maxLength
    && value.trim() === value
    && !/[\u0000-\u001f\u007f]/.test(value)
    && !containsCredentialShape(value);
}

function safePublicUri(value: unknown): value is string {
  if (!safeText(value, 2048)) return false;
  try {
    const uri = new URL(value);
    return uri.protocol === 'https:'
      && uri.username.length === 0
      && uri.password.length === 0
      && uri.search.length === 0
      && uri.hash.length === 0;
  } catch {
    return false;
  }
}

function safePath(value: unknown): value is string {
  if (!safeText(value, 1024) || value.startsWith('/') || value.includes('\\')) return false;
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

export function isProviderTestRef(value: unknown): value is string {
  if (!safeText(value, 1024)) return false;
  const separator = value.indexOf('#');
  if (separator <= 0 || separator !== value.lastIndexOf('#')) return false;
  const path = value.slice(0, separator);
  const title = value.slice(separator + 1);
  return safePath(path) && path.startsWith('tests/gbs-mod-wo-002-') && path.endsWith('.test.mjs')
    && safeText(title, 512);
}

export function isProviderTestExecutionReceipt(value: unknown): value is ProviderTestExecutionReceipt {
  return isRecord(value) && Object.keys(value).every((key) => TEST_RECEIPT_FIELD_SET.has(key))
    && safeText(value['receiptId'], 192) && IDENTIFIER.test(value['receiptId'])
    && safeText(value['checkRunRecordId'], 192) && IDENTIFIER.test(value['checkRunRecordId'])
    && safeText(value['runId'], 192) && IDENTIFIER.test(value['runId'])
    && Number.isSafeInteger(value['attempt']) && (value['attempt'] as number) > 0 && (value['attempt'] as number) <= 1000
    && typeof value['headSha'] === 'string' && SHA40.test(value['headSha'])
    && isProviderTestRef(value['testRef'])
    && typeof value['outcome'] === 'string' && TEST_EXECUTION_OUTCOMES.has(value['outcome'])
    && safePublicUri(value['reportUri'])
    && typeof value['reportDigest'] === 'string' && SHA256.test(value['reportDigest']);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function compare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

interface ParsedProviderHeader {
  readonly collectionId: string | null;
  readonly providerId: string | null;
  readonly collectionState: unknown;
  readonly sourceUri: string | null;
  readonly workOrderId: string | null;
  readonly contextLockDigest: string | null;
}

class ProviderEvidenceInputParser {
  private readonly diagnostics: ProviderEvidenceDiagnostic[] = [];

  private report(code: string, message: string, subject?: string): void {
    if (this.diagnostics.length < MAX_DIAGNOSTICS) {
      this.diagnostics.push(subject === undefined ? { code, message } : { code, message, subject });
    }
  }

  private checkFields(record: Record<string, unknown>, known: readonly string[], prefix: string): void {
    for (const key of Object.keys(record).slice(0, 256)) {
      if (!known.includes(key)) this.report('GHE01_FIELD_UNKNOWN', 'Provider evidence contains an unknown field.', prefix);
    }
    if (Object.keys(record).length > 256) this.report('GHE01_FIELD_LIMIT', 'Provider evidence contains too many fields.', prefix);
  }

  private requireText(record: Record<string, unknown>, key: string, maxLength: number, prefix: string): string | null {
    const value = record[key];
    if (!safeText(value, maxLength)) {
      this.report('GHE01_FIELD_INVALID', `${prefix}.${key} must be bounded, non-empty text.`, `${prefix}.${key}`);
      return null;
    }
    return value;
  }

  private parseUri(record: Record<string, unknown>, key: string, prefix: string): string | null {
    const value = record[key];
    if (!safePublicUri(value)) {
      this.report('GHE01_URI_INVALID', `${prefix}.${key} must be a credential-free HTTPS evidence link.`, `${prefix}.${key}`);
      return null;
    }
    return value;
  }

  private parseStatus(record: Record<string, unknown>, key: string, prefix: string): ProviderCheckStatus | null {
    const value = record[key];
    if (typeof value !== 'string' || !CHECK_STATUSES.has(value)) {
      this.report('GHE01_STATUS_INVALID', `${prefix}.${key} is not a supported provider status.`, `${prefix}.${key}`);
      return null;
    }
    return value as ProviderCheckStatus;
  }

  private parseConclusion(record: Record<string, unknown>, status: ProviderCheckStatus | null, prefix: string): ProviderCheckConclusion | undefined {
    const value = record['conclusion'];
    if (!CHECK_CONCLUSIONS.has(value as string | null)) {
      this.report('GHE01_CONCLUSION_INVALID', `${prefix}.conclusion is not a supported provider conclusion.`, `${prefix}.conclusion`);
      return undefined;
    }
    if (status !== null && status !== 'COMPLETED' && value !== null) {
      this.report('GHE01_CONCLUSION_STATUS_MISMATCH', 'Non-completed provider records must not carry a conclusion.', `${prefix}.conclusion`);
      return undefined;
    }
    return value as ProviderCheckConclusion;
  }

  private parseAttempt(record: Record<string, unknown>, prefix: string): number | null {
    const value = record['attempt'];
    if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > 1000) {
      this.report('GHE01_ATTEMPT_INVALID', `${prefix}.attempt must be an integer from 1 through 1000.`, `${prefix}.attempt`);
      return null;
    }
    return value as number;
  }

  parse(input: unknown): ProviderEvidenceParseResult {
    if (!isRecord(input)) {
      return { ok: false, diagnostics: [{ code: 'GHE01_INPUT_INVALID', message: 'Provider evidence must be an object.' }] };
    }
    this.checkFields(input, TOP_LEVEL_FIELDS, 'input');
    const header = this.parseHeader(input);
    const repository = this.parseRepository(input['repository']);
    const pullRequest = this.parsePullRequest(input['pullRequest']);
    const sourceTrees = this.parseSourceTrees(input['sourceTrees']);
    const changedPaths = this.parseChangedPaths(input['changedPaths']);
    const fileBlobs = this.parseFileBlobs(input['fileBlobs'], input['changedPaths'], changedPaths);
    const requiredContexts = this.parseRequiredContexts(input['requiredContexts']);
    const ruleset = this.parseRuleset(input['ruleset']);
    const checkRuns = this.parseCheckRuns(input['checkRuns']);
    const testReceiptsInput = input['testExecutionReceipts'] === undefined ? [] : input['testExecutionReceipts'];
    const testExecutionReceipts = this.parseTestReceipts(testReceiptsInput, checkRuns);
    const workflowRuns = this.parseWorkflowRuns(input['workflowRuns']);

    if (this.diagnostics.length > 0 || header.collectionId === null || header.providerId === null
      || header.sourceUri === null || repository === null || pullRequest === null || sourceTrees === null
      || ruleset === null || header.workOrderId === null || header.contextLockDigest === null
      || typeof header.collectionState !== 'string' || !COLLECTION_STATES.has(header.collectionState)) {
      return { ok: false, diagnostics: this.diagnostics };
    }
    return {
      ok: true,
      value: deepFreeze({
        schemaVersion: PROVIDER_EVIDENCE_SCHEMA_VERSION,
        collectionId: header.collectionId,
        providerId: header.providerId,
        collectionState: header.collectionState as ProviderCollectionState,
        sourceUri: header.sourceUri,
        repository,
        pullRequest,
        sourceTrees,
        fileBlobs,
        ruleset,
        workOrderId: header.workOrderId,
        contextLockDigest: header.contextLockDigest,
        changedPaths,
        requiredContexts,
        checkRuns,
        testExecutionReceipts,
        workflowRuns,
      }),
    };
  }

  private parseHeader(input: Record<string, unknown>): ParsedProviderHeader {
    if (input['schemaVersion'] !== PROVIDER_EVIDENCE_SCHEMA_VERSION) {
      this.report('GHE01_VERSION_UNSUPPORTED', 'Provider evidence schemaVersion is unsupported.', 'schemaVersion');
    }
    const collectionId = this.requireText(input, 'collectionId', 192, 'input');
    const providerId = this.requireText(input, 'providerId', 64, 'input');
    if (providerId !== null && !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(providerId)) {
      this.report('GHE01_PROVIDER_INVALID', 'providerId must be a simple provider identity.', 'providerId');
    }
    const collectionState = input['collectionState'];
    if (typeof collectionState !== 'string' || !COLLECTION_STATES.has(collectionState)) {
      this.report('GHE01_COLLECTION_STATE_INVALID', 'collectionState is not supported.', 'collectionState');
    }
    const sourceUri = this.parseUri(input, 'sourceUri', 'input');
    const workOrderId = this.requireText(input, 'workOrderId', 192, 'input');
    if (workOrderId !== null && !IDENTIFIER.test(workOrderId)) {
      this.report('GHE01_WORK_ORDER_INVALID', 'workOrderId must be a simple identity.', 'workOrderId');
    }
    const contextLockDigest = this.requireText(input, 'contextLockDigest', 71, 'input');
    if (contextLockDigest !== null && !SHA256.test(contextLockDigest)) {
      this.report('GHE01_LOCK_DIGEST_INVALID', 'contextLockDigest must be a SHA-256 digest.', 'contextLockDigest');
    }
    return { collectionId, providerId, collectionState, sourceUri, workOrderId, contextLockDigest };
  }

  private parseRepository(value: unknown): ProviderRepositoryIdentity | null {
    if (!isRecord(value)) {
      this.report('GHE01_REPOSITORY_INVALID', 'repository must contain owner and name.', 'repository');
      return null;
    }
    this.checkFields(value, ['owner', 'name'], 'repository');
    const owner = this.requireText(value, 'owner', 100, 'repository');
    const name = this.requireText(value, 'name', 100, 'repository');
    if (owner !== null && !OWNER_OR_REPOSITORY.test(owner)) this.report('GHE01_OWNER_INVALID', 'repository.owner is invalid.', 'repository.owner');
    if (name !== null && !OWNER_OR_REPOSITORY.test(name)) this.report('GHE01_REPOSITORY_NAME_INVALID', 'repository.name is invalid.', 'repository.name');
    return owner !== null && name !== null ? { owner, name } : null;
  }

  private parsePullRequest(value: unknown): ProviderPullRequestIdentity | null {
    if (!isRecord(value)) {
      this.report('GHE01_PULL_REQUEST_INVALID', 'pullRequest must contain number, baseSha and headSha.', 'pullRequest');
      return null;
    }
    this.checkFields(value, ['number', 'baseSha', 'headSha'], 'pullRequest');
    const number = value['number'];
    const baseSha = value['baseSha'];
    const headSha = value['headSha'];
    if (!Number.isSafeInteger(number) || (number as number) < 1) this.report('GHE01_PR_NUMBER_INVALID', 'pullRequest.number must be a positive integer.', 'pullRequest.number');
    if (typeof baseSha !== 'string' || !SHA40.test(baseSha)) this.report('GHE01_BASE_SHA_INVALID', 'pullRequest.baseSha must be a full lowercase commit SHA.', 'pullRequest.baseSha');
    if (typeof headSha !== 'string' || !SHA40.test(headSha)) this.report('GHE01_HEAD_SHA_INVALID', 'pullRequest.headSha must be a full lowercase commit SHA.', 'pullRequest.headSha');
    if (!Number.isSafeInteger(number) || (number as number) < 1 || typeof baseSha !== 'string' || !SHA40.test(baseSha)
      || typeof headSha !== 'string' || !SHA40.test(headSha)) return null;
    return { number: number as number, baseSha, headSha };
  }

  private parseSourceTrees(value: unknown): ProviderTreeIdentity | null {
    if (!isRecord(value)) {
      this.report('GHE01_TREES_INVALID', 'sourceTrees must bind the base and candidate tree object identities.', 'sourceTrees');
      return null;
    }
    this.checkFields(value, ['baseTreeSha', 'headTreeSha'], 'sourceTrees');
    const baseTreeSha = value['baseTreeSha'];
    const headTreeSha = value['headTreeSha'];
    if (typeof baseTreeSha !== 'string' || !SHA40.test(baseTreeSha)) this.report('GHE01_BASE_TREE_INVALID', 'sourceTrees.baseTreeSha must be a full lowercase Git tree SHA.', 'sourceTrees.baseTreeSha');
    if (typeof headTreeSha !== 'string' || !SHA40.test(headTreeSha)) this.report('GHE01_HEAD_TREE_INVALID', 'sourceTrees.headTreeSha must be a full lowercase Git tree SHA.', 'sourceTrees.headTreeSha');
    if (typeof baseTreeSha !== 'string' || !SHA40.test(baseTreeSha) || typeof headTreeSha !== 'string' || !SHA40.test(headTreeSha)) return null;
    return { baseTreeSha, headTreeSha };
  }

  private parseChangedPaths(value: unknown): string[] {
    if (!Array.isArray(value) || value.length > MAX_CHANGED_PATHS) {
      this.report('GHE01_PATHS_INVALID', `changedPaths must be an array of at most ${MAX_CHANGED_PATHS} paths.`, 'changedPaths');
      return [];
    }
    if (value.length === 0) this.report('GHE01_PATHS_EMPTY', 'changedPaths must identify the actual candidate diff.', 'changedPaths');
    const changedPaths: string[] = [];
    const seen = new Set<string>();
    for (const path of value) {
      if (!safePath(path)) {
        this.report('GHE01_PATH_INVALID', 'changedPaths contains an unsafe repository-relative path.', 'changedPaths');
      } else if (seen.has(path)) {
        this.report('GHE01_PATH_DUPLICATE', 'changedPaths contains a duplicate path.', 'changedPaths');
      } else {
        seen.add(path);
        changedPaths.push(path);
      }
    }
    return changedPaths.sort(compare);
  }

  private parseFileBlobEntry(entry: unknown, index: number, seen: Set<string>): ProviderFileBlobIdentity | null {
    const prefix = `fileBlobs.${index}`;
    if (!isRecord(entry)) {
      this.report('GHE01_BLOB_INVALID', 'File blob identity must be an object.', prefix);
      return null;
    }
    this.checkFields(entry, ['path', 'blobSha'], prefix);
    const path = entry['path'];
    const blobSha = entry['blobSha'];
    const validPath = safePath(path);
    const validSha = typeof blobSha === 'string' && SHA40.test(blobSha);
    if (!validPath) this.report('GHE01_BLOB_PATH_INVALID', 'fileBlobs path must be a safe repository-relative path.', `${prefix}.path`);
    if (!validSha) this.report('GHE01_BLOB_SHA_INVALID', 'fileBlobs blobSha must be a full lowercase Git blob SHA.', `${prefix}.blobSha`);
    if (typeof path === 'string' && seen.has(path)) this.report('GHE01_BLOB_PATH_DUPLICATE', 'fileBlobs must contain one identity per changed path.', `${prefix}.path`);
    if (typeof path === 'string') seen.add(path);
    return validPath && validSha ? { path, blobSha } : null;
  }

  private parseFileBlobs(value: unknown, changedPathsInput: unknown, changedPaths: readonly string[]): ProviderFileBlobIdentity[] {
    if (!Array.isArray(value) || value.length > MAX_CHANGED_PATHS) {
      this.report('GHE01_BLOBS_INVALID', `fileBlobs must be an array of at most ${MAX_CHANGED_PATHS} exact path/blob identities.`, 'fileBlobs');
      return [];
    }
    const fileBlobs: ProviderFileBlobIdentity[] = [];
    const seen = new Set<string>();
    for (const [index, entry] of value.entries()) {
      const parsed = this.parseFileBlobEntry(entry, index, seen);
      if (parsed !== null) fileBlobs.push(parsed);
    }
    fileBlobs.sort((left, right) => compare(left.path, right.path));
    if (Array.isArray(changedPathsInput) && JSON.stringify(fileBlobs.map(({ path }) => path)) !== JSON.stringify([...changedPaths].sort(compare))) {
      this.report('GHE01_BLOB_PATH_SET_MISMATCH', 'fileBlobs must bind every changed path exactly once.', 'fileBlobs');
    }
    return fileBlobs;
  }

  private parseRequiredContexts(value: unknown): ProviderRequiredContext[] {
    if (!Array.isArray(value) || value.length > MAX_REQUIRED_CONTEXTS) {
      this.report('GHE01_CONTEXTS_INVALID', `requiredContexts must be an array of at most ${MAX_REQUIRED_CONTEXTS} contexts.`, 'requiredContexts');
      return [];
    }
    if (value.length === 0) this.report('GHE01_CONTEXTS_EMPTY', 'requiredContexts must not be empty.', 'requiredContexts');
    const contexts: ProviderRequiredContext[] = [];
    const seen = new Set<string>();
    value.forEach((entry, index) => {
      const prefix = `requiredContexts.${index}`;
      if (!isRecord(entry)) {
        this.report('GHE01_CONTEXT_INVALID', 'Required context must be an object.', prefix);
        return;
      }
      this.checkFields(entry, ['contextId', 'displayName'], prefix);
      const contextId = this.requireText(entry, 'contextId', 192, prefix);
      const displayName = this.requireText(entry, 'displayName', 512, prefix);
      if (contextId !== null && !IDENTIFIER.test(contextId)) this.report('GHE01_CONTEXT_ID_INVALID', 'contextId is invalid.', `${prefix}.contextId`);
      if (contextId !== null && seen.has(contextId)) this.report('GHE01_CONTEXT_DUPLICATE', 'requiredContexts contains a duplicate context identity.', `${prefix}.contextId`);
      if (contextId !== null) seen.add(contextId);
      if (contextId !== null && displayName !== null && IDENTIFIER.test(contextId)) contexts.push({ contextId, displayName });
    });
    return contexts.sort((left, right) => compare(left.contextId, right.contextId));
  }

  private parseRuleset(value: unknown): ProviderRulesetIdentity | null {
    if (!isRecord(value)) {
      this.report('GHE01_RULESET_INVALID', 'ruleset must bind the current provider ruleset identity and digest.', 'ruleset');
      return null;
    }
    this.checkFields(value, ['rulesetId', 'digest'], 'ruleset');
    const rulesetId = this.requireText(value, 'rulesetId', 192, 'ruleset');
    const digest = this.requireText(value, 'digest', 71, 'ruleset');
    if (rulesetId !== null && !IDENTIFIER.test(rulesetId)) this.report('GHE01_RULESET_ID_INVALID', 'ruleset.rulesetId is invalid.', 'ruleset.rulesetId');
    if (digest !== null && !SHA256.test(digest)) this.report('GHE01_RULESET_DIGEST_INVALID', 'ruleset.digest must be a SHA-256 digest.', 'ruleset.digest');
    if (rulesetId === null || !IDENTIFIER.test(rulesetId) || digest === null || !SHA256.test(digest)) return null;
    return { rulesetId, digest };
  }

  private parseCheckRuns(value: unknown): ProviderCheckRun[] {
    if (!Array.isArray(value) || value.length > MAX_CHECK_RUNS) {
      this.report('GHE01_CHECK_RUNS_INVALID', `checkRuns must be an array of at most ${MAX_CHECK_RUNS} records.`, 'checkRuns');
      return [];
    }
    const checkRuns: ProviderCheckRun[] = [];
    const seen = new Set<string>();
    value.forEach((entry, index) => {
      const run = this.parseCheckRun(entry, index, seen);
      if (run !== null) checkRuns.push(run);
    });
    return checkRuns.sort((left, right) => compare(left.runId, right.runId)
      || left.attempt - right.attempt || compare(left.recordId, right.recordId)
      || compare(left.contextId, right.contextId) || compare(left.headSha, right.headSha));
  }

  private parseCheckRun(value: unknown, index: number, seen: Set<string>): ProviderCheckRun | null {
    const prefix = `checkRuns.${index}`;
    if (!isRecord(value)) {
      this.report('GHE01_CHECK_RUN_INVALID', 'Check run must be an object.', prefix);
      return null;
    }
    this.checkFields(value, CHECK_FIELDS, prefix);
    const recordId = this.requireText(value, 'recordId', 192, prefix);
    const runId = this.requireText(value, 'runId', 192, prefix);
    const attempt = this.parseAttempt(value, prefix);
    const contextId = this.requireText(value, 'contextId', 192, prefix);
    const displayName = this.requireText(value, 'displayName', 512, prefix);
    const checkKind = value['checkKind'];
    const headSha = value['headSha'];
    if (recordId !== null && seen.has(recordId)) this.report('GHE01_CHECK_ID_DUPLICATE', 'Provider check record identity is duplicated.', `${prefix}.recordId`);
    if (recordId !== null) seen.add(recordId);
    if (typeof checkKind !== 'string' || !CHECK_KINDS.has(checkKind)) this.report('GHE01_CHECK_KIND_INVALID', 'checkKind must classify the provider result without changing its source identity.', `${prefix}.checkKind`);
    if (typeof headSha !== 'string' || !SHA40.test(headSha)) this.report('GHE01_CHECK_SHA_INVALID', 'Check run headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
    const status = this.parseStatus(value, 'status', prefix);
    const conclusion = this.parseConclusion(value, status, prefix);
    const sourceUri = this.parseUri(value, 'sourceUri', prefix);
    this.reportCheckRunIdentifiers(recordId, runId, contextId, prefix);
    if (recordId === null || runId === null || attempt === null || contextId === null || displayName === null
      || typeof checkKind !== 'string' || !CHECK_KINDS.has(checkKind) || typeof headSha !== 'string' || !SHA40.test(headSha)
      || status === null || conclusion === undefined || sourceUri === null) return null;
    return { recordId, runId, attempt, contextId, displayName, checkKind: checkKind as ProviderCheckKind, headSha, status, conclusion, sourceUri };
  }

  private reportCheckRunIdentifiers(recordId: string | null, runId: string | null, contextId: string | null, prefix: string): void {
    if (recordId !== null && !IDENTIFIER.test(recordId)) this.report('GHE01_RECORD_ID_INVALID', 'recordId is invalid.', `${prefix}.recordId`);
    if (runId !== null && !IDENTIFIER.test(runId)) this.report('GHE01_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
    if (contextId !== null && !IDENTIFIER.test(contextId)) this.report('GHE01_CONTEXT_ID_INVALID', 'contextId is invalid.', `${prefix}.contextId`);
  }

  private parseTestReceipts(value: unknown, checkRuns: readonly ProviderCheckRun[]): ProviderTestExecutionReceipt[] {
    if (!Array.isArray(value) || value.length > MAX_TEST_EXECUTION_RECEIPTS) {
      this.report('GHE01_TEST_RECEIPTS_INVALID', `testExecutionReceipts must be an array of at most ${MAX_TEST_EXECUTION_RECEIPTS} records.`, 'testExecutionReceipts');
      return [];
    }
    const receipts: ProviderTestExecutionReceipt[] = [];
    const seen = new Set<string>();
    value.forEach((entry, index) => {
      const receipt = this.parseTestReceipt(entry, index, checkRuns, seen);
      if (receipt !== null) receipts.push(receipt);
    });
    if (receipts.length > 0) {
      this.report('GHE01_TEST_RECEIPTS_UNAUTHENTICATED', 'Caller-supplied test receipts are not provider report evidence; collect the raw Actions job report through the authenticated read-only collector.', 'testExecutionReceipts');
      return [];
    }
    return receipts.sort((left, right) => compare(left.receiptId, right.receiptId));
  }

  private parseTestReceipt(
    value: unknown,
    index: number,
    checkRuns: readonly ProviderCheckRun[],
    seen: Set<string>,
  ): ProviderTestExecutionReceipt | null {
    const prefix = `testExecutionReceipts.${index}`;
    if (!isRecord(value)) {
      this.report('GHE01_TEST_RECEIPT_INVALID', 'Test execution receipt must be an object.', prefix);
      return null;
    }
    this.checkFields(value, TEST_RECEIPT_FIELDS, prefix);
    const receiptId = this.requireText(value, 'receiptId', 192, prefix);
    const checkRunRecordId = this.requireText(value, 'checkRunRecordId', 192, prefix);
    const runId = this.requireText(value, 'runId', 192, prefix);
    const attempt = this.parseAttempt(value, prefix);
    const headSha = value['headSha'];
    const testRef = value['testRef'];
    const outcome = value['outcome'];
    const reportUri = this.parseUri(value, 'reportUri', prefix);
    const reportDigest = this.requireText(value, 'reportDigest', 71, prefix);
    this.reportReceiptIdentity(receiptId, checkRunRecordId, runId, seen, prefix);
    this.reportReceiptHead(headSha, prefix);
    this.reportReceiptTestFields(testRef, outcome, reportDigest, prefix);
    const checkRun = checkRuns.find((run) => run.recordId === checkRunRecordId);
    if (checkRunRecordId !== null && checkRun === undefined) {
      this.report('GHE01_TEST_RECEIPT_CHECK_RUN_MISSING', 'Test receipt does not identify a collected check run.', `${prefix}.checkRunRecordId`);
    }
    this.reportReceiptCheckBinding(checkRun, runId, attempt, reportUri, prefix);
    const receipt = { receiptId, checkRunRecordId, runId, attempt, headSha, testRef, outcome, reportUri, reportDigest };
    if (!isProviderTestExecutionReceipt(receipt) || checkRun?.checkKind !== 'TEST') return null;
    if (checkRun.runId !== receipt.runId || checkRun.attempt !== receipt.attempt
      || new URL(receipt.reportUri).origin !== new URL(checkRun.sourceUri).origin) return null;
    return receipt;
  }

  private reportReceiptIdentity(
    receiptId: string | null,
    checkRunRecordId: string | null,
    runId: string | null,
    seen: Set<string>,
    prefix: string,
  ): void {
    if (receiptId !== null && seen.has(receiptId)) this.report('GHE01_TEST_RECEIPT_ID_DUPLICATE', 'Test execution receipt identity is duplicated.', `${prefix}.receiptId`);
    if (receiptId !== null) seen.add(receiptId);
    if (receiptId !== null && !IDENTIFIER.test(receiptId)) this.report('GHE01_TEST_RECEIPT_ID_INVALID', 'receiptId is invalid.', `${prefix}.receiptId`);
    if (checkRunRecordId !== null && !IDENTIFIER.test(checkRunRecordId)) this.report('GHE01_TEST_RECEIPT_CHECK_ID_INVALID', 'checkRunRecordId is invalid.', `${prefix}.checkRunRecordId`);
    if (runId !== null && !IDENTIFIER.test(runId)) this.report('GHE01_TEST_RECEIPT_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
  }

  private reportReceiptHead(value: unknown, prefix: string): void {
    if (typeof value !== 'string' || !SHA40.test(value)) this.report('GHE01_TEST_RECEIPT_SHA_INVALID', 'Test receipt headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
  }

  private reportReceiptTestFields(testRef: unknown, outcome: unknown, reportDigest: string | null, prefix: string): void {
    if (!isProviderTestRef(testRef)) this.report('GHE01_TEST_RECEIPT_REF_INVALID', 'testRef must identify a bounded WO-002 test case.', `${prefix}.testRef`);
    if (typeof outcome !== 'string' || !['PASSED', 'FAILED', 'SKIPPED', 'NOT_EXECUTED'].includes(outcome)) {
      this.report('GHE01_TEST_RECEIPT_OUTCOME_INVALID', 'Test receipt outcome is not supported.', `${prefix}.outcome`);
    }
    if (reportDigest !== null && !SHA256.test(reportDigest)) this.report('GHE01_TEST_REPORT_DIGEST_INVALID', 'reportDigest must be a SHA-256 digest.', `${prefix}.reportDigest`);
  }

  private reportReceiptCheckBinding(
    checkRun: ProviderCheckRun | undefined,
    runId: string | null,
    attempt: number | null,
    reportUri: string | null,
    prefix: string,
  ): void {
    if (checkRun === undefined) return;
    if (checkRun.checkKind !== 'TEST') this.report('GHE01_TEST_RECEIPT_CHECK_KIND_INVALID', 'Test receipt must bind to a TEST check run.', `${prefix}.checkRunRecordId`);
    if (checkRun.runId !== runId || checkRun.attempt !== attempt) {
      this.report('GHE01_TEST_RECEIPT_RUN_MISMATCH', 'Test receipt run and attempt must match its check run.', prefix);
    }
    if (reportUri !== null && new URL(reportUri).origin !== new URL(checkRun.sourceUri).origin) {
      this.report('GHE01_TEST_REPORT_SOURCE_MISMATCH', 'Test report must come from the check run provider origin.', `${prefix}.reportUri`);
    }
  }

  private parseWorkflowRuns(value: unknown): ProviderWorkflowRun[] {
    if (!Array.isArray(value) || value.length > MAX_WORKFLOW_RUNS) {
      this.report('GHE01_WORKFLOWS_INVALID', `workflowRuns must be an array of at most ${MAX_WORKFLOW_RUNS} records.`, 'workflowRuns');
      return [];
    }
    const runs: ProviderWorkflowRun[] = [];
    value.forEach((entry, index) => {
      const run = this.parseWorkflowRun(entry, index);
      if (run !== null) runs.push(run);
    });
    return runs.sort((left, right) => compare(left.runId, right.runId) || left.attempt - right.attempt || compare(left.headSha, right.headSha));
  }

  private parseWorkflowRun(value: unknown, index: number): ProviderWorkflowRun | null {
    const prefix = `workflowRuns.${index}`;
    if (!isRecord(value)) {
      this.report('GHE01_WORKFLOW_INVALID', 'Workflow run must be an object.', prefix);
      return null;
    }
    this.checkFields(value, WORKFLOW_FIELDS, prefix);
    const runId = this.requireText(value, 'runId', 192, prefix);
    const attempt = this.parseAttempt(value, prefix);
    const headSha = value['headSha'];
    if (typeof headSha !== 'string' || !SHA40.test(headSha)) this.report('GHE01_WORKFLOW_SHA_INVALID', 'Workflow headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
    const status = this.parseStatus(value, 'status', prefix);
    const conclusion = this.parseConclusion(value, status, prefix);
    const sourceUri = this.parseUri(value, 'sourceUri', prefix);
    if (runId !== null && !IDENTIFIER.test(runId)) this.report('GHE01_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
    const jobs = this.parseWorkflowJobs(value['jobs'], prefix);
    if (runId === null || !IDENTIFIER.test(runId) || attempt === null || typeof headSha !== 'string' || !SHA40.test(headSha)
      || status === null || conclusion === undefined || sourceUri === null) return null;
    return { runId, attempt, headSha, status, conclusion, sourceUri, jobs };
  }

  private parseWorkflowJobs(value: unknown, prefix: string): ProviderWorkflowJob[] {
    if (!Array.isArray(value) || value.length > MAX_JOBS_PER_WORKFLOW) {
      this.report('GHE01_JOBS_INVALID', `Workflow jobs must be an array of at most ${MAX_JOBS_PER_WORKFLOW} records.`, `${prefix}.jobs`);
      return [];
    }
    const jobs: ProviderWorkflowJob[] = [];
    const seen = new Set<string>();
    value.forEach((entry, index) => {
      const job = this.parseWorkflowJob(entry, prefix, index, seen);
      if (job !== null) jobs.push(job);
    });
    return jobs.sort((left, right) => compare(left.jobId, right.jobId));
  }

  private parseWorkflowJob(value: unknown, runPrefix: string, index: number, seen: Set<string>): ProviderWorkflowJob | null {
    const prefix = `${runPrefix}.jobs.${index}`;
    if (!isRecord(value)) {
      this.report('GHE01_JOB_INVALID', 'Workflow job must be an object.', prefix);
      return null;
    }
    this.checkFields(value, JOB_FIELDS, prefix);
    const jobId = this.requireText(value, 'jobId', 192, prefix);
    if (jobId !== null && seen.has(jobId)) this.report('GHE01_JOB_ID_DUPLICATE', 'Workflow attempt contains a duplicate job identity.', `${prefix}.jobId`);
    if (jobId !== null) seen.add(jobId);
    const name = this.requireText(value, 'name', 512, prefix);
    const status = this.parseStatus(value, 'status', prefix);
    const conclusion = this.parseConclusion(value, status, prefix);
    const sourceUri = this.parseUri(value, 'sourceUri', prefix);
    if (jobId !== null && !IDENTIFIER.test(jobId)) this.report('GHE01_JOB_ID_INVALID', 'jobId is invalid.', `${prefix}.jobId`);
    if (jobId === null || !IDENTIFIER.test(jobId) || name === null || status === null || conclusion === undefined || sourceUri === null) return null;
    return { jobId, name, status, conclusion, sourceUri };
  }
}

function parseProviderEvidenceInputUnchecked(input: unknown): ProviderEvidenceParseResult {
  return new ProviderEvidenceInputParser().parse(input);
}

/** Converts hostile objects that throw during inspection into a bounded diagnostic. */
export function parseProviderEvidenceInput(input: unknown): ProviderEvidenceParseResult {
  try {
    return parseProviderEvidenceInputUnchecked(input);
  } catch {
    return { ok: false, diagnostics: [{ code: 'GHE01_INPUT_UNREADABLE', message: 'Provider evidence could not be safely inspected.' }] };
  }
}
