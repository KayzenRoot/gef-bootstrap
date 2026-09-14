// M15 Execution Pack Compiler - compile.ts
// Top-level compileExecutionPack orchestrator: S01 → S02 → S03 → S04 → S05.
// Dependency-ordered, fail-closed. The first invalidated stage blocks the
// pack; no partial pack is ever sealed as VALID.

import type {
  AdmittedContextInput,
  CompiledExecutionPack,
  CompileExecutionPackInput,
  Diagnostic,
  EvidenceSlot,
  ExecutionPack,
  OperationOptions,
  PackReceipt,
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
  recordNegativeSearch,
} from './s04-cognition.js';
import {
  buildExecutionPackReceipt,
  computePackSemanticDigest,
  statusForDiagnosticCode,
} from './s05-receipt.js';

/** Map an admitted M14 handoff to its terminal failure receipt inputs. */
function receiptForFailure(
  packId: string,
  diagnostics: readonly { code: string; message: string; subject?: string | undefined }[],
): PackReceipt {
  const first = diagnostics[0];
  const status = statusForDiagnosticCode(first?.code ?? 'UNKNOWN');
  return deepFreeze({
    packId,
    status,
    semanticDigest: 'sha256:' + '0'.repeat(64),
    diagnostics: diagnostics.map(d => `${d.code}: ${d.message}`),
    replayable: false,
  });
}

function asFailure<T>(result: { ok: false; diagnostics: readonly Diagnostic[] }): Result<T> {
  return result;
}

/**
 * Compile an executor-ready pack from an admitted M14 context.
 * Consumes only VALID, ready handoffs; binds project/source/profile/policy/
 * checkpoint/capability exactly; seals the pack with a deterministic digest.
 */
export function compileExecutionPack(
  input: CompileExecutionPackInput,
  options: OperationOptions,
): Result<CompiledExecutionPack> {
  const c = cancelled(options);
  if (c) return c;

  const packId = input.packId;
  const context: AdmittedContextInput = input.context;

  // ── Admitted handoff gate: only VALID, ready M14 capsules are consumable ──
  if (context.contextValidity !== 'VALID') {
    return asFailure<CompiledExecutionPack>({
      ok: false,
      diagnostics: [
        {
          code: 'PACK_CONTEXT_STALE',
          message: `Admitted context ${context.contextIdentity} has validity ${context.contextValidity}; only VALID capsules are consumable`,
          subject: context.contextIdentity,
        },
      ],
    });
  }
  if (!context.readyForConsumption) {
    return fail(
      'PACK_CONTEXT_NOT_READY',
      `Admitted context ${context.contextIdentity} is not ready for M15 consumption`,
      context.contextIdentity,
    );
  }

  // ── S01: envelope, provenance, capability, completeness, NDB ──
  const envelope = createExecutionPackEnvelope(
    {
      packId,
      projectId: context.projectId,
      sourcePackIdentity: context.sourcePackIdentity,
      profileIdentity: context.profileIdentity,
      profileDigest: context.profileDigest,
      policyVersion: context.policyVersion,
      checkpointIdentity: context.checkpointIdentity,
      capabilityIdentity: context.capabilityIdentity,
      contextIdentity: context.contextIdentity,
    },
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

  // ── S04: cognition budget, tool blueprint, ROCI, NSL ──
  const budget = createExecutorCognitionBudget(input.cognitionBudget);
  if (!budget.ok) return budget;

  const blueprint = buildToolInvocationBlueprint(input.toolBlueprint);
  if (!blueprint.ok) return blueprint;

  const roci = buildReadOnceContextIndex(input.readOnceEntries);
  if (!roci.ok) return roci;

  let ledger: readonly string[] = Object.freeze([...input.negativeSearchLedger]);
  for (const query of input.negativeSearchLedger) {
    ledger = recordNegativeSearch(ledger, query);
  }

  // ── S01 (close): completeness certificate over the compiled pack ──
  const certificate = issuePromptCompletenessCertificate(packId, input.checklist);
  if (!certificate.ok) return certificate;

  // ── S05: semantic digest + receipt ──
  const digest = computePackSemanticDigest(
    {
      packId,
      projectId: context.projectId,
      sourcePackIdentity: context.sourcePackIdentity,
      profileIdentity: context.profileIdentity,
      profileDigest: context.profileDigest,
      policyVersion: context.policyVersion,
      checkpointIdentity: context.checkpointIdentity,
      capabilityIdentity: context.capabilityIdentity,
      contextIdentity: context.contextIdentity,
      instructionIdentities: dag.value.order,
      criticalPath: [...criticalPath.value],
      waves: waves.value.map(w => [...w]),
      validationIds: sortedStrings(input.validations.map(v => v.validationId)),
      guardrailPolicyIds: sortedStrings(guardrailTable.value.flatMap(g => [...g.policyIds])),
      toolKeys: blueprint.value.map(t => `${t.tool}:${t.purpose}`),
    },
    options,
  );
  if (!digest.ok) return digest;

  const pack: ExecutionPack = deepFreeze({
    packId,
    projectId: context.projectId,
    sourcePackIdentity: context.sourcePackIdentity,
    profileIdentity: context.profileIdentity,
    profileDigest: context.profileDigest,
    policyVersion: context.policyVersion,
    checkpointIdentity: context.checkpointIdentity,
    capabilityIdentity: context.capabilityIdentity,
    contextIdentity: context.contextIdentity,
    instructions: input.instructions.map(i => ({ ...i })),
    workDag,
    criticalPath: [...criticalPath.value],
    safeParallelWaves: waves.value.map(w => [...w]),
    validations: input.validations.map(v => ({ ...v })),
    readOnceIndex: { ...roci.value.entries },
    negativeSearchLedger: [...ledger],
    toolBlueprint: blueprint.value.map(t => ({ ...t })),
    cognitionBudget: { ...budget.value.limits },
    noDiscoveryBoundary: sortedStrings(input.noDiscoveryBoundary),
    guardrailBindings: sortedStrings(guardrailTable.value.flatMap(g => [...g.policyIds])),
    evidenceSlots: sortedStrings(slotResults.map(s => s.slotId)),
    semanticDigest: digest.value,
    provenanceMap: provenance.value.map(p => ({ ...p })),
    completenessCertificate: { ...certificate.value },
  });

  const receipt = buildExecutionPackReceipt({
    packId,
    status: 'VALID',
    semanticDigest: digest.value,
    diagnostics: [],
    replayable: true,
  });
  if (!receipt.ok) return receipt;

  return {
    ok: true,
    value: deepFreeze({
      pack,
      receipt: receipt.value,
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

export { receiptForFailure };
