# M62 S05 — Release
Status: `FROZEN`

## Objective
Issue a deterministic production-acceptance decision from requirement, security, E2E, documentation and exact-head assurance evidence.

## PAR62 — Production Acceptance Receipt
Verdict: `ACCEPTED | REJECTED | INDETERMINATE`. Receipt binds candidate SHA, evidence digests, requirement counts, security counts, E2E status, documentation status, audit verdict and release identity.

## Release law
`ACCEPTED` requires all mandatory gates PASS and zero unresolved CRITICAL/HIGH. Any missing required evidence yields INDETERMINATE or REJECTED, never optimistic acceptance. Receipt is immutable-by-content digest and cannot self-promote checkpoint credit.

## Acceptance
Exact-head MAX_ASSURANCE green, production receipt reproducible, release identity bound, rollback/recovery references present, and promotion occurs only in a separate evidence-bound step.