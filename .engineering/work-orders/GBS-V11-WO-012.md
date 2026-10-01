# GBS-V11-WO-012 — V1.1.2 release-state reconciliation and consumer-safe adoption preflight

**Issue:** #361  
**Status:** `ADMITTED_BY_OWNER_DIRECTIVE`  
**Risk:** `ELEVATED`  
**Release line:** `1.1.x`  
**Exact admission base:** `main@5a32a607ccf2055fab722f3d5d452791c6aae3e6`  
**Implementation branch:** `hotfix/v1.1.2-release-state-preflight`  
**Input report SHA-256:** `CD3575527091EE5E84A12B2C3F0F7FA02A615CAF9CC4E29BFDE61279B79AB4FF`

## OBJECTIVE

Create patch `1.1.2` from the current production `main`, carrying forward the already-merged post-publish recovery fix, reconciling stale V1.1.1 release/checkpoint truth, and preventing GEF brownfield adoption from mutating a consumer when deterministic preflight proves that the consumer's own fail-closed governance/impact contract would reject the generated GEF state.

## CONTEXT

The owner-provided V1.1.1 rollout report records a published `@gef-bootstrap/cli@1.1.1` and immutable `v1.1.1` release, with a post-publish verification transport failure and four consumer-level blockers. After that report, PR #359 merged at `5a32a607ccf2055fab722f3d5d452791c6aae3e6`, binding `gh run download` to the repository and adding read-only registry recovery checks. The immutable V1.1.1 release is not to be changed.

Canonical checkpoint sources on the admission base still describe V1.1.1 as `PATCH_IN_PROGRESS`, so current PROJECT_STATE is stale relative to repository/release facts and must be reconciled through this Work Order.

## SCOPE

1. Reconcile canonical V1.1 release state:
   - preserve V1.1.0 historical acceptance;
   - record V1.1.1 as published historical patch with its immutable release evidence and recovery status;
   - make V1.1.2 the active patch while this Work Order is executing;
   - synchronize human and machine checkpoint views and affected user/operator docs.

2. Version/distribution:
   - update workspace/CLI/package-lock and public documentation to `1.1.2`;
   - extend V1.1 trusted-publisher/recovery/release-assurance paths for exact `v1.1.2`;
   - retain provenance, npm signature verification, SRI, tarball SHA-256, lifecycle-script-disabled install and CLI/library/doctor/status smoke.

3. Consumer-safe adoption preflight:
   - before `init/adopt --apply` mutates an existing project, detect only deterministic repository-local contracts that make the planned GEF-owned files predictably invalid under the consumer's own fail-closed governance/impact rules;
   - return a typed BLOCKED/remediation result before mutation;
   - do not infer or weaken consumer policy;
   - absence/ambiguity of a detectable contract must not be converted into ALLOW when policy says fail closed;
   - preserve normal adoption for consumers without such a blocking contract.

4. Regression coverage:
   - prove repository-bound post-publish artifact download;
   - prove checkpoint monotonicity/current truth;
   - prove compatible brownfield adoption remains allowed;
   - prove deterministically incompatible governance/impact contracts block before mutation and leave the target unchanged.

5. Evidence/release:
   - produce exact-head Evidence Bundle and release manifest;
   - exact-head owner audit is required before merge;
   - tag/npm/GitHub Release only after merge and required release gates;
   - registry verification after publication is mandatory before any new consumer rollout.

## OUT OF SCOPE

- weakening or editing consumer governance/security/coverage/impact gates;
- fixing HIVE's pre-existing dependency graph merely to obtain rollout success;
- bypassing Neryn World's mandatory UADS prerequisite;
- mutating consumer repositories in this Work Order;
- changing the immutable `v1.1.1` tag, package or GitHub Release;
- force-push, rebase, history rewrite or destructive cleanup;
- V1.2 features or broad architecture redesign.

## FILES / SOURCES TO READ

Mandatory before implementation:
- `AGENTS.md`
- `.engineering/SOURCE-HIERARCHY.md`
- `.engineering/CHECKPOINT.md`
- `.engineering/CHECKPOINT.json`
- `.engineering/DECISIONS-LEDGER.md`
- `.engineering/decisions/ADR-0009-POST-PRODUCTION-PATCH-HOTFIX-ROUTING.md`
- `.engineering/SCOPE.md`
- `.engineering/REQUIREMENTS.md`
- `.engineering/ARCHITECTURE.md`
- `.engineering/SECURITY.md`
- `.engineering/DEFINITION-OF-DONE.md`
- `.engineering/TEST-BENCHMARK-PLAN.md`
- `.engineering/DEPLOYMENT.md`
- `.engineering/work-orders/GBS-V11-WO-011.md`
- `.engineering/evidence/GBS-V11-WO-011-EVIDENCE.md`
- `.github/workflows/v11-publish.yml`
- `.github/workflows/v11-wo011-post-publish-recovery.yml`
- relevant adoption/CLI/transaction/registry code and tests at the exact base.

The user-provided rollout report is evidence input only; where it conflicts with newer repository/provider facts, exact repository/provider state wins.

## REQUIREMENTS

- Preserve domain-specific source authority and fail-closed behavior.
- Preserve exact-state binding, deterministic mutation, recovery and tamper-evidence rules.
- No consumer policy may be silently reinterpreted.
- No required evidence may be represented as green without exact-head proof.
- Release/package identity must remain internally consistent across manifests, CLI output, docs and workflow assertions.
- Brownfield preflight must be deterministic, bounded and explain why mutation is blocked.

## ARCHITECTURE RULES

- Library/application API first; CLI remains a thin transport.
- Core/provider-neutral logic must not absorb GitHub-specific semantics.
- Filesystem mutation remains plan → stage → verify → commit/promote.
- Hosted-provider effects remain sagas and separately verified.
- Machine contracts remain versioned and fail closed on unsupported required semantics.
- Optional adapters/integrations are not used as implicit dependencies.
- ADR-0008 / D-0063 remains in force: Codex is sole author of product code, tests, CI and migrations; ChatGPT coordinates governance and review.

## CONSTRAINTS

- Start from exact base `5a32a607ccf2055fab722f3d5d452791c6aae3e6`.
- If main or a locked canonical source changes before implementation, mark Context Lock STALE and refresh/rebase only through a new governed delta; never silently continue.
- Use TDD for every behavioral bugfix: RED first, then GREEN.
- Do not broaden scope to unrelated cleanup/refactoring.
- Preserve all V1.0/V1.1.0 historical evidence.
- Use the owner GitHub account only for writes.
- No merge with failed/pending/stale/mismatched required checks or unresolved HIGH/CRITICAL findings.

## ACCEPTANCE CRITERIA

1. Canonical checkpoint truth records V1.1.1 as historical published/recovered patch and V1.1.2 as the active patch during execution, with no human/JSON conflict.
2. Workspace, CLI, lockfile, docs and release workflow identities consistently report `1.1.2`.
3. A regression test fails without the repository-bound post-publish artifact download fix and passes with it.
4. Consumer preflight tests prove:
   - a deterministically incompatible governance/impact contract returns BLOCKED before mutation;
   - target filesystem/Git state is unchanged on that block;
   - a compatible consumer still applies successfully;
   - unsupported/ambiguous policy remains truthful and does not become an optimistic pass.
5. `npm run build`, `npm run typecheck`, full `npm run validate`, `npm audit --audit-level=high`, package/tarball inspection and all Work-Order-specific focused tests pass.
6. Applicable Linux/Windows/macOS release assurance and security/provider checks pass on the exact final PR head.
7. Evidence Bundle records base/head SHA, actual changed files, decisions, tests, security/package proof, corrected failures, remaining consumer-owned blockers, risks and proposed Checkpoint Delta.
8. Owner exact-head audit yields APPROVED with CRITICAL/HIGH = 0 before merge.
9. Release/tag/npm publication uses the configured Trusted Publisher path and post-publish registry verification proves signature/provenance/SRI/install/CLI/library/doctor/status against the immutable release artifact.
10. No claim is made that HIVE's dependency blocker or Neryn World's UADS prerequisite were fixed by this patch unless separate direct evidence proves those consumer facts changed.

## TESTS

Minimum:
- focused RED→GREEN regression tests for post-publish repository binding and adoption preflight;
- existing V1.1 release-workflow/package tests;
- adoption/init/doctor/status/upgrade compatibility tests impacted by the change;
- `npm run build`;
- `npm run typecheck`;
- `npm run validate`;
- `npm audit --audit-level=high`;
- `git diff --check`;
- JSON/schema validation for changed machine contracts;
- package pack/install smoke from the exact candidate tarball;
- exact-head GitHub required/security checks and applicable cross-platform assurance.

## DELIVERABLES

- implementation commits on `hotfix/v1.1.2-release-state-preflight`;
- updated package/release/docs/checkpoint state;
- regression tests;
- `.engineering/evidence/GBS-V11-WO-012-EVIDENCE.md`;
- `.engineering/evidence/GBS-V11-WO-012-RELEASE-MANIFEST.json`;
- proposed Checkpoint Delta;
- one PR to `main`;
- final PT-BR audit.

## REVIEW FORMAT

`APPROVED`, `CORRECTION REQUIRED` or `BLOCKED`.

Review must state exact base/head, changed paths, required checks, test/security results, CRITICAL/HIGH findings, known risks, remaining consumer-owned blockers and checkpoint disposition. Owner audit is `NOT_INDEPENDENT` and must not be described otherwise.

## STOP CONDITION

Before merge/release: `GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT`.

After successful merge, immutable `v1.1.2` publication and registry verification: `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`.

## CORRECTION DELTA #1 — STRICT TEST-SURFACE AUTHORIZATION

**Reason:** Codex preflight/validation on WO-012 identified six existing V1.1 tests outside the original Context Lock whose assertions are mechanically coupled to the canonical checkpoint/release-flow transition from WO-011 / ordinal 11 to WO-012 / ordinal 12 and to the 1.1.2 distribution wording. These are not new product scope.

**Owner authorization:** APPROVED for this same Work Order and PR only.

Additional WRITE_ALLOWED paths:
- `tests/v11-wo-002-dist-smoke.test.mjs`
- `tests/v11-wo-002-admission.test.mjs`
- `tests/v11-wo-003-admission.test.mjs`
- `tests/v11-wo-004-admission.test.mjs`
- `tests/v11-wo-008-admission.test.mjs`
- `tests/v11-wo-009-admission.test.mjs`

### Allowed semantic changes

1. `tests/v11-wo-002-dist-smoke.test.mjs`
   - update only stale README/distribution text expectations required by the already-approved 1.1.2 version/docs transition;
   - preserve package contents, lifecycle-script, security, runtime-closure and installed-CLI smoke assertions.

2. The five admission tests
   - extend only the exact current-patch/checkpoint state handling necessary to recognize `GBS_V11_WO_012_ADMITTED`, `GBS-V11-WO-012`, ordinal 12 and the approved 1.1.2 workflow/checkpoint fields;
   - preserve every historical state branch and historical WO assertion;
   - no skipped tests, blanket regex weakening, broad upper-bound removal, or conversion of exact assertions into permissive truthiness;
   - do not alter unrelated release/governance semantics.

### Source identities at the original admitted base

- `tests/v11-wo-002-dist-smoke.test.mjs`: `34410ecf132e61d64f42ccddd7056dc6c3aa2a05`
- `tests/v11-wo-002-admission.test.mjs`: `d425e1dcfcf93781ecc0469792fcbccdd567d9a0`
- `tests/v11-wo-003-admission.test.mjs`: `01311c6e91481cd92b490b662b21a1c24d563609`
- `tests/v11-wo-004-admission.test.mjs`: `a7badb41dec78dedfe479cc73896f71c52ac3d7f`
- `tests/v11-wo-008-admission.test.mjs`: `52d0d89eadf362255b91338071cbeb5467be5b9f`
- `tests/v11-wo-009-admission.test.mjs`: `8e26a4dff2d535da11fc73deaf2f5803c05f416b`

### Required proof

Codex must show that the six failures are GREEN after the bounded changes, then rerun `npm run build`, `npm run typecheck`, `npm run validate` and `npm audit --audit-level=high`. Any additional failing path outside this delta remains BLOCKED and requires a new exact-path authorization. This delta does not authorize merge, checkpoint promotion, tag or npm publication.

