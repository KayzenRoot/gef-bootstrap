# GBS-V11-GOV-CODEX-FORWARDPORT-001 — planning-only Work Order

Status: `PLANNING_READY_NOT_ADMITTED`; evidence revalidated `2026-09-29`; owner audit still required. GitHub issue: [#335](https://github.com/KayzenRoot/gef-bootstrap/issues/335). Owner: KayzenRoot. Risk: STANDARD governance with release-lineage impact.

## OBJECTIVE

Prepare, but do not execute, the governed forward-port of main's approved ADR-0008/D-0063 Codex-only authorship and GitHub-first planning rules to release/1.1. Preserve release's accepted decisions, V1.1 state and owner-operated audit/merge gates. Reconcile branch-qualified D-0062 history without rewriting either branch. PR #278 is closed without merge and is no longer the integration vehicle.

## CONTEXT LOCK — EXACT REFS

- `main`: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, tree `0413bf3e8d706738f73c93578c81630ce027f4ec`.
- `release/1.1`: `bbd83a179dd4c11f2f8653251db2b574d0266880`, tree `bb141e900f953d725c4bc6272c640ece1fbeaf92`.
- Merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`; main has 2 unique commits and release has 62.
- Main's governance promotion followed #332 and #333; the current main SHA is the promoted state. Re-fetch all refs and source fingerprints before any future admission.
- PR #278 is `CLOSED`, `mergedAt=null`, base `e23311e77d79b84f3c70671072a22a6f8896d13d`, head `bbd83a179dd4c11f2f8653251db2b574d0266880`. No replacement cumulative release-to-main PR was present in the current open-PR listing.
- PR #336 is draft and planning-only, based on `release/1.1`. Its previous head `7eb07452b14b5147a33f1e07403a0717eefd4424` had 29/29 listed checks succeed. Those results are bound to that prior head and do not satisfy checks for this update.
- Canonical blob fingerprints and semantic merge map are recorded in `.engineering/lineage/GBS-V11-GOV-CODEX-FORWARDPORT-001.md`.

## OBJECTIVE EVIDENCE — ISSUE #334 AND PROPOSED ISSUE #337

Issue [#334, diagnostic evidence comment](https://github.com/KayzenRoot/gef-bootstrap/issues/334#issuecomment-5894818858) proves the LCOV/Codecov mapping discrepancy on the exact release SHA above: 238/238 `DA` lines were hit; 14 of 37 `BRDA` branches were not taken, on lines 73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222, 232. Native output was 100.00% line and 62.16% branch coverage; the same-head Codecov report showed 13 uncovered lines and one partial among those branch-gap lines, 94.12% for the file and 95.69% patch coverage against 97.85%. The cause is line coverage versus uncovered branch outcomes, not a SHA or source-path mismatch.

Issue [#337](https://github.com/KayzenRoot/gef-bootstrap/issues/337) is `PROPOSED / NOT ADMITTED`. It proposes separately admitted negative-path branch tests and leaves the package source read-only by default. It grants no write authority. Keep it independent of this planning PR; WO-010 remains not admitted.

## SCOPE

This planning update records the exact ref lock, canonical fingerprints, two literal merge conflicts, one-sided decision sources, deletion hazard and semantic reconciliation inventory. The path matrix is in the companion lineage document. Before a future source change, refresh every ref and blob fingerprint, then repeat the base/main/release semantic comparison and obtain separate admission.

## OUT OF SCOPE

Any production source, test, workflow, threshold, coverage configuration, checkpoint, canonical source or release-state mutation; release publication/tag; branch reset or forced merge; history rewrite; automatic WO-010 admission; reopening or replacing PR #278 in this planning Work Order; claiming release acceptance.

## ARCHITECTURE AND GOVERNANCE RULES

- Keep `D-0062@main` / ADR-0007 and `D-0062@release/1.1` / ADR-0006 branch-qualified with their original meanings.
- Preserve main's `D-0063` / ADR-0008 as a main decision until a separate release forward-port is admitted.
- D-0064 is only a possible future identity for the release owner-audit meaning; do not allocate it before collision checking and explicit audited approval.
- Preserve release-only ADR-0003 through ADR-0006, accepted WO-001 through WO-009, adapter-neutral boundaries and the V1.1 overlay. Preserve main's V1.0 accepted 1,088/1,088 state without rewriting it.
- Keep planning, implementation, exact-head audit and checkpoint promotion as distinct gates.

## VALIDATION AND EVIDENCE STATUS

The exact refs, canonical blobs, PR #278 closure state, #334 proof, #337 admission state, and Git `merge-tree` conflict paths were revalidated for this update. No repository tests or source validation were run manually. The 29/29 checks previously reported for PR #336 belong only to head `7eb07452b14b5147a33f1e07403a0717eefd4424`; the changed head needs fresh checks. After those checks, a separate objective owner audit remains required.

## DELIVERABLES

Issue #335 planning record; this versioned Work Order; the companion exact-state lineage and conflict map; planning-only draft PR #336 with current evidence and exact head. A future implementation or canonical checkpoint delta requires its own admission, Context Lock, Evidence Bundle, exact-head checks and audit.

## REVIEW FORMAT

Português brasileiro; exact main/release/base and candidate SHAs, changed paths, verified versus proposed facts, conflict/lineage result, new-head check status, severity and unresolved gate. Use `APPROVED / CORRECTION REQUIRED / BLOCKED` only after the required audit actually runs.

## STOP CONDITION

`GBS_V11_CODEX_GITHUB_FIRST_FORWARDPORT_PLAN_READY_NOT_ADMITTED`. The current work stops at the owner-audit gate. No approval, source mutation, release admission, merge or checkpoint promotion is implied.
