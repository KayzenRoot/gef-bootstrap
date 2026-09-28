# Direct Execution Brief — GBS-V11-MAINT-PIPELINE-001

## Authority and boundary

Execute only the admitted infrastructure maintenance in `.engineering/work-orders/GBS-V11-MAINT-PIPELINE-001.md`. Its Context Lock binds the V1.1 release base at `e69d887a0f12b46218f40e849fdcf180e455eb3d` and main at `73ab68f3f33f894027fb7a04c2696b02b839060a`. The active product Work Order remains GBS-V11-WO-009.

## Required implementation

- Selectively port Pipeline Integrity, Trivy, Gitleaks, audit-mode Harden Runner, Dependency Review and Scorecard.
- Pin every existing external workflow Action to a verified immutable 40-character commit SHA.
- Preserve all V1.1-specific Work Order workflows and their exact test semantics.
- Reuse `npm run validate` only after proving it retains V1.1 typecheck/build/test coverage.
- Keep Codecov coverage advisory until the LCOV source population is measured and excludes generated/test sources from source-only claims.
- Keep provider-backed reviews and scans optional unless free continuity and all-event execution are established.

## Verification and evidence

Validate the diff and lock fingerprints before commit; parse every workflow YAML; run Pipeline Integrity's equivalent policy check locally when available; verify there are no mutable Action refs or broad permissions; run targeted repository validation. Push normally, inspect the PR diff and review threads, verify all applicable checks on the exact head, run Scorecard manually on `release/1.1` if supported, and record exact SHAs, run IDs, URLs, durations, plan status and limitations in the Evidence Bundle.

Only KayzenRoot performs the owner-operated audit. Merge by squash only after `OWNER_APPROVED`, exact-head checks passing, and no unresolved security blockers. After merge, verify the new release SHA and prepare WO-009 Context Lock refresh; do not start WO-010 here.
