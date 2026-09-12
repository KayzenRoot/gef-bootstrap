# Backlog Baseline

Status: `IN_DISCUSSION`

## Purpose
This backlog converts the frozen 64-module production inventory into the weighted denominator required by the frozen Scope and Definition of Done. It does not yet publish an overall completion percentage. Historical credit is applied only after exact evidence reconciliation.

## Weight model
Each production module receives four reviewed 1–5 dimensions:
- `E` effort/implementation depth;
- `R` engineering/security/operational risk;
- `I` integration/dependency breadth;
- `P` proof/validation burden.

`RAW_WEIGHT = E + R + I + P`.

Weights describe relative production burden, not calendar days. They are based on frozen Architecture, Security, Test/Benchmark, module session count, cross-module ownership and release proof obligations. Changing them after baseline freeze requires governed recalibration.

## State model
`PLANNED`, `IN_DISCUSSION`, `IMPLEMENTING`, `EVIDENCE_PENDING`, `ITEM_DONE`, `MODULE_DONE`, `BLOCKED`.

Only `MODULE_DONE` receives full module credit. Planning/source-pack work may receive item-level historical credit only after mapped reconciliation; no module is credited from document existence alone.

## Main production denominator
Optional adapters M39–M41 are tracked separately. The main denominator contains 61 release-blocking modules: 47 CORE_REQUIRED + 14 PRODUCT_INCLUDED.

| Module | Class | E | R | I | P | Weight | Current evidence state |
|---|---|---:|---:|---:|---:|---:|---|
| M00 Bootstrap Constitution | CORE_REQUIRED | 3 | 4 | 5 | 4 | 16 | MODULE_DONE |
| M01 Deterministic Work Plane Kernel | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M02 Configuration & Schema | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M03 Project Identity | CORE_REQUIRED | 3 | 5 | 5 | 4 | 17 | PLANNED |
| M04 Preflight & Discovery | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M05 Transactional Apply Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M06 Filesystem Safety | CORE_REQUIRED | 4 | 5 | 4 | 5 | 18 | PLANNED |
| M07 Template Engine | PRODUCT_INCLUDED | 4 | 3 | 4 | 3 | 14 | PLANNED |
| M08 Project Profiles | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M09 Source Pack Engine | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M10 Planning Workspace | CORE_REQUIRED | 4 | 3 | 5 | 4 | 16 | PLANNED |
| M11 Decision System | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M12 Scope & DoD Engine | CORE_REQUIRED | 4 | 4 | 5 | 5 | 18 | PLANNED |
| M13 GEF Adoption Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M14 Task & Context Compiler | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M15 Execution Pack Compiler | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M16 Policy & Guardrail Engine | CORE_REQUIRED | 4 | 5 | 5 | 5 | 19 | PLANNED |
| M17 Checkpoint Engine | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M18 Resume Engine | CORE_REQUIRED | 4 | 4 | 5 | 5 | 18 | PLANNED |
| M19 Project Registry | PRODUCT_INCLUDED | 4 | 3 | 4 | 3 | 14 | PLANNED |
| M20 Response Contract | PRODUCT_INCLUDED | 3 | 3 | 4 | 3 | 13 | PLANNED |
| M21 Progress Engine | CORE_REQUIRED | 4 | 4 | 5 | 5 | 18 | PLANNED |
| M22 Estimation Engine | PRODUCT_INCLUDED | 4 | 3 | 4 | 4 | 15 | PLANNED |
| M23 Project Status Engine | PRODUCT_INCLUDED | 3 | 3 | 4 | 3 | 13 | PLANNED |
| M24 Evidence Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M25 Proof Graph | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M26 HEDS Delta Review | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M27 Assurance Pipeline | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M28 Test Impact Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M29 Git Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M30 GitHub Bootstrap | PRODUCT_INCLUDED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M31 GitHub Governance | PRODUCT_INCLUDED | 4 | 5 | 5 | 4 | 18 | PLANNED |
| M32 CI Bootstrap | PRODUCT_INCLUDED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M33 Release Governance | CORE_REQUIRED | 4 | 5 | 5 | 5 | 19 | PLANNED |
| M34 Security Bootstrap | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M35 Policy Safety | CORE_REQUIRED | 4 | 5 | 5 | 5 | 19 | PLANNED |
| M36 Recovery Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M37 Integrity Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M38 Capability Detection | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M42 Generic Adapter API | PRODUCT_INCLUDED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M43 Telemetry Engine | CORE_REQUIRED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M44 Audit Ledger | CORE_REQUIRED | 4 | 5 | 5 | 5 | 19 | PLANNED |
| M45 Baseline & Benchmark | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M46 Artifact Engine | PRODUCT_INCLUDED | 4 | 3 | 4 | 4 | 15 | PLANNED |
| M47 Interaction & Operator UX | PRODUCT_INCLUDED | 4 | 3 | 4 | 4 | 15 | PLANNED |
| M48 Help System | PRODUCT_INCLUDED | 3 | 2 | 3 | 3 | 11 | PLANNED |
| M49 Distribution & Setup | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M50 Upgrade Engine | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M51 Compatibility Matrix | CORE_REQUIRED | 4 | 5 | 5 | 5 | 19 | PLANNED |
| M52 Self Doctor | PRODUCT_INCLUDED | 4 | 4 | 5 | 4 | 17 | PLANNED |
| M53 Unit Test Framework | CORE_REQUIRED | 4 | 3 | 5 | 5 | 17 | PLANNED |
| M54 Integration Harness | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M55 GitHub Simulation | PRODUCT_INCLUDED | 4 | 4 | 5 | 5 | 18 | PLANNED |
| M56 End-to-End Harness | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M57 Performance Benchmarks | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |
| M58 Security Tests | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M59 User Documentation | CORE_REQUIRED | 4 | 3 | 4 | 4 | 15 | PLANNED |
| M60 Engineering Documentation | CORE_REQUIRED | 4 | 3 | 5 | 4 | 16 | PLANNED |
| M61 Operational Runbooks | CORE_REQUIRED | 4 | 4 | 5 | 5 | 18 | PLANNED |
| M62 Production Acceptance | CORE_REQUIRED | 5 | 5 | 5 | 5 | 20 | PLANNED |
| M63 Executor Performance Engine | CORE_REQUIRED | 5 | 4 | 5 | 5 | 19 | PLANNED |

## Optional adapter track, outside independent-product denominator
| Module | Class | E | R | I | P | Weight | State |
|---|---|---:|---:|---:|---:|---:|---|
| M39 UADS Adapter | OPTIONAL_ADAPTER | 4 | 4 | 4 | 4 | 16 | PLANNED |
| M40 Hive Adapter | OPTIONAL_ADAPTER | 4 | 4 | 4 | 4 | 16 | PLANNED |
| M41 UGAS Adapter | OPTIONAL_ADAPTER | 4 | 4 | 4 | 4 | 16 | PLANNED |

## Weight rationale bands
- E5: substantial engine/compiler/harness/release subsystem; E4: significant bounded subsystem; E3: moderate surface.
- R5: corruption/security/release/authority failure can materially invalidate product; R4: serious but bounded operational/governance risk; R2–3: lower blast radius.
- I5: cross-cuts many modules/contracts; I4: several direct integrations; I3: mostly bounded local integration.
- P5: high negative-path/cross-platform/security/E2E evidence burden; P4: broad integration proof; P3: focused proof.

## Historical evidence reconciliation plan
Before first percentage is published:
1. map completed Constitution and frozen Source Pack work to the modules/items they legitimately satisfy;
2. credit M00 fully because it already meets MODULE_DONE evidence;
3. do not mark M09/M12/M34/M45/etc MODULE_DONE merely because project-level Source Pack documents exist;
4. create item-level historical credits only when the frozen module's future acceptance contract can safely recognize the completed planning artifact;
5. record each credited item with source PR/head and current validity;
6. calculate completion only after all 61 weights and historical credits receive review.

## Backlog freeze questions
1. Validate every E/R/I/P value against module sessions and frozen contracts.
2. Decide the item-level partial-credit formula while preserving MODULE_DONE as the only full module credit.
3. Map frozen Source Pack planning artifacts to legitimate historical backlog items without double counting.
4. Decide whether planning-only item credit should be capped before implementation starts.
5. Produce denominator, earned-weight calculation and first official overallCompletion only after the above four checks pass.

STOP CONDITION: `BACKLOG_WEIGHT_AND_HISTORICAL_RECONCILIATION_REQUIRED`.
