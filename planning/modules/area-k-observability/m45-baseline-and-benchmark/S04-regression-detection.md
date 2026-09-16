# M45 S04 — Regression Detection
Status: FROZEN

**BRD45 Benchmark Regression Detector** evaluates metric-specific thresholds plus uncertainty and repeated samples. States: `IMPROVED | STABLE | REGRESSED | INDETERMINATE | NOT_COMPARABLE`. One noisy run cannot silently become a regression claim.

Critical correctness/security regression always outranks performance improvement. Detection emits evidence for review; it does not auto-relax budgets or assurance.

Acceptance: deterministic thresholds, noise/uncertainty handling, correctness precedence, repeated-sample support, explicit non-comparability.