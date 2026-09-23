# ADR-0001 — Complete Production Target

Status: `APPROVED`

## Trigger
`EXPLICIT_USER_PRODUCT_DECISION`

The Project Owner explicitly decided that GEF Bootstrap will not pursue a deliberately reduced MVP/small-V1 release. The project may take longer; the goal is one complete production-quality hybrid product containing all approved useful capability.

## Supersession effect
This ADR supersedes only the **release-minimization interpretation** of older V1 scope language. It does not invalidate stable IDs, frozen engineering principles, assurance rules or the requirement that scope remain governed.

Where older decisions say `IMPORTANT`/`FUTURE` work stays outside a small V1 denominator, Scope now re-evaluates those capabilities under the complete-product model. Difficulty or schedule alone is not a deferral reason.

## Decisions

### ADR-0001-D1 — Single complete production target
Canonical completion target is `PRODUCTION_RELEASE_DONE`. Legacy `V1` labels remain historical/internal identifiers until governed cleanup and do not imply a reduced first release.

### ADR-0001-D2 — Stable module reframes
Stable IDs are preserved while canonical names become:
- `GBS-M01` — Deterministic Work Plane Kernel
- `GBS-M47` — Interaction & Operator UX
- `GBS-M49` — Distribution & Setup
- `GBS-M62` — Production Acceptance

Physical path renames occur later through governed migration after Architecture determines the safe approach.

### ADR-0001-D3 — Ecosystem adapters are official but non-blocking
Optional ecosystem adapters remain separately activatable tracks implemented over the Generic Adapter API. Independent `PRODUCTION_RELEASE_DONE` does not require those adapters to be installed or connected. An adapter can be claimed as shipped only after its own compatibility, tests, documentation and evidence pass.

### ADR-0001-D4 — Experimental capability promotion is evidence-gated
Advanced heuristic/learned technologies remain in the complete product program and must pass all applicable gates before production promotion:
1. Utility Gate
2. Assurance Gate
3. Validity/Stability Gate
4. Engineering ROI Gate

Failure keeps the technology governed for redesign/retest rather than silently declaring it production-ready or deleting its history.

### ADR-0001-D5 — GitHub is the hosted reference implementation
The complete core requires provider-neutral version-control/platform contracts plus the GitHub reference profile and conformance evidence preventing GitHub-specific semantics from leaking into core. A second hosted provider is not mandatory for `PRODUCTION_RELEASE_DONE`.

### ADR-0001-D6 — Production progress uses weighted obligations
The main production denominator includes `CORE_REQUIRED`, `PRODUCT_INCLUDED` and production-admitted `EXPERIMENTAL_GATED` work. `OPTIONAL_ADAPTER` work is tracked separately unless explicitly included in a release claim.

Module raw weights use four evidence-backed dimensions from 1–5:
- `E` implementation/planning effort
- `R` engineering/security/operational risk
- `I` integration/dependency breadth
- `P` proof/validation burden

`RAW_WEIGHT = E + R + I + P`.

Overall percentage remains `NOT_YET_BASELINED` until Scope + DoD + admitted backlog + reviewed weights exist. Recalibration after baseline freeze requires a governed before/after impact record.

## Consequences
- All 64 current modules remain in the complete product program; 47 are CORE_REQUIRED, 14 PRODUCT_INCLUDED and 3 OPTIONAL_ADAPTER.
- Schedule pressure alone cannot move coherent useful capability out of the production target.
- Completeness does not authorize indiscriminate feature accumulation; new capability still requires alignment, ownership, proof and maintenance justification.
- Architecture and implementation remain unstarted until the ordered Source Pack sequence permits them.
- GEF Bootstrap continues to be built entirely through ChatGPT and connected project tools; Codex is not its implementation executor.

## Canonical owner
`.engineering/SCOPE.md` owns the detailed module classification. This ADR owns the product-release decision and supersession rationale.
