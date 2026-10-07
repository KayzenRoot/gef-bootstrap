// GBS-MOD-WO-001 — the routing chain used by the adversarial and benchmark suites.
//
// Each engine in the chain is owned by a different package and communicates only through plain
// data, so this helper is the single place that knows the wiring. It exists so the adversarial
// fixtures exercise the real chain rather than one stage in isolation: a path trick that slips
// past the classifier would be visible here even if every stage passed alone.

import { createHash } from 'node:crypto';

import { classifyChangeImpact } from '../../packages/preflight/dist/index.js';
import { compileTieredContextLock } from '../../packages/task-context-compiler/dist/public.js';
import { buildTestMap, compileGateClosure, tierToValidationLevel } from '../../packages/test-impact-engine/dist/public.js';
import { decideGefGate } from '../../packages/assurance-pipeline/dist/public.js';

export const digest = {
  algorithm: 'sha256',
  digest: (input) => createHash('sha256').update(input).digest('hex'),
};

export const options = { digest, maxUnits: 8192, maxHistory: 128 };

const sha = (value) => `sha256:${createHash('sha256').update(value).digest('hex')}`;

/** The main branch ruleset contexts recorded in the GBS-MOD-WO-001 implementation Context Lock. */
export const MAIN_RULESET_CONTEXTS = Object.freeze([
  'Repository validation',
  'Pipeline integrity',
  'Gitleaks secrets',
  'Trivy filesystem and configuration',
]);

/**
 * Obligations no gate receipt may omit. The Work Order makes these non-negotiable even for the
 * governance-only fast path, so the chain asserts them on the gate's behalf instead of trusting
 * the caller to remember them.
 */
export const MANDATORY_OBLIGATION_FLOOR = Object.freeze([
  'GIT_DIFF_INTEGRITY',
  'JSON_SCHEMA_PARSE',
  'SOURCE_HIERARCHY_BINDING',
  'SECRET_CONFIG_SECURITY',
]);

const WORK_ORDER_PATH = '.engineering/work-orders/GBS-MOD-WO-001.md';
const CONTEXT_LOCK_PATH = '.engineering/context-locks/GBS-MOD-WO-001.json';

const ROUTER_SOURCES = Object.freeze([
  { id: 'SRC.WO_CONTRACT', fingerprint: sha('wo-contract') },
  { id: 'SRC.CHANGE_IMPACT', fingerprint: sha('change-impact') },
  { id: 'SRC.CONTEXT_LOCK', fingerprint: sha('context-lock') },
  { id: 'SRC.GATE_CLOSURE', fingerprint: sha('gate-closure') },
  { id: 'SRC.GEF_GATE', fingerprint: sha('gef-gate') },
]);

const ROUTER_TESTS = Object.freeze([
  { id: 'TEST.WO_CONTRACT', fingerprint: sha('t-wo'), sources: ['SRC.WO_CONTRACT'] },
  { id: 'TEST.CHANGE_IMPACT', fingerprint: sha('t-impact'), sources: ['SRC.CHANGE_IMPACT'] },
  { id: 'TEST.CONTEXT_LOCK', fingerprint: sha('t-lock'), sources: ['SRC.CONTEXT_LOCK'] },
  { id: 'TEST.GATE_CLOSURE', fingerprint: sha('t-closure'), sources: ['SRC.GATE_CLOSURE'] },
  { id: 'TEST.GEF_GATE', fingerprint: sha('t-gate'), sources: ['SRC.GEF_GATE'] },
]);

/** Attribution for the sources this Work Order owns; anything else is unattributed by construction. */
export const ROUTER_SOURCE_PATH_INDEX = Object.freeze({
  'AGENTS.md': ['SRC.CHANGE_IMPACT'],
  'packages/contracts/src/work-order.ts': ['SRC.WO_CONTRACT'],
  'packages/preflight/src/change-impact.ts': ['SRC.CHANGE_IMPACT'],
  'packages/task-context-compiler/src/s07-tiered-context-lock.ts': ['SRC.CONTEXT_LOCK'],
  'packages/test-impact-engine/src/gate-closure.ts': ['SRC.GATE_CLOSURE'],
  'packages/assurance-pipeline/src/gef-gate.ts': ['SRC.GEF_GATE'],
  'tests/gbs-mod-wo-001-routing.test.mjs': ['SRC.CHANGE_IMPACT'],
});

const ROUTER_MAP = buildTestMap(ROUTER_SOURCES, ROUTER_TESTS, options);

/** Provider checks the router may classify, with the workflow that owns each one. */
export const PROVIDER_CANDIDATE_CHECKS = Object.freeze([
  { checkId: 'Analyze TypeScript', ownerWorkflow: 'security-codeql.yml', reason: 'STATIC_ANALYSIS_OF_CHANGED_SOURCE', outsideChangedClosure: true },
  { checkId: 'Node coverage LCOV', ownerWorkflow: 'coverage-codecov.yml', reason: 'COVERAGE_OF_CHANGED_SOURCE', outsideChangedClosure: true },
  { checkId: 'M41-M47 focused', ownerWorkflow: 'm41-m47-integrated.yml', reason: 'INTEGRATED_ASSURANCE_AREA_H', outsideChangedClosure: true },
  { checkId: 'M48-M54 focused', ownerWorkflow: 'm48-m54-integrated.yml', reason: 'INTEGRATED_ASSURANCE_DISTRIBUTION', outsideChangedClosure: true },
  { checkId: 'M55-M61 focused', ownerWorkflow: 'm55-m61-integrated.yml', reason: 'INTEGRATED_ASSURANCE_QUALITY', outsideChangedClosure: true },
  { checkId: 'M62-M63 focused', ownerWorkflow: 'm62-m63-final.yml', reason: 'FINAL_ASSURANCE_CLOSURE', outsideChangedClosure: true },
  { checkId: 'V1.1 release assurance', ownerWorkflow: 'v11-release-assurance.yml', reason: 'RELEASE_CANDIDATE_EVIDENCE', outsideChangedClosure: false },
]);

export const DEFAULT_GATE_INPUT = Object.freeze({
  gateId: 'GATE-ADVERSARIAL',
  repository: 'KayzenRoot/gef-bootstrap',
  workOrderId: 'GBS-MOD-WO-001',
  baseRef: 'main',
  baseSha: '921493797728a43aadc9f7840c954ce7e3ebc416',
  headSha: 'c76c2d8a8459f461bad519729d6b2fe83eed9d3d',
  policyDigest: sha('policy-v1'),
  candidateSemanticDigest: sha('candidate-head'),
});

/**
 * Runs the full routing chain for one candidate changed-path set.
 *
 * `facts` are the caller's repository observations. The chain never reads Git itself, so every
 * fact it consumes is visible in the result and auditable in a test.
 */
export function routeCandidate(changedPaths, over = {}) {
  const facts = over.facts ?? {};
  const impact = classifyChangeImpact({ changedPaths, facts }, digest);

  const lock = compileTieredContextLock(
    {
      taskIdentity: 'GBS-MOD-WO-001',
      workOrderId: DEFAULT_GATE_INPUT.workOrderId,
      workOrderPath: WORK_ORDER_PATH,
      contextLockPath: CONTEXT_LOCK_PATH,
      floorTier: impact.tier,
      declaredTier: over.declaredTier ?? impact.tier,
      baseSha: DEFAULT_GATE_INPUT.baseSha,
      headSha: DEFAULT_GATE_INPUT.headSha,
      affectedPaths: changedPaths.filter((path) => typeof path === 'string' && !path.startsWith('..')),
      readIfTriggered: [
        { path: '.engineering/DEPLOYMENT.md', trigger: 'RELEASE_SIGNIFICANCE' },
        { path: '.engineering/SECURITY.md', trigger: 'SECURITY' },
      ],
      triggeredDomains: impact.domains,
      obligations: impact.obligations,
      authorityConflict: facts.authorityConflict,
      changedStateUnproven: facts.changedStateUnproven,
    },
    options,
  );

  const closure = changedPaths.length === 0
    ? { ok: false, diagnostics: [{ code: 'GATE_CLOSURE_INPUT_INVALID', message: 'no changed paths to close' }] }
    : compileGateClosure(
        {
          map: ROUTER_MAP.value,
          sourcePathIndex: over.sourcePathIndex ?? ROUTER_SOURCE_PATH_INDEX,
          changedPaths,
          assurance: { requiredLevel: 'L1', policyDigest: sha('policy-v1'), profileDigest: sha('profile') },
          platform: 'ubuntu-latest',
          tierFloor: tierToValidationLevel(impact.tier),
          attributionComplete: over.attributionComplete ?? false,
        },
        options,
      );

  const gate = decideGefGate(
    {
      ...DEFAULT_GATE_INPUT,
      changedPaths,
      changeImpactDigest: impact.impactDigest,
      impactState: impact.state,
      riskTier: impact.tier,
      governanceFastPath: impact.governanceFastPath,
      escalateReasons: impact.escalateReasons,
      obligations: impact.obligations,
      contextLockDigest: lock.ok ? lock.value.lockDigest : sha(`lock-blocked:${lock.diagnostics.map((d) => d.code).join('+')}`),
      contextLockState: lock.ok ? lock.value.state : 'BLOCKED',
      closureDigest: closure.ok ? closure.value.closureDigest : null,
      validationFloor: closure.ok ? closure.value.effectiveFloor : null,
      rulesetRequiredContexts: MAIN_RULESET_CONTEXTS,
      mandatoryObligationFloor: MANDATORY_OBLIGATION_FLOOR,
      providerCandidateChecks: PROVIDER_CANDIDATE_CHECKS,
    },
    options,
  );

  return { impact, lock, closure, gate };
}