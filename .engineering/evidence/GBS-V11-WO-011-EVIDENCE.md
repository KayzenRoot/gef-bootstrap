# GBS-V11-WO-011 Evidence

**State:** owner-authorized governance canonicalization for PR #358; exact-head checks pending on the new governance commit. **Base:** `a88a61b7fcae632cdf5b282dc4461592b92cad57`. **Implementation commit preserved:** `52af4d4925ca2c19827177d0228fab9a97d6d66d`. **Previous PR head:** `a09d95b23cf270edf8701988f2ad524963549f73`; all results on that head are historical after the governance commit. **PR:** [#358](https://github.com/KayzenRoot/gef-bootstrap/pull/358), open draft, base `main`. **Owner resolution:** [Issue #357 comment #5935855771](https://github.com/KayzenRoot/gef-bootstrap/issues/357#issuecomment-5935855771), author `KayzenRoot`. **Context Lock SHA-256:** `E100E0B312A37ACEA67F6B1AF761A96D3DE778A6AC8B2C2789354E9771E381B7`.

## Governance canonicalization

- D-0064 / ADR-0009 is allocated as “Post-production patch hotfix routing.” After a minor release reaches `PRODUCTION_ACCEPTED`, same-minor hotfixes use current production `main`; merge requires an exact-head owner audit, all required checks successful, zero CRITICAL/HIGH findings, and a mergeable branch.
- ADR-0006's `release/1.1` restriction remains historical for pre-production V1.1 and is superseded only for post-production patches after `v1.1.0` acceptance. D-0062@main / ADR-0007, D-0062@release/1.1 / ADR-0006, and D-0063 / ADR-0008 remain distinct and unchanged.
- `release/1.1` remains historical/pre-production; it will not be force-synchronized, rebased, or used as the patch base while behind accepted production.
- This delta changes governance records only. The implementation in PR #358 is preserved. No merge, tag, npm publication, or consumer rollout has occurred or is authorized by this canonicalization.

## Goodz Menu priority gate

- GitHub identity observed with `gh auth status`: `KayzenRoot`; repository permission: `ADMIN`.
- `KayzenRoot/goodz-menu` is public, size `0`, and has no branch refs; `git ls-remote` returned no `main` ref.
- `D:\Projects\goodz-menu` exists but is empty and is not a Git checkout.
- No consumer files or remote refs were changed. The owner-authorized empty `main` baseline commit and `gef init` remain gated on publication of `@gef-bootstrap/cli@1.1.1` and a passing registry consumer smoke.

## Validation-discovered H10 journal defect

- Before correction, the full `npm run validate` had one failure out of 1,618 tests: H10 journal replacement intermittently returned success after the journal path was replaced. An isolated reproduction observed the Windows filesystem reuse `dev:ino` and creation time for the replacement.
- The bounded correction validates the current journal bytes against the last successful journal fingerprint before truncating the open descriptor. The replacement content is preserved and ownership refusal is returned.
- After correction: `npm run build` PASS; three focused journal lifecycle tests PASS; the replacement regression PASS in 25/25 isolated runs; full `npm run validate` PASS (1,618/1,618, zero failures); both changed release workflows parse as YAML; `npm audit --audit-level=high` PASS with zero reported vulnerabilities.

## Exact local package and disposable Core proof

- Candidate package: `@gef-bootstrap/cli@1.1.1`, built from implementation commit `52af4d4925ca2c19827177d0228fab9a97d6d66d` and installed from a local tarball into an isolated temporary consumer. Tarball: `D:\Projects\gef-v1.1.1-wo-011-evidence-20261001-1530\package-exact-52af4d4\gef-bootstrap-cli-1.1.1.tgz`; SHA-256 `CF1F795EF20414E255B88612666C8F87FCFFE68568F765468E49F34655332E91`. CLI version, help, `doctor`, and `status` passed in the isolated consumer.
- Fresh disposable Core clone: `D:\Projects\gef-v1.1.1-core-proof-20261001-52af4d4`, exact Core `main` SHA `f27e3a3f1be64d2dfedc762dea30dd1dce7cab17`. Only this disposable clone was modified; the dirty original `D:\Projects\core` and the previously captured failing clone were not touched.
- The exact candidate tarball's `gef adopt --apply` returned `APPLIED`. Its `.gef/adopt-state.json` records product version `1.1.1` and `PROJECT_DRIFT_V1`.
- Post-apply `doctor` returned exit 0, `ok: true`, and no remediation. It reports the Core repository's existing `GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:core-gef-checkpoint-bridge-v1` observation limit; this pre-existing derived-bridge incompatibility was preserved and not hidden by editing Core canonical governance.
- Two consecutive `status` outputs were byte-identical (SHA-256 `41D6F7EB64A9DBEBBBDB3545D62C28D733C2419F617BDF46D82A692457640317`); both reported repository `CLEAN`, operator `CLEAN`, and `drift.changed=false`.
- A synthetic file under `.gef-private` alone left drift false and repository clean. A synthetic project-root file produced `drift.changed=true`, class `UNEXPECTED`; after removing only that test file, status returned to `drift.changed=false` and repository `CLEAN`.
- All 65 files listed in `core-engineering-before.json` retained their SHA-256 values after adoption and the drift checks. Final disposable clone status contains only the expected `.gef/` and `.gef-private/` metadata.
- Raw proof JSON is preserved under `D:\Projects\gef-v1.1.1-wo-011-evidence-20261001-1530\core-proof\`; key hashes are recorded in `GBS-V11-WO-011-RELEASE-MANIFEST.json`.

## Registry, publication and release-gate closeout

- Original release source: `1dc030f1358eab0347043a3d54c7fc311c7c2123`; immutable tag `v1.1.1`; GitHub Release published at `2026-10-01T18:23:22Z`.
- Original release workflow run [36904947907](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36904947907): exact package creation and same-artifact smoke on Ubuntu/Windows/macOS succeeded; npm OIDC publication of `@gef-bootstrap/cli@1.1.1` succeeded. The only original red job was post-publish retrieval because `gh run download` lacked an explicit repository outside a checkout.
- Immutable release tarball SHA-256: `59cfbe2699c884f9c57bb50594fe3972c5f8667c44bff4f35a5e9a65e4ce53c3`; registry SRI: `sha512-YuLrx35lCo4aSBV6DI/EmaKPhkZJxjyUyDTQEhjvM8SdktV5x2rWJjeIY0T69A/PlILqOsL5E2zrz3BLRMPGVg==`.
- Correction PR [#359](https://github.com/KayzenRoot/gef-bootstrap/pull/359) fixed the repository-bound artifact download and added bounded read-only recovery. Exact audited head `c68114f0f8692551fc871bddd1e2fc6964374017`; audit `APPROVED / NOT_INDEPENDENT`; CRITICAL `0`, HIGH `0`; merge `5a32a607ccf2055fab722f3d5d452791c6aae3e6`.
- Registry recovery run [36912440350](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36912440350) succeeded. It verified the original receipt/source/version/tag, tarball SHA-256, npm package identity, exact SHA-512 SRI equality, npm registry ECDSA signature against active registry signing keys, non-empty provenance/attestation metadata, registry installation with lifecycle scripts disabled, CLI help/version, library import, doctor and deterministic repeated status.
- Exact-head release assurance run [36912440441](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36912440441) succeeded on Ubuntu, Windows and macOS; same exact tarball smoke succeeded on all three platforms. Repository validation, Pipeline integrity, Gitleaks, Trivy, CodeQL, Dependency Review, coverage, Sonar and m01 validation were green on the audited correction head.
- The temporary PR-only CodeQL HIGH `js/incomplete-url-substring-sanitization` in the regression test was corrected before merge; final known correction findings are CRITICAL `0` / HIGH `0`.
- Gate state: `GBS_V11_WO_011_REGISTRY_SMOKE_VERIFIED`.
- Consumer rollout is now authorized but not yet claimed. `KayzenRoot/goodz-menu` remains the first consumer and had no files/refs mutated by this gate closeout.

## Current next action

`ROLLOUT_GEF_V1_1_1_TO_GOODZ_MENU_FIRST`.

The consumer step must independently verify the exact Goodz Menu baseline, install/init behavior, `gef doctor`, `gef status`, generated governance state and repository checks.
