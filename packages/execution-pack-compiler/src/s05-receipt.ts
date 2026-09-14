// M15 Execution Pack Compiler - s05-receipt.ts
// S05: Execution Pack Receipt (EPR), Pack Semantic Digest (PSD),
//      Pre-Invocation Drift Sentinel (PIDS), Prompt Entropy Reducer (PER),
//      Pack Replay Contract (PRC).
// Sealed, deterministic, replayable. Uncertainty is never converted to VALID.

import type {
  DriftCheckInput,
  EntropyReductionResult,
  ExecutionPack,
  OperationOptions,
  PackReceipt,
  PackSemanticDigestInput,
  PackStatus,
  ReplayEvaluation,
  Result,
} from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, sha, sortedStrings, validId } from './utils.js';

// ─── Pack Semantic Digest (PSD) ───────────────────────────────────────────────

/**
 * Normalized digest independent of timestamps and input ordering.
 * Semantically equivalent packs produce the same digest.
 */
export function computePackSemanticDigest(
  input: PackSemanticDigestInput,
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;

  const normalized = {
    packId: input.packId,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
    capabilityIdentity: input.capabilityIdentity,
    contextIdentity: input.contextIdentity,
    instructionIdentities: sortedStrings(input.instructionIdentities),
    criticalPath: [...input.criticalPath],
    waves: input.waves.map(w => sortedStrings(w)),
    validationIds: sortedStrings(input.validationIds),
    guardrailPolicyIds: sortedStrings(input.guardrailPolicyIds),
    toolKeys: sortedStrings(input.toolKeys),
  };
  return sha(options, normalized);
}

// ─── Execution Pack Receipt (EPR) ─────────────────────────────────────────────

const PACK_STATUS_VALUES: ReadonlySet<string> = new Set([
  'VALID',
  'STALE_CONTEXT',
  'STALE_POLICY',
  'CAPABILITY_MISMATCH',
  'GRAPH_INVALID',
  'BLOCKED',
  'INDETERMINATE',
]);

/** Build the immutable identity/digest receipt with all pack bindings. */
export function buildExecutionPackReceipt(input: {
  packId: string;
  status: PackStatus;
  semanticDigest: string;
  diagnostics: readonly string[];
  replayable: boolean;
}): Result<PackReceipt> {
  if (!validId(input.packId)) {
    return fail('PACK_RECEIPT_INVALID', 'packId is invalid or empty', input.packId);
  }
  if (!PACK_STATUS_VALUES.has(input.status)) {
    return fail('PACK_RECEIPT_INVALID', `Unknown pack status: ${input.status}`, input.packId);
  }
  if (!input.semanticDigest || input.semanticDigest.trim().length === 0) {
    return fail('PACK_RECEIPT_INVALID', 'Semantic digest is required', input.packId);
  }
  if (input.status === 'VALID' && input.diagnostics.length > 0) {
    return fail(
      'PACK_RECEIPT_INVALID',
      'A VALID receipt cannot carry diagnostics; uncertainty must not become VALID',
      input.packId,
    );
  }
  return {
    ok: true,
    value: deepFreeze({
      packId: input.packId,
      status: input.status,
      semanticDigest: input.semanticDigest,
      diagnostics: [...input.diagnostics],
      replayable: input.replayable,
    }),
  };
}

/** Map a failure diagnostic code to its terminal pack status. Never VALID. */
export function statusForDiagnosticCode(code: string): PackStatus {
  switch (code) {
    case 'PACK_CONTEXT_STALE':
    case 'PACK_CONTEXT_NOT_READY':
    case 'PACK_BINDING_INVALID':
      return 'STALE_CONTEXT';
    case 'PACK_POLICY_STALE':
      return 'STALE_POLICY';
    case 'PACK_CAPABILITY_MISMATCH':
    case 'PACK_CAPABILITY_MISSING':
      return 'CAPABILITY_MISMATCH';
    case 'PACK_GRAPH_EMPTY':
    case 'PACK_GRAPH_DUPLICATE_NODE':
    case 'PACK_GRAPH_UNKNOWN_DEPENDENCY':
    case 'PACK_GRAPH_CYCLE':
    case 'PACK_GRAPH_BUDGET_EXHAUSTED':
    case 'PACK_GRAPH_INVALID':
    case 'PACK_GUARDRAIL_UNBOUND':
    case 'PACK_GUARDRAIL_UNKNOWN_NODE':
    case 'PACK_GUARDRAIL_DUPLICATE_NODE':
    case 'PACK_VALIDATION_UNCLOSED':
    case 'PACK_VALIDATION_UNKNOWN_TARGET':
    case 'PACK_ROLLBACK_MISSING':
    case 'PACK_PROVENANCE_MISSING':
    case 'PACK_PROVENANCE_UNKNOWN_INSTRUCTION':
    case 'PACK_COMPLETENESS_FAILED':
    case 'PACK_EVIDENCE_SLOT_INVALID':
      return 'GRAPH_INVALID';
    case 'PACK_NDB_VIOLATION':
    case 'PACK_AMBIGUITY_ESCALATED':
    case 'PACK_BUDGET_EXHAUSTED':
    case 'PACK_REPLAY_REJECTED':
      return 'BLOCKED';
    default:
      return 'INDETERMINATE';
  }
}

// ─── Pre-Invocation Drift Sentinel (PIDS) ─────────────────────────────────────

/**
 * Recheck task/context/policy/capability fingerprints immediately before
 * execution. Stale packs are blocked with the exact drift dimension; only a
 * fully matching pack returns VALID. Total function: always yields a receipt.
 */
export function checkPreInvocationDrift(
  pack: ExecutionPack,
  current: DriftCheckInput,
): PackReceipt {
  const drifts: string[] = [];
  const bindings = current.currentBindings;
  if (bindings.projectId !== pack.projectId) drifts.push('projectId');
  if (bindings.sourcePackIdentity !== pack.sourcePackIdentity) drifts.push('sourcePackIdentity');
  if (bindings.profileIdentity !== pack.profileIdentity) drifts.push('profileIdentity');
  if (bindings.profileDigest !== pack.profileDigest) drifts.push('profileDigest');
  if (bindings.checkpointIdentity !== pack.checkpointIdentity) drifts.push('checkpointIdentity');
  if (bindings.contextIdentity !== pack.contextIdentity) drifts.push('contextIdentity');

  let status: PackStatus;
  let diagnostics: string[];
  let replayable: boolean;
  if (drifts.length > 0) {
    status = 'STALE_CONTEXT';
    diagnostics = drifts.map(d => `STALE_CONTEXT: binding drift in ${d}`);
    replayable = false;
  } else if (bindings.policyVersion !== pack.policyVersion) {
    status = 'STALE_POLICY';
    diagnostics = ['STALE_POLICY: policyVersion drift'];
    replayable = false;
  } else if (current.currentCapabilityIdentity !== pack.capabilityIdentity) {
    status = 'CAPABILITY_MISMATCH';
    diagnostics = ['CAPABILITY_MISMATCH: executor capability drift'];
    replayable = false;
  } else if (pack.workDag.length === 0 || pack.criticalPath.length === 0) {
    status = 'GRAPH_INVALID';
    diagnostics = ['GRAPH_INVALID: pack carries no executable work graph'];
    replayable = false;
  } else {
    status = 'VALID';
    diagnostics = [];
    replayable = true;
  }

  return deepFreeze({
    packId: pack.packId,
    status,
    semanticDigest: pack.semanticDigest,
    diagnostics,
    replayable,
  });
}

// ─── Prompt Entropy Reducer (PER) ─────────────────────────────────────────────

/**
 * Deterministic deduplication of redundant prose. Exact-duplicate lines are
 * collapsed to first occurrence and whitespace is normalized; every line
 * carrying a mandatory marker is verified present in the output, so no
 * obligation is ever deleted, only redundancy.
 */
export function reducePromptEntropy(
  sections: readonly string[],
  mandatoryMarkers: readonly string[],
): EntropyReductionResult {
  const seen = new Set<string>();
  const reduced: string[] = [];
  let removedLines = 0;
  for (const section of sections) {
    for (const rawLine of section.split('\n')) {
      const line = rawLine.trim().replace(/\s+/g, ' ');
      if (line.length === 0) {
        removedLines += 1;
        continue;
      }
      if (seen.has(line)) {
        removedLines += 1;
        continue;
      }
      seen.add(line);
      reduced.push(line);
    }
  }
  const preservedMarkers = mandatoryMarkers
    .filter(marker => reduced.some(line => line.includes(marker)))
    .sort(compareCodePoint);
  return deepFreeze({ reduced, removedLines, preservedMarkers });
}

// ─── Pack Replay Contract (PRC) ───────────────────────────────────────────────

/**
 * Deterministic replay is allowed only when the semantic digest still matches
 * and every required binding remains valid. Anything else rejects replay
 * instead of guessing.
 */
export function evaluatePackReplay(
  expectedDigest: string,
  actualDigest: string,
  bindingsValid: boolean,
): ReplayEvaluation {
  if (!bindingsValid) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: bindings are no longer valid' });
  }
  if (expectedDigest !== actualDigest) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: semantic digest drift' });
  }
  return deepFreeze({ replayable: true, reason: 'ACCEPTED: identical semantic digest with valid bindings' });
}
