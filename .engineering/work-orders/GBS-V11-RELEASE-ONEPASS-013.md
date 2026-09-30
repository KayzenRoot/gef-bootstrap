# GBS-V11-RELEASE-ONEPASS-013 — V1.1 closeout master Work Order

Status: `GATE0_MERGED_PHASE1_ADMITTED_EXECUTION_IN_PROGRESS`
Issue: [#348](https://github.com/KayzenRoot/gef-bootstrap/issues/348)
Release target: `release/1.1`
Owner: `KayzenRoot`
Master Context Lock: `.engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json`
Gate matrix: `.engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE-MATRIX.json`

## Objective and authority

Use this Work Order as the single ordered plan to finish the V1.1 line. A gate authorizes only its stated surface. Exact source refs, decisions, permissions, evidence and stop conditions are captured in the Context Lock and gate matrix; a relevant ref or fingerprint change makes the affected preparation stale and requires revalidation.

Canonical source routing follows `.engineering/SOURCE-HIERARCHY.md`. The frozen Constitution, Scope, Requirements, Architecture, Security, Test & Benchmark Plan, Definition of Done and Deployment policy remain binding. This Work Order does not rewrite V1 acceptance, requirements, decisions, thresholds or historical evidence.

## Verified current snapshot

Captured at `2026-09-30T01:37:44Z` (`2026-09-29`, `America/Sao_Paulo`):

- `main`: `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, tree `0413bf3e8d706738f73c93578c81630ce027f4ec`.
- `release/1.1`: `9f6f069c977868ade34a19cddb346f7bea9a95fe`, tree `acdf5f57c592dcb9ca041b179d7fa86ed4503d2a`.
- Merge base: `e23311e77d79b84f3c70671072a22a6f8896d13d`, tree `39d8b61cb70020e87c65f2443ce3790af1c2b5c4`.
- Divergence: 2 `main`-only and 79 `release/1.1`-only commits.
- PR #347 is actually `MERGED`; merge SHA is the release tip above. Audited PR head was `ab02b706b4ab7de941cdcc1f849fc07003d92949`; owner review #5360335310 is explicitly `NOT_INDEPENDENT`; its final recorded exact-head check set was 16/16 `SUCCESS`. The merge establishes release applicability of D-0063 / ADR-0008.
- PR #336 is `MERGED` at `d892d2cb03719dd661bcab86bec995aecc8f4894`; Issue #335 remains the planning lineage. PR #278 is `CLOSED_NOT_MERGED`; its old Codecov/Sonar checks are historical and never satisfy a new integration candidate.
- Issue #334 comment #5894818858 proves the historical #278 discrepancy at `bbd83a179dd4c11f2f8653251db2b574d0266880`: LCOV hit 238/238 lines but missed 14/37 branch outcomes; Codecov mapped those outcomes to 13 uncovered and one partial changed line. Cause: line coverage versus branch-aware patch coverage, not a source-path or SHA mismatch.
- Issue #337 now contains a post-#347 owner source admission for tests only, bound to release SHA `9f6f069c977868ade34a19cddb346f7bea9a95fe`, main SHA `f6738292c038eb6f0d08d1d32b3752c5c7dc417a`, merge base `e23311e77d79b84f3c70671072a22a6f8896d13d`, and exact critical blobs recorded in the child Context Lock.
- Known factual checkpoint debt remains: release `CHECKPOINT.json` blob `42aa40765523e10a46fe65430169bbfa4f735bf8` still says `codexOnlyAdoption.actualMergeSha=null` and `mergeReceipt=PENDING_REAL_MERGE`. Track this for the separately audited, narrow WO-004 correction before final WO-010 acceptance. It is outside Phase 1 and this Work Order does not authorize editing the checkpoint.

## Phase 0 — governance promotion

**State: `MERGED`; factual receipt synchronization remains outstanding.** PR #347 completed the release adoption of D-0063 / ADR-0008 at the real merge recorded above. It did not promote V1.1 to `main`, accept WO-010, change V1's accepted `1088/1088`, publish a package, create a release tag, or discharge the checkpoint receipt debt.

## Phase 1 — admitted Issue #337 tests-only correction

**State at authoring: `ADMITTED / EXECUTION IN PROGRESS`.** Stable child Work Order: `GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012`. Follow its exact source binding, one-pass negative-case plan, acceptance proof and stop condition in `.engineering/work-orders/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.md`.

The single Phase 1 PR targets `release/1.1`. Allowed source tests are `tests/v11-codecov-patch-coverage.test.mjs` and, only for isolated process-boundary cases, one new `tests/v11-pack-branch-negative.test.mjs`. Versioned Work Orders, fresh Context Locks, Evidence Bundles, this master gate matrix and PR metadata are allowed. Production `packages/cli/scripts/prepare-package.mjs`, workflows, thresholds, dependencies, manifests, checkpoint, `main`, tags and publication are read-only or forbidden as detailed in the child Work Order.

Required Phase 1 evidence binds actual behavior and native Node `22.17.0` LCOV `DA` and `BRDA` records to the exact candidate head, plus build, full validation, package/integration/security tests, required Ubuntu/Windows/macOS assurance, pinned Gitleaks over the complete new commit interval, Trivy, current CodeQL/Sonar where applicable, and zero unresolved CRITICAL/HIGH blockers. A test-only branch copy is not credited unless the report attributes its executed source back to the exact production script blob and the actual behavior is asserted.

No cumulative Codecov credit is inferred from local test coverage. After Phase 1 is audited and merged, Phase 2 must independently rebind refs and prove its own new release-to-main Codecov patch result is at least `97.85%` on its exact head.

**Phase 1 STOP:** `GBS_V11_MAINT_PACK_BRANCH_CORRECTION_012_SOURCE_BOUND_TESTS_ONLY_ADMITTED_EXACT_HEAD_READY_FOR_OWNER_AUDIT`. If the source moves or a production-source change/injection seam is needed, stop as `BLOCKED_NEEDS_BOUNDED_OWNER_DELTA`.

## Phase 2 — fresh cumulative `release/1.1` to `main` integration

**State: `READ_ONLY_PREPARATION_RECORDED / NOT_ADMITTED`.** The current merge-base and refs above were freshly compared after Gate 0. `git merge-tree --write-tree --name-only --messages origin/main origin/release/1.1` reported 14 textual conflicts: 12 content conflicts and 2 add/add conflicts. The dry run used an external temporary object directory; it did not change refs, index, worktree or branch state.

Current textual conflict map:

| Path | Current conflict class | Decision surface |
|---|---|---|
| `.engineering/ARCHITECTURE.md` | content | preserve release V1.1 contracts and reconcile construction-role overlay |
| `.engineering/CHECKPOINT.json` | content | retain independent production and release facts; repair neither by wholesale replacement |
| `.engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md` | content | preserve hybrid product boundary and branch-effective amendment history |
| `.engineering/CONSTITUTION-LOCK.md` | content | reconcile effective release adoption with main's promoted state |
| `.engineering/DECISIONS-LEDGER.md` | content | preserve branch-qualified D-0062 lineage; do not alias IDs silently |
| `.engineering/DEFINITION-OF-DONE.md` | content | preserve frozen acceptance and exact-state proof requirements |
| `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` | content | reconcile executor instructions without expanding code scope |
| `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md` | add/add | compare both introduced canonical copies and retain one governed meaning |
| `.engineering/PROJECT-OVERVIEW.md` | content | preserve V1.0 production acceptance and V1.1 boundaries |
| `.engineering/REQUIREMENTS.md` | content | preserve frozen requirements and branch-compatible actor policy |
| `.engineering/SCOPE.md` | content | preserve frozen product/module scope and release exclusions |
| `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md` | add/add | reconcile provenance and adoption timing against actual PR #347 merge |
| `AGENTS.md` | content | reconcile repository executor rules with both branch authorities |
| `README.md` | content | retain truthful production/release and distribution claims |

Two further files changed on both sides relative to the merge base but did not conflict textually: `.engineering/CHECKPOINT.md` and `.engineering/decisions/ADR-0001-COMPLETE-PRODUCTION-TARGET.md`. `.engineering/CHECKPOINT.md` has a known semantic overlap even if Git combines it automatically. Additional semantic review is required for `SOURCE-HIERARCHY`, `SECURITY`, `TEST-BENCHMARK-PLAN`, Scope, Requirements, Architecture, DoD, README and operator runbooks; identical blobs do not eliminate downstream validity checks.

Decision lineage to preserve:

- `D-0062@main / ADR-0007` means retire the Hive-specific development/integration contract; it is approved and merged to `main` at `3c5f1fb96e9d5f3d8a07acdf024687063f82d9d2` and its current ADR blob is `687ee037d2dcd4936d118a23666665fc66410aed`.
- `D-0062@release/1.1 / ADR-0006` means owner-operated exact-head audit and merge authority; current release ADR blob is `97bef59b15f557302a7fd625af30ceeb421c01a1`.
- D-0062 is branch-qualified historical identity on both lines. D-0064 is unallocated; any renumbering or lineage map requires explicit admission and owner decision. Never overwrite either branch's D-0062 meaning.
- D-0063 / ADR-0008 is effective on `main` under its promotion and effective on release only at the actual PR #347 merge. Its branch-specific blobs are in the gate matrix.
- Release-only ADR-0003 through ADR-0006 and main's ADR-0007 must be preserved without deleting or globally remapping history.

PR #336 merged to release before Gate 0; its planning evidence is a dependency input, not implementation authorization. PR #278 remains closed without merge. No replacement cumulative release-to-main PR or current candidate Codecov/Sonar result is credited at this Phase 1 boundary.

Phase 2 may begin only after Phase 1 exact-head audit and merge, fresh Context Lock/source/conflict rebinding, explicit implementation admission, and a precise write allowlist. Then create one cohesive integration PR, resolve only admitted conflicts, and run current exact-head cumulative Codecov `>=97.85%`, Sonar, all required security/quality/compatibility/CI, exact-head Ubuntu/Windows/macOS evidence, and owner audit. No inherited historical check may satisfy these gates.

## Phase 3 — WO-010 production acceptance and V1.1 release

**State: `PREPARATION_ONLY / NOT_ADMITTED`.** WO-010 is not present in the current release tree and no WO-010 admission exists. This Work Order records read-only source inventory and known owner decisions only. It authorizes no production implementation, main promotion, tag, package or registry action.

Current release artifacts show root and CLI package metadata with `private=true` and `license=UNLICENSED`. The required legal/distribution choice, npm `@gef-bootstrap` namespace/registry ownership and OIDC/trusted-publishing setup, and explicit final owner authorization for S4 publication are not verified. Keep each as `UNKNOWN / OWNER ACTION REQUIRED`; do not infer consent or permission.

The future WO-010 source inventory and exact current blobs are in the master Context Lock and gate matrix: root/CLI manifests and lockfile; `LICENSE`, `CHANGELOG.md`, root and CLI READMEs; install, quickstart and operations runbooks; release/distribution/compatibility/test plans; package preparation script; and applicable release, security, dependency and provenance workflows. These are inventory references only. Refresh all hashes after Phase 2 and before WO-010 admission.

WO-010 acceptance remains a distinct gate for the complete frozen DoD: current full test/security evidence, zero unresolved CRITICAL/HIGH, supported Node/OS and consumer package verification, reproducible artifacts with provenance/checksum, owner-audited exact-head production acceptance, and only then any separately authorized promotion or publication. A merge or passing test alone is not release completion.

## Compulsory proof matrix

| Gate | Required proof | Current state |
|---|---|---|
| 0 | Exact-head owner audit, required checks and real merge receipt for governance promotion | `MERGED`; checkpoint receipt debt tracked |
| 1 | Actual fail-closed branch cases; native Node 22.17.0 DA/BRDA on exact candidate; build/validate; package/integration/security; exact-head cross-platform and security checks | `ADMITTED_IN_PROGRESS`; Phase 1 Evidence Bundle owns results |
| 2 | Fresh ancestry/conflict reconciliation; cumulative Codecov >=97.85%; current Sonar/security/quality and all required checks on one exact integration head | `NOT_ADMITTED` |
| 3 | Full WO-010 production DoD, supported consumer/install/upgrade/recovery matrix, secure reproducible release artifacts, owner decisions and verified post-publication receipts if publication is authorized | `NOT_ADMITTED`; legal/registry/OIDC decisions unknown |

Unrun evidence is `NOT_RUN`; missing or inaccessible evidence is `UNKNOWN/BLOCKED`; failed or stale exact-head evidence is not a pass. Preserve the historical V1 `1088/1088` denominator and state. “9/10 WOs” is a milestone count, never a production completion percentage.

## Change navigation and safety

- Phase 1 MUST_READ: root `AGENTS.md`; `.engineering/SOURCE-HIERARCHY.md`, checkpoint views, Scope, Requirements, Architecture, Security, Test & Benchmark Plan, Definition of Done, Deployment, Constitution/decisions and applicable ADRs; Issue #334 proof; Issue #337 admission; Issue #348; Issue #335 and merged PR #336 lineage; the exact script, existing coverage test, coverage workflow and pipeline documentation; test/package guidance.
- Phase 1 WRITE_ALLOWED: the two admitted test files above and the versioned artifacts named in the child Work Order. Everything else is read-only or forbidden as specifically listed there.
- Phase 2/3 during this Work Order: read-only source/status/fingerprint collection only. No implementation, conflict resolution, checkpoint update, WO-010 admission or release operation.
- No force-push, history rewrite, test weakening, coverage exclusion, threshold change, CI bypass, secret exposure, tag mutation, merge or publication is authorized by this Work Order.
- Review/merge authority follows release D-0062 / ADR-0006: exact-head owner audit is `NOT_INDEPENDENT`; no PR is merged here.

## Progress and stop conditions

At this revision, Gate 0 is `MERGED`; Gate 1 is `ADMITTED_IN_PROGRESS`; Gate 2 is `READ_ONLY_PREPARATION_RECORDED / NOT_ADMITTED`; Gate 3 is `PREPARATION_ONLY / NOT_ADMITTED`. Per-gate source refs, exact evidence state, changed files, tests, platform results, blockers and current candidate head must be maintained in the machine-readable gate matrix and phase Evidence Bundles.

Stop Phase 1 at `GBS_V11_MAINT_PACK_BRANCH_CORRECTION_012_SOURCE_BOUND_TESTS_ONLY_ADMITTED_EXACT_HEAD_READY_FOR_OWNER_AUDIT` for the required owner audit, or at `BLOCKED_NEEDS_BOUNDED_OWNER_DELTA` if the exact source binding changes or production-source authorization is required. Continue later phases only after their separate gates become effective. Final master completion is allowed only after verified actual receipts for every admitted gate; no such completion is claimed here.
