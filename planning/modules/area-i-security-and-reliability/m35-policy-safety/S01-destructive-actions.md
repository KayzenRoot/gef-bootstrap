# M35 S01 — Destructive Actions
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **DAC35 Destructive Action Classifier**: NONE/REVERSIBLE/MUTATING/DESTRUCTIVE/IRREVERSIBLE.
- **PIG35 Precondition Integrity Gate** binds exact target and observed state.
- **BPR35 Blast-radius Projector** enumerates affected resources before execution.
- **RPL35 Reversible Plan Layer** requires rollback where technically possible.
- **DNR35 Destructive Nonce Receipt** prevents stale approval reuse.
- **KSG35 Kill-switch Gate** supports cancellation before commit boundary.

Classification cannot be caller-downgraded. Unknown blast radius is blocking. Plans are data, not shell commands. Execution remains with the owning executor.