# Proposed V1.2 Test and Benchmark Plan Delta

**State:** `PROPOSED / NOT_CANONICAL`

## Baseline

V1.1.2 WO-000 baseline is the comparison floor:
- source commit `203dc6a86de035b8502453100ea6e2a4788cae57`;
- full validation 1632/1632 PASS;
- focused baseline 84/84 PASS;
- zero dependency vulnerabilities at audit;
- CLI ROI NO_CHANGE / COMPARABLE;
- brownfield timing NOT_YET_BASELINED;
- token metrics UNAVAILABLE.

## Test ladder

### T1 Existing regression floor
V1.1.2 accepted behavior remains green.

### T2 Unit/component
Every new contract/adapter receives deterministic unit/component tests.

### T3 Contract/property assurance
Bug Hunter requirements/invariants must map to executable proof where practical.

### T4 Selective mutation
Mutation analysis is bounded and targeted to critical admitted logic. It is not a universal full-repository release blocker unless a later WO proves acceptable cost.

### T5 Integration
Cross-engine composition is tested at authority boundaries.

### T6 Reference profile E2E
WEB_APP_API proves the end-to-end journey on a controlled reproducible target.

### T7 Visual acceptance
For UI-bearing reference surfaces, visual evidence must be deterministic enough to distinguish intended changes from unexplained drift.

### T8 Delta Assurance shadow proof
Where selective validation is introduced/changed, selected results must be periodically compared against the full applicable suite. False negatives invalidate the optimization.

### T9 Flake classification
Repeated nondeterministic failures receive explicit fingerprints and cannot be silently retried into release credit.

### T10 Cross-platform release assurance
Existing Ubuntu/macOS/Windows exact-artifact assurance remains required where the current release line requires it.

### T11 Security
Required security/provider checks remain green. Profile-specific security tests are additive.

### T12 Recovery
Upgrade/recovery/rollback evidence is required for release-affecting state.

## Performance/ROI rules

- only matched populations may be compared;
- different population => INCOMPARABLE;
- missing required metric => INDETERMINATE;
- no token claim while token data is UNAVAILABLE;
- quality/security failure voids optimization credit;
- raw latency improvement alone does not prove accepted engineering productivity.

WO-level performance goals must select exact metrics before implementation.

## V1.2 priority metrics

Prefer end-to-end accepted-functionality measures over CLI entry latency:
- time to first owner-approved executable plan;
- repeated source reads/searches avoided with equal correctness;
- validated execution-wave throughput;
- correction-loop count;
- proof reuse hit rate with zero false production credit;
- selective-validation savings with shadow false-negative rate;
- time to accepted reference-profile release;
- operator intervention count.

## Brownfield evidence gap

If WO-001/WO-003 modifies adoption/context/validation behavior, a repeatable brownfield cohort and timing harness must be admitted before any brownfield speedup percentage is claimed.

