# M44 S01 — Actions
Status: FROZEN | Class: CORE_REQUIRED

**ALE44 Audit Ledger Event** records security/governance-relevant actions as canonical append-only entries: action type, target, outcome, authority source, evidence refs, correlation id and previous-entry digest. Reads are not automatically audit events; policy defines audited action classes.

**AHS44 Hash-chain Seal** domain-separates entry digests and detects deletion, reordering or mutation. Genesis and segment rollover are explicit.

Acceptance: canonical serialization, tamper detection, action taxonomy, append-only API, deterministic verification.