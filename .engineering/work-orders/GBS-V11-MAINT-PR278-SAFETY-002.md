# GBS-V11-MAINT-PR278-SAFETY-002 — Correct provider-reported release safety and reliability findings

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Base: `release/1.1` at `e17946461da079218106be0771fdf87b7cd4ed86`; branch `gbs/v11/maint-pr278-safety-002`. Assurance ELEVATED; owner KayzenRoot.

## Proven input and correction scope
The read-only Sonar diagnostic from [PR #320](https://github.com/KayzenRoot/gef-bootstrap/pull/320), head `0ee9edf2cea58c85f89dedb5149b293fb4ebe98e`, run `36571812769`, job `109417416793`, exposed 50 metadata-only annotations on PR #278's same release SHA. PR #278's cumulative Quality Gate reported Security C, Reliability D and duplication displayed 3.0%; the PR is also merge-conflicted with `main`.

This bounded pass corrects the following static analysis findings without redefining accepted semantics:
1. `wo-004-upgrade-recovery.yml:64`: locked install uses `npm ci --ignore-scripts` so transitive package lifecycle scripts cannot execute on the assurance runner. Existing V1.1 full release assurance already uses this option and validates all three platforms.
2. `execution-capsule.ts:267`: replace the second regex's potentially super-linear suffix matching with constant-time prefix/suffix trim after the first pattern has collapsed each invalid run into one separator. Preserve exact slug and digest identity for every admitted ASCII identifier.
3. `v11-performance-telemetry.mjs:24`: use an explicit `localeCompare('en')` comparator for both expected and observed schema key sets. Also normalize the numeric METRIC_ID character class.
4. `transaction.ts:345`: remove the no-op `void _context`; keep the named ignored parameter in the public physical port signature. Remove only provider-identified unused imports in transaction/registry and consolidate duplicate imports in main/private-authority, without changing delegated authority or observable behavior.
5. `write-v11-assurance-receipt.mjs:16`: replace its single-character regex alternatives with equivalent character classes for all four summary patterns.

## Gates and exclusions
All changed source files retain behavior, deterministic cross-platform semantics, security gates and original test matrix; compare actual Sonar cumulative PR #278 before claiming C/D resolution. Mandatory exact-head focused CLI/CTX-DET/telemetry/transaction suites, full repository validation, cross-platform release assurance, migration/recovery, CodeQL tracked alert, Gitleaks, Trivy, pipeline integrity, dependency review and Sonar candidate check. Review initial/final file patch and record exact check identities. No new dependency, policy exception, security suppression, protected branch mutation, source-pack history rewrite, production acceptance, tag, publication or reactivation of retired integrations. The complex proof/capsule refactors and cross-branch semantic merge remain separate bounded increments. Work Order completion is not overall Sonar/PR278 completion.

STOP CONDITION: `GBS_V11_PR278_SAFETY_002_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
