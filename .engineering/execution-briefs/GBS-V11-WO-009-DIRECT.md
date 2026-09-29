# Direct Execution Brief — GBS-V11-WO-009

State: `ADMITTED`
Authority: `ADR-0003-D3 as boundedly superseded by D-0062/ADR-0006`
Assurance: `ELEVATED`
Work Order: `.engineering/work-orders/GBS-V11-WO-009.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-009.json`
Implementation branch (clean-lineage replacement): `feat/1.1/wo-009-integrated-assurance-clean-history`

## EXACT BASE

Create the implementation branch only from the exact WO-009 governance/admission merge on `release/1.1`. Context Lock pre-admission base: `2d6538c3d90b63107b0cb4a4f6255c44cbfa61d1`. If `release/1.1`, `main`, the `v1.0.0` tag or a canonical source changes unexpectedly before branch creation, reconcile the checkpoint and refresh the lock. Do not reset, rebase, force-push or guess.

## MINIMUM READ SET

1. Work Order, Context Lock, checkpoint JSON/Markdown and V1.1 Release Plan.
2. V1.1 Test Matrix, Scope, Definition of Done, Architecture A10 and Security T1-T12.
3. ADR-0003, ADR-0005 and ADR-0006.
4. V1.1 compatibility/migration contract and performance benchmark protocol.
5. WO-002..WO-008 evidence bundles and affected code/tests/workflows.
6. M18 Resume Engine evidence/spec/tests and M20 Response Contract S03/S05/spec/tests.
7. CodeQL check #108450457038 on PR #278 and current release-line scan/finding state.
8. Only additional source files required by a failing test or verified finding; record scope expansion in the Evidence Bundle.

## IMPLEMENTATION TARGET

- Add one exact-head V1.1 cross-platform release-assurance workflow for Ubuntu, Windows and macOS without replacing dedicated Work Order gates.
- Extend CodeQL pull-request/push coverage to `release/1.1` and relevant JavaScript/TypeScript sources and tests.
- Resolve and verify the existing HIGH finding before claiming clean security.
- Complete every frozen Test Matrix suite/case and preserve final full sweeps.
- Write and verify install, upgrade, recovery and new-context continuation runbooks.
- Prove `CONT-RESUME-01..04` through existing M18/M20 authorities: canonical state decides; conversation history is informational; stale/conflict never guesses.
- Bind evidence to the exact candidate SHA and retain honest WO-008 benchmark outcomes.

## CORE RULES

- One candidate head, one complete cross-platform assurance record.
- A successful workflow run is not equivalent to zero security alerts.
- Every required case maps to evidence; absent results remain `NOT_RUN`.
- Migration is preservation-first, dry-run side-effect free, transactional and fail-closed.
- M18 owns resume; M20 owns the singular canonical next action and response projection. Do not build parallel authority.
- Every governed construction handoff shows current checkpoint/stage and one verified next action, or `NONE/UNKNOWN` plus blockers.
- A new chat reconstructs from canonical repository/provider state; it does not depend on chat history.
- Preserve WO-008 `NO_CHANGE`, `UNAVAILABLE` and ineligible optimization claims.

## SECURITY BLOCKER

CodeQL check #108450457038 on PR #278, exact head `2d6538c3d90b63107b0cb4a4f6255c44cbfa61d1`, reports one HIGH alert. The scanner workflow succeeded, but the finding remains. Locate its rule/source, fix or conclusively close it with evidence, and verify no unresolved CRITICAL/HIGH findings apply to the candidate. If the finding's identity/disposition cannot be verified with connected GitHub evidence, stop final audit as `BLOCKED`. Do not request collaborator approval.

## HARD BOUNDARIES

- `KayzenRoot` is the sole GitHub write, audit and merge account; collaborator review is not required or requested.
- Do not mutate `main`, `v1.0.0`, production acceptance or rulesets.
- Do not merge with failed, pending, stale or head-mismatched required checks, or unresolved CRITICAL/HIGH blockers.
- No V1.1 release tag, publication, production acceptance or WO-010 implementation.
- No unjustified dependency additions.
- Do not weaken tests, CodeQL coverage, severity, migration safety, recovery, provenance or fail-closed behavior.
- Never call the owner audit independent.

## MANDATORY CASES

Run every frozen V1.1 matrix case on each marked platform and prove:
- `SEC-INT-01..06` with T1-T12 control mapping and zero unresolved CRITICAL/HIGH;
- `REG-01..07` including exact-head repository validation and protected V1 history;
- `CONT-RESUME-01..04` for fresh-context route, canonical-source conflict, stale head and response-stage projection.

## STOP CONDITION

Stop at `GBS_V11_WO_009_READY_FOR_OWNER_AUDIT` after evidence and documentation are complete. Merge only after owner exact-head audit `OWNER_APPROVED`, all required checks succeed on the same SHA, the known HIGH is closed, and CRITICAL/HIGH=0. After merge, promote checkpoint and stop at the next legal action: plan/admit WO-010.

STOP CONDITION: `GBS_V11_WO_009_READY_FOR_OWNER_AUDIT`


## 2026-09-29 exact-base lineage correction

For the clean-lineage replacement only, use `release/1.1` at `5ea917ae50cc8ce45022b76695c1b8cc2c2fc37d` as the exact parent. The old implementation branch and PR #302 are preserved for audit and will not be force-updated. Scan the full new commit range; do not suppress or exclude findings. The historical CodeQL HIGH disposition remains a required independent security input before any owner approval.
