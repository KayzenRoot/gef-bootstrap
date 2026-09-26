# GBS-M25-S03 — Validity Fingerprints

Status: `FROZEN`
Module: `GBS-M25 — Proof Graph`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze deterministic validity fingerprints for proof reuse. A fingerprint is a compact comparison surface, not an authority source.

## Frozen mechanisms
1. **EVF25 — Evidence Validity Fingerprint**: binds the M24 evidence identity and current validity identity used by a proof leaf.
2. **OBF25 — Obligation Binding Fingerprint**: binds the owning source and exact obligation declaration.
3. **DCF25 — Dependency Closure Fingerprint**: binds the reachable dependency closure and selected support topology.
4. **PSF25 — Proof Semantic Fingerprint**: binds claim, obligation, selected support set, dependency closure and proof-policy namespace.
5. **VCG25 — Validity Compatibility Gate**: compares prior and current relevant inputs.
6. **PFW25 — Proof Freshness Witness**: emits `CURRENT | STALE | CONFLICT | INDETERMINATE` with changed or missing subjects.
7. **FCW25 — Fingerprint Conflict Witness**: preserves divergent current fingerprints for one governed identity.
8. **FIR25 — Fingerprint Integrity Receipt**: recomputable receipt for fingerprint components and comparison result.

## Rules
- fingerprints bind only declared validity dependencies;
- equality means relevant normalized inputs match, not that authority is granted;
- wall-clock age alone is not a generic validity rule;
- unrelated presentation or unused alternatives do not change proof semantics;
- incomplete required dependency knowledge yields `INDETERMINATE`;
- known relevant change yields `STALE`;
- incompatible current observations yield `CONFLICT`;
- exact verified relevant inputs yield `CURRENT`;
- a weaker or incomplete prior binding cannot satisfy a stronger current obligation;
- project/lineage namespace remains exact;
- M25 cannot create compatibility that is not supplied by an owning source.

## Technology alignment
This session provides the validity-fingerprint basis of `TECH-0025 — Proof Carry-Forward Graph`: only proofs with compatible relevant inputs may be considered for reuse.

## Required proof families
Deterministic recomputation, relevant and irrelevant input changes, missing dependency knowledge, namespace mismatch, divergent current observations, nested proof changes, bounded execution, cancellation and startup purity.

STOP CONDITION: `M25_S03_FROZEN`.
