import type {
  ProviderCheckConclusion,
  ProviderCheckRun,
  ProviderCheckStatus,
  ProviderEvidenceBinding as ContractProviderEvidenceBinding,
  ProviderEvidenceInput,
  ProviderEvidenceParseResult,
  ProviderRequiredContext,
  ProviderTestExecutionReceipt,
  ProviderWorkflowJob,
  ProviderWorkflowRun,
} from '@gef-bootstrap/contracts';
import { isProviderTestExecutionReceipt } from '@gef-bootstrap/contracts';
import type { EvidenceCompletenessGate, OperationOptions, Result } from './types.js';
import { createEvidenceCompletenessGate } from './s04-validation.js';
import { compareCodePoint, deepFreeze, digestValue, fail, Guard, ok, sortedUnique } from './utils.js';
import { inspectProviderTestReportCollection } from './provider-test-report.js';
import type { ProviderTestReportCollection, ProviderTestReportCollectionState } from './provider-test-report.js';

export type ProviderEvidenceVerdict = 'PASS' | 'FAILED' | 'BLOCKED' | 'PENDING' | 'NOT_VERIFIED' | 'UNPROVEN' | 'STALE';
export type ProviderEvidenceCollectionState = 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' | 'DENIED';

export interface NormalizedProviderCheckRun extends ProviderCheckRun {
  readonly selected: boolean;
  readonly verdict: ProviderEvidenceVerdict;
  readonly reasonCodes: readonly string[];
  readonly evidenceRef: string;
}

export interface NormalizedProviderTestExecutionReceipt extends ProviderTestExecutionReceipt {
  readonly contextId: string;
  readonly checkRunRef: string;
  readonly selected: boolean;
  readonly verdict: ProviderEvidenceVerdict;
  readonly reasonCodes: readonly string[];
  readonly evidenceRef: string;
}

export interface NormalizedProviderWorkflowJob extends ProviderWorkflowJob {
  readonly verdict: ProviderEvidenceVerdict;
}

export interface NormalizedProviderWorkflowRun extends Omit<ProviderWorkflowRun, 'jobs'> {
  readonly selected: boolean;
  readonly verdict: ProviderEvidenceVerdict;
  readonly reasonCodes: readonly string[];
  readonly jobs: readonly NormalizedProviderWorkflowJob[];
}

export interface ProviderRequiredContextResult {
  readonly contextId: string;
  readonly displayName: string;
  readonly verdict: ProviderEvidenceVerdict;
  readonly checkRunRefs: readonly string[];
  readonly reasonCodes: readonly string[];
}

export interface NormalizedProviderTestReportCollection {
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
  readonly checkRunRef: string | null;
  readonly reportUri: string | null;
  readonly reportDigest: string | null;
  readonly cases: ProviderTestReportCollection['cases'];
  readonly reasonCodes: readonly string[];
}

export interface ProviderEvidenceBundle {
  readonly schemaVersion: '1.1';
  readonly collectionId: string;
  readonly source: {
    readonly providerId: string;
    readonly collectionState: ProviderEvidenceCollectionState;
    readonly sourceUri: string;
  };
  readonly observedBinding: ContractProviderEvidenceBinding;
  readonly expectedBinding: ContractProviderEvidenceBinding;
  readonly bindingMatches: boolean;
  readonly checkRuns: readonly NormalizedProviderCheckRun[];
  readonly testExecutionReceipts: readonly NormalizedProviderTestExecutionReceipt[];
  readonly testReportCollections: readonly NormalizedProviderTestReportCollection[];
  readonly workflowRuns: readonly NormalizedProviderWorkflowRun[];
  readonly requiredContextResults: readonly ProviderRequiredContextResult[];
  readonly completeness: EvidenceCompletenessGate;
  readonly verdict: ProviderEvidenceVerdict;
  readonly reasonCodes: readonly string[];
  readonly bundleDigest: string;
}

const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const OWNER_OR_REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const COLLECTION_STATES: readonly string[] = ['COMPLETE', 'PARTIAL', 'UNAVAILABLE', 'DENIED'];
const CHECK_STATUSES: readonly string[] = ['QUEUED', 'IN_PROGRESS', 'COMPLETED'];
const CHECK_CONCLUSIONS: readonly (string | null)[] = [
  'SUCCESS', 'FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'NEUTRAL', 'SKIPPED', null,
];
const INPUT_FIELDS = [
  'schemaVersion', 'collectionId', 'providerId', 'collectionState', 'sourceUri', 'repository', 'pullRequest',
  'sourceTrees', 'fileBlobs', 'ruleset', 'workOrderId', 'contextLockDigest', 'changedPaths', 'requiredContexts', 'checkRuns',
  'testExecutionReceipts', 'workflowRuns',
];
const BINDING_FIELDS = [
  'providerId', 'repository', 'pullRequest', 'sourceTrees', 'fileBlobs', 'ruleset', 'workOrderId', 'contextLockDigest', 'changedPaths', 'requiredContexts',
];
const CHECK_FIELDS = [
  'recordId', 'runId', 'attempt', 'contextId', 'displayName', 'checkKind', 'headSha', 'status', 'conclusion', 'sourceUri',
];
const WORKFLOW_FIELDS = ['runId', 'attempt', 'headSha', 'status', 'conclusion', 'sourceUri', 'jobs'];
const JOB_FIELDS = ['jobId', 'name', 'status', 'conclusion', 'sourceUri'];
const VERIFIED_PROVIDER_BUNDLES = new WeakSet<object>();

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function safeText(value: unknown, maxLength = 512): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maxLength
    && value.trim() === value
    && !/[\u0000-\u001f\u007f]/.test(value)
    && !/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+\S+|(?:token|secret|password|authorization)\s*[:=]\s*\S+)/i.test(value);
}

function safeUri(value: unknown): value is string {
  if (!safeText(value, 2048)) return false;
  try {
    const uri = new URL(value);
    return uri.protocol === 'https:' && uri.username.length === 0 && uri.password.length === 0
      && uri.search.length === 0 && uri.hash.length === 0;
  } catch {
    return false;
  }
}

function safePath(value: unknown): value is string {
  if (!safeText(value, 1024) || value.startsWith('/') || value.includes('\\')) return false;
  return value.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function deepFreezeCopy<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreezeCopy(child);
  }
  return value;
}

function validStatus(value: unknown): value is ProviderCheckStatus {
  return typeof value === 'string' && CHECK_STATUSES.includes(value);
}

function validConclusion(value: unknown): value is ProviderCheckConclusion {
  return CHECK_CONCLUSIONS.includes(value as string | null);
}

function validCheckRecord(value: unknown): value is ProviderCheckRun {
  if (!isRecord(value) || !hasOnlyKeys(value, CHECK_FIELDS)) return false;
  return safeText(value['recordId'], 192) && IDENTIFIER.test(value['recordId'])
    && safeText(value['runId'], 192) && IDENTIFIER.test(value['runId'])
    && Number.isSafeInteger(value['attempt']) && (value['attempt'] as number) > 0 && (value['attempt'] as number) <= 1000
    && safeText(value['contextId'], 192) && IDENTIFIER.test(value['contextId'])
    && safeText(value['displayName']) && ['STATUS', 'TEST', 'SECURITY', 'COVERAGE', 'OTHER'].includes(String(value['checkKind']))
    && typeof value['headSha'] === 'string' && SHA40.test(value['headSha'])
    && validStatus(value['status']) && validConclusion(value['conclusion'])
    && (value['status'] === 'COMPLETED' || value['conclusion'] === null)
    && safeUri(value['sourceUri']);
}

function validWorkflowJob(value: unknown): value is ProviderWorkflowJob {
  if (!isRecord(value) || !hasOnlyKeys(value, JOB_FIELDS)) return false;
  return safeText(value['jobId'], 192) && IDENTIFIER.test(value['jobId'])
    && safeText(value['name']) && validStatus(value['status']) && validConclusion(value['conclusion'])
    && (value['status'] === 'COMPLETED' || value['conclusion'] === null)
    && safeUri(value['sourceUri']);
}

function validWorkflowRun(value: unknown): value is ProviderWorkflowRun {
  if (!isRecord(value) || !hasOnlyKeys(value, WORKFLOW_FIELDS) || !Array.isArray(value['jobs']) || value['jobs'].length > 1024) return false;
  return safeText(value['runId'], 192) && IDENTIFIER.test(value['runId'])
    && Number.isSafeInteger(value['attempt']) && (value['attempt'] as number) > 0 && (value['attempt'] as number) <= 1000
    && typeof value['headSha'] === 'string' && SHA40.test(value['headSha'])
    && validStatus(value['status']) && validConclusion(value['conclusion'])
    && (value['status'] === 'COMPLETED' || value['conclusion'] === null)
    && safeUri(value['sourceUri']) && value['jobs'].every(validWorkflowJob);
}

function normalizeBinding(value: unknown): Result<ContractProviderEvidenceBinding> {
  if (!isRecord(value) || !hasOnlyKeys(value, BINDING_FIELDS)) {
    return fail('GHE24_BINDING_INVALID', 'Expected evidence binding has an invalid object shape.');
  }
  const providerId = value['providerId'];
  const repository = value['repository'];
  const pullRequest = value['pullRequest'];
  const sourceTrees = value['sourceTrees'];
  const fileBlobs = value['fileBlobs'];
  const ruleset = value['ruleset'];
  const workOrderId = value['workOrderId'];
  const contextLockDigest = value['contextLockDigest'];
  const changedPaths = value['changedPaths'];
  const requiredContexts = value['requiredContexts'];
  if (!safeText(providerId, 64) || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(providerId)
    || !isRecord(repository) || !hasOnlyKeys(repository, ['owner', 'name'])
    || !safeText(repository['owner'], 100) || !OWNER_OR_REPOSITORY.test(repository['owner'])
    || !safeText(repository['name'], 100) || !OWNER_OR_REPOSITORY.test(repository['name'])
    || !isRecord(pullRequest) || !hasOnlyKeys(pullRequest, ['number', 'baseSha', 'headSha'])
    || !Number.isSafeInteger(pullRequest['number']) || (pullRequest['number'] as number) < 1
    || typeof pullRequest['baseSha'] !== 'string' || !SHA40.test(pullRequest['baseSha'])
    || typeof pullRequest['headSha'] !== 'string' || !SHA40.test(pullRequest['headSha'])
    || !isRecord(sourceTrees) || !hasOnlyKeys(sourceTrees, ['baseTreeSha', 'headTreeSha'])
    || typeof sourceTrees['baseTreeSha'] !== 'string' || !SHA40.test(sourceTrees['baseTreeSha'])
    || typeof sourceTrees['headTreeSha'] !== 'string' || !SHA40.test(sourceTrees['headTreeSha'])
    || !isRecord(ruleset) || !hasOnlyKeys(ruleset, ['rulesetId', 'digest'])
    || !safeText(ruleset['rulesetId'], 192) || !IDENTIFIER.test(ruleset['rulesetId'])
    || !safeText(ruleset['digest'], 71) || !SHA256.test(ruleset['digest'])
    || !safeText(workOrderId, 192) || !IDENTIFIER.test(workOrderId)
    || !safeText(contextLockDigest, 71) || !SHA256.test(contextLockDigest)
    || !Array.isArray(changedPaths) || changedPaths.length === 0 || changedPaths.length > 1024
    || !changedPaths.every(safePath)
    || !Array.isArray(fileBlobs) || fileBlobs.length !== changedPaths.length || !Array.isArray(requiredContexts) || requiredContexts.length === 0 || requiredContexts.length > 256) {
    return fail('GHE24_BINDING_INVALID', 'Expected evidence binding failed strict identity validation.');
  }
  const contexts: ProviderRequiredContext[] = [];
  const seenContexts = new Set<string>();
  for (const context of requiredContexts) {
    if (!isRecord(context) || !hasOnlyKeys(context, ['contextId', 'displayName'])
      || !safeText(context['contextId'], 192) || !IDENTIFIER.test(context['contextId'])
      || !safeText(context['displayName']) || seenContexts.has(context['contextId'])) {
      return fail('GHE24_BINDING_INVALID', 'Expected required context identity is invalid.');
    }
    seenContexts.add(context['contextId']);
    contexts.push({ contextId: context['contextId'], displayName: context['displayName'] });
  }
  const blobs = new Map<string, string>();
  for (const blob of fileBlobs) {
    if (!isRecord(blob) || !hasOnlyKeys(blob, ['path', 'blobSha']) || !safePath(blob['path'])
      || typeof blob['blobSha'] !== 'string' || !SHA40.test(blob['blobSha']) || blobs.has(blob['path'])) {
      return fail('GHE24_BINDING_INVALID', 'Expected file blob identities failed strict validation.');
    }
    blobs.set(blob['path'], blob['blobSha']);
  }
  if (JSON.stringify(sortedUnique([...blobs.keys()])) !== JSON.stringify(sortedUnique(changedPaths as string[]))) {
    return fail('GHE24_BINDING_INVALID', 'Expected file blob paths do not exactly match changed paths.');
  }
  const binding: ContractProviderEvidenceBinding = {
    providerId,
    repository: { owner: repository['owner'], name: repository['name'] },
    pullRequest: {
      number: pullRequest['number'] as number,
      baseSha: pullRequest['baseSha'],
      headSha: pullRequest['headSha'],
    },
    sourceTrees: { baseTreeSha: sourceTrees['baseTreeSha'], headTreeSha: sourceTrees['headTreeSha'] },
    fileBlobs: [...blobs.entries()].map(([path, blobSha]) => ({ path, blobSha })).sort((left, right) => compareCodePoint(left.path, right.path)),
    ruleset: { rulesetId: ruleset['rulesetId'], digest: ruleset['digest'] },
    workOrderId,
    contextLockDigest,
    changedPaths: sortedUnique(changedPaths as string[]),
    requiredContexts: contexts.sort((left, right) => compareCodePoint(left.contextId, right.contextId)),
  };
  return ok(deepFreezeCopy(binding));
}

function validateParsedInput(parsed: ProviderEvidenceParseResult | unknown): Result<ProviderEvidenceInput> {
  if (!isRecord(parsed) || parsed['ok'] !== true || !isRecord(parsed['value'])) {
    if (isRecord(parsed) && parsed['ok'] === false && Array.isArray(parsed['diagnostics'])) {
      return { ok: false, diagnostics: parsed['diagnostics'] as ProviderEvidenceParseResult extends { ok: false; diagnostics: infer D } ? D & readonly { code: string; message: string; subject?: string }[] : never };
    }
    return fail('GHE24_INPUT_NOT_VALIDATED', 'Provider input must come from the strict versioned contract parser.');
  }
  const input = parsed['value'];
  if (Array.isArray(input['testExecutionReceipts']) && input['testExecutionReceipts'].length > 0) {
    return fail('GHE24_TEST_RECEIPTS_UNAUTHENTICATED', 'Untrusted provider input cannot supply test execution receipts.');
  }
  if (!Object.isFrozen(input) || !hasOnlyKeys(input, INPUT_FIELDS)
    || input['schemaVersion'] !== '1.0'
    || !safeText(input['collectionId'], 192) || !IDENTIFIER.test(input['collectionId'])
    || !safeText(input['providerId'], 64) || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(input['providerId'])
    || typeof input['collectionState'] !== 'string' || !COLLECTION_STATES.includes(input['collectionState'])
    || !safeUri(input['sourceUri']) || !Array.isArray(input['checkRuns']) || input['checkRuns'].length > 4096
    || !input['checkRuns'].every(validCheckRecord) || !Array.isArray(input['testExecutionReceipts'])
    || input['testExecutionReceipts'].length > 8192 || !input['testExecutionReceipts'].every(isProviderTestExecutionReceipt)
    || !Array.isArray(input['workflowRuns'])
    || input['workflowRuns'].length > 1024 || !input['workflowRuns'].every(validWorkflowRun)) {
    return fail('GHE24_INPUT_NOT_VALIDATED', 'Provider input failed M24 defensive validation.');
  }
  const inputCheckRuns = input['checkRuns'] as readonly ProviderCheckRun[];
  for (const receipt of input['testExecutionReceipts'] as readonly ProviderTestExecutionReceipt[]) {
    const checkRun = inputCheckRuns.find(({ recordId }) => recordId === receipt.checkRunRecordId);
    if (checkRun === undefined || checkRun.checkKind !== 'TEST' || checkRun.runId !== receipt.runId || checkRun.attempt !== receipt.attempt
      || new URL(checkRun.sourceUri).origin !== new URL(receipt.reportUri).origin) {
      return fail('GHE24_TEST_RECEIPT_UNBOUND', 'Test receipt must bind to an exact TEST check run from the same provider origin.');
    }
  }
  const binding = normalizeBinding({
    providerId: input['providerId'],
    repository: input['repository'],
    pullRequest: input['pullRequest'],
    sourceTrees: input['sourceTrees'],
    fileBlobs: input['fileBlobs'],
    ruleset: input['ruleset'],
    workOrderId: input['workOrderId'],
    contextLockDigest: input['contextLockDigest'],
    changedPaths: input['changedPaths'],
    requiredContexts: input['requiredContexts'],
  });
  if (!binding.ok) return binding;
  const typedInput = input as unknown as ProviderEvidenceInput;
  return ok({ ...typedInput, ...binding.value, repository: binding.value.repository, pullRequest: binding.value.pullRequest });
}

function bindingMismatchReasons(observed: ContractProviderEvidenceBinding, expected: ContractProviderEvidenceBinding): readonly string[] {
  const reasons: string[] = [];
  if (observed.providerId !== expected.providerId) reasons.push('PROVIDER_ID_MISMATCH');
  if (observed.repository.owner !== expected.repository.owner || observed.repository.name !== expected.repository.name) {
    reasons.push('REPOSITORY_IDENTITY_MISMATCH');
  }
  if (observed.pullRequest.number !== expected.pullRequest.number) reasons.push('PULL_REQUEST_NUMBER_MISMATCH');
  if (observed.pullRequest.baseSha !== expected.pullRequest.baseSha) reasons.push('BASE_SHA_MISMATCH');
  if (observed.pullRequest.headSha !== expected.pullRequest.headSha) reasons.push('HEAD_SHA_MISMATCH');
  if (observed.sourceTrees.baseTreeSha !== expected.sourceTrees.baseTreeSha) reasons.push('BASE_TREE_SHA_MISMATCH');
  if (observed.sourceTrees.headTreeSha !== expected.sourceTrees.headTreeSha) reasons.push('HEAD_TREE_SHA_MISMATCH');
  if (JSON.stringify(observed.fileBlobs) !== JSON.stringify(expected.fileBlobs)) reasons.push('FILE_BLOB_IDENTITIES_MISMATCH');
  if (observed.ruleset.rulesetId !== expected.ruleset.rulesetId) reasons.push('RULESET_ID_MISMATCH');
  if (observed.ruleset.digest !== expected.ruleset.digest) reasons.push('RULESET_DIGEST_MISMATCH');
  if (observed.workOrderId !== expected.workOrderId) reasons.push('WORK_ORDER_ID_MISMATCH');
  if (observed.contextLockDigest !== expected.contextLockDigest) reasons.push('CONTEXT_LOCK_DIGEST_MISMATCH');
  if (JSON.stringify(observed.changedPaths) !== JSON.stringify(expected.changedPaths)) reasons.push('CHANGED_PATHS_MISMATCH');
  if (JSON.stringify(observed.requiredContexts.map(({ contextId }) => contextId))
    !== JSON.stringify(expected.requiredContexts.map(({ contextId }) => contextId))) reasons.push('REQUIRED_CONTEXT_SET_MISMATCH');
  return sortedUnique(reasons);
}

function duplicateSignature(run: ProviderCheckRun): string {
  return JSON.stringify([run.contextId, run.displayName, run.headSha, run.status, run.conclusion, run.sourceUri]);
}

function rowVerdict(run: ProviderCheckRun, expectedHead: string, collectionState: ProviderEvidenceCollectionState): { verdict: ProviderEvidenceVerdict; reasons: readonly string[] } {
  if (run.headSha !== expectedHead) return { verdict: 'STALE', reasons: ['CHECK_RUN_HEAD_MISMATCH'] };
  if (collectionState !== 'COMPLETE') {
    const code = collectionState === 'DENIED' ? 'PROVIDER_DENIED'
      : collectionState === 'UNAVAILABLE' ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_COLLECTION_PARTIAL';
    return { verdict: 'NOT_VERIFIED', reasons: [code] };
  }
  if (run.status !== 'COMPLETED') return { verdict: 'PENDING', reasons: ['CHECK_RUN_PENDING'] };
  if (run.conclusion === 'SUCCESS') return { verdict: 'PASS', reasons: [] };
  if (run.conclusion === 'FAILURE' || run.conclusion === 'TIMED_OUT') return { verdict: 'FAILED', reasons: [`CHECK_${run.conclusion}`] };
  if (run.conclusion === 'CANCELLED' || run.conclusion === 'ACTION_REQUIRED' || run.conclusion === 'NEUTRAL' || run.conclusion === 'SKIPPED') {
    return { verdict: 'BLOCKED', reasons: [`CHECK_${run.conclusion}`] };
  }
  return { verdict: 'NOT_VERIFIED', reasons: ['CHECK_CONCLUSION_MISSING'] };
}

function workflowVerdict(run: ProviderWorkflowRun, expectedHead: string, collectionState: ProviderEvidenceCollectionState): { verdict: ProviderEvidenceVerdict; reasons: readonly string[] } {
  if (run.headSha !== expectedHead) return { verdict: 'STALE', reasons: ['WORKFLOW_HEAD_MISMATCH'] };
  if (collectionState !== 'COMPLETE') {
    const code = collectionState === 'DENIED' ? 'PROVIDER_DENIED'
      : collectionState === 'UNAVAILABLE' ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_COLLECTION_PARTIAL';
    return { verdict: 'NOT_VERIFIED', reasons: [code] };
  }
  if (run.status !== 'COMPLETED') return { verdict: 'PENDING', reasons: ['WORKFLOW_PENDING'] };
  if (run.conclusion === 'SUCCESS') return { verdict: 'PASS', reasons: [] };
  if (run.conclusion === 'FAILURE' || run.conclusion === 'TIMED_OUT') return { verdict: 'FAILED', reasons: [`WORKFLOW_${run.conclusion}`] };
  if (run.conclusion === 'CANCELLED' || run.conclusion === 'ACTION_REQUIRED' || run.conclusion === 'NEUTRAL' || run.conclusion === 'SKIPPED') {
    return { verdict: 'BLOCKED', reasons: [`WORKFLOW_${run.conclusion}`] };
  }
  return { verdict: 'NOT_VERIFIED', reasons: ['WORKFLOW_CONCLUSION_MISSING'] };
}

function aggregateVerdict(values: readonly ProviderEvidenceVerdict[], staleBinding: boolean, collectionState: ProviderEvidenceCollectionState): ProviderEvidenceVerdict {
  if (staleBinding || values.includes('STALE')) return 'STALE';
  if (collectionState !== 'COMPLETE') return 'NOT_VERIFIED';
  if (values.includes('FAILED')) return 'FAILED';
  if (values.includes('BLOCKED')) return 'BLOCKED';
  if (values.includes('PENDING')) return 'PENDING';
  if (values.includes('NOT_VERIFIED') || values.includes('UNPROVEN')) return 'NOT_VERIFIED';
  return values.length > 0 && values.every((value) => value === 'PASS') ? 'PASS' : 'NOT_VERIFIED';
}

function normalizeCheckRuns(
  runs: readonly ProviderCheckRun[],
  expectedHead: string,
  collectionState: ProviderEvidenceCollectionState,
  guard: Guard,
): Result<{ readonly rows: readonly NormalizedProviderCheckRun[]; readonly conflictedContexts: readonly string[] }> {
  const groups = new Map<string, ProviderCheckRun[]>();
  for (const run of runs) {
    const stepped = guard.step('provider-check-run');
    if (!stepped.ok) return stepped;
    const key = JSON.stringify([run.runId, run.contextId]);
    const list = groups.get(key) ?? [];
    list.push(run);
    groups.set(key, list);
  }
  const selected = new Set<ProviderCheckRun>();
  const conflictedContexts = new Set<string>();
  const conflictedRows = new Set<ProviderCheckRun>();
  for (const rows of groups.values()) {
    const latestAttempt = Math.max(...rows.map(({ attempt }) => attempt));
    const latest = rows.filter(({ attempt }) => attempt === latestAttempt);
    const signatures = new Set(latest.map(duplicateSignature));
    const latestRecord = latest[0];
    if (latestRecord === undefined) continue;
    if (signatures.size > 1) {
      for (const row of latest) conflictedRows.add(row);
      conflictedContexts.add(latestRecord.contextId);
      continue;
    }
    latest.sort((left, right) => compareCodePoint(left.recordId, right.recordId));
    const chosen = latest[0];
    if (chosen !== undefined) selected.add(chosen);
  }
  const rows: NormalizedProviderCheckRun[] = runs.map((run) => {
    const isSelected = selected.has(run);
    if (conflictedRows.has(run)) {
      return deepFreezeCopy({ ...run, selected: false, verdict: 'NOT_VERIFIED' as const, reasonCodes: ['CHECK_ATTEMPT_CONFLICT'], evidenceRef: `check:${run.runId}:${run.attempt}:${run.recordId}` });
    }
    if (!isSelected) {
      return deepFreezeCopy({ ...run, selected: false, verdict: 'NOT_VERIFIED' as const, reasonCodes: ['SUPERSEDED_CHECK_ATTEMPT'], evidenceRef: `check:${run.runId}:${run.attempt}:${run.recordId}` });
    }
    const result = rowVerdict(run, expectedHead, collectionState);
    return deepFreezeCopy({ ...run, selected: true, verdict: result.verdict, reasonCodes: result.reasons, evidenceRef: `check:${run.runId}:${run.attempt}:${run.recordId}` });
  });
  return ok({ rows, conflictedContexts: sortedUnique([...conflictedContexts]) });
}

export interface ProviderTestExecutionDecision {
  readonly verdict: ProviderEvidenceVerdict;
  readonly reasonCodes: readonly string[];
}

export function deriveProviderTestExecutionDecision(
  receipt: Pick<ProviderTestExecutionReceipt, 'headSha' | 'outcome'>,
  checkRun: Pick<NormalizedProviderCheckRun, 'headSha' | 'selected' | 'verdict' | 'reasonCodes'>,
  expectedHead: string,
): ProviderTestExecutionDecision {
  if (receipt.headSha !== expectedHead || receipt.headSha !== checkRun.headSha) {
    return { verdict: 'STALE', reasonCodes: ['TEST_RECEIPT_HEAD_MISMATCH'] };
  }
  if (!checkRun.selected) return { verdict: 'NOT_VERIFIED', reasonCodes: ['TEST_RECEIPT_CHECK_NOT_SELECTED'] };
  if (checkRun.verdict !== 'PASS') {
    return { verdict: checkRun.verdict, reasonCodes: sortedUnique(['TEST_RECEIPT_CHECK_NOT_PASS', ...checkRun.reasonCodes]) };
  }
  if (receipt.outcome === 'PASSED') return { verdict: 'PASS', reasonCodes: [] };
  if (receipt.outcome === 'FAILED') return { verdict: 'FAILED', reasonCodes: ['TEST_EXECUTION_FAILED'] };
  if (receipt.outcome === 'NOT_EXECUTED') return { verdict: 'NOT_VERIFIED', reasonCodes: ['TEST_EXECUTION_NOT_RUN'] };
  return { verdict: 'NOT_VERIFIED', reasonCodes: ['TEST_EXECUTION_SKIPPED'] };
}

function normalizeTestExecutionReceipts(
  receipts: readonly ProviderTestExecutionReceipt[],
  checkRuns: readonly NormalizedProviderCheckRun[],
  expectedHead: string,
  guard: Guard,
): Result<readonly NormalizedProviderTestExecutionReceipt[]> {
  const byRecordId = new Map(checkRuns.map((run) => [run.recordId, run]));
  const normalized: NormalizedProviderTestExecutionReceipt[] = [];
  for (const receipt of receipts) {
    const stepped = guard.step('provider-test-execution-receipt');
    if (!stepped.ok) return stepped;
    const checkRun = byRecordId.get(receipt.checkRunRecordId);
    if (checkRun === undefined || checkRun.checkKind !== 'TEST' || checkRun.runId !== receipt.runId || checkRun.attempt !== receipt.attempt) {
      return fail('GHE24_TEST_RECEIPT_UNBOUND', 'Test receipt must identify one normalized TEST check attempt.');
    }
    const decision = deriveProviderTestExecutionDecision(receipt, checkRun, expectedHead);
    normalized.push(deepFreezeCopy({
      ...receipt,
      contextId: checkRun.contextId,
      checkRunRef: checkRun.evidenceRef,
      selected: checkRun.selected,
      verdict: decision.verdict,
      reasonCodes: decision.reasonCodes,
      evidenceRef: `test:${receipt.receiptId}:${checkRun.evidenceRef}`,
    }));
  }
  return ok(deepFreezeCopy(normalized));
}

function normalizeTestReportCollections(
  candidates: unknown,
  checkRuns: readonly NormalizedProviderCheckRun[],
  expected: ContractProviderEvidenceBinding,
  guard: Guard,
): Result<{ readonly collections: readonly NormalizedProviderTestReportCollection[]; readonly receipts: readonly ProviderTestExecutionReceipt[] }> {
  if (candidates === undefined) return ok({ collections: [], receipts: [] });
  if (!Array.isArray(candidates) || candidates.length > 1024) {
    return fail('GHE24_TEST_REPORT_COLLECTION_INVALID', 'At most 1024 authenticated test report collections may be supplied.');
  }
  if (candidates.length === 0) return ok({ collections: [], receipts: [] });
  const expectedRepository = `${expected.repository.owner}/${expected.repository.name}`;
  const byRecordId = new Map(checkRuns.map((run) => [run.recordId, run]));
  const collections: NormalizedProviderTestReportCollection[] = [];
  const receipts: ProviderTestExecutionReceipt[] = [];
  for (const candidate of candidates as readonly ProviderTestReportCollection[]) {
    const stepped = guard.step('provider-test-report-collection');
    if (!stepped.ok) return stepped;
    const collection = inspectProviderTestReportCollection(candidate);
    if (collection === null) {
      return fail('GHE24_TEST_REPORT_COLLECTION_UNVERIFIED', 'Test report collection must be an unmodified result of the authenticated GitHub collector.');
    }
    let state = collection.state;
    let reasonCodes = [...collection.reasonCodes];
    let cases = collection.cases;
    let checkRunRef: string | null = null;
    const checkRun = byRecordId.get(collection.checkRunId);
    if (collection.repository.toLowerCase() !== expectedRepository.toLowerCase()) {
      state = 'INVALID';
      reasonCodes = ['GITHUB_TEST_REPORT_REPOSITORY_MISMATCH'];
      cases = [];
    } else if (checkRun === undefined || checkRun.checkKind !== 'TEST') {
      state = 'INVALID';
      reasonCodes = ['GITHUB_TEST_REPORT_CHECK_UNBOUND'];
      cases = [];
    } else {
      checkRunRef = checkRun.evidenceRef;
      if (checkRun.runId !== collection.runId || checkRun.attempt !== collection.attempt) {
        state = 'INVALID';
        reasonCodes = ['GITHUB_TEST_REPORT_RUN_MISMATCH'];
        cases = [];
      } else if (collection.state === 'VERIFIED'
        && (collection.headSha !== expected.pullRequest.headSha || collection.headSha !== checkRun.headSha)) {
        state = 'STALE';
        reasonCodes = ['GITHUB_TEST_REPORT_HEAD_MISMATCH'];
        cases = [];
      } else if (collection.state === 'VERIFIED' && !checkRun.selected) {
        state = 'STALE';
        reasonCodes = ['GITHUB_TEST_REPORT_SUPERSEDED_CHECK'];
        cases = [];
      } else if (collection.state === 'VERIFIED'
        && (checkRun.displayName !== collection.checkName || checkRun.status !== collection.checkStatus
          || checkRun.conclusion !== collection.checkConclusion)) {
        state = 'INVALID';
        reasonCodes = ['GITHUB_TEST_REPORT_CHECK_RESULT_MISMATCH'];
        cases = [];
      } else if (collection.state === 'VERIFIED' && (checkRun.status !== 'COMPLETED' || checkRun.conclusion !== 'SUCCESS')) {
        state = 'INVALID';
        reasonCodes = ['GITHUB_TEST_REPORT_CHECK_RESULT_MISMATCH'];
        cases = [];
      } else if (collection.state === 'VERIFIED'
        && (collection.reportUri === null || collection.reportDigest === null || collection.jobId === null)) {
        state = 'INVALID';
        reasonCodes = ['GITHUB_TEST_REPORT_IDENTITY_INCOMPLETE'];
        cases = [];
      } else if (collection.state === 'VERIFIED') {
        const reportUri = collection.reportUri;
        const reportDigest = collection.reportDigest;
        const checkUri = checkRun.sourceUri;
        if (reportUri === null || reportDigest === null || new URL(reportUri).origin !== new URL(checkUri).origin) {
          state = 'INVALID';
          reasonCodes = ['GITHUB_TEST_REPORT_SOURCE_MISMATCH'];
          cases = [];
        } else {
          const collectionReceipts: ProviderTestExecutionReceipt[] = [];
          for (const [index, testCase] of cases.entries()) {
            if (!isProviderTestExecutionReceipt({
              receiptId: `test-report:${collection.checkRunId}:${index + 1}`,
              checkRunRecordId: collection.checkRunId,
              runId: collection.runId,
              attempt: collection.attempt,
              headSha: collection.headSha,
              testRef: testCase.testRef,
              outcome: testCase.outcome,
              reportUri,
              reportDigest,
            })) {
              state = 'INVALID';
              reasonCodes = ['GITHUB_TEST_REPORT_CASE_INVALID'];
              cases = [];
              break;
            }
            collectionReceipts.push({
              receiptId: `test-report:${collection.checkRunId}:${index + 1}`,
              checkRunRecordId: collection.checkRunId,
              runId: collection.runId,
              attempt: collection.attempt,
              headSha: collection.headSha,
              testRef: testCase.testRef,
              outcome: testCase.outcome,
              reportUri,
              reportDigest,
            });
          }
          if (state === 'VERIFIED') receipts.push(...collectionReceipts);
        }
      }
    }
    collections.push(deepFreezeCopy({
      state,
      repository: collection.repository,
      runId: collection.runId,
      attempt: collection.attempt,
      headSha: collection.headSha,
      checkRunId: collection.checkRunId,
      checkName: collection.checkName,
      checkStatus: collection.checkStatus,
      checkConclusion: collection.checkConclusion,
      jobId: collection.jobId,
      checkRunRef,
      reportUri: state === 'VERIFIED' ? collection.reportUri : null,
      reportDigest: state === 'VERIFIED' ? collection.reportDigest : null,
      cases: state === 'VERIFIED' ? cases : [],
      reasonCodes: sortedUnique(reasonCodes),
    }));
  }
  return ok({ collections: deepFreezeCopy(collections), receipts: deepFreezeCopy(receipts) });
}

function normalizeWorkflows(
  runs: readonly ProviderWorkflowRun[],
  expectedHead: string,
  collectionState: ProviderEvidenceCollectionState,
  guard: Guard,
): Result<{ readonly rows: readonly NormalizedProviderWorkflowRun[]; readonly hasConflict: boolean }> {
  const groups = new Map<string, ProviderWorkflowRun[]>();
  for (const run of runs) {
    const stepped = guard.step('provider-workflow-run');
    if (!stepped.ok) return stepped;
    const list = groups.get(run.runId) ?? [];
    list.push(run);
    groups.set(run.runId, list);
  }
  const selected = new Set<ProviderWorkflowRun>();
  const conflicted = new Set<ProviderWorkflowRun>();
  for (const rows of groups.values()) {
    const latestAttempt = Math.max(...rows.map(({ attempt }) => attempt));
    const latest = rows.filter(({ attempt }) => attempt === latestAttempt);
    const signatures = new Set(latest.map((run) => JSON.stringify([
      run.headSha, run.status, run.conclusion, run.sourceUri,
      run.jobs.map((job) => [job.jobId, job.name, job.status, job.conclusion, job.sourceUri]),
    ])));
    const latestRun = latest[0];
    if (latestRun === undefined) continue;
    if (signatures.size > 1) {
      for (const run of latest) conflicted.add(run);
      continue;
    }
    latest.sort((left, right) => compareCodePoint(left.sourceUri, right.sourceUri));
    const chosen = latest[0];
    if (chosen !== undefined) selected.add(chosen);
  }
  const rows = runs.map((run) => {
    const isSelected = selected.has(run);
    const conflict = conflicted.has(run);
    const result = conflict
      ? { verdict: 'NOT_VERIFIED' as const, reasons: ['WORKFLOW_ATTEMPT_CONFLICT'] }
      : !isSelected
        ? { verdict: 'NOT_VERIFIED' as const, reasons: ['SUPERSEDED_WORKFLOW_ATTEMPT'] }
        : workflowVerdict(run, expectedHead, collectionState);
    const jobs = run.jobs.map((job) => {
      const jobVerdict = collectionState !== 'COMPLETE' ? 'NOT_VERIFIED'
        : result.verdict === 'STALE' || result.verdict === 'NOT_VERIFIED' ? result.verdict
          : job.status !== 'COMPLETED' ? 'PENDING'
            : job.conclusion === 'SUCCESS' ? 'PASS'
              : job.conclusion === 'FAILURE' || job.conclusion === 'TIMED_OUT' ? 'FAILED'
                : job.conclusion === null ? 'NOT_VERIFIED' : 'BLOCKED';
      return deepFreezeCopy({ ...job, verdict: jobVerdict as ProviderEvidenceVerdict });
    });
    return deepFreezeCopy({ ...run, selected: isSelected, verdict: result.verdict, reasonCodes: result.reasons, jobs });
  });
  return ok({ rows, hasConflict: conflicted.size > 0 });
}

function contextResults(
  required: readonly ProviderRequiredContext[],
  checks: readonly NormalizedProviderCheckRun[],
  conflictContexts: readonly string[],
  sourceState: ProviderEvidenceCollectionState,
): readonly ProviderRequiredContextResult[] {
  return required.map((context) => {
    const candidates = checks.filter((check) => check.contextId === context.contextId && check.selected);
    if (sourceState !== 'COMPLETE') {
      const reason = sourceState === 'DENIED' ? 'PROVIDER_DENIED'
        : sourceState === 'UNAVAILABLE' ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_COLLECTION_PARTIAL';
      return deepFreezeCopy({ contextId: context.contextId, displayName: context.displayName, verdict: 'NOT_VERIFIED' as const, checkRunRefs: [], reasonCodes: [reason] });
    }
    if (conflictContexts.includes(context.contextId)) {
      return deepFreezeCopy({ contextId: context.contextId, displayName: context.displayName, verdict: 'NOT_VERIFIED' as const, checkRunRefs: [], reasonCodes: ['CHECK_ATTEMPT_CONFLICT'] });
    }
    if (candidates.length > 1) {
      return deepFreezeCopy({ contextId: context.contextId, displayName: context.displayName, verdict: 'NOT_VERIFIED' as const, checkRunRefs: candidates.map(({ evidenceRef }) => evidenceRef).sort(compareCodePoint), reasonCodes: ['REQUIRED_CONTEXT_AMBIGUOUS'] });
    }
    if (candidates.length === 0) {
      return deepFreezeCopy({ contextId: context.contextId, displayName: context.displayName, verdict: 'NOT_VERIFIED' as const, checkRunRefs: [], reasonCodes: ['REQUIRED_CONTEXT_MISSING'] });
    }
    const candidate = candidates[0];
    if (candidate === undefined) {
      return deepFreezeCopy({ contextId: context.contextId, displayName: context.displayName, verdict: 'NOT_VERIFIED' as const, checkRunRefs: [], reasonCodes: ['REQUIRED_CONTEXT_MISSING'] });
    }
    return deepFreezeCopy({
      contextId: context.contextId,
      displayName: context.displayName,
      verdict: candidate.verdict,
      checkRunRefs: [candidate.evidenceRef],
      reasonCodes: candidate.reasonCodes,
    });
  });
}

function bindingFromInput(input: ProviderEvidenceInput): ContractProviderEvidenceBinding {
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
  };
}

/** Normalizes sanitized provider facts against an independently compiled current binding. */
export function createProviderEvidenceBundle(
  parsedInput: ProviderEvidenceParseResult | unknown,
  expectedBindingInput: ContractProviderEvidenceBinding,
  options: OperationOptions,
  testReportCollections?: readonly ProviderTestReportCollection[],
): Result<ProviderEvidenceBundle> {
  const parsed = validateParsedInput(parsedInput);
  if (!parsed.ok) return parsed;
  const expectedResult = normalizeBinding(expectedBindingInput);
  if (!expectedResult.ok) return expectedResult;
  const input = parsed.value;
  const observedBinding = deepFreezeCopy(bindingFromInput(input));
  const expectedBinding = expectedResult.value;
  const bindingReasons = bindingMismatchReasons(observedBinding, expectedBinding);
  const guard = new Guard(options);
  const checkResult = normalizeCheckRuns(input.checkRuns, expectedBinding.pullRequest.headSha, input.collectionState, guard);
  if (!checkResult.ok) return checkResult;
  const testReportResult = normalizeTestReportCollections(
    testReportCollections,
    checkResult.value.rows,
    expectedBinding,
    guard,
  );
  if (!testReportResult.ok) return testReportResult;
  const testReceiptResult = normalizeTestExecutionReceipts(
    testReportResult.value.receipts,
    checkResult.value.rows,
    expectedBinding.pullRequest.headSha,
    guard,
  );
  if (!testReceiptResult.ok) return testReceiptResult;
  const workflowResult = normalizeWorkflows(input.workflowRuns, expectedBinding.pullRequest.headSha, input.collectionState, guard);
  if (!workflowResult.ok) return workflowResult;
  const requiredContextResults = contextResults(
    expectedBinding.requiredContexts,
    checkResult.value.rows,
    checkResult.value.conflictedContexts,
    input.collectionState,
  );
  const observedIds = sortedUnique(input.checkRuns
    .map(({ contextId }) => contextId)
    .filter((contextId) => expectedBinding.requiredContexts.some((required) => required.contextId === contextId)));
  const completeness = createEvidenceCompletenessGate(
    expectedBinding.requiredContexts.map(({ contextId }) => contextId),
    observedIds,
    input.collectionState === 'PARTIAL',
    checkResult.value.conflictedContexts.length > 0 || workflowResult.value.hasConflict,
    input.collectionState !== 'COMPLETE',
    options,
  );
  if (!completeness.ok) return completeness;
  const contextVerdicts = requiredContextResults.map(({ verdict }) => verdict);
  const verdict = aggregateVerdict(contextVerdicts, bindingReasons.length > 0, input.collectionState);
  const stateReason = input.collectionState === 'DENIED' ? ['PROVIDER_DENIED']
    : input.collectionState === 'UNAVAILABLE' ? ['PROVIDER_UNAVAILABLE']
      : input.collectionState === 'PARTIAL' ? ['PROVIDER_COLLECTION_PARTIAL'] : [];
  const workflowConflictReasons = workflowResult.value.hasConflict ? ['WORKFLOW_ATTEMPT_CONFLICT'] : [];
  const body = deepFreezeCopy({
    schemaVersion: '1.1' as const,
    collectionId: input.collectionId,
    source: { providerId: input.providerId, collectionState: input.collectionState, sourceUri: input.sourceUri },
    observedBinding,
    expectedBinding,
    bindingMatches: bindingReasons.length === 0,
    checkRuns: checkResult.value.rows,
    testExecutionReceipts: testReceiptResult.value,
    testReportCollections: testReportResult.value.collections,
    workflowRuns: workflowResult.value.rows,
    requiredContextResults,
    completeness: completeness.value,
    verdict,
    reasonCodes: sortedUnique([
      ...bindingReasons,
      ...stateReason,
      ...requiredContextResults.flatMap(({ reasonCodes }) => reasonCodes),
      ...workflowConflictReasons,
    ]),
  });
  const digest = digestValue(options, 'WOB2:PROVIDER_EVIDENCE_BUNDLE', body);
  if (!digest.ok) return digest;
  const bundle = deepFreezeCopy({ ...body, bundleDigest: digest.value });
  VERIFIED_PROVIDER_BUNDLES.add(bundle);
  return ok(bundle);
}

/** Checks the tamper-evident bundle digest. The boolean result never grants acceptance authority. */
export function verifyProviderEvidenceBundle(bundle: unknown, options: OperationOptions): Result<boolean> {
  if (bundle === null || typeof bundle !== 'object' || !VERIFIED_PROVIDER_BUNDLES.has(bundle)
    || !isRecord(bundle) || typeof bundle['bundleDigest'] !== 'string' || !SHA256.test(bundle['bundleDigest'])) return ok(false);
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(bundle)) {
    if (key !== 'bundleDigest') body[key] = bundle[key];
  }
  const recomputed = digestValue(options, 'WOB2:PROVIDER_EVIDENCE_BUNDLE', body);
  if (!recomputed.ok) return recomputed;
  return ok(recomputed.value === bundle['bundleDigest']);
}
