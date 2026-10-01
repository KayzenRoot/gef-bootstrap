# GBS-V11-WO-011 — V1.1.1 adopt/init baseline hotfix and rollout

**Issue:** [#357](https://github.com/KayzenRoot/gef-bootstrap/issues/357). **Owner execution order:** user-supplied text attachment, SHA-256 `237965F559E77569803463ECBF35233025DAFC1F407AACCDD351D9AD61F87BF5`. **Admission:** owner explicitly authorized this execution order in the request; implementation is bound by `.engineering/context-locks/GBS-V11-WO-011.json`. **Exact base:** `main` at `a88a61b7fcae632cdf5b282dc4461592b92cad57`. **Branch:** `hotfix/v1.1.1-adopt-baseline-rollout`. **Previous stable release:** `v1.1.0`, published and verified; preserve its tag and package.

## Objective

Correct the confirmed V1.1.0 false project drift caused by GEF creating `.gef` and `.gef-private` after recording the pre-apply baseline. Preserve full diagnostic observations and true user-file drift detection, keep valid V1.1.0 state readable, fail closed on invalid/unsupported state, repair the stale V1.1 checkpoint history, ship and validate `1.1.1`, and then resume only the listed consumer rollout.

## Scope

- Separate full diagnostic observation from the deterministic project-drift fingerprint. GEF-managed metadata at the target root (`.gef`, `.gef-private`) alone must not change project drift.
- Add end-to-end regression coverage for clean brownfield adopt, immediate and repeated status, doctor, real user-file drift, managed-metadata-only changes, init, and valid/absent/invalid/unsupported/legacy state.
- Update the current V1.1 checkpoint monotonically: preserve Gate 2 and Gate 3 history, record V1.1.0 as production accepted, and mark this patch as in progress. Update historical tests with explicit allowed transitions only.
- Resolve Goodz Menu's unborn-repository behavior against canonical product requirements. If init is not required to create an unborn repository, use the owner-authorized empty `main` baseline commit only after the registry package smoke gate.
- Update only the current 1.1.1 package, compatibility, release, documentation, test and evidence surfaces; preserve historical 1.1.0 statements.
- Correct the H10 transaction-journal replacement defect reproduced during WO-011 validation: on Windows, a replaced journal path can reuse `dev:ino` and creation time, so the journal writer must also verify the last persisted content before updating and preserve a replacement file.
- After exact-head checks and the authorized release gates, publish immutable `v1.1.1` and `@gef-bootstrap/cli@1.1.1`; only then begin isolated consumer updates for core, iris, hive, hive-coder, fairview, goodz-menu and neryn-world. `gef-bootstrap` receives a self-check only.

## Out of scope and constraints

No V1.2 work, no changes to V1.0/1.1.0 package or tag, no rewriting history, no touching the previously captured failing Core clone, no metadata edits in consumers to hide drift, no security/quality gate weakening, no broad code changes to consumers, no long-lived npm token, and no paid service. Do not install a version before it exists in npm. Preserve project-owned files and canonical governance. All consumer actions use new clean clones and exact fetched base SHAs.

## Required reads

`AGENTS.md`; `.engineering/SOURCE-HIERARCHY.md`; `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md`; both current checkpoints; `.engineering/ARCHITECTURE.md`; `.engineering/REQUIREMENTS.md`; `.engineering/SECURITY.md`; `.engineering/DEFINITION-OF-DONE.md`; `.engineering/TEST-BENCHMARK-PLAN.md`; V1.1 scope, compatibility/migration contract, test matrix, CLI distribution architecture and release plan; CLI registry/schema/upgrade implementation; package/release workflow; current E2E and checkpoint admission tests.

## Acceptance criteria

1. Adopt/init immediately followed by status reports no `UNEXPECTED` drift or `DIRTY` operator state solely from GEF metadata; repeated status is deterministic; doctor still reports metadata diagnostically.
2. A real user-owned file addition/change still reports drift. Legacy V1.1.0 baselines are handled explicitly and validly; absent baseline remains unknown; malformed, unsupported version or unknown semantics never become an accepted baseline.
3. All applicable local and CI release checks pass on the exact PR head, including full validation, package/tarball verification, security scans, Ubuntu/Windows/macOS same-artifact smoke and a fresh disposable real Core clone proof. A failing or unavailable provider check is not a pass.
4. The historical checkpoint test suite expresses only explicit monotonic states and passes against the promoted patch checkpoint.
5. Goodz Menu receives only the specifically authorized empty baseline commit if the canonical product contract does not require GEF init to support unborn HEAD.
6. Merge, tag, publish, release and consumer rollout occur only in the order and under the exact prerequisites in the owner execution order. Preserve all required protections.
7. Publish the evidence-bound final report `GEF-V1.1.1-HOTFIX-AND-ROLLOUT-REPORT.md` and stop with the exact completion/blocker state required by the owner execution order.

### Validation-discovered correction

The existing H10 ownership regression intermittently returned `ok: true` after its journal path was replaced with a sentinel file. A focused reproduction observed the Windows filesystem reuse the same `dev:ino` and reported creation time for the replacement. WO-011 therefore includes a narrow change to `packages/cli/src/private-authority.ts` and the H10 regression test to validate the current journal bytes against the last persisted fingerprint before a write. The correction must keep the replacement bytes untouched and return an ownership refusal.

## Validation ladder

Focused regression test first (demonstrate it fails on the old implementation), then build/typecheck, focused CLI and compatibility tests, full `npm ci`, `npm run build`, `npm run validate`, real tarball and smoke tests. Run security and cross-platform checks through the existing pinned workflows without weakening or duplicating them. The release and consumer gates bind independently to exact SHAs; evidence never transfers between heads.

## Stop conditions

Stop a dependent stage if source authority, exact base, package identity/trusted-publisher binding, required evidence or branch protections cannot be verified. A real critical package defect found after 1.1.1 publication requires `V1_1_2_REQUIRED`; never overwrite 1.1.1. Leave an individually blocked consumer isolated while continuing other eligible consumers. Do not report completion until the owner order's final conditions are evidenced.
