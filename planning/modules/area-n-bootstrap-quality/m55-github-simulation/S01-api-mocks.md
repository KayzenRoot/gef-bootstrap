# M55 S01 — API Mocks

Status: `FROZEN`
Mechanism: `GSM55 — GitHub State Machine Simulator`

## Contract
Provide a deterministic, offline GitHub simulation whose state transitions model repository, branch, commit, pull-request, review, check, workflow and merge behavior required by GEF. Fixtures are versioned and canonicalized; request order never changes semantic results.

The simulator exposes explicit request/response envelopes, stable IDs, pagination, ETag-like revision tokens and recorded transition receipts. It never contacts GitHub and never treats a mock response as evidence of real remote state.

## Safety and fidelity
- unsupported endpoints return `CAPABILITY_GAP`, never fabricated success;
- malformed input is rejected before state mutation;
- writes are atomic against the simulated revision;
- stale revision writes return deterministic conflict;
- pagination and rate-limit metadata are reproducible;
- secrets/tokens are synthetic and redacted from receipts;
- simulated evidence is tagged `SIMULATED` and cannot satisfy production evidence gates.

## Acceptance
State transitions are replayable from seed + action log, snapshots have canonical digests, unknown operations fail closed, and tests cover PR/check/review/merge lifecycle plus stale-head rejection.

STOP CONDITION: `M55_S01_FROZEN`.