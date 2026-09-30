# GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012 — Evidence Bundle

Status: `LOCAL_VALIDATION_PASS_AWAITING_EXACT_HEAD_CHECKS_AND_OWNER_AUDIT`
Issue #337 admission: tests-only after actual PR #347 merge
Master: `GBS-V11-RELEASE-ONEPASS-013` / Issue [#348](https://github.com/KayzenRoot/gef-bootstrap/issues/348)
Target: `release/1.1`
Candidate branch: `codex/gbs-v11-maint-pack-branch-correction-012`
PR: [#349](https://github.com/KayzenRoot/gef-bootstrap/pull/349), open draft. The final candidate SHA and exact-head provider check URLs will be recorded in the PR description after the corrective evidence commit.

## Exact-state lock

Execution base: `release/1.1@9f6f069c977868ade34a19cddb346f7bea9a95fe`; tree `acdf5f57c592dcb9ca041b179d7fa86ed4503d2a`. `main@f6738292c038eb6f0d08d1d32b3752c5c7dc417a`; merge base `e23311e77d79b84f3c70671072a22a6f8896d13d`; divergence 2 main-only / 79 release-only. A fresh fetch before validation confirmed the source refs had not moved.

Critical blobs rechecked against Issue #337 admission:

- `packages/cli/scripts/prepare-package.mjs`: `10e659ccce15045ed37ffa3e82d06a8408b8f734`.
- Existing `tests/v11-codecov-patch-coverage.test.mjs`: `2441961628d20dcc9404d2e51cc1d97b03543137` before the admitted test additions.
- `.engineering/SOURCE-HIERARCHY.md`: `bedc10c97d28154efe59ff43fc1d175add37f568`.

The production script remained byte-identical to its admitted Git blob and its package tree snapshot was unchanged by the tests. The test fixture verifies the source Git blob after normalizing checkout CRLF to Git LF. Each disposable copy redirects only the two `import.meta.url` root expressions and adds a test-local `process` binding on the existing `node:os` import line; the original line count and production source are preserved. The proxy state is confined to the test module, and the child process uses its own temporary global binding; neither changes the host process environment, package manifest, lockfile, workflow or dependency.

## Changed files

The intended PR diff is restricted to the admitted test files and versioned Work Order / Context Lock / Evidence Bundle / gate-matrix documents:

- `.engineering/work-orders/GBS-V11-RELEASE-ONEPASS-013.md`
- `.engineering/work-orders/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.md`
- `.engineering/context-locks/GBS-V11-RELEASE-ONEPASS-013.json`
- `.engineering/context-locks/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012.json`
- `.engineering/evidence/GBS-V11-RELEASE-ONEPASS-013-GATE-MATRIX.json`
- `.engineering/evidence/GBS-V11-MAINT-PACK-BRANCH-CORRECTION-012-EVIDENCE.md`
- `tests/v11-codecov-patch-coverage.test.mjs`
- `tests/v11-pack-branch-negative.test.mjs`

The four master planning references were rephrased to comply with the existing V1.1 tree-detachment test. D-0062 and ADR decision identity, all SHAs, fingerprints, lineage and meanings remain unchanged; the full main-branch ADR ID and path are JSON Unicode-escaped and decode to the original values.

## Test behavior added

The existing coverage test drives exported `stage()` and `pack(destination)` against a source-hash-verified copy under a disposable package fixture. It asserts the real failure category and cleanup for missing package payload, engine source, engine support file, CLI schema, host-native package root/host package, `koffi`, built runtime `dist`, repository license, unresolved npm CLI, nonzero fake npm pack and successful npm-without-tarball. It retains successful staging and real tarball packing assertions, and compares the production CLI tree before and after. The second test file exercises the missing `--destination` path through a real child process and verifies exit status, exact error and empty stdout.

## Validation record

| Proof | Result | Evidence |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | PASS | Locked dependencies installed without lifecycle scripts. |
| `npm run build` | PASS | Node `22.17.0`, npm `10.8.2`; TypeScript build completed with exit 0. |
| `npm run validate` | PASS | Node `22.17.0`, npm `10.8.2`; after the macOS fixture-path correction, 1,603 tests passed, 0 failed, 0 skipped. |
| Focused new-test native LCOV run | PASS | 5/5 tests; one `SF:packages\\cli\\scripts\\prepare-package.mjs` record; 236/238 DA and 49/52 BRDA outcomes hit. Zero BRDA outcomes in that focused record are at lines 70, 201 and 236. |
| Full `tests/*.test.mjs` native LCOV run | PASS | 1,603/1,603 tests; nonempty LCOV; one exact production-script `SF`; 236/238 DA (99.16%), 70/87 BRDA outcomes (80.46%), 100% functions. DA misses are lines 237–238; BRDA zero counters appear at labels 232, 73, 83, 97, 117, 139, 140, 144, 159, 173, 200, 203, 219, 222, 236, 70 and 201. |
| Exact historical target DA rebind | PASS | All 14 Issue #334 target lines have positive DA in the full report; the hit counts are listed below. |
| `git diff --check`, JSON parse, legacy-term scan | PASS | Re-run after the final evidence edit and again before commit. |
| Windows local platform run | PASS | Local Windows Node 22 validation and coverage only; it does not replace provider checks. |
| Ubuntu / macOS exact-head assurance | PENDING | Required `V1.1 release assurance` matrix on the final corrective PR SHA. |
| Pinned Gitleaks complete new-commit interval | PENDING | Re-run on the complete base-to-candidate commit history for the final corrective SHA. |
| Trivy / CodeQL / Sonar / dependency audit / required provider checks | PENDING | Record only checks tied to the final corrective PR SHA; no historical PR #278 result transfers. |
| CRITICAL/HIGH findings | UNKNOWN_PENDING_PROVIDER | No severity clearance is claimed before exact-head security results. |

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

The full LCOV section contains separate BRDA block IDs for production-script invocations and the isolated fixture-loaded source under the same `SF`; several target labels therefore have zero counters in one block set and positive counters in another. The isolated tests assert the branch behavior and error/cleanup outcomes. This report is not represented as a single-context 100% branch result, and no Codecov threshold is credited in Phase 1. Phase 2 must run a fresh cumulative release-to-main PR and verify the unchanged `>=97.85%` Codecov patch gate on that PR's exact SHA.

## Cross-platform failure diagnosis and in-scope correction

The first exact-head release assurance run on superseded candidate `a50a5daadcd183ae19ff90575df543bad3b64f67` passed on Ubuntu and Windows but failed on macOS in `package CLI rejects missing --destination through a real child process`: expected exit status 1, observed 0 ([macOS job](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36662040123/job/109718700782)). The fixture created its temporary root from the lexical `os.tmpdir()` value, while macOS resolves the child process working directory through the canonical filesystem path. The copied script's real-entrypoint comparison then missed, so the child exited successfully without exercising the intended argument error. The admitted test now canonicalizes `tmpdir()` with `realpathSync()` both when creating the fixture and when checking cleanup containment. This changes only `tests/v11-pack-branch-negative.test.mjs`; the production source blob remains unchanged. The corrected focused test passed 5/5 under Node `22.17.0`, and the corrected full suite passed 1,603/1,603 locally. The final candidate still requires fresh Ubuntu/Windows/macOS and security/provider checks; the superseded SHA's green jobs are not carried forward.

## Phase 2 and Phase 3 read-only preparation

The master Work Order, Context Lock and gate matrix retain the revalidated `main`, `release/1.1` and merge-base SHAs; the 14 textual conflicts (12 content, 2 add/add); the two semantic checkpoint overlaps; both branch-qualified D-0062 meanings; D-0063 effective at the real #347 merge; the merged #336 planning lineage; and PR #278's closed, unmerged status. The Phase 3 inventory retains current `private=true` / `UNLICENSED` package facts, owner-decision UNKNOWNs, and the absence of WO-010 admission. Preparation is read-only: no conflict resolution, checkpoint repair, Phase 2/3 implementation, main promotion, tag or publication occurred.

## Audit gate

After pushing the final test/evidence tree and recording exact-head provider results in the PR description, stop at `GBS_V11_MAINT_PACK_BRANCH_CORRECTION_012_SOURCE_BOUND_TESTS_ONLY_ADMITTED_EXACT_HEAD_READY_FOR_OWNER_AUDIT`. Owner review remains `NOT_INDEPENDENT` under D-0062. Do not merge or publish.
