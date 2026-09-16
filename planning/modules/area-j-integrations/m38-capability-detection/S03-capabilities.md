# M38 S03 — Capabilities
Status: FROZEN
Assurance: HIGH_ASSURANCE

## Mechanisms
- **CGR38 Capability Graph Registry** stable atomic/composite capabilities.
- **CDE38 Capability Derivation Engine** derives only from verified observations.
- **NCR38 Negative Capability Receipt** records known absence explicitly.
- **UCG38 Unknown Capability Gate** prevents optimistic assumptions.
- **CRD38 Capability Receipt Digest** candidate/environment/policy-bound.
- **CCR38 Capability Conflict Resolver** returns CONFLICT instead of arbitrary winner.

Capabilities are descriptive, not authority. Results are deterministic under input permutation and stale when environment fingerprint changes.