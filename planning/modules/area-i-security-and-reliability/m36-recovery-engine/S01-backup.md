# M36 S01 — Backup
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **BMF36 Backup Manifest Format** content-addressed manifest, schema-versioned.
- **BSC36 Backup Scope Compiler** captures only declared mutable state.
- **BVG36 Backup Verification Gate** verifies digests before a backup is considered usable.
- **RPO36 Recovery Point Objective Classifier** expresses freshness requirements without wall-clock nondeterminism in core logic.
- **BPR36 Backup Provenance Receipt** binds source candidate and policy.
- **BGC36 Backup Garbage-Collection Contract** marks eligibility but never deletes autonomously.

Backups are immutable evidence objects. Secret-bearing paths are handled by M34/M35 policy and cannot be copied into ordinary evidence.