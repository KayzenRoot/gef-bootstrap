# M61 S02 — Recovery

Status: `FROZEN`
Mechanism: `RDR61 — Recovery Decision Runbook`

Use M36 recovery journal as authority for what was attempted/completed. Procedure: freeze further writes, capture state/evidence, validate journal/source digests, determine commit point, choose compensating actions, verify post-state, publish recovery receipt.

If journal/state disagree, stop as `INDETERMINATE`; do not reconstruct a comforting history. Non-reversible actions require preserved-state/manual recovery instructions.

Acceptance: runbook covers interrupted local/Git/checkpoint/artifact operations, is idempotent when repeated, clearly separates automatic-safe from operator-required actions, and never overstates rollback guarantees.

STOP CONDITION: `M61_S02_FROZEN`.