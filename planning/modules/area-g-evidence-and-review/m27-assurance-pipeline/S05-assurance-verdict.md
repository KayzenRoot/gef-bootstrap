# GBS-M27-S05 — Assurance Verdict, History & Handoff

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze the immutable, independently recomputable assurance verdict and history layer. A final assured state must be bound to one exact candidate/profile/policy/evidence/proof/review context and remain safely invalidatable when any relevant binding changes.

## Frozen mechanisms
1. **AVC27 — Assurance Verdict Capsule**: immutable final verdict bound to assurance class/profile, exact candidate/context identities, gate set, accepted evidence/proof/review receipts and reason codes.
2. **AIR27 — Assurance Integrity Receipt**: independently recomputes the semantic verdict from the same trusted inputs and detects verdict/gate/profile tamper.
3. **ASD27 — Assurance Semantic Digest**: canonical order-independent digest over the semantic assurance state, excluding presentation/provider transport noise.
4. **ATR27 — Assurance Transition Receipt**: records predecessor/successor assurance identities, changed assurance dimensions, source identities and reason codes.
5. **ARG27 — Assurance Replay Guard**: exposes exact duplicates, conflicting verdict IDs, bounded-history truncation and replay without newest-wins selection.
6. **ASW27 — Assurance Split-Brain Witness**: detects divergent valid successors from one predecessor assurance state.
7. **ARW27 — Assurance Reopen Witness**: explicit owner-authorized witness required to reopen or regress an `ASSURED` state after relevant candidate/policy/evidence/proof/review change.
8. **DAH27 — Downstream Assurance Handoff**: read-only owner-labeled handoff for M28/governance/release consumers; grants no test-selection, Git, checkpoint, progress or project-status authority.

## Final verdict model
M27 final states:
- `ASSURED`
- `CORRECTION_REQUIRED`
- `BLOCKED`
- `INDETERMINATE`
- `TRUNCATED`

`ASSURED` is admissible only when:
- classification and assurance profile are current;
- every mandatory assurance obligation is closed by accepted current evidence/proof/review truth;
- required validation-ladder floor is satisfied;
- final exact-candidate sweep is satisfied whenever required;
- no unresolved authority/policy/context conflict exists;
- no unresolved/indeterminate CRITICAL or HIGH finding remains;
- materialization/history is not silently truncated;
- the verdict admission gate passes under the same current policy/candidate binding.

Zero CRITICAL/HIGH is necessary but never sufficient by itself.

## Regression and reopen
A previously `ASSURED` candidate cannot silently become non-assured or be reused for a changed candidate. Relevant binding drift invalidates the current assured state. Reopen/regression history remains immutable and requires ARW27 when a governed transition explicitly reopens an assured lineage.

## Downstream boundary
DAH27 may expose assurance class, verdict, profile digest, gate-set digest, blocking reason/finding identities, exact candidate/context binding and semantic digest. It cannot pick tests (M28), operate Git (M29), promote checkpoint (M17), calculate progress (M21), compute overall project status (M23) or self-issue release authority (M33/M62).

## Determinism and integrity
Equivalent input permutations produce identical semantic verdict identity. Same verdict ID with divergent authenticated semantic payload is conflict, not overwrite. Same predecessor with divergent authenticated successors is split brain. History limits yield explicit `TRUNCATED`.

## MAX_ASSURANCE proof families
Verdict field tamper, reason-trace tamper, gate/profile mix-and-match, exact-candidate substitution, replay duplicate, same-ID divergence, split brain, assured-to-failed regression, silent reopen rejection, explicit reopen, history truncation, downstream authority escalation, permutation/property tests, cancellation and injected-digest failure.

STOP CONDITION: `M27_S05_FROZEN`.
