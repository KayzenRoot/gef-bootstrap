# M60 S04 — Adapters

Status: `FROZEN`
Mechanism: `ADR60 — Adapter Developer Reference`

Document M42 generic adapter contract and M39-M41 implementations: identity/version discovery, capabilities, request/response envelopes, deadlines/cancellation/idempotency, health states, provenance, trust boundaries and error taxonomy.

Provider-specific behavior is isolated behind the generic contract. The reference explains optional absence, degraded capability, version negotiation and how an adapter proves rather than assumes support.

Acceptance: contract examples pass adapter conformance fixtures, optional adapters are not core dependencies, security/redaction obligations are explicit, and new adapters can be implemented without reading provider-specific internals.

STOP CONDITION: `M60_S04_FROZEN`.