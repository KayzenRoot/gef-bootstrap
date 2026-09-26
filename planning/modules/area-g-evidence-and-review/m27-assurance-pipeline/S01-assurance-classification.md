# GBS-M27-S01 — Assurance Classification

Status: `FROZEN`
Module: `GBS-M27 — Assurance Pipeline`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze M27 as the sole owner of assurance-class derivation for governed work. M27 converts canonical risk/context signals into a monotonic assurance floor and explicit requirements without allowing token, latency, file, search or test budgets to weaken that floor.

## Assurance taxonomy
Canonical classes, weakest to strongest:
1. `STANDARD`
2. `STANDARD_PLUS`
3. `ELEVATED`
4. `HIGH_ASSURANCE`
5. `MAX_ASSURANCE`

A caller may request a stronger class than the derived floor but can never downgrade it. Unknown or conflicting risk facts never lower the class.

## Frozen mechanisms
1. **AIC27 — Assurance Intent Capsule**: binds project, lineage, work/candidate identity, requested assurance class, assurance purpose and policy identity.
2. **AAB27 — Assurance Authority Boundary**: grants assurance-class/requirement/verdict authority only; explicitly denies source truth, evidence validity, proof mutation, HEDS review, test selection, Git, checkpoint, progress and status authority.
3. **ACF27 — Assurance Classifier**: deterministically derives the minimum assurance floor from canonical risk signals and caller request.
4. **ARP27 — Assurance Risk Profile**: canonical provider-neutral risk vector covering security boundary, secrets, signing, money, privileged authorization, destructive/irreversible effects, critical data integrity, cross-boundary state, release significance and uncertainty.
5. **HSF27 — High-Signal Fence**: prevents high-risk signals from being masked by lower-risk majority, caller preference or ordering.
6. **ABG27 — Assurance Budget Guard**: proves optimization budgets cannot downgrade assurance requirements or convert missing work into pass.
7. **FCE27 — Full-Context Escalation**: emits the required context-expansion floor when narrow context cannot satisfy the assurance class.
8. **ACG27 — Assurance Classification Gate**: independently verifies AIC27, risk profile, floor, caller request and policy binding before requirements can be compiled.

## Minimum-floor rules
- assurance-authority/proof-root/evidence-root integrity, critical signing/secrets/money/privileged authorization, destructive irreversible effects or critical data-integrity control => `MAX_ASSURANCE` unless a stronger future class exists;
- significant security boundary or highly destructive/recovery-sensitive work => at least `HIGH_ASSURANCE`;
- stateful/cross-boundary correctness with material operational blast radius => at least `ELEVATED`;
- integration/public-contract work without high-risk signals => at least `STANDARD_PLUS`;
- bounded low-risk local deterministic work => `STANDARD`.

Conflicting or missing mandatory risk facts yield an unresolved classification state and must not silently default to `STANDARD`.

## Ownership boundary
M24 owns evidence acceptance; M25 owns proof sufficiency/carry-forward/invalidation; M26 owns semantic delta review/findings; M27 owns assurance classification/requirements/verdict; M28 owns test-impact/test selection; M29 owns Git semantics; M17/M21/M23 retain checkpoint/progress/status.

## MAX_ASSURANCE proof families
Risk-order permutation, caller downgrade attempt, caller upgrade, conflicting risk sources, missing mandatory risk fact, high-signal minority vs low-signal majority, budget-pressure downgrade attack, cross-lineage intent mix, policy drift, cancellation and injected-digest failure.

STOP CONDITION: `M27_S01_FROZEN`.
