# GBS-V11-MAINT-PR278-MAIN-RECONCILE-006 — governed release/main ancestry reconciliation

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Assurance: ELEVATED. Owner: KayzenRoot. Exact base `6275860c7cde1fbecccf646b87a04b9e92c8ecd0`; main parent `e23311e77d79b84f3c70671072a22a6f8896d13d`; shared ancestor `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`; branch `gbs/v11/maint-pr278-main-ancestry-006`.

Objective: clear the cumulative PR #278 Git conflict without resurrecting retired product dependencies or mutating immutable V1.0 history. The companion ledger records dispositions for all 51 divergent paths and categorizes the 29 main-only changes. Every source/workflow not explicitly modified remains the V1.1 release version.

Authorized modifications: five least-privilege workflow read scopes previously present on main; six compatible active main-only files (owner CODEOWNERS, ignored coverage output, existing optional Codecov workflow/operating docs, pipeline/security docs); Work Order, exact-base Context Lock, candidate evidence and full conflict matrix. Advisory coverage uses locked install with disabled lifecycle scripts; no extra runtime package. Historical obsolete files stay visible through Git parent history only.

Create one genuine merge commit with parents release then main. Open a PR to release/1.1; it MUST merge by `merge`, NOT squash/rebase. Require fully green exact-head checks, three-platform release assurance, CodeQL/Gitleaks/Trivy/dependency and Sonar evidence, no CRITICAL/HIGH introduced findings, and KayzenRoot owner-only NOT_INDEPENDENT audit. Re-evaluate cumulative PR #278's mergeability and Sonar separately after integration. No direct main write, force push, tag/release publication, threshold suppression, or WO-010 admission.

STOP CONDITION: `GBS_V11_PR278_MAIN_ANCESTRY_006_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
