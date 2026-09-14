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
  GuardrailBinding,
  OperationOptions,
  PackReceipt,
  PackSemanticDigestInput,
  PackStatus,
  ReplayEvaluation,
  Result,
  SealedDigests,
  ToolInvocation,
  ValidationRequirement,
  WorkNode,
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
 * Rebuild the digest input from a sealed pack. Seals every first-class M15
 * control: pack sections, instruction/graph/validation/tool payloads, the
 * canonical guardrail node-to-policy mapping, NDB, bound ROCI, validity-bound
 * NSL, cognition budget, provenance, rollback proofs, evidence slots and the
 * completeness certificate assertions. Used both at seal time and by
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
    guardrailMappingPayloads: sortedStrings(
      pack.guardrailTable.map(g => payloadOf({
        nodeId: g.nodeId,
        policyIds: sortedStrings(g.policyIds),
      } as GuardrailBinding)),
    ),
    toolPayloads: sortedStrings(pack.toolBlueprint.map(t => payloadOf({ ...t }))),
    reducedPrompt: [...pack.reducedPrompt],
    noDiscoveryBoundary: sortedStrings(pack.noDiscoveryBoundary),
    readOnceIdentity: pack.readOnceIndex.contextIdentity,
    readOncePayloads: sortedStrings(
      Object.keys(pack.readOnceIndex.entries)
        .sort(compareCodePoint)
        .map(key => payloadOf({
          key,
          values: sortedStrings(pack.readOnceIndex.entries[key] ?? []),
        })),
    ),
    negativeSearchPayloads: sortedStrings(pack.negativeSearchLedger.map(e => payloadOf({ ...e }))),
    cognitionBudgetPayload: payloadOf({ ...pack.cognitionBudget }),
    provenancePayloads: sortedStrings(pack.provenanceMap.map(p => payloadOf({ ...p }))),
    rollbackPayloads: sortedStrings(pack.rollbackProofs.map(r => payloadOf({ ...r }))),
    evidenceSlotIds: sortedStrings(pack.evidenceSlots),
    completenessPayload: payloadOf({ ...pack.completenessCertificate }),
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
    guardrailMappingPayloads: sortedStrings(input.guardrailMappingPayloads),
    toolPayloads: sortedStrings(input.toolPayloads),
    reducedPrompt: [...input.reducedPrompt],
    noDiscoveryBoundary: sortedStrings(input.noDiscoveryBoundary),
    readOnceIdentity: input.readOnceIdentity,
    readOncePayloads: sortedStrings(input.readOncePayloads),
    negativeSearchPayloads: sortedStrings(input.negativeSearchPayloads),
    cognitionBudgetPayload: input.cognitionBudgetPayload,
    provenancePayloads: sortedStrings(input.provenancePayloads),
    rollbackPayloads: sortedStrings(input.rollbackPayloads),
    evidenceSlotIds: sortedStrings(input.evidenceSlotIds),
    completenessPayload: input.completenessPayload,
  };
  return sha(options, normalized);
}

/**
 * Digest over the semantic executable graph: full work-node payloads
 * (preconditions, mutationSpec, validation references, rollback hook and
 * readiness reference, evidence outputs) plus waves and critical path.
 * Semantics, not bare topology — changing what a node declares changes
 * the digest even when order is untouched.
 */
export function computeWorkGraphDigest(
  input: { nodes: readonly WorkNode[]; waves: readonly (readonly string[])[]; criticalPath: readonly string[] },
  options: OperationOptions,
): Result<string> {
  const c = cancelled(options);
  if (c) return c;
  return sha(options, {
    nodes: sortedStrings(input.nodes.map(n => payloadOf({ ...n }))),
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

// ─── Shared receipt-rooted verification primitives ────────────────────────────
// PIDS and PRC both verify through these primitives so the two mechanisms
// cannot drift apart into duplicate weaker paths.

/**
 * Recompute all four sealed digests from a candidate pack payload as one
 * unit. Never trusts stored digest fields.
 */
export function computeSealedDigests(
  pack: ExecutionPack,
  options: OperationOptions,
): Result<SealedDigests> {
  const graphDigest = computeWorkGraphDigest(
    {
      nodes: pack.workDag.map(n => ({ ...n })),
      waves: pack.safeParallelWaves.map(w => [...w]),
      criticalPath: [...pack.criticalPath],
    },
    options,
  );
  if (!graphDigest.ok) return graphDigest;
  const toolDigest = computeToolPlanDigest(
    pack.toolBlueprint.map(t => ({ ...t })),
    options,
  );
  if (!toolDigest.ok) return toolDigest;
  const validationDigest = computeValidationPlanDigest(
    pack.validations.map(v => ({ ...v })),
    options,
  );
  if (!validationDigest.ok) return validationDigest;
  const semanticDigest = computePackSemanticDigest(buildPackDigestInput(pack), options);
  if (!semanticDigest.ok) return semanticDigest;
  return {
    ok: true,
    value: deepFreeze({
      graphDigest: graphDigest.value,
      toolPlanDigest: toolDigest.value,
      validationPlanDigest: validationDigest.value,
      semanticDigest: semanticDigest.value,
    }),
  };
}

/** Names of sealed digests where recomputed and trusted values diverge. */
export function findSealedDigestDrift(
  recomputed: SealedDigests,
  trusted: SealedDigests,
): readonly string[] {
  const drift: string[] = [];
  if (recomputed.graphDigest !== trusted.graphDigest) drift.push('graph');
  if (recomputed.toolPlanDigest !== trusted.toolPlanDigest) drift.push('toolPlan');
  if (recomputed.validationPlanDigest !== trusted.validationPlanDigest) drift.push('validationPlan');
  if (recomputed.semanticDigest !== trusted.semanticDigest) drift.push('semantic');
  return drift;
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
    case 'PACK_TRUST_ANCHOR_MISSING':
    default:
      return 'INDETERMINATE';
  }
}

// ─── Pre-Invocation Drift Sentinel (PIDS) ─────────────────────────────────────

/**
 * Build a non-VALID verdict receipt from the trusted anchor's own digests.
 * The verdict never echoes candidate-carried digests as trusted evidence.
 */
function anchoredVerdict(
  trusted: PackReceipt,
  status: PackStatus,
  diagnostics: readonly string[],
): Result<PackReceipt> {
  return buildExecutionPackReceipt({
    packId: trusted.packId,
    status,
    semanticDigest: trusted.semanticDigest,
    diagnostics: [...diagnostics],
    replayable: false,
    taskIdentity: trusted.taskIdentity,
    contextIdentity: trusted.contextIdentity,
    contextDigest: trusted.contextDigest,
    policyVersion: trusted.policyVersion,
    graphDigest: trusted.graphDigest,
    toolPlanDigest: trusted.toolPlanDigest,
    validationPlanDigest: trusted.validationPlanDigest,
    capabilityIdentity: trusted.capabilityIdentity,
  });
}

/**
 * Recheck bindings AND pack integrity immediately before execution, rooted
 * in the trusted Execution Pack Receipt — never in the candidate pack's own
 * stored digests. Comparing recomputed identities only against
 * candidatePack.semanticDigest would be self-authentication: a persisted
 * pack whose payload and internal checksum were both altered would still be
 * accepted. Here every recomputed identity must match the independent
 * trusted receipt before VALID is returned.
 *
 * A missing trusted anchor (or a pack/anchor identity mismatch) never falls
 * back to the candidate digest; it fails closed as INDETERMINATE.
 */
export function checkPreInvocationDrift(
  candidate: ExecutionPack,
  trusted: PackReceipt | null | undefined,
  current: DriftCheckInput,
  options: OperationOptions,
): Result<PackReceipt> {
  if (trusted === null || trusted === undefined || trusted.packId !== candidate.packId) {
    return fail(
      'PACK_TRUST_ANCHOR_MISSING',
      'Pre-invocation check requires the independent trusted receipt; candidate-carried digests are not a trust anchor',
      candidate.packId,
    );
  }

  const drifts: string[] = [];
  if (current.currentTaskIdentity !== trusted.taskIdentity) drifts.push('taskIdentity');
  if (current.currentBindings.projectId !== candidate.projectId) drifts.push('projectId');
  if (current.currentBindings.sourcePackIdentity !== candidate.sourcePackIdentity) {
    drifts.push('sourcePackIdentity');
  }
  if (current.currentBindings.profileIdentity !== candidate.profileIdentity) drifts.push('profileIdentity');
  if (current.currentBindings.profileDigest !== candidate.profileDigest) drifts.push('profileDigest');
  if (current.currentBindings.checkpointIdentity !== candidate.checkpointIdentity) {
    drifts.push('checkpointIdentity');
  }
  if (current.currentBindings.contextIdentity !== trusted.contextIdentity) drifts.push('contextIdentity');
  if (current.currentBindings.contextDigest !== trusted.contextDigest) drifts.push('contextDigest');

  if (drifts.length > 0) {
    return anchoredVerdict(trusted, 'STALE_CONTEXT', drifts.map(d => `STALE_CONTEXT: binding drift in ${d}`));
  }
  if (current.currentBindings.policyVersion !== trusted.policyVersion) {
    return anchoredVerdict(trusted, 'STALE_POLICY', ['STALE_POLICY: policyVersion drift']);
  }
  if (current.currentCapabilityIdentity !== trusted.capabilityIdentity) {
    return anchoredVerdict(trusted, 'CAPABILITY_MISMATCH', ['CAPABILITY_MISMATCH: executor capability drift']);
  }
  if (candidate.workDag.length === 0 || candidate.criticalPath.length === 0) {
    return anchoredVerdict(trusted, 'GRAPH_INVALID', ['GRAPH_INVALID: pack carries no executable work graph']);
  }

  // Integrity re-verification against the trusted anchor.
  const recomputed = computeSealedDigests(candidate, options);
  if (!recomputed.ok) return recomputed;
  const drift = findSealedDigestDrift(recomputed.value, {
    graphDigest: trusted.graphDigest,
    toolPlanDigest: trusted.toolPlanDigest,
    validationPlanDigest: trusted.validationPlanDigest,
    semanticDigest: trusted.semanticDigest,
  });
  if (drift.length > 0) {
    return anchoredVerdict(
      trusted,
      'GRAPH_INVALID',
      [`GRAPH_INVALID: sealed digest drift in ${drift.join(', ')} against the trusted receipt`],
    );
  }

  return { ok: true, value: trusted };
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
 * Prove a replay candidate equivalent to the trusted sealed semantics through
 * the same receipt-rooted primitives as PIDS — never through a duplicate
 * weaker path or a caller-provided boolean. The candidate payload digests
 * are recomputed and compared against the trusted receipt; any drift,
 * including binding drift (bindings are sealed inside the PSD), rejects
 * replay deterministically.
 */
export function evaluatePackReplay(
  trusted: PackReceipt,
  candidate: ExecutionPack,
  options: OperationOptions,
): ReplayEvaluation {
  if (candidate.packId !== trusted.packId) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: pack identity mismatch' });
  }
  const recomputed = computeSealedDigests(candidate, options);
  if (!recomputed.ok) {
    return deepFreeze({ replayable: false, reason: 'REJECTED: digest recompute failed' });
  }
  const drift = findSealedDigestDrift(recomputed.value, {
    graphDigest: trusted.graphDigest,
    toolPlanDigest: trusted.toolPlanDigest,
    validationPlanDigest: trusted.validationPlanDigest,
    semanticDigest: trusted.semanticDigest,
  });
  if (drift.length > 0) {
    return deepFreeze({ replayable: false, reason: `REJECTED: sealed digest drift in ${drift.join(', ')}` });
  }
  return deepFreeze({ replayable: true, reason: 'ACCEPTED: identical sealed digests against the trusted receipt' });
}
