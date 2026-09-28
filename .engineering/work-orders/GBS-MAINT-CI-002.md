# GBS-MAINT-CI-002 — Free Codecov Coverage Pilot

Status: ADMITTED_FOR_PILOT (not production-approved).
Risk: ELEVATED: third-party coverage upload and job-scoped OIDC; no product/runtime code changes.
Issue: #304.
Base exact SHA: `8299045f63a6324320caf712afc12eeac8ea17b8` (`main` after GBS-MAINT-SEC-001).
Branch: `gbs/maint/ci-002-codecov-oidc`; pull request targets `main`.
Scope: separate coverage-only workflow, bounded Work Order, Context Lock, operator guide and local coverage output ignore rule.

## Objective
Produce an actual, non-empty LCOV file using **Node 22's built-in test coverage reporter**, running the existing full test suite and unchanged build. Attempt a zero-secret **GitHub OIDC** upload to the owner's pre-created Codecov public-project account using a SHA-pinned official Action. Capture actual upload behavior before imposing coverage thresholds or any Codecov status requirement.

## Authority / constraints
Load `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, frozen Security, Scope, DoD, Test Plan and V1 maintenance boundary. Preserve historical production V1 1088/1088, V1.1 independent scope and the prior accepted security baseline.
- No npm dependency additions, token, PAT, `.env`, production code changes, existing workflow edits, branch ruleset edit, or auto-merge.
- This PR must not request/re-enable Codex reviews; owner disabled auto-review after consuming the code-review quota.
- Existing CodeQL, Trivy, Gitleaks and Repository Validation remain mandatory/independent. The new Codecov upload is explicitly **advisory** until the external Codecov project and actual upload have been observed.
- Codecov job needs `id-token: write` for OIDC only. Disable checkout credential persistence; pin every new Action by verified immutable GitHub commit SHA. No upload for fork PRs in this first pilot.
- Run coverage only for code/test/manifests/workflow changes (and manual dispatch), not every docs-only PR, to reduce CI overhead; do not make a path-filtered coverage check required by branch rules.
- If Codecov authentication fails, do not invent an integration PASS. The local LCOV and test job remain useful, while upload failure is a separately recorded integration gap.

## Tests / proof
1. Static verify workflow event filters, read-only checkout, minimal scoped `id-token: write`, pinned Actions, unchanged test/build commands, no secrets and fail-open advisory upload.
2. Exact-head GitHub Actions run of `Node coverage LCOV`: `npm ci`, `npm run build`, entire existing `tests/*.test.mjs`, non-empty `coverage/lcov.info` with `SF` and `DA` records.
3. Inspect resulting report paths. If they point only at compiled `packages/*/dist` JavaScript, call that out explicitly rather than representing it as TypeScript source coverage until source-map remapping is proven.
4. Inspect real Codecov upload outcome in job logs and external project/check. Mark `VERIFIED` only if the provider accepted the upload for exact commit. No coverage threshold from unvalidated baseline.
5. Existing applicable CI/security checks retain expected outcomes; external reviews are advisory unless independently supported; document any new findings and actual correction evidence.
6. After independent APPROVED and explicit integration, capture merge SHA, main push checks, Codecov source visibility and a scoped checkpoint delta without rewriting historical V1 receipts.

## Stop condition
Create reviewable PR and pass exact-head local LCOV-generation tests. If Codecov external linkage is unavailable, deliver a truthful `PROVIDER_SETUP_PENDING` without claiming the upload succeeded or adding a nonexistent required check. No autonomous merge.

## CORRECTION DELTA CR-01 — restrict OIDC execution and avoid deprecated runtime
External upload uses job-scoped `id-token: write`. Even when the upload step is skipped for fork PRs, code supplied by a fork could otherwise execute earlier `npm` scripts in the same job. Skip the **entire coverage job** for fork PRs while keeping existing independent repository validation/security workflows running for those contributions. Same-repository PRs, main pushes and manual dispatch still execute coverage. Update `actions/setup-node` to SHA-pinned v7.0.0 (Node 24 Action runtime) while retaining the tested Node 22.17.0 project runtime. Validate all corrected-head jobs before integration. No Codex reviews requested.
