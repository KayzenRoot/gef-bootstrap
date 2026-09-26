# GBS-M16-S01 — Policy Model & Authority
Status: `FROZEN_CANDIDATE`

## Objective
Represent enforceable engineering policies without replacing product decisions, source hierarchy or security owners.

## Technologies
- **Policy Authority Capsule (PAC)**: versioned rule, owner, scope, applicability, precedence domain, evidence and expiry/review trigger.
- **Guardrail Decision Algebra (GDA)**: new NECESSARY technology with `ALLOW`, `ALLOW_WITH_OBLIGATIONS`, `DENY`, `BLOCK_UNKNOWN`; no permissive unknown.
- **Policy Domain Lattice (PDL)**: new NECESSARY technology prevents one global rank from overriding unrelated authority domains.
- **Exception Warrant (EW)**: new NECESSARY signed/identified approval binding exception, scope, expiry and compensating controls.
- **Policy Provenance Chain (PPC)**: new NECESSARY source-to-decision trace.

Newest-wins, majority vote, model confidence and path order are forbidden authority mechanisms.

STOP CONDITION: `M16_S01_FROZEN_CANDIDATE`.