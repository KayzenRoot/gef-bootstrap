# GBS-V11-MAINT-PR278-COMPLEXITY-005 — Release-to-main cumulative complexity remediation

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Exact release base: `3abf60731adaabd61bda97a62e48c005baf8b170`. Branch: `gbs/v11/maint-pr278-complexity-005`. Owner: KayzenRoot. Assurance: ELEVATED.

## Provider evidence and scope

Cumulative PR #278 at the admission base is DRAFT/dirty and FAIL on Sonar (Security B, Reliability D, new-code duplication displayed 3.0%). The metadata-only cumulative Sonar diagnostics job `109433079205` identified three independent complexity findings that remain in untouched functions: package staging (`packages/cli/scripts/prepare-package.mjs`, complexity 23), read-only case-semantics measurement (`packages/cli/src/private-authority.ts`, complexity 20), and telemetry metric normalization (`packages/m62-m63-final/src/v11-performance-telemetry.mjs`, complexity 24). This is a scoped reduction of recorded findings, not a declaration that PR #278's Quality Gate will pass.

## Authorized implementation

1. Extract stage payload, engine/supporting files, schema hash, native runtime, built workspace modules, and license-copy phases into local deterministic helpers. Preserve the exact order of manifest artifacts, error paths, digests and staged tarball contents, with no ambient execution or new dependency.
2. Extract the read-only case-flipped identity comparison from the bounded ancestor walk. Preserve all tri-state case results, parent traversal, hard depth limit, exception handling and no filesystem creation.
3. Extract unavailable/enum/repeated-samples/numeric metric validation into local helpers. Preserve the exact precedence and reason codes for rejected inputs, deep-frozen record projection, sample summaries and pure behavior.
4. Add one Work Order, exact-base Context Lock and evidence admission. No change to Sonar settings, quality thresholds, production source, historical tags, authorized integration slots or dependency lockfiles.

## Evidence gates and STOP CONDITION

Run focused package/distribution install, private authority/case semantics and telemetry tests, complete repository validation and three-platform V1.1 assurance plus upgrade/recovery, security/CodeQL, dependency and pipeline checks. All exact-head required checks must succeed before owner-operated, non-independent audit and merge into `release/1.1`. Separately verify actual cumulative PR #278 Sonar and mergeability afterward. Existing cumulative Security B, Reliability D, duplication, and branch divergence remain blockers until the provider and Git prove closure. No WO-010 admission, main edit or V1.1 publication.

STOP CONDITION: `GBS_V11_PR278_COMPLEXITY_005_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
