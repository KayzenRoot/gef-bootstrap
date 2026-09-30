# GBS-V11-RELEASE-ONEPASS-013 — Gate 2 Evidence Bundle

Status at capture: admitted, preflight complete; integration is not yet executed.

## Authority and scope

- Master Work Order / source admission: Issue #348, approved Gate 2 admission for GBS-V11-RELEASE-INTEGRATION-014.
- Candidate branch: codex/gbs-v11-release-integration-014, created from main at f6738292c038eb6f0d08d1d32b3752c5c7dc417a.
- Authorized operation: normal ancestry-preserving merge of release/1.1 at 4b2f66724ea5df94ddd8fda2d8088b12b9708c10, resolve only the admitted governance/source-document conflicts, and open one cumulative PR to main.
- No main merge, WO-010 acceptance, tag, GitHub Release or package publication is authorized.
- Candidate exact HEAD, Codecov, Sonar, provider checks and security results: NOT RUN at this preflight capture.

## Exact source snapshot

| Ref | SHA | Tree |
|---|---|---|
| main | f6738292c038eb6f0d08d1d32b3752c5c7dc417a | 0413bf3e8d706738f73c93578c81630ce027f4ec |
| release/1.1 | 4b2f66724ea5df94ddd8fda2d8088b12b9708c10 | 15bdf8462e67daab84152f096a0ab629be25ffc9 |
| merge base | e23311e77d79b84f3c70671072a22a6f8896d13d | 39d8b61cb70020e87c65f2443ce3790af1c2b5c4 |

Observed divergence: 2 main-only / 84 release-only commits. GitHub currently authenticates as KayzenRoot.

## Pre-mutation conflict inventory

A disposable merge-tree calculation returned result tree 797545a324c17e5e14da9ddbc6819f5134bfb21d, with 14 textual conflicts (12 content and 2 add/add). The exact path list and blobs are in the Gate 2 Context Lock. Every conflict is in the approved Issue #348 reconciliation class. No product/runtime/test/CI/security-policy conflict was returned. Semantic review is required for .engineering/CHECKPOINT.md and ADR-0001 even though Git combined those paths automatically.

## Resolution intent frozen before source conflict resolution

| Path | Required reconciliation |
|---|---|
| .engineering/ARCHITECTURE.md | Preserve release architecture and neutral adapter boundaries; record branch-specific ADR-0008 effective events without changing product contracts. |
| .engineering/CHECKPOINT.json | Preserve main V1.0 fields and main D-0063 promotion; include the V1.1 candidate overlay with real PR #347 and #349 receipts; leave production and WO-010 acceptance pending. |
| .engineering/CHECKPOINT.md | Keep 1088/1088 as accepted main production state; state actual Gate 0/Gate 1 receipts and candidate-only Gate 2 status. |
| .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md | Retain the historical actor policy and constitutional product/safety boundaries; distinguish main and release adoption dates. |
| .engineering/CONSTITUTION-LOCK.md | Retain constitutional history and both branch-qualified D-0062 authorities plus both D-0063 adoption receipts. |
| .engineering/DECISIONS-LEDGER.md | Preserve all existing decision content; qualify the two D-0062 lineages; keep D-0064 unallocated. |
| .engineering/DEFINITION-OF-DONE.md | Preserve frozen completion and exact-head obligations; reconcile only the already approved executor overlay. |
| .engineering/EXECUTOR-ACCELERATION-CONTRACT.md | Reconcile current executor authority without changing the frozen safety contract. |
| .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md | Reconcile the add/add canonical copies; bind main to PR #332 promotion and release to actual PR #347 merge. |
| .engineering/PROJECT-OVERVIEW.md | Preserve accepted V1 history and the V1.1 candidate boundary; report both branch adoption facts. |
| .engineering/REQUIREMENTS.md | Preserve frozen product requirements and branch-qualified executor authority; introduce no new requirement. |
| .engineering/SCOPE.md | Retain all 64 IDs, 282 sessions and 1088/1088 V1 acceptance; represent release D-0061 neutral M39/M40 overlay separately from main ADR-0007 history. |
| .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md | Record ADR-0008 effective on main after its promotion and on release at actual PR #347 merge; do not imply V1.1 production acceptance. |
| .engineering/decisions/ADR-0001-COMPLETE-PRODUCTION-TARGET.md | Preserve the complete-production decision/history and the generic optional-adapter boundary under existing branch decisions. |
| AGENTS.md | Combine executor, owner-only GitHub, fresh-context and fail-closed instructions with the two actual adoption events. |
| README.md | Keep project claims truthful: V1.0 accepted, V1.1 candidate, no publication; retain the release runbook link. |

The files above are the only admitted normative conflict-resolution targets. The remaining canonical sources are read-only; unconflicted files receive no manual edits unless the source admission or a bounded same-Issue delta explicitly authorizes them.

## Decision and checkpoint invariants

- D-0062@main / ADR-0007 remains the Hive-specific development/integration retirement decision.
- D-0062@release/1.1 / ADR-0006 remains owner-operated exact-head audit and merge authority.
- D-0063 / ADR-0008 remains the same decision with separate main and release adoption receipts; release effect began at PR #347 merge 9f6f069c977868ade34a19cddb346f7bea9a95fe.
- D-0064 is unallocated.
- PR #349 merged at 4b2f66724ea5df94ddd8fda2d8088b12b9708c10; Issue #337 is closed/merged.
- Preserve V1.0 accepted production 1088/1088, PR #278 CLOSED_NOT_MERGED, and all prior receipts. Do not claim V1.1 production, future Gate 2 merge, WO-010 acceptance, a tag, or publication.

## Gate 2 checks

All required local and provider checks will be recorded only when observed on the exact cumulative PR HEAD. Native LCOV supports the result but cannot substitute for a provider-bound Codecov patch report. Required Codecov patch threshold: at least 97.85%. A failed, pending, stale or mismatched required check is not a pass.

### Current state

- Integration merge: NOT RUN.
- Conflict resolution: NOT RUN.
- Local validation/build/release tests: NOT RUN.
- Exact-head GitHub checks/security/Sonar: NOT RUN.
- Codecov provider report and patch percentage: NOT RUN.
- Owner exact-head audit: PENDING.
- Stop condition: GBS_V11_RELEASE_ONEPASS_013_GATE2_CUMULATIVE_EXACT_HEAD_READY_FOR_OWNER_AUDIT.
