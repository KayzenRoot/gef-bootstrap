# ADR-0009 — Post-production patch hotfix routing

Status: `OWNER-APPROVED; CANONICALIZED IN PR #358; EFFECTIVE ON main UPON MERGE`
Decision ID: `D-0064`
Decision owner: `KayzenRoot` (GitHub user ID `114633702`)
Authority: [Issue #357 owner resolution, comment #5935855771](https://github.com/KayzenRoot/gef-bootstrap/issues/357#issuecomment-5935855771)
Work Order: `GBS-V11-WO-011`

## Decision

Once a minor release has reached `PRODUCTION_ACCEPTED`, same-minor patch hotfixes are post-production maintenance of that accepted release line. They are based on the current production `main`, not a historical pre-production release branch. This allocation concretely governs the GEF Bootstrap `1.1.x` patch line after `v1.1.0` reached `PRODUCTION_ACCEPTED`.

A same-minor patch hotfix may merge back to `main` only when all of the following hold on the exact candidate head:

1. The owner has completed and recorded an exact-head audit.
2. Every required status check is `SUCCESS` on that exact head.
3. CRITICAL and HIGH findings are both zero.
4. GitHub reports the branch as mergeable.

The target remains `main`. The historical `release/1.1` branch remains the pre-production V1.1 line. It must not be artificially force-synchronized or rebased, and must not be used as the patch base while it is behind accepted production state.

## Narrow supersession

This decision supersedes the `release/1.1`-only merge target in ADR-0006 solely for post-production same-minor patch hotfixes after `v1.1.0` acceptance. ADR-0006 continues to govern owner-operated audit and merge authority. Its `release/1.1` restriction remains historical authority for pre-production V1.1 development. D-0062 remains branch-qualified: D-0062@main / ADR-0007 and D-0062@release/1.1 / ADR-0006 are not remapped. D-0063 / ADR-0008 remains unchanged.

This decision does not authorize a merge, tag, package publication, or consumer rollout by itself. Each operation remains subject to its separately admitted Work Order and release gates. For PR #358, the owner expressly kept the base as `main`; no retarget, rebase, force-push, or release-branch synchronization is authorized.

## Provenance and effectiveness

The owner authorized this bounded canonicalization in comment #5935855771 on 2026-10-01. The canonicalization is carried by the existing PR #358. It governs the current hotfix routing under that direct owner instruction; repository-wide canonical effectiveness on `main` begins only when PR #358 is merged after its exact-head audit and gates.
