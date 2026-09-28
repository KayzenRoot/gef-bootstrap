# Node 22 coverage / Codecov OIDC pilot

This is an **advisory provider integration**, not a mandatory release gate.

## What executes
`Codecov Coverage Pilot / Node coverage LCOV` runs after relevant code/tests/manifests/workflow changes on PRs targeting `main`, pushes to `main`, and a manual dispatch. A native Node 22.17.0 LCOV reporter runs the same `tests/*.test.mjs` suite after a normal `npm ci` and `npm run build`. No additional npm library is installed.

The job requires `coverage/lcov.info` to contain source-file (`SF`) and line-hit (`DA`) entries, **without claiming source-mapped TypeScript coverage until inspected**. Generated coverage files are locally gitignored.

## Codecov authorization
The Codecov v7.1.1 GitHub Action is pinned to commit `303a32d7a59b442fa8d48b6a1cc6825c09c847a5`. The workflow supplies `use_oidc: true` and only this job has `id-token: write` alongside read-only contents. **No `CODECOV_TOKEN` or secret is committed or requested.** The upload step is advisory (`continue-on-error: true`) until the account's public project is confirmed to accept OIDC uploads and reports appear for the exact commit. The entire coverage job is skipped for fork PRs so untrusted build scripts cannot request an OIDC token.

The owner must import/select `KayzenRoot/gef-bootstrap` in the Codecov account and verify that their free public repository allowance and OIDC settings are active. A green workflow job guarantees that tests and LCOV generation passed, **not** that Codecov accepted a report. To verify upload, inspect action step logs, Codecov project UI and any matching check against candidate commit SHA.

## Security / cost
All new Actions are commit-SHA pinned: checkout v6.0.2, setup-node v7.0.0 and Codecov v7.1.1. This is not added to the branch protection ruleset while subject to path filtering and unverified Codecov baseline. Existing security jobs remain independent. No Codex auto-review or manual `@codex review` may be triggered by this work.

## Decision after pilot
If provider upload is verified: inspect LCOV file paths and legitimate baseline coverage; only then design a future bounded Work Order for coverage thresholds and quality gates. If it fails: keep the verified native LCOV path, record the exact provider error, and request only the minimum Codecov dashboard action needed, without weakening tests or requiring an uncreated external check.

## CR-01: fork isolation and supported Action runtime

The coverage job has `id-token: write` only for Codecov OIDC. It now skips **entirely** for forked PRs so untrusted fork build scripts cannot request an OIDC token during `npm ci` or `npm run build`. Fork PRs continue through the independently existing security/validation workflows. Same-repository PRs and main pushes produce coverage and attempt the Codecov upload. `actions/setup-node` has been SHA-pinned to v7.0.0 to avoid the deprecated Node 20 Action runtime; project tests remain on Node 22.17.0. This policy is a scoped hardening correction and requires a fresh exact-head CI run. A skipped job for a fork is not proof that Codecov verified that fork's coverage.
