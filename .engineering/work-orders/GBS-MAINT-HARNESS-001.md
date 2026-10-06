# GBS-MAINT-HARNESS-001 — Agent-Native Harness Foundation

**State:** OWNER_AUTHORIZED_FOR_ADMISSION_PLANNING / IMPLEMENTATION_NOT_YET_ADMITTED  
**Risk:** ELEVATED  
**Issue:** #391  
**Admission base:** `main@d81759c534da0bc0ac0df7a3f5372ed8d1e0089e`  
**Current V1.2 product credit:** `3/10`, unchanged by this maintenance increment.

## OBJECTIVE

Convert the highest-value GEF process rules from prose-only discipline into deterministic repository enforcement while reducing redundant CI work. Improve throughput without weakening assurance, changing V1.2 product credit, or creating a parallel planner/executor/reviewer engine.

## CONTEXT

The completed governance-only PR #390 changed exactly three `.engineering/**` files yet exercised a large cross-platform/release matrix. Canonical requirements already mandate Minimum Sufficient Context, delta review, selective impacted validation, exact-state evidence, fail-closed uncertainty and GitHub-first governance. This maintenance increment operationalizes those requirements before the next functional V1.2 Work Order.

## SCOPE — NECESSARY

1. Deterministic exact-base/head change classification with at least:
   - `GOVERNANCE_DOC_ONLY`
   - `CODE_OR_TEST`
   - `CI_OR_WORKFLOW`
   - `DEPENDENCY_OR_PACKAGE`
   - `SECURITY_SENSITIVE`
   - `UNKNOWN`
   Unknown/mixed/ambiguous must widen to FULL.

2. Validation plan compiler that reuses existing preflight/test-impact/execution-pack ownership and selects the smallest safe applicable validation set.

3. Versioned JSON Schema 2020-12 machine contract for active Work Order metadata. Human-readable Work Order remains semantic authority; shared-field divergence fails closed.

4. Deterministic harness preflight for Work Order / Context Lock / head / allowed-path / checkpoint-parity / validation-plan coherence.

5. Exact-head machine-readable `AUDIT_READY` receipt that reports readiness facts but cannot encode semantic approval or independence.

6. Progressive CI: cheap classification/preflight first, expensive fanout only when required. Existing required branch/ruleset contexts must remain satisfied or be changed only through a separately reviewed equivalent gate.

7. Shorter `AGENTS.md` executor router that points to checkpoint, active Work Order, Context Lock and task-relevant canonical sources without duplicating the Source Pack.

8. Measured before/after benchmark using PR #390 as baseline and a comparable governance-only candidate after implementation. No unproven percentage claims.

## IMPORTANT — FOLLOW-UP, NOT AUTO-INCLUDED

- event-triggered semantic reviewer invocation;
- dependency-DAG parallel Codex/worktree execution;
- merge queue adoption;
- broad ruleset redesign;
- Symphony-style orchestration.

These require later increments after this foundation is objectively accepted.

## OUT OF SCOPE

- U12-03 or U12-05..U12-10 implementation/credit;
- C03/C12/D01-D12 profiles;
- new top-level planner/executor/reviewer/evidence/test-impact engines;
- paid CI/SaaS/tooling;
- disabling security checks;
- lowering test/coverage/quality/review thresholds;
- executor self-approval;
- force push/history rewrite/destructive Git operations;
- release/tag/npm publication/deployment.

## FILES / SOURCES TO READ

Always:
1. `AGENTS.md`
2. `.engineering/SOURCE-HIERARCHY.md`
3. `.engineering/CHECKPOINT.md`
4. `.engineering/CHECKPOINT.json`
5. `.engineering/DECISIONS-LEDGER.md`
6. `.engineering/SCOPE.md`
7. `.engineering/DEFINITION-OF-DONE.md`
8. `.engineering/ARCHITECTURE.md`
9. `.engineering/REQUIREMENTS.md`
10. `.engineering/SECURITY.md`
11. `.engineering/TEST-BENCHMARK-PLAN.md`
12. `.engineering/BACKLOG.md`
13. `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md`
14. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`
15. this Work Order and the fresh implementation Context Lock.

Implementation discovery may additionally read current M04/M14/M15/M16/M24/M27/M28 source/tests and affected GitHub workflows, but must not broaden product scope.

## REQUIREMENTS

Primary existing requirements:
- `REQ-FUNC-001` Minimum Sufficient Context.
- `REQ-FUNC-002` pre-resolved bounded execution.
- `REQ-FUNC-003` compact machine evidence.
- `REQ-FUNC-004` delta semantic review.
- `REQ-FUNC-005` selective impacted validation.
- `REQ-ASSURE-001..003` assurance, truthful terminal states, exact-state binding.
- `REQ-PLAT-001` GitHub first-class provider profile.
- `REQ-DET-004/005` receipts and derived-state subordination.
- `REQ-SEC-003/004` integrity/validity and mutation gates.

No new product requirement is admitted by this maintenance Work Order.

## ARCHITECTURE RULES

- Reuse M04 Preflight, M14 Task Context, M15 Execution Pack, M16 Guardrails, M24 Evidence, M27 Assurance and M28 Test Impact semantics.
- GitHub is a provider profile; core classification/plan logic stays deterministic/provider-neutral where practical.
- Derived validation plans/receipts remain subordinate to canonical truth.
- Exact-state binding and fail-closed staleness are mandatory.
- Fast path means evidence-proven applicability reduction, never weaker assurance.
- No second executor, proof graph, evidence engine, review engine or test-impact engine.

## CONSTRAINTS

- Codex alone authors/fixes implementation code, tests, CI and migrations under ADR-0008 / D-0063.
- ChatGPT owns planning/governance docs, GitHub coordination, objective audit and checkpoint promotion.
- Existing branch protection and required contexts may not be bypassed.
- Any unresolved change-class uncertainty => FULL.
- No threshold weakening or broad coverage exclusion.
- No V1.2 denominator movement.
- No paid-tool or expanded paid-CI activation.

## ACCEPTANCE CRITERIA

- `HAF-01` deterministic exact-base/head change classification.
- `HAF-02` ambiguous/mixed input widens to FULL.
- `HAF-03` governance-only plan excludes only demonstrably irrelevant expensive matrices while retaining required governance/security checks.
- `HAF-04` code/test/workflow/dependency/security changes widen to appropriate full/specialized gates.
- `HAF-05` Work Order machine schema validates and detects shared-field Markdown/machine divergence.
- `HAF-06` stale Context Lock/base/fingerprint blocks before expensive validation.
- `HAF-07` unauthorized changed path blocks.
- `HAF-08` `AUDIT_READY` receipt is exact-head/machine-readable and cannot encode semantic approval.
- `HAF-09` pending/failed/missing check truth cannot become optimistic success.
- `HAF-10` AGENTS router preserves authority while materially reducing always-loaded prose.
- `HAF-11` existing full-validation path remains available as fallback.
- `HAF-12` regression/security/branch-protection floors are not weakened.
- `HAF-13` benchmark records comparable before/after facts with no unproven gain claim.
- `HAF-14` V1.2 denominator remains exactly 3/10.

## TESTS

1. classifier/validation-plan unit + property tests;
2. adversarial mixed/unknown/path/stale-base cases;
3. Work Order schema valid/invalid/divergence fixtures;
4. Context Lock/preflight stale/unauthorized-path tests;
5. CI-plan tests for governance fast path and fail-closed FULL fallback;
6. relevant M04/M14-M16/M24/M27/M28 regressions;
7. `npm run build`;
8. `npm run typecheck`;
9. `npm run validate`;
10. `npm audit --audit-level=high`;
11. `git diff --check`;
12. exact-head GitHub security/integrity checks;
13. comparable governance-only benchmark candidate.

## DELIVERABLES

- bounded implementation in existing ownership surfaces;
- versioned Work Order schema + validator;
- change-class/validation-plan contract;
- `AUDIT_READY` receipt contract/generator;
- progressive CI integration;
- focused/adversarial tests;
- governance-owned AGENTS router delta;
- Evidence Bundle with baseline/after facts;
- proposed process/checkpoint delta only;
- implementation PR kept open for exact-head owner audit.

## REVIEW FORMAT

Português brasileiro. Include exact base/head, changed paths, architecture ownership, classification/plan behavior, benchmark facts, tests/checks, security/ruleset disposition, CRITICAL/HIGH counts, V1.2 denominator impact (must remain 3/10), and exactly one verdict: `APPROVED`, `CORRECTION REQUIRED`, or `BLOCKED`.

Owner-operated ChatGPT audit is always `NOT_INDEPENDENT`.

## STOP CONDITION

Admission planning:
`GBS_MAINT_HARNESS_001_ADMISSION_READY_FOR_OWNER_AUDIT`

After governed admission:
`GBS_MAINT_HARNESS_001_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK`

After fresh implementation lock audit:
`GBS_MAINT_HARNESS_001_ADMITTED_READY_FOR_CODEX`

Implementation:
`GBS_MAINT_HARNESS_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

Terminal after promotion:
`GBS_MAINT_HARNESS_001_PROMOTED`
