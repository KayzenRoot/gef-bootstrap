# GEF Bootstrap

**Governed Engineering Framework Bootstrap · V1.0.0**

A production-accepted, evidence-first engineering bootstrap for starting **new projects** and adopting **existing/brownfield projects** with deterministic planning, Work Orders, context locks, policy guardrails, checkpoints, evidence, exact-head assurance, Git/GitHub governance, recovery, diagnostics, documentation and performance-aware execution.

> **V1 status:** `PRODUCTION_ACCEPTED` · M00-M63 complete · `1088 / 1088 = 100%` · final release-blocking CRITICAL/HIGH: `0 / 0`.

## Why GEF Bootstrap

GEF turns project construction into a governed pipeline instead of an unstructured sequence of prompts and edits:

`ANALYZE → SOURCE CHECK → WORK ORDER → CONTEXT LOCK → PREFLIGHT → EXECUTE → TEST/EVIDENCE → PR → EXACT-HEAD AUDIT → CHECKPOINT → NEXT`

Core capabilities include project discovery and identity, planning/source packs, scope and DoD governance, brownfield adoption, task-context compilation, policy guardrails, checkpoint/resume, project registry/status/progress, evidence and proof graphs, semantic delta review, assurance pipelines, test-impact analysis, Git/GitHub governance, security/recovery/integrity, adapters, telemetry/audit, benchmarking, installation/upgrade/doctor foundations, test/integration harnesses, documentation/runbooks, production acceptance and executor-performance primitives.

## Requirements

- Git
- Node.js **22** recommended for the V1 validated toolchain
- npm
- Windows, Linux or macOS

GitHub CLI is optional. GitHub capability/authentication is treated separately from local GEF operation.

## Install from source

GEF Bootstrap V1 is currently distributed as a **source workspace**, not as a published npm package or standalone executable. This distinction is intentional: do not use `npm install -g gef-bootstrap` unless a future release explicitly publishes a CLI package.

```bash
git clone https://github.com/KayzenRoot/gef-bootstrap.git
cd gef-bootstrap
git checkout v1.0.0
npm ci
npm run validate
```

For development on the current maintenance branch, use `main` instead of the release tag.

## Validate

```bash
npm run typecheck
npm test
npm run validate
npm audit --audit-level=high
```

The V1 release candidate was additionally validated by focused GitHub Actions on Ubuntu, Windows and macOS plus full regression and exact-head technical audit.

## Using GEF in a project

GEF V1 is a framework/workspace foundation. Start by reading:

1. `AGENTS.md` for repository/agent operating rules.
2. `planning/MASTER-MODULE-INDEX.md` for the canonical module map.
3. `.engineering/CHECKPOINT.md` for accepted V1 state.
4. `.engineering/GBS-V1-PRODUCTION-ACCEPTANCE.md` for the release boundary.
5. `docs/INSTALLATION.md` and `docs/QUICKSTART.md` for setup and adoption.

For a new project, establish canonical sources and a Work Order before mutation. For an existing project, perform discovery, collision/preservation analysis and preview first. Never delete or overwrite user work merely to satisfy bootstrap structure.

## Repository map

| Path | Purpose |
| --- | --- |
| `packages/` | GEF engines, contracts, kernel, CLI-facing library surface and module implementations |
| `tests/` | Unit, integration, assurance and module tests |
| `planning/` | Canonical module/session planning and architecture source material |
| `.engineering/` | Work Orders, gates, evidence, checkpoints and production acceptance lineage |
| `.github/workflows/` | Cross-platform and assurance automation |
| `docs/` | User-facing installation, quickstart and release documentation |

## Release

**Latest stable:** `v1.0.0`

See `CHANGELOG.md` and `docs/releases/v1.0.0.md` for release notes, validated scope, known distribution boundaries and upgrade guidance. GitHub automatically provides source `.zip` and `.tar.gz` archives for the tag/release.

## Security and assurance

GEF uses fail-closed semantics for unknown/conflicting release evidence. Production progress is evidence-bound rather than activity-bound. V1 final promotion was exact-head audited with zero unresolved CRITICAL/HIGH findings.

Security issues should not be posted with secrets, credentials or exploit-sensitive private data in public logs. See `SECURITY.md`.

## Versioning

GEF follows Semantic Versioning for releases. V1 accepted history is frozen. Maintenance fixes use patch versions; backward-compatible feature evolution uses minor versions; breaking contract changes require a major version or separately authorized next-version scope.

## License

No open-source license is granted merely by the repository being public. See `LICENSE` for the repository's current rights notice.

---

Built around one rule: **evidence closes work, not confidence.**
