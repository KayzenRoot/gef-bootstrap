# M55 S03 — Failures

Status: `FROZEN`
Mechanism: `FIS55 — Failure Injection Schedule`

## Contract
Inject deterministic GitHub failure classes at named transition points: timeout, connection reset, 401, 403, 404 ambiguity, 409/422 conflict, 429/rate limit, 5xx, malformed payload, truncated pagination, stale head and delayed check completion.

Failures are selected by seed + operation ordinal, recorded in the action log and reproducible. Injection may occur before mutation, after accepted mutation with lost response, or during read pagination so idempotency behavior can be proven.

## Invariants
No injected failure may silently convert UNKNOWN into success. Ambiguous write outcomes require reconciliation before retry. Partial reads are tagged `TRUNCATED`; malformed remote data is quarantined as `INDETERMINATE`.

## Acceptance
Each failure class has recovery expectations and bounded tests; state digest proves whether mutation occurred; failure schedules are replayable and never leak into real GitHub calls.

STOP CONDITION: `M55_S03_FROZEN`.