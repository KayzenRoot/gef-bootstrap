# M29 Git Engine — Frozen Plan
Status: FROZEN
Assurance: HIGH_ASSURANCE
Weight: 20

## Repository state
Git state is modeled explicitly as repository identity, HEAD/ref, index/worktree dirtiness, ahead/behind relation and operation-in-progress markers. Unknown or malformed state fails closed. No mutation is authorized from an unverified snapshot.

## Branch lifecycle
Branch names are normalized and validated; protected/default branches are immutable through the engine; creation, synchronization, divergence and deletion have explicit preconditions. Force movement is denied unless a separately authorized recovery policy permits it.

## Commit policy
Commit plans bind expected parent/head, changed paths, message class and provenance. Stale-head commits are rejected. Deterministic receipts expose before/after identities and mutation intent.

## Dirty-tree safety
Untracked, staged, modified, conflicted and operation-in-progress states are distinct. Destructive actions require CLEAN or an explicit preservation receipt. Conflicts, rebase/merge/cherry-pick state and unknown status block mutation.

Acceptance: deterministic parsing; stale-head denial; protected-branch denial; dirty-tree preservation; no ambient mutation; structured receipts; bounded input; tests. STOP: M29 implementation and evidence accepted.