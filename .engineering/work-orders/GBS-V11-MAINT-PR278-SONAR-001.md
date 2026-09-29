# GBS-V11-MAINT-PR278-SONAR-001 — Bound cumulative Sonar diagnostic

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Target: release/1.1. Base SHA: `bdd827ff6bba22eef3d66f276a618c80e19fc587`. Owner: KayzenRoot. Branch: `gbs/v11/maint-pr278-sonar-diagnostics-001`. Assurance: ELEVATED.

## Objective
Make PR #278's existing cumulative Sonar check rule/path/line annotations available as provider-bound, read-only GitHub Actions logs, without using a browser credential, lowering thresholds, modifying or reclassifying security issues, or claiming that a green incremental PR #316 gate passes the broader release-to-main gate. GitHub check run `109414953860` at base SHA reports 50 inline annotations and failed Quality Gate on Security C, Reliability D and new-code duplication displayed 3.0%; PR #278 remains merge-conflicted.

## Authorized change
Add exactly one `cumulative-sonar-evidence` job to the existing V1.1 release assurance workflow. It runs with only read permissions and no checkout, looks up PR #278's actual head and current release ref, then finds the current Sonar check for that exact head and lists annotation `path`, `start_line`, `end_line`, `annotation_level` and `title`. Never log annotation messages, source snippets, environment contents or a token. A stale/missing check prints `NOT_VERIFIED`, not success/closure. Preserve all existing assurance jobs and immutable action pins.

Add this Work Order, precise Context Lock and an admission Evidence Bundle. This diagnostic job is a provider-evidence aid only. Fixes to identified source defects, the source-level reconciliation with the production branch, and WO-010 production acceptance must follow separate exact-head evidence and gates. Do not mutate `main` or historic V1.0 tags or restore retired third-party integration.

## Gates
All triggered required CI/security/focused platform suites pass on the final candidate SHA. Check no workflow name clashes, changed permission only scoped to the new job, no source or threshold changes. KayzenRoot owner-only exact-head audit (not independent) precedes merge. STOP CONDITION: `GBS_V11_PR278_SONAR_DIAGNOSTICS_INTEGRATED_PROVIDER_RESULTS_RECORDED`.
