import type {
  ApplicabilityWitnessSet, ExceptionWarrant, ObligationCompositionGraph, OperationOptions, PolicyAuthorityCapsule,
  PolicyDecisionReceipt, PolicyEvaluationFragment, PolicyEvaluationInput, PolicyJoinResult, PolicyObligation,
  PolicyOperation, Result, WarrantEffect,
} from './types.js';
import { buildPolicyProvenanceChain, guardrailDecisionAlgebra } from './s01-authority.js';
import { cancelled, compareCodePoint, deepFreeze, fail, intersects, sha, sortedUnique } from './utils.js';

function warrantCovers(w: ExceptionWarrant, policy: PolicyAuthorityCapsule, op: PolicyOperation, effect: WarrantEffect, obligationId: string | null): boolean {
  if (w.status !== 'ACTIVE' || !w.permittedEffects.includes(effect) || !w.policyIds.includes(policy.policyId) || !w.policyDigestBindings.includes(policy.semanticDigest)) return false;
  if (!w.nodeIds.includes(op.nodeId) || !w.operations.includes(op.operation) || !op.domains.some(d => w.domains.includes(d))) return false;
  return obligationId === null || w.obligationIds.includes(obligationId);
}

export function buildApplicabilityWitnessSet(policies: readonly PolicyAuthorityCapsule[], operation: PolicyOperation, facts: Readonly<Record<string, boolean>>): ApplicabilityWitnessSet {
  const witnesses = [...policies].sort((a,b)=>compareCodePoint(a.policyId,b.policyId)).map(policy => {
    const reasons: string[] = [];
    if (policy.status !== 'ACTIVE') reasons.push('POLICY_REVOKED');
    if (!intersects(policy.domains, operation.domains)) reasons.push('DOMAIN_NOT_APPLICABLE');
    if (policy.appliesToOperations.length > 0 && !policy.appliesToOperations.includes(operation.operation)) reasons.push('OPERATION_NOT_APPLICABLE');
    if (policy.appliesToNodeIds.length > 0 && !policy.appliesToNodeIds.includes(operation.nodeId)) reasons.push('NODE_NOT_APPLICABLE');
    const baseApplies = reasons.length === 0;
    const missingFacts = policy.requiredFacts.filter(f => facts[f] !== true);
    if (baseApplies && missingFacts.length > 0) return { policyId: policy.policyId, state: 'UNKNOWN' as const, reasons: missingFacts.map(f => `FACT_UNKNOWN:${f}`) };
    return { policyId: policy.policyId, state: baseApplies ? 'APPLIES' as const : 'DOES_NOT_APPLY' as const, reasons: sortedUnique(reasons) };
  });
  return deepFreeze({ witnesses });
}

export function buildObligationCompositionGraph(obligations: readonly PolicyObligation[], options: OperationOptions): Result<ObligationCompositionGraph> {
  const c = cancelled(options); if (c) return c;
  const max = Math.max(1, Math.min(options.maxNodes ?? 2048, 2048));
  if (obligations.length > max) return fail('OBLIGATION_GRAPH_BUDGET_EXCEEDED', 'Obligation graph exceeds bounded node budget');
  const byId = new Map<string, PolicyObligation>();
  for (const o of obligations) {
    if (byId.has(o.obligationId)) return fail('OBLIGATION_ID_DUPLICATE', 'Obligation ids must be unique', o.obligationId);
    byId.set(o.obligationId, o);
  }
  for (const o of obligations) for (const dep of o.dependsOn) if (!byId.has(dep)) return fail('OBLIGATION_DEPENDENCY_MISSING', 'Obligation dependency is missing', dep);
  const state = new Map<string, number>(); const order: string[] = [];
  const visit = (id: string): boolean => {
    const s = state.get(id) ?? 0; if (s === 1) return false; if (s === 2) return true; state.set(id,1);
    const o = byId.get(id); if (!o) return false;
    for (const d of [...o.dependsOn].sort(compareCodePoint)) if (!visit(d)) return false;
    state.set(id,2); order.push(id); return true;
  };
  for (const id of [...byId.keys()].sort(compareCodePoint)) if (!visit(id)) return fail('OBLIGATION_GRAPH_CYCLE', 'Obligation graph contains a cycle', id);
  return { ok: true, value: deepFreeze({ nodes: [...byId.values()].sort((a,b)=>compareCodePoint(a.obligationId,b.obligationId)).map(o=>({ obligationId:o.obligationId, dependsOn:sortedUnique(o.dependsOn) })), order }) };
}

export function conflictPreservingPolicyJoin(fragments: readonly PolicyEvaluationFragment[]): PolicyJoinResult {
  const obligations = fragments.flatMap(f => f.obligations).sort((a,b)=>compareCodePoint(a.obligationId,b.obligationId));
  const byAction = new Map<string, Set<string>>();
  for (const o of obligations) { const key = `${o.domain}:${o.action}`; const set = byAction.get(key) ?? new Set<string>(); set.add(o.effect); byAction.set(key,set); }
  const conflicts = [...byAction.entries()].filter(([,effects])=>effects.size > 1).map(([key])=>`CONFLICT:${key}`).sort(compareCodePoint);
  return deepFreeze({ obligations, denials: sortedUnique(fragments.flatMap(f=>f.denials)), unknowns: sortedUnique(fragments.flatMap(f=>f.unknowns)), conflicts, exceptionWarrantIds: sortedUnique(fragments.flatMap(f=>f.exceptionWarrantIds)) });
}

export function evaluateGuardrailShortCircuit(join: PolicyJoinResult, mandatoryDomainCoverageComplete: boolean) {
  return guardrailDecisionAlgebra({ denials: join.denials, unknowns: join.unknowns, conflicts: join.conflicts, obligations: join.obligations, mandatoryDomainCoverageComplete });
}

export function buildPolicyDecisionReceipt(operation: PolicyOperation, mandatoryDomains: readonly string[], join: PolicyJoinResult, witnesses: ApplicabilityWitnessSet, provenance: ReturnType<typeof buildPolicyProvenanceChain>, mandatoryDomainCoverageComplete: boolean, options: OperationOptions): Result<PolicyDecisionReceipt> {
  const semantic = { decision: evaluateGuardrailShortCircuit(join, mandatoryDomainCoverageComplete), operation: { nodeId: operation.nodeId, operation: operation.operation, domains: sortedUnique(operation.domains) }, mandatoryDomains: sortedUnique(mandatoryDomains), obligations: join.obligations, denials: join.denials, unknowns: join.unknowns, conflicts: join.conflicts, witnesses, provenance, exceptionWarrantIds: join.exceptionWarrantIds, mandatoryDomainCoverageComplete } as const;
  const d = sha(options, semantic); if (!d.ok) return d;
  return { ok: true, value: deepFreeze({ ...semantic, receiptDigest: d.value }) };
}

export function evaluatePolicies(input: PolicyEvaluationInput, options: OperationOptions): Result<PolicyDecisionReceipt> {
  const c = cancelled(options); if (c) return c;
  const ids = input.policies.map(p=>p.policyId); if (new Set(ids).size !== ids.length) return fail('POLICY_ID_DUPLICATE', 'Policy ids must be unique');
  const witnesses = buildApplicabilityWitnessSet(input.policies, input.operation, input.facts);
  const fragments: PolicyEvaluationFragment[] = [];
  const appliedPolicies: PolicyAuthorityCapsule[] = [];
  for (const policy of input.policies) {
    const w = witnesses.witnesses.find(x=>x.policyId===policy.policyId);
    if (!w || w.state === 'DOES_NOT_APPLY') continue;
    if (w.state === 'UNKNOWN') { fragments.push({ policyId:policy.policyId, obligations:[], denials:[], unknowns:w.reasons, exceptionWarrantIds:[] }); appliedPolicies.push(policy); continue; }
    appliedPolicies.push(policy);
    const used = new Set<string>(); const denials: string[] = []; const obligations: PolicyObligation[] = [];
    if (policy.denyOperations.includes(input.operation.operation) || policy.denyOperations.includes('*')) {
      const waiver = input.exceptionWarrants.find(x=>warrantCovers(x,policy,input.operation,'WAIVE_DENY',null));
      if (waiver) used.add(waiver.warrantId); else denials.push(`DENY:${policy.policyId}:${input.operation.operation}`);
    }
    for (const obligation of policy.obligations) {
      const waiver = input.exceptionWarrants.find(x=>warrantCovers(x,policy,input.operation,'WAIVE_OBLIGATION',obligation.obligationId));
      if (waiver) used.add(waiver.warrantId); else obligations.push(obligation);
    }
    fragments.push({ policyId:policy.policyId, obligations, denials, unknowns:[], exceptionWarrantIds:[...used].sort(compareCodePoint) });
  }
  const joinBase = conflictPreservingPolicyJoin(fragments);
  const coveredDomains = new Set(appliedPolicies.filter(p => witnesses.witnesses.find(w=>w.policyId===p.policyId)?.state === 'APPLIES').flatMap(p=>p.domains));
  const missingDomains = sortedUnique(input.mandatoryDomains.filter(d=>!coveredDomains.has(d)));
  const join: PolicyJoinResult = missingDomains.length === 0 ? joinBase : deepFreeze({ ...joinBase, unknowns: sortedUnique([...joinBase.unknowns, ...missingDomains.map(d=>`MANDATORY_DOMAIN_UNCOVERED:${d}`)]) });
  const graph = buildObligationCompositionGraph(join.obligations, options); if (!graph.ok) return graph;
  return buildPolicyDecisionReceipt(input.operation, input.mandatoryDomains, join, witnesses, buildPolicyProvenanceChain(appliedPolicies), missingDomains.length===0, options);
}
