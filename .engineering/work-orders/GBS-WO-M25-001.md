# GBS-WO-M25-001 — Implement Proof Graph

Status: `COMPILED_NOT_ADMITTED`
Risk: `HIGH`
Assurance intensity: `MAX_ASSURANCE`
Module: `GBS-M25 — Proof Graph`
Canonical package: `packages/proof-graph`
Canonical weight: `20`
Planning gate: `.engineering/gates/M25-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#239`

## OBJECTIVE
Implement the deterministic provider-neutral proof graph frozen in M25 S01-S05. The package must evaluate owner-declared proof obligations from current M24 evidence facts and nested proof dependencies, preserve exact proof states, support validity-bound carry-forward, selectively invalidate affected proof descendants and emit read-only downstream context without taking over upstream or assurance authority.

## REQUIRED IMPLEMENTATION
All 42 frozen mechanisms:
- S01: PIC25, PAB25, CCI25, PNI25, PEI25, POD25, PNS25, PIM25;
- S02: PDG25, DAG25, SER25, ESG25, CSG25, PRC25, ADC25, DCW25;
- S03: EVF25, OBF25, DCF25, PSF25, VCG25, PFW25, FCW25, FIR25;
- S04: PCG25, PCK25, CFC25, CFD25, CFW25, PCS25, SAR25, CFR25;
- S05: CIG25, PIV25, TIS25, UDW25, RCP25, PSC25, PIR25, PRG25, PSW25, DPH25.

## REQUIRED CONTRACTS
1. Proof states are exactly `PROVEN | UNPROVEN | STALE | CONFLICT | INDETERMINATE | TRUNCATED`.
2. Canonical claim meaning/ownership comes from upstream sources; M25 owns only proof relationships and sufficiency.
3. M24 evidence validity/acceptance remains authoritative and must be consumed through current recomputable provenance.
4. Sufficiency expressions are owner-declared `ALL | ANY | AT_LEAST`; M25 cannot silently weaken them.
5. Selected support sets are explicit and independently recomputable.
6. Duplicate/replayed semantic support counts once per obligation.
7. Cycles, namespace mismatch and divergent stable identities are represented explicitly rather than guessed through.
8. Proof fingerprints bind only relevant declared validity dependencies and never become authority by themselves.
9. Full carry-forward requires all relevant claim/obligation/policy/evidence/dependency inputs to remain current.
10. Partial carry-forward may preserve current child proofs but affected ancestors are recomputed.
11. Complete dependency knowledge permits targeted invalidation; incomplete knowledge widens impact explicitly.
12. Reopen projection is read-only; owner modules perform real DoD/progress/status/checkpoint transitions.
13. Proof snapshots bind graph, selected support, proof states, fingerprints, current M24 context and predecessor identity.
14. History replay/divergence/truncation remain visible.
15. DPH25 grants no M26/M27/DoD/progress/checkpoint authority.
16. Semantic core is startup-pure, deterministic, bounded/cancellable and uses injected domain-separated SHA-256.

## OUT OF SCOPE
- changing M12 DoD criteria/status;
- changing M17 checkpoint/next legal action;
- calculating M21 progress/denominator;
- changing M23 project status;
- validating producer evidence in place of M24;
- performing M26 delta review;
- deciding M27 assurance;
- durable graph/audit persistence owned by later storage/audit modules.

## REQUIRED EVIDENCE
- all 42 mechanism IDs represented exactly once in implementation registry;
- deterministic proof identity/manifest tests;
- M24 handoff/provenance integration tests;
- ALL/ANY/AT_LEAST, nested, diamond and cycle graph tests;
- duplicate/replay support tests;
- accepted/rejected/stale/conflict/unknown evidence-state tests;
- fingerprint current/stale/conflict/indeterminate tests;
- full/partial/recompute carry-forward tests;
- targeted and conservatively widened invalidation tests;
- reopen-candidate no-authority tests;
- snapshot/integrity/history tests;
- bounded/cancellable large-graph/history tests;
- startup purity;
- focused Ubuntu/Windows/macOS CI;
- full repository regression;
- `npm audit --audit-level=low`;
- Security CodeQL;
- dedicated exact-head MAX_ASSURANCE semantic/integrity audit;
- unresolved CRITICAL `0`, HIGH `0`;
- separate Evidence Bundle and MODULE_DONE promotion.

## ADMISSION RULE
This Work Order is compiled but not admitted. No implementation branch may claim legal M25 execution authority until the exact planning head passes semantic review, the planning PR is merged, a separate admission review passes, and the admitted execution base is bound in canonical state.

## CREDIT RULE
Planning/admission grant no production credit. M25 remains `0 / 20`; production remains `432 / 1088 = 39.71%` until implementation is evidenced, audited, merged and separately promoted MODULE_DONE.

STOP CONDITION: `GBS_WO_M25_001_COMPILED_NOT_ADMITTED`.
