# M41 S01 — UGAS Detection
Status: FROZEN | Class: OPTIONAL_ADAPTER

UGAS presence is discovered only through M38 capability receipts. No filesystem, network, process, environment or version probing is allowed inside the adapter. Detection is tri-state `AVAILABLE | ABSENT | INDETERMINATE`; unknown never becomes available.

Mechanisms: **UGD41** signed detection projection; **UVI41** version/contract compatibility interpreter; **UFG41** fail-closed discovery gate. Availability requires capability id, provider identity, contract version, provenance digest and freshness binding. Absence is a valid no-op state and cannot degrade the generic GEF path.

Security: no secrets in receipts, no implicit trust from executable names, no ambient side effects, deterministic canonical ordering. Cross-context or stale receipts are rejected.

Acceptance: deterministic detection; forged/stale/incompatible capability denial; safe absence; startup purity.