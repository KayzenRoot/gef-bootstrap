# M37 S03 — Configuration Integrity
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CIR37 Configuration Integrity Registry** declares governed configuration surfaces.
- **SCH37 Schema/Constraint Harness** validates structure and semantic invariants.
- **OCG37 Override Chain Graph** records precedence and provenance.
- **ACD37 Ambiguous Configuration Detector** rejects conflicting equal-precedence values.
- **CFP37 Configuration Fingerprint Projection** strips irrelevant noise while preserving semantics.
- **CIRR37 Configuration Integrity Result Receipt** binds effective config and sources.

Environment overrides cannot silently outrank constitutional/project policy. Sensitive values are fingerprinted/redacted per M34.