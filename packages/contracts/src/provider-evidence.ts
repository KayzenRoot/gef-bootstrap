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
  /** SHA-256 of the provider test report artifact linked by reportUri. */
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
  /** Optional for older provider collections; absence can never prove an acceptance test. */
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
const WORKFLOW_FIELDS = ['runId', 'attempt', 'headSha', 'status', 'conclusion', 'sourceUri', 'jobs'] as const;
const JOB_FIELDS = ['jobId', 'name', 'status', 'conclusion', 'sourceUri'] as const;
const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const OWNER_OR_REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const CREDENTIAL_SHAPE = /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+\S+|(?:token|secret|password|authorization)\s*[:=]\s*\S+)/i;
const COLLECTION_STATES: readonly string[] = ['COMPLETE', 'PARTIAL', 'UNAVAILABLE', 'DENIED'];
const CHECK_STATUSES: readonly string[] = ['QUEUED', 'IN_PROGRESS', 'COMPLETED'];
const CHECK_KINDS: readonly string[] = ['STATUS', 'TEST', 'SECURITY', 'COVERAGE', 'OTHER'];
const CHECK_CONCLUSIONS: readonly (string | null)[] = [
  'SUCCESS', 'FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'NEUTRAL', 'SKIPPED', null,
];
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
    && !CREDENTIAL_SHAPE.test(value);
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

function validTestRef(value: unknown): value is string {
  if (!safeText(value, 1024)) return false;
  const separator = value.indexOf('#');
  if (separator <= 0 || separator !== value.lastIndexOf('#')) return false;
  const path = value.slice(0, separator);
  const title = value.slice(separator + 1);
  return safePath(path) && path.startsWith('tests/gbs-mod-wo-002-') && path.endsWith('.test.mjs')
    && safeText(title, 512);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Validates an untrusted provider envelope, copies only allowlisted fields, and returns a
 * deterministic immutable value. Unknown field values are never copied into diagnostics.
 */
function parseProviderEvidenceInputUnchecked(input: unknown): ProviderEvidenceParseResult {
  const diagnostics: ProviderEvidenceDiagnostic[] = [];
  const report = (code: string, message: string, subject?: string) => {
    if (diagnostics.length < MAX_DIAGNOSTICS) {
      diagnostics.push(subject === undefined ? { code, message } : { code, message, subject });
    }
  };
  const checkFields = (record: Record<string, unknown>, known: readonly string[], prefix: string) => {
    for (const key of Object.keys(record).slice(0, 256)) {
      if (!known.includes(key)) report('GHE01_FIELD_UNKNOWN', 'Provider evidence contains an unknown field.', prefix);
    }
    if (Object.keys(record).length > 256) report('GHE01_FIELD_LIMIT', 'Provider evidence contains too many fields.', prefix);
  };
  const requireText = (record: Record<string, unknown>, key: string, maxLength: number, prefix: string): string | null => {
    const value = record[key];
    if (!safeText(value, maxLength)) {
      report('GHE01_FIELD_INVALID', `${prefix}.${key} must be bounded, non-empty text.`, `${prefix}.${key}`);
      return null;
    }
    return value;
  };
  const parseUri = (record: Record<string, unknown>, key: string, prefix: string): string | null => {
    const value = record[key];
    if (!safePublicUri(value)) {
      report('GHE01_URI_INVALID', `${prefix}.${key} must be a credential-free HTTPS evidence link.`, `${prefix}.${key}`);
      return null;
    }
    return value;
  };
  const parseStatus = (record: Record<string, unknown>, key: string, prefix: string): ProviderCheckStatus | null => {
    const value = record[key];
    if (typeof value !== 'string' || !CHECK_STATUSES.includes(value)) {
      report('GHE01_STATUS_INVALID', `${prefix}.${key} is not a supported provider status.`, `${prefix}.${key}`);
      return null;
    }
    return value as ProviderCheckStatus;
  };
  const parseConclusion = (record: Record<string, unknown>, status: ProviderCheckStatus | null, prefix: string): ProviderCheckConclusion | undefined => {
    const value = record['conclusion'];
    if (!CHECK_CONCLUSIONS.includes(value as string | null)) {
      report('GHE01_CONCLUSION_INVALID', `${prefix}.conclusion is not a supported provider conclusion.`, `${prefix}.conclusion`);
      return undefined;
    }
    if (status !== null && status !== 'COMPLETED' && value !== null) {
      report('GHE01_CONCLUSION_STATUS_MISMATCH', 'Non-completed provider records must not carry a conclusion.', `${prefix}.conclusion`);
      return undefined;
    }
    return value as ProviderCheckConclusion;
  };
  const parseAttempt = (record: Record<string, unknown>, prefix: string): number | null => {
    const value = record['attempt'];
    if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > 1000) {
      report('GHE01_ATTEMPT_INVALID', `${prefix}.attempt must be an integer from 1 through 1000.`, `${prefix}.attempt`);
      return null;
    }
    return value as number;
  };

  if (!isRecord(input)) {
    return { ok: false, diagnostics: [{ code: 'GHE01_INPUT_INVALID', message: 'Provider evidence must be an object.' }] };
  }
  checkFields(input, TOP_LEVEL_FIELDS, 'input');

  const schemaVersion = input['schemaVersion'];
  if (schemaVersion !== PROVIDER_EVIDENCE_SCHEMA_VERSION) {
    report('GHE01_VERSION_UNSUPPORTED', 'Provider evidence schemaVersion is unsupported.', 'schemaVersion');
  }
  const collectionId = requireText(input, 'collectionId', 192, 'input');
  const providerId = requireText(input, 'providerId', 64, 'input');
  if (providerId !== null && !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(providerId)) {
    report('GHE01_PROVIDER_INVALID', 'providerId must be a simple provider identity.', 'providerId');
  }
  const collectionState = input['collectionState'];
  if (typeof collectionState !== 'string' || !COLLECTION_STATES.includes(collectionState)) {
    report('GHE01_COLLECTION_STATE_INVALID', 'collectionState is not supported.', 'collectionState');
  }
  const sourceUri = parseUri(input, 'sourceUri', 'input');
  const workOrderId = requireText(input, 'workOrderId', 192, 'input');
  if (workOrderId !== null && !IDENTIFIER.test(workOrderId)) {
    report('GHE01_WORK_ORDER_INVALID', 'workOrderId must be a simple identity.', 'workOrderId');
  }
  const contextLockDigest = requireText(input, 'contextLockDigest', 71, 'input');
  if (contextLockDigest !== null && !SHA256.test(contextLockDigest)) {
    report('GHE01_LOCK_DIGEST_INVALID', 'contextLockDigest must be a SHA-256 digest.', 'contextLockDigest');
  }

  const repositoryInput = input['repository'];
  let repository: ProviderRepositoryIdentity | null = null;
  if (!isRecord(repositoryInput)) {
    report('GHE01_REPOSITORY_INVALID', 'repository must contain owner and name.', 'repository');
  } else {
    checkFields(repositoryInput, ['owner', 'name'], 'repository');
    const owner = requireText(repositoryInput, 'owner', 100, 'repository');
    const name = requireText(repositoryInput, 'name', 100, 'repository');
    if (owner !== null && !OWNER_OR_REPOSITORY.test(owner)) report('GHE01_OWNER_INVALID', 'repository.owner is invalid.', 'repository.owner');
    if (name !== null && !OWNER_OR_REPOSITORY.test(name)) report('GHE01_REPOSITORY_NAME_INVALID', 'repository.name is invalid.', 'repository.name');
    if (owner !== null && name !== null) repository = { owner, name };
  }

  const pullRequestInput = input['pullRequest'];
  let pullRequest: ProviderPullRequestIdentity | null = null;
  if (!isRecord(pullRequestInput)) {
    report('GHE01_PULL_REQUEST_INVALID', 'pullRequest must contain number, baseSha and headSha.', 'pullRequest');
  } else {
    checkFields(pullRequestInput, ['number', 'baseSha', 'headSha'], 'pullRequest');
    const number = pullRequestInput['number'];
    if (!Number.isSafeInteger(number) || (number as number) < 1) report('GHE01_PR_NUMBER_INVALID', 'pullRequest.number must be a positive integer.', 'pullRequest.number');
    const baseSha = pullRequestInput['baseSha'];
    const headSha = pullRequestInput['headSha'];
    if (typeof baseSha !== 'string' || !SHA40.test(baseSha)) report('GHE01_BASE_SHA_INVALID', 'pullRequest.baseSha must be a full lowercase commit SHA.', 'pullRequest.baseSha');
    if (typeof headSha !== 'string' || !SHA40.test(headSha)) report('GHE01_HEAD_SHA_INVALID', 'pullRequest.headSha must be a full lowercase commit SHA.', 'pullRequest.headSha');
    if (Number.isSafeInteger(number) && (number as number) > 0 && typeof baseSha === 'string' && SHA40.test(baseSha)
      && typeof headSha === 'string' && SHA40.test(headSha)) {
      pullRequest = { number: number as number, baseSha, headSha };
    }
  }

  const sourceTreesInput = input['sourceTrees'];
  let sourceTrees: ProviderTreeIdentity | null = null;
  if (!isRecord(sourceTreesInput)) {
    report('GHE01_TREES_INVALID', 'sourceTrees must bind the base and candidate tree object identities.', 'sourceTrees');
  } else {
    checkFields(sourceTreesInput, ['baseTreeSha', 'headTreeSha'], 'sourceTrees');
    const baseTreeSha = sourceTreesInput['baseTreeSha'];
    const headTreeSha = sourceTreesInput['headTreeSha'];
    if (typeof baseTreeSha !== 'string' || !SHA40.test(baseTreeSha)) report('GHE01_BASE_TREE_INVALID', 'sourceTrees.baseTreeSha must be a full lowercase Git tree SHA.', 'sourceTrees.baseTreeSha');
    if (typeof headTreeSha !== 'string' || !SHA40.test(headTreeSha)) report('GHE01_HEAD_TREE_INVALID', 'sourceTrees.headTreeSha must be a full lowercase Git tree SHA.', 'sourceTrees.headTreeSha');
    if (typeof baseTreeSha === 'string' && SHA40.test(baseTreeSha) && typeof headTreeSha === 'string' && SHA40.test(headTreeSha)) {
      sourceTrees = { baseTreeSha, headTreeSha };
    }
  }

  const changedPathsInput = input['changedPaths'];
  const changedPaths: string[] = [];
  if (!Array.isArray(changedPathsInput) || changedPathsInput.length > MAX_CHANGED_PATHS) {
    report('GHE01_PATHS_INVALID', `changedPaths must be an array of at most ${MAX_CHANGED_PATHS} paths.`, 'changedPaths');
  } else {
    if (changedPathsInput.length === 0) report('GHE01_PATHS_EMPTY', 'changedPaths must identify the actual candidate diff.', 'changedPaths');
    const seen = new Set<string>();
    for (const path of changedPathsInput) {
      if (!safePath(path)) {
        report('GHE01_PATH_INVALID', 'changedPaths contains an unsafe repository-relative path.', 'changedPaths');
      } else if (seen.has(path)) {
        report('GHE01_PATH_DUPLICATE', 'changedPaths contains a duplicate path.', 'changedPaths');
      } else {
        seen.add(path);
        changedPaths.push(path);
      }
    }
    changedPaths.sort(compare);
  }

  const fileBlobsInput = input['fileBlobs'];
  const fileBlobs: ProviderFileBlobIdentity[] = [];
  if (!Array.isArray(fileBlobsInput) || fileBlobsInput.length > MAX_CHANGED_PATHS) {
    report('GHE01_BLOBS_INVALID', `fileBlobs must be an array of at most ${MAX_CHANGED_PATHS} exact path/blob identities.`, 'fileBlobs');
  } else {
    const seen = new Set<string>();
    for (const [index, entry] of fileBlobsInput.entries()) {
      const prefix = `fileBlobs.${index}`;
      if (!isRecord(entry)) {
        report('GHE01_BLOB_INVALID', 'File blob identity must be an object.', prefix);
        continue;
      }
      checkFields(entry, ['path', 'blobSha'], prefix);
      const path = entry['path'];
      const blobSha = entry['blobSha'];
      if (!safePath(path)) report('GHE01_BLOB_PATH_INVALID', 'fileBlobs path must be a safe repository-relative path.', `${prefix}.path`);
      if (typeof blobSha !== 'string' || !SHA40.test(blobSha)) report('GHE01_BLOB_SHA_INVALID', 'fileBlobs blobSha must be a full lowercase Git blob SHA.', `${prefix}.blobSha`);
      if (typeof path === 'string' && seen.has(path)) report('GHE01_BLOB_PATH_DUPLICATE', 'fileBlobs must contain one identity per changed path.', `${prefix}.path`);
      if (typeof path === 'string') seen.add(path);
      if (safePath(path) && typeof blobSha === 'string' && SHA40.test(blobSha)) fileBlobs.push({ path, blobSha });
    }
    fileBlobs.sort((left, right) => compare(left.path, right.path));
    if (Array.isArray(changedPathsInput) && JSON.stringify(fileBlobs.map(({ path }) => path)) !== JSON.stringify([...changedPaths].sort(compare))) {
      report('GHE01_BLOB_PATH_SET_MISMATCH', 'fileBlobs must bind every changed path exactly once.', 'fileBlobs');
    }
  }

  const requiredContextsInput = input['requiredContexts'];
  const requiredContexts: ProviderRequiredContext[] = [];
  if (!Array.isArray(requiredContextsInput) || requiredContextsInput.length > MAX_REQUIRED_CONTEXTS) {
    report('GHE01_CONTEXTS_INVALID', `requiredContexts must be an array of at most ${MAX_REQUIRED_CONTEXTS} contexts.`, 'requiredContexts');
  } else {
    if (requiredContextsInput.length === 0) report('GHE01_CONTEXTS_EMPTY', 'requiredContexts must not be empty.', 'requiredContexts');
    const seen = new Set<string>();
    requiredContextsInput.forEach((entry, index) => {
      const prefix = `requiredContexts.${index}`;
      if (!isRecord(entry)) {
        report('GHE01_CONTEXT_INVALID', 'Required context must be an object.', prefix);
        return;
      }
      checkFields(entry, ['contextId', 'displayName'], prefix);
      const contextId = requireText(entry, 'contextId', 192, prefix);
      const displayName = requireText(entry, 'displayName', 512, prefix);
      if (contextId !== null && !IDENTIFIER.test(contextId)) report('GHE01_CONTEXT_ID_INVALID', 'contextId is invalid.', `${prefix}.contextId`);
      if (contextId !== null && seen.has(contextId)) report('GHE01_CONTEXT_DUPLICATE', 'requiredContexts contains a duplicate context identity.', `${prefix}.contextId`);
      if (contextId !== null) seen.add(contextId);
      if (contextId !== null && displayName !== null && IDENTIFIER.test(contextId)) requiredContexts.push({ contextId, displayName });
    });
    requiredContexts.sort((left, right) => compare(left.contextId, right.contextId));
  }

  const rulesetInput = input['ruleset'];
  let ruleset: ProviderRulesetIdentity | null = null;
  if (!isRecord(rulesetInput)) {
    report('GHE01_RULESET_INVALID', 'ruleset must bind the current provider ruleset identity and digest.', 'ruleset');
  } else {
    checkFields(rulesetInput, ['rulesetId', 'digest'], 'ruleset');
    const rulesetId = requireText(rulesetInput, 'rulesetId', 192, 'ruleset');
    const rulesetDigest = requireText(rulesetInput, 'digest', 71, 'ruleset');
    if (rulesetId !== null && !IDENTIFIER.test(rulesetId)) report('GHE01_RULESET_ID_INVALID', 'ruleset.rulesetId is invalid.', 'ruleset.rulesetId');
    if (rulesetDigest !== null && !SHA256.test(rulesetDigest)) report('GHE01_RULESET_DIGEST_INVALID', 'ruleset.digest must be a SHA-256 digest.', 'ruleset.digest');
    if (rulesetId !== null && IDENTIFIER.test(rulesetId) && rulesetDigest !== null && SHA256.test(rulesetDigest)) {
      ruleset = { rulesetId, digest: rulesetDigest };
    }
  }

  const checkRunsInput = input['checkRuns'];
  const checkRuns: ProviderCheckRun[] = [];
  const checkRecordIds = new Set<string>();
  if (!Array.isArray(checkRunsInput) || checkRunsInput.length > MAX_CHECK_RUNS) {
    report('GHE01_CHECK_RUNS_INVALID', `checkRuns must be an array of at most ${MAX_CHECK_RUNS} records.`, 'checkRuns');
  } else {
    checkRunsInput.forEach((entry, index) => {
      const prefix = `checkRuns.${index}`;
      if (!isRecord(entry)) {
        report('GHE01_CHECK_RUN_INVALID', 'Check run must be an object.', prefix);
        return;
      }
      checkFields(entry, CHECK_FIELDS, prefix);
      const recordId = requireText(entry, 'recordId', 192, prefix);
      if (recordId !== null && checkRecordIds.has(recordId)) report('GHE01_CHECK_ID_DUPLICATE', 'Provider check record identity is duplicated.', `${prefix}.recordId`);
      if (recordId !== null) checkRecordIds.add(recordId);
      const runId = requireText(entry, 'runId', 192, prefix);
      const attempt = parseAttempt(entry, prefix);
      const contextId = requireText(entry, 'contextId', 192, prefix);
      const displayName = requireText(entry, 'displayName', 512, prefix);
      const checkKind = entry['checkKind'];
      if (typeof checkKind !== 'string' || !CHECK_KINDS.includes(checkKind)) report('GHE01_CHECK_KIND_INVALID', 'checkKind must classify the provider result without changing its source identity.', `${prefix}.checkKind`);
      const headSha = entry['headSha'];
      if (typeof headSha !== 'string' || !SHA40.test(headSha)) report('GHE01_CHECK_SHA_INVALID', 'Check run headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
      const status = parseStatus(entry, 'status', prefix);
      const conclusion = parseConclusion(entry, status, prefix);
      const uri = parseUri(entry, 'sourceUri', prefix);
      if (recordId !== null && !IDENTIFIER.test(recordId)) report('GHE01_RECORD_ID_INVALID', 'recordId is invalid.', `${prefix}.recordId`);
      if (runId !== null && !IDENTIFIER.test(runId)) report('GHE01_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
      if (contextId !== null && !IDENTIFIER.test(contextId)) report('GHE01_CONTEXT_ID_INVALID', 'contextId is invalid.', `${prefix}.contextId`);
      if (recordId !== null && runId !== null && attempt !== null && contextId !== null && displayName !== null && typeof checkKind === 'string' && CHECK_KINDS.includes(checkKind)
        && typeof headSha === 'string' && SHA40.test(headSha) && status !== null && conclusion !== undefined && uri !== null
        && IDENTIFIER.test(recordId) && IDENTIFIER.test(runId) && IDENTIFIER.test(contextId)) {
        checkRuns.push({ recordId, runId, attempt, contextId, displayName, checkKind: checkKind as ProviderCheckKind, headSha, status, conclusion, sourceUri: uri });
      }
    });
    checkRuns.sort((left, right) => compare(left.runId, right.runId)
      || left.attempt - right.attempt || compare(left.recordId, right.recordId)
      || compare(left.contextId, right.contextId) || compare(left.headSha, right.headSha));
  }

  const testExecutionReceiptsInput = input['testExecutionReceipts'] === undefined ? [] : input['testExecutionReceipts'];
  const testExecutionReceipts: ProviderTestExecutionReceipt[] = [];
  const receiptIds = new Set<string>();
  if (!Array.isArray(testExecutionReceiptsInput) || testExecutionReceiptsInput.length > MAX_TEST_EXECUTION_RECEIPTS) {
    report('GHE01_TEST_RECEIPTS_INVALID', `testExecutionReceipts must be an array of at most ${MAX_TEST_EXECUTION_RECEIPTS} records.`, 'testExecutionReceipts');
  } else {
    testExecutionReceiptsInput.forEach((entry, index) => {
      const prefix = `testExecutionReceipts.${index}`;
      if (!isRecord(entry)) {
        report('GHE01_TEST_RECEIPT_INVALID', 'Test execution receipt must be an object.', prefix);
        return;
      }
      checkFields(entry, TEST_RECEIPT_FIELDS, prefix);
      const receiptId = requireText(entry, 'receiptId', 192, prefix);
      if (receiptId !== null && receiptIds.has(receiptId)) {
        report('GHE01_TEST_RECEIPT_ID_DUPLICATE', 'Test execution receipt identity is duplicated.', `${prefix}.receiptId`);
      }
      if (receiptId !== null) receiptIds.add(receiptId);
      const checkRunRecordId = requireText(entry, 'checkRunRecordId', 192, prefix);
      const runId = requireText(entry, 'runId', 192, prefix);
      const attempt = parseAttempt(entry, prefix);
      const headSha = entry['headSha'];
      if (typeof headSha !== 'string' || !SHA40.test(headSha)) {
        report('GHE01_TEST_RECEIPT_SHA_INVALID', 'Test receipt headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
      }
      const testRef = entry['testRef'];
      if (!validTestRef(testRef)) {
        report('GHE01_TEST_RECEIPT_REF_INVALID', 'testRef must identify a bounded WO-002 test case.', `${prefix}.testRef`);
      }
      const outcome = entry['outcome'];
      if (typeof outcome !== 'string' || !['PASSED', 'FAILED', 'SKIPPED', 'NOT_EXECUTED'].includes(outcome)) {
        report('GHE01_TEST_RECEIPT_OUTCOME_INVALID', 'Test receipt outcome is not supported.', `${prefix}.outcome`);
      }
      const reportUri = parseUri(entry, 'reportUri', prefix);
      const reportDigest = requireText(entry, 'reportDigest', 71, prefix);
      if (reportDigest !== null && !SHA256.test(reportDigest)) {
        report('GHE01_TEST_REPORT_DIGEST_INVALID', 'reportDigest must be a SHA-256 digest.', `${prefix}.reportDigest`);
      }
      if (receiptId !== null && !IDENTIFIER.test(receiptId)) report('GHE01_TEST_RECEIPT_ID_INVALID', 'receiptId is invalid.', `${prefix}.receiptId`);
      if (checkRunRecordId !== null && !IDENTIFIER.test(checkRunRecordId)) report('GHE01_TEST_RECEIPT_CHECK_ID_INVALID', 'checkRunRecordId is invalid.', `${prefix}.checkRunRecordId`);
      if (runId !== null && !IDENTIFIER.test(runId)) report('GHE01_TEST_RECEIPT_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
      const checkRun = checkRuns.find((run) => run.recordId === checkRunRecordId);
      if (checkRunRecordId !== null && checkRun === undefined) {
        report('GHE01_TEST_RECEIPT_CHECK_RUN_MISSING', 'Test receipt does not identify a collected check run.', `${prefix}.checkRunRecordId`);
      } else if (checkRun !== undefined) {
        if (checkRun.checkKind !== 'TEST') report('GHE01_TEST_RECEIPT_CHECK_KIND_INVALID', 'Test receipt must bind to a TEST check run.', `${prefix}.checkRunRecordId`);
        if (checkRun.runId !== runId || checkRun.attempt !== attempt) {
          report('GHE01_TEST_RECEIPT_RUN_MISMATCH', 'Test receipt run and attempt must match its check run.', prefix);
        }
        if (reportUri !== null && new URL(reportUri).origin !== new URL(checkRun.sourceUri).origin) {
          report('GHE01_TEST_REPORT_SOURCE_MISMATCH', 'Test report must come from the check run provider origin.', `${prefix}.reportUri`);
        }
      }
      if (receiptId !== null && IDENTIFIER.test(receiptId) && checkRunRecordId !== null && IDENTIFIER.test(checkRunRecordId)
        && runId !== null && IDENTIFIER.test(runId) && attempt !== null && typeof headSha === 'string' && SHA40.test(headSha)
        && validTestRef(testRef) && typeof outcome === 'string' && ['PASSED', 'FAILED', 'SKIPPED', 'NOT_EXECUTED'].includes(outcome)
        && reportUri !== null && reportDigest !== null && SHA256.test(reportDigest) && checkRun !== undefined
        && checkRun.checkKind === 'TEST' && checkRun.runId === runId && checkRun.attempt === attempt
        && new URL(reportUri).origin === new URL(checkRun.sourceUri).origin) {
        testExecutionReceipts.push({
          receiptId,
          checkRunRecordId,
          runId,
          attempt,
          headSha,
          testRef,
          outcome: outcome as ProviderTestExecutionOutcome,
          reportUri,
          reportDigest,
        });
      }
    });
    testExecutionReceipts.sort((left, right) => compare(left.receiptId, right.receiptId));
  }

  const workflowRunsInput = input['workflowRuns'];
  const workflowRuns: ProviderWorkflowRun[] = [];
  if (!Array.isArray(workflowRunsInput) || workflowRunsInput.length > MAX_WORKFLOW_RUNS) {
    report('GHE01_WORKFLOWS_INVALID', `workflowRuns must be an array of at most ${MAX_WORKFLOW_RUNS} records.`, 'workflowRuns');
  } else {
    workflowRunsInput.forEach((entry, index) => {
      const prefix = `workflowRuns.${index}`;
      if (!isRecord(entry)) {
        report('GHE01_WORKFLOW_INVALID', 'Workflow run must be an object.', prefix);
        return;
      }
      checkFields(entry, WORKFLOW_FIELDS, prefix);
      const runId = requireText(entry, 'runId', 192, prefix);
      const attempt = parseAttempt(entry, prefix);
      const headSha = entry['headSha'];
      if (typeof headSha !== 'string' || !SHA40.test(headSha)) report('GHE01_WORKFLOW_SHA_INVALID', 'Workflow headSha must be a full lowercase commit SHA.', `${prefix}.headSha`);
      const status = parseStatus(entry, 'status', prefix);
      const conclusion = parseConclusion(entry, status, prefix);
      const uri = parseUri(entry, 'sourceUri', prefix);
      if (runId !== null && !IDENTIFIER.test(runId)) report('GHE01_RUN_ID_INVALID', 'runId is invalid.', `${prefix}.runId`);
      const jobsInput = entry['jobs'];
      const jobs: ProviderWorkflowJob[] = [];
      const jobIds = new Set<string>();
      if (!Array.isArray(jobsInput) || jobsInput.length > MAX_JOBS_PER_WORKFLOW) {
        report('GHE01_JOBS_INVALID', `Workflow jobs must be an array of at most ${MAX_JOBS_PER_WORKFLOW} records.`, `${prefix}.jobs`);
      } else {
        jobsInput.forEach((job, jobIndex) => {
          const jobPrefix = `${prefix}.jobs.${jobIndex}`;
          if (!isRecord(job)) {
            report('GHE01_JOB_INVALID', 'Workflow job must be an object.', jobPrefix);
            return;
          }
          checkFields(job, JOB_FIELDS, jobPrefix);
          const jobId = requireText(job, 'jobId', 192, jobPrefix);
          if (jobId !== null && jobIds.has(jobId)) report('GHE01_JOB_ID_DUPLICATE', 'Workflow attempt contains a duplicate job identity.', `${jobPrefix}.jobId`);
          if (jobId !== null) jobIds.add(jobId);
          const name = requireText(job, 'name', 512, jobPrefix);
          const jobStatus = parseStatus(job, 'status', jobPrefix);
          const jobConclusion = parseConclusion(job, jobStatus, jobPrefix);
          const jobUri = parseUri(job, 'sourceUri', jobPrefix);
          if (jobId !== null && !IDENTIFIER.test(jobId)) report('GHE01_JOB_ID_INVALID', 'jobId is invalid.', `${jobPrefix}.jobId`);
          if (jobId !== null && name !== null && jobStatus !== null && jobConclusion !== undefined && jobUri !== null && IDENTIFIER.test(jobId)) {
            jobs.push({ jobId, name, status: jobStatus, conclusion: jobConclusion, sourceUri: jobUri });
          }
        });
        jobs.sort((left, right) => compare(left.jobId, right.jobId));
      }
      if (runId !== null && attempt !== null && typeof headSha === 'string' && SHA40.test(headSha)
        && status !== null && conclusion !== undefined && uri !== null && IDENTIFIER.test(runId)) {
        workflowRuns.push({ runId, attempt, headSha, status, conclusion, sourceUri: uri, jobs });
      }
    });
    workflowRuns.sort((left, right) => compare(left.runId, right.runId) || left.attempt - right.attempt || compare(left.headSha, right.headSha));
  }

  if (diagnostics.length > 0 || collectionId === null || providerId === null || sourceUri === null || repository === null
    || pullRequest === null || sourceTrees === null || ruleset === null || workOrderId === null || contextLockDigest === null || !Array.isArray(changedPathsInput)
    || !Array.isArray(fileBlobsInput) || !Array.isArray(testExecutionReceiptsInput)
    || !Array.isArray(requiredContextsInput) || !Array.isArray(checkRunsInput) || !Array.isArray(workflowRunsInput)
    || typeof collectionState !== 'string' || !COLLECTION_STATES.includes(collectionState)) {
    return { ok: false, diagnostics };
  }

  return {
    ok: true,
    value: deepFreeze({
      schemaVersion: PROVIDER_EVIDENCE_SCHEMA_VERSION,
      collectionId,
      providerId,
      collectionState: collectionState as ProviderCollectionState,
      sourceUri,
      repository,
      pullRequest,
      sourceTrees,
      fileBlobs,
      ruleset,
      workOrderId,
      contextLockDigest,
      changedPaths,
      requiredContexts,
      checkRuns,
      testExecutionReceipts,
      workflowRuns,
    }),
  };
}

/** Converts hostile objects that throw during inspection into a bounded diagnostic. */
export function parseProviderEvidenceInput(input: unknown): ProviderEvidenceParseResult {
  try {
    return parseProviderEvidenceInputUnchecked(input);
  } catch {
    return { ok: false, diagnostics: [{ code: 'GHE01_INPUT_UNREADABLE', message: 'Provider evidence could not be safely inspected.' }] };
  }
}
