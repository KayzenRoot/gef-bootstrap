# M44 S02 — Actors
Status: FROZEN

**AID44 Actor Identity Descriptor** separates human, automation, model/executor, GitHub principal and external adapter identities. Actor identity is evidence-backed; missing identity becomes `UNKNOWN`, never inferred from display text.

Delegation is represented by an explicit chain with authority scope and expiry/context binding. **DVG44 Delegation Verification Gate** rejects cycles, scope escalation and unbound delegation.

PII is minimized: stable pseudonymous ids are preferred where human-readable identity is unnecessary.

Acceptance: actor typing, unknown preservation, delegation-chain validation, no authority escalation, privacy minimization.