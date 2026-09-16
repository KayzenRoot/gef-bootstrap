# M58 S03 — Secrets

Status: `FROZEN`
Mechanism: `SLA58 — Secret Leakage Adversary`

Seed synthetic high-entropy tokens and provider-shaped canaries into environment, config, simulated API responses, errors and fixture files. Exercise logs, telemetry, audit receipts, diagnostics, artifacts, thrown errors and snapshots.

Canaries must never appear unredacted in user-facing or persisted diagnostic outputs unless the artifact is explicitly secret-classified and excluded from normal evidence. Tests scan structured and rendered forms, including nested values.

Acceptance: deterministic redaction, no partial-token leakage beyond approved fingerprints, secret values excluded from digests when policy requires, and test failure reports do not echo the secret they detected.

STOP CONDITION: `M58_S03_FROZEN`.