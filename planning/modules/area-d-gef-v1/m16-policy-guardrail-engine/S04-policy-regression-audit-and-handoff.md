# GBS-M16-S04 — Policy Regression, Audit & Handoff
Status: `FROZEN_CANDIDATE`

## Objective
Detect weakened guardrails and provide stable bindings to continuity/evidence modules.

## Technologies
- **Policy Regression Sentinel (PRS)**: new NECESSARY detects deny->allow, obligation loss, broader exception, authority downgrade and unknown->allow.
- **Guardrail Coverage Map (GCM)**: new NECESSARY maps protected operations/domains to active policy obligations.
- **Policy Semantic Fingerprint (PSF)**: normalized digest over effective semantics.
- **Exception Debt Register (EDR)**: new IMPORTANT technology tracks active exceptions, review triggers and unresolved compensating controls.
- **Continuity Policy Binding (CPB)**: new NECESSARY lets M17/M18 preserve/revalidate policy state across checkpoints/resume.

STOP CONDITION: `M16_PLANNING_COMPLETE_READY_FOR_GATE`.