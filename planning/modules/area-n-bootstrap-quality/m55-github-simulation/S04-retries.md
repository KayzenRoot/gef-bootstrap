# M55 S04 — Retries

Status: `FROZEN`
Mechanism: `RRC55 — Retry/Reconciliation Controller`

## Contract
Retries are bounded, cancellation-aware and operation-class specific. Read retries may use deterministic exponential schedules with jitter supplied by the test clock. Mutating retries require idempotency key or reconciliation of the prior ambiguous outcome.

Retry classes: `SAFE_READ`, `IDEMPOTENT_WRITE`, `RECONCILE_THEN_RETRY`, `DO_NOT_RETRY`, `UNKNOWN`. Rate-limit responses honor simulated reset metadata; permission and validation failures are never retried as transient errors.

## Invariants
Attempt budgets are explicit; retry exhaustion preserves the last evidence; stale-head writes re-read candidate state; no retry can bypass PAM55; cancellation stops future attempts; deterministic tests never sleep on wall clock.

## Acceptance
Tests prove bounded attempts, no duplicate PR/review/merge side effects, correct lost-response reconciliation, rate-limit handling and stable receipts.

STOP CONDITION: `M55_S04_FROZEN`.