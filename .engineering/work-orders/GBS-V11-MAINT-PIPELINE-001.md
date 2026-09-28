# GBS-V11-MAINT-PIPELINE-001 — V1.1 Pipeline Adoption and Maintenance Forward Port

Status: `ADMITTED_BY_MASTER_EXECUTION_ORDER`
Release line: `1.1.x`
Implementation branch: `feat/1.1/maint-pipeline-001`
Assurance: `ELEVATED`

## Objective

Forward-port the validated maintenance pipeline from `main` to the V1.1 release line without importing unrelated V1.0 product history or removing V1.1 Work Order assurance. The result must retain a free-capable critical pipeline, immutable Action references, least-privilege tokens, exact-head security checks and the frozen V1.1 validation matrix.

This is an infrastructure and documentation increment. It does not change product behavior or accept the V1.1 product release.

## Exact source state

- Base: `release/1.1` at `e69d887a0f12b46218f40e849fdcf180e455eb3d`.
- Main reviewed for selective port: `73ab68f3f33f894027fb7a04c2696b02b839060a`.
- Shared ancestor: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`.
- Main maintenance sequence: PR #303 (`8299045f63a6324320caf712afc12eeac8ea17b8`), #305 (`3c4455a080055fb65fee7d7021b72c3d40c5ae52`), #306 (`dfe14590521aead09ab0d8360fefbaea3e230aff`), #307 (`9c9170f98ee6385e11b2dbf8e1f7584222230cd8`), and #308 (`73ab68f3f33f894027fb7a04c2696b02b839060a`).
- Product progression remains under `GBS-V11-WO-009`; this maintenance Work Order is a bounded prerequisite for refreshing WO-009 after `release/1.1` advances.

## Scope

1. Add the validated Pipeline Integrity workflow for `main` and `release/1.1` pull requests, pushes and manual dispatch. It must reject mutable external Action refs, `pull_request_target`, and `write-all` permissions.
2. Pin existing workflow Actions to verified full commit SHAs while preserving all existing V1.1 workflow files, Work Order cases, commands, triggers and semantics.
3. Add the free security pilot for Trivy filesystem/configuration checks and Gitleaks secret scanning. Harden Runner remains `audit`, `continue-on-error`, and non-blocking.
4. Add Dependency Review for dependency deltas on pull requests, failing only on introduced HIGH/CRITICAL vulnerabilities; do not make license policy or the scan a global branch rule.
5. Add scheduled/manual OpenSSF Scorecard with SARIF in repository code scanning and public Scorecard publication disabled. A release-branch run may be dispatched explicitly; the weekly schedule follows the default branch.
6. Apply the tested Repository Validation deduplication only if the existing V1.1 `validate` script proves it includes the required typecheck/build/test behavior.
7. Add operational evidence and update the V1.1 pipeline handoff. Record measured job durations and queue time only when available; make no unsupported savings claim.
8. Keep SonarCloud, Socket, Codecov, CodeRabbit and Greptile outside required branch contexts unless permanent free continuity and consistent execution are proven. Preserve app checks as optional where already configured.

## Explicit exclusions

- No change to product packages, tests, requirements, semantics, dependency versions or `package.json` scripts.
- No changes to `main`, repository rulesets, `v1.0.0`, production acceptance, release artifacts, tags or publication.
- No direct update of `release/1.1`; integrate through a reviewed PR and exact-head owner audit.
- Do not delete `.github/workflows/wo-003-windows-rights.yml` through `wo-008-performance-telemetry.yml` or otherwise consolidate frozen V1.1 assurance workflows.
- Do not forward-port main's broad workflow deletions, main-only checkpoint history, unrelated documentation, or path filters that weaken V1.1 checks.
- Do not add/require another paid or trial-backed service. Do not enable Codex automatic reviews.
- Do not make conditional security, coverage, quality, or third-party app checks global required checks.
- Do not add Codecov coverage until the V1.1 LCOV population is proven to represent source code rather than generated output or tests.
- Do not introduce a reusable workflow refactor without a separately measured and safe benefit.

## Requirements and acceptance

### R1 — Source selection

Record the main-to-release comparison and classify imported changes as pipeline/security maintenance. Preserve V1.1-specific workflows and the current V1.1 checkpoint overlay. Every modified workflow must remain applicable to its original Work Order and platform matrix.

### R2 — Workflow integrity

At the exact PR head, prove YAML parses and Pipeline Integrity passes across all workflow/action YAML files. Every external Action is pinned to a 40-character SHA; permissions are least privilege; no `pull_request_target` or `write-all` is introduced.

### R3 — Security checks

At the exact PR head, Trivy, Gitleaks, Dependency Review, CodeQL, Repository Validation, and Pipeline Integrity must succeed where their configured events apply. This infrastructure-only PR must introduce zero new CRITICAL/HIGH product findings. The already reported `js/clear-text-logging` HIGH on the V1.1 base remains an explicit inherited WO-009 blocker during this ordered pipeline-adoption step; do not suppress or waive it, claim security-clean V1.1, or promote production. WO-009 owns its fix and exact-head closure before its audit/merge. Any new or unrelated CRITICAL/HIGH finding blocks this Work Order. Harden Runner executes only in audit mode and cannot fail the pipeline. Scorecard must run manually or on the schedule on a supported branch; record its SARIF and findings without publishing to the public Scorecard API.

### R4 — Free-tier resilience

No external service whose ongoing free tier is unproven may be a merge or release dependency. Existing global ruleset requirements stay unchanged. Optional service checks must not be promoted to required contexts.

### R5 — V1.1 preservation

No product source changes. Existing frozen test-matrix workflows and WO-003 through WO-008 assurance remain present. `main`, historical V1 acceptance (1088/1088), and tag `v1.0.0` remain unchanged.

### R6 — Review and merge

Publish an Evidence Bundle tied to the exact candidate SHA, verify all applicable checks and review threads, conduct the `KayzenRoot` owner-operated exact-head audit under ADR-0006 (not an independent review), and merge by squash into `release/1.1` only after `OWNER_APPROVED`.

### R7 — Post-merge

Re-read `release/1.1`, verify the merge SHA and post-merge applicable checks, update only the V1.1 overlay to record this maintenance completion while retaining WO-009 as the active product Work Order, and record the next legal action as WO-009 Context Lock refresh against the new base.

## External service disposition

This Work Order does not install apps or change account billing. Trivy, Gitleaks, Dependency Review, CodeQL and Scorecard are configured as repository workflows with no paid subscription. Harden Runner is telemetry-only and best-effort. SonarCloud, Socket and Codecov are advisory integrations; CodeRabbit and Greptile are not workflow requirements. Their current account-tier evidence is recorded separately and must be rechecked before any future gate promotion.

## Stop condition

`GBS_V11_PIPELINE_ADOPTED_EXACT_HEAD_AND_POST_MERGE_VERIFIED`

An absent/failed exact-head check, changed base, missing source fingerprint, new/unrelated critical/high finding, lost V1.1 workflow or unexpectedly blocking paid service stops this Work Order at that boundary. Preserve the inherited WO-009 finding as unresolved and release-blocking until its exact-head fix is merged; do not claim it is waived or fixed here.
