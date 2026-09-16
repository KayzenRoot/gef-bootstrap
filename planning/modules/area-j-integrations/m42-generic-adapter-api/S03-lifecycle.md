# M42 S03 — Lifecycle
Status: FROZEN

Lifecycle: `REGISTERED -> READY -> BUSY -> READY`, with terminal/quarantine states `DEGRADED | QUARANTINED | CLOSED`. **ALS42 Adapter Lifecycle State Machine** makes every transition explicit and idempotent. **ALR42 Lease Receipt** binds an invocation to registry snapshot, capability, budget and cancellation lineage.

Timeout, cancellation or provider crash releases leases through bounded cleanup. Recovery cannot replay non-idempotent calls without an explicit idempotency key.

Health observations are advisory; policy and integrity gates remain authoritative.

Acceptance: legal-transition enforcement, idempotent close, bounded cleanup, no unsafe replay, cancellation propagation.