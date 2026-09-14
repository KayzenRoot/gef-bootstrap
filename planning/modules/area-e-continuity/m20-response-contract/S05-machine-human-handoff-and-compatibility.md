# GBS-M20-S05 — Machine/Human Handoff & Compatibility
Status: `FROZEN`
Module weight: `13`
Assurance intensity: `STANDARD_PLUS`

## Objective
Freeze a single semantic response that can be projected safely to machine and human consumers, with exact integrity/compatibility checks and stale-response rejection.

## Technologies
- **Machine Response Envelope (MRE20)**: deterministic structured projection containing schema identity, project/phase/current-work references, verdict, blockers, delegated metrics, next necessary action and provenance bindings.
- **Human Response Projection (HRP20)**: lossless human-readable projection derived only from the verified machine semantics; wording may vary but may not add authority, metrics or success claims.
- **Response Integrity Receipt (RIR20)**: binds response schema, canonical semantic digest, source/provenance digests and projection identities so tampering/mix-and-match is detectable.
- **Response Compatibility Gate (RCG20)**: validates supported schema/profile/capability versions and returns typed incompatibility instead of guessing field semantics.
- **Stale Response Sentinel (SRS20)**: revalidates checkpoint/resume/registry and delegated-claim bindings at emission/handoff boundary; stale response becomes non-success and must be rebuilt.

## Input/handoff contracts
M20 may consume:
- M17 canonical checkpoint/continuation identities;
- M18 resume decision/receipt/handback;
- M19 `RegistryHandoffContract` and integrity-bound registry facts;
- M16 policy/guardrail decisions when a response field is policy-sensitive;
- later M21/M22/M23 delegated progress/estimate/status claims when those modules exist.

M20 hands a verified semantic response to later artifact/operator/documentation surfaces without owning their rendering channels.

## Invariants
1. Human projection cannot contain a material claim absent from machine semantics.
2. Machine/human projections share the same semantic response identity.
3. Source changes after response construction invalidate emission when their bound identities differ.
4. Unsupported schema/profile/capability never silently downgrades semantics.
5. Response receipt proves response integrity, not M24/M25 evidence/proof ownership.
6. Ordinary imports and semantic APIs are startup-pure with no ambient filesystem/network/process access.

## Acceptance shape
M20 completion requires exact source/admission/head/tree binding, deterministic/tamper/no-fabrication tests, stale/mix-and-match tests, machine-human equivalence tests, compactness/redaction tests, Ubuntu/Windows/macOS matrix, full regression, dependency audit, semantic review, zero unresolved CRITICAL/HIGH and separate MODULE_DONE promotion.

STOP CONDITION: `M20_S05_FROZEN`.
