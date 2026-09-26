# GBS-M20-S04 — Compactness, Determinism & Redaction
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Minimize response token/output cost without losing required truth, provenance, blockers, next action or assurance-relevant information.

## Technologies
- **Minimum Sufficient Response (MSR20)**: computes the smallest lossless semantic field set required by response kind, current verdict, blockers and continuation obligations.
- **Semantic Deduplication Map (SDM20)**: removes repeated equivalent claims/provenance references while preserving distinct authority, conflict and validity semantics.
- **Stable Field Ordering (SFO20)**: canonical code-point/stable-class ordering for deterministic machine projection, digesting and regression comparison.
- **Response Redaction Boundary (RRB20)**: excludes secret-like values, credentials and private locator material from portable/public projections while retaining opaque safe references when needed.
- **Response Size Guard (RSG20)**: explicit field/reference/byte pressure limits with typed `EXPANSION_REFERENCE_REQUIRED` or failure states rather than silent truncation of mandatory truth.

## Invariants
1. Token/output optimization cannot remove required blocker, verdict, next-action, authority or non-success information.
2. Deduplication operates on semantic identity, not merely equal display strings.
3. Mandatory data is never silently truncated to fit a budget.
4. Redaction cannot turn an unknown/blocked fact into apparent success.
5. Secret/private data is not embedded in portable/public response envelopes.
6. Stable machine ordering is independent of insertion order and presentation prose.

## Required tests
Semantic duplicates, same-text/different-authority claims, budget overflow, secret/private locator rejection, mandatory-field protection, deterministic permutations and safe compactness.

STOP CONDITION: `M20_S04_FROZEN`.
