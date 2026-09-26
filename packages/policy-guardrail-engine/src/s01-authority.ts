import type {
  ExceptionWarrant, ExceptionWarrantInput, GuardrailDecision, OperationOptions, PolicyAuthorityCapsule,
  PolicyAuthorityInput, PolicyDomainLattice, PolicyObligation, PolicyProvenanceChain, Result,
} from './types.js';
import { cancelled, compareCodePoint, deepFreeze, fail, sha, sortedUnique, validId } from './utils.js';

function normalizeObligation(o: PolicyObligation): PolicyObligation {
  return { obligationId: o.obligationId, domain: o.domain, action: o.action, effect: o.effect, dependsOn: sortedUnique(o.dependsOn) };
}

export function createPolicyAuthorityCapsule(input: PolicyAuthorityInput, options: OperationOptions): Result<PolicyAuthorityCapsule> {
  const c = cancelled(options); if (c) return c;
  if (!validId(input.policyId) || !input.version.trim() || !input.owner.trim() || !input.authorityRef.trim() || !input.precedenceDomain.trim()) return fail('POLICY_AUTHORITY_INVALID', 'Policy identity and authority fields are required', input.policyId);
  const expiryRef = input.expiryRef?.trim() || input.reviewTrigger.trim();
  if (input.domains.length === 0 || input.reviewTrigger.trim() === '' || expiryRef === '') return fail('POLICY_SCOPE_INVALID', 'Policy must name at least one domain, review trigger and expiry/validity reference', input.policyId);
  for (const o of input.obligations) if (!validId(o.obligationId) || !o.domain.trim() || !o.action.trim()) return fail('POLICY_OBLIGATION_INVALID', 'Obligation identity/domain/action is required', o.obligationId);
  const semantic = {
    policyId: input.policyId, version: input.version, owner: input.owner, authorityRef: input.authorityRef,
    precedenceDomain: input.precedenceDomain, domains: sortedUnique(input.domains),
    appliesToOperations: sortedUnique(input.appliesToOperations), appliesToNodeIds: sortedUnique(input.appliesToNodeIds),
    requiredFacts: sortedUnique(input.requiredFacts), denyOperations: sortedUnique(input.denyOperations),
    obligations: [...input.obligations].map(normalizeObligation).sort((a,b)=>compareCodePoint(a.obligationId,b.obligationId)),
    evidenceRefs: sortedUnique(input.evidenceRefs), reviewTrigger: input.reviewTrigger, expiryRef, status: input.status,
  } as const;
  const d = sha(options, semantic); if (!d.ok) return d;
  return { ok: true, value: deepFreeze({ ...semantic, semanticDigest: d.value }) };
}

export function guardrailDecisionAlgebra(input: { denials: readonly string[]; unknowns: readonly string[]; conflicts: readonly string[]; obligations: readonly PolicyObligation[]; mandatoryDomainCoverageComplete: boolean }): GuardrailDecision {
  if (input.denials.length > 0) return 'DENY';
  if (input.unknowns.length > 0 || input.conflicts.length > 0 || !input.mandatoryDomainCoverageComplete) return 'BLOCK_UNKNOWN';
  return input.obligations.length > 0 ? 'ALLOW_WITH_OBLIGATIONS' : 'ALLOW';
}

export function buildPolicyDomainLattice(policies: readonly PolicyAuthorityCapsule[]): PolicyDomainLattice {
  const domains = sortedUnique(policies.flatMap(p => p.domains));
  return deepFreeze({ entries: domains.map(domain => ({
    domain,
    policyIds: sortedUnique(policies.filter(p => p.domains.includes(domain)).map(p => p.policyId)),
    authorityRefs: sortedUnique(policies.filter(p => p.domains.includes(domain)).map(p => p.authorityRef)),
  })) });
}

export function createExceptionWarrant(input: ExceptionWarrantInput, options: OperationOptions): Result<ExceptionWarrant> {
  const c = cancelled(options); if (c) return c;
  const expiryRef = input.expiryRef?.trim() || input.reviewTrigger.trim();
  if (!validId(input.warrantId) || !input.approvalRef.trim() || !input.reviewTrigger.trim() || expiryRef === '') return fail('EXCEPTION_WARRANT_INVALID', 'Warrant identity, approval, review trigger and expiry/validity reference are required', input.warrantId);
  if (input.policyDigestBindings.length === 0 || input.policyIds.length === 0 || input.domains.length === 0 || input.nodeIds.length === 0 || input.operations.length === 0 || input.permittedEffects.length === 0 || input.compensatingControls.length === 0) return fail('EXCEPTION_SCOPE_UNBOUNDED', 'Exception warrants require explicit policy, digest, domain, node, operation, effect and compensating-control bounds', input.warrantId);
  const semantic = {
    warrantId: input.warrantId, approvalRef: input.approvalRef,
    policyDigestBindings: sortedUnique(input.policyDigestBindings), policyIds: sortedUnique(input.policyIds),
    obligationIds: sortedUnique(input.obligationIds), domains: sortedUnique(input.domains), nodeIds: sortedUnique(input.nodeIds),
    operations: sortedUnique(input.operations), permittedEffects: [...new Set(input.permittedEffects)].sort(compareCodePoint),
    compensatingControls: sortedUnique(input.compensatingControls), reviewTrigger: input.reviewTrigger, expiryRef, status: input.status,
  } as const;
  const d = sha(options, semantic); if (!d.ok) return d;
  return { ok: true, value: deepFreeze({ ...semantic, warrantDigest: d.value }) };
}

export function buildPolicyProvenanceChain(policies: readonly PolicyAuthorityCapsule[]): PolicyProvenanceChain {
  return deepFreeze({ entries: [...policies].sort((a,b)=>compareCodePoint(a.policyId,b.policyId)).map(p => ({ policyId: p.policyId, policyDigest: p.semanticDigest, authorityRef: p.authorityRef, evidenceRefs: sortedUnique(p.evidenceRefs) })) });
}
