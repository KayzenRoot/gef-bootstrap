# M35 S03 — Restricted Paths
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **RPR35 Restricted Path Registry** with canonical normalized path rules.
- **PTR35 Path Traversal Rejection** for dot segments, symlink ambiguity and escape attempts.
- **SBR35 Scope Boundary Resolver** evaluates workspace/repository/system boundaries.
- **SPG35 Sensitive Path Gate** for credentials, SCM internals, system roots and policy-owned files.
- **PCR35 Path Classification Receipt** records decision without leaking sensitive contents.

Normalization precedes policy evaluation. Ambiguous/symlink-unknown paths fail closed. Windows/POSIX semantics receive dedicated tests.