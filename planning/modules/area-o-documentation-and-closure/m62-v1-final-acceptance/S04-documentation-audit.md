# M62 S04 — Documentation Audit
Status: `FROZEN`

## Objective
Verify user, engineering and operational documentation is current, internally consistent and bound to product contracts.

## DAG62 — Documentation Acceptance Graph
M59 user docs, M60 engineering docs and M61 runbooks are checked for source/version digest, canonical terminology, command/schema validity, broken authority claims and stale references.

## Rules
- Documentation cannot override Scope, DoD, Architecture, Decisions or Checkpoint.
- Examples must match supported contracts and safe-operation policy.
- Runbooks distinguish automatic, reversible and manual/high-risk actions.
- Stale docs block only where they affect release-required operation or safety, with explicit gap evidence.

## Acceptance
Required documentation manifests resolve, no release-blocking stale/contradictory guidance remains, and operational recovery paths are documented.