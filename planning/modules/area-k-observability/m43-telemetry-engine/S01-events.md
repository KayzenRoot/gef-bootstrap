# M43 S01 — Events
Status: FROZEN | Class: CORE_REQUIRED

**TEE43 Typed Event Envelope**: event id, schema version, category, phase, correlation id, parent id, monotonic sequence, severity, redaction class and canonical attributes. Events are append-oriented observations, never authority.

**EBS43 Event Budget Sentinel** caps cardinality and payload size; overflow emits an aggregate truncation event rather than silently dropping assurance-relevant state. Sensitive fields are deny-by-default.

Determinism: stable field ordering and injected clocks/ids for tests. Telemetry failure cannot fail the product unless a frozen assurance policy explicitly requires the sink.

Acceptance: schema/version validation, redaction, cardinality bounds, correlation, truncation visibility, startup purity.