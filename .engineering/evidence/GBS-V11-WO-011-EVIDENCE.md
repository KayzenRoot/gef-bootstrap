# GBS-V11-WO-011 Evidence

**State:** implementation committed locally; PR and provider gates pending. **Base:** `a88a61b7fcae632cdf5b282dc4461592b92cad57`. **Implementation commit:** `52af4d4925ca2c19827177d0228fab9a97d6d66d`. **Branch:** `hotfix/v1.1.1-adopt-baseline-rollout`. **Context Lock SHA-256:** `5ABFFB90ECFE32A23B45F361371603FA6F2A4477883030512856F80B65B10C0B`.

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

## Registry, PR and remaining gates

- Public npm registry preflight returned `E404` for `@gef-bootstrap/cli@1.1.1`; the version is unpublished. No trusted-publisher configuration was claimed or changed, and no long-lived npm token was used.
- No PR has been opened yet. Exact PR-head checks, Ubuntu/Windows/macOS same-tarball CI, security checks, owner audit, trusted-publisher verification, merge, immutable tag/release, OIDC publication, registry consumer smoke, and all consumer rollouts remain pending.
- Consumer rollout remains blocked until the package is actually published and the registry consumer smoke passes. Goodz Menu is first in the authorized consumer order after that gate.
