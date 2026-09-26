# M44 S03 — Immutable Events
Status: FROZEN

Ledger events are immutable values. Corrections append a superseding event referencing the original; no in-place edits. **MPR44 Merkle Period Receipt** may seal bounded batches for efficient verification while the linear hash chain preserves order.

Retention/export can segment the ledger only with a continuity receipt binding prior segment root, next genesis, policy id and export digest. Verification is bounded/cancellable and reports `VALID | INVALID | INCOMPLETE`.

Acceptance: mutation detection, supersession semantics, segment continuity, bounded verification, incomplete fail-closed.