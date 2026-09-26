# M34 S03 — Dependency Security
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **DLB34 Dependency Lock Binding** binds manifest, lockfile and candidate.
- **SVC34 Supply-chain Verification Contract** for provenance/integrity metadata.
- **DAG34 Dependency Audit Gate** consumes scanner results without trusting absence as proof.
- **TDG34 Transitive Dependency Graph** with bounded traversal.
- **PDC34 Package Drift Classifier** catches lock/manifest mismatch and unexpected source changes.
- **QRG34 Quarantine Recommendation Gate** blocks unsafe bootstrap selection.

Network installation is outside this engine. Lockfile drift, unknown provenance and critical findings fail closed. Existing M32 owns CI execution; M34 owns security interpretation.