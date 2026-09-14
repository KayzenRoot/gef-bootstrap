# GBS-M19-S01 — Registry Model & Authority
Status: `FROZEN`
Module weight: `14`
Assurance intensity: `STANDARD_PLUS`

## Objective
Define the persistent project-registry model without allowing registry data to outrank canonical project identity, checkpoint or repository truth.

## Scope
M19 owns persistent registry/index semantics for known projects. M03 remains owner of project/repository identity, M04 remains owner of discovery, M17/M18 remain owners of checkpoint/resume truth, and provider/Git execution stays in later modules.

## Technologies
- **Project Registry Entry (PRE)**: compact immutable semantic record for one known project, binding project ID, lineage ID, repository identity projection, registry state, checkpoint pointer and approved metadata references.
- **Registry Identity Envelope (RIE)**: exact M03-derived identity projection used for registry comparison. Registry never invents or repairs identity.
- **Registry Authority Boundary (RAB19)**: registry facts are routing/index evidence only; canonical identity, checkpoint, source and policy authority remain external.
- **Registry Provenance Chain (RPC19)**: each admitted entry records the exact source digests/identities that justified it.
- **Registry State Algebra (RSA19)**: explicit states `ACTIVE`, `STALE`, `QUARANTINED`, `TOMBSTONED`, `UNKNOWN`; no implicit newest-wins state.
- **Registry Mutation Intent (RMI19)**: deterministic proposed add/update/tombstone intent. It contains no filesystem or provider mutation capability.

## Invariants
1. A PRE cannot exist without a canonical M03 project ID and lineage identity.
2. Registry metadata never becomes source authority merely by being persisted.
3. Repository aliases or display names cannot establish sameness when stronger identity evidence disagrees.
4. Unknown/conflicting identity fails closed to `QUARANTINED` or `UNKNOWN`.
5. No ambient filesystem, network, Git or provider I/O is permitted in the semantic core.
6. Deterministic identity uses injected SHA-256 only.

## Out of scope
Repository discovery, Git operations, hosted-provider API calls, generic proof graph, telemetry, UI, project-status scoring and physical storage mutation primitives.

STOP CONDITION: `M19_S01_FROZEN`.
