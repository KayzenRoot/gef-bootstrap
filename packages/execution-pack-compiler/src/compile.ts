// M15 Execution Pack Compiler - compile.ts
// Top-level compileExecutionPack orchestrator: S01 → S02 → S03 → S04 → S05.
// Dependency-ordered, fail-closed. The first invalidated stage blocks the
// pack; no partial pack is ever sealed as VALID. RBS, AET and PER participate
// in compilation so unresolved branches, ambiguity or dropped obligations can
// never still produce a VALID pack.

import type {
  CompiledExecutionPack,
  CompileExecutionPackInput,
  Diagnostic,
  EvidenceSlot,
  ExecutionPack,
  NegativeSearchEntry,
  OperationOptions,
  Result,
} from './types.js';
import { cancelled, deepFreeze, fail, sortedStrings } from './utils.js';
import {
  buildInstructionProvenanceMap,
  checkNoDiscoveryBoundary,
  createExecutionPackEnvelope,
  issuePromptCompletenessCertificate,
  validateExecutorCapabilityContract,
} from './s01-pack-contract.js';
import {
  computeExecutableWorkDag,
  computeSafeParallelismMatrix,
  computeSemanticCriticalPath,
  createAtomicIncrementBoundary,
  suppressReasoningBranches,
} from './s02-work-graph.js';
import {
  buildGuardrailBindingTable,
  buildValidationClosureMatrix,
  createPostconditionEvidenceSlot,
  proveRollbackReadiness,
} from './s03-guardrails.js';
import {
  buildReadOnceContextIndex,
  buildToolInvocationBlueprint,
  createExecutorCognitionBudget,
  evaluateAmbiguityEscalation,
  recordNegativeSearch,
} from './s04-cognition.js';
import {
  buildExecutionPackReceipt,
  buildPackDigestInput,
  computePackSemanticDigest,
  computeToolPlanDigest,
  computeValidationPlanDigest,
  computeWorkGraphDigest,
  reducePromptEntropy,
} from './s05-receipt.js';

function asFailure<T>(result: { ok: false; diagnostics: readonly Diagnostic[] }): Result<T> {
  return result;
}

function sectionMissing(packId: string, section: string): Result<never> {
  return fail('PACK_SECTION_MISSING', `Pack section missing or empty: ${section}`, section);
}

/**
 * Compile an executor-ready pack from an admitted M14 capsule+handoff.
 * Consumes only VALID, ready handoffs whose digest binding matches the
 * capsule; binds task identity plus project/source/profile/policy/
 * checkpoint/capability exactly; seals the pack with a deterministic digest
 * over the full semantic payload.
 */
export function compileExecutionPack(
  input: CompileExecutionPackInput,
  options: OperationOptions,
): Result<CompiledExecutionPack> {
  const c = cancelled(options);
  if (c) return c;

  const packId = input.packId;
  const capsule = input.context.capsule;
  const handoff = input.context.handoff;

  // ── Admitted handoff gate: M14 validity + readiness, rechecked exactly ──
  if (handoff.capsuleSemanticDigest !== capsule.semanticDigest) {
    return fail(
      'PACK_CONTEXT_STALE',
      'Handoff capsule digest does not match the admitted capsule',
      capsule.semanticDigest,
    );
  }
  if (capsule.validity !== 'VALID' || handoff.capsuleValidity !== 'VALID') {
    return asFailure<CompiledExecutionPack>({
      ok: false,
      diagnostics: [
        {
          code: 'PACK_CONTEXT_STALE',
          message: `Admitted context ${capsule.semanticDigest} has validity ${capsule.validity}/${handoff.capsuleValidity}; only VALID capsules are consumable`,
          subject: capsule.semanticDigest,
        },
      ],
    });
  }
  if (!handoff.readyForM15Consumption || handoff.blockerCodes.length > 0) {
    return fail(
      'PACK_CONTEXT_NOT_READY',
      `Admitted context ${capsule.semanticDigest} is not ready for M15 consumption`,
      capsule.semanticDigest,
    );
  }
  const taskIdentity = capsule.taskIntentEnvelope.semanticIdentity;
  if (!taskIdentity || taskIdentity.trim().length === 0) {
    return fail('PACK_TASK_IDENTITY_MISSING', 'Admitted capsule carries no task identity', packId);
  }

  const bindings = {
    projectId: capsule.projectId,
    sourcePackIdentity: capsule.sourcePackIdentity,
    profileIdentity: capsule.profileIdentity,
    profileDigest: capsule.profileDigest,
    policyVersion: capsule.policyVersion,
    checkpointIdentity: capsule.checkpointIdentity,
    capabilityIdentity: input.requiredCapability.capabilityIdentity,
  };
  // M15 addresses admitted context by its Context Semantic Digest.
  const contextIdentity = capsule.semanticDigest;
  const contextDigest = capsule.semanticDigest;

  // ── S01: first-class pack sections (no checklist booleans) ──
  if (!input.objective || input.objective.trim().length === 0) return sectionMissing(packId, 'objective');
  if (input.constraints.length === 0) return sectionMissing(packId, 'constraints');
  if (input.allowedMutations.length === 0) return sectionMissing(packId, 'allowedMutations');
  if (input.forbiddenMutations.length === 0) return sectionMissing(packId, 'forbiddenMutations');
  if (input.proofObligations.length === 0) return sectionMissing(packId, 'proofObligations');
  if (!input.stopCondition || input.stopCondition.trim().length === 0) {
    return sectionMissing(packId, 'stopCondition');
  }
  if (!input.handbackSchema || input.handbackSchema.trim().length === 0) {
    return sectionMissing(packId, 'handbackSchema');
  }

  // Allowed/forbidden mutation enforcement: every declared mutation domain
  // must be explicitly allowed and must not be forbidden.
  const allowed = new Set(input.allowedMutations);
  const forbidden = new Set(input.forbiddenMutations);
  for (const instruction of input.instructions) {
    for (const domain of instruction.mutationDomains) {
      if (forbidden.has(domain)) {
        return fail(
          'PACK_MUTATION_NOT_PERMITTED',
          `Instruction ${instruction.instructionId} uses forbidden mutation domain ${domain}`,
          domain,
        );
      }
      if (!allowed.has(domain)) {
        return fail(
          'PACK_MUTATION_NOT_PERMITTED',
          `Instruction ${instruction.instructionId} uses mutation domain ${domain} outside allowedMutations`,
          domain,
        );
      }
    }
  }

  const envelope = createExecutionPackEnvelope(
    { packId, taskIdentity, ...bindings, contextIdentity },
    options,
  );
  if (!envelope.ok) return envelope;

  const provenance = buildInstructionProvenanceMap(input.instructions, input.provenanceEntries);
  if (!provenance.ok) return provenance;

  const capability = validateExecutorCapabilityContract(input.requiredCapability, input.capabilityOffer);
  if (!capability.ok) return capability;

  // Executor topics are the instruction objectives; they must respect the NDB.
  const ndb = checkNoDiscoveryBoundary(
    input.instructions.map(i => i.objective),
    input.noDiscoveryBoundary,
  );
  if (!ndb.ok) return ndb;

  // RBS participates: escalated branches block compilation.
  const branches = suppressReasoningBranches(input.reasoningBranches);
  if (branches.escalated.length > 0) {
    return fail(
      'PACK_REASONING_BRANCH_UNRESOLVED',
      `Unresolved reasoning branches block compilation: ${branches.escalated.join(', ')}`,
      branches.escalated[0],
    );
  }

  // AET participates: authority-requiring ambiguity cannot yield a VALID pack.
  const ambiguity = evaluateAmbiguityEscalation(input.ambiguities);
  if (!ambiguity.ok) return ambiguity;

  // ── S02: work DAG, critical path, safe parallelism ──
  const dag = computeExecutableWorkDag(input.instructions, options);
  if (!dag.ok) return dag;

  const criticalPath = computeSemanticCriticalPath(input.instructions, options);
  if (!criticalPath.ok) return criticalPath;
  const criticalSet = new Set(criticalPath.value);
  const workDag = dag.value.nodes.map(node => ({
    ...node,
    critical: criticalSet.has(node.instructionId),
  }));

  const waves = computeSafeParallelismMatrix(dag.value.waves, input.instructions);
  if (!waves.ok) return waves;

  // ── S03: guardrails, validation closure, rollback, evidence slots ──
  const guardrailTable = buildGuardrailBindingTable(
    dag.value.order,
    input.guardrailBindings,
  );
  if (!guardrailTable.ok) return guardrailTable;

  const closures = buildValidationClosureMatrix(input.instructions, input.validations);
  if (!closures.ok) return closures;

  const rollbacks = proveRollbackReadiness(input.instructions);
  if (!rollbacks.ok) return rollbacks;

  const slotResults: EvidenceSlot[] = [];
  for (const nodeId of dag.value.order) {
    const slot = createPostconditionEvidenceSlot(
      `pes-${nodeId}`,
      nodeId,
      `Postcondition evidence for ${nodeId}`,
    );
    if (!slot.ok) return slot;
    slotResults.push(slot.value);
  }

  const increments = createAtomicIncrementBoundary(waves.value, slotResults);

  // ── S04: cognition budget, tool blueprint, bound ROCI, validity-bound NSL ──
  const budget = createExecutorCognitionBudget(input.cognitionBudget);
  if (!budget.ok) return budget;

  const blueprint = buildToolInvocationBlueprint(input.toolBlueprint);
  if (!blueprint.ok) return blueprint;

  const roci = buildReadOnceContextIndex(input.readOnceEntries, contextIdentity);
  if (!roci.ok) return roci;

  let ledger: readonly NegativeSearchEntry[] = [];
  for (const entry of input.negativeSearchLedger) {
    ledger = recordNegativeSearch(ledger, entry.query, entry.fingerprint, entry.contextIdentity);
  }

  // ── PER participates: dropped obligations block compilation ──
  const entropy = reducePromptEntropy(input.promptSections, input.obligationMarkers);
  if (!entropy.ok) return entropy;

  // ── Assemble the pack; PCC is derived from the pack itself ──
  const assembled: ExecutionPack = {
    packId,
    taskIdentity,
    ...bindings,
    contextIdentity,
    contextDigest,
    objective: input.objective,
    constraints: [...input.constraints],
    allowedMutations: [...input.allowedMutations],
    forbiddenMutations: [...input.forbiddenMutations],
    proofObligations: [...input.proofObligations],
    stopCondition: input.stopCondition,
    handbackSchema: input.handbackSchema,
    instructions: input.instructions.map(i => ({ ...i })),
    workDag,
    criticalPath: [...criticalPath.value],
    safeParallelWaves: waves.value.map(w => [...w]),
    validations: input.validations.map(v => ({ ...v })),
    readOnceIndex: { contextIdentity: roci.value.contextIdentity, entries: { ...roci.value.entries } },
    negativeSearchLedger: [...ledger],
    toolBlueprint: blueprint.value.map(t => ({ ...t })),
    cognitionBudget: { ...budget.value.limits },
    noDiscoveryBoundary: sortedStrings(input.noDiscoveryBoundary),
    guardrailBindings: sortedStrings(guardrailTable.value.flatMap(g => [...g.policyIds])),
    evidenceSlots: sortedStrings(slotResults.map(s => s.slotId)),
    rollbackProofs: rollbacks.value.map(r => ({ ...r })),
    reducedPrompt: [...entropy.value.reduced],
    graphDigest: '',
    toolPlanDigest: '',
    validationPlanDigest: '',
    semanticDigest: '',
    provenanceMap: provenance.value.map(p => ({ ...p })),
    completenessCertificate: { packId, complete: true as const, missingItems: [] },
  };

  const certificate = issuePromptCompletenessCertificate(assembled);
  if (!certificate.ok) return certificate;

  // ── S05: sub-digests, semantic digest, sealed receipt ──
  const graphDigest = computeWorkGraphDigest(
    {
      nodeIds: dag.value.order,
      waves: waves.value.map(w => [...w]),
      criticalPath: [...criticalPath.value],
    },
    options,
  );
  if (!graphDigest.ok) return graphDigest;

  const toolDigest = computeToolPlanDigest(
    blueprint.value.map(t => ({ ...t })),
    options,
  );
  if (!toolDigest.ok) return toolDigest;

  const validationDigest = computeValidationPlanDigest(
    input.validations.map(v => ({ ...v })),
    options,
  );
  if (!validationDigest.ok) return validationDigest;

  const pack: ExecutionPack = deepFreeze({
    ...assembled,
    graphDigest: graphDigest.value,
    toolPlanDigest: toolDigest.value,
    validationPlanDigest: validationDigest.value,
    semanticDigest: '',
    completenessCertificate: { ...certificate.value },
  });

  const digest = computePackSemanticDigest(buildPackDigestInput(pack), options);
  if (!digest.ok) return digest;

  const sealed: ExecutionPack = deepFreeze({ ...pack, semanticDigest: digest.value });

  const receipt = buildExecutionPackReceipt({
    packId,
    status: 'VALID',
    semanticDigest: digest.value,
    diagnostics: [],
    replayable: true,
    taskIdentity,
    contextIdentity,
    contextDigest,
    policyVersion: bindings.policyVersion,
    graphDigest: graphDigest.value,
    toolPlanDigest: toolDigest.value,
    validationPlanDigest: validationDigest.value,
    capabilityIdentity: bindings.capabilityIdentity,
  });
  if (!receipt.ok) return receipt;

  return {
    ok: true,
    value: deepFreeze({
      pack: sealed,
      receipt: receipt.value,
      envelope: envelope.value,
      provenanceMap: provenance.value,
      certificate: certificate.value,
      guardrailTable: guardrailTable.value,
      validationClosures: closures.value,
      rollbackProofs: rollbacks.value,
      evidenceSlots: slotResults,
      criticalPath: criticalPath.value,
      waves: waves.value,
      increments,
    }),
  };
}
