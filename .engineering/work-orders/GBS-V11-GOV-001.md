# GBS-V11-GOV-001 — Owner-operated review and merge authority

Status: `OWNER_ADMITTED`
Release line: `1.1.x`
Assurance: `STANDARD`
Implementation branch: `governance/GBS-V11-GOV-001-owner-operated`
Base branch/SHA: `release/1.1` / `33671ba9a3d4962cea4371f5610bda23e4889e11`
Decision authority: explicit Product Owner instruction dated `2026-09-26`

## OBJECTIVE

Replace collaborator-dependent audit/approval/merge gates with an owner-operated, exact-head review and merge process. Apply it to the active WO-008 PR and future GEF Bootstrap instructions while preserving mandatory CI, evidence, security and release boundaries.

## CONTEXT

WO-008 implementation PR #296 is open at `c4a108059d5b77baed43faa28847828ea1f450a7`. All 24 GitHub check runs queried on that exact head concluded `success`. The prior review request to `goodz-labs` was rejected by GitHub with HTTP 422, while the owner requested all operations use `KayzenRoot`. The project owner explicitly directed this governance change.

The current `Main Branch Protection` ruleset has `required_approving_review_count: 0` and still requires `Repository validation`. No change to CI requirements or branch safety is admitted.

## SCOPE

- Add ADR-0006 and D-0062 for single-account owner authority.
- Add explicit supersession and impact documentation under D-0042.
- Update executor and planning contracts so owner review/merge is the default and collaborator review is not required.
- Update WO-008, its execution brief and checkpoint routing so PR #296 can proceed through owner audit and merge.
- Bind all mutations in this Work Order to the `KayzenRoot` GitHub connection.
- Validate exact-head CI and record an owner audit for the governance PR.

## OUT OF SCOPE

- Changes to product runtime/code, benchmark behavior, security thresholds, test coverage or required CI workflows.
- Direct mutation of `main` or `v1.0.0`.
- Force-push, history rewrite, tag movement or publication.
- Fabricated independent review, approval under another identity, or bypass of failed/pending required checks.
- Implementation of WO-009 or later.

## FILES / SOURCES TO READ

1. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/DECISIONS-SUPERSESSION-MAP.md`
4. `.engineering/CONSTITUTION-LOCK.md`
5. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
6. `.engineering/work-orders/GBS-V11-WO-008.md`
7. `.engineering/execution-briefs/GBS-V11-WO-008-DIRECT.md`
8. `AGENTS.md`, `planning/PLANNING-PROTOCOL.md`, `planning/EXECUTOR-MARATHON-PACK-TEMPLATE.md`, `.github/copilot-instructions.md`
9. PR #296 metadata and exact-head check runs
10. Active repository ruleset for `main`

## REQUIREMENTS

### R1 — One authorized write identity
All GitHub mutations for this repository use `KayzenRoot`. Do not request collaborator review, change to a collaborator account, or make a collaborator's approval a completion dependency.

### R2 — Owner audit is substantive and exact-head bound
The owner records a review against the exact PR head, acceptance criteria, changed paths, required checks, evidence, security/integrity findings, CRITICAL/HIGH counts and disposition. Never call this review independent.

### R3 — Owner merge is allowed after gates
The owner may merge to the Work Order's authorized target after `OWNER_APPROVED`, all exact-head required checks are successful, the branch is mergeable, and CRITICAL/HIGH blockers are zero. No collaborator sign-off is required.

### R4 — Preserve automated assurance
Do not remove, weaken, skip or bypass required CI/status checks, security gates, evidence requirements, or exact-state bindings to make owner-only merge possible.

### R5 — Preserve release boundaries
V1.1 work remains on `release/1.1` and subordinate branches. `main`, `v1.0.0`, tags, publication and production state remain governed by ADR-0003-D1 and their own Work Orders.

### R6 — GEF-generated workflows
Future owner-directed templates name the configured project-owner account as writer, semantic reviewer and merger. External reviewers may provide optional advice, but no generated workflow may require a collaborator account to advance.

### R7 — Transparent disposition
Allowed owner audit outcomes: `OWNER_APPROVED`, `CORRECTION_REQUIRED`, `BLOCKED`. A rejected or unavailable platform operation remains a blocker; never imply it succeeded.

## ARCHITECTURE RULES

- ADR-0006/D-0062 control review identity and merge authority after promotion.
- Preserve exact-head evidence, risk classification and fail-closed security semantics.
- Owner review does not create a second GitHub approval event if GitHub disallows author self-approval; record the review as a top-level PR conversation comment with exact SHA.
- Keep all CI and branch protection requirements intact.

## CONSTRAINTS

- No collaborator approval or review request.
- No use of connected GitHub accounts other than `KayzenRoot` for writes.
- No merge with pending/failed/stale checks or unresolved CRITICAL/HIGH findings.
- No direct `main` mutation, force-push, history rewrite, tag or publication.
- Do not mark any prior audit as independent if it was not performed independently.

## ACCEPTANCE CRITERIA

1. ADR-0006 states the owner-only operating model, supersession bounds, impact and preserved assurance.
2. D-0062 is present in the Decisions Ledger and the supersession map routes conflicting active/future review clauses.
3. Executor, planning, GitHub and Work Order instructions agree that no collaborator approval is required.
4. WO-008 and its execution brief route PR #296 to exact-head owner audit and merge into `release/1.1`.
5. Checkpoint human and JSON views agree on the active governance decision and next legal WO-008 action.
6. Main ruleset retains `Repository validation` and `required_approving_review_count: 0`.
7. Governance PR exact-head checks pass; owner audit reports CRITICAL=0/HIGH=0 or records a correction/blocker.
8. No code/runtime, CI workflow or production boundary is weakened.

## TESTS

- Parse `.engineering/CHECKPOINT.json` as valid JSON.
- Verify all changed governance files reference the same `GBS-V11-GOV-001`, `D-0062` and `ADR-0006`.
- Verify the updated WO-008 stop condition no longer requires an external/collaborator audit.
- Run all exact-head GitHub checks triggered by `.engineering/**`, plus the required `Repository validation`.
- Re-read the exact final PR diff and check run conclusions before owner audit/merge.

## DELIVERABLES

- ADR-0006, D-0062 and supersession-map update.
- GBS-V11-GOV-001 context lock, owner audit evidence and checkpoint delta.
- Updated owner, planning, GitHub and WO-008 execution instructions.
- Governance PR merged into `release/1.1` by `KayzenRoot` only after exact-head owner audit and green required checks.
- Next legal action: owner audit PR #296 at its current exact head, then owner merge into `release/1.1` if approved.

## REVIEW FORMAT

Owner audit in Brazilian Portuguese, bound to exact head SHA. Report changed files, source consistency, ruleset/check state, test/check outcomes, findings by severity, CRITICAL/HIGH counts and one disposition: `OWNER_APPROVED | CORRECTION_REQUIRED | BLOCKED`. No collaborator reviewer is required and the audit is not independent.

## STOP CONDITION

Stop after the governance PR is exact-head owner-audited, all required checks pass, it is merged into `release/1.1`, and the checkpoint routes WO-008 to owner audit.

STOP CONDITION: `GBS_V11_GOV_001_PROMOTED_OWNER_ONLY_WO008_AUDIT_READY`
