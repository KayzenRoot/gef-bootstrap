# Evidence Bundle — GBS-MAINT-OPEN-SURFACE-001

**Issue:** #365  
**State:** `IN_PROGRESS / PHASE_0_BLOCKED_ON_WO012_TEST_SYNC`  
**Admission base:** `main@af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`

## Initial observed open surface

At admission the GitHub API reported:
- open Pull Requests: **7** — #364, #360, #353, #344, #226, #200, #195
- open non-PR Issues: **22** — #361, #357, #346, #345, #340, #338, #335, #334, #312, #304, #149, #148, #147, #146, #145, #144, #143, #142, #141, #140, #139, #102

## Canonical completion evidence used for historical cleanup

Current `.engineering/BACKLOG.md` records:
- M05 Transactional Apply Engine — `MODULE_DONE`
- M08 Project Profiles — `MODULE_DONE`
- M16 Policy & Guardrail Engine — `MODULE_DONE`
- M22 Estimation Engine — `MODULE_DONE`

Additional canonical evidence:
- M16 implementation PR #202 / merge `61f9c2839335346083169b8a2fe49a3b1e797dba`, semantic audit `5202595878`
- M22 implementation merge `48548157573cf221e7105d82a0b2f8189588d1d6`, semantic audit `5210169322`
- M08 accounting correction explicitly preserves implementation evidence, semantic approval, merge and MODULE_DONE status
- current Main Branch Protection requires Repository validation, Pipeline integrity, Gitleaks secrets and Trivy filesystem/configuration
- current checkpoint records D-0063/ADR-0008 governance and V1.1 release adoption lineage

## Closed Pull Requests

| PR | Disposition | Evidence |
|---|---|---|
| #360 | CLOSED — superseded | V1.1.1 checkpoint gate superseded by immutable V1.1.2 / WO-012 |
| #200 | CLOSED — stale predecessor | M16 canonical implementation is PR #202 / merge `61f9c...` |
| #226 | CLOSED — stale predecessor | M22 canonical implementation merge `485481...` |
| #195 | CLOSED — broken major dependency bump | TypeScript 7.0.2 branch failed broad validation/release/platform checks; current V1.1.2 npm audit has no high vulnerability requiring force-merge |
| #353 | CLOSED — broken grouped Actions bump | 38 workflow changes with Repository Validation/release/regression failures; future refresh must preserve pinned-action/pipeline contracts |
| #344 | CLOSED WITHOUT MERGE — archived planning | exact planning snapshot preserved at branch `planning/gef-v12-research-dossier-001` / `c85cc91c899b553c1c37fe53ada236b8f76de3e2`; versioned handoff created |

No closed stale PR above was merged.

## Closed Issues

### V1.1 / governance / maintenance
- #357 — completed/superseded by WO-012 / V1.1.2
- #312 — dated non-canonical handoff superseded by current checkpoint
- #334 — obsolete PR #278 LCOV/Codecov diagnostic, historical diagnosis preserved
- #335, #338, #340, #345 — Codex/GitHub governance forward-port chain completed/effective
- #304 — free CI/security/coverage pilot integrated
- #346 — V1.2 future gate superseded by versioned handoff; no V1.2 implementation admitted

### Historical modules
- #102 — M05 historical review, canonical M05 MODULE_DONE
- #139 through #149 — M08 historical planning/execution/closure chain, canonical M08 MODULE_DONE

## V1.2 planning preservation

Created `.engineering/handoffs/V1.2-NEXT-STATE.md`.

The full 25-file planning snapshot remains preserved on PR #344's branch/commit. It is intentionally not merged from its stale branch. Future V1.2 work must start from then-current main and explicitly re-admit/revalidate selected concepts. No V1.2 implementation is authorized by cleanup.

## Remaining open surface after administrative cleanup

Expected remaining until Phase 0 finishes:
- PR #364 — V1.1.2 production closeout
- Issue #361 — WO-012 V1.1.2 hotfix/release
- Issue #365 — this reconciliation Work Order

PR #364 production checkpoint promotion moved its branch to `e3529e993517f729815e5cf9b31003bfebb5e9c0`.

The first CI run after promotion exposed a causal historical-test mismatch:
`assertWo012CandidateReleaseIdentity` still unconditionally expected pre-publication values (`tag=null`, `npmPublished=false`, `registrySmoke=NOT_RUN`) while the canonical state is now `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`.

Correction instructions were recorded on PR #364 comment `5951132038`. Under repository governance, Codex must author the test correction. Threshold weakening/exclusions are prohibited.

## Next exact action

1. Codex fixes only the authorized WO-012 accepted-state test/helper semantics.
2. Full #364 validation reruns.
3. Require all main ruleset contexts **and** Codecov patch green.
4. Owner exact-head audit and ready-state retriggers.
5. Merge #364.
6. Close #361.
7. Refresh this Work Order against the new main, open/merge its governance-only reconciliation PR, verify final API inventory, then close #365.

**Current stop:** `GBS_MAINT_OPEN_SURFACE_001_WAITING_FOR_WO012_PRODUCTION_CLOSEOUT_REVALIDATION`
