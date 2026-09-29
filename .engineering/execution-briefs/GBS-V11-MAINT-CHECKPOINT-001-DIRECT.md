# Direct Execution Brief — GBS-V11-MAINT-CHECKPOINT-001

## Authority and exact base

Execute only `.engineering/work-orders/GBS-V11-MAINT-CHECKPOINT-001.md`. The Context Lock binds this branch to PR #310 head `8c9fefae8adf39a5944f52599a9dc4b4b786ae65`, based on `release/1.1` merge `44c6618ece1593365fb6c7f559d13c7166e7df26`. Stop if either source ref or a locked fingerprint changes before integration.

The user authorized this corrective increment after PR #310's blocked checks. Do not amend the completed pipeline Work Order or start WO-009 implementation. WO-009 remains the active product Work Order.

## Implementation target

- Change the seven frozen governance tests only at the WO-009 terminal-state branch and centralize that exact state assertion in `tests/helpers/v11-context-lock-refresh-assertions.mjs`. Assert `REFRESH_WO_009_CONTEXT_LOCK_FOR_CURRENT_RELEASE_HEAD` and the retained stop state; keep earlier state/history assertions unchanged. Replace the two obsolete `No WO-009 implementation has started` checks with assertions for the branch and PR #302 reconciliation note in the checkpoint.
- In the checkpoint, change only `v11.nextLegalAction` and its human-readable sentence so the lock refresh resolves the actual release tip after this corrective PR merges.
- Add/update this Work Order, Context Lock, Direct Execution Brief, and Evidence Bundle.

## Verification

Run `npm run validate`. At the exact PR head, verify Repository Validation; M41–M47, M48–M54, M55–M61 and M62–M63; Pipeline Integrity; Gitleaks; Trivy; Dependency Review; and all other configured required/applicable checks. Treat the inherited WO-009 CodeQL HIGH as still open and release-blocking; do not suppress or claim it resolved. Record exact candidate SHA and linked check runs in the Evidence Bundle.

## Audit and handoff

KayzenRoot records the exact-head semantic audit as `OWNER_APPROVED`, not independent. Merge only after all required exact-head checks pass and no new CRITICAL/HIGH blockers exist. Verify the post-merge release SHA and checks. Then close PR #310 as superseded. The next legal operation is to refresh WO-009's Context Lock against the exact current `release/1.1` tip, stopping and refreshing again if the tip advances before the lock is finalized.
