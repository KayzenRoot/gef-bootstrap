# GBS-M07 — Template Engine Module Gate

Status: `PLANNED_READY_FOR_IMPLEMENTATION`

## Gate question
Is the frozen M07 planning complete, internally consistent and bounded enough to compile one implementation Work Order without reopening product semantics?

**Verdict: PASS.**

This verdict approves planning readiness only. It does not admit implementation, award production credit or mark M07 MODULE_DONE.

## Frozen planning evidence
- S01 Template Format: `FROZEN` — PR `#119` — review `5190406557` — merge `16f7a815db9d3b558dd2981e983bff65ecb5ac65`
- S02 Variables: `FROZEN` — PR `#121` — review `5190680179` — merge `fd51770fffc70a69bacbb615c636e169572fff11`
- S03 Conditional Templates: `FROZEN` — PR `#123` — review `5190780749` — merge `d48caf89f9b1e6e6d0fc583dc0e6d4716cc1712b`
- S04 Rendering: `FROZEN` — PR `#125` — review `5190797399` — merge `9c1e7b0bc63178a62f5255a336aeba0b95fab990`
- S05 Validation: `FROZEN` — PR `#127` — review `5190820656` — merge `2e132da73a07fffbf813f4075fb19cdc89b083b2`

All normative companions (`S02-FREEZE`, `S03-PROOF`, `S04-PROOF`, `S04-FREEZE`, `S05-PROOF`, `S05-FREEZE`) are part of the implementation contract.

## Gate result
- planning completeness: `PASS`
- S01/S02/S03/S04/S05 ownership separation: `PASS`
- deterministic/non-executable template language: `PASS`
- explicit typed variables/provenance/no ambient binding: `PASS`
- BOOLEAN-only bounded condition semantics: `PASS`
- deterministic single-pass rendering: `PASS`
- final logical target/collision validation: `PASS`
- brownfield no-delete-by-omission: `PASS`
- no implicit ownership/overwrite authority: `PASS`
- M05/M06 effect boundary preserved: `PASS`
- secret/reference boundary preserved: `PASS`
- body-minimized evidence/digest-not-trust rule: `PASS`
- bounded/cancellable/startup-pure execution model: `PASS`
- future proof matrices are sufficient for Work Order compilation: `PASS`

## Implementation placement
M07 SHALL be implemented as a dedicated domain package:

`packages/template-engine`

Rationale:
- M07 is a pure reusable product domain, unlike M05/M06 transaction/filesystem infrastructure in `packages/kernel`;
- workspace topology already supports `packages/*`;
- domain packages such as config/project-identity/preflight establish the modular pattern;
- keeping M07 out of kernel prevents transaction and template semantics from becoming mutually coupled.

The package is library-first and MUST NOT depend on CLI text parsing.

## Dependency boundary
The initial package should depend only on shared contracts that are actually needed. It MUST NOT import `packages/kernel` merely to render/validate templates.

Physical source acquisition and hashing use narrow injected ports/capabilities. A caller/orchestration layer may compose those ports with M06/M37-compatible capabilities without creating a template-engine → kernel ownership dependency.

The package MUST NOT directly perform project writes, process execution, provider calls or broad repository discovery.

## Public capability shape
The Work Order must implement a small typed API covering the frozen pipeline conceptually equivalent to:

`load/parse format → resolve variables → select conditions → render → validate`

A convenience end-to-end evaluator may compose those pure stages, but each stage retains its frozen typed result/error boundary and no stage may skip a downstream gate.

The exact exported symbol names are implementation detail, but the public API must preserve immutable descriptors/snapshots and explicit input ports/budgets/cancellation.

## Gate closure clarifications
These additive clarifications close implementation ambiguity without reopening frozen session semantics:

1. **Duplicate JSON member names fail closed.** `template.json` must not use last-key-wins behavior at any object level. Strict parsing must detect duplicate member names before semantic admission.
2. **Parsed JSON is data only.** Validation/normalization must use own data fields and must not use prototype-sensitive object merging or let keys such as `__proto__`, `constructor` or `prototype` mutate runtime object prototypes.
3. **Contract versions are explicit constants.** The Work Order must define supported S01-S05 schema/contract versions and reject unsupported versions; there is no best-effort fallback.
4. **Digest policy is injected/versioned.** M07 may compute equality identities through an explicit digest port/contract, but cannot define trust/authorship policy owned by M37.
5. **Source reads are exact and capability-driven.** The implementation reads only the admitted manifest and referenced sources through an explicit source-read port; no cwd/home fallback, recursive repo scan or remote include is introduced.
6. **No hidden filesystem cache.** Any cache/reuse is in-memory/request-scoped or otherwise explicitly injected and dependency-bound; importing the package performs no I/O.

## Work Order implementation surface
The single M07 implementation Work Order must include at minimum:
- new `packages/template-engine` package metadata, tsconfig, exports and source modules;
- root workspace build/typecheck integration;
- strict runtime validation for untyped JavaScript callers;
- bounded strict JSON/UTF-8/marker parsing;
- deterministic canonical serialization/digest inputs;
- S01 format descriptor and exact-source loading port;
- S02 variable declaration/resolution snapshot;
- S03 condition tree/selection snapshot;
- S04 render snapshot with immutable exact content representation;
- S05 validation snapshot/desired-artifact handoff;
- typed compact errors with no source-body/secret leakage;
- cancellation/deadline and finite budget propagation;
- startup/import purity;
- complete frozen proof-family coverage;
- full repository regression validation.

## Integration constraints
M07 validated output may be translated by orchestration into M05 desired-state planning inputs, but M07 itself MUST NOT:
- set M05 authorization/security class by implication;
- claim existing-file ownership;
- infer overwrite permission;
- create REMOVE/MOVE intents by template omission;
- invoke M06 physical write primitives;
- treat digest equality as trust.

A focused integration test must demonstrate that M07 output can feed the existing M05/M06 workflow only through explicit downstream planning while preserving these boundaries.

## Cross-platform proof
Core M07 semantics are host-independent by contract. Final implementation evidence must include:
- deterministic portable fixtures for Windows/Linux/macOS path/text cases;
- a focused CI matrix on Ubuntu, Windows and macOS for M07 portability/startup-purity tests;
- normal repository validation on the exact reviewed head.

The focused platform matrix should remain narrow to control CI cost; it need not rerun the full repository suite three times.

## Security/adversarial proof focus
The Work Order must include adversarial fixtures for at least:
- duplicate JSON keys and prototype-sensitive names;
- malformed/reserved markers and excessive nesting;
- oversized manifests/sources/variables/output;
- traversal/absolute/device target forms;
- case/prefix target collisions;
- marker injection through variable values;
- explicit secret-material rejection/redaction behavior;
- stale/mismatched stage snapshots;
- tampered render content/digest/length identities;
- cancellation at each read/parse/evaluate/render/validate phase;
- import/startup no-I/O behavior.

## Performance contract
Implementation must preserve the frozen structural economy:
- exact referenced reads only;
- one lexical scan per text source;
- no second marker pass after substitution;
- no binary text decoding;
- indexed variable/condition lookup;
- short-circuit only runtime-inactive conditions;
- streaming/incremental digest where practical;
- no unnecessary duplicate full-output copies;
- metadata-only collision validation;
- compact evidence.

M63 owns measured numeric thresholds.

## Production accounting
- M07 module weight: `14`
- earned now: `0 / 14`
- total remains: `125 / 1088 = 11.49%`
- remaining remains: `963 / 1088 = 88.51%`
- denominator change: `NONE`

## Gate handoff
After exact-head review and merge of this Gate, the next legal stage is to update the checkpoint to authorize **compilation only** of `GBS-WO-M07-001`.

No implementation may begin until that Work Order is separately compiled, reviewed, merged and then admitted by a separate checkpoint.

STOP CONDITION: `M07_GATE_PLANNED_READY_FOR_IMPLEMENTATION`.
