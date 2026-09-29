# Provisional D-0062 branch-lineage map for V1.1 forward-port

Status: PLANNING_ONLY; **not** a final conflict resolution or canonical decision renumbering.
Planning Work Order: GBS-V11-GOV-CODEX-FORWARDPORT-001, issue #335.

| Historical lineage | Decision on that branch | Evidentiary source | Provisional main integration |
|---|---|---|---|
| main through `f6738292c038eb6f0d08d1d32b3752c5c7dc417a` | D-0062: retire Hive-specific integration; neutral reserved M40 | Main ADR-0007, PR #313 merged `3c5f1fb96e9d5f3d8a07acdf024687063f82d9d2` | Preserve main D-0062 and its approved history. |
| release/1.1 through `bbd83a179dd4c11f2f8653251db2b574d0266880` | D-0062: owner-operated exact-head review and merge | Release ADR-0006, PR #298, merge `d52dcca0840465324582b022c53b5a12fd0a3840` | Preserve historical release D-0062 as branch-qualified alias; candidate future new main ID D-0064, **only after collision check and explicit audited approval**. |
| main through `f6738292c038eb6f0d08d1d32b3752c5c7dc417a` | D-0063 / ADR-0008: Codex sole code author and GitHub-first planning | PR #332 exact head `7ff0118fcbb29dfd42434e18e68eed0b0c27de2e`, merge `419b9cd713d4817c05582287ec10793fc7fdc130`; promotion #333 merge `f6738292c038eb6f0d08d1d32b3752c5c7dc417a` | Forward-port the approved rule without overwriting release-only decisions. |

Other path conflicts remain **NOT_YET_VERIFIED**, not assumed absent or invented as precise lists. At admission, compute current exact Git merge base, file SHA/three-way semantic diff for all affected canonical docs and record `BASE / MAIN / RELEASE / PROPOSED / REVIEWER`. Preserve already-accepted release/1.1 WO001..009, Codecov issue #334 and security gates. Do not merge a planning-only PR as a surrogate for canonical checkpoint promotion.

STOP CONDITION: `GBS_V11_D0062_LINEAGE_PROVISIONALLY_MAPPED_PENDING_EXACT_HEAD_SOURCE_RECONCILIATION`.
