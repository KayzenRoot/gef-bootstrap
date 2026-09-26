# GBS-M63-S04 — Validation Concurrency and Critical Path

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M63 — Executor Performance Engine`
Source directive: `ADR-0002`

## Planning objective
Consume M28's test-impact truth and optimize validation wall-clock without weakening test selection or assurance authority.

## Owner boundaries
- M28 owns which tests/validation surfaces are impacted and whether a prior PASS is reusable.
- M27 owns assurance requirements.
- M63 owns scheduling, batching, concurrency and critical-path optimization of the admitted validation work.

## Owner-directed technology candidates
- TECH-0055 TPRR consumption;
- TECH-0056 Progressive Validation Ladder consumption;
- TECH-0057 Failure-Scoped Retest Loop scheduling;
- TECH-0058 Exact-Head Full Sweep Gate coordination;
- TECH-0059 Validation Wave Scheduler;
- existing Execution Critical Path Map.

## Validation critical-path strategy
1. run fastest high-signal invalidators early;
2. avoid launching expensive suites that a prerequisite failure would make irrelevant;
3. run independent safe validations concurrently;
4. reuse only M28-admitted current TPRRs;
5. after a correction, rerun the failed test and impacted closure before broad suites;
6. defer full exact-head suites until the candidate is stable enough to justify their cost, unless policy requires earlier execution;
7. keep final full-suite evidence exact-head and immutable.

## Concurrency safety
Parallel checks must not:
- mutate the same shared fixture/environment unsafely;
- hide prerequisite failure;
- mix evidence identities;
- oversubscribe admitted resources beyond policy;
- cause flaky ordering to become accepted evidence.

## Reuse accounting
M63 should distinguish:
- test physically executed;
- test reused via valid TPRR;
- test skipped because not impacted;
- test deferred to later validation level;
- test blocked/indeterminate.

No category may be collapsed into generic `PASS`.

## Failure containment
A failure cancels/deprioritizes only dependent validation work when the dependency graph is complete. Independent already-valid validation remains reusable if its bindings do not change.

## Required future attacks
Concurrent shared-state collision, stale TPRR, hidden prerequisite, flaky retry, cancellation, platform-specific gate, resource saturation, failure causing unsafe dependent continuation and final-head change during long suite.

This file grants no M63 implementation authority.
