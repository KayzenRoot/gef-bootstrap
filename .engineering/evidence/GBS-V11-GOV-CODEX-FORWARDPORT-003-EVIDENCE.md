# GBS-V11-GOV-CODEX-FORWARDPORT-003 — Evidence Bundle

**Disposition:** Candidate documentation forward-port prepared for exact-head owner audit. Owner audit is NOT_INDEPENDENT. This bundle does not authorize merge, release effectiveness or checkpoint promotion.

## Work Order, approval and exact source binding

- Work Order: GBS-V11-GOV-CODEX-FORWARDPORT-003, admitted for the bounded governance-document scope by the owner review in Issue #340 on 2026-09-29.
- Admission source: https://github.com/KayzenRoot/gef-bootstrap/issues/340
- Approved planning: Issue #335 and merged planning PR #336, merge d892d2cb03719dd661bcab86bec995aecc8f4894; approved planning head d67b10cd9f065016a5e9ecb52498edc58fc65064.
- Admission preparation: merged PR #339 at f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be; it added preparation evidence only and did not adopt ADR-0008/D-0063 on release.
- Versioned Work Order and Context Lock were committed first in 3a7a9bbc563613adf6e550e9677d2087fbcbb55b, directly on release base f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be. The Work Order blob is 2b0d60c0752206286210df4a449d206057d0b14e; the Context Lock blob is c6f5eac9c3c10161c08c51dae876989948b407e7.
- The second commit, 373f34338dc1b33513acf2d4173f3e0eb68990d2, contains only the 14 approved normative document changes. This Evidence Bundle is committed after it. The final exact candidate hash is the PR head that contains this file; the PR description and Issue #340 evidence comment identify that immutable SHA and all exact-head check URLs after the final run.
- Context Lock: .engineering/context-locks/GBS-V11-GOV-CODEX-FORWARDPORT-003.json. It binds 44 source inputs across merge-base/main/release (132 exact Git blob comparisons), and records 97 present blob values plus path absence at the other exact refs. The source matrix was recomputed against the locked SHAs; all 132 values matched.
- Current locked refs at admission and implementation base:
  - main commit f6738292c038eb6f0d08d1d32b3752c5c7dc417a; tree 0413bf3e8d706738f73c93578c81630ce027f4ec.
  - release/1.1 commit f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be; tree 1c7f88946c60defe175e065b241e2862a3933cbf.
  - merge base e23311e77d79b84f3c70671072a22a6f8896d13d; divergence 2 main-only / 72 release-only.
- The PR’s exact base is release/1.1 at f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be. Re-fetch and final PR head verification are recorded in the PR evidence update.

## Decision and source reconciliation

- D-0062@main / historical ADR-0007 remains branch-qualified and provenance-bound to main blob 687ee037d2dcd4936d118a23666665fc66410aed. Its active path and retired integration name were not copied into release text.
- D-0062@release / ADR-0006 remains unchanged and effective, blob 97bef59b15f557302a7fd625af30ceeb421c01a. Owner-operated exact-head audit and merge controls remain intact.
- D-0063 / ADR-0008 is effective on main after its separate promotion, with source blob 7d6ec3885fb3d029586dc0b7f99aa32b033170e1. Its release copy and workflow are explicitly PENDING_RELEASE_ADOPTION / NOT_EFFECTIVE until a separate exact-head owner audit and checkpoint promotion.
- D-0064 / ADR-0009 remains unallocated. No global mapping or decision-ID change was made.
- Release ADR-0003..0006, accepted V1.1 Work Orders 001..009, WO-010 NOT_ADMITTED, V1.0 acceptance 1088/1088, stable IDs and accepted history are preserved.
- Source Hierarchy, Security and Test/Benchmark Plan are unchanged.

## Conflict map and handling

Git merge-tree over the exact locked tips reports these two literal conflicts:

| Path | Merge-base blob | Main blob | Release blob | Handling in this PR |
| --- | --- | --- | --- | --- |
| .engineering/CHECKPOINT.json | 0026989d7feebf2b96ef456ef950f625a7308db8 | d3ca8edcfe6ab2db9b8c637fcd2a6d4e9dcb16f3 | bc88fcb58acb5cbe6a67f9ce5d89f3162bcc9ca6 | WRITE_FORBIDDEN; retained unchanged. |
| .engineering/DECISIONS-LEDGER.md | 303bfcbd8e75a7c27d7bda51d5e9032e91237f49 | 035a7a1f0e8f374784e06bc1b6a3bb10ee6854f6 | e57b9ab9c5e93b81e4a3253ecf0e69dfaf19e537 | Only a branch-qualified D-0063@main provenance note was added; release D-0062/ADR-0006 was preserved. |

Ten overlapping auto-merges requiring clause-level review remain: AGENTS.md, .engineering/ARCHITECTURE.md, .engineering/CHECKPOINT.md, .engineering/CONSTITUTION-LOCK.md, .engineering/DEFINITION-OF-DONE.md, .engineering/PROJECT-OVERVIEW.md, .engineering/REQUIREMENTS.md, .engineering/SCOPE.md, .engineering/decisions/ADR-0001-COMPLETE-PRODUCTION-TARGET.md and README.md. The candidate edits only the approved construction-actor/GitHub-first clauses. The checkpoint and ADR-0001 are untouched; product/adapter topology, contracts, dependencies and frozen scope are retained.

## Actual changed paths and intent

1. .engineering/work-orders/GBS-V11-GOV-CODEX-FORWARDPORT-003.md — complete admitted execution contract, committed first.
2. .engineering/context-locks/GBS-V11-GOV-CODEX-FORWARDPORT-003.json — exact Context Lock, committed first.
3. AGENTS.md — adds prospective actor and GitHub-first handoff while retaining owner, fresh-context and exact-head rules.
4. .engineering/CONSTITUTION-LOCK.md — reconciles only the construction-actor constraint and adds branch-qualified history; retains ADR-0006 canonical source and owner rule.
5. .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md — adds a historical supersession notice limited to the actor restriction; historical amendment and D-0054 text remain.
6. .engineering/PROJECT-OVERVIEW.md — updates the construction policy and item 15 only; records D-0054 history and preserves product/adapters.
7. .engineering/REQUIREMENTS.md — updates the construction constraint and corresponding freeze-audit result only.
8. .engineering/SCOPE.md — updates the construction invariant and corresponding freeze-audit result only; all scope, 64 IDs, 282 sessions and the 61-module release denominator remain.
9. .engineering/ARCHITECTURE.md — updates the construction-actor principle, its supporting rationale and audit result only; architecture topology and contracts remain.
10. .engineering/DEFINITION-OF-DONE.md — adds a prospective, release-gated owner process overlay without changing acceptance criteria.
11. .engineering/EXECUTOR-ACCELERATION-CONTRACT.md — reconciles the actor restriction and adds section 18 for the gated handoff; other safety rules remain.
12. README.md — adds a release-qualified construction note; V1.1 operations runbook entry remains.
13. .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md — adds the approved main source with exact provenance and pending/non-effective release applicability.
14. .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md — adds the main companion with release qualification, current #278 closure state and pending/non-effective applicability.
15. .engineering/DECISIONS-LEDGER.md — adds only branch-qualified D-0063@main source provenance and NOT_EFFECTIVE_ON_RELEASE.
16. .engineering/DECISIONS-SUPERSESSION-MAP.md — adds pending D-0063 release applicability without superseding either D-0062 meaning.
17. This Evidence Bundle.

No checkpoint, source hierarchy, security, test plan, existing ADR, product source, test, build/CI workflow, dependency manifest/lockfile, coverage threshold/configuration, tag or production artifact changed.

## Proven LCOV/Codecov diagnosis carried as historical context

Issue #334 exact-SHA evidence is tied to the old PR #278 candidate head bbd83a179dd4c11f2f8653251db2b574d0266880: https://github.com/KayzenRoot/gef-bootstrap/issues/334#issuecomment-5894818858

On that same historical candidate, LCOV for packages/cli/scripts/prepare-package.mjs recorded 238/238 DA lines hit and 23/37 BRDA branches hit; 14 branch outcomes were not taken on lines 73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222 and 232. Native coverage was 100.00% line and 62.16% branch. Codecov reported 94.12% for that file (13 uncovered plus one partial) and 95.69% patch against the 97.85% threshold. The proved cause was branch coverage: the pack(destination) success path reached every DA line, while error/absence conditions were not taken. The 14 missing branch outcomes therefore appeared in Codecov as 13 uncovered lines and one partial line despite DA greater than zero for all 238 lines. No SHA or SF/source-path mismatch was found. This is historical evidence only and transfers no result to this PR.

Issue #337 remains a separate proposed/not-admitted branch-coverage correction. This governance PR changes no test, coverage source, threshold or workflow and does not claim to repair the coverage gap.

## Checkpoint drift and unapplied delta

Live PR #278 is CLOSED_NOT_MERGED, closed at 2026-09-29T16:21:06Z, with no merge commit. Its old check/Codecov/Sonar results are historical and are not reusable. Release checkpoint blobs .engineering/CHECKPOINT.md a8550e4ebc45ce7d1a1aa528366458d9657e92f5 and .engineering/CHECKPOINT.json bc88fcb58acb5cbe6a67f9ce5d89f3162bcc9ca6 still describe #278 as merge-conflicted / next action. This is known project-state drift.

Proposed checkpoint delta for separate owner review, NOT_APPLIED here:
- Replace only the stale factual #278 state with “closed unmerged on 2026-09-29; no merge commit; its checks are historical.”
- Do not change accepted Work Order progression, frozen denominators, V1.0 1088/1088 or any other checkpoint fact based on this proposal.
- Do not treat the closed PR’s coverage/security results as current or as evidence for a future cumulative integration.
- Re-evaluate the next legal release action under the then-current checkpoint after this PR’s separate audit and after any independent prerequisite is admitted; this bundle does not choose or promote that action.

## Local validation evidence

- Initial npm run validate stopped at typecheck because dependencies were absent and tsc was unavailable. No repository file was changed by that attempt.
- npm ci installed dependencies from the unchanged package-lock.json; Node was v24.19.0 and npm v11.17.0, satisfying package.json Node >=22. The install reported zero vulnerabilities. npm emitted an allow-scripts notice for koffi; no manifest or lockfile was changed.
- Targeted command node --test tests/v11-legacy-ecosystem-detachment.test.mjs passed after the normative edits: 1 passed, 0 failed.
- The Context Lock parsed as JSON and all 132 source blob comparisons matched the three locked commits.
- Secret-pattern scan of the Work Order, Context Lock and all changed documents returned no matches.
- git diff --cached --check passed before the normative commit.
- npm run validate passed on the normative document candidate: typecheck passed; 1602 tests passed, 0 failed, 0 skipped; Node test duration 147575 ms. This result was before this Evidence Bundle file was added. Final exact-head local and GitHub results are recorded in the PR description and the Issue #340 evidence comment after the bundle commit and final revalidation.
- GitHub required checks were not yet run when this file was drafted. The final PR evidence update binds their names, conclusions and direct URLs to the exact PR HEAD; no historical #278/#336/#339 status is substituted.

## Impact, risks and limitations

Security: no security policy, code, permissions or CI behavior changed. No secret-like pattern was found in changed documents.

Compatibility/dependencies: no runtime or API behavior and no dependency manifest/lockfile changed. npm ci reported zero vulnerabilities; the koffi lifecycle script was not authorized by npm’s allow-scripts policy, while the complete repository suite, including packaged CLI/FFI coverage, passed.

Risk: D-0062 retains two branch-qualified historical meanings; they are not globally mapped. Release adoption of D-0063/ADR-0008 is prospective only. Known #278 checkpoint drift remains unresolved by design and is represented by the separate unapplied proposal above. Required exact-head remote checks and owner audit are final gates.

## Audit request and stop

Requested disposition: APPROVED / CORRECTION_REQUIRED / BLOCKED. Owner audit must be labelled NOT_INDEPENDENT. No merge, effective release decision, checkpoint mutation/promotion, tag, publication, threshold waiver or cumulative release-to-main integration is requested or claimed.

STOP CONDITION: GBS_V11_GOV_CODEX_FORWARDPORT_003_EXACT_HEAD_READY_FOR_OWNER_AUDIT