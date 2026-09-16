# GBS-M28-S01 — Source/Test Map

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Source directive: `ADR-0002`

## Planning objective
When M28 becomes active, freeze a provider-neutral graph that maps canonical source/contracts to the tests and validation surfaces that can prove them. The graph exists to reduce repeated testing safely, never to justify blind skipping.

## Required design topics
- stable Test Identity separate from display/test-runner ordering;
- source/contract semantic fingerprints;
- test-content/config/fixture/toolchain/platform fingerprints;
- direct source-to-test edges;
- test-to-test/integration dependency edges where relevant;
- risk/assurance tags;
- cross-platform relevance classification;
- evidence/receipt references from M24/M25/M26;
- completeness state for dependency knowledge;
- deterministic graph digest and permutation invariance.

## Owner-directed technology candidates
- TECH-0055 Test Proof Reuse Receipt;
- existing Proof Carry-Forward Graph integration;
- existing HEDS semantic delta inputs;
- existing Progressive Engineering Memory.

## Invariants
1. M28 selects tests; M26 does not.
2. A missing edge or unknown dependency widens testing. It never shrinks the radius.
3. A test PASS is not reusable merely because the test name is unchanged.
4. Runtime/toolchain/platform differences remain explicit where behavior may differ.
5. M28 does not mutate production code, proof state or assurance verdicts.
6. Final test mapping must support NEW_PROJECT and brownfield repositories.

## Required attacks for later freeze
Unknown dependency, renamed test with same semantics, same test ID/divergent body, config drift, fixture drift, toolchain drift, platform mismatch, source-owner drift, graph cycle where meaningful, missing mapping, ordering permutation and forged reuse receipt.

This file records owner-directed planning obligations only. It grants no implementation authority and earns no M28 weight.
