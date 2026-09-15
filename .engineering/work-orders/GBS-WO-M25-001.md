# GBS-WO-M25-001 — Implement Proof Graph

Status: `ADMITTED_READY_FOR_IMPLEMENTATION`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M25 — Proof Graph`
Canonical package: `packages/proof-graph`
Canonical weight: `20`
Planning gate: `.engineering/gates/M25-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#239`
Planning reviewed head: `db89e6a021cfc46cf89c62a1f8db36dc78baaf8b`
Planning reviewed tree: `22c5d75b4a880d2d2bfdd2d518ea8e197854cdc9`
Planning review: `5213821206`
Planning merge: `70fbfafa71e20e684ab9dbe740aede772d4cbe02`
Admission PR: `#240`
Admission reviewed head: `001353587f8784d70502ef80cef3af686980a26a`
Admission reviewed tree: `f55f178361b4a584e1ee2281c5db193dcd9cb117`
Admission review: `5213839166`
Admission merge / execution base: `2a9eba4ca11cec9463cb501ec7f64b26f1d96825`

## OBJECTIVE
Implement the deterministic provider-neutral proof graph frozen in M25 S01-S05. It evaluates owner-declared proof obligations from current M24 evidence facts and nested proof dependencies, preserves exact proof states, supports validity-bound carry-forward, selectively invalidates affected proof descendants and emits read-only downstream context.

## REQUIRED IMPLEMENTATION
All 42 frozen mechanisms:
- S01: PIC25, PAB25, CCI25, PNI25, PEI25, POD25, PNS25, PIM25;
- S02: PDG25, DAG25, SER25, ESG25, CSG25, PRC25, ADC25, DCW25;
- S03: EVF25, OBF25, DCF25, PSF25, VCG25, PFW25, FCW25, FIR25;
- S04: PCG25, PCK25, CFC25, CFD25, CFW25, PCS25, SAR25, CFR25;
- S05: CIG25, PIV25, TIS25, UDW25, RCP25, PSC25, PIR25, PRG25, PSW25, DPH25.

## CORE CONTRACTS
- proof states: `PROVEN | UNPROVEN | STALE | CONFLICT | INDETERMINATE | TRUNCATED`;
- canonical claim meaning/ownership remains upstream;
- M24 evidence validity/acceptance remains authoritative and is consumed with current provenance;
- expressions are owner-declared `ALL | ANY | AT_LEAST`;
- selected support is explicit and recomputable;
- duplicate semantic support counts once;
- cycles/namespace divergence remain explicit invalid graph state;
- fingerprints bind declared relevant validity inputs;
- full reuse requires current relevant claim/obligation/policy/evidence/dependency inputs;
- partial reuse reevaluates affected ancestors;
- targeted invalidation requires complete dependency knowledge, otherwise impact widens;
- reopen projection is read-only;
- proof snapshots bind graph, results, support, fingerprints, M24 context and predecessor identity;
- history duplicate/divergent/truncated state remains visible;
- DPH25 grants no DoD/progress/status/checkpoint/assurance authority;
- semantic core is deterministic, startup-pure, bounded/cancellable and uses injected domain-separated SHA-256.

## REQUIRED EVIDENCE
Implementation acceptance requires registry coverage of all 42 IDs, M24 provenance integration, ALL/ANY/AT_LEAST and nested/diamond/cycle graphs, duplicate/replay support, all M24 evidence states, fingerprint current/stale/conflict/indeterminate behavior, full/partial/recompute carry-forward, targeted/widened invalidation, snapshot/history recomputation, bounded/cancellable large graphs, startup purity, Ubuntu/Windows/macOS focused CI, full regression, `npm audit --audit-level=low`, Security CodeQL and exact-head MAX_ASSURANCE semantic/integrity review with CRITICAL `0`, HIGH `0`.

## EXECUTION BASE
The admitted implementation base is `2a9eba4ca11cec9463cb501ec7f64b26f1d96825`. Implementation branches must descend from this merge or a reviewed main descendant preserving the admitted contract.

## CREDIT RULE
Admission grants execution authority only. M25 remains `0 / 20`; production remains `432 / 1088 = 39.71%` until implementation is merged from approved evidence and separately promoted MODULE_DONE.

STOP CONDITION: `GBS_WO_M25_001_ADMITTED_READY_FOR_IMPLEMENTATION`.
