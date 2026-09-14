// M15 Execution Pack Compiler - s03-guardrails.ts
// S03: Guardrail Binding Table (GBT), Validation Closure Matrix (VCM),
//      Rollback Readiness Proof (RRP), Failure Containment Cell (FCC),
//      Postcondition Evidence Slot (PES).
// M15 compiles rules; M16 owns policy decisions. No policy semantics here,
// only explicit opaque bindings carried immutably in the pack.

import type {
  EvidenceSlot,
  FailureContainmentCell,
  GuardrailBinding,
  Instruction,
  InstructionValidationClosure,
  Result,
  RollbackProof,
  ValidationRequirement,
} from './types.js';
import { compareCodePoint, deepFreeze, fail, sortedStrings, validId } from './utils.js';

// ─── Guardrail Binding Table (GBT) ────────────────────────────────────────────

/**
 * Bind opaque M16 policy IDs to graph nodes. Every node must carry at least
 * one policy binding; unknown or duplicated node entries fail closed.
 */
export function buildGuardrailBindingTable(
  nodeIds: readonly string[],
  bindings: readonly GuardrailBinding[],
): Result<readonly GuardrailBinding[]> {
  const known = new Set(nodeIds);
  for (const binding of bindings) {
    if (!known.has(binding.nodeId)) {
      return fail(
        'PACK_GUARDRAIL_UNKNOWN_NODE',
        `Guardrail binding targets unknown node ${binding.nodeId}`,
        binding.nodeId,
      );
    }
  }
  const seen = new Set<string>();
  for (const binding of bindings) {
    if (seen.has(binding.nodeId)) {
      return fail(
        'PACK_GUARDRAIL_DUPLICATE_NODE',
        `Duplicate guardrail binding for node ${binding.nodeId}`,
        binding.nodeId,
      );
    }
    seen.add(binding.nodeId);
  }
  for (const nodeId of nodeIds) {
    if (!seen.has(nodeId)) {
      return fail(
        'PACK_GUARDRAIL_UNBOUND',
        `Node ${nodeId} has no guardrail binding`,
        nodeId,
      );
    }
  }
  const table = bindings.map(binding => {
    if (binding.policyIds.length === 0) {
      return null;
    }
    return {
      nodeId: binding.nodeId,
      policyIds: sortedStrings(binding.policyIds),
    };
  });
  for (const row of table) {
    if (row === null) {
      return fail('PACK_GUARDRAIL_UNBOUND', 'Guardrail binding carries no policy ID');
    }
  }
  const sorted = [...(table as readonly GuardrailBinding[])].sort((a, b) =>
    compareCodePoint(a.nodeId, b.nodeId),
  );
  return { ok: true, value: deepFreeze(sorted) };
}

// ─── Validation Closure Matrix (VCM) ──────────────────────────────────────────

/**
 * Map every instruction to its minimum required checks. A mutation without
 * validation closure is invalid; covers-refs to unknown instructions fail
 * closed instead of being silently ignored.
 */
export function buildValidationClosureMatrix(
  instructions: readonly Instruction[],
  validations: readonly ValidationRequirement[],
): Result<readonly InstructionValidationClosure[]> {
  const known = new Set(instructions.map(i => i.instructionId));
  for (const validation of validations) {
    for (const target of validation.covers) {
      if (!known.has(target)) {
        return fail(
          'PACK_VALIDATION_UNKNOWN_TARGET',
          `Validation ${validation.validationId} covers unknown instruction ${target}`,
          target,
        );
      }
    }
  }
  const closures: InstructionValidationClosure[] = [];
  for (const instruction of instructions) {
    const covering = validations
      .filter(v => v.covers.includes(instruction.instructionId))
      .map(v => v.validationId)
      .sort(compareCodePoint);
    if (covering.length === 0) {
      return fail(
        'PACK_VALIDATION_UNCLOSED',
        `Instruction ${instruction.instructionId} has no validation closure`,
        instruction.instructionId,
      );
    }
    closures.push({ instructionId: instruction.instructionId, validationIds: covering });
  }
  closures.sort((a, b) => compareCodePoint(a.instructionId, b.instructionId));
  return { ok: true, value: deepFreeze(closures) };
}

// ─── Rollback Readiness Proof (RRP) ───────────────────────────────────────────

/**
 * Prove every mutating instruction carries an admissible rollback path.
 * Destructive steps lacking rollback block compilation. Read-only
 * instructions (no mutation domains) pass without a rollback plan.
 */
export function proveRollbackReadiness(
  instructions: readonly Instruction[],
): Result<readonly RollbackProof[]> {
  const proofs: RollbackProof[] = [];
  for (const instruction of instructions) {
    if (instruction.mutationDomains.length === 0) continue;
    const plan = instruction.rollbackPlan;
    if (plan === undefined || plan.trim().length === 0) {
      return fail(
        'PACK_ROLLBACK_MISSING',
        `Mutating instruction ${instruction.instructionId} has no rollback plan`,
        instruction.instructionId,
      );
    }
    proofs.push({ instructionId: instruction.instructionId, rollbackPlan: plan });
  }
  proofs.sort((a, b) => compareCodePoint(a.instructionId, b.instructionId));
  return { ok: true, value: deepFreeze(proofs) };
}

// ─── Failure Containment Cell (FCC) ───────────────────────────────────────────

/**
 * Define which downstream nodes a failed node invalidates (transitive
 * dependents). Unrelated completed work stays valid: containment is exact,
 * never whole-pack invalidation.
 */
export function computeFailureContainmentCell(
  failedNodeId: string,
  instructions: readonly Instruction[],
): Result<FailureContainmentCell> {
  const known = new Set(instructions.map(i => i.instructionId));
  if (!known.has(failedNodeId)) {
    return fail('PACK_FCC_UNKNOWN_NODE', `Unknown failed node ${failedNodeId}`, failedNodeId);
  }
  const dependents = new Map<string, string[]>();
  for (const id of known) dependents.set(id, []);
  for (const instruction of instructions) {
    for (const dep of new Set(instruction.dependsOn)) {
      if (known.has(dep)) {
        const list = dependents.get(dep);
        if (list !== undefined) list.push(instruction.instructionId);
      }
    }
  }
  const invalidated = new Set<string>();
  const queue: string[] = [failedNodeId];
  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined) break;
    const outs = dependents.get(current) ?? [];
    for (const next of outs) {
      if (!invalidated.has(next)) {
        invalidated.add(next);
        queue.push(next);
      }
    }
  }
  invalidated.delete(failedNodeId);
  const invalidatedIds = sortedStrings([...invalidated]);
  const unaffectedIds = sortedStrings([...known].filter(id => id !== failedNodeId && !invalidated.has(id)));
  return {
    ok: true,
    value: deepFreeze({ failedNodeId, invalidatedNodeIds: invalidatedIds, unaffectedNodeIds: unaffectedIds }),
  };
}

// ─── Postcondition Evidence Slot (PES) ────────────────────────────────────────

/**
 * Reserve a typed proof output before execution. Slots identify what evidence
 * will be filled after execution; no evidence is fabricated here.
 */
export function createPostconditionEvidenceSlot(
  slotId: string,
  instructionId: string,
  description: string,
): Result<EvidenceSlot> {
  if (!validId(slotId)) {
    return fail('PACK_EVIDENCE_SLOT_INVALID', 'slotId is invalid or empty', slotId);
  }
  if (!validId(instructionId)) {
    return fail('PACK_EVIDENCE_SLOT_INVALID', 'instructionId is invalid or empty', instructionId);
  }
  if (!description || description.trim().length === 0) {
    return fail('PACK_EVIDENCE_SLOT_INVALID', 'Evidence slot description is required', slotId);
  }
  return {
    ok: true,
    value: deepFreeze({ slotId, instructionId, description }),
  };
}
