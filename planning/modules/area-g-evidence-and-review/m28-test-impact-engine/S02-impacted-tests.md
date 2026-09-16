# GBS-M28-S02 — Impacted Tests

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M28 — Test Impact Engine`
Source directive: `ADR-0002`

## Planning objective
Freeze the deterministic selector that converts semantic/source deltas plus the S01 map into the minimum sufficient test set for the current iteration, while preserving an explicit proof of why each test is selected, reusable or widened.

## Required technology candidates
- TECH-0055 Test Proof Reuse Receipt (TPRR);
- impact-scoped test selector;
- deterministic impacted-closure projector;
- green-proof cache backed only by current TPRRs;
- proof-reuse invalidation on relevant semantic/config/toolchain/platform drift;
- duplicate test execution suppressor;
- failure fingerprint integration from existing Failure Fingerprint Memory.

## TPRR minimum semantics
A reusable prior PASS must bind:
- test identity and test-body digest;
- impacted source/contract digests;
- dependency-closure digest;
- relevant configuration/fixture identity;
- toolchain/runtime compatibility;
- platform identity where applicable;
- prior result/evidence identity;
- assurance policy identity;
- validity state.

Expected reuse states include `REUSABLE`, `STALE_SOURCE`, `STALE_TEST`, `STALE_CONFIG`, `STALE_TOOLCHAIN`, `PLATFORM_MISMATCH`, `DEPENDENCY_UNKNOWN`, `CONFLICT`, `INDETERMINATE`.

## Selection rules
1. Changed semantics select directly mapped tests.
2. Dependency impact expands to dependent tests.
3. Unchanged tests may be omitted from an intermediate rerun only with a current TPRR.
4. An invalid or absent TPRR means run the test when it is inside the impact/risk radius.
5. A failing test is never hidden by an older green receipt.
6. M28 cannot use selection to weaken M27 assurance.

## Required attacks for later freeze
Stale green receipt, same test name with changed body, changed fixture, changed config, toolchain upgrade, platform-specific test, hidden dependent, conflicting dependency graph, forged PASS, failure after prior green and incomplete source knowledge.

This file is a future planning seed only. No M28 progress is earned.
