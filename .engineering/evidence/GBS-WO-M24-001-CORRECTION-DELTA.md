# GBS-WO-M24-001 — Correction Delta

Status: `CLOSED_PENDING_EXACT_HEAD_AUDIT`
Module: `GBS-M24 — Evidence Engine`
Work Order: `GBS-WO-M24-001`
Implementation PR: `#237`
Assurance intensity: `MAX_ASSURANCE`

## Trigger
M24 implementation was deliberately opened as an unapproved CI/audit workbench. The first CI pass exposed a non-semantic TypeScript literal-union inference defect. Subsequent MAX_ASSURANCE semantic inspection then identified trust-boundary and canonical-verification shortcuts that were required to be closed before any exact-head approval.

No affected head was merged and no M24 production credit was awarded.

## Mechanical correction
The initial focused typecheck rejected four inferred `string` values where the frozen contracts require typed receipt/freshness/acceptance state unions. The implementation now uses the frozen state algebras explicitly rather than relying on broad inference.

## Trust-boundary hardening
The following semantic hardening was completed without changing the frozen M24 Source Pack or ownership boundaries:

1. **External trust-anchor enforcement** — structurally valid `AuthorityRootSet` objects cannot authorize evidence by themselves. Authoritative producer validation now requires externally injected trusted canonical root digests; missing, untrusted or conflicting roots fail closed.
2. **No M24 self-root** — `M24_EVIDENCE` remains an acceptance owner only and cannot become the root authority for the producer truth that M24 validates.
3. **No bare-receipt authority** — EAC24, DPC24 and M12 evidence-reference integration no longer accept caller-supplied decision receipts as authoritative inputs. They recompute the full evidence evaluation from trusted root, authority index, manifest, exact subject and freshness inputs.
4. **No newest/lexical-wins downstream selection** — divergent evaluations for the same evidence ID become explicit `CONFLICT`; digest ordering cannot silently select an accepted state.
5. **No evidence-ID first-wins** — when MEM24 preserves divergent semantic items sharing one stable evidence ID, EVG24 fails closed before selecting any variant.
6. **Intent-to-item binding** — EVG24 verifies project/lineage plus subject kind, subject ID, requested evidence kind and claim scope before evidence may be evaluated.
7. **Identity-domain enforcement** — the public subject-state boundary rejects Git/provider/runtime/platform identity-domain substitution at runtime, rather than trusting TypeScript shape alone.
8. **Receipt reseal resistance** — a `VALID` validation receipt cannot be transformed into a rejection receipt; accepted/rejected/stale/conflict outcomes remain constrained by their creation preconditions.
9. **Freshness privacy/safety** — conflict-subject identifiers are stable safe IDs; unsafe path-like values cannot enter canonical freshness semantics.
10. **Conservative invalidation preserved** — incomplete dependency knowledge widens the invalidation set rather than claiming false precision.
11. **Canonical derived-field verification** — `AuthorityRootSet`, `SourceAuthorityIndex` and `MachineEvidenceManifest` verification now requires the entire canonical recomputation to equal the presented value. A caller cannot keep an old digest while altering duplicate/conflict ledgers, claim mappings or other derived fields.
12. **BIC24/CBB24 authority separation** — BIC24 remains the structural binding-integrity certificate frozen by S03. CBB24 is the authority gate for cross-boundary translation. A structurally valid compatibility witness is not authority by owner label alone.
13. **Trusted compatibility authorization** — CBB24 requires the compatibility witness `authorizationDigest` to appear in an externally injected trusted compatibility-authorization set. Missing or mismatched authorization fails closed.
14. **EVG24 enforces CBB24** — any non-exact evidence binding that relies on compatibility translation must pass CBB24 before validation can result in acceptance. EVG24 cannot treat structural BIC translation as authorization.
15. **Producer-chain trust preserved** — PCE24 requires a trusted root set and a non-conflicting authorized producer decision; an unauthorized decision cannot be wrapped into a producer chain.

## Adversarial evidence
The focused M24 suite covers trust roots, owner/kind scope escalation, privacy membrane, manifest permutation, duplicate-ID split brain, first-wins rejection, exact binding, identity-domain confusion, intent/item mix, compatibility-witness structure, digest-domain separation, cross-lineage splice, freshness states, receipt reseal/replay/truncation, conservative invalidation, M21 handoff authority, M12 read-only integration, M25/M27 no-authority handoff and operation-budget fail-closed behavior.

A dedicated `m24-cbb-smoke-2.test.mjs` regression additionally proves that a compatibility witness authorization is rejected without an injected trusted authorization digest and accepted only when that exact authorization digest is trusted. It runs under the repository-wide regression suite.

## Scope / accounting impact
- frozen Source Pack change: `NONE`;
- denominator change: `NONE`;
- upstream-owner semantic mutation: `NONE`;
- M24 earned production credit: `0 / 20` until separate MODULE_DONE promotion;
- project production remains `412 / 1088 = 37.87%` until that promotion.

## Exact-head requirement
This correction record changes the PR head. The new immutable head must independently pass focused Ubuntu/Windows/macOS CI, strict TypeScript, full repository regression, dependency audit, Security CodeQL and exact-head semantic/security review with unresolved CRITICAL `0` and HIGH `0` before implementation merge.

STOP CONDITION: `GBS_WO_M24_001_CORRECTION_DELTA_CLOSED_PENDING_EXACT_HEAD_AUDIT`.
