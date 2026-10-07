# GBS-MOD-WO-001 — Context, contract and assurance router

**Program:** #393
**State:** OWNER_AUTHORIZED_FOR_ADMISSION_PLANNING
**Risk:** ELEVATED
**Admission base:** `main@d81759c534da0bc0ac0df7a3f5372ed8d1e0089e`
**Product credit:** NONE; V1.2 remains 3/10.

## OBJECTIVE
Reduce recurring agent context and CI wall time by compiling the minimum sufficient authoritative context and selecting assurance deterministically from change impact/risk, while preserving fail-closed behavior and exact-state evidence.

## CONTEXT
The current GEF already has source hierarchy, Context Lock, preflight, test-impact and assurance machinery. The missing delta is to make the routing machine-enforceable and to stop broad workflow fan-out for changes whose impact is provably narrow. PR #390 is the baseline example: three governance/evidence paths triggered 38 checks.

## SCOPE — NECESSARY
1. Compact root `AGENTS.md` into a router, not a project encyclopedia. It must preserve actor/authority/safety essentials and route to relevant canonical sources by trigger.
2. Add a versioned machine-readable Work Order contract/schema with at minimum:
   - workOrderId, risk, baseSha;
   - issue/PR/branch bindings;
   - MUST_READ / READ_IF_TRIGGERED;
   - WRITE_ALLOWED / WRITE_FORBIDDEN globs;
   - requiredChecks / evidence obligations;
   - scope/outOfScope;
   - dependency IDs;
   - stopCondition.
3. Add deterministic risk + impact classification using repository facts and changed paths, never model confidence.
4. Add risk-tiered Context Lock/preflight:
   - LOW: exact HEAD + affected files + required authority;
   - STANDARD: plus relevant Scope/Architecture;
   - ELEVATED: plus Requirements/Security/Data or affected contracts;
   - HIGH_ASSURANCE: full proof obligations and specialist gate where applicable.
5. Add a stable `GEF Gate` decision/receipt that reports which validations are required and why.
6. Implement a governance/docs-only fast path only when all changed paths and semantic classification prove it safe. It MUST still validate:
   - CHECKPOINT Markdown/JSON parity when checkpoint touched;
   - JSON/schema parse;
   - source hierarchy / exact-state binding;
   - git diff integrity;
   - pipeline integrity;
   - secret/config security applicable to changed surfaces.
7. Code/security/data/release/HIGH_ASSURANCE changes must conservatively expand validation; unknown/conflict must widen or block.
8. Add adversarial tests proving path tricks, rename/move, mixed doc+code changes, workflow/config/security changes, unknown files and risk escalation cannot select a weaker gate.
9. Record comparable baseline metrics from current behavior and post-change metrics without claiming a speed percentage until measured.

## IMPORTANT, NOT AUTO-INCLUDED
- GitHub ruleset rewrite. The connector available to ChatGPT is read-only for rulesets. WO-001 must provide the stable gate/check contract and documentation needed for a later authorized ruleset update or manual admin action if unavoidable.
- Parallel worktree orchestration (WO-003).
- Automated audit packet (WO-002).

## OUT OF SCOPE
- U12-03/U12-05..U12-10 implementation or credit.
- Profile implementation.
- Autonomous merge/checkpoint promotion.
- Lowering test, coverage, security or release thresholds.
- Disabling required security checks for product-code changes.
- Paid CI/services.
- Force push/history rewrite.
- Codex self-approval.
- Removing existing broad workflows before replacement equivalence is proven.

## FILES / SOURCES TO READ
MUST_READ:
- AGENTS.md
- .engineering/SOURCE-HIERARCHY.md
- .engineering/CHECKPOINT.md + CHECKPOINT.json
- .engineering/DECISIONS-LEDGER.md and ADR-0008
- .engineering/ARCHITECTURE.md
- .engineering/SECURITY.md
- .engineering/DEFINITION-OF-DONE.md
- .engineering/TEST-BENCHMARK-PLAN.md
- .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md
- .engineering/BACKLOG.md
- this Work Order + fresh implementation Context Lock
- package.json
- current preflight/context/test-impact/assurance contracts and tests
- all current workflow trigger definitions relevant to PR/push validation

READ_IF_TRIGGERED:
- release/distribution docs when release workflows are selected by impact;
- profile docs only if a profile path is touched;
- migration/data contracts only when changed paths/contracts require them.

## FILE INTENT / WRITE BOUNDARY

MUST_READ implementation ownership candidates:
- `packages/contracts/src/**`
- `packages/preflight/src/**`
- `packages/task-context-compiler/src/**`
- `packages/test-impact-engine/src/**`
- `packages/assurance-pipeline/src/**`
- `packages/cli/src/**` only if a thin CLI exposure is required
- relevant existing tests and workflow trigger definitions

WRITE_ALLOWED after fresh implementation-lock audit:
- `AGENTS.md`
- `packages/contracts/src/**`
- `packages/preflight/src/**`
- `packages/task-context-compiler/src/**`
- `packages/test-impact-engine/src/**`
- `packages/assurance-pipeline/src/**`
- `packages/cli/src/**` and `packages/cli/schemas/**` only for thin public/schema exposure proven necessary
- focused `tests/**`
- only the minimum existing `.github/workflows/**` files whose trigger/routing logic is proven necessary by exact preflight
- `.engineering/evidence/GBS-MOD-WO-001-*`
- `.engineering/checkpoint-deltas/GBS-MOD-WO-001-*`
- this Work Order / Context Lock only for factual execution/evidence binding

WRITE_FORBIDDEN without separately owner-approved Correction Delta:
- product/profile-specific packages unrelated to the routing contract
- V1.2 U12 implementation surfaces unrelated to shared preflight/context/assurance ownership
- package version, tags, releases or deployment manifests
- canonical `CHECKPOINT.md` / `CHECKPOINT.json` during implementation
- branch/ruleset protection settings
- dependency additions
- broad workflow deletion or threshold reduction
- generated/vendor files except deterministic regeneration already required by an authorized source change

Any need to write outside WRITE_ALLOWED is a STOP + Correction Delta, not implicit scope expansion.

## ARCHITECTURE RULES
- Extend existing preflight/context/test-impact/assurance engines. No parallel policy engine.
- GitHub remains provider adapter/evidence surface, not semantic authority.
- Gate classification is deterministic and versioned.
- Derived gate receipts never supersede canonical Source Pack.
- A narrower gate is allowed only with a proof that excluded checks are outside the changed dependency/risk closure.
- UNKNOWN, conflict, unsupported rename/path condition or unclassified write expands to at least STANDARD/ELEVATED as defined by policy, never LOW.
- Root AGENTS.md remains an acceleration layer, not canonical truth.

## CONSTRAINTS
- Codex alone authors/fixes code, tests, CI and migrations.
- ChatGPT may author this Work Order/governance and perform owner audit as NOT_INDEPENDENT.
- No new external paid dependency.
- Preserve cross-platform correctness.
- Any workflow change must have pipeline-integrity tests and a rollback path.
- Do not change GitHub branch rules via unsupported/unverifiable means.

## ACCEPTANCE CRITERIA
A1. Machine-readable Work Order contract parses and rejects missing/ambiguous authority fields.
A2. Context compiler loads only required canonical sources for a known narrow task and expands deterministically on triggered domains.
A3. LOW/STANDARD/ELEVATED/HIGH_ASSURANCE classifications are reproducible from the same input state.
A4. Governance-only change can select a smaller proof set than current broad fan-out, with explicit receipt explaining exclusions.
A5. Mixed governance+code, workflow, dependency, security, migration/data or release changes cannot use the governance fast path.
A6. Unknown/unclassified changes widen or block, never reduce assurance.
A7. Renames/moves/deletions and path traversal/case variants cannot evade classification.
A8. Required checkpoint parity is always enforced when CHECKPOINT.md or CHECKPOINT.json changes.
A9. GEF Gate output binds base/head or exact changed-state identity and required checks.
A10. Existing high-risk/release proof obligations remain intact.
A11. No executor self-approval/checkpoint promotion path is introduced.
A12. Comparable benchmark records baseline check fan-out and post-implementation result for at least one governance-only fixture and one code fixture.

## TESTS
- focused unit/property/adversarial tests for schema/router/risk/impact/gate;
- existing preflight/context/test-impact/assurance regressions;
- workflow/pipeline integrity tests;
- governance-only fixture;
- mixed doc+code fixture;
- security/workflow/dependency fixture;
- rename/delete/unknown-path fixture;
- build, typecheck, full validate, npm audit high, git diff --check;
- exact-head GitHub required/security checks;
- cross-platform tests where current owning package contract requires them.

## DELIVERABLES
- implementation inside existing ownership;
- versioned WO schema/contract;
- compact AGENTS.md router;
- risk/impact + GEF Gate receipt;
- tiered Context Lock/preflight;
- workflow routing changes only after equivalence tests;
- Evidence Bundle generated from raw proof;
- baseline/after benchmark receipt;
- proposed Checkpoint/maintenance delta only.

## REVIEW FORMAT
Brazilian Portuguese. Exact base/head; changed paths; architecture ownership; gate-classification proof; before/after check fan-out for comparable fixture; tests/security; CRITICAL/HIGH; scope; exactly one verdict APPROVED/CORRECTION REQUIRED/BLOCKED. Owner audit = NOT_INDEPENDENT.

## MACHINE-READABLE CONTRACT (executed)

The prose above is the reviewer form. The executor form this Work Order delivered is
`parseWorkOrderContract` in `packages/contracts/src/work-order.ts`, verified by
`tests/gbs-mod-wo-001-work-order-contract.test.mjs`. Its authority fields carry these values for
this execution:

- `workOrderId` `GBS-MOD-WO-001`; `repository` `KayzenRoot/gef-bootstrap`; `risk` `ELEVATED`;
  `baseSha` `921493797728a43aadc9f7840c954ce7e3ebc416`;
  `bindings` `{ branch: feat/mod/wo-001-agent-native-gate, issue: 394, pullRequest: 407 }`;
  `stopCondition` `GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`.
- `writeAllowed` and `writeForbidden` express the WRITE_ALLOWED / WRITE_FORBIDDEN boundary in the
  pattern grammar the parser accepts. The parser rejects a contract where the two overlap, and a
  path that cannot carry authority — traversal, `.` segment, empty, non-string — resolves to
  `FORBIDDEN` rather than `UNCLASSIFIED`.
- **Disclosed limit:** GBS-MOD-WO-001's own authority boundary is still recorded as prose in
  `.engineering/context-locks/GBS-MOD-WO-001.json` (`implementationAuthorization.writeAllowed` /
  `writeForbidden`), and several of those entries are descriptive phrases rather than globs
  (`packages/cli/src/** only if thin exposure is proven necessary`). They are therefore *not*
  machine-parseable today, and no production caller invokes `parseWorkOrderContract` yet. What this
  Work Order proves is the grammar and the ambiguity rule, not that this Work Order's boundary is
  enforced by it. Encoding this Work Order's boundary in the machine-readable form is follow-up
  work for the Work Order that first needs enforcement.
- `requiredChecks` are the main-branch ruleset contexts from the implementation Context Lock;
  `evidenceObligations` are the Evidence Bundle and the proposed Checkpoint Delta.

An unknown field, a missing field, an unsupported `schemaVersion` or an ambiguous write boundary is
a parse diagnostic, never a default.

## EXECUTED DELTA (binding)

Implementation head at evidence assembly: `c76c2d8a8459f461bad519729d6b2fe83eed9d3d` plus the delta
in `.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md` section 2.

- Nodes delivered: A `packages/contracts/src/work-order.ts`; B `packages/preflight/src/change-impact.ts`;
  C `packages/task-context-compiler/src/s07-tiered-context-lock.ts`; D `packages/test-impact-engine/src/gate-closure.ts`;
  E `packages/assurance-pipeline/src/gef-gate.ts`; SCOPE 1 `AGENTS.md` compacted into a trigger router.
- No package manifest, `tsconfig.json`, dependency, version, tag, release, ruleset or branch
  protection was changed. The stages communicate only through plain data.
- Workflow routing delta is empty by proof: the four required main-branch ruleset contexts are
  produced by `repository-validation.yml`, `pipeline-integrity.yml` and `free-security-pilot.yml`, so a
  `paths:` filter would stop them reporting on a governance-only pull request. The ruleset rewrite is
  listed under *Important, not auto-included* above, so the stable gate/check contract is delivered
  for a later authorized ruleset update instead. Narrowing candidates are reported with
  `NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION`.
- Validation: `npm run validate` 1775 / 1775 pass, 0 fail, 0 skipped; `npm audit --audit-level=high`
  0 vulnerabilities; `git diff --check` clean. Baseline at the implementation head was 1659 / 1659.
- Exact-head GitHub required and security checks: `NOT_VERIFIED` from the executor environment.

Evidence: `.engineering/evidence/GBS-MOD-WO-001-EVIDENCE.md`,
`.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json`,
`.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md`.

## STOP CONDITIONS
Admission planning: `GBS_MOD_WO_001_ADMISSION_READY_FOR_OWNER_AUDIT`
After admission: `GBS_MOD_WO_001_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK`
After lock audit: `GBS_MOD_WO_001_ADMITTED_READY_FOR_CODEX`
Implementation: `GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`
Terminal: `GBS_MOD_WO_001_PROMOTED`
