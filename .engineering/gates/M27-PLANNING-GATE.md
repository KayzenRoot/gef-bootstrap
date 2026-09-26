# M27 Planning Gate

Status: `PASSED`
Module: `GBS-M27 — Assurance Pipeline`
Sessions: `5 / 5 FROZEN`
Frozen weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Frozen source set
- `planning/modules/area-g-evidence-and-review/m27-assurance-pipeline/S01-assurance-classification.md`
- `planning/modules/area-g-evidence-and-review/m27-assurance-pipeline/S02-assurance-requirements.md`
- `planning/modules/area-g-evidence-and-review/m27-assurance-pipeline/S03-assurance-admission.md`
- `planning/modules/area-g-evidence-and-review/m27-assurance-pipeline/S04-assurance-gates.md`
- `planning/modules/area-g-evidence-and-review/m27-assurance-pipeline/S05-assurance-verdict.md`
- `.engineering/ledgers/M27-ASSURANCE-PIPELINE-LEDGER-SYNC.md`

## Mechanism families
1. AIC27, AAB27, ACF27, ARP27, HSF27, ABG27, FCE27, ACG27.
2. ARM27, APM27, OBG27, PCG27, DAB27, PHG27, HHG27, RCS27.
3. EAG27, PSG27, HSG27, ECG27, UAG27, BSG27, CAG27, AER27.
4. AEP27, LFG27, EHF27, RPG27, SAG27, CFG27, BMG27, VAG27.
5. AVC27, AIR27, ASD27, ATR27, ARG27, ASW27, ARW27, DAH27.

Total frozen mechanisms: `40`.

## Assurance model
Canonical strength order is `STANDARD < STANDARD_PLUS < ELEVATED < HIGH_ASSURANCE < MAX_ASSURANCE`. Caller request can raise, never lower, the derived risk floor. Missing or conflicting mandatory risk truth cannot default to a weak class. Security boundaries, money, signing, secrets, privileged authorization, destructive/irreversible effects and critical data integrity force the appropriate stronger floor.

Optimization budgets for tokens, searches, files, tests or latency never override assurance obligations.

## Authority boundary
M27 owns assurance taxonomy/classification, assurance requirement profiles, assurance gates, final assurance verdict/history and read-only downstream assurance handoff. M24 remains evidence authority; M25 remains proof authority; M26 remains semantic-review authority; M28 remains test-impact/test-selection authority; M29 remains Git authority; M32 remains CI orchestration; security/reliability owners keep their control truth; M17/M21/M23 keep checkpoint/progress/status; M33/M62 keep release/final production acceptance.

## Exact-candidate assurance
`TECH-0058 — Exact-Head Full Sweep Gate` is reconciled as EHF27. M27 decides whether the profile requires the final exact-candidate sweep; it does not select concrete tests. Before M29 exists, the semantic core binds canonical provider-neutral candidate/config/runtime/toolchain identities. M29 may later add Git head/tree identity through an owner-authorized adapter without changing M27 core semantics.

Any relevant production-semantic change after final assurance invalidates affected final evidence. Reuse requires explicit owner-authorized compatibility; filename or caller claims are insufficient.

## Verdict model
Final states are `ASSURED | CORRECTION_REQUIRED | BLOCKED | INDETERMINATE | TRUNCATED`.

`ASSURED` requires current class/profile/policy/candidate binding, complete mandatory assurance obligations, current accepted evidence/proof/review context, required validation-ladder floor, exact-candidate sweep where required, no unresolved authority/context conflict, no silent truncation and unresolved/indeterminate CRITICAL/HIGH findings equal to zero. Zero CRITICAL/HIGH is necessary but not sufficient.

## MAX_ASSURANCE implementation acceptance
Implementation must cover 40/40 registry, taxonomy monotonicity/property tests, caller downgrade/upgrade behavior, high-signal masking attacks, budget override attacks, M24/M25/M26 current-handoff verification, stale/mix-and-match facts, obligation ownership and policy conflicts, uncertainty widening, severity integrity, ladder-floor enforcement, exact-candidate final-sweep invalidation, config/runtime/platform/security drift, TOCTOU freshness, verdict/integrity recomputation, replay/split-brain/regression/reopen/truncation, downstream authority denial, bounded/cancellable execution, injected SHA-256, startup purity, focused Ubuntu/Windows/macOS CI, full regression, dependency audit, CodeQL when triggered, exact-head MAX_ASSURANCE semantic/integrity review with CRITICAL `0`, HIGH `0`, and separate MODULE_DONE promotion.

## Implementation seed
Canonical package: `packages/assurance-pipeline` with the planned file/test/workflow map frozen in the ledger sync. Admission may materialize only this bounded surface unless a reviewed correction explicitly changes the plan.

Planning verdict: `READY_FOR_WORK_ORDER_ADMISSION_REVIEW`.
Implementation remains forbidden until separate admission audit/merge and execution-base binding.

STOP CONDITION: `M27_PLANNING_FROZEN_READY_FOR_ADMISSION`.
