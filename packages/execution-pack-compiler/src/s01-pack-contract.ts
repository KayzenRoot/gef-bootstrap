// M15 Execution Pack Compiler - s01-pack-contract.ts
// S01: Execution Pack Envelope (EPE), Instruction Provenance Map (IPM),
//      Executor Capability Contract (ECC), Prompt Completeness Certificate (PCC),
//      No-Discovery Boundary (NDB).
// Deterministic, read-only, startup-pure. No filesystem/network/Git mutation.

import type {
  Binding,
  ExecutionPackEnvelope,
  ExecutorCapabilityContract,
  ExecutorCapabilityOffer,
  Instruction,
  OperationOptions,
  PromptChecklist,
  PromptCompletenessCertificate,
  ProvenanceEntry,
  Result,
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
 * Create the versioned immutable pack envelope binding
 * task/context/policy/profile/project/capability exactly.
 */
export function createExecutionPackEnvelope(
  input: Binding & { packId: string; contextIdentity: string },
  options: OperationOptions,
): Result<ExecutionPackEnvelope> {
  const c = cancelled(options);
  if (c) return c;

  if (!validId(input.packId)) {
    return fail('PACK_BINDING_INVALID', 'packId is invalid or empty', input.packId);
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

/**
 * Map every imperative to its authority source or approved decision.
 * An instruction without at least one authority or decision ref is invalid;
 * refs to unknown instructions fail closed instead of being silently dropped.
 */
export function buildInstructionProvenanceMap(
  instructions: readonly Instruction[],
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
 * Validate that the offered executor capability satisfies the pack's required
 * contract. Identity mismatch or any missing capability/tool fails closed.
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
  if (!Number.isInteger(required.maxParallelism) || required.maxParallelism < 1) {
    return fail('PACK_CAPABILITY_MISSING', 'Required maxParallelism must be a positive integer');
  }
  return {
    ok: true,
    value: deepFreeze({
      capabilityIdentity: offer.capabilityIdentity,
      capabilities: sortedStrings(offer.capabilities),
      tools: sortedStrings(offer.tools),
    }),
  };
}

// ─── Prompt Completeness Certificate (PCC) ────────────────────────────────────

const CHECKLIST_LABELS: Readonly<Record<keyof PromptChecklist, string>> = {
  objective: 'objective',
  workGraph: 'workGraph',
  validations: 'validations',
  rollback: 'rollback',
  evidenceSlots: 'evidenceSlots',
  stopCondition: 'stopCondition',
  noDiscoveryBoundary: 'noDiscoveryBoundary',
};

/** Issue the deterministic readiness summary. Any unchecked item fails closed. */
export function issuePromptCompletenessCertificate(
  packId: string,
  checklist: PromptChecklist,
): Result<PromptCompletenessCertificate> {
  if (!validId(packId)) {
    return fail('PACK_BINDING_INVALID', 'packId is invalid or empty', packId);
  }
  const missing = (Object.keys(CHECKLIST_LABELS) as Array<keyof PromptChecklist>)
    .filter(key => checklist[key] !== true)
    .map(key => CHECKLIST_LABELS[key])
    .sort(compareCodePoint);
  if (missing.length > 0) {
    return fail(
      'PACK_COMPLETENESS_FAILED',
      `Prompt completeness failed; missing: ${missing.join(', ')}`,
      packId,
    );
  }
  return {
    ok: true,
    value: deepFreeze({ packId, complete: true as const, missingItems: [] }),
  };
}

// ─── No-Discovery Boundary (NDB) ─────────────────────────────────────────────

/**
 * Enforce the no-discovery boundary: planned executor topics must not overlap
 * the forbidden set. Overlap fails closed; uncertainty returns to the compiler.
 */
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
