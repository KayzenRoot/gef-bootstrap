# GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012 — Evidence Bundle

Status: `EXACT_HEAD_PROVIDER_GREEN_AWAITING_OWNER_AUDIT`
Issue #337 admission: tests-only after actual PR #347 merge
Master: `GBS-V11-RELEASE-ONEPASS-013` / Issue [#348](https://github.com/KayzenRoot/gef-bootstrap/issues/348)
Target: `release/1.1`
Candidate branch: `codex/gbs-v11-maint-pack-branch-correction-012`
PR: [#349](https://github.com/KayzenRoot/gef-bootstrap/pull/349), open draft.

This bundle distinguishes the test-bearing candidate reviewed in [owner review #5363391120](https://github.com/KayzenRoot/gef-bootstrap/pull/349#pullrequestreview-5363391120), `a2348d39bcd77951900d7d24e2a45a33e67fe9a8`, from the documentation-only correction HEAD. Provider evidence listed for the reviewed candidate is bound to that SHA. The new correction HEAD must independently pass its triggered workflows before re-audit; the latest exact-HEAD results are exposed by the [PR checks page](https://github.com/KayzenRoot/gef-bootstrap/pull/349/checks). No test or source result is silently transferred between SHAs.

## Exact-state lock

Execution base: `release/1.1@9f6f069c977868ade34a19cddb346f7bea9a95fe`; tree `acdf5f57c592dcb9ca041b179d7fa86ed4503d2a`. `main@f6738292c038eb6f0d08d1d32b3752c5c7dc417a`; merge base `e23311e77d79b84f3c70671072a22a6f8896d13d`; divergence 2 main-only / 79 release-only. A fresh fetch confirmed these refs had not moved.

Critical blobs rechecked against Issue #337 admission:

- `packages/cli/scripts/prepare-package.mjs`: `10e659ccce15045ed37ffa3e82d06a8408b8f734`.
- Existing `tests/v11-codecov-patch-coverage.test.mjs`: `2441961628d20dcc9404d2e51cc1d97b03543137` before admitted test additions.
- `.engineering/SOURCE-HIERARCHY.md`: `bedc10c97d28154efe59ff43fc1d175add37f568`.

The production script remained byte-identical to its admitted Git blob and the package tree snapshot was unchanged by the tests. Fixture copies redirect only the two `import.meta.url` root expressions and add a test-local `process` binding on the existing `node:os` import line; the original line count and production source are preserved. No host process environment, package manifest, lockfile, workflow or dependency was changed.

## Changed files

The PR's eight-path allowlist is:

- `.engineering/work-orders/GBS-V11-RELEASE-ONEPASS-013.md`
- `.engineering/work-orders/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.md`
- `.engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json`
- `.engineering/context-locks/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.json`
- `.engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE-MATRIX.json`
- `.engineering/evidence/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012-EVIDENCE.md`
- `tests/v11-codecov-patch-coverage.test.mjs`
- `tests/v11-pack-branch-negative.test.mjs`

The owner correction commit is limited to the child Work Order, child Context Lock, this Evidence Bundle, and the master gate matrix. It does not change the original two test files or any production, CI, threshold, manifest, checkpoint, main, tag or publication source.

## Test behavior added

The coverage test drives exported `stage()` and `pack(destination)` against a source-hash-verified copy inside disposable package fixtures. It asserts real failures and cleanup for missing package payload, engine source, engine support file, CLI schema, host-native package root/host package, `koffi`, built runtime `dist`, repository license, unresolved npm CLI, nonzero fake npm pack and successful npm-without-tarball. It retains successful staging and real tarball packing assertions and compares the production CLI tree before and after. The second test exercises missing `--destination` through a child process and verifies exit status, exact error and empty stdout.

## Owner correction review #5363391120 — reviewed candidate results

On reviewed HEAD `a2348d39bcd77951900d7d24e2a45a33e67fe9a8` over base `9f6f069c977868ade34a19cddb346f7bea9a95fe`, GitHub returned **14 workflow runs**, expanded to **33 jobs; 33/33 succeeded**. The old PR wording “30 exact-HEAD check runs” was inaccurate and is corrected in the PR description. [Repository Validation run 36663467583 / job 109723038271](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467583/job/109723038271) reported 1,603 total tests, 1,599 passed, 0 failed and 4 skipped.

The four documents in the owner correction synchronize those actual results. The child Context Lock allowlist now points to `.engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json`; the former typo path was not created. This state is provider-green awaiting owner re-audit under D-0062. It does not admit Gate 2, authorize merge, or credit cumulative Codecov.

## Validation record

| Proof | Result | Evidence |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | PASS locally | Locked dependencies installed without lifecycle scripts. |
| `npm run build` | PASS locally | Node `22.17.0`, npm `10.8.2`; TypeScript build exited 0. |
| `npm run validate` | PASS locally | Node `22.17.0`, npm `10.8.2`; 1,603 passed, 0 failed, 0 skipped. |
| Focused new-test native LCOV | PASS locally | 5/5 tests; one `SF:packages\\cli\\scripts\\prepare-package.mjs` record; 236/238 DA and 49/52 BRDA outcomes hit. Zero counters in that focused record are at labels 70, 201 and 236. |
| Full `tests/*.test.mjs` native LCOV | PASS locally | 1,603/1,603 tests; nonempty LCOV; exact production-script `SF`; 236/238 DA (99.16%), 70/87 BRDA outcomes (80.46%), functions 100%. DA misses are 237–238. |
| Historical target DA rebind | PASS locally | All 14 Issue #334 target lines have positive DA in the full report; counts are listed below. |
| Ubuntu exact-head assurance | PASS on reviewed candidate `a2348d39bcd77951900d7d24e2a45a33e67fe9a8` | [Job 109723038646](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038646): 1,599 passed, 0 failed, 4 Windows-ACL-only cases skipped; npm audit found 0 vulnerabilities. |
| macOS exact-head assurance | PASS on reviewed candidate `a2348d39bcd77951900d7d24e2a45a33e67fe9a8` | [Job 109723038619](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038619): 1,599 passed, 0 failed, 4 Windows-ACL-only cases skipped; npm audit found 0 vulnerabilities. |
| Windows exact-head assurance | PASS on reviewed candidate `a2348d39bcd77951900d7d24e2a45a33e67fe9a8` | [Job 109723038677](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038677): 1,603 passed, 0 failed, 0 skipped; npm audit found 0 vulnerabilities. |
| Pinned Gitleaks, complete PR commit interval | PASS on reviewed candidate | [Latest same-SHA job 109725705448](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36664346405/job/109725705448); [earlier candidate job 109723038759](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467644/job/109723038759). |
| Trivy HIGH/CRITICAL scan | PASS on reviewed candidate | [Job 109725705282](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36664346405/job/109725705282); package-lock reported 0 vulnerabilities. |
| CodeQL analysis and tracked-alert evidence | PASS on reviewed candidate | [CodeQL analysis](https://github.com/KayzenRoot/gef-bootstrap/runs/109723352322); [tracked-alert job 109723038478](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038478). |
| SonarCloud and cumulative diagnostics | PASS on reviewed candidate | [SonarCloud Quality Gate](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=349) passed with 0 security hotspots. Seven new open MAJOR `javascript:S8784` code smells remain in test files as disclosed quality debt; [diagnostics job](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038618), [duplicate-block job](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36663467636/job/109723038605). |
| Dependency Review and Pipeline Integrity | PASS on reviewed candidate | [Dependency Review job 109725705405](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36664346401/job/109725705405); [Pipeline Integrity job 109725705707](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36664346526/job/109725705707). |
| Candidate/release CRITICAL/HIGH code-scanning findings | None open on reviewed candidate or `release/1.1` | Repository-wide inventory separately has three open HIGH Scorecard alerts on `main` only: #14 MaintainedID, #13 CodeReviewID and #3 BranchProtectionID. On `release/1.1`, HIGH #2 is fixed and MEDIUM #1 remains open; the `main` alerts are not claimed cleared. |
| New documentation-only exact HEAD checks | Must independently pass before re-audit | The correction commit changes only the four authorized documents. Do not substitute prior-SHA evidence for the new HEAD; bind the final SHA and checks through the [live PR checks page](https://github.com/KayzenRoot/gef-bootstrap/pull/349/checks). |
| Future cumulative Codecov patch gate | NOT_RUN / NOT_CREDITED | Gate 2 requires a new release-to-main PR to prove `>=97.85%` on its own exact SHA. |
| `git diff --check`, JSON parse and eight-path allowlist | Required after correction commit | Results and exact new HEAD are recorded in the PR correction update; the allowed complete PR path set remains the eight paths listed above. |

Full native `DA` counts for the 14 historical target lines:

| Line | DA hits |
|---:|---:|
| 73 | 1 |
| 83 | 1 |
| 97 | 79 |
| 117 | 1 |
| 139 | 11 |
| 140 | 11 |
| 144 | 11 |
| 159 | 8 |
| 173 | 1 |
| 199 | 1 |
| 203 | 5 |
| 219 | 5 |
| 222 | 5 |
| 232 | 1 |

The LCOV section contains separate BRDA block IDs for production-script invocations and isolated fixture-loaded source under one `SF`; some target labels have zero counters in one block set and positive counters in another. Tests assert the branch behavior and error/cleanup outcomes. This is not represented as a single-context 100% branch result. No Phase 1 result proves the future cumulative Codecov patch threshold.

## Cross-platform failure diagnosis and in-scope correction

The first assurance run on superseded candidate `a50a5daadcd183ae19ff90575df543bad3b64f67` passed on Ubuntu and Windows but failed on macOS in the missing-`--destination` child-process test: expected exit status 1, observed 0 ([failed macOS job](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36662040123/job/109718700782)). The fixture used a lexical `os.tmpdir()` path, while macOS resolved the child working directory canonically. The copied script's real-entrypoint comparison missed and the child exited without exercising the argument error. The admitted test now canonicalizes `tmpdir()` with `realpathSync()` for fixture creation and cleanup containment. This changed only `tests/v11-pack-branch-negative.test.mjs`; production blob `10e659ccce15045ed37ffa3e82d06a8408b8f734` remains unchanged. The corrected focused suite passed 5/5 locally and the full suite 1,603/1,603. The reviewed candidate subsequently passed the provider matrix above.

## Phase 2 and Phase 3 read-only preparation

The master Work Order, Context Lock and gate matrix retain current `main`, `release/1.1` and merge-base SHAs; 14 textual conflicts (12 content, 2 add/add); two semantic overlaps at `.engineering/CHECKPOINT.md` and `ADR-0001-COMPLETE-PRODUCTION-TARGET.md`; branch-qualified D-0062 meanings; and D-0063 effective at the real PR #347 merge. PR #336 is merged at `d892d2cb03719dd661bcab86bec995aecc8f4894`. PR #278 is closed, not merged; its checks and historical Codecov result do not transfer. Phase 3 remains read-only: root and CLI metadata are `private=true` / `UNLICENSED`, owner choices remain UNKNOWN, and WO-010 is absent/not admitted. No conflict resolution, checkpoint repair, Phase 2/3 implementation, main promotion, tag or publication occurred.

## Audit gate

After the documentation-only correction is pushed and every required workflow on that new exact PR HEAD succeeds, record its SHA and check URLs in the PR description and stop at `GBS_V11_MAINT_PACK_BRANCH_CORRECTION_012_EVIDENCE_LOCK_SYNC_READY_FOR_REAUDIT`. Owner review remains `NOT_INDEPENDENT` under D-0062. Do not merge, admit Gate 2/WO-010 or publish.
