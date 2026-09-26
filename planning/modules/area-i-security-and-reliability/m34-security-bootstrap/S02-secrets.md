# M34 S02 — Secrets
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **SDR34 Secret Detection Registry** with entropy + structured-pattern signals.
- **SRG34 Secret Redaction Gate** that never emits discovered values.
- **SCP34 Secret Context Provenance** separating env/config/repo/tool sources.
- **EPL34 Ephemeral Lease Model** for short-lived credentials and expiry.
- **SLE34 Secret Leak Evidence** stores fingerprints only, never plaintext.
- **RRG34 Rotation Recommendation Gate** produces remediation without mutating providers.

## Rules
No secret value enters logs, receipts, exceptions, snapshots or telemetry. Detection is read-only. Hashes are domain-separated and unsuitable as credential substitutes. Unknown secret-like material widens to review. Tests use synthetic canaries only.