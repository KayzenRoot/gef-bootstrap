# ADR-0007 — Retire Hive as a Bootstrap development and integration dependency

Status: APPROVED AND MERGED. Owner approved 2026-09-28; technical exact-head approval at `5407ad7d0e87aea935705216f3308b87aea58056`; protected-main merge `3c5f1fb96e9d5f3d8a07acdf024687063f82d9d2` via PR #313. Evidence: `.engineering/evidence/GBS-MAINT-HIVE-REMOVAL-001-EVIDENCE.md`.

## Existing authority and collision avoidance
The V1.1 release line already approved ADR-0005 (legacy ecosystem detachment) and D-0061, retaining neutral reserved M39/M40 slots without binding any prior external provider. The main-line Work Order is a forward-compatible removal of the named Hive implementation and active mentions; it MUST NOT countermand the approved V1.1 neutral M40 slot. This ADR uses number 0007 and companion D-0062 to avoid collision with V1.1 ADR-0003 through 0006 and D-0052 through D-0061.

## Decision
- Bootstrap development, context sourcing, executor prompts, automation and runtime cannot depend on Hive installation, Hive MCP, service, context store or API. Remove the first-party M40 Hive-specific adapter, two dedicated behavioral tests, product-specific planning files and active marketing/configuration references. Do not add a substitute external dependency.
- Preserve M40 as an inactive **Reserved Context Adapter Slot** (three provider-neutral planning sessions), identical in purpose to the already-approved V1.1 ADR-0005. There is no Hive identity/protocol/schema, code export or production requirement attached to this slot. Activating any future context adapter requires a new authorized ADR, security review, contracts, compatibility tests and Work Order.
- Preserve the Generic Adapter API, unrelated UADS/UGAS integrations where independently admitted, local Git/filesystem foundation, canonical Source Pack, deterministic context compiler and checkpoint/resume path.
- Preserve 64 stable module IDs and 282 planning sessions and the accepted 61 production-blocking modules/1088 production-weight denominator. M40 is a neutral reserved optional slot with zero release-blocking weight, not an active provider.
- Preserve already-accepted historical gates/evidence/decisions, accepted release tags and Git history. This ADR prospectively supersedes only the Hive-specific language of D-0002, D-0040 and ADR-0001-D3, not the original historical record.
- Close Hive-first changes before they reintroduce a dependency. PR #297 was closed as superseded.

## Verification and promotion
Run a precise active-surface name/import/config/CI scan excluding accepted historical archives, a static anti-reintroduction regression, cross-platform focused tests, full npm build/typecheck/test/audit and exact-head review. Publish Evidence Bundle and proposed Checkpoint Delta. Promote only after all applicable checks pass and objective audit approves. Future integration is independent and needs explicit admission.
