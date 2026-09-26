# GBS-M63-S05 — Performance Benchmark and Regression Gates

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M63 — Executor Performance Engine`
Source directive: `ADR-0002`

## Planning objective
Prove that executor acceleration reduces recurring time/token/search/test waste without causing unacceptable correctness, assurance or maintenance regressions.

## Required benchmark comparisons
Representative workloads should compare baseline versus accelerated operation for:
- new-project module implementation;
- brownfield feature/change;
- one local correction loop;
- multi-module compatible execution wave;
- failing test followed by correction;
- final exact-head assurance.

## Required measurements
- wall-clock;
- input/output tokens when observable;
- files read;
- broad searches;
- context expansions;
- executor invocations;
- accepted increments per invocation;
- test executions;
- duplicate test executions;
- TPRR reuse count/rate;
- full-suite invocation count;
- correction loops;
- rework;
- defects/regressions;
- seed/navigation invalidations;
- final assurance duration.

## Prompt Progress Density
M63 should evaluate progress density using normalized workload evidence rather than raw prompt size. Candidate surfaces:
- accepted increments per invocation;
- accepted semantic changes per token bucket;
- accepted progress per wall-clock;
- correctly completed seeded files before first correction;
- searches/rereads avoided versus baseline.

No one metric is allowed to dominate correctness.

## Optimization receipt
A future M63 optimization receipt should bind:
- workload/profile;
- baseline identity;
- accelerated configuration identity;
- relevant M28/M43/M45/M57 evidence;
- before/after cost vector;
- assurance/correctness comparison;
- claimed benefit and confidence;
- known regressions/tradeoffs;
- validity period/bindings.

## Regression gates
An optimization is rejected or downgraded if it materially worsens any non-waivable dimension such as:
- defect escape;
- security/integrity;
- stale-context risk;
- false test reuse;
- recovery safety;
- final assurance completeness;
- brownfield preservation.

A speed improvement with lower correctness is not a performance win.

## Threshold policy
Quantitative pass/fail thresholds are selected only after M45/M57 establish representative baselines. Until then the project records measurements without fabricating universal targets.

## Production acceptance expectation
The final GEF release must demonstrate that the acceleration profile can reduce repeated executor work in representative scenarios while preserving exact-head assurance and truthful fallback when acceleration inputs are stale/incomplete.

This file is a planning seed only. Final M63 mechanisms and acceptance thresholds remain subject to normal planning freeze/audit/admission.
