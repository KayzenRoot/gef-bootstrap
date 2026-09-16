# M50 S02 — Migrations
Status: FROZEN

**MDG50 Migration DAG** requires ordered, version-bounded, idempotent migration steps with preconditions/postconditions and reversibility class. State/config is snapshotted before destructive transforms. A failed step stops the DAG; non-reversible steps require explicit preservation and policy approval.

Acceptance: ordering/cycle rejection, idempotency, interrupted migration recovery, schema validation, preservation before destructive change.