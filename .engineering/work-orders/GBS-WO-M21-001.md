# GBS-WO-M21-001 — Implement Progress Engine

Status: `MODULE_DONE`
Risk: `HIGH`
Assurance intensity: `HIGH_ASSURANCE`
Module: `GBS-M21 — Progress Engine`
Canonical package: `packages/progress-engine`
Canonical weight: `18`
Planning gate: `.engineering/gates/M21-PLANNING-GATE.md` (`PASSED`)
Planning freeze PR: `#218`
Planning reviewed head: `a2503f885020975907f3cec06cabf474beeacecf`
Planning reviewed tree: `fb1aea33833fa593b37b4848c0d19858b4056849`
Planning semantic audit: `5205201788`
Planning freeze merge: `2b7531c62c438ac9cf8c3382b39621e13be05b8f`
Admission PR: `#219`
Admission reviewed head: `882051eeea5ccc8f4494e680e7992f4018d02f81`
Admission reviewed tree: `50a8677d85fda6efe8fbf254dfe615973989c20b`
Admission semantic audit: `5205215396`
Admission merge / sole legal execution base: `4d037111084d3f119ead388cbb6860b44e5a4071`
Admission binding merge: `fbba60d62f51dc09267ec320b991f9e1ccab643a`
Implementation PR: `#221`
Implementation reviewed head: `8df2af7504381aa4d4f15137f40b25bab2cb01bd`
Implementation reviewed tree: `1879d8c0bbcc112cff3ee83dfd95bdddb1361f22`
Implementation semantic audit: `5205406352`
Implementation merge: `0c2de889238771b140b4190da0ba776c0b8784ff`
Evidence: `.engineering/evidence/GBS-WO-M21-001-EVIDENCE.md`

## Objective
Implement a deterministic, evidence-bound, reversible Progress Engine that computes exact project/module/area/phase progress from the approved denominator without intuitive credit, double counting, stale-credit retention or downstream ownership leakage.

## Implemented scope
All 32 frozen M21 mechanisms were implemented:
- PBC21, DIM21, PAB21, CEG21, WCU21, SDB21, EAB21, DMW21;
- WPV21, HPG21, ADCL21, PRE21, PCA21, PPP21, CCW21, PQP21;
- PIV21, CRT21, PDS21, DDG21, SCQ21, CDG21, PSW21, PRR21;
- PSC21, PIR21, PSD21, PCE21, DPMH21, EBH21, SPH21, PSS21.

## Architecture closure
1. TypeScript/Node library-first semantic core is startup-pure.
2. Semantic logic has no direct filesystem/network/Git/provider/process access.
3. Progress is calculated from explicit canonical projections and accepted external evidence/proof bindings only.
4. Canonical credit uses exact integer/rational numerator/denominator representation.
5. Atomic units are unique and graph aliases/multiple paths cannot duplicate credit.
6. Missing/invalid/stale/conflicted observations do not manufacture completion.
7. Invalid credit is retractable/quarantined and legitimate regressions are preserved.
8. Denominator changes require a new epoch plus explicit mutation witness.
9. Split-brain states fail closed.
10. M20/M22/M23 handoffs are owner-labeled, query-bound and integrity-bound.
11. M21 cannot self-issue evidence acceptance, and public evidence-owner admission is limited to frozen external authority domains.
12. Traversals/queries are bounded/cancellable and injected SHA-256 fails closed.

## HIGH_ASSURANCE evidence
- focused M21 suites: `76/76 PASS` on Ubuntu, Windows and macOS;
- deterministic property/oracle coverage includes `160` randomized legal partitions;
- full repository regression: `835/835 PASS`;
- dependency audit: `0 vulnerabilities`;
- Security CodeQL: `PASS`;
- exact-head triggered workflows: `18/18 PASS`;
- exact-head semantic audit: `5205406352`, CRITICAL `0`, HIGH `0`.

Corrections 01-04 are part of the accepted implementation and are documented in the Evidence Bundle.

## Ownership closure
Scope/DoD definition, checkpoint promotion, response formatting, ETA estimation, project-status calculation, evidence/proof generation/acceptance truth, telemetry collection, benchmark generation, Git/provider mutation and operator presentation remain out of M21 scope.

## Production credit
Evidence-backed MODULE_DONE promotion awards `18 / 18` M21 weight. The production denominator remains unchanged at `1088`.

STOP CONDITION: `GBS_WO_M21_001_MODULE_DONE`.
