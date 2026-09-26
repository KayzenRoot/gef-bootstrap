# GBS-M28-S04 — Uncertainty Escalation

Status: `FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`
Source directive: `ADR-0002`

## Objective
Freeze fail-closed uncertainty handling and the final M28 downstream handoff. S04 ensures incomplete source/test knowledge, stale reuse proof, conflicting identities, dynamic test discovery, cancellation or truncation can only preserve or widen validation. M28 never converts uncertainty into a smaller test set or an assurance PASS.

## Frozen mechanisms
1. **UCL28 — Uncertainty Classifier**: deterministically classifies uncertainty as `NONE | LOCAL | BOUNDARY | SYSTEMIC | CONFLICT | UNKNOWN | TRUNCATED` with explicit reason codes and affected subjects.
2. **UEW28 — Uncertainty Escalation/Widening**: maps uncertainty classes to a monotonic validation-radius increase; no uncertainty state can lower an already required PVL28 level.
3. **DTS28 — Dynamic Test Surface Sentinel**: detects unmodeled/dynamic test discovery, generated suites, runtime registration and other surfaces that make a static source/test map incomplete.
4. **XCG28 — Cross-Context Guard**: blocks reuse/selection receipts spliced across project, lineage, candidate, policy, runtime, toolchain, platform or mapping identities.
5. **EH28 — Exact-Candidate Handoff**: emits the concrete exact-candidate validation set and completeness statement required for M27's L5/EHF27 evaluation, without itself issuing the assurance verdict.
6. **VWS28 — Validation Wave Specification**: partitions selected validations into dependency-safe waves with constraints and evidence-attribution IDs; M63 may schedule them and M32 may execute them, but neither may silently remove obligations.
7. **TIR28 — Test Impact Result**: immutable independently recomputable final M28 result containing map/impact/radius/reuse/uncertainty state, required tests, reusable tests, unresolved obligations and result digest.
8. **TIH28 — Test Impact Handoff**: read-only downstream handoff binding TIR28 to the exact consumer/context and explicitly denying Git, CI, checkpoint, progress, release and assurance-verdict authority.

## Uncertainty escalation rules
The widening function is monotonic and deterministic:
- `NONE`: no additional widening beyond the current impact/risk/assurance radius;
- `LOCAL`: include affected direct and dependency closure, at least through the locally uncertain surface;
- `BOUNDARY`: include the affected boundary family and required L3 checks;
- `SYSTEMIC`: widen to L4 broad regression or stronger policy-required radius;
- `CONFLICT` or `UNKNOWN`: cannot justify selective omission; widen to the strongest safe radius required by current policy, potentially L5;
- `TRUNCATED`: result remains visibly incomplete and cannot be used as a completeness proof; execution must resume or widen according to policy.

If multiple uncertainty signals exist, the strongest required widening wins. Caller budget, latency pressure or desired test count never weakens it.

## Exact-candidate contract
EH28 is the bridge between concrete M28 selection and M27 assurance policy:
- M27 decides whether L5 exact-candidate assurance is mandatory;
- M28 computes the concrete current test set and proves whether impact knowledge is complete enough for that set;
- M32 executes the admitted CI work;
- M24 accepts resulting evidence;
- M25 may prove sufficiency/carry-forward;
- M26 may review semantic deltas/findings;
- M27 evaluates final assurance.

EH28 MUST bind candidate semantic identity, active assurance profile/policy, test-map digest, selected-set digest, config/runtime/toolchain/platform identities and unresolved uncertainty. A changed binding invalidates the handoff.

## Validation wave boundary
VWS28 describes safe wave topology only: prerequisite edges, parallel-eligible groups, shared-state/resource exclusions, platform/provider constraints, evidence-attribution identity and stop/escalation conditions.

M63 owns optimization of execution order/concurrency/critical path. M32 owns actual CI orchestration. A scheduler may merge compatible waves for efficiency but may not delete a selected obligation or merge evidence identities in a way that hides failure.

## Final M28 states
`READY | WIDENED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`.

`READY` means M28 has a current deterministic selection/reuse/radius result for downstream execution. It does not mean tests passed and does not mean M27 assurance is `ASSURED`.

`WIDENED` means uncertainty/risk/policy increased the radius but the resulting plan is current and executable.

`CORRECTION_REQUIRED` covers correctable map/receipt/identity defects. `BLOCKED` covers hard authority/policy conflicts. `INDETERMINATE` covers unresolved truth. `TRUNCATED` preserves bounded/cancelled incomplete work.

## Required attacks and proofs
Unknown changed source with no mapping; hidden dynamic test registration; generated suite drift; stale map plus green receipt; conflicting map authorities; cross-project/cross-lineage splice; candidate/config/runtime/toolchain/platform drift; policy escalation after selection; caller test-budget pressure; cancellation; traversal bound exhaustion; exact-candidate change after EH28; VWS28 group omission; scheduler removing an obligation; downstream consumer mismatch; forged TIR28/TIH28 digest; ordering/permutation and split-brain result histories.

## Downstream authority denial
TIH28 may grant read-only access to current concrete test-impact truth. It cannot grant M27 assurance-verdict authority, M29 Git mutation/identity authority, M32 CI execution authority, M17/M21/M23 checkpoint/progress/status authority or M33/M62 release/final acceptance authority.

Planning result: M28 fails closed under uncertainty, preserves exact-candidate assurance, and exports concrete validation obligations without becoming the executor or final judge.

STOP CONDITION: `M28_S04_FROZEN`.