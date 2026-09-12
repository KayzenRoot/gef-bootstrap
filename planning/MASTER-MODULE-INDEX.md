# GEF Bootstrap — Master Module Index

Status: `SCOPE_FROZEN`

Inventory and planning map for the single complete production target. Canonical module classification lives in `.engineering/SCOPE.md`; this index does not duplicate Scope authority.

All session files currently exist as intentionally empty placeholders unless a session is already active. Empty means **PLANNED**, never approved or complete.

## Counts
- Areas: 16 (A–P)
- Modules: 64 (GBS-M00–GBS-M63)
- Sessions: 282

## Area A — Foundation & Governance
- **GBS-M00 — Bootstrap Constitution** — 5 sessions
- **GBS-M01 — Deterministic Work Plane Kernel** — 5 sessions
- **GBS-M02 — Configuration & Schema** — 5 sessions
- **GBS-M03 — Project Identity** — 4 sessions
- **GBS-M04 — Preflight & Discovery** — 5 sessions

## Area B — Safe Bootstrap Engine
- **GBS-M05 — Transactional Apply Engine** — 5 sessions
- **GBS-M06 — Filesystem Safety** — 4 sessions
- **GBS-M07 — Template Engine** — 5 sessions
- **GBS-M08 — Project Profiles** — 5 sessions

## Area C — Source Pack & Planning
- **GBS-M09 — Source Pack Engine** — 5 sessions
- **GBS-M10 — Planning Workspace** — 5 sessions
- **GBS-M11 — Decision System** — 5 sessions
- **GBS-M12 — Scope & DoD Engine** — 4 sessions

## Area D — GEF Engineering Model
- **GBS-M13 — GEF Adoption Engine** — 5 sessions
  - S01 adoption policy and modes
  - S02 new-project adoption
  - S03 existing-project / brownfield adoption
  - S04 compatibility and progressive normalization
  - S05 adoption receipt and promotion
- **GBS-M14 — Task & Context Compiler** — 5 sessions
- **GBS-M15 — Execution Pack Compiler** — 5 sessions
- **GBS-M16 — Policy & Guardrail Engine** — 4 sessions

## Area E — Continuity
- **GBS-M17 — Checkpoint Engine** — 5 sessions
- **GBS-M18 — Resume Engine** — 4 sessions
- **GBS-M19 — Project Registry** — 4 sessions
- **GBS-M20 — Response Contract** — 5 sessions

## Area F — Progress & Estimation
- **GBS-M21 — Progress Engine** — 4 sessions
- **GBS-M22 — Estimation Engine** — 5 sessions
- **GBS-M23 — Project Status Engine** — 5 sessions

## Area G — Evidence & Review
- **GBS-M24 — Evidence Engine** — 4 sessions
- **GBS-M25 — Proof Graph** — 5 sessions
- **GBS-M26 — HEDS Delta Review** — 5 sessions
- **GBS-M27 — Assurance Pipeline** — 5 sessions
- **GBS-M28 — Test Impact Engine** — 4 sessions

## Area H — Git & GitHub
- **GBS-M29 — Git Engine** — 4 sessions
- **GBS-M30 — GitHub Bootstrap** — 5 sessions
- **GBS-M31 — GitHub Governance** — 4 sessions
- **GBS-M32 — CI Bootstrap** — 5 sessions
- **GBS-M33 — Release Governance** — 5 sessions

## Area I — Security & Reliability
- **GBS-M34 — Security Bootstrap** — 4 sessions
- **GBS-M35 — Policy Safety** — 4 sessions
- **GBS-M36 — Recovery Engine** — 4 sessions
- **GBS-M37 — Integrity Engine** — 4 sessions

## Area J — Integrations
- **GBS-M38 — Capability Detection** — 4 sessions
- **GBS-M39 — UADS Adapter** — 4 sessions
- **GBS-M40 — Hive Adapter** — 3 sessions
- **GBS-M41 — UGAS Adapter** — 3 sessions
- **GBS-M42 — Generic Adapter API** — 4 sessions

## Area K — Observability
- **GBS-M43 — Telemetry Engine** — 5 sessions
- **GBS-M44 — Audit Ledger** — 4 sessions
- **GBS-M45 — Baseline & Benchmark** — 4 sessions

## Area L — Artifacts & UX
- **GBS-M46 — Artifact Engine** — 4 sessions
- **GBS-M47 — Interaction & Operator UX** — 5 sessions
- **GBS-M48 — Help System** — 4 sessions

## Area M — Distribution & Maintenance
- **GBS-M49 — Distribution & Setup** — 4 sessions
- **GBS-M50 — Upgrade Engine** — 4 sessions
- **GBS-M51 — Compatibility Matrix** — 4 sessions
- **GBS-M52 — Self Doctor** — 5 sessions

## Area N — Bootstrap Quality
- **GBS-M53 — Unit Test Framework** — 4 sessions
- **GBS-M54 — Integration Harness** — 4 sessions
- **GBS-M55 — GitHub Simulation** — 4 sessions
- **GBS-M56 — End-to-End Harness** — 4 sessions
- **GBS-M57 — Performance Benchmarks** — 4 sessions
- **GBS-M58 — Security Tests** — 4 sessions

## Area O — Documentation & Closure
- **GBS-M59 — User Documentation** — 4 sessions
- **GBS-M60 — Engineering Documentation** — 4 sessions
- **GBS-M61 — Operational Runbooks** — 4 sessions
- **GBS-M62 — Production Acceptance** — 5 sessions

## Area P — Engineering Efficiency
- **GBS-M63 — Executor Performance Engine** — 5 sessions
  - S01 latency objectives and per-interaction budgets
  - S02 repository discovery / file-I/O minimization
  - S03 pre-resolved execution and reasoning-branch suppression
  - S04 validation concurrency, critical path and wait reduction
  - S05 performance benchmark, regression gates and optimization receipt

### M63 objective
Make each governed executor interaction finish as quickly as safely possible while preserving correctness and assurance. This module owns executor wall-clock performance as a first-class objective and coordinates with M14 Context Compiler, M15 Execution Pack Compiler, M28 Test Impact, M43 Telemetry, M45 Baseline & Benchmark and M57 Performance Benchmarks.

### Brownfield adoption policy note
Existing-project adoption is first-class, owned by GBS-M13 and exercised by later E2E/quality sessions. The bootstrap should deliver early token/time/review benefits incrementally without destructive rewrite or complete historical cleanup first.

### Stable-name migration note
Legacy names for M01, M47, M49 and M62 remain valid historical references by stable ID. Canonical display names above follow the complete hybrid production model. Physical folder/file renames are deferred to governed repository migration when Architecture selects the safest path.
