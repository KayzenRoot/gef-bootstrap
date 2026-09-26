# M42 S01 — Generic Adapter Interface
Status: FROZEN | Class: PRODUCT_INCLUDED

**GAC42 Generic Adapter Contract** defines provider-neutral identity, semantic version, capability set, schemas, health state, invoke contract, cancellation and evidence hooks. Inputs/outputs are explicit serializable values; adapters receive no ambient filesystem/network/process authority.

**ABI42 Adapter Boundary Invariant** requires deterministic capability declaration and structured errors. Contract negotiation is `COMPATIBLE | INCOMPATIBLE | INDETERMINATE`; only COMPATIBLE can execute.

The interface supports local, remote and embedded providers without encoding transport into domain semantics.

Acceptance: schema validation, version negotiation, startup purity, cancellation, structured failure, no ambient authority.