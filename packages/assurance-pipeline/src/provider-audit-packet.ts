import type { NormalizedProviderTestExecutionReceipt, ProviderEvidenceBundle, ProviderEvidenceVerdict } from '@gef-bootstrap/evidence-engine';
import { deriveProviderTestExecutionDecision, verifyProviderEvidenceBundle } from '@gef-bootstrap/evidence-engine';
import type { ProviderCheckKind, ProviderEvidenceBinding, ProviderTestExecutionOutcome } from '@gef-bootstrap/contracts';
import { isProviderTestRef } from '@gef-bootstrap/contracts';
import type { OperationOptions, Result } from './types.js';
import { deepFreeze, digestValue, fail, ok, sortedUnique } from './utils.js';

export type AuditPacketVerdict = ProviderEvidenceVerdict;
export interface AuditRulesetBinding {
  readonly rulesetId: string;
  readonly digest: string;
}
export interface ProviderAuditBinding {
  readonly provider: ProviderEvidenceBinding;
  readonly ruleset: AuditRulesetBinding;
}
export interface AcceptanceProofMapping {
  readonly criterionId: string;
  readonly testRefs: readonly string[];
  readonly checkRunRefs: readonly string[];
}
export interface OptionalReviewTool {
  readonly toolId: string;
  readonly state: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_RUN';
}
export type SpecialistReviewState = 'NOT_REQUIRED' | 'UNAVAILABLE' | 'NOT_VERIFIED';
export interface ProviderAuditPacketInput {
  readonly evidenceBundle: ProviderEvidenceBundle;
  readonly candidateBinding: ProviderAuditBinding;
  readonly currentBinding: ProviderAuditBinding;
  readonly actualChangedPaths: readonly string[];
  readonly authorizationReceiptUri: string;
  readonly acceptanceMappings: readonly AcceptanceProofMapping[];
  readonly unresolvedRiskIds: readonly string[];
  readonly optionalReviewTools: readonly OptionalReviewTool[];
  readonly specialistReviewRequired: boolean;
  readonly specialistReviewState: SpecialistReviewState;
  readonly checkpointDeltaStatus: 'PROPOSED_ONLY';
  /** Accepted as an untrusted compatibility field and intentionally excluded from verdicts/output. */
  readonly executorClaims?: readonly string[];
}
export interface AcceptanceProofResult {
  readonly criterionId: string;
  readonly testRefs: readonly string[];
  readonly checkRunRefs: readonly string[];
  readonly providerEvidence: readonly ProviderCheckProofRecord[];
  readonly testEvidence: readonly ProviderTestProofRecord[];
  readonly verdict: AuditPacketVerdict;
  readonly reasonCodes: readonly string[];
}
export interface ProviderCheckProofRecord {
  readonly evidenceRef: string;
  readonly sourceUri: string;
  readonly runId: string;
  readonly attempt: number;
  readonly contextId: string;
  readonly checkKind: ProviderCheckKind;
  readonly headSha: string;
  readonly conclusion: string | null;
  readonly verdict: AuditPacketVerdict;
}
export interface ProviderTestProofRecord {
  readonly evidenceRef: string;
  readonly checkRunRef: string;
  readonly testRef: string;
  readonly runId: string;
  readonly attempt: number;
  readonly contextId: string;
  readonly headSha: string;
  readonly outcome: ProviderTestExecutionOutcome;
  readonly reportUri: string;
  readonly reportDigest: string;
  readonly verdict: AuditPacketVerdict;
  readonly reasonCodes: readonly string[];
}
export interface ProviderAuditPacket {
  readonly schemaVersion: '1.0';
  readonly workOrderId: 'GBS-MOD-WO-002';
  readonly candidateBinding: ProviderAuditBinding;
  readonly currentBinding: ProviderAuditBinding;
  readonly bindingCurrent: boolean;
  readonly actualChangedPaths: readonly string[];
  readonly authorizationReceiptUri: string;
  readonly scopeViolations: readonly string[];
  readonly evidenceBundleDigest: string;
  readonly acceptanceProofs: readonly AcceptanceProofResult[];
  readonly unresolvedRiskIds: readonly string[];
  readonly optionalReviewTools: readonly OptionalReviewTool[];
  readonly specialistReviewRequired: boolean;
  readonly specialistReviewState: SpecialistReviewState;
  readonly ownerAudit: 'NOT_INDEPENDENT';
  readonly checkpointDeltaStatus: 'PROPOSED_ONLY';
  readonly mayApprove: false;
  readonly mayMerge: false;
  readonly mayPromoteCheckpoint: false;
  readonly verdict: AuditPacketVerdict;
  readonly reasonCodes: readonly string[];
  readonly packetDigest: string;
}
export interface ProviderAuditPacketValidation {
  readonly state: 'CURRENT' | 'STALE' | 'INVALID';
  readonly reasonCodes: readonly string[];
  readonly observedPacketDigest: string | null;
  readonly expectedPacketDigest: string | null;
}

const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const SIMPLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const OWNER_REPOSITORY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const AUTHORIZATION_RECEIPT_URI = 'https://github.com/KayzenRoot/gef-bootstrap/pull/460#issuecomment-6168359370';
const CRITERIA = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'] as const;
const BINDING_KEYS = ['providerId', 'repository', 'pullRequest', 'sourceTrees', 'fileBlobs', 'ruleset', 'workOrderId', 'contextLockDigest', 'changedPaths', 'requiredContexts'];
const VERDICT_PRECEDENCE: readonly AuditPacketVerdict[] = ['STALE', 'FAILED', 'BLOCKED', 'PENDING', 'NOT_VERIFIED', 'UNPROVEN', 'PASS'];
const PACKET_INPUT_FIELDS = [
  'evidenceBundle', 'candidateBinding', 'currentBinding', 'actualChangedPaths', 'authorizationReceiptUri', 'acceptanceMappings', 'unresolvedRiskIds',
  'optionalReviewTools', 'specialistReviewRequired', 'specialistReviewState', 'checkpointDeltaStatus', 'executorClaims',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function safeText(value: unknown, max = 512): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value
    && !/[\u0000-\u001f\u007f]/.test(value)
    && !/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+\S+|(?:token|secret|password|authorization)\s*[:=]\s*\S+)/i.test(value);
}
function safePath(path: unknown): path is string {
  return safeText(path, 1024) && !path.startsWith('/') && !path.includes('\\')
    && path.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
}
function safePublicUri(value: unknown): value is string {
  if (!safeText(value, 2048)) return false;
  try {
    const uri = new URL(value);
    return uri.protocol === 'https:' && uri.username.length === 0 && uri.password.length === 0
      && uri.search.length === 0 && uri.hash.length === 0;
  } catch {
    return false;
  }
}
function compareBinding(left: ProviderEvidenceBinding, right: ProviderEvidenceBinding): readonly string[] {
  const reasons: string[] = [];
  if (left.providerId !== right.providerId) reasons.push('PROVIDER_ID_MISMATCH');
  if (left.repository.owner !== right.repository.owner || left.repository.name !== right.repository.name) reasons.push('REPOSITORY_IDENTITY_MISMATCH');
  if (left.pullRequest.number !== right.pullRequest.number) reasons.push('PULL_REQUEST_NUMBER_MISMATCH');
  if (left.pullRequest.baseSha !== right.pullRequest.baseSha) reasons.push('BASE_SHA_MISMATCH');
  if (left.pullRequest.headSha !== right.pullRequest.headSha) reasons.push('HEAD_SHA_MISMATCH');
  if (left.sourceTrees.baseTreeSha !== right.sourceTrees.baseTreeSha) reasons.push('BASE_TREE_SHA_MISMATCH');
  if (left.sourceTrees.headTreeSha !== right.sourceTrees.headTreeSha) reasons.push('HEAD_TREE_SHA_MISMATCH');
  if (JSON.stringify([...left.fileBlobs].sort((a, b) => a.path < b.path ? -1 : 1))
    !== JSON.stringify([...right.fileBlobs].sort((a, b) => a.path < b.path ? -1 : 1))) reasons.push('FILE_BLOB_IDENTITIES_MISMATCH');
  if (left.ruleset.rulesetId !== right.ruleset.rulesetId) reasons.push('RULESET_ID_MISMATCH');
  if (left.ruleset.digest !== right.ruleset.digest) reasons.push('RULESET_DIGEST_MISMATCH');
  if (left.workOrderId !== right.workOrderId) reasons.push('WORK_ORDER_ID_MISMATCH');
  if (left.contextLockDigest !== right.contextLockDigest) reasons.push('CONTEXT_LOCK_DIGEST_MISMATCH');
  const comparePaths = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  if (JSON.stringify([...left.changedPaths].sort(comparePaths))
    !== JSON.stringify([...right.changedPaths].sort(comparePaths))) reasons.push('CHANGED_PATHS_MISMATCH');
  if (JSON.stringify(left.requiredContexts.map(({ contextId }) => contextId).sort())
    !== JSON.stringify(right.requiredContexts.map(({ contextId }) => contextId).sort())) reasons.push('REQUIRED_CONTEXTS_MISMATCH');
  return sortedUnique(reasons);
}
function compareAuditBinding(left: ProviderAuditBinding, right: ProviderAuditBinding): readonly string[] {
  const reasons = [...compareBinding(left.provider, right.provider)];
  if (left.ruleset.rulesetId !== right.ruleset.rulesetId) reasons.push('RULESET_ID_MISMATCH');
  if (left.ruleset.digest !== right.ruleset.digest) reasons.push('RULESET_DIGEST_MISMATCH');
  return sortedUnique(reasons);
}
function cloneAuditBinding(value: ProviderAuditBinding): ProviderAuditBinding {
  return {
    provider: {
      ...value.provider,
      repository: { ...value.provider.repository },
      pullRequest: { ...value.provider.pullRequest },
      sourceTrees: { ...value.provider.sourceTrees },
      fileBlobs: value.provider.fileBlobs.map((blob) => ({ ...blob })),
      ruleset: { ...value.provider.ruleset },
      changedPaths: [...value.provider.changedPaths],
      requiredContexts: value.provider.requiredContexts.map((context) => ({ ...context })),
    },
    ruleset: { ...value.ruleset },
  };
}
function isAllowedPath(path: string): boolean {
  return path.startsWith('packages/evidence-engine/src/')
    || path.startsWith('packages/assurance-pipeline/src/')
    || path.startsWith('packages/contracts/src/')
    || /^tests\/gbs-mod-wo-002-[A-Za-z0-9._-]+\.test\.mjs$/.test(path)
    || /^\.engineering\/(?:evidence|checkpoint-deltas)\/GBS-MOD-WO-002-[^/]+$/.test(path);
}
function validBinding(value: unknown): value is ProviderAuditBinding {
  if (!isRecord(value) || !isRecord(value['provider']) || !isRecord(value['ruleset'])) return false;
  const provider = value['provider'];
  const repository = provider['repository'];
  const pullRequest = provider['pullRequest'];
  const sourceTrees = provider['sourceTrees'];
  const fileBlobs = provider['fileBlobs'];
  const providerRuleset = provider['ruleset'];
  const contexts = provider['requiredContexts'];
  const paths = provider['changedPaths'];
  const ruleset = value['ruleset'];
  return Object.keys(value).every((key) => key === 'provider' || key === 'ruleset')
    && Object.keys(provider).every((key) => BINDING_KEYS.includes(key))
    && Object.keys(ruleset).every((key) => key === 'rulesetId' || key === 'digest')
    && safeText(provider['providerId'], 64)
    && /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(String(provider['providerId']))
    && isRecord(repository) && safeText(repository['owner'], 100) && OWNER_REPOSITORY.test(repository['owner'])
    && safeText(repository['name'], 100) && OWNER_REPOSITORY.test(repository['name'])
    && isRecord(pullRequest) && Number.isSafeInteger(pullRequest['number']) && (pullRequest['number'] as number) > 0
    && typeof pullRequest['baseSha'] === 'string' && SHA40.test(pullRequest['baseSha'])
    && typeof pullRequest['headSha'] === 'string' && SHA40.test(pullRequest['headSha'])
    && isRecord(sourceTrees) && Object.keys(sourceTrees).every((key) => key === 'baseTreeSha' || key === 'headTreeSha')
    && typeof sourceTrees['baseTreeSha'] === 'string' && SHA40.test(sourceTrees['baseTreeSha'])
    && typeof sourceTrees['headTreeSha'] === 'string' && SHA40.test(sourceTrees['headTreeSha'])
    && provider['workOrderId'] === 'GBS-MOD-WO-002'
    && typeof provider['contextLockDigest'] === 'string' && SHA256.test(provider['contextLockDigest'])
    && Array.isArray(paths) && paths.length > 0 && paths.length <= 1024 && paths.every(safePath)
    && new Set(paths).size === paths.length
    && Array.isArray(contexts) && contexts.length > 0 && contexts.length <= 256
    && contexts.every((context) => isRecord(context) && safeText(context['contextId'], 192)
      && SIMPLE_ID.test(context['contextId']) && safeText(context['displayName']))
    && new Set(contexts.map((context) => (context as { contextId: string }).contextId)).size === contexts.length
    && Array.isArray(fileBlobs) && fileBlobs.length === paths.length
    && fileBlobs.every((blob) => isRecord(blob) && Object.keys(blob).every((key) => key === 'path' || key === 'blobSha')
      && safePath(blob['path']) && typeof blob['blobSha'] === 'string' && SHA40.test(blob['blobSha']))
    && new Set(fileBlobs.map((blob) => (blob as { path: string }).path)).size === fileBlobs.length
    && JSON.stringify([...fileBlobs].map((blob) => (blob as { path: string }).path).sort())
      === JSON.stringify([...paths].sort())
    && isRecord(providerRuleset) && Object.keys(providerRuleset).every((key) => key === 'rulesetId' || key === 'digest')
    && safeText(providerRuleset['rulesetId'], 192) && SIMPLE_ID.test(providerRuleset['rulesetId'])
    && typeof providerRuleset['digest'] === 'string' && SHA256.test(providerRuleset['digest'])
    && safeText(ruleset['rulesetId'], 192) && SIMPLE_ID.test(ruleset['rulesetId'])
    && typeof ruleset['digest'] === 'string' && SHA256.test(ruleset['digest'])
    && providerRuleset['rulesetId'] === ruleset['rulesetId'] && providerRuleset['digest'] === ruleset['digest'];
}
function validEvidenceBundle(bundle: unknown): bundle is ProviderEvidenceBundle {
  return isRecord(bundle) && bundle['schemaVersion'] === '1.0' && typeof bundle['bundleDigest'] === 'string'
    && SHA256.test(bundle['bundleDigest']) && isRecord(bundle['expectedBinding'])
    && isRecord(bundle['expectedBinding']['pullRequest']) && typeof bundle['expectedBinding']['pullRequest']['headSha'] === 'string'
    && SHA40.test(bundle['expectedBinding']['pullRequest']['headSha'])
    && Array.isArray(bundle['expectedBinding']['requiredContexts'])
    && isRecord(bundle['source'])
    && ['COMPLETE', 'PARTIAL', 'UNAVAILABLE', 'DENIED'].includes(String(bundle['source']['collectionState']))
    && Array.isArray(bundle['checkRuns']) && bundle['checkRuns'].every((run) => isRecord(run)
      && safeText(run['evidenceRef'], 512) && safeText(run['contextId'], 192)
      && safePublicUri(run['sourceUri']) && safeText(run['runId'], 192)
      && Number.isSafeInteger(run['attempt']) && (run['attempt'] as number) > 0
      && ['STATUS', 'TEST', 'SECURITY', 'COVERAGE', 'OTHER'].includes(String(run['checkKind']))
      && typeof run['headSha'] === 'string' && SHA40.test(run['headSha'])
      && typeof run['selected'] === 'boolean'
      && ['PASS', 'FAILED', 'BLOCKED', 'PENDING', 'NOT_VERIFIED', 'UNPROVEN', 'STALE'].includes(String(run['verdict'])))
    && Array.isArray(bundle['testExecutionReceipts']) && bundle['testExecutionReceipts'].every((receipt) => {
      if (!isRecord(receipt) || !Array.isArray(bundle['checkRuns'])) return false;
      const checkRun = bundle['checkRuns'].find((run) => isRecord(run) && run['evidenceRef'] === receipt['checkRunRef']);
      return safeText(receipt['receiptId'], 192) && safeText(receipt['checkRunRecordId'], 192)
        && safeText(receipt['evidenceRef'], 512) && safeText(receipt['checkRunRef'], 512)
        && safeText(receipt['runId'], 192) && Number.isSafeInteger(receipt['attempt']) && (receipt['attempt'] as number) > 0
        && safeText(receipt['contextId'], 192) && typeof receipt['headSha'] === 'string' && SHA40.test(receipt['headSha'])
        && isProviderTestRef(receipt['testRef']) && ['PASSED', 'FAILED', 'SKIPPED', 'NOT_EXECUTED'].includes(String(receipt['outcome']))
        && safePublicUri(receipt['reportUri']) && typeof receipt['reportDigest'] === 'string' && SHA256.test(receipt['reportDigest'])
        && typeof receipt['selected'] === 'boolean'
        && ['PASS', 'FAILED', 'BLOCKED', 'PENDING', 'NOT_VERIFIED', 'UNPROVEN', 'STALE'].includes(String(receipt['verdict']))
        && Array.isArray(receipt['reasonCodes']) && receipt['reasonCodes'].every((reason) => safeText(reason, 192))
        && isRecord(checkRun) && checkRun['checkKind'] === 'TEST' && checkRun['recordId'] === receipt['checkRunRecordId']
        && checkRun['runId'] === receipt['runId'] && checkRun['attempt'] === receipt['attempt']
        && checkRun['contextId'] === receipt['contextId'] && checkRun['selected'] === receipt['selected']
        && new URL(receipt['reportUri'] as string).origin === new URL(checkRun['sourceUri'] as string).origin;
    })
    && Array.isArray(bundle['requiredContextResults']) && bundle['requiredContextResults'].every((context) => isRecord(context)
      && safeText(context['contextId'], 192)
      && ['PASS', 'FAILED', 'BLOCKED', 'PENDING', 'NOT_VERIFIED', 'UNPROVEN', 'STALE'].includes(String(context['verdict'])));
}
function combineVerdicts(verdicts: readonly AuditPacketVerdict[]): AuditPacketVerdict {
  for (const verdict of VERDICT_PRECEDENCE) if (verdicts.includes(verdict)) return verdict;
  return 'NOT_VERIFIED';
}

function normalizeMapping(value: unknown): AcceptanceProofMapping | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !['criterionId', 'testRefs', 'checkRunRefs'].includes(key))) return null;
  const criterionId = value['criterionId'];
  const testRefs = value['testRefs'];
  const checkRunRefs = value['checkRunRefs'];
  if (typeof criterionId !== 'string' || !CRITERIA.includes(criterionId as typeof CRITERIA[number])
    || !Array.isArray(testRefs) || testRefs.length > 32 || !testRefs.every(isProviderTestRef)
    || !Array.isArray(checkRunRefs) || checkRunRefs.length > 64 || !checkRunRefs.every((ref) => safeText(ref, 512))) return null;
  return { criterionId, testRefs: sortedUnique(testRefs as string[]), checkRunRefs: sortedUnique(checkRunRefs as string[]) };
}

function testProofRecord(
  receipt: NormalizedProviderTestExecutionReceipt,
  verdict: AuditPacketVerdict,
  reasonCodes: readonly string[],
): ProviderTestProofRecord {
  return {
    evidenceRef: receipt.evidenceRef,
    checkRunRef: receipt.checkRunRef,
    testRef: receipt.testRef,
    runId: receipt.runId,
    attempt: receipt.attempt,
    contextId: receipt.contextId,
    headSha: receipt.headSha,
    outcome: receipt.outcome,
    reportUri: receipt.reportUri,
    reportDigest: receipt.reportDigest,
    verdict,
    reasonCodes,
  };
}

function receiptDecisionMatches(
  receipt: NormalizedProviderTestExecutionReceipt,
  decision: { readonly verdict: AuditPacketVerdict; readonly reasonCodes: readonly string[] },
): boolean {
  return receipt.verdict === decision.verdict
    && JSON.stringify(receipt.reasonCodes) === JSON.stringify(decision.reasonCodes);
}

interface TestProofResolution {
  readonly verdict: AuditPacketVerdict;
  readonly testEvidence: readonly ProviderTestProofRecord[];
  readonly reasonCodes: readonly string[];
}

function resolveTestProofForRef(
  testRef: string,
  checkRunRefs: readonly string[],
  bundle: ProviderEvidenceBundle,
): TestProofResolution {
  const receipts = bundle.testExecutionReceipts.filter((receipt) => receipt.testRef === testRef
    && checkRunRefs.includes(receipt.checkRunRef));
  if (receipts.length === 0) {
    return { verdict: 'UNPROVEN', testEvidence: [], reasonCodes: ['ACCEPTANCE_TEST_RECEIPT_MISSING'] };
  }
  const checkRunsByRef = new Map(bundle.checkRuns.map((run) => [run.evidenceRef, run]));
  const resolved = receipts.flatMap((receipt) => {
    const checkRun = checkRunsByRef.get(receipt.checkRunRef);
    if (checkRun === undefined) return [];
    const decision = deriveProviderTestExecutionDecision(receipt, checkRun, bundle.expectedBinding.pullRequest.headSha);
    return [{ receipt, checkRun, decision, matches: receiptDecisionMatches(receipt, decision) }];
  });
  const testEvidence = resolved.map(({ receipt, decision, matches }) => testProofRecord(
    receipt,
    matches ? decision.verdict : 'NOT_VERIFIED',
    matches ? decision.reasonCodes : ['TEST_RECEIPT_INTEGRITY_MISMATCH'],
  ));
  if (resolved.length !== receipts.length) {
    return { verdict: 'NOT_VERIFIED', testEvidence, reasonCodes: ['TEST_RECEIPT_CHECK_REF_INVALID'] };
  }
  const selected = resolved.filter(({ receipt, checkRun, decision }) => receipt.selected && checkRun.selected
    && decision.verdict !== 'STALE');
  if (selected.length > 1) {
    return { verdict: 'NOT_VERIFIED', testEvidence, reasonCodes: ['ACCEPTANCE_TEST_RECEIPT_AMBIGUOUS'] };
  }
  const selectedReceipt = selected[0];
  if (selectedReceipt !== undefined) {
    return selectedReceipt.matches
      ? { verdict: selectedReceipt.decision.verdict, testEvidence, reasonCodes: selectedReceipt.decision.reasonCodes }
      : { verdict: 'NOT_VERIFIED', testEvidence, reasonCodes: ['TEST_RECEIPT_INTEGRITY_MISMATCH'] };
  }
  const stale = resolved.some(({ decision }) => decision.verdict === 'STALE');
  const reasonCodes = resolved.flatMap(({ decision, matches }) => matches
    ? decision.reasonCodes : ['TEST_RECEIPT_INTEGRITY_MISMATCH']);
  return { verdict: stale ? 'STALE' : 'NOT_VERIFIED', testEvidence, reasonCodes };
}

function resolveAcceptanceTestProofs(
  testRefs: readonly string[],
  checkRunRefs: readonly string[],
  bundle: ProviderEvidenceBundle,
): readonly TestProofResolution[] {
  return testRefs.map((testRef) => resolveTestProofForRef(testRef, checkRunRefs, bundle));
}

function resolveMappedCheckRuns(
  checkRunRefs: readonly string[],
  bundle: ProviderEvidenceBundle,
): readonly ProviderEvidenceBundle['checkRuns'][number][] | null {
  const checkRunsByRef = new Map(bundle.checkRuns.map((run) => [run.evidenceRef, run]));
  const resolved: ProviderEvidenceBundle['checkRuns'][number][] = [];
  for (const ref of checkRunRefs) {
    const checkRun = checkRunsByRef.get(ref);
    if (checkRun === undefined) return null;
    resolved.push(checkRun);
  }
  return resolved;
}

function providerCheckVerdict(
  run: ProviderEvidenceBundle['checkRuns'][number],
  bundle: ProviderEvidenceBundle,
  requiredContextIds: ReadonlySet<string>,
): AuditPacketVerdict {
  if (!requiredContextIds.has(run.contextId)) return 'UNPROVEN';
  if (!run.selected) return 'NOT_VERIFIED';
  if (run.headSha !== bundle.expectedBinding.pullRequest.headSha) return 'STALE';
  const result = bundle.requiredContextResults.find((context) => context.contextId === run.contextId);
  return result?.verdict === 'PASS' ? run.verdict : (result?.verdict ?? 'NOT_VERIFIED');
}

function validMappedTestRefs(testRefs: readonly string[], changedPaths: readonly string[]): boolean {
  const changedPathSet = new Set(changedPaths);
  return testRefs.every((ref) => isProviderTestRef(ref) && changedPathSet.has(ref.slice(0, ref.indexOf('#'))));
}

function proofResult(
  criterionId: string,
  mapping: AcceptanceProofMapping | undefined,
  bundle: ProviderEvidenceBundle,
  changedPaths: readonly string[],
): AcceptanceProofResult {
  const testRefs = mapping?.testRefs ?? [];
  const checkRunRefs = mapping?.checkRunRefs ?? [];
  const failure = (reasonCode: string) => deepFreeze({
    criterionId,
    testRefs,
    checkRunRefs,
    providerEvidence: [],
    testEvidence: [],
    verdict: 'UNPROVEN' as const,
    reasonCodes: [reasonCode],
  });
  if (mapping === undefined || testRefs.length === 0 || checkRunRefs.length === 0) return failure('ACCEPTANCE_PROOF_MAPPING_MISSING');
  if (!validMappedTestRefs(testRefs, changedPaths)) return failure('ACCEPTANCE_TEST_REF_UNBOUND');
  const resolved = resolveMappedCheckRuns(checkRunRefs, bundle);
  if (resolved === null) return failure('ACCEPTANCE_CHECK_REF_UNBOUND');

  const requiredContextIds = new Set(bundle.expectedBinding.requiredContexts.map(({ contextId }) => contextId));
  const checkVerdicts = resolved.map((run) => providerCheckVerdict(run, bundle, requiredContextIds));
  const testProofs = resolveAcceptanceTestProofs(testRefs, checkRunRefs, bundle);
  const testVerdicts = testProofs.map(({ verdict }) => verdict);
  const verdicts = [...checkVerdicts, ...testVerdicts];
  if (!bundle.bindingMatches) verdicts.push('STALE');
  if (bundle.source.collectionState !== 'COMPLETE') verdicts.push('NOT_VERIFIED');
  const reasonCodes = sortedUnique([
    ...resolved.flatMap((run) => run.reasonCodes),
    ...testProofs.flatMap(({ reasonCodes: reasons }) => reasons),
    ...resolved.flatMap((run) => !run.selected ? ['CHECK_RUN_NOT_SELECTED'] : []),
    ...resolved.flatMap((run) => !requiredContextIds.has(run.contextId) ? ['CHECK_RUN_CONTEXT_NOT_REQUIRED'] : []),
    ...resolved.flatMap((run) => run.headSha !== bundle.expectedBinding.pullRequest.headSha ? ['CHECK_RUN_HEAD_MISMATCH'] : []),
    ...(!bundle.bindingMatches ? ['EVIDENCE_BUNDLE_BINDING_MISMATCH'] : []),
    ...(bundle.source.collectionState !== 'COMPLETE' ? ['PROVIDER_COLLECTION_NOT_COMPLETE'] : []),
  ]);
  const providerEvidence: ProviderCheckProofRecord[] = resolved.map((run) => ({
    evidenceRef: run.evidenceRef,
    sourceUri: run.sourceUri,
    runId: run.runId,
    attempt: run.attempt,
    contextId: run.contextId,
    checkKind: run.checkKind,
    headSha: run.headSha,
    conclusion: run.conclusion,
    verdict: run.verdict,
  }));
  return deepFreeze({
    criterionId,
    testRefs,
    checkRunRefs,
    providerEvidence,
    testEvidence: testProofs.flatMap(({ testEvidence }) => testEvidence),
    verdict: combineVerdicts(verdicts),
    reasonCodes,
  });
}

function validateInput(input: ProviderAuditPacketInput): Result<{
  readonly evidenceBundle: ProviderEvidenceBundle;
  readonly candidateBinding: ProviderAuditBinding;
  readonly currentBinding: ProviderAuditBinding;
  readonly actualChangedPaths: readonly string[];
  readonly mappings: ReadonlyMap<string, AcceptanceProofMapping>;
  readonly unresolvedRiskIds: readonly string[];
  readonly optionalReviewTools: readonly OptionalReviewTool[];
}> {
  if (!isRecord(input) || Object.keys(input).some((key) => !PACKET_INPUT_FIELDS.includes(key))
    || (input['executorClaims'] !== undefined && (!Array.isArray(input['executorClaims']) || input['executorClaims'].length > 64))
    || !validEvidenceBundle(input['evidenceBundle'])
    || !validBinding(input['candidateBinding']) || !validBinding(input['currentBinding'])
    || !Array.isArray(input['actualChangedPaths']) || input['actualChangedPaths'].length === 0
    || input['actualChangedPaths'].length > 1024 || !input['actualChangedPaths'].every(safePath)
    || input['authorizationReceiptUri'] !== AUTHORIZATION_RECEIPT_URI
    || !Array.isArray(input['acceptanceMappings']) || input['acceptanceMappings'].length > CRITERIA.length
    || !Array.isArray(input['unresolvedRiskIds']) || input['unresolvedRiskIds'].length > 128
    || !input['unresolvedRiskIds'].every((id) => safeText(id, 192))
    || !Array.isArray(input['optionalReviewTools']) || input['optionalReviewTools'].length > 64
    || !input['optionalReviewTools'].every((tool) => isRecord(tool) && Object.keys(tool).every((key) => ['toolId', 'state'].includes(key))
      && safeText(tool['toolId'], 192) && ['AVAILABLE', 'UNAVAILABLE', 'NOT_RUN'].includes(String(tool['state'])))
    || typeof input['specialistReviewRequired'] !== 'boolean'
    || !['NOT_REQUIRED', 'UNAVAILABLE', 'NOT_VERIFIED'].includes(input['specialistReviewState'])
    || input['checkpointDeltaStatus'] !== 'PROPOSED_ONLY') {
    return fail('M27_AUDIT_PACKET_INPUT_INVALID', 'Provider audit packet input failed bounded schema validation.');
  }
  const mappings = new Map<string, AcceptanceProofMapping>();
  for (const rawMapping of input['acceptanceMappings']) {
    const mapping = normalizeMapping(rawMapping);
    if (mapping === null || mappings.has(mapping.criterionId)) {
      return fail('M27_AUDIT_PACKET_MAPPING_INVALID', 'Acceptance proof mapping is malformed or duplicated.');
    }
    mappings.set(mapping.criterionId, mapping);
  }
  const evidence = input['evidenceBundle'];
  const candidate = input['candidateBinding'];
  const current = input['currentBinding'];
  const expectedBinding = evidence['expectedBinding'] as ProviderEvidenceBinding;
  if (input['actualChangedPaths'].some((path) => !isAllowedPath(path))) {
    // Retain these bounded paths; scope violations become an explicit no-go in the packet.
  }
  if (!SHA40.test(candidate.provider.pullRequest.baseSha) || !SHA40.test(candidate.provider.pullRequest.headSha)
    || !SHA256.test(candidate.provider.contextLockDigest) || !SHA256.test(candidate.ruleset.digest)
    || compareBinding(expectedBinding, candidate.provider).length > 0) {
    return fail('M27_AUDIT_PACKET_SOURCE_INVALID', 'Evidence bundle does not bind the proposed exact source identity.');
  }
  return ok({
    evidenceBundle: evidence,
    candidateBinding: cloneAuditBinding(candidate),
    currentBinding: cloneAuditBinding(current),
    actualChangedPaths: sortedUnique(input['actualChangedPaths'] as string[]),
    mappings,
    unresolvedRiskIds: sortedUnique(input['unresolvedRiskIds'] as string[]),
    optionalReviewTools: [...input['optionalReviewTools'] as OptionalReviewTool[]]
      .map((tool) => ({ toolId: tool.toolId, state: tool.state }))
      .sort((a, b) => a.toolId < b.toolId ? -1 : a.toolId > b.toolId ? 1 : 0),
  });
}

/** Creates a bounded owner-audit packet; it never approves, merges, or promotes. */
function createProviderAuditPacketUnchecked(input: ProviderAuditPacketInput, options: OperationOptions): Result<ProviderAuditPacket> {
  if (!isRecord(input)) return fail('M27_AUDIT_PACKET_INPUT_INVALID', 'Provider audit packet input failed bounded schema validation.');
  const verifiedBundle = verifyProviderEvidenceBundle(input['evidenceBundle'], options);
  if (!verifiedBundle.ok) return verifiedBundle;
  if (!verifiedBundle.value) return fail('M27_AUDIT_EVIDENCE_DIGEST_INVALID', 'Provider Evidence Bundle digest verification failed.');
  const validated = validateInput(input);
  if (!validated.ok) return validated;
  const value = validated.value;
  const bindingReasons = compareAuditBinding(value.candidateBinding, value.currentBinding);
  const bundleReasons = compareBinding(value.evidenceBundle.expectedBinding, value.candidateBinding.provider);
  const changedPathReasons = JSON.stringify(value.actualChangedPaths)
    === JSON.stringify(sortedUnique(value.candidateBinding.provider.changedPaths)) ? [] : ['ACTUAL_DIFF_PATHS_MISMATCH'];
  const scopeViolations = value.actualChangedPaths.filter((path) => !isAllowedPath(path));
  const acceptanceProofs = CRITERIA.map((criterionId) => proofResult(
    criterionId,
    value.mappings.get(criterionId),
    value.evidenceBundle,
    value.actualChangedPaths,
  ));
  const specialistReasons = input.specialistReviewRequired
    ? ['REQUIRED_SPECIALIST_REVIEW_NOT_VERIFIED']
    : input.specialistReviewState === 'NOT_REQUIRED' ? [] : ['SPECIALIST_REVIEW_STATE_CONFLICT'];
  const reasonCodes = sortedUnique([
    ...bindingReasons,
    ...bundleReasons,
    ...changedPathReasons,
    ...(scopeViolations.length > 0 ? ['WRITE_SCOPE_VIOLATION'] : []),
    ...acceptanceProofs.flatMap(({ reasonCodes: reasons }) => reasons),
    ...(value.unresolvedRiskIds.length > 0 ? ['UNRESOLVED_RISKS_REMAIN'] : []),
    ...specialistReasons,
  ]);
  const verdicts: AuditPacketVerdict[] = acceptanceProofs.map(({ verdict }) => verdict);
  if (bindingReasons.length > 0 || bundleReasons.length > 0 || changedPathReasons.length > 0) verdicts.push('STALE');
  if (scopeViolations.length > 0 || value.unresolvedRiskIds.length > 0) verdicts.push('BLOCKED');
  if (specialistReasons.includes('REQUIRED_SPECIALIST_REVIEW_NOT_VERIFIED')) verdicts.push('NOT_VERIFIED');
  if (specialistReasons.includes('SPECIALIST_REVIEW_STATE_CONFLICT')) verdicts.push('BLOCKED');
  const body = deepFreeze({
    schemaVersion: '1.0' as const,
    workOrderId: 'GBS-MOD-WO-002' as const,
    candidateBinding: value.candidateBinding,
    currentBinding: value.currentBinding,
    bindingCurrent: bindingReasons.length === 0,
    actualChangedPaths: value.actualChangedPaths,
    authorizationReceiptUri: input.authorizationReceiptUri,
    scopeViolations: sortedUnique(scopeViolations),
    evidenceBundleDigest: value.evidenceBundle.bundleDigest,
    acceptanceProofs,
    unresolvedRiskIds: value.unresolvedRiskIds,
    optionalReviewTools: value.optionalReviewTools,
    specialistReviewRequired: input.specialistReviewRequired,
    specialistReviewState: input.specialistReviewState,
    ownerAudit: 'NOT_INDEPENDENT' as const,
    checkpointDeltaStatus: 'PROPOSED_ONLY' as const,
    mayApprove: false as const,
    mayMerge: false as const,
    mayPromoteCheckpoint: false as const,
    verdict: combineVerdicts(verdicts),
    reasonCodes,
  });
  const packetDigest = digestValue(options, 'GBS_MOD_WO_002_PROVIDER_AUDIT_PACKET_V1', body);
  return packetDigest.ok ? ok(deepFreeze({ ...body, packetDigest: packetDigest.value })) : packetDigest;
}

/** Converts malformed or hostile packet input into a bounded, redacted diagnostic. */
export function createProviderAuditPacket(input: ProviderAuditPacketInput, options: OperationOptions): Result<ProviderAuditPacket> {
  try {
    return createProviderAuditPacketUnchecked(input, options);
  } catch {
    return fail('M27_AUDIT_PACKET_INPUT_UNREADABLE', 'Provider audit packet input could not be safely inspected.');
  }
}

/** Rechecks both integrity and current base/head/ruleset/lock binding of a prior packet. */
function revalidateProviderAuditPacketUnchecked(
  packet: unknown,
  currentBinding: ProviderAuditBinding,
  options: OperationOptions,
): Result<ProviderAuditPacketValidation> {
  if (!isRecord(packet) || typeof packet['packetDigest'] !== 'string' || !SHA256.test(packet['packetDigest'])
    || !validBinding(currentBinding)) {
    return ok({ state: 'INVALID', reasonCodes: ['AUDIT_PACKET_SHAPE_INVALID'], observedPacketDigest: null, expectedPacketDigest: null });
  }
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(packet)) if (key !== 'packetDigest') body[key] = packet[key];
  const computed = digestValue(options, 'GBS_MOD_WO_002_PROVIDER_AUDIT_PACKET_V1', body);
  if (!computed.ok) return computed;
  if (computed.value !== packet['packetDigest']) {
    return ok({ state: 'INVALID', reasonCodes: ['AUDIT_PACKET_DIGEST_MISMATCH'], observedPacketDigest: packet['packetDigest'], expectedPacketDigest: computed.value });
  }
  const candidateBinding = packet['candidateBinding'];
  const priorCurrentBinding = packet['currentBinding'];
  if (packet['schemaVersion'] !== '1.0' || packet['workOrderId'] !== 'GBS-MOD-WO-002'
    || !validBinding(candidateBinding) || !validBinding(priorCurrentBinding)) {
    return ok({ state: 'INVALID', reasonCodes: ['AUDIT_PACKET_BINDING_INVALID'], observedPacketDigest: packet['packetDigest'], expectedPacketDigest: computed.value });
  }
  const staleReasons = sortedUnique([
    ...compareAuditBinding(candidateBinding, priorCurrentBinding),
    ...compareAuditBinding(candidateBinding, currentBinding),
  ]);
  return staleReasons.length > 0
    ? ok({ state: 'STALE', reasonCodes: staleReasons, observedPacketDigest: packet['packetDigest'], expectedPacketDigest: computed.value })
    : ok({ state: 'CURRENT', reasonCodes: [], observedPacketDigest: packet['packetDigest'], expectedPacketDigest: computed.value });
}

/** Invalidates unreadable or hostile packet objects without echoing provider details. */
export function revalidateProviderAuditPacket(
  packet: unknown,
  currentBinding: ProviderAuditBinding,
  options: OperationOptions,
): Result<ProviderAuditPacketValidation> {
  try {
    return revalidateProviderAuditPacketUnchecked(packet, currentBinding, options);
  } catch {
    return ok({ state: 'INVALID', reasonCodes: ['AUDIT_PACKET_INPUT_UNREADABLE'], observedPacketDigest: null, expectedPacketDigest: null });
  }
}
