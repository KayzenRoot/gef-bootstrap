// M16 Policy & Guardrail Engine - s02-evaluation.ts
// S02: Obligation Composition Graph (OCG), Conflict-Preserving Policy Join
//      (CPPJ), Applicability Witness Set (AWS), Policy Decision Receipt (PDR),
//      Guardrail Short-Circuit Firewall (GSF).
// Deterministic, bounded, cycle-safe, cancellation-aware. No side effects.

import type {
  ApplicabilityAssessment,
  DecidePolicyInput,
  FirewallStep,
  Obligation,
  ObligationComposition,
  OperationOptions,
  PolicyAssessment,
  PolicyAuthorityCapsule,
  PolicyDecision,
  PolicyDecisionReceipt,
  PolicyJoinResult,
  PolicyRequest,
  Result,
} from './types.js';
import {
  cancelled,
  compareCodePoint,
  deepFreeze,
  fail,
  safeLimit,
  sha,
  sortedStrings,
  DEFAULT_MAX_EDGES,
  DEFAULT_MAX_NODES,
} from './utils.js';

// ─── Obligation Composition Graph (OCG) ───────────────────────────────────────

/**
 * Compose required controls by dependency: bounded, deterministic, cycle-safe
 * topological order over obligation dependsOn edges. Unknown dependencies,
 * duplicates and cycles fail closed.
 */
export function composeObligations(
  obligations: readonly Obligation[],
  options: OperationOptions,
): Result<ObligationComposition> {
  const c = cancelled(options);
  if (c) return c;

  const maxNodes = safeLimit(options.maxNodes, DEFAULT_MAX_NODES);
  const maxEdges = safeLimit(options.maxEdges, DEFAULT_MAX_EDGES);
  if (obligations.length > maxNodes) {
    return fail(
      'POLICY_OBLIGATION_BUDGET_EXHAUSTED',
      `Obligation budget exhausted: ${obligations.length} exceed ${maxNodes}`,
    );
  }

  const byId = new Map<string, Obligation>();
  for (const obligation of obligations) {
    if (byId.has(obligation.obligationId)) {
      const first = byId.get(obligation.obligationId);
      if (first !== undefined && first.statement === obligation.statement) continue;
      return fail(
        'POLICY_OBLIGATION_DUPLICATE_NODE',
        `Duplicate obligation with conflicting statement: ${obligation.obligationId}`,
        obligation.obligationId,
      );
    }
    byId.set(obligation.obligationId, obligation);
  }

  let edgeCount = 0;
  const dependents = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of byId.keys()) {
    dependents.set(id, []);
    indegree.set(id, 0);
  }
  for (const obligation of byId.values()) {
    const uniqueDeps = [...new Set(obligation.dependsOn)].sort(compareCodePoint);
    for (const dep of uniqueDeps) {
      if (!byId.has(dep)) {
        return fail(
          'POLICY_OBLIGATION_UNKNOWN_DEPENDENCY',
          `Obligation ${obligation.obligationId} depends on unknown ${dep}`,
          dep,
        );
      }
      if (dep === obligation.obligationId) {
        return fail(
          'POLICY_OBLIGATION_CYCLE',
          `Obligation ${obligation.obligationId} depends on itself`,
          obligation.obligationId,
        );
      }
      edgeCount += 1;
      if (edgeCount > maxEdges) {
        return fail(
          'POLICY_OBLIGATION_BUDGET_EXHAUSTED',
          `Obligation edge budget exhausted beyond ${maxEdges}`,
        );
      }
      const list = dependents.get(dep);
      if (list !== undefined) list.push(obligation.obligationId);
      indegree.set(obligation.obligationId, (indegree.get(obligation.obligationId) ?? 0) + 1);
    }
  }

  const order: string[] = [];
  let ready = sortedStrings([...byId.keys()].filter(id => (indegree.get(id) ?? 0) === 0));
  while (ready.length > 0) {
    const stop = cancelled(options);
    if (stop !== null) return stop;
    const next: string[] = [];
    for (const id of ready) {
      order.push(id);
      for (const dependent of dependents.get(id) ?? []) {
        const remaining = (indegree.get(dependent) ?? 1) - 1;
        indegree.set(dependent, remaining);
        if (remaining === 0) next.push(dependent);
      }
    }
    ready = sortedStrings(next);
  }
  if (order.length !== byId.size) {
    const cyclic = sortedStrings([...byId.keys()].filter(id => !order.includes(id)));
    return fail(
      'POLICY_OBLIGATION_CYCLE',
      `Obligation cycle detected involving: ${cyclic.join(', ')}`,
      cyclic[0] ?? 'unknown',
    );
  }
  return {
    ok: true,
    value: deepFreeze({ order, closedIds: sortedStrings([...byId.keys()]) }),
  };
}

// ─── Applicability Witness Set (AWS) ──────────────────────────────────────────

type DimensionVerdict = 'MATCH' | 'NO_MATCH' | 'IRRELEVANT';

function dimensionVerdict(policySide: readonly string[], requestSide: readonly string[]): DimensionVerdict {
  if (policySide.length === 0 || requestSide.length === 0) return 'IRRELEVANT';
  if (policySide.includes('*')) return 'MATCH';
  return requestSide.some(entry => policySide.includes(entry)) ? 'MATCH' : 'NO_MATCH';
}

function matchesRequest(
  applicability: { domains: readonly string[]; operations: readonly string[]; matchMode: 'ANY' | 'ALL' },
  request: PolicyRequest,
): boolean {
  if (applicability.domains.length === 0 && applicability.operations.length === 0) {
    return request.domains.length === 0 && request.operations.length === 0;
  }
  const domain = dimensionVerdict(applicability.domains, request.domains);
  const operation = dimensionVerdict(applicability.operations, request.operations);
  if (applicability.matchMode === 'ANY') {
    if (domain === 'MATCH' || operation === 'MATCH') return true;
    if (domain === 'NO_MATCH' || operation === 'NO_MATCH') return false;
    return true;
  }
  if (domain === 'NO_MATCH' || operation === 'NO_MATCH') return false;
  return true;
}

/**
 * Explain why every considered policy applies, does not apply, is unknown
 * or is blocked. Empty applicability is UNKNOWN (fail-closed: a policy that
 * declares nothing determines nothing); unsupported schema is BLOCKED.
 */
export function buildApplicabilityWitnessSet(
  policies: readonly PolicyAuthorityCapsule[],
  request: PolicyRequest,
  supportedSchemas: readonly string[],
): readonly ApplicabilityAssessment[] {
  return deepFreeze(
    policies.map(policy => {
      if (!supportedSchemas.includes(policy.schemaVersion)) {
        return {
          policyId: policy.policyId,
          state: 'BLOCKED' as const,
          witness: `blocked:unsupported-schema:${policy.schemaVersion}`,
        };
      }
      if (policy.applicability.domains.length === 0 && policy.applicability.operations.length === 0) {
        return {
          policyId: policy.policyId,
          state: 'UNKNOWN' as const,
          witness: 'unknown:empty-applicability',
        };
      }
      if (matchesRequest(policy.applicability, request)) {
        const domainWitness = request.domains.find(d =>
          policy.applicability.domains.includes('*') || policy.applicability.domains.includes(d),
        );
        const operationWitness = request.operations.find(o =>
          policy.applicability.operations.includes('*') || policy.applicability.operations.includes(o),
        );
        const parts: string[] = [];
        if (domainWitness !== undefined) parts.push(`domain:${domainWitness}`);
        if (operationWitness !== undefined) parts.push(`operation:${operationWitness}`);
        return {
          policyId: policy.policyId,
          state: 'APPLICABLE' as const,
          witness: `applicable:${parts.join('+') || 'wildcard'}`,
        };
      }
      return {
        policyId: policy.policyId,
        state: 'NOT_APPLICABLE' as const,
        witness: 'not-applicable:no-match',
      };
    }),
  );
}

// ─── Conflict-Preserving Policy Join (CPPJ) ───────────────────────────────────

function obligationsCompatible(
  kept: Obligation,
  incoming: Obligation,
): boolean {
  if (kept.statement !== incoming.statement) return false;
  if (kept.conflictsWith.includes(incoming.obligationId)) return false;
  if (incoming.conflictsWith.includes(kept.obligationId)) return false;
  return true;
}

/**
 * Join assessments without silently choosing between incompatible
 * authorities. DENY is never erased by ALLOW; BLOCK_UNKNOWN never becomes
 * permissive; incompatible obligations/authorities are preserved as explicit
 * conflicts that block dependent actions. Order-independent: inputs are
 * normalized before combination, so reversal cannot change the outcome.
 */
export function joinPolicyAssessments(
  assessments: readonly PolicyAssessment[],
  policiesById: ReadonlyMap<string, PolicyAuthorityCapsule>,
): PolicyJoinResult {
  const ordered = [...assessments].sort((a, b) => compareCodePoint(a.policyId, b.policyId));
  const denials: string[] = [];
  const unknowns: string[] = [];
  const conflicts: Array<{ kind: 'AUTHORITY' | 'OBLIGATION'; policyIds: readonly string[]; detail: string }> = [];
  const merged = new Map<string, { obligation: Obligation; policyIds: string[] }>();

  for (const assessment of ordered) {
    if (assessment.decision === 'DENY') denials.push(assessment.policyId);
    else if (assessment.decision === 'BLOCK_UNKNOWN') unknowns.push(assessment.policyId);
    else {
      for (const obligation of [...assessment.obligations].sort((a, b) => compareCodePoint(a.obligationId, b.obligationId))) {
        const kept = merged.get(obligation.obligationId);
        if (kept === undefined) {
          merged.set(obligation.obligationId, { obligation, policyIds: [assessment.policyId] });
          continue;
        }
        const combined: Obligation = {
          ...kept.obligation,
          mandatory: kept.obligation.mandatory || obligation.mandatory,
          dependsOn: sortedStrings([...kept.obligation.dependsOn, ...obligation.dependsOn]),
          conflictsWith: sortedStrings([...kept.obligation.conflictsWith, ...obligation.conflictsWith]),
        };
        if (!obligationsCompatible(kept.obligation, obligation)) {
          const policyIds = sortedStrings([...kept.policyIds, assessment.policyId]);
          const domains = new Set(
            policyIds.map(id => policiesById.get(id)?.precedenceDomain ?? 'unknown'),
          );
          conflicts.push({
            kind: domains.size > 1 ? 'AUTHORITY' : 'OBLIGATION',
            policyIds,
            detail: `Incompatible obligation ${obligation.obligationId} across ${policyIds.join(',')}`,
          });
        }
        kept.policyIds.push(assessment.policyId);
        merged.set(obligation.obligationId, { obligation: combined, policyIds: kept.policyIds });
      }
    }
  }

  const decision = combineDecisionsForJoin(ordered, denials, unknowns, conflicts);
  const obligations = [...merged.values()]
    .map(entry => entry.obligation)
    .sort((a, b) => compareCodePoint(a.obligationId, b.obligationId));
  return deepFreeze({
    decision,
    obligations,
    denials: sortedStrings(denials),
    unknowns: sortedStrings(unknowns),
    conflicts: conflicts
      .map(c => ({ ...c, policyIds: sortedStrings(c.policyIds) }))
      .sort((a, b) => compareCodePoint(a.detail, b.detail)),
  });
}

function combineDecisionsForJoin(
  ordered: readonly PolicyAssessment[],
  denials: readonly string[],
  unknowns: readonly string[],
  conflicts: readonly unknown[],
): PolicyJoinResult['decision'] {
  void ordered;
  if (denials.length > 0) return 'DENY';
  if (unknowns.length > 0 || conflicts.length > 0) return 'BLOCK_UNKNOWN';
  const obligated = ordered.some(a => a.decision === 'ALLOW_WITH_OBLIGATIONS');
  if (ordered.length === 0) return 'BLOCK_UNKNOWN';
  return obligated ? 'ALLOW_WITH_OBLIGATIONS' : 'ALLOW';
}

// ─── Policy Decision Receipt (PDR) ────────────────────────────────────────────

/** Issue the deterministic receipt binding inputs, outcome and provenance. */
export function issuePolicyDecisionReceipt(
  input: {
    packIdentity: string;
    taskIdentity: string;
    policyVersion: string;
    decision: PolicyDecision;
    obligations: readonly Obligation[];
    denials: readonly string[];
    unknowns: readonly string[];
    conflicts: PolicyJoinResult['conflicts'];
    exceptionsApplied: PolicyDecisionReceipt['exceptionsApplied'];
    provenance: readonly { sourceRef: string; policyId: string; decisionRef: string }[];
    policyFingerprints: readonly string[];
  },
  options: OperationOptions,
): Result<PolicyDecisionReceipt> {
  const c = cancelled(options);
  if (c) return c;

  if (!input.packIdentity || input.packIdentity.trim().length === 0) {
    return fail('POLICY_RECEIPT_INVALID', 'PDR requires the guarded pack identity');
  }
  if (!input.taskIdentity || input.taskIdentity.trim().length === 0) {
    return fail('POLICY_RECEIPT_INVALID', 'PDR requires the task identity');
  }
  if (!input.policyVersion || input.policyVersion.trim().length === 0) {
    return fail('POLICY_RECEIPT_INVALID', 'PDR requires the policy version');
  }

  const setFingerprint = sha(options, {
    policies: sortedStrings(input.policyFingerprints),
  });
  if (!setFingerprint.ok) return setFingerprint;

  const digest = sha(options, {
    packIdentity: input.packIdentity,
    taskIdentity: input.taskIdentity,
    policyVersion: input.policyVersion,
    decision: input.decision,
    obligations: sortedStrings(
      input.obligations.map(o =>
        JSON.stringify({ id: o.obligationId, statement: o.statement, mandatory: o.mandatory }),
      ),
    ),
    denials: sortedStrings(input.denials),
    unknowns: sortedStrings(input.unknowns),
    conflicts: sortedStrings(input.conflicts.map(k => JSON.stringify({ ...k }))),
    exceptions: sortedStrings(input.exceptionsApplied.map(e => JSON.stringify({ ...e }))),
    provenance: sortedStrings(input.provenance.map(p => JSON.stringify({ ...p }))),
    policyFingerprints: sortedStrings(input.policyFingerprints),
  });
  if (!digest.ok) return digest;

  return {
    ok: true,
    value: deepFreeze({
      packIdentity: input.packIdentity,
      taskIdentity: input.taskIdentity,
      policyVersion: input.policyVersion,
      decision: input.decision,
      obligations: [...input.obligations],
      denials: sortedStrings(input.denials),
      unknowns: sortedStrings(input.unknowns),
      conflicts: [...input.conflicts],
      exceptionsApplied: [...input.exceptionsApplied],
      provenance: [...input.provenance],
      policyFingerprints: sortedStrings(input.policyFingerprints),
      policySetFingerprint: setFingerprint.value,
      digest: digest.value,
    }),
  };
}

// ─── Guardrail Short-Circuit Firewall (GSF) ───────────────────────────────────

/**
 * Decide whether evaluation may stop early. DENY and BLOCK_UNKNOWN are
 * terminal under the join (further evaluation cannot make the action safer),
 * so short-circuit is permitted with the remainder recorded. ALLOW and
 * ALLOW_WITH_OBLIGATIONS never short-circuit while mandatory domains
 * remain: early ALLOW before full mandatory evaluation is impossible
 * by construction — the firewall simply answers false.
 */
export function applyShortCircuitFirewall(
  evaluated: ReadonlyArray<{ domain: string; decision: PolicyDecision }>,
  pendingDomains: readonly string[],
): FirewallStep {
  const decisions = evaluated.map(e => e.decision);
  const terminal = decisions.includes('DENY') || decisions.includes('BLOCK_UNKNOWN');
  const decision: PolicyDecision = decisions.includes('DENY')
    ? 'DENY'
    : decisions.includes('BLOCK_UNKNOWN')
      ? 'BLOCK_UNKNOWN'
      : decisions.includes('ALLOW_WITH_OBLIGATIONS')
        ? 'ALLOW_WITH_OBLIGATIONS'
        : 'ALLOW';
  const domain = evaluated.length === 0 ? '' : (evaluated[evaluated.length - 1]?.domain ?? '');
  return deepFreeze({
    domain,
    decision,
    shortCircuited: terminal && pendingDomains.length > 0,
    unevaluatedDomains: terminal ? [...pendingDomains] : [],
  });
}

// ─── Top-level policy decision ────────────────────────────────────────────────

/**
 * Evaluate all policies for one request and issue the receipt. Domains are
 * evaluated in code-point order with firewall short-circuit on terminal
 * outcomes; unresolved mandatory domains fail closed as BLOCK_UNKNOWN.
 */
export function decidePolicy(
  input: DecidePolicyInput,
  options: OperationOptions,
): Result<PolicyDecisionReceipt> {
  const c = cancelled(options);
  if (c) return c;

  const policiesById = new Map(input.policies.map(p => [p.policyId, p]));
  const witnessSet = buildApplicabilityWitnessSet(input.policies, input.request, input.supportedSchemas);

  const assessments: PolicyAssessment[] = [];
  const domainsSeen = new Set<string>();
  const sortedDomains = sortedStrings([...new Set(input.policies.flatMap(p => [...p.scopeDomains]))]);
  let firewall: FirewallStep | null = null;

  for (const domain of sortedDomains) {
    const stop = cancelled(options);
    if (stop !== null) return stop;
    const domainPolicies = input.policies
      .filter(p => p.scopeDomains.includes(domain) || p.scopeDomains.includes('*'))
      .sort((a, b) => compareCodePoint(a.policyId, b.policyId));
    for (const policy of domainPolicies) {
      const witness = witnessSet.find(w => w.policyId === policy.policyId);
      if (witness === undefined) continue;
      domainsSeen.add(domain);
      if (witness.state === 'APPLICABLE') {
        assessments.push({
          policyId: policy.policyId,
          decision:
            policy.effectOnMatch === 'ALLOW' && policy.obligations.length > 0
              ? 'ALLOW_WITH_OBLIGATIONS'
              : policy.effectOnMatch,
          obligations: [...policy.obligations],
          witness: witness.witness,
        });
      } else if (witness.state === 'UNKNOWN' || witness.state === 'BLOCKED') {
        assessments.push({
          policyId: policy.policyId,
          decision: 'BLOCK_UNKNOWN',
          obligations: [],
          witness: witness.witness,
        });
      }
    }
    const evaluated = assessments.map(a => {
      const policy = policiesById.get(a.policyId);
      const scope = policy?.scopeDomains.find(d => d === domain) ?? domain;
      return { domain: scope, decision: a.decision };
    });
    const pending = sortedDomains.filter(d => !domainsSeen.has(d));
    firewall = applyShortCircuitFirewall(evaluated, pending);
    if (firewall.shortCircuited) break;
  }
  void firewall;

  // Mandatory domains with no applicable policy fail closed.
  const applicableIds = new Set(
    witnessSet.filter(w => w.state === 'APPLICABLE').map(w => w.policyId),
  );
  const unresolvedMandatory = input.mandatoryDomains.filter(domain => {
    const covering = input.policies.filter(
      p =>
        (p.scopeDomains.includes(domain) || p.scopeDomains.includes('*')) &&
        applicableIds.has(p.policyId),
    );
    return covering.length === 0;
  });
  const joinInput = [...assessments];
  for (const domain of unresolvedMandatory) {
    joinInput.push({
      policyId: `mandatory-domain:${domain}`,
      decision: 'BLOCK_UNKNOWN',
      obligations: [],
      witness: 'unknown:mandatory-domain-unresolved',
    });
  }

  const join = joinPolicyAssessments(joinInput, policiesById);

  const obligationClosure = composeObligations(join.obligations, options);
  if (!obligationClosure.ok) {
    return { ok: false, diagnostics: obligationClosure.diagnostics };
  }

  const policyFingerprints = sortedStrings(
    assessments
      .map(a => policiesById.get(a.policyId)?.semanticIdentity)
      .filter((fp): fp is string => typeof fp === 'string'),
  );

  return issuePolicyDecisionReceipt(
    {
      packIdentity: input.packBinding.packId,
      taskIdentity: input.packBinding.taskIdentity,
      policyVersion: input.packBinding.policyVersion,
      decision: join.decision,
      obligations: join.obligations,
      denials: join.denials,
      unknowns: join.unknowns,
      conflicts: join.conflicts,
      exceptionsApplied: [],
      provenance: assessments.map(a => ({
        sourceRef: policiesById.get(a.policyId)?.ownerProvenance ?? 'unknown-source',
        policyId: a.policyId,
        decisionRef: join.decision,
      })),
      policyFingerprints,
    },
    options,
  );
}
