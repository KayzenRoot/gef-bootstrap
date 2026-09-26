# GBS-M16-S03 — Runtime Enforcement & Exceptions
Status: `FROZEN_CANDIDATE`

## Objective
Project policy decisions into M15 execution nodes and reject unauthorized runtime deviation.

## Technologies
- **Guardrail Enforcement Membrane (GEM)**: new NECESSARY boundary between compiled intent and mutating executor.
- **Mutation Capability Lease (MCL)**: new NECESSARY short-lived semantic authorization bound to exact node/domain/operation, not wall-clock authority.
- **Exception Blast-Radius Cap (EBRC)**: new NECESSARY limits exception effects to explicitly named obligations/domains.
- **Policy TOCTOU Sentinel (PTS)**: new NECESSARY revalidates relevant policy fingerprints before guarded mutation.
- **Fail-Closed Degradation Mode (FDM)**: unavailable policy dependencies block affected actions rather than silently disable controls.

M16 does not perform filesystem/Git mutation itself.

STOP CONDITION: `M16_S03_FROZEN_CANDIDATE`.