# GEF Bootstrap — Master Module Index

Status: `SOURCE_PACK_CLOSURE_SYNCED`

Inventory and planning map for the single complete production target. Canonical module classification lives in `.engineering/SCOPE.md`; this index does not duplicate Scope authority.

Unplanned sessions may remain intentionally empty placeholders. Files marked `OWNER_DIRECTIVE_SEED_NOT_FROZEN` capture later owner decisions that future module planning MUST reconcile, but they are not frozen planning, implementation authority or earned progress.

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
  - S01 source/test/proof map and test identity
  - S02 impacted-test selection and Test Proof Reuse Receipts
  - S03 regression radius, Progressive Validation Ladder and failure-scoped retest
  - S04 uncertainty widening and exact-head full-sweep boundary

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
- **GBS-M39 — Reserved External Adapter Slot** — 4 sessions
- **GBS-M40 — Reserved Context Adapter Slot** — 3 sessions
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
  - S01 latency/token/progress-density objectives and budgets
  - S02 implementation seed tree, repository navigation and file-I/O minimization
  - S03 pre-resolved execution, decision closure, work fusion and Marathon Execution Packs
  - S04 validation reuse scheduling, concurrency, critical path and wait reduction
  - S05 performance benchmark, regression gates and optimization receipt

### M63 objective
Make each governed executor interaction produce as much safe, accepted forward progress as practical while reducing rediscovery, file-I/O, repeated reasoning, test duplication and wait time. M63 owns executor-performance orchestration and the planning-to-implementation seed compiler for target repositories. It coordinates with M10 Planning Workspace, M11 Decision System, M13 Adoption Engine, M14 Context Compiler, M15 Execution Pack Compiler, M28 Test Impact, M43 Telemetry, M45 Baseline & Benchmark and M57 Performance Benchmarks.

M63 does not reopen completed M10/M14/M15 ownership. It consumes their governed artifacts and compiles downstream acceleration projections such as Implementation Seed Tree, File Intent Capsule, Brownfield Patch Intent Capsule, Executor Navigation Map, Decision Closure Capsule, Execution Wave Fusion and Marathon Execution Pack.

### Planning-to-execution acceleration directive
`ADR-0002-PLANNING-TO-EXECUTION-ACCELERATION` is an approved Project Owner directive. Target-project planning is expected to prepare safe source/test skeletons and exact executor instructions where decisions are sufficiently resolved. Long prompts are acceptable when they increase Prompt Progress Density. Intermediate testing is impact-first and proof-preserving; final assurance remains exact-head and cannot be skipped.

This directive does not change module count, session count or the frozen denominator. Future M28/M63 planning must reconcile `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md` and `.engineering/ledgers/EXECUTOR-ACCELERATION-TECHNOLOGY-SYNC.md` before freeze.

### Brownfield adoption policy note
Existing-project adoption is first-class, owned by GBS-M13 and exercised by later E2E/quality sessions. The bootstrap should deliver early token/time/review benefits incrementally without destructive rewrite or complete historical cleanup first. Under ADR-0002, existing healthy source is represented by Brownfield Patch Intent Capsules rather than being overwritten during planning merely to create seeds.

### Stable-name migration note
Legacy names for M01, M47, M49 and M62 remain valid historical references by stable ID. Canonical display names above follow the complete hybrid production model. Physical folder/file renames are deferred to governed repository migration when Architecture selects the safest path.

### Source Pack closure note
The complete Source Pack closure audit reconciled this index with frozen Scope, Architecture, DoD, weighted Backlog Baseline and the hybrid constitutional model. Counts and stable IDs remain unchanged. Later explicit owner directives may refine planned future-module obligations without earning weight or silently reopening completed modules; such directives require their own canonical decision record and future planning reconciliation.
