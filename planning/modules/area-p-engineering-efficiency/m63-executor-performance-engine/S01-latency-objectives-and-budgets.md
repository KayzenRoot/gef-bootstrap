# GBS-M63-S01 — Latency Objectives and Budgets

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M63 — Executor Performance Engine`
Source directive: `ADR-0002`
Frozen module weight remains: `19`

## Planning objective
When M63 becomes active, define measurable executor-performance objectives around useful governed progress, not superficial prompt brevity or arbitrary run-duration caps.

## Required performance dimensions
- wall-clock per executor invocation and per accepted increment;
- useful increments completed per invocation;
- input/output tokens when observable;
- repository files read and broad searches executed;
- context expansion count;
- reasoning/escalation branches where observable;
- test invocations and repeated test invocations;
- full-suite invocations per Work Order;
- correction/retry loops;
- rework ratio;
- seed/cache invalidations;
- final assurance latency;
- escaped defects/regressions attributable to optimization.

## Owner-directed technology candidates
- TECH-0061 Prompt Progress Density (PPD);
- existing Token Ledger;
- existing Executor Cognition Budget;
- existing Engineering ROI Governor;
- existing Execution Critical Path Map.

## Core rules
1. Five or six hours of executor runtime is acceptable if the run materially advances the Work Order and does not loop wastefully.
2. A short prompt that causes rediscovery/replanning is worse than a longer pre-resolved prompt.
3. No universal percentage speedup/token saving may be claimed before M45/M57 baselines.
4. Performance budgets must separate discovery, implementation, test, retry, review and wait costs.
5. Hitting a budget cannot authorize unsafe truncation. The system escalates, batches differently or expands context explicitly.
6. Quality regressions invalidate a claimed optimization.

## Candidate budget surfaces
- search/read budget;
- cognition/reasoning budget;
- context expansion budget;
- test/retest budget;
- executor invocation budget;
- parallel validation budget;
- maximum redundant-work ratio;
- minimum progress-density threshold once empirical baselines exist.

## Required future proof
Baseline versus accelerated runs on representative new-project and brownfield workloads, measuring time/tokens/search/test duplication and correctness together.

This file is a planning seed only and grants no M63 implementation authority.
