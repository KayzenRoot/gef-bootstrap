# Changelog

All notable release changes are documented here. GEF Bootstrap uses Semantic Versioning.

## [1.1.0] - production-acceptance candidate (2026-09-30; not released)

### Added
- Integrated CLI package for `init`, `adopt`, `doctor`, `status` and explicit project-state `upgrade` operations.
- Cross-platform package install/use, preservation-first migration, recovery and compatibility assurance.
- Context compilation, incremental validation, proof reuse and performance telemetry across the V1.1 line.

### Compatibility and migration
- The CLI declares Node.js `>=22`; unsupported runtimes fail closed.
- The supported project-state migration is the explicit V1.0 `1.0.0` to V1.1 `1.1.0` path. The CLI does not update itself, access npm during upgrade or claim unsupported downgrades.
- Windows, Linux and macOS are the target platforms; claims remain bounded by exact-head platform evidence.

### Candidate assurance and limitations
- The package is built from the source workspace and can be installed from its local tarball. It remains private and unpublished until a separate owner production-acceptance audit and verified npm scope/OIDC configuration.
- The repository remains proprietary under the All Rights Reserved `LICENSE`; package installation grants no open-source rights.
- WO-008 measured CLI ROI as `NO_CHANGE`; no speedup claim is made. No standalone executable is included in this release candidate.
- This section is a candidate record, not a stable-release or production-acceptance claim. Exact tests, checksums and remaining external action are in `.engineering/evidence/GBS-V11-WO-010-EVIDENCE.md`.

## [1.0.0] - 2026-09-16

### Added
- Complete governed engineering lifecycle across M00-M63.
- Canonical project discovery, identity, source packs, planning workspace, decisions, scope and DoD.
- Brownfield adoption and preservation-first project handling.
- Task context, execution packs, policy guardrails, checkpoint/resume and project registry.
- Progress, estimation and status engines with evidence-bound accounting.
- Evidence engine, proof graph, HEDS semantic delta review, assurance and test-impact engines.
- Git/GitHub bootstrap, governance, CI and release governance foundations.
- Security, policy safety, recovery, integrity and capability detection.
- Optional ecosystem adapters and generic adapter API.
- Telemetry, audit ledger, baseline/benchmark, artifact and operator UX foundations.
- Help, installation, upgrade, compatibility and self-doctor contracts.
- Unit/integration harnesses, GitHub simulation, E2E, performance and adversarial security testing.
- User/engineering documentation and operational runbooks.
- Production Acceptance and Executor Performance Engine.

### Assurance
- Final M62-M63 assurance passed Ubuntu, Windows and macOS.
- Full regression passed.
- High-level dependency audit passed.
- Final exact-head technical promotion audit APPROVED.
- Unresolved release-blocking findings: CRITICAL 0, HIGH 0.
- Production accounting: 1088/1088 = 100%.

### Distribution note
- V1.0.0 is a source-workspace release.
- No npm/global executable distribution is claimed in this release.
