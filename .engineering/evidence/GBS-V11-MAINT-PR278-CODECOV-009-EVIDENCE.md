# GBS-V11-MAINT-PR278-CODECOV-009 — Admission Evidence Bundle

Source baseline: release/1.1 at 849d79d1743b4628179bcac21b9884aaf2649825, after the verified PR #328 integration. Production main is unchanged at e23311e77d79b84f3c70671072a22a6f8896d13d.
Authority: KayzenRoot under effective ADR-0006; any subsequent owner audit must explicitly be labeled NOT_INDEPENDENT.

## Exact provider observations at admission
- Cumulative release-to-main PR #278 SonarCloud check 109485123961 concluded SUCCESS on the admission base. A green incremental candidate does not substitute for the cumulative analysis.
- Cumulative PR #278 Codecov patch check concluded FAILURE on the same base: 85.81% of diff hit versus provider target 97.85%. Its provider report identified 42 missing diff lines: rights-diagnostics.mjs (23), prepare-package.mjs (13 plus one partial), and bin/gef.mjs (5).
- The current native Node LCOV pipeline on main runs tests/*.test.mjs under Linux. The existing package smoke test executes the prepare script as a child process, and the Windows rights reporter exits on Linux before platform-specific source executes.

## Bounded correction
- Existing Windows reporter is exposed through explicitly injectable read-only diagnostic capabilities, preserving default production reporting and zero exit on POSIX.
- New in-process tests exercise positive and negative rights reporting using simulated observations without faking filesystem authorization, and call the real pack() once into a disposable directory to produce a real tarball.
- No changes to the production pack script, quality thresholds, dependencies, coverage configuration, provider identity, branch protections or release publication.

## Current status and proof obligations
Implementation candidate: present on the subordinate branch. Full GitHub CI/security and platform results: PENDING at admission, never predeclared. Exact-head owner review and cumulative provider Codecov remeasurement are still required.
Do not admit WO-010, merge cumulative PR #278, publish a package or mark V1.1 Production Accepted while provider evidence is failing, pending, stale, inaccessible or ambiguous.

Proposed Checkpoint Delta after admission: duplication source correction PR #328 merged; cumulative Sonar now passing on exact source base; Codecov patch coverage is the active unresolved release gate and this subordinate correction must prove it through real tests.
