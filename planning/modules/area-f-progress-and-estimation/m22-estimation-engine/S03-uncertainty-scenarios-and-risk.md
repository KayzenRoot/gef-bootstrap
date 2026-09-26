# GBS-M22-S03 — Uncertainty, Scenarios & Risk
Status: `FROZEN`
Module weight: `15`
Assurance intensity: `ELEVATED`

## Objective
Freeze uncertainty-aware forecasting so M22 expresses what is known, unknown and model-sensitive instead of converting sparse history into false precision. Forecasts remain descriptive projections from admitted inputs; deadlines, desired dates and narrative optimism cannot bend the model.

## Technologies
- **Forecast Interval Envelope (FIE22)**: canonical lower/base/upper duration range with exact model/input bindings, interval policy and explicit availability state.
- **Scenario Triad (SCT22)**: deterministic optimistic/base/conservative projections derived from admitted throughput quantiles plus explicit source-bound modifiers, never arbitrary percentages.
- **Unknown Work Reserve (UWR22)**: explicit bounded reserve for admitted uncertainty that is not represented in the current M21 remaining-work vector; reserve origin, rationale and maximum effect are identity-bound.
- **Risk Adjustment Vector (RAV22)**: owner-labeled structured temporal modifiers for known schedule-impacting risks. M22 consumes these inputs but does not determine overall project risk/status.
- **False Precision Blocker (FPB22)**: prevents a single authoritative ETA/date when model dispersion, sample sufficiency or calibration quality does not justify that precision.
- **Deadline Commitment Firewall (DCF22)**: separates forecast truth from target/deadline inputs; a desired date may be compared with a forecast but can never alter observed throughput, interval construction or confidence.

## Invariants
1. Canonical forecast truth is an interval/scenario set, not a naked single date.
2. A scalar ETA may exist only as a clearly labeled presentation projection of an admitted interval, never as the canonical model state.
3. `lower <= base <= upper`; invalid/inverted ranges fail closed.
4. Scenario construction is deterministic from admitted throughput/model/risk inputs and independent of input enumeration order.
5. Unknown-work reserve is explicit. Hidden contingency or silent padding is forbidden.
6. Unknown reserve cannot reduce duration or increase confidence.
7. Risk modifiers are source-bound external inputs; M22 does not invent risk probability or project status.
8. A deadline/target cannot tighten the forecast interval, raise confidence, alter historical samples or change calibration state.
9. Sparse/high-dispersion history widens uncertainty or blocks estimation; it never increases precision.
10. Missing risk inputs are represented as unknown/incomplete when the policy requires them, not silently assumed safe.
11. Absolute completion timestamps may be projected only from an explicit injected `asOf` value and duration interval. System clock access is forbidden.
12. M23 remains owner of interpreting forecast/deadline facts into overall project status.

## ELEVATED obligations
- target/deadline bias attacks;
- interval inversion and reseal attacks;
- sparse/high-dispersion false-precision tests;
- unknown-reserve omission/mix-and-match tests;
- risk-owner spoofing tests;
- scenario permutation invariance;
- injected-asOf versus ambient-clock purity tests;
- conservative behavior when required risk knowledge is incomplete.

STOP CONDITION: `M22_S03_FROZEN`.
