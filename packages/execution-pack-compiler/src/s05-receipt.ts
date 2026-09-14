// M15 Execution Pack Compiler - s05-receipt.ts
// S05: Execution Pack Receipt (EPR), Pack Semantic Digest (PSD),
//      Pre-Invocation Drift Sentinel (PIDS), Prompt Entropy Reducer (PER),
//      Pack Replay Contract (PRC).
// Sealed, deterministic, replayable. Uncertainty is never converted to VALID.
// PIDS verifies pack integrity by recomputation, not by trusting stored fields.

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
  ToolInvocation,
  ValidationRequirement,
} from './types.js';
import {
  cancelled,
  canonical,
  compareCodePoint,
  deepFreeze,
  fail,
  sha,
  sortedStrings,
  validId,
} from './utils.js';

// ─── Canonical payload helpers ────────────────────────────────────────────────

/** Canonical JSON for one semantic payload element. */
function payloadOf(value: unknown): string {
  return canonical(value);
}

/**
 * Rebuild the digest input from a sealed pack. Used both at seal time and by
 * PIDS/PRC for independent re-verification, so stored digests are never
 * trusted without recomputation.
 */
export function buildPackDigestInput(pack: ExecutionPack): PackSemanticDigestInput {
  return {
    packId: pack.packId,
    taskIdentity: pack.taskIdentity,
    projectId: pack.projectId,
    sourcePackIdentity: pack.sourcePackIdentity,
    profileIdentity: pack.profileIdentity,
    profileDigest: pack.profileDigest,
    policyVersion: pack.policyVersion,
    checkpointIdentity: pack.checkpointIdentity,
    capabilityIdentity: pack.capabilityIdentity,
    contextIdentity: pack.contextIdentity,
    contextDigest: pack.contextDigest,
    objective: pack.objective,
    stopCondition: pack.stopCondition,
    handbackSchema: pack.handbackSchema,
    constraints: sortedStrings(pack.constraints),
    allowedMutations: sortedStrings(pack.allowedMutations),
    forbiddenMutations: sortedStrings(pack.forbiddenMutations),
    proofObligations: sortedStrings(pack.proofObligations),
    instructionPayloads: sortedStrings(pack.instructions.map(i => payloadOf({ ...i }))),
    workGraphPayloads: sortedStrings(pack.workDag.map(n => payloadOf({ ...n }))),
    criticalPath: [...pack.criticalPath],
    waves: pack.safeParallelWaves.map(w => sortedStrings(w)),
    validationPayloads: sortedStrings(pack.validations.map(v => payloadOf({ ...v }))),
    guardrailPolicyIds: sortedStrings(pack.guardrailBindings),
    toolPayloads: sortedStrings(pack.toolBlueprint.map(t => payloadOf({ ...t }))),
    reducedPrompt: [...pack.reducedPrompt],
  };
}

// ─── Pack Semantic Digest (PSD) ───────────────────────────────────────────────

/**
 * Normalized digest over the full semantic payload — task identity, pack
 * sections, instruction/graph/validation/tool payloads — independent of
 * timestamps and input ordering. Any semantic tampering changes the digest.
 */
export function computePackSemanticDigest(
  input: PackSemanticDigestInput,
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;

  const normalized = {
    packId: input.packId,
    taskIdentity: input.taskIdentity,
    projectId: input.projectId,
    sourcePackIdentity: input.sourcePackIdentity,
    profileIdentity: input.profileIdentity,
    profileDigest: input.profileDigest,
    policyVersion: input.policyVersion,
    checkpointIdentity: input.checkpointIdentity,
    capabilityIdentity: input.capabilityIdentity,
    contextIdentity: input.contextIdentity,
    contextDigest: input.contextDigest,
    objective: input.objective,
    stopCondition: input.stopCondition,
    handbackSchema: input.handbackSchema,
    constraints: sortedStrings(input.constraints),
    allowedMutations: sortedStrings(input.allowedMutations),
    forbiddenMutations: sortedStrings(input.forbiddenMutations),
    proofObligations: sortedStrings(input.proofObligations),
    instructionPayloads: sortedStrings(input.instructionPayloads),
    workGraphPayloads: sortedStrings(input.workGraphPayloads),
    criticalPath: [...input.criticalPath],
    waves: input.waves.map(w => sortedStrings(w)),
    validationPayloads: sortedStrings(input.validationPayloads),
    guardrailPolicyIds: sortedStrings(input.guardrailPolicyIds),
    toolPayloads: sortedStrings(input.toolPayloads),
    reducedPrompt: [...input.reducedPrompt],
  };
  return sha(options, normalized);
}

/** Digest over the executable work graph (order, waves, critical path). */
export function computeWorkGraphDigest(
  input: { nodeIds: readonly string[]; waves: readonly (readonly string[])[]; criticalPath: readonly string[] },
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;
  return sha(options, {
    nodeIds: sortedStrings(input.nodeIds),
    waves: input.waves.map(w => sortedStrings(w)),
    criticalPath: [...input.criticalPath],
  });
}

/** Digest over the tool invocation plan. */
export function computeToolPlanDigest(
  blueprint: readonly ToolInvocation[],
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;
  return sha(options, {
    tools: sortedStrings(blueprint.map(t => payloadOf({ ...t }))),
  });
}

/** Digest over the validation plan. */
export function computeValidationPlanDigest(
  validations: readonly ValidationRequirement[],
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;
  return sha(options, {
    validations: sortedStrings(validations.map(v => payloadOf({ ...v }))),
  });
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

const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

/**
 * Build the immutable receipt exposing every frozen binding: TCC/context
 * identity and digest, policy version, graph/tool/validation plan digests,
 * capability identity and the final pack semantic digest.
 */
export function buildExecutionPackReceipt(input: {
  packId: string;
  status: PackStatus;
  semanticDigest: string;
  diagnostics: readonly string[];
  replayable: boolean;
  taskIdentity: string;
  contextIdentity: string;
  contextDigest: string;
  policyVersion: string;
  graphDigest: string;
  toolPlanDigest: string;
  validationPlanDigest: string;
  capabilityIdentity: string;
}): Result<PackReceipt> {
  if (!validId(input.packId)) {
    return fail('PACK_RECEIPT_INVALID', 'packId is invalid or empty', input.packId);
  }
  if (!PACK_STATUS_VALUES.has(input.status)) {
    return fail('PACK_RECEIPT_INVALID', `Unknown pack status: ${input.status}`, input.packId);
  }
  if (!DIGEST_RE.test(input.semanticDigest)) {
    return fail('PACK_RECEIPT_INVALID', 'Semantic digest must be a sha256 digest', input.packId);
  }
  const bindings: Readonly<Record<string, string>> = {
    taskIdentity: input.taskIdentity,
    contextIdentity: input.contextIdentity,
    contextDigest: input.contextDigest,
    policyVersion: input.policyVersion,
    graphDigest: input.graphDigest,
    toolPlanDigest: input.toolPlanDigest,
    validationPlanDigest: input.validationPlanDigest,
    capabilityIdentity: input.capabilityIdentity,
  };
  for (const [name, value] of Object.entries(bindings)) {
    if (!value || value.trim().length === 0) {
      return fail('PACK_RECEIPT_INVALID', `Receipt binding missing: ${name}`, input.packId);
    }
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
      taskIdentity: input.taskIdentity,
      contextIdentity: input.contextIdentity,
      contextDigest: input.contextDigest,
      policyVersion: input.policyVersion,
      graphDigest: input.graphDigest,
      toolPlanDigest: input.toolPlanDigest,
      validationPlanDigest: input.validationPlanDigest,
      capabilityIdentity: input.capabilityIdentity,
    }),
  };
}

/** Map a failure diagnostic code to its terminal pack status. Never VALID. */
export function statusForDiagnosticCode(code: string): PackStatus {
  switch (code) {
    case 'PACK_CONTEXT_STALE':
    case 'PACK_CONTEXT_NOT_READY':
    case 'PACK_BINDING_INVALID':
    case 'PACK_TASK_IDENTITY_MISSING':
    case 'PACK_ROCI_CONTEXT_MISMATCH':
      return 'STALE_CONTEXT';
    case 'PACK_POLICY_STALE':
      return 'STALE_POLICY';
    case 'PACK_CAPABILITY_MISMATCH':
    case 'PACK_CAPABILITY_MISSING':
    case 'PACK_FORBIDDEN_CAPABILITY_OFFERED':
    case 'PACK_PARALLELISM_EXCEEDED':
    case 'PACK_SANDBOX_MISMATCH':
      return 'CAPABILITY_MISMATCH';
    case 'PACK_GRAPH_EMPTY':
    case 'PACK_GRAPH_DUPLICATE_NODE':
    case 'PACK_GRAPH_UNKNOWN_DEPENDENCY':
    case 'PACK_GRAPH_CYCLE':
    case 'PACK_GRAPH_BUDGET_EXHAUSTED':
    case 'PACK_GRAPH_INVALID':
    case 'PACK_NODE_PRECONDITION_MISSING':
    case 'PACK_NODE_EVIDENCE_MISSING':
    case 'PACK_NODE_MUTATION_SPEC_MISSING':
    case 'PACK_SECTION_MISSING':
    case 'PACK_MUTATION_NOT_PERMITTED':
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
    case 'PACK_REASONING_BRANCH_UNRESOLVED':
    case 'PACK_AMBIGUITY_ESCALATED':
    case 'PACK_BUDGET_EXHAUSTED':
    case 'PACK_REPLAY_REJECTED':
    case 'PACK_ENTROPY_OBLIGATION_MISSING':
      return 'BLOCKED';
    default:
      return 'INDETERMINATE';
  }
}

// ─── Pre-Invocation Drift Sentinel (PIDS) ─────────────────────────────────────

function integrityReceipt(
  pack: ExecutionPack,
  diagnostics: readonly string[],
): PackReceipt {
  const receipt = buildExecutionPackReceipt({
    packId: pack.packId,
    status: 'GRAPH_INVALID',
    semanticDigest: pack.semanticDigest,
    diagnostics: [...diagnostics],
    replayable: false,
    taskIdentity: pack.taskIdentity,
    contextIdentity: pack.contextIdentity,
    contextDigest: pack.contextDigest,
    policyVersion: pack.policyVersion,
    graphDigest: pack.graphDigest,
    toolPlanDigest: pack.toolPlanDigest,
    validationPlanDigest: pack.validationPlanDigest,
    capabilityIdentity: pack.capabilityIdentity,
  });
  if (!receipt.ok) {
    return deepFreeze({
      packId: pack.packId,
      status: 'INDETERMINATE' as const,
      semanticDigest: pack.semanticDigest,
      diagnostics: [...diagnostics, 'INDETERMINATE: receipt sealing failed'],
      replayable: false,
      taskIdentity: pack.taskIdentity,
      contextIdentity: pack.contextIdentity,
      contextDigest: pack.contextDigest,
      policyVersion: pack.policyVersion,
      graphDigest: pack.graphDigest,
      toolPlanDigest: pack.toolPlanDigest,
      validationPlanDigest: pack.validationPlanDigest,
      capabilityIdentity: pack.capabilityIdentity,
    });
  }
  return receipt.value;
}

/**
 * Recheck bindings AND pack integrity immediately before execution. After the
 * binding comparison, every sealed digest (graph, tool plan, validation plan
 * and full PSD) is recomputed from the current pack payload: a tampered
 * instruction, validation, tool blueprint, guardrail, graph, stop condition
 * or handback field yields GRAPH_INVALID even when external bindings match.
 */
export function checkPreInvocationDrift(
  pack: ExecutionPack,
  current: DriftCheckInput,
  options: OperationOptions,
): Result<PackReceipt> {
  const drifts: string[] = [];
  const bindings = current.currentBindings;
  if (current.currentTaskIdentity !== pack.taskIdentity) drifts.push('taskIdentity');
  if (bindings.projectId !== pack.projectId) drifts.push('projectId');
  if (bindings.sourcePackIdentity !== pack.sourcePackIdentity) drifts.push('sourcePackIdentity');
  if (bindings.profileIdentity !== pack.profileIdentity) drifts.push('profileIdentity');
  if (bindings.profileDigest !== pack.profileDigest) drifts.push('profileDigest');
  if (bindings.checkpointIdentity !== pack.checkpointIdentity) drifts.push('checkpointIdentity');
  if (bindings.contextIdentity !== pack.contextIdentity) drifts.push('contextIdentity');
  if (bindings.contextDigest !== pack.contextDigest) drifts.push('contextDigest');

  const driftReceipt = (status: PackStatus, diagnostics: readonly string[]): Result<PackReceipt> => {
    const receipt = buildExecutionPackReceipt({
      packId: pack.packId,
      status,
      semanticDigest: pack.semanticDigest,
      diagnostics: [...diagnostics],
      replayable: status === 'VALID',
      taskIdentity: pack.taskIdentity,
      contextIdentity: pack.contextIdentity,
      contextDigest: pack.contextDigest,
      policyVersion: pack.policyVersion,
      graphDigest: pack.graphDigest,
      toolPlanDigest: pack.toolPlanDigest,
      validationPlanDigest: pack.validationPlanDigest,
      capabilityIdentity: pack.capabilityIdentity,
    });
    return receipt;
  };

  if (drifts.length > 0) {
    return driftReceipt('STALE_CONTEXT', drifts.map(d => `STALE_CONTEXT: binding drift in ${d}`));
  }
  if (bindings.policyVersion !== pack.policyVersion) {
    return driftReceipt('STALE_POLICY', ['STALE_POLICY: policyVersion drift']);
  }
  if (current.currentCapabilityIdentity !== pack.capabilityIdentity) {
    return driftReceipt('CAPABILITY_MISMATCH', ['CAPABILITY_MISMATCH: executor capability drift']);
  }
  if (pack.workDag.length === 0 || pack.criticalPath.length === 0) {
    return driftReceipt('GRAPH_INVALID', ['GRAPH_INVALID: pack carries no executable work graph']);
  }

  // Integrity re-verification: recompute every sealed digest from payload.
  const graphDigest = computeWorkGraphDigest(
    {
      nodeIds: pack.workDag.map(n => n.instructionId),
      waves: pack.safeParallelWaves.map(w => [...w]),
      criticalPath: [...pack.criticalPath],
    },
    options,
  );
  if (!graphDigest.ok || graphDigest.value !== pack.graphDigest) {
    return {
      ok: true,
      value: integrityReceipt(pack, ['GRAPH_INVALID: work graph integrity drift detected']),
    };
  }
  const toolDigest = computeToolPlanDigest(
    pack.toolBlueprint.map(t => ({ ...t })),
    options,
  );
  if (!toolDigest.ok || toolDigest.value !== pack.toolPlanDigest) {
    return {
      ok: true,
      value: integrityReceipt(pack, ['GRAPH_INVALID: tool plan integrity drift detected']),
    };
  }
  const validationDigest = computeValidationPlanDigest(
    pack.validations.map(v => ({ ...v })),
    options,
  );
  if (!validationDigest.ok || validationDigest.value !== pack.validationPlanDigest) {
    return {
      ok: true,
      value: integrityReceipt(pack, ['GRAPH_INVALID: validation plan integrity drift detected']),
    };
  }
  const semanticDigest = computePackSemanticDigest(buildPackDigestInput(pack), options);
  if (!semanticDigest.ok || semanticDigest.value !== pack.semanticDigest) {
    return {
      ok: true,
      value: integrityReceipt(pack, ['GRAPH_INVALID: pack semantic digest drift detected']),
    };
  }

  return driftReceipt('VALID', []);
}

// ─── Prompt Entropy Reducer (PER) ─────────────────────────────────────────────

/**
 * Deterministic deduplication of redundant prose that fails closed: when any
 * mandatory obligation marker is missing after reduction, no successful
 * reduction is returned — a silent omission must never look like success.
 */
export function reducePromptEntropy(
  sections: readonly string[],
  mandatoryMarkers: readonly string[],
): Result<EntropyReductionResult> {
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
  const missing = mandatoryMarkers
    .filter(marker => !reduced.some(line => line.includes(marker)))
    .sort(compareCodePoint);
  if (missing.length > 0) {
    return fail(
      'PACK_ENTROPY_OBLIGATION_MISSING',
      `Entropy reduction dropped mandatory obligations: ${missing.join(', ')}`,
    );
  }
  const preservedMarkers = [...mandatoryMarkers].sort(compareCodePoint);
  return { ok: true, value: deepFreeze({ reduced, removedLines, preservedMarkers }) };
}

// ─── Pack Replay Contract (PRC) ───────────────────────────────────────────────

/**
 * Prove a replay candidate equivalent to the sealed execution pack from the
 * same admitted semantic inputs/bindings — never from a caller-provided
 * boolean. Bindings are compared field-by-field and the semantic digest is
 * recomputed from the candidate payload; any drift rejects replay.
 */
export function evaluatePackReplay(
  sealed: ExecutionPack,
  candidate: ExecutionPack,
  options: OperationOptions,
): ReplayEvaluation {
  if (candidate.packId !== sealed.packId) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: pack identity mismatch' });
  }
  const bindingPairs: ReadonlyArray<readonly [string, string, string]> = [
    ['taskIdentity', candidate.taskIdentity, sealed.taskIdentity],
    ['projectId', candidate.projectId, sealed.projectId],
    ['sourcePackIdentity', candidate.sourcePackIdentity, sealed.sourcePackIdentity],
    ['profileIdentity', candidate.profileIdentity, sealed.profileIdentity],
    ['profileDigest', candidate.profileDigest, sealed.profileDigest],
    ['policyVersion', candidate.policyVersion, sealed.policyVersion],
    ['checkpointIdentity', candidate.checkpointIdentity, sealed.checkpointIdentity],
    ['capabilityIdentity', candidate.capabilityIdentity, sealed.capabilityIdentity],
    ['contextIdentity', candidate.contextIdentity, sealed.contextIdentity],
    ['contextDigest', candidate.contextDigest, sealed.contextDigest],
  ];
  for (const [name, actual, expected] of bindingPairs) {
    if (actual !== expected) {
      return deepFreeze({ replayable: false, reason: `REJECTED: binding drift in ${name}` });
    }
  }
  const recomputed = computePackSemanticDigest(buildPackDigestInput(candidate), options);
  if (!recomputed.ok) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: digest recompute failed' });
  }
  if (recomputed.value !== sealed.semanticDigest) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: semantic digest drift' });
  }
  return deepFreeze({ replayable: true, reason: 'ACCEPTED: identical semantic digest with valid bindings' });
}
