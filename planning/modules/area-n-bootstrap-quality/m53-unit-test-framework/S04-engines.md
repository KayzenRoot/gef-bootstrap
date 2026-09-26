# M53 S04 — Engines
Status: FROZEN

**EIM53 Engine Invariant Matrix** provides reusable contract tests for deterministic engines: startup purity, bounded input, cancellation, idempotency, canonical digest, stale-state rejection and authority boundaries. Modules add domain-specific cases without copying the harness.

Acceptance: invariant suites reusable across engines, failure localization, no ambient side effects, exact fixture provenance.