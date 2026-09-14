import type { WorkNode } from '@gef-bootstrap/execution-pack-compiler';
import type {
  ExceptionBlastRadiusRequest, ExceptionWarrant, GuardrailEnforcementProjection, MutationCapabilityLease,
  OperationOptions, PolicyDecisionReceipt, PolicyDegradation, Result,
} from './types.js';
import { deepFreeze, fail, isSubset, sameStrings, sha, sortedUnique, validId } from './utils.js';

export function checkExceptionBlastRadius(warrant: ExceptionWarrant, request: ExceptionBlastRadiusRequest): Result<true> {
  if (warrant.status !== 'ACTIVE') return fail('EXCEPTION_WARRANT_INACTIVE', 'Exception warrant is not active', warrant.warrantId);
  if (!warrant.policyDigestBindings.includes(request.policyDigest) || !warrant.policyIds.includes(request.policyId) || !warrant.domains.includes(request.domain) || !warrant.nodeIds.includes(request.nodeId) || !warrant.operations.includes(request.operation) || !warrant.permittedEffects.includes(request.effect)) return fail('EXCEPTION_BLAST_RADIUS_EXCEEDED', 'Requested exception exceeds explicit warrant scope', warrant.warrantId);
  if (request.obligationId !== null && !warrant.obligationIds.includes(request.obligationId)) return fail('EXCEPTION_BLAST_RADIUS_EXCEEDED', 'Requested obligation is outside warrant scope', request.obligationId);
  return { ok:true, value:true };
}

export function enforceGuardrailMembrane(receipt: PolicyDecisionReceipt, node: WorkNode, operation: string): GuardrailEnforcementProjection {
  const diagnostics = [];
  if (receipt.operation.nodeId !== node.instructionId) diagnostics.push({ code:'POLICY_NODE_MISMATCH', message:'Decision receipt is bound to another execution node', subject:node.instructionId });
  if (receipt.operation.operation !== operation) diagnostics.push({ code:'POLICY_OPERATION_MISMATCH', message:'Decision receipt is bound to another operation', subject:operation });
  if (!sameStrings(receipt.operation.domains, node.mutationDomains)) diagnostics.push({ code:'POLICY_DOMAIN_MISMATCH', message:'Decision receipt mutation domains differ from execution node domains', subject:node.instructionId });
  if (receipt.decision === 'DENY' || receipt.decision === 'BLOCK_UNKNOWN') diagnostics.push({ code:'POLICY_DECISION_BLOCKS_MUTATION', message:`Policy decision ${receipt.decision} blocks guarded mutation`, subject:node.instructionId });
  return deepFreeze({ allowed: diagnostics.length===0, decision:receipt.decision, nodeId:node.instructionId, operation, mutationDomains:sortedUnique(node.mutationDomains), obligationIds:sortedUnique(receipt.obligations.map(o=>o.obligationId)), receiptDigest:receipt.receiptDigest, diagnostics });
}

export function issueMutationCapabilityLease(projection: GuardrailEnforcementProjection, policyFingerprint: string, checkpointIdentity: string, satisfiedObligationIds: readonly string[], nonce: string, options: OperationOptions): Result<MutationCapabilityLease> {
  if (!projection.allowed) return fail('MUTATION_LEASE_BLOCKED', 'Guardrail membrane did not authorize mutation', projection.nodeId);
  if (!/^sha256:[a-f0-9]{64}$/i.test(policyFingerprint) || !checkpointIdentity.trim() || !validId(nonce)) return fail('MUTATION_LEASE_BINDING_INVALID', 'Lease requires exact SHA-256 policy fingerprint, checkpoint identity and stable nonce', projection.nodeId);
  if (!isSubset(projection.obligationIds, satisfiedObligationIds)) return fail('MUTATION_OBLIGATIONS_UNSATISFIED', 'All policy obligations must be satisfied before mutation lease issuance', projection.nodeId);
  const semantic = { nodeId:projection.nodeId, operation:projection.operation, mutationDomains:projection.mutationDomains, receiptDigest:projection.receiptDigest, policyFingerprint, checkpointIdentity, obligationIds:projection.obligationIds, nonce } as const;
  const d=sha(options,semantic); if(!d.ok)return d;
  return {ok:true,value:deepFreeze({leaseId:`mcl:${d.value.slice(7,39)}`,...semantic})};
}

export function checkPolicyToctou(lease: MutationCapabilityLease, currentPolicyFingerprint: string, currentReceiptDigest: string, currentCheckpointIdentity: string, node: WorkNode, operation: string): Result<true> {
  if (lease.policyFingerprint !== currentPolicyFingerprint) return fail('POLICY_TOCTOU_FINGERPRINT_DRIFT','Policy fingerprint changed before mutation',node.instructionId);
  if (lease.receiptDigest !== currentReceiptDigest) return fail('POLICY_TOCTOU_RECEIPT_DRIFT','Policy decision receipt changed before mutation',node.instructionId);
  if (lease.checkpointIdentity !== currentCheckpointIdentity) return fail('POLICY_TOCTOU_CHECKPOINT_DRIFT','Checkpoint identity changed before mutation',node.instructionId);
  if (lease.nodeId !== node.instructionId || lease.operation !== operation || !sameStrings(lease.mutationDomains,node.mutationDomains)) return fail('POLICY_TOCTOU_OPERATION_DRIFT','Execution node/operation binding changed before mutation',node.instructionId);
  return {ok:true,value:true};
}

export function failClosedDegradation(reason: string): PolicyDegradation {
  return deepFreeze({ decision:'BLOCK_UNKNOWN', reason, diagnostics:[{code:'POLICY_DEPENDENCY_DEGRADED',message:'Required policy dependency is unavailable; affected action is blocked',subject:reason}] });
}
