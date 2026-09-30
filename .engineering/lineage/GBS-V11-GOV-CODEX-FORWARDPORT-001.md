# GBS-V11-GOV-CODEX-FORWARDPORT-001 — exact-state lineage and conflict map

Status: `PLANNING_EVIDENCE_UPDATED_PENDING_AUDIT`; **PLANNING_ONLY / NOT ADMITTED FOR RELEASE-LINE MUTATION**. Planning issue: [#335](https://github.com/KayzenRoot/gef-bootstrap/issues/335). This map records the read-only reconciliation at the exact refs below. It does not authorize a source forward-port, checkpoint promotion, release acceptance, or merge.

## Revalidated Git state — 2026-09-29

| Ref | Exact commit | Tree |
|---|---|---|
| `main` | `f6738292c038eb6f0d08d1d32b3752c5c7dc417a` | `0413bf3e8d706738f73c93578c81630ce027f4ec` |
| `release/1.1` | `bbd83a179dd4c11f2f8653251db2b574d0266880` | `bb141e900f953d725c4bc6272c640ece1fbeaf92` |
| merge base | `e23311e77d79b84f3c70671072a22a6f8896d13d` | — |

`main...release/1.1` is diverged: 2 commits exist only on main and 62 only on release/1.1. These values were fetched and recomputed before this update.

[PR #278](https://github.com/KayzenRoot/gef-bootstrap/pull/278) is `CLOSED`, `mergedAt=null`, closed at `2026-09-29T16:21:06Z`; its original base is the merge base above and its head is the current release SHA above. It closed without merge. It is not an active draft or a valid integration vehicle. The current open-PR query for base `main` found no replacement cumulative release-to-main PR. Historical checks and coverage on #278 do not transfer to any future PR.

Planning PR #336 is still open and draft, based on `release/1.1@bbd83a179dd4c11f2f8653251db2b574d0266880`. Its pre-update head was `7eb07452b14b5147a33f1e07403a0717eefd4424`; its checks were 29/29 SUCCESS at that old head only. The updated head requires its own checks and audit.

## Issue #334 — proved LCOV/Codecov cause

The diagnostic evidence is [Issue #334, comment 5894818858](https://github.com/KayzenRoot/gef-bootstrap/issues/334#issuecomment-5894818858), reproduced on the exact release commit `bbd83a179dd4c11f2f8653251db2b574d0266880`.

- Workflow run `36596096332` and LCOV job/check `109501271399` succeeded on that SHA. The original runner retained no LCOV artifact; the evidence comment distinguishes the exact-SHA scratch reproduction from the historical workflow execution.
- The scratch reproduction used Ubuntu 24.04/WSL, Node 22.17.0 and npm 10.9.2. `npm ci --ignore-scripts`, `npm run build`, and the workflow's native coverage command completed successfully; 1,602 tests were reported, 1,598 passed and none failed.
- For `packages/cli/scripts/prepare-package.mjs`, LCOV contained 238 `DA` entries, all 238 with positive counts. It contained 37 branch (`BRDA`) entries, 14 not taken, on lines `73, 83, 97, 117, 139, 140, 144, 159, 173, 199, 203, 219, 222, 232`.
- Native output therefore reported 100.00% lines and 62.16% branches (23/37). Codecov on the same #278 head reported `codecov/patch` 95.69% against 97.85%, and 94.12% for this file: 13 uncovered lines plus line 139 partial. Those line statuses map to the same 14 branch-gap lines.
- The cause is established: native line coverage counts every `DA` line as hit, while Codecov's changed-line result reflects uncovered branch outcomes. The success-path package test reaches every line but does not take the 14 negative/error branch outcomes. The SHA and source path match; the discrepancy is the line-versus-branch measurement.

[Issue #337](https://github.com/KayzenRoot/gef-bootstrap/issues/337) proposes the narrow follow-up under `GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012`. Its state is `PROPOSED / NOT ADMITTED`; it grants no permission to change source, tests, CI, thresholds, or publish. Keep that correction separate from this governance plan. WO-010 remains not admitted.

## Decision lineage that must remain branch-qualified

| Branch record | Meaning established on that branch | Evidence | Planning constraint |
|---|---|---|---|
| `D-0062@main`, `ADR-0007` | Main's frozen decision for retirement of the named integration | Blob `687ee037d2dcd4936d118a23666665fc66410aed`; present at merge base and main, absent on release | Preserve main history; the release-side absence creates a deletion hazard if release is integrated into main. |
| `D-0062@release/1.1`, `ADR-0006` | Release's owner-operated exact-head audit and merge rule | Blob `97bef59b15f557302a7fd625af30ceeb421c01a1`; release-only | Preserve release provenance and meaning; do not overwrite main's D-0062. |
| `D-0063@main`, `ADR-0008` | Codex-only code authorship and GitHub-first planning | Blob `7d6ec3885fb3d029586dc0b7f99aa32b033170e1`; main-only; promoted through #332/#333 | Carry only through a separately admitted and audited forward-port. |
| `D-0064` | Possible future main-facing identity for the release owner-audit meaning | No decision exists in this map | Candidate only. Do not allocate or use it until a fresh collision check and explicit audited approval. |

The branch policies can be composed at the process level: preserve main's authorship rule and release's admitted-work/exact-branch and owner-audit/merge gates. This is a proposed reconciliation principle, not an adopted decision.

## Current textual merge result

`git merge-tree --write-tree --messages origin/main origin/release/1.1` was run read-only against the exact refs above. It reported exactly two content conflicts:

| Path | Base blob | Main blob | Release blob | Evidence-backed handling proposal |
|---|---|---|---|---|
| `.engineering/CHECKPOINT.json` | `0026989d7feebf2b96ef456ef950f625a7308db8` | `d3ca8edcfe6ab2db9b8c637fcd2a6d4e9dcb16f3` | `bc88fcb58acb5cbe6a67f9ce5d89f3162bcc9ca6` | Keep branch-owned accepted state and overlays separate. Reconcile exact release status and stale PR #278 references in a future governed checkpoint delta; do not select either JSON wholesale. |
| `.engineering/DECISIONS-LEDGER.md` | `303bfcbd8e75a7c27d7bda51d5e9032e91237f49` | `035a7a1f0e8f374784e06bc1b6a3bb10ee6854f6` | `e57b9ab9c5e93b81e4a3253ecf0e69dfaf19e537` | Keep both D-0062 meanings branch-qualified in planning history. A future integrated ledger needs an explicit new identity and audited supersession map; D-0064 remains unassigned pending that gate. |

`merge-tree` auto-merged text in other changed files, but textual success is not semantic approval. In particular, it auto-merged `AGENTS.md`, Architecture, Checkpoint.md, Constitution Lock, DoD, Overview, Requirements, Scope, ADR-0001, and README.

## Canonical source fingerprints

Fingerprints are Git blob IDs for `merge-base / main / release/1.1`; `ABSENT` means that path is not present at that ref.

| Canonical path | Merge base | main | release/1.1 |
|---|---|---|---|
| `AGENTS.md` | `722ce876e05ff8d6f24d9c60794e0aa6be3c936c` | `2d017b22eb9e860856b6d390d62a8120d22d4ba4` | `854400e2dccc59e55351e2d8e2e0e4d2a338f678` |
| `.engineering/SOURCE-HIERARCHY.md` | `bedc10c97d28154efe59ff43fc1d175add37f568` | `bedc10c97d28154efe59ff43fc1d175add37f568` | `bedc10c97d28154efe59ff43fc1d175add37f568` |
| `.engineering/ARCHITECTURE.md` | `65cee9aa5ca31e663437a407aaa4f5452258dad1` | `09105c912f294fa50ee4163e4a27f6933d359408` | `c5eda022280e47ff4b45070193d196929a3a1ec0` |
| `.engineering/CHECKPOINT.md` | `38a3d851a1037e4866a0b22019e3b782f17dcb94` | `a495f3ee30e586a7e8e57ca63d20fa8ecf1bd97f` | `a8550e4ebc45ce7d1a1aa528366458d9657e92f5` |
| `.engineering/CHECKPOINT.json` | `0026989d7feebf2b96ef456ef950f625a7308db8` | `d3ca8edcfe6ab2db9b8c637fcd2a6d4e9dcb16f3` | `bc88fcb58acb5cbe6a67f9ce5d89f3162bcc9ca6` |
| `.engineering/CONSTITUTION-LOCK.md` | `27c915872ad978fa0950ccd24457659c79269822` | `29e3e8e8b1f7c39d37bbd165d130ee3910c3b073` | `37289514800ca80603ff37e0236a5e243cba3bf7` |
| `.engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md` | `6bd1d34065f808ab2566c56c76dfd5453bc44daa` | `437d7f371f13079e7af2858ff85e107163f0eede` | `6bd1d34065f808ab2566c56c76dfd5453bc44daa` |
| `.engineering/DECISIONS-LEDGER.md` | `303bfcbd8e75a7c27d7bda51d5e9032e91237f49` | `035a7a1f0e8f374784e06bc1b6a3bb10ee6854f6` | `e57b9ab9c5e93b81e4a3253ecf0e69dfaf19e537` |
| `.engineering/DECISIONS-SUPERSESSION-MAP.md` | `85613c8945c654e7449222a661325a883684c959` | `85613c8945c654e7449222a661325a883684c959` | `cb30173f011e6b62ebd3a3fafb13ccb012355aa2` |
| `.engineering/DEFINITION-OF-DONE.md` | `cc9fd107afa135a23f410739d41af875d6079197` | `150ec0a83ccb7d192bc20cde3cb73358e6197ddb` | `d9209765a268f0e21390a2c6c531c7dd771515b4` |
| `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` | `59e69438bef728f24ae96da292e3122a83d4ea76` | `bf1451ad628ca397bacae2bb333837ed2e9b3097` | `59e69438bef728f24ae96da292e3122a83d4ea76` |
| `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md` | `ABSENT` | `d061fff8e13bbb13fab6cdafb8bf001921905a61` | `ABSENT` |
| `.engineering/PROJECT-OVERVIEW.md` | `ef323fdf5f2638c9d50050f057cc1a306463749e` | `4ed6793a257fc3af5ebfe5972e8a6a7cef2095be` | `6b65d243017934f5da207ce3ac4bdeb3d5e40196` |
| `.engineering/REQUIREMENTS.md` | `6117f4d35258cd8782062acb80b445e08736465f` | `61367fcc2ebb338e3ff75b630314804bb1d29e22` | `1933341d4546164fbaf7b415bfa1708067f5e53` |
| `.engineering/SCOPE.md` | `5b6c5a9805d0a79e7539beaa5f5d6e018e6a7fb9` | `ed48ed36d7028f9a6606bed8b56fa9f413fab5b1` | `5aad68fdbd57b850ec05e5c44e74e5e5a3b94a29` |
| `.engineering/SECURITY.md` | `09b8aa12244791b509ecb50ba5c96db867a0797d` | `09b8aa12244791b509ecb50ba5c96db867a0797d` | `09b8aa12244791b509ecb50ba5c96db867a0797d` |
| `.engineering/TEST-BENCHMARK-PLAN.md` | `a7b5618ead1a483275a0b0e72126258523349f01` | `a7b5618ead1a483275a0b0e72126258523349f01` | `a7b5618ead1a483275a0b0e72126258523349f01` |

| Decision source | Merge base | main | release/1.1 |
|---|---|---|---|
| `ADR-0001` | `95f9e86ba1d3e7ff0b9ae312d1902f11b1b85873` | `52ef68b48fd92c6a38367c99ea91dd9df2d28c33` | `51e6e2d233afdf1b7626eb670008ad44e23fa958` |
| `ADR-0002` | `f971226ee6e7a9b16b4c6bceb9009fae961b3bfa` | `a46e6bf27ee985575aa7e52cf047260fea73569b` | `f971226ee6e7a9b16b4c6bceb9009fae961b3bfa` |
| `ADR-0003` | `ABSENT` | `ABSENT` | `62a2e2ef2de3b4f60186f020708f37eee99ca787` |
| `ADR-0004` | `ABSENT` | `ABSENT` | `396b098c1380eb2d12b3b8e24a1aedc9906ca519` |
| `ADR-0005` | `ABSENT` | `ABSENT` | `786eba0313202f2f2648461a2fc4e6f81190969a` |
| `ADR-0006` | `ABSENT` | `ABSENT` | `97bef59b15f557302a7fd625af30ceeb421c01a1` |
| `ADR-0007` | `687ee037d2dcd4936d118a23666665fc66410aed` | `687ee037d2dcd4936d118a23666665fc66410aed` | `ABSENT` |
| `ADR-0008` | `ABSENT` | `7d6ec3885fb3d029586dc0b7f99aa32b033170e1` | `ABSENT` |

## Semantic reconciliation inventory

- `AGENTS.md`: combine main's authorship lock with release's admitted-work, exact-branch, fresh-context and owner-audit/merge rules. Do not let either branch silently overwrite the other.
- Architecture, Constitution Lock, DoD, Overview, Requirements and Scope: reconcile the main process rule with release constraints on accepted V1.1 scope, adapter neutrality and the existing 64-item inventory. Keep the frozen V1.0 denominator at 1,088.
- `CHECKPOINT.md` and `.json`: main records the promoted D-0063/ADR-0008 state; release contains its own V1.1 overlay and release-only D-0062/ADR-0006 governance. Do not copy either branch checkpoint as a whole. Release text still describing #278 as active and its old Codecov percentage is stale; correct it only in a separately governed checkpoint delta.
- `CONSTITUTION-AMENDMENT-0001-HYBRID.md`, Executor Acceleration, ADR-0002 and the supersession map have branch-specific deltas; preserve provenance and reconcile them explicitly.
- Preserve release-only ADR-0003 through ADR-0006, including the current V1.1 owner gates. Preserve main-only ADR-0008 and its GitHub-first workflow for an admitted forward-port. Main/base ADR-0007 is absent on release: merging the release tree into main risks deleting that main decision even though `merge-tree` reports no path conflict.
- The shared source hierarchy, Security and Test/Benchmark Plan blobs are byte-identical at base/main/release.

## Scope and gate

This PR updates planning evidence only. It does not edit canonical sources, checkpoint files, implementation, tests, workflows or coverage settings. The two literal conflicts and all identified semantic lineage hazards are mapped; their resolution remains proposed.

Before any source mutation, separately admit a bounded forward-port Work Order, refresh refs and all fingerprints, repeat the three-way semantic audit, resolve the D-0062 identity collision with explicit approval, and produce a release-owned checkpoint delta. Keep issue #337 under its own admission and exact-head coverage gate.

**Audit state: REQUIRED / NOT PERFORMED.** PR #336 remains draft. Do not approve, merge, admit release mutation, or mark V1.1 complete here.

STOP CONDITION: `GBS_V11_CODEX_GITHUB_FIRST_FORWARDPORT_PLAN_READY_NOT_ADMITTED`.
