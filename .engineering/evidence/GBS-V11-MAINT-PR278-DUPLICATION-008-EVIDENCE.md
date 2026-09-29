# GBS-V11-MAINT-PR278-DUPLICATION-008 — Candidate Evidence Bundle

Admission base: `e006fc53efa5bbd7d01cb485b3407353b27b9173` (release/1.1), parent Work Order `GBS-V11-MAINT-POST-WO009-001`. The production `main` ref and v1.0.0 tag must remain unchanged. Owner: KayzenRoot. Assurance: ELEVATED. Audit independence: NOT_INDEPENDENT.

## Verified diagnostics
- PR #327 merged after exact-head 30/30 SUCCESS; cumulative public Sonar duplicate-block job `109472537023` identified registry.ts engine failure projection pair (17 lines) and the cross-file directory-alias helper duplicated in security regression tests (19 lines).
- Original cumulative PR #278 Sonar at the pre-#327 head failed on new-code duplication 3.1% versus the <=3.0% gate; Codecov patch failed at 85.81% against 97.85%. Both require new exact-head evidence after this increment.

## Candidate changes and invariants
- One shared internal engine error factory, preserving two exact existing summary strings and all `GefError` fields.
- Two local copies of the exact same test-only cross-platform alias helper consolidated into `tests/helpers/directory-alias.mjs`, preserving directory symlink/junction behavior.
- No runtime dependency, threshold, suppression, main/tag mutation, retired Hive integration or production release action.

## Verification / pending
Candidate CI checks and Sonar analysis are PENDING until GitHub reports the exact implementation SHA; no tests or cumulative Sonar/Codecov success is claimed in advance. Require full cross-platform, security and owner exact-head audit before merge. Proposed Checkpoint Delta: diagnostic PR #327 accepted and source duplicate-refactor PR under review; parent release blockers remain until the actual gates pass.
