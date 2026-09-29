# ADR-0003 — Retirement of the Hive integration

Status: OWNER APPROVED (2026-09-28). Technical promotion of implementation is subject to exact-head CI and audit under GBS-MAINT-HIVE-REMOVAL-001.

## Decision
GEF Bootstrap no longer uses Hive for repository development, context sourcing, executor prompts, automation, runtime capabilities or distributed product adapters. The owner explicitly directed deep removal before continuing other development. No Hive installation or external Hive service may be required or recommended by active Bootstrap contracts.

- Retire the M40 Hive Adapter as an active module. Keep its stable identifier as a historic tombstone; never repurpose or renumber it.
- Delete Hive-specific first-party runtime exports, M40 planning sessions, targeted Hive tests and live CI references; do not delete the reusable Generic Adapter API or the remaining UADS/UGAS adapters.
- Remove Hive from current Source Pack architecture, requirements, scope, backlog, DoD, deployment, operator docs, prompts, automation and module index.
- The independent local Git/filesystem substrate, canonical Source Pack, deterministic context compiler, checkpoint/resume and GitHub reference profile remain the fallback and authoritative development path, without a new external context dependency.
- Preserve already-approved historic decisions, gates, evidence, PR discussion, release receipts and git tags; this ADR supersedes the current/future Hive-related permissions in D-0002, D-0040 and ADR-0001-D3, not their historical meaning.
- Keep 47 CORE_REQUIRED + 14 PRODUCT_INCLUDED = 61 release-blocking modules and the accepted 1088-weight denominator; optional active adapter inventory becomes M39 and M41, 2 items. Original freeze had 64 total IDs and 282 sessions; prospective inventory has 63 active IDs and 279 active sessions.
- Close pending Hive-first changes that could reintroduce the dependency; PR #297 was closed as superseded.

## Consequences
This is a bounded, owner-authorized maintenance change after V1 production acceptance. It is not a V1 acceptance history rewrite or a reason to reset progress. All future releases and active development instructions must remain independent of Hive. An intentional reversal would require a new owner decision and fresh risk, architecture and test review.

## Verification and promotion
Perform runtime/source/CI scans and static retirement regression, tests on all supported platforms, full build/typecheck/test/audit and exact-head review. Update promoted checkpoint only when the implementation has passed evidence and audit; keep the admission Context Lock and Evidence Bundle in the repository.
