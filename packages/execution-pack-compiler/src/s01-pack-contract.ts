// M15 Execution Pack Compiler - s01-pack-contract.ts
// S01: Execution Pack Envelope (EPE), Instruction Provenance Map (IPM),
//      Executor Capability Contract (ECC), Prompt Completeness Certificate (PCC),
//      No-Discovery Boundary (NDB).
// Deterministic, read-only, startup-pure. No filesystem/network/Git mutation.

import type {
  Binding,
  ExecutableInstruction,
  ExecutionPack,
  ExecutionPackEnvelope,
  ExecutorCapabilityContract,
  ExecutorCapabilityOffer,
  OperationOptions,
  PromptCompletenessCertificate,
  ProvenanceEntry,
  Result,
  RollbackProof,
} from './types.js';
import { compareCodePoint, deepFreeze, fail, cancelled, sha, sortedStrings, validId } from './utils.js';

function validateBindingPresence(input: Binding, subject: string): string | null {
  if (!validId(input.projectId)) return `${subject}: invalid projectId`;
  if (!input.sourcePackIdentity) return `${subject}: missing sourcePackIdentity`;
  if (!input.profileIdentity) return `${subject}: missing profileIdentity`;
  if (!input.profileDigest) return `${subject}: missing profileDigest`;
  if (!input.policyVersion) return `${subject}: missing policyVersion`;
  if (!input.checkpointIdentity) return `${subject}: missing checkpointIdentity`;
  if (!input.capabilityIdentity) return `${subject}: missing capabilityIdentity`;
  return null;
}

// ─── Execution Pack Envelope (EPE) ────────────────────────────────────────────

/**
 * Create the versioned immutable pack envelope binding the actual M14 task
 * identity in addition to context/policy/profile/project/capability.
 * A pack without task identity is unaddressable and invalid.
 */
export function createExecutionPackEnvelope(
  input: Binding & { packId: string; taskIdentity: string; contextIdentity: string },
  options: OperationOptions,
): Result<ExecutionPackEnvelope> {
  const c = cancelled(options);
  if (c) return c;

  if (!validId(input.packId)) {
    return fail('PACK_BINDING_INVALID', 'packId is invalid or empty', input.packId);
  }
  if (!input.taskIdentity || input.taskIdentity.trim().length === 0) {
    return fail(
      'PACK_TASK_IDENTITY_MISSING',
      'EPE requires the admitted M14 task identity (TIE semantic identity)',
      input.packId,
    );
  }
  if (!input.contextIdentity) {
    return fail('PACK_BINDING_INVALID', 'contextIdentity is required', input.packId);
  }
  const bindingError = validateBindingPresence(input, input.packId);
  if (bindingError) {
    return fail('PACK_BINDING_INVALID', bindingError, input.packId);
  }

  const digestResult = sha(options, {
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
  });
  if (!digestResult.ok) return digestResult;

  return {
    ok: true,
    value: deepFreeze({
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
      envelopeDigest: digestResult.value,
    }),
  };
}

// ─── Instruction Provenance Map (IPM) ─────────────────────────────────────────

export function buildInstructionProvenanceMap(
  instructions: readonly ExecutableInstruction[],
  entries: readonly ProvenanceEntry[],
): Result<readonly ProvenanceEntry[]> {
  const known = new Set(instructions.map(i => i.instructionId));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!known.has(entry.instructionId)) {
      return fail(
        'PACK_PROVENANCE_UNKNOWN_INSTRUCTION',
        `Provenance entry targets unknown instruction ${entry.instructionId}`,
        entry.instructionId,
      );
    }
    if (seen.has(entry.instructionId)) {
      return fail(
        'PACK_PROVENANCE_UNKNOWN_INSTRUCTION',
        `Duplicate provenance entry for instruction ${entry.instructionId}`,
        entry.instructionId,
      );
    }
    seen.add(entry.instructionId);
  }
  for (const instruction of instructions) {
    if (!seen.has(instruction.instructionId)) {
      return fail(
        'PACK_PROVENANCE_MISSING',
        `Instruction ${instruction.instructionId} has no provenance entry`,
        instruction.instructionId,
      );
    }
  }
  for (const entry of entries) {
    if (entry.authorityRefs.length === 0 && entry.decisionRefs.length === 0) {
      return fail(
        'PACK_PROVENANCE_MISSING',
        `Provenance entry for instruction ${entry.instructionId} has no authority or decision ref`,
        entry.instructionId,
      );
    }
  }
  const frozen = deepFreeze(
    [...entries]
      .sort((a, b) => compareCodePoint(a.instructionId, b.instructionId))
      .map(entry => ({
        instructionId: entry.instructionId,
        authorityRefs: sortedStrings(entry.authorityRefs),
        decisionRefs: sortedStrings(entry.decisionRefs),
      })),
  );
  return { ok: true, value: frozen };
}

// ─── Executor Capability Contract (ECC) ───────────────────────────────────────

/**
 * Validate the executor offer against every required ECC dimension:
 * identity, capabilities, tools, mutation permissions, disallowed
 * (forbidden/unavailable) capabilities, sandbox assumptions and parallelism
 * limits. Any violated dimension fails closed.
 */
export function validateExecutorCapabilityContract(
  required: ExecutorCapabilityContract,
  offer: ExecutorCapabilityOffer,
): Result<ExecutorCapabilityOffer> {
  if (!required.capabilityIdentity || !offer.capabilityIdentity) {
    return fail('PACK_CAPABILITY_MISSING', 'Capability identity is required');
  }
  if (required.capabilityIdentity !== offer.capabilityIdentity) {
    return fail(
      'PACK_CAPABILITY_MISMATCH',
      `Capability identity mismatch: required ${required.capabilityIdentity} but offered ${offer.capabilityIdentity}`,
      offer.capabilityIdentity,
    );
  }
  for (const capability of required.capabilities) {
    if (!offer.capabilities.includes(capability)) {
      return fail('PACK_CAPABILITY_MISSING', `Missing required capability: ${capability}`, capability);
    }
  }
  for (const tool of required.tools) {
    if (!offer.tools.includes(tool)) {
      return fail('PACK_CAPABILITY_MISSING', `Missing required tool: ${tool}`, tool);
    }
  }
  for (const permission of required.requiredMutationPermissions) {
    if (!offer.mutationPermissions.includes(permission)) {
      return fail(
        'PACK_CAPABILITY_MISSING',
        `Missing required mutation permission: ${permission}`,
        permission,
      );
    }
  }
  const disallowed = [...required.forbiddenCapabilities, ...required.unavailableCapabilities];
  const offeredSurfaces = [...offer.capabilities, ...offer.tools, ...offer.mutationPermissions];
  for (const banned of disallowed) {
    if (offeredSurfaces.includes(banned)) {
      return fail(
        'PACK_FORBIDDEN_CAPABILITY_OFFERED',
        `Offered surface includes disallowed capability: ${banned}`,
        banned,
      );
    }
  }
  for (const assumption of required.sandboxAssumptions) {
    if (!offer.sandboxCapabilities.includes(assumption)) {
      return fail(
        'PACK_SANDBOX_MISMATCH',
        `Sandbox assumption not satisfied: ${assumption}`,
        assumption,
      );
    }
  }
  if (!Number.isInteger(required.maxParallelism) || required.maxParallelism < 1) {
    return fail('PACK_CAPABILITY_MISSING', 'Required maxParallelism must be a positive integer');
  }
  if (offer.maxParallelism !== undefined) {
    if (!Number.isInteger(offer.maxParallelism) || offer.maxParallelism < 1) {
      return fail('PACK_CAPABILITY_MISSING', 'Offered maxParallelism must be a positive integer');
    }
    if (offer.maxParallelism > required.maxParallelism) {
      return fail(
        'PACK_PARALLELISM_EXCEEDED',
        `Offered parallelism ${offer.maxParallelism} exceeds allowed ${required.maxParallelism}`,
        String(offer.maxParallelism),
      );
    }
  }
  return {
    ok: true,
    value: deepFreeze({
      capabilityIdentity: offer.capabilityIdentity,
      capabilities: sortedStrings(offer.capabilities),
      tools: sortedStrings(offer.tools),
      mutationPermissions: sortedStrings(offer.mutationPermissions),
      sandboxCapabilities: sortedStrings(offer.sandboxCapabilities),
      ...(offer.maxParallelism === undefined ? {} : { maxParallelism: offer.maxParallelism }),
    }),
  };
}

// ─── Prompt Completeness Certificate (PCC) ────────────────────────────────────

/**
 * Derive the readiness certificate from the compiled pack itself — never from
 * caller assertions. Any mandatory section absent or empty fails closed, so
 * the certificate cannot self-certify missing fields.
 */
export function issuePromptCompletenessCertificate(
  pack: ExecutionPack,
): Result<PromptCompletenessCertificate> {
  if (!validId(pack.packId)) {
    return fail('PACK_BINDING_INVALID', 'packId is invalid or empty', pack.packId);
  }
  const missing: string[] = [];
  if (!pack.objective || pack.objective.trim().length === 0) missing.push('objective');
  if (pack.constraints.length === 0) missing.push('constraints');
  if (pack.allowedMutations.length === 0) missing.push('allowedMutations');
  if (pack.forbiddenMutations.length === 0) missing.push('forbiddenMutations');
  if (pack.instructions.length === 0 || pack.workDag.length === 0) missing.push('workGraph');
  if (pack.validations.length === 0) missing.push('validations');
  if (pack.proofObligations.length === 0) missing.push('proofObligations');
  if (!pack.stopCondition || pack.stopCondition.trim().length === 0) missing.push('stopCondition');
  if (!pack.handbackSchema || pack.handbackSchema.trim().length === 0) missing.push('handback');
  if (pack.evidenceSlots.length === 0) missing.push('evidenceSlots');
  if (pack.noDiscoveryBoundary.length === 0) missing.push('noDiscoveryBoundary');

  const mutating = pack.instructions.filter(i => i.mutationDomains.length > 0);
  const proven = new Set(pack.rollbackProofs.map((p: RollbackProof) => p.instructionId));
  const unproven = mutating.filter(i => !proven.has(i.instructionId));
  if (unproven.length > 0) missing.push('rollback');

  const provenanced = new Set(pack.provenanceMap.map(p => p.instructionId));
  const orphaned = pack.instructions.filter(i => {
    const entry = pack.provenanceMap.find(p => p.instructionId === i.instructionId);
    return !provenanced.has(i.instructionId) || entry === undefined ||
      (entry.authorityRefs.length === 0 && entry.decisionRefs.length === 0);
  });
  if (orphaned.length > 0) missing.push('provenance');

  if (missing.length > 0) {
    return fail(
      'PACK_COMPLETENESS_FAILED',
      `Prompt completeness failed; missing: ${missing.sort(compareCodePoint).join(', ')}`,
      pack.packId,
    );
  }
  return {
    ok: true,
    value: deepFreeze({ packId: pack.packId, complete: true as const, missingItems: [] }),
  };
}

// ─── No-Discovery Boundary (NDB) ─────────────────────────────────────────────

export function checkNoDiscoveryBoundary(
  topics: readonly string[],
  boundary: readonly string[],
): Result<{ escalationRef: string }> {
  const forbidden = new Set(boundary);
  const violations = sortedStrings(topics.filter(t => forbidden.has(t)));
  if (violations.length > 0) {
    return fail(
      'PACK_NDB_VIOLATION',
      `Executor topics breach the no-discovery boundary: ${violations.join(', ')}`,
      violations[0],
    );
  }
  return { ok: true, value: deepFreeze({ escalationRef: 'NDB:CLEAR' }) };
}
