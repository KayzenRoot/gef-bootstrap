# GBS-M28-S04 — Uncertainty Escalation

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Source directive: `ADR-0002`

## Planning objective
Freeze fail-closed escalation and the final exact-head assurance boundary. Selective validation is an optimization only while dependency/test knowledge is sufficient.

## Owner-directed technology candidates
- TECH-0058 Exact-Head Full Sweep Gate (EHFG);
- uncertainty-driven test-radius widening;
- final-head evidence invalidation receipt;
- platform/assurance escalation map;
- stale TPRR quarantine.

## Escalation triggers
Broaden from selective validation when any material trigger exists:
- dependency graph incomplete or conflicting;
- changed source has no reliable test mapping;
- assurance policy names a mandatory broader suite;
- security-sensitive or recovery-sensitive path requires it;
- platform behavior cannot be proven equivalent;
- repeated local failure suggests systemic impact;
- seed/navigation/source bindings drift materially;
- prior proof receipt is stale/forged/indeterminate;
- final candidate head changes after evidence was issued.

## Exact-head rule
Before acceptance, M28 must provide the test-impact/validation facts required by the Work Order and M27. If full regression, security, E2E, CodeQL or multi-platform suites are required, they run on the **exact final candidate head**.

Intermediate reuse cannot manufacture final-head evidence.

## Final-head mutation
A subsequent change invalidates only affected evidence when dependency knowledge is complete. When knowledge is incomplete, invalidation widens conservatively.

## Safety invariants
- no newest-pass wins;
- no cache entry can override a current failure;
- unknown platform relevance cannot be assumed portable;
- skipped intermediate test must have a reason/receipt;
- final assurance cannot be downgraded by performance preference;
- cancellation/truncation are explicit and cannot yield COMPLETE.

## Required attacks for later freeze
Final head moved by one byte, changed test after PASS, changed config, unknown platform branch, incomplete dependency graph, old green cache plus current failure, assurance-policy drift, cancellation during final sweep and conflicting result histories.

This is an owner-directed planning seed only. No M28 progress or assurance verdict is claimed.
