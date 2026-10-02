// M15 Execution Pack Compiler - S06 Canonical Planning Analysis
// Extends existing M14 dependency closure and shockwave contracts; no second graph engine.

import {
  computeContextDependencyClosure,
  scanDependencyShockwave,
} from '@gef-bootstrap/task-context-compiler';
import type {
  ContextDependencyClosure,
  DssSourceNode,
} from '@gef-bootstrap/task-context-compiler';
import type { OperationOptions, Result } from './types.js';
import { compareCodePoint, deepFreeze, fail, sha, validId } from './utils.js';

export const CANONICAL_PLANNING_DOMAINS = [
  'SCOPE',
  'REQUIREMENTS',
  'ARCHITECTURE',
  'SECURITY',
  'TESTS',
  'DEPLOYMENT',
  'DECISIONS',
  'DEFINITION_OF_DONE',
] as const;

export type CanonicalPlanningDomain = (typeof CANONICAL_PLANNING_DOMAINS)[number];
export type PlanningKnowledgeState = 'KNOWN' | 'ESTIMATED_HYPOTHESIS' | 'UNRESOLVED' | 'NOT_APPLICABLE';
export type CanonicalPlanningState = 'COMPLETE' | 'INCOMPLETE' | 'BLOCKED' | 'INDETERMINATE';

export interface CanonicalPlanBinding {
  readonly projectId: string;
  readonly sourcePackIdentity: string;
  readonly profileIdentity: string;
  readonly profileDigest: string;
  readonly policyVersion: string;
  readonly checkpointIdentity: string;
}

export interface CanonicalPlanRequirement {
  readonly requirementId: string;
  readonly domain: CanonicalPlanningDomain;
  readonly dependsOn: readonly string[];
  /** Exact proof references required by the frozen requirement contract. */
  readonly proofRefs: readonly string[];
  /** Explicit canonical classification; not inferred from plan shape. */
  readonly criticalPath: boolean;
  readonly required: boolean;
}

export interface CanonicalPlanProof {
  readonly proofRef: string;
  readonly sourceId: string;
  readonly sourceFingerprint: string;
  readonly knowledgeState: PlanningKnowledgeState;
}

export interface PlanningSourceFingerprint {
  readonly sourceId: string;
  readonly fingerprint: string;
}

export interface CanonicalDomainDependency {
  readonly domain: CanonicalPlanningDomain;
  readonly dependentDomains: readonly CanonicalPlanningDomain[];
}

export interface PlanningOwnerChange {
  readonly changeId: string;
  readonly sourceId: string;
  readonly domain: CanonicalPlanningDomain;
  readonly previousFingerprint: string;
  readonly currentFingerprint: string;
}

export interface UnknownAuthorityDomain {
  readonly domain: CanonicalPlanningDomain;
  readonly reason: string;
}

export interface CanonicalPlanAnalysisInput {
  readonly planId: string;
  readonly planVersion: string;
  readonly binding: CanonicalPlanBinding;
  readonly requirements: readonly CanonicalPlanRequirement[];
  readonly proofs: readonly CanonicalPlanProof[];
  readonly currentSourceFingerprints: readonly PlanningSourceFingerprint[];
  readonly domainDependencies: readonly CanonicalDomainDependency[];
  readonly unknownAuthorityDomains: readonly UnknownAuthorityDomain[];
  readonly ownerChanges: readonly PlanningOwnerChange[];
}

export interface RequirementProofLink {
  readonly proofRef: string;
  readonly knowledgeState: PlanningKnowledgeState;
  readonly sourceId?: string | undefined;
  readonly sourceFingerprint?: string | undefined;
}

export interface CanonicalRequirementAssessment {
  readonly requirementId: string;
  readonly domain: CanonicalPlanningDomain;
  readonly dependsOn: readonly string[];
  readonly proofLinks: readonly RequirementProofLink[];
  readonly knowledgeState: PlanningKnowledgeState;
  readonly criticalPath: boolean;
  readonly required: boolean;
}

export interface CanonicalPlanningUnknown {
  readonly kind:
    | 'AUTHORITY_UNKNOWN'
    | 'DOMAIN_TOPOLOGY_INCOMPLETE'
    | 'PROOF_REFERENCE_MISSING'
    | 'PROOF_SOURCE_STALE'
    | 'DEPENDENCY_UNKNOWN'
    | 'OWNER_CHANGE_SOURCE_STALE'
    | 'IMPACT_BUDGET_EXHAUSTED';
  readonly subject: string;
  readonly detail: string;
}

export interface OwnerChangeImpact {
  readonly state: 'KNOWN' | 'UNRESOLVED';
  readonly changeIds: readonly string[];
  readonly changedDomains: readonly CanonicalPlanningDomain[];
  readonly affectedDomains: readonly CanonicalPlanningDomain[];
  readonly affectedRequirementIds: readonly string[];
  readonly affectedProofRefs: readonly string[];
  readonly unknownDomains: readonly CanonicalPlanningDomain[];
  readonly unknownChangeIds: readonly string[];
  readonly budgetExhausted: boolean;
  readonly cancelled: boolean;
}

export interface CanonicalPlanAnalysis {
  readonly schemaVersion: 1;
  readonly planId: string;
  readonly planVersion: string;
  readonly binding: CanonicalPlanBinding;
  readonly state: CanonicalPlanningState;
  readonly requirements: readonly CanonicalRequirementAssessment[];
  readonly dependencyClosure: ContextDependencyClosure;
  readonly criticalPathRequirementIds: readonly string[];
  readonly missingCriticalPathObligationIds: readonly string[];
  readonly ownerChangeImpact: OwnerChangeImpact;
  readonly unknowns: readonly CanonicalPlanningUnknown[];
  readonly semanticIdentity: string;
}

function isDomain(value: string): value is CanonicalPlanningDomain {
  return (CANONICAL_PLANNING_DOMAINS as readonly string[]).includes(value);
}

function validBinding(binding: CanonicalPlanBinding): boolean {
  return [
    binding.projectId,
    binding.sourcePackIdentity,
    binding.profileIdentity,
    binding.profileDigest,
    binding.policyVersion,
    binding.checkpointIdentity,
  ].every(value => typeof value === 'string' && value.trim().length > 0)
    && validId(binding.projectId)
    && validId(binding.sourcePackIdentity)
    && validId(binding.profileIdentity)
    && validId(binding.policyVersion)
    && validId(binding.checkpointIdentity);
}

function normalizeClosure(closure: ContextDependencyClosure): ContextDependencyClosure {
  const sortedCycles = [...(closure.cycles ?? [])]
    .map(cycle => [...cycle].sort(compareCodePoint))
    .sort((a, b) => compareCodePoint(a.join('\0'), b.join('\0')));
  return deepFreeze({
    rootUnitIds: [...closure.rootUnitIds].sort(compareCodePoint),
    closedUnitIds: [...closure.closedUnitIds].sort(compareCodePoint),
    edges: [...closure.edges].sort((a, b) =>
      compareCodePoint(a.fromId, b.fromId)
      || compareCodePoint(a.toId, b.toId)
      || compareCodePoint(a.edgeType, b.edgeType),
    ),
    state: closure.state,
    ...(sortedCycles.length > 0 ? { cycles: sortedCycles } : {}),
    ...((closure.unknownRefs?.length ?? 0) > 0
      ? { unknownRefs: [...closure.unknownRefs!].sort(compareCodePoint) }
      : {}),
  });
}

function assessKnowledgeState(
  required: boolean,
  proofLinks: readonly RequirementProofLink[],
): PlanningKnowledgeState {
  if (proofLinks.length === 0) return 'UNRESOLVED';
  if (proofLinks.every(link => link.knowledgeState === 'KNOWN')) return 'KNOWN';
  if (proofLinks.some(link => link.knowledgeState === 'UNRESOLVED')) return 'UNRESOLVED';
  if (proofLinks.every(link => link.knowledgeState === 'NOT_APPLICABLE') && !required) return 'NOT_APPLICABLE';
  if (proofLinks.some(link => link.knowledgeState === 'ESTIMATED_HYPOTHESIS')) return 'ESTIMATED_HYPOTHESIS';
  return 'UNRESOLVED';
}

function validateUniqueIds(values: readonly string[], code: string, subject: string): Result<true> {
  const seen = new Set<string>();
  for (const value of values) {
    if (!validId(value)) return fail(code, `Invalid identifier in ${subject}`, value);
    if (seen.has(value)) return fail(code, `Duplicate identifier in ${subject}`, value);
    seen.add(value);
  }
  return { ok: true, value: true };
}

/**
 * Bind a canonical requirement plan to exact proof/source identities and
 * report owner-change impact. All graph traversal reuses M14's bounded closure
 * and dependency shockwave implementations.
 */
export function analyzeCanonicalPlan(
  input: CanonicalPlanAnalysisInput,
  options: OperationOptions,
): Result<CanonicalPlanAnalysis> {
  if (options.cancellation?.isCancelled()) return fail('CANCELLED', 'Operation cancelled');
  if (!validId(input.planId) || !input.planVersion.trim() || !validBinding(input.binding)) {
    return fail('PLAN_INPUT_INVALID', 'Plan identity, version and exact source bindings are required', input.planId);
  }

  const requirementIds = input.requirements.map(requirement => requirement.requirementId);
  const uniqueRequirements = validateUniqueIds(requirementIds, 'PLAN_REQUIREMENT_ID_INVALID', 'requirements');
  if (!uniqueRequirements.ok) return uniqueRequirements;
  const proofIds = input.proofs.map(proof => proof.proofRef);
  const uniqueProofs = validateUniqueIds(proofIds, 'PLAN_PROOF_ID_INVALID', 'proofs');
  if (!uniqueProofs.ok) return uniqueProofs;
  const changeIds = input.ownerChanges.map(change => change.changeId);
  const uniqueChanges = validateUniqueIds(changeIds, 'PLAN_CHANGE_ID_INVALID', 'ownerChanges');
  if (!uniqueChanges.ok) return uniqueChanges;

  const requirementMap = new Map<string, CanonicalPlanRequirement>();
  const requirements: CanonicalPlanRequirement[] = [];
  for (const requirement of input.requirements) {
    if (!isDomain(requirement.domain) || typeof requirement.criticalPath !== 'boolean' || typeof requirement.required !== 'boolean') {
      return fail('PLAN_REQUIREMENT_INVALID', 'Requirement domain and flags must be canonical', requirement.requirementId);
    }
    if (requirement.criticalPath && !requirement.required) {
      return fail('PLAN_REQUIREMENT_INVALID', 'A critical-path requirement must be required', requirement.requirementId);
    }
    const dependencies = validateUniqueIds(requirement.dependsOn, 'PLAN_DEPENDENCY_INVALID', requirement.requirementId);
    if (!dependencies.ok) return dependencies;
    const refs = validateUniqueIds(requirement.proofRefs, 'PLAN_PROOF_REFERENCE_INVALID', requirement.requirementId);
    if (!refs.ok) return refs;
    const normalized = {
      ...requirement,
      dependsOn: [...requirement.dependsOn].sort(compareCodePoint),
      proofRefs: [...requirement.proofRefs].sort(compareCodePoint),
    };
    requirementMap.set(requirement.requirementId, normalized);
    requirements.push(normalized);
  }
  requirements.sort((a, b) => compareCodePoint(a.requirementId, b.requirementId));

  const sourceFingerprints = new Map<string, string>();
  for (const source of input.currentSourceFingerprints) {
    if (!validId(source.sourceId) || !source.fingerprint.trim() || sourceFingerprints.has(source.sourceId)) {
      return fail('PLAN_SOURCE_FINGERPRINT_INVALID', 'Current source IDs must be unique and have fingerprints', source.sourceId);
    }
    sourceFingerprints.set(source.sourceId, source.fingerprint);
  }

  const proofMap = new Map<string, CanonicalPlanProof>();
  for (const proof of input.proofs) {
    if (!validId(proof.proofRef) || !validId(proof.sourceId) || !proof.sourceFingerprint.trim()) {
      return fail('PLAN_PROOF_INVALID', 'Proof identity and source fingerprint are required', proof.proofRef);
    }
    if (!['KNOWN', 'ESTIMATED_HYPOTHESIS', 'UNRESOLVED', 'NOT_APPLICABLE'].includes(proof.knowledgeState)) {
      return fail('PLAN_PROOF_STATE_INVALID', 'Unknown proof knowledge state', proof.proofRef);
    }
    proofMap.set(proof.proofRef, proof);
  }

  const unknowns: CanonicalPlanningUnknown[] = [];
  const assessments: CanonicalRequirementAssessment[] = [];
  for (const requirement of requirements) {
    const proofLinks: RequirementProofLink[] = [];
    for (const proofRef of requirement.proofRefs) {
      const proof = proofMap.get(proofRef);
      if (!proof) {
        unknowns.push({ kind: 'PROOF_REFERENCE_MISSING', subject: proofRef, detail: `No proof receipt is registered for ${requirement.requirementId}` });
        proofLinks.push({ proofRef, knowledgeState: 'UNRESOLVED' });
        continue;
      }
      const currentFingerprint = sourceFingerprints.get(proof.sourceId);
      const current = currentFingerprint === proof.sourceFingerprint;
      const knowledgeState = current ? proof.knowledgeState : 'UNRESOLVED';
      if (!current) {
        unknowns.push({ kind: 'PROOF_SOURCE_STALE', subject: proofRef, detail: `Proof ${proofRef} is not bound to the current fingerprint for ${proof.sourceId}` });
      }
      proofLinks.push({
        proofRef,
        knowledgeState,
        sourceId: proof.sourceId,
        sourceFingerprint: proof.sourceFingerprint,
      });
    }
    const knowledgeState = assessKnowledgeState(requirement.required, proofLinks);
    assessments.push({
      requirementId: requirement.requirementId,
      domain: requirement.domain,
      dependsOn: requirement.dependsOn,
      proofLinks,
      knowledgeState,
      criticalPath: requirement.criticalPath,
      required: requirement.required,
    });
  }

  const nodeMap = new Map(requirements.map(requirement => [requirement.requirementId, {
    id: requirement.requirementId,
    dependencies: requirement.dependsOn,
  }]));
  const closureResult = computeContextDependencyClosure(
    requirements.map(requirement => requirement.requirementId),
    nodeMap,
    undefined,
    options,
  );
  if (!closureResult.ok) return closureResult;
  const dependencyClosure = normalizeClosure(closureResult.value);
  for (const unknownRef of dependencyClosure.unknownRefs ?? []) {
    unknowns.push({ kind: 'DEPENDENCY_UNKNOWN', subject: unknownRef, detail: `Requirement dependency ${unknownRef} is not present in this canonical plan` });
  }

  const topologyByDomain = new Map<CanonicalPlanningDomain, CanonicalDomainDependency>();
  for (const node of input.domainDependencies) {
    if (!isDomain(node.domain) || topologyByDomain.has(node.domain)) {
      return fail('PLAN_DOMAIN_TOPOLOGY_INVALID', 'Domain dependency nodes must use unique canonical domains', node.domain);
    }
    const dependents = validateUniqueIds(node.dependentDomains, 'PLAN_DOMAIN_TOPOLOGY_INVALID', node.domain);
    if (!dependents.ok) return dependents;
    for (const dependent of node.dependentDomains) {
      if (!isDomain(dependent)) return fail('PLAN_DOMAIN_TOPOLOGY_INVALID', 'Unknown dependent authority domain', dependent);
    }
    topologyByDomain.set(node.domain, {
      domain: node.domain,
      dependentDomains: [...node.dependentDomains].sort(compareCodePoint) as CanonicalPlanningDomain[],
    });
  }

  const topologyUnknownDomains = CANONICAL_PLANNING_DOMAINS
    .filter(domain => !topologyByDomain.has(domain));
  for (const node of topologyByDomain.values()) {
    for (const dependent of node.dependentDomains) {
      if (!topologyByDomain.has(dependent)) topologyUnknownDomains.push(dependent);
    }
  }
  const explicitUnknownDomains: CanonicalPlanningDomain[] = [];
  for (const unknown of input.unknownAuthorityDomains) {
    if (!isDomain(unknown.domain) || !unknown.reason.trim()) {
      return fail('PLAN_AUTHORITY_UNKNOWN_INVALID', 'Unknown authority entries require canonical domain and reason', unknown.domain);
    }
    explicitUnknownDomains.push(unknown.domain);
    unknowns.push({ kind: 'AUTHORITY_UNKNOWN', subject: unknown.domain, detail: unknown.reason.trim() });
  }
  const unknownDomains = [...new Set([...topologyUnknownDomains, ...explicitUnknownDomains])].sort(compareCodePoint);
  for (const domain of topologyUnknownDomains) {
    unknowns.push({ kind: 'DOMAIN_TOPOLOGY_INCOMPLETE', subject: domain, detail: `No complete owner-change dependency topology is available for ${domain}` });
  }

  const validChanges: PlanningOwnerChange[] = [];
  const unknownChangeIds: string[] = [];
  for (const change of input.ownerChanges) {
    if (!isDomain(change.domain) || !validId(change.sourceId) || !change.previousFingerprint.trim() || !change.currentFingerprint.trim()) {
      return fail('PLAN_OWNER_CHANGE_INVALID', 'Owner changes require canonical domain and exact before/after fingerprints', change.changeId);
    }
    if (change.previousFingerprint === change.currentFingerprint) {
      return fail('PLAN_OWNER_CHANGE_UNCHANGED', 'Owner change fingerprints must identify a real source change', change.changeId);
    }
    if (sourceFingerprints.get(change.sourceId) !== change.currentFingerprint) {
      unknownChangeIds.push(change.changeId);
      unknowns.push({ kind: 'OWNER_CHANGE_SOURCE_STALE', subject: change.changeId, detail: `Owner change ${change.changeId} is not bound to the current source fingerprint` });
      continue;
    }
    validChanges.push(change);
  }

  const validChangeDomains = [...new Set(validChanges.map(change => change.domain))].sort(compareCodePoint);
  const dssNodes: DssSourceNode[] = [...topologyByDomain.values()].map(node => ({
    id: node.domain,
    domain: node.domain,
    dependentDomains: node.dependentDomains,
  }));
  const shockwaveResult = scanDependencyShockwave(validChangeDomains, dssNodes, undefined, options);
  if (!shockwaveResult.ok) return shockwaveResult;
  const shockwave = shockwaveResult.value;
  if (shockwave.budgetExhausted) {
    unknowns.push({ kind: 'IMPACT_BUDGET_EXHAUSTED', subject: input.planId, detail: 'Owner-change impact traversal exhausted its bounded graph budget' });
  }

  const affectedDomainSet = new Set(shockwave.affectedDomainIds as CanonicalPlanningDomain[]);
  const directlyAffectedRequirements = requirements.filter(requirement => affectedDomainSet.has(requirement.domain));
  const reverseDependencies = new Map<string, string[]>();
  for (const requirement of requirements) reverseDependencies.set(requirement.requirementId, []);
  for (const requirement of requirements) {
    for (const dependency of requirement.dependsOn) {
      if (reverseDependencies.has(dependency)) reverseDependencies.get(dependency)!.push(requirement.requirementId);
    }
  }
  for (const values of reverseDependencies.values()) values.sort(compareCodePoint);
  const reverseNodeMap = new Map([...reverseDependencies.entries()].map(([id, dependents]) => [id, { id, dependencies: dependents }]));
  const impactClosureResult = computeContextDependencyClosure(
    directlyAffectedRequirements.map(requirement => requirement.requirementId),
    reverseNodeMap,
    undefined,
    options,
  );
  if (!impactClosureResult.ok) return impactClosureResult;
  const impactClosure = impactClosureResult.value;
  const affectedRequirementIds = [...impactClosure.closedUnitIds].sort(compareCodePoint);
  const assessmentById = new Map(assessments.map(assessment => [assessment.requirementId, assessment]));
  const affectedProofRefs = [...new Set(affectedRequirementIds.flatMap(id =>
    assessmentById.get(id)?.proofLinks.map(link => link.proofRef) ?? [],
  ))].sort(compareCodePoint);

  const impactUnresolved = unknownDomains.length > 0
    || unknownChangeIds.length > 0
    || shockwave.budgetExhausted
    || shockwave.cancelled
    || impactClosure.state !== 'COMPLETE';
  const ownerChangeImpact: OwnerChangeImpact = deepFreeze({
    state: impactUnresolved ? 'UNRESOLVED' : 'KNOWN',
    changeIds: [...input.ownerChanges.map(change => change.changeId)].sort(compareCodePoint),
    changedDomains: validChangeDomains,
    affectedDomains: [...new Set(shockwave.affectedDomainIds)].sort(compareCodePoint) as CanonicalPlanningDomain[],
    affectedRequirementIds,
    affectedProofRefs,
    unknownDomains,
    unknownChangeIds: [...unknownChangeIds].sort(compareCodePoint),
    budgetExhausted: shockwave.budgetExhausted || impactClosure.state === 'BUDGET_EXHAUSTED',
    cancelled: shockwave.cancelled || impactClosure.state === 'CANCELLED',
  });

  const criticalPathRequirementIds = assessments
    .filter(assessment => assessment.criticalPath)
    .map(assessment => assessment.requirementId)
    .sort(compareCodePoint);
  const missingCriticalPathObligationIds = assessments
    .filter(assessment => assessment.criticalPath && assessment.knowledgeState !== 'KNOWN')
    .map(assessment => assessment.requirementId)
    .sort(compareCodePoint);

  const structuralUnknown = dependencyClosure.state === 'UNKNOWN_DEPENDENCY'
    || dependencyClosure.state === 'BUDGET_EXHAUSTED'
    || dependencyClosure.state === 'CANCELLED'
    || impactUnresolved;
  const hasRequiredCycle = dependencyClosure.state === 'CYCLE_DETECTED';
  const hasUnprovenRequirement = assessments.some(assessment =>
    assessment.required && assessment.knowledgeState !== 'KNOWN',
  );
  const hasUnknownProofState = assessments.some(assessment => assessment.knowledgeState === 'UNRESOLVED');
  const state: CanonicalPlanningState = hasRequiredCycle
    ? 'BLOCKED'
    : structuralUnknown
      ? 'INDETERMINATE'
      : hasUnprovenRequirement || hasUnknownProofState
        ? 'INCOMPLETE'
        : 'COMPLETE';

  unknowns.sort((a, b) => compareCodePoint(a.kind, b.kind) || compareCodePoint(a.subject, b.subject));
  const normalizedOwnerChanges = [...input.ownerChanges].sort((a, b) => compareCodePoint(a.changeId, b.changeId));
  const normalizedProofs = [...input.proofs].sort((a, b) => compareCodePoint(a.proofRef, b.proofRef));
  const normalizedFingerprints = [...input.currentSourceFingerprints].sort((a, b) => compareCodePoint(a.sourceId, b.sourceId));
  const normalizedTopology = [...topologyByDomain.values()].sort((a, b) => compareCodePoint(a.domain, b.domain));
  const normalizedUnknownAuthorities = [...input.unknownAuthorityDomains].sort((a, b) => compareCodePoint(a.domain, b.domain));
  const semanticInput = {
    schemaVersion: 1,
    planId: input.planId,
    planVersion: input.planVersion,
    binding: input.binding,
    requirements: assessments,
    proofs: normalizedProofs,
    currentSourceFingerprints: normalizedFingerprints,
    domainDependencies: normalizedTopology,
    unknownAuthorityDomains: normalizedUnknownAuthorities,
    ownerChanges: normalizedOwnerChanges,
    state,
    dependencyClosure,
    criticalPathRequirementIds,
    missingCriticalPathObligationIds,
    ownerChangeImpact,
    unknowns,
  };
  const identity = sha(options, semanticInput);
  if (!identity.ok) return identity;

  return {
    ok: true,
    value: deepFreeze({
      schemaVersion: 1,
      planId: input.planId,
      planVersion: input.planVersion,
      binding: { ...input.binding },
      state,
      requirements: assessments,
      dependencyClosure,
      criticalPathRequirementIds,
      missingCriticalPathObligationIds,
      ownerChangeImpact,
      unknowns,
      semanticIdentity: identity.value,
    }),
  };
}
