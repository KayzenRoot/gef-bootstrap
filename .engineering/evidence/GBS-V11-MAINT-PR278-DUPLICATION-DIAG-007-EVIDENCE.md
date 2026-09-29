# GBS-V11-MAINT-PR278-DUPLICATION-DIAG-007 — Admission and objective evidence

- Exact admission base: `a02acbeafb46e1587caff715a3112f9e99692309`; production `main` unchanged at `e23311e77d79b84f3c70671072a22a6f8896d13d`.
- Parent: `GBS-V11-MAINT-POST-WO009-001`; owner-operated review only, NOT_INDEPENDENT.
- Cumulative PR #278 current Sonar check `109466787630`: FAILED with 3.1% new duplication (<=3.0% required); security and reliability ratings are no longer listed as failed conditions. File/block attribution **not yet provider-verified**.
- Codecov patch check `109468307667`: FAILED, 85.81% of diff hit versus 97.85% target; last report identifies `packages/cli/scripts/rights-diagnostics.mjs`, `packages/cli/scripts/prepare-package.mjs` and `packages/cli/bin/gef.mjs`.
- This candidate adds only a public, read-only duplicate metadata inventory. The original Sonar and Codecov checks retain full authority.
- Tests, candidate HEAD and diagnostic provider output: PENDING until GitHub Actions completes on the PR exact SHA. No successful gate is predeclared.
- Remaining: provider-bound duplicate blocks; source correction if supported; patch-coverage tests; cumulative exact-head gate closure. WO-010 NOT admitted.
