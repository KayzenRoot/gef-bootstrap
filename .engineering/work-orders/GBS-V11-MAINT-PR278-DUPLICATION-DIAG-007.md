# GBS-V11-MAINT-PR278-DUPLICATION-DIAG-007 — Provider-bound duplicate-block inventory

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: `GBS-V11-MAINT-POST-WO009-001`. Target: `release/1.1`. Base SHA: `a02acbeafb46e1587caff715a3112f9e99692309`. Owner: `KayzenRoot`. Assurance: ELEVATED. Branch: `gbs/v11/maint-pr278-duplicate-inventory-007`.

## OBJECTIVE
Identify the exact files and duplicate line blocks behind cumulative PR #278's still-failing 3.1% new-code duplication (required <=3%) **without guessing the source or altering the Sonar gate**. Distinguish provider-unavailable data from proof. Record the independent Codecov patch blocker (85.81%, target 97.85%) for subsequent source/test correction.

## CONTEXT AND SOURCE CHECK
Read CHECKPOINT.md and CHECKPOINT.json first, then the Decisions Ledger, ADR-0005, ADR-0006, the parent maintenance Work Order, frozen Scope, Architecture, Security, Test Plan and DoD. PR #325 reconciled main ancestry while retaining neutral reserved M39/M40; PR #326 removed bounded Sonar safety issues and merged as `a02acbeafb46e1587caff715a3112f9e99692309`. The cumulative Sonar check at this exact head is FAILURE on duplication only, check ID 109466787630. The Codecov patch check is FAILURE, ID 109468307667. PR #278 stays draft; WO-010 is NOT admitted. Existing production main `e23311e77d79b84f3c70671072a22a6f8896d13d` and v1.0.0 are immutable.

## SCOPE
NECESSARY diagnosis only: append one read-only `cumulative-duplication-inventory` job to the existing V1.1 release assurance workflow. Bind release SHA, cumulative PR #278 SHA and the completed Sonar check at that exact SHA before consulting the Sonar public API. Request file-level `new_duplicated_lines` metadata, then up to 12 file duplication-group metadata responses (file identities, line starts, lengths and references only). If Browse/API access is unavailable or returns no validated detail, log `NOT_VERIFIED`, never invent location or imply quality-gate closure. Document precise context and admission evidence.

## OUT OF SCOPE
No runtime or test-source refactor; no Sonar configuration, thresholds, authentication secret, dependency/lockfile, main/tag, production promotion, publication, retired integration or Codecov threshold changes. Do not retrieve or print source snippets, API tokens, environment dumps or full responses. This diagnostic does not admit WO-010.

## FILES/SOURCES TO READ
`.engineering/CHECKPOINT.md`, `.engineering/CHECKPOINT.json`, `.engineering/DECISIONS-LEDGER.md`, `.engineering/decisions/ADR-0005-LEGACY-ECOSYSTEM-DETACHMENT.md`, `.engineering/decisions/ADR-0006-OWNER-OPERATED-REVIEW-AND-MERGE.md`, `.engineering/work-orders/GBS-V11-MAINT-POST-WO009-001.md`, frozen Scope/Architecture/Security/DoD/Test Plan and `.github/workflows/v11-release-assurance.yml`.

## REQUIREMENTS AND ARCHITECTURE RULES
Only metadata via public SonarCloud Browse and read-only GitHub token; no checkout or candidate code execution in the job. Original Sonar check is authoritative; successful diagnostic job proves only query completion. Fail closed on mismatched heads, pending/stale Sonar checks, missing or malformed API data. Owner review must be labeled NOT_INDEPENDENT under ADR-0006. Keep existing release assurance, Windows rights, upgrade/recovery and security gates untouched.

## CONSTRAINTS
Exact base `a02acbeafb46e1587caff715a3112f9e99692309`; allowed paths exactly the workflow and the three `GBS-V11-MAINT-PR278-DUPLICATION-DIAG-007` Work Order, Context Lock, Evidence files. No dependency, suppression, GitHub permission escalation beyond job-local reads, force-push or history rewrite. A public endpoint access error is `NOT_VERIFIED`, not permission to speculate.

## ACCEPTANCE CRITERIA AND TESTS
1. Workflow only appends one job and preserves all original jobs, exact action pins and global read-only permission.
2. GitHub token permissions for the new job are read-only; no Sonar private token or checkout.
3. PR candidate passes all exact-head required CI/security and three-OS release assurance; inspect diagnostic logs for provider exact-head identity and validated file/block metadata or explicit NOT_VERIFIED.
4. The candidate receives an exact-head KayzenRoot owner audit with zero new CRITICAL/HIGH findings before merge.
5. After merge, reassess PR #278 independently; no automatic green claim if its cumulative Sonar or Codecov patch checks still fail.

## DELIVERABLES AND REVIEW FORMAT
One scoped workflow job plus Work Order, exact Context Lock and Evidence Bundle; GitHub PR and PT-BR owner audit with exact SHA, checks, provider findings, outstanding blockers and next correction delta.

STOP CONDITION: `GBS_V11_PR278_DUPLICATION_BLOCKS_PROVIDER_BOUND_OR_NOT_VERIFIED`.
