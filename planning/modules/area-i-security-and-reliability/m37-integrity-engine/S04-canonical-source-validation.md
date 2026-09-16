# M37 S04 — Canonical Source Validation
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CSR37 Canonical Source Registry** maps governed facts to authoritative sources.
- **SPB37 Source Provenance Binder** binds source identity, revision and content digest.
- **SAG37 Source Authority Gate** distinguishes integrity from authority.
- **CSG37 Canonical Source Conflict Gate** rejects unresolved competing authorities.
- **RSV37 Revalidation State Vector** identifies which prior proofs survive source changes.
- **IHH37 Integrity Handoff** read-only exact-candidate receipt for downstream modules.

Canonical hierarchy remains checkpoint > decisions/ADRs > scope > DoD > architecture > requirements > other. M37 validates; it does not redefine hierarchy.