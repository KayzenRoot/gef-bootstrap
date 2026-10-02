# GBS-V12-WO-001 — Guided planning, impact intelligence and bounded Marathon orchestration

**Issue:** #372  
**Status:** `OWNER_AUTHORIZED_FOR_ADMISSION_PLANNING / IMPLEMENTATION_NOT_YET_ADMITTED`  
**Risk:** `STANDARD`  
**Admission base:** `main@4698592b521ee8c5df37be8759312bd76b9d702f`  
**Canonical predecessor:** `GBS_V12_WO_000_ADMITTED_NO_IMPLEMENTATION`  
**Current V1.2 state:** `SOURCE_PACK_APPROVED_NO_IMPLEMENTATION`  
**Planning branch:** `planning/v1.2/wo-001-admission`

## OBJECTIVE

Prepare the finite implementation admission contract for the first V1.2 universal-core increment without writing implementation code in this planning PR.

The implementation phase, only after a separate exact-head owner audit and admission, will extend existing M09-M18 capabilities to deliver:

- U12-01 / C01 — guided discovery and source-bound answer capsules;
- U12-02 / C02 — canonical planning impact/completeness;
- U12-03 / C04 — bounded multi-wave orchestration only if its complete canonical acceptance contract is actually proven.

The Work Order must extend current packages instead of creating duplicate planner, graph, executor, checkpoint or resume engines.

## CANONICAL REUSE BOUNDARY

Required reuse targets:
- M09-M15 planning/source/context machinery;
- M14 Task Context Compiler;
- M15 Execution Pack Compiler;
- M17 Checkpoint Engine;
- M18 Resume Engine;
- planning-workspace topology and dependency traversal where applicable;
- source-pack and decision-system authority where applicable.

No second executor, no second Source Pack, no parallel review/status authority and no hosted GEF runtime.

## IMPLEMENTATION CONTRACT AFTER ADMISSION

### U12-01
- ask only unanswered, materially relevant questions;
- default to 5-7 questions when that many material gaps exist;
- greenfield and brownfield behavior differ explicitly;
- persist stable source-bound answer capsules with state DECIDED / ASSUMED / UNRESOLVED / NOT_APPLICABLE;
- invalidate only dependent capsules after source drift;
- preserve unrelated valid answers;
- surface frozen-authority conflicts as BLOCKED;
- FAST mode cannot skip high-assurance/security blocking questions.

### U12-02
- deterministic requirement-to-evidence/proof references;
- owner-change impact over Scope, Requirements, Architecture, Security, Tests, Deployment, Decisions and DoD;
- reuse current graph/topology contracts, do not create a new graph engine;
- report missing critical-path obligations and unknown authority explicitly;
- distinguish KNOWN, ESTIMATED/HYPOTHESIS, UNRESOLVED and NOT_APPLICABLE;
- invalidate only proven dependency closure;
- do not emit progress or ETA unless M21/M22 independently permits it.

### U12-03 candidate completion
- dependency-ordered waves;
- safe parallelism only for proven non-overlapping mutation domains;
- explicit per-wave evidence and stop conditions;
- exact checkpoint/resume receipts;
- stale Source Pack, Work Order or context fingerprint refuses resume;
- replay cannot duplicate promoted side effects;
- checkpoint conflict/split-brain stays fail-closed;
- bounded stop condition always wins;
- implementation credit only if the full U12-03 canonical contract passes.

## FUTURE IMPLEMENTATION WRITE SURFACES

Preferred, subject to Codex exact preflight:
- `packages/task-context-compiler/src/**`
- `packages/execution-pack-compiler/src/**`
- `packages/checkpoint-engine/src/**`
- `packages/resume-engine/src/**`
- only when proven necessary: `packages/planning-workspace/src/**`, `packages/source-pack/src/**`, `packages/decision-system/src/**`
- corresponding V1.2 tests under `tests/**`
- `.engineering/evidence/GBS-V12-WO-001-*.md|json`
- `.engineering/checkpoint-deltas/GBS-V12-WO-001-PROPOSED.md`
- this Work Order and its Context Lock only for truthful execution/evidence refresh.

Any top-level new discovery/impact/marathon package requires a separate owner-approved architecture correction before creation.

## OUT OF SCOPE

- U12-04 through U12-10 implementation;
- C03 visual factory or C12 operations feedback implementation;
- D01-D12 profile implementation;
- SaaS pilot product code;
- EVM contracts, Solana, Godot/game implementation;
- paid tools or expanded paid CI;
- dependency upgrades not strictly necessary to the admitted delta;
- CI/workflow changes unless separately admitted by a bounded Correction Delta;
- package version, tag, release or publication;
- HIGH_ASSURANCE production operations;
- canonical checkpoint promotion before implementation audit;
- ChatGPT authoring code/tests/CI/migrations.

## REQUIRED ACCEPTANCE CASES

U12-01:
1. one-line greenfield idea returns only the first bounded material question batch;
2. fully answered source returns no duplicate questions;
3. partially answered source asks only missing material questions;
4. brownfield accepted Scope/ADRs/design/stack are preserved;
5. changed source fingerprint invalidates dependent capsule only;
6. unrelated source drift preserves unrelated capsule;
7. authority contradiction blocks rather than overwrites;
8. FAST mode cannot bypass high-assurance/security blockers.

U12-02:
1. deterministic truthful requirement-to-evidence links;
2. owner scope change yields exact dependency and authority impact set;
3. narrow noncritical change preserves unrelated evidence;
4. privileged auth/schema/security change widens impact;
5. missing dependency/authority is reported, not guessed;
6. critical-path/missing-obligation report is deterministic;
7. cycles, invalid dependencies, budget exhaustion and cancellation fail safely.

U12-03 candidate:
1. wave DAG respects dependencies;
2. overlapping mutation domains are not parallelized;
3. interruption/resume identifies exact next legal wave;
4. stale context refuses resume;
5. repeated resume cannot duplicate promoted effect;
6. checkpoint conflict remains fail-closed;
7. bounded stop condition is honored.

## VALIDATION AFTER IMPLEMENTATION

Codex must run:
1. package-local build/type/focused tests for changed packages;
2. relevant M09-M18 suites;
3. new positive/negative U12-01/U12-02/U12-03 cases;
4. `npm run build`;
5. `npm run typecheck`;
6. `npm run validate`;
7. `npm audit --audit-level=high`;
8. `git diff --check`;
9. exact-head required/security/integrated GitHub checks.

No test weakening, exclusions, threshold reduction or stale PASS reuse.

## IMPLEMENTATION CREDIT

Admission planning earns 0.

- U12-01 becomes PASS only after exact-head implementation proof, owner audit and governed promotion.
- U12-02 becomes PASS only after exact-head implementation proof, owner audit and governed promotion.
- U12-03 becomes PASS only if every canonical U12-03 obligation is proven in this WO.
- No other U12 obligation receives credit.

## ADMISSION FLOW

1. Planning PR contains only this Work Order and its admission Context Lock.
2. Owner exact-head audit must return APPROVED / NOT_INDEPENDENT, CRITICAL 0, HIGH 0.
3. Merge of the planning PR admits WO-001 only. The merge itself earns 0 implementation credit.
4. After merge, compile a fresh implementation Context Lock from the exact post-merge main head before Codex edits code.
5. Codex implements on a subordinate implementation branch and stops at the implementation audit gate.
6. ChatGPT audits exact implementation head; any correction is executed by Codex under the same admitted WO or a bounded Correction Delta as required.
7. Checkpoint promotion happens only after implementation audit and governed evidence.

## REVIEW FORMAT

Português brasileiro. Include exact base/head, changed paths, Context Lock freshness, acceptance map, required checks, CRITICAL/HIGH, review-thread state, denominator impact and exactly one verdict:
- `APPROVED`
- `CORRECTION REQUIRED`
- `BLOCKED`

Owner audit is always `NOT_INDEPENDENT`.

## STOP CONDITIONS

Admission planning:
`GBS_V12_WO_001_ADMISSION_READY_FOR_OWNER_AUDIT`

After governed admission merge and fresh implementation lock:
`GBS_V12_WO_001_ADMITTED_READY_FOR_CODEX`

Implementation:
`GBS_V12_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

Terminal after governed promotion:
`GBS_V12_WO_001_PROMOTED`
