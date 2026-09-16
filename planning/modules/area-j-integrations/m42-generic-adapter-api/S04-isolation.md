# M42 S04 — Isolation
Status: FROZEN

**AIC42 Adapter Isolation Cell** treats provider code/output as untrusted. Isolation boundaries cover authority, resource budgets, schema validation, secret redaction, error normalization and telemetry cardinality. **ACB42 Circuit Breaker** quarantines repeated integrity/policy failures using deterministic thresholds supplied by policy, not hidden heuristics.

No adapter can write checkpoint/progress/evidence authority directly. Outputs enter normal M24/M25/M37 acceptance paths. A failed adapter cannot poison other providers or the generic engine.

Acceptance: blast-radius containment, quarantine behavior, secret-safe errors, budget enforcement, provider independence, authority denial.