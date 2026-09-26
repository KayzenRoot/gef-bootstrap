# ADR-0006 — Owner-operated review and merge authority

Status: `OWNER_APPROVED; EFFECTIVE_ON_GBS-V11-GOV-001_MERGE`
Release line: `1.1.x`
Decision owner: `KayzenRoot` (GitHub user ID `114633702`)
Authorization date: `2026-09-26`
Work Order: `GBS-V11-GOV-001`

## Decision

GEF Bootstrap uses an owner-operated delivery model. For this repository, `KayzenRoot` is the sole account used for GitHub writes, exact-head semantic audits, approval decisions, PR merges and later release actions. No collaborator account is a required reviewer, approver, merge actor or authorization dependency. The workflow must not request a collaborator review or switch to another connected identity to complete an operation.

The project owner performs a substantive owner audit on the exact candidate head and records it on the PR. The audit records the head SHA, scope/acceptance review, required evidence and checks, security/integrity findings, CRITICAL/HIGH counts, and one disposition: `OWNER_APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`. This is an owner audit, not an independent review; never describe it as independent.

The owner may merge an implementation PR after the exact-head owner audit is `OWNER_APPROVED`, every required CI/status check for that Work Order succeeds on the exact head, no CRITICAL/HIGH blocker remains, the candidate is mergeable, and the merge target is authorized by the active release decision. The owner may perform the merge through the connected GitHub account without collaborator approval.

## Assurance and safety conditions retained

This decision removes the mandatory *collaborator* gate. It does not waive engineering proof or platform protections:

- Required tests, builds, typechecks, dependency/security checks, cross-platform suites, evidence bindings and exact-head checks remain mandatory as defined by the Work Order and DoD.
- Any failing, pending, stale or head-mismatched required check blocks merge.
- CRITICAL/HIGH findings block the affected claim until corrected.
- Required GitHub status checks and branch protections must not be bypassed to force a green result.
- The owner follows normal merge methods; force-push, history rewrite and destructive cleanup remain prohibited unless a specific governed authorization path permits them.
- `main` remains production-only under ADR-0003-D1. A V1.1 implementation may merge only into `release/1.1`; production promotion, tags and publication remain controlled by their admitted Work Orders.
- Explicit owner authorization for S4 destructive actions and any stricter security/recovery proof remains in force.

The connected `Main Branch Protection` ruleset was inspected on 2026-09-26: required approving review count is `0`; `Repository validation` is still required. This policy preserves that automated check. The active release-line process therefore does not rely on a collaborator approval.

## Applicability and supersession

This ADR applies to active V1.1 Work Orders and all future GEF Bootstrap execution/merge instructions. It also sets the default for projects materialized by GEF: the configured project-owner account is the final review and merge authority; collaborator review may be advisory but is never a GEF-mandated gate.

For the V1.1 line, this decision supersedes only the following incompatible process clauses:

1. ADR-0003-D3 prohibition on merge by the authorized executor and requirement that objective audit be external to that executor.
2. Active/future Work Order, Execution Brief, template or instruction clauses that require an independent collaborator review, collaborator approval, or prohibit the owner account from merging after an exact-head audit.
3. The active WO-008 requirement to stop before merge pending independent objective audit.

Historical decisions and completed audit records remain unchanged. The remaining V1.1 restrictions in ADR-0003-D3 remain in force unless explicitly changed here.

## Impact analysis

Expected benefit: remove delays caused by unavailable collaborators, account mismatch and review-request permission failures; keep build/validation and merge work under the repository owner account.

Tradeoff: the semantic audit is not independent. Mitigation is an explicit exact-head checklist, automated required checks, fail-closed blocker handling, retained security and recovery proof, and an auditable PR comment. No token, time or convenience objective may justify suppressing required checks or hiding findings.

## Promotion

The Product Owner explicitly requested this change on 2026-09-26. Under D-0042, the decision becomes durable authority only when GBS-V11-GOV-001 is exact-head audited by the owner, all required checks pass, and its promotion PR merges into `release/1.1`. The promoted checkpoint then routes WO-008 to owner audit and owner-authorized merge.
