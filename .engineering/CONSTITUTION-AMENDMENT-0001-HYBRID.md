# Constitution Amendment 0001 — Hybrid Product Model

Status: `FROZEN_CANDIDATE`

Trigger: `EXPLICIT_USER_PRODUCT_DECISION`

Supersedes in part: `D-0047` and the v1.0 interpretation of `CONST-F1`.

## Decision
GEF Bootstrap is a **hybrid project**.

Its semantic brain remains the governed repository plus the Planning Agent/ChatGPT operating from canonical GitHub state. The product also includes a deterministic work plane for mechanical operations when code is the safer, cheaper or faster mechanism.

The deterministic work plane may be exposed through CLI commands, scripts, libraries or other bounded interfaces. A standalone CLI binary is not itself the constitutional requirement.

## Authority split
### Semantic plane
Owns product reasoning, architecture intent, scope admission, requirement interpretation, assurance policy, review semantics and governed supersession.

### Deterministic plane
May own repeatable mechanical operations such as artifact materialization, schema validation, fingerprint/hash computation, repository-state inspection, deterministic diff/index generation, receipt generation, conformance checks and other bounded transformations from known inputs.

The deterministic plane never silently becomes semantic authority.

## Self-construction policy
For the GEF Bootstrap repository itself, planning, implementation, tests, documentation, reviews, releases and production preparation are performed through ChatGPT in this project using the connected GitHub/tooling surfaces. **Codex is not used to build GEF Bootstrap.**

This self-construction constraint does not prohibit target repositories initialized by GEF from using Codex or other executors under their governed execution contracts.

## Version impact
Constitution version advances from `GBS-CONSTITUTION-v1.0` to `GBS-CONSTITUTION-v1.1`.

`GBS-CONSTITUTION-v1.0` remains historical truth for the state before this amendment.

## Stable constitutional impact
- `CONST-F1` is amended from instruction-first-only product boundary to hybrid semantic + deterministic product boundary.
- `CONST-F2` remains compatible: Planning Agent performs expensive reasoning; bounded executors perform prescribed work.
- `CONST-F3` is strengthened: deterministic tooling is justified by total safe engineering ROI, not by tooling for its own sake.
- `CONST-F5` remains unchanged: canonical repository truth outranks tool output.
- `CONST-F7` remains unchanged: deterministic execution does not create DONE without evidence.

## Supersession interpretation
`D-0047` remains historically valid but its statement that deterministic tooling is merely optional is superseded. The preserved invariant is that tooling is subordinate to governed semantic authority.

## New decisions
### D-0052 — GEF Bootstrap is a hybrid product
GEF Bootstrap V1 combines a governed semantic/instruction plane with a deterministic work plane. The deterministic plane is an official product component, while CLI is only one possible interface.

### D-0053 — Deterministic work plane is mechanically authoritative only
Code may deterministically materialize, validate, fingerprint, inspect and generate receipts from governed inputs, but may not silently decide product intent, architecture, scope admission or semantic review.

### D-0054 — GEF Bootstrap is self-built through ChatGPT, not Codex
The GEF Bootstrap repository itself is planned, implemented, tested, reviewed and prepared for production through ChatGPT and connected project tools. Codex is not an implementation executor for this repository. Target projects may still use Codex under GEF governance.

### D-0055 — Constitution advances to v1.1
The hybrid product decision is a governed constitutional supersession under `EXPLICIT_USER_PRODUCT_DECISION`; `GBS-CONSTITUTION-v1.1` becomes current after exact-state review and checkpoint promotion.

## Acceptance
This amendment is effective only after PR review, merge and checkpoint promotion. Until then, v1.0 remains the current canonical Constitution.
