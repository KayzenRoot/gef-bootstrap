# Evidence Bundle — GBS-V11-MAINT-PIPELINE-001

Status: `IN_PROGRESS`

## Exact-state bindings

- Base `release/1.1`: `e69d887a0f12b46218f40e849fdcf180e455eb3d`
- Main baseline: `73ab68f3f33f894027fb7a04c2696b02b839060a`
- Shared ancestor: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`
- Implementation branch: `feat/1.1/maint-pipeline-001`
- Candidate SHA: pending
- PR: pending
- Owner audit: pending
- Merge SHA / post-merge checks: pending

## Initial discovery

Authenticated GitHub identity: `KayzenRoot` (`gh auth status`, 2026-09-28). The remote heads were re-read before branch creation. PR #307 and #308 have been integrated on `main`; the latter ends at `73ab68f3f33f894027fb7a04c2696b02b839060a`.

The main-to-release comparison after common ancestor `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` includes pipeline/security maintenance plus main-only history. The V1.1 tree retains six Work Order workflows (`wo-003` through `wo-008`) deleted from the consolidated main workflow set; they are frozen V1.1 evidence and remain preserved. Main-only checkpoint, historical product, and workflow deletion changes are excluded from this forward-port.

PR #302 WO-009 candidate `8169464bb8befda7ab85d53701bb4e8649daa54f` has its current checks successful, including SonarCloud, CodeQL, Socket, Repository Validation, all release assurance matrices, the Windows rights oracle, and upgrade/recovery. Its Context Lock is still tied to the pre-admission base and will require formal refresh after this maintenance PR advances `release/1.1`; no final WO-009 audit is claimed yet.

The pre-existing CodeQL HIGH `js/clear-text-logging`, identified in the WO-009 admission sources and PR #278 history, remains an inherited V1.1 release blocker until WO-009's exact-head remediation is promoted. This pipeline-only forward-port neither changes its affected product source nor suppresses/dismisses it. The maintenance PR must produce no new applicable CRITICAL/HIGH finding; zero security blockers is a later WO-009 acceptance condition, not a claim made by this Work Order.

## Selected maintenance state

| Component | Status | Exact evidence | Tier / limitation |
|---|---|---|---|
| Repository Validation | NOT_VERIFIED | workflow comparison at base; exact PR checks pending | repository workflow |
| Pipeline Integrity | NOT_VERIFIED | selected from main SHA `73ab68f…`; PR run pending | repository workflow |
| Gitleaks | NOT_VERIFIED | selected from main workflow; PR run pending | repository workflow |
| Trivy | NOT_VERIFIED | selected from main workflow; PR run pending | repository workflow |
| Harden Runner | NOT_VERIFIED | audit-only; `continue-on-error`; telemetry is non-blocking | best-effort |
| Dependency Review | NOT_VERIFIED | selected action pinned by SHA; PR run pending | GitHub Action |
| OpenSSF Scorecard | NOT_VERIFIED | scheduled/manual, SARIF private to repository, public publication disabled | supply-chain signal, not a release gate |
| Codecov | NOT_APPLICABLE | Node 24.19 LCOV probe: 234 records, including 224 generated `dist` JS files, one test fixture, and zero TypeScript records; no source-only coverage claim is safe | optional; no Codecov workflow added |
| SonarCloud / Socket | NOT_VERIFIED | current WO-009 checks passed on `8169464…`, but neither is a branch-protection requirement | optional; tier continuity must be rechecked |
| CodeRabbit / Greptile | NOT_VERIFIED | no required reviewer automation | optional; no Codex auto-review |

## Validation ledger

| Operation | Commit / run | Evidence | Result |
|---|---|---|---|
| Exact base and canonical source fingerprints | `e69d887a…` | Context Lock | PASS |
| Local dependency install and build | working tree at base, Node 24.19 | `npm ci --ignore-scripts` (0 vulnerabilities), `npm run build` | PASS |
| Local LCOV population audit | working tree at base, Node 24.19 | `coverage/lcov.info` summary; generated file excluded from commit | PASS for scope decision; Codecov adoption NOT_APPLICABLE |
| Local test execution during coverage probe | working tree at base, Node 24.19 | `node --test --experimental-test-coverage ...` exit code 1 in linked worktree; not accepted as product test evidence | NOT_VERIFIED |
| YAML syntax | pending | pending | NOT_VERIFIED |
| Immutable Action policy | 127 `uses` entries / 42 workflow YAML files | local immutable-SHA scan | PASS |
| Targeted validation | pending | pending | NOT_VERIFIED |
| PR exact-head checks | pending | pending | NOT_VERIFIED |
| Scorecard release-line run | pending | pending | NOT_VERIFIED |
| Owner audit | pending | pending | NOT_VERIFIED |
| Post-merge check state | pending | pending | NOT_VERIFIED |

## Profiling and claims

No CI cost/minute billing evidence is available through the checked GitHub interface. The measured PR #302 exact-head job durations are captured in its run URLs and were run on product changes, so they are not a before/after comparison for this workflow-only change. Record exact current durations/queue time where the API exposes them; do not claim a percentage reduction without comparable populations. The only planned optimization is removing a duplicate build from Repository Validation if the V1.1 `validate` script confirms it performs the build/typecheck and test path once.

## Security, free-tier and scope

No provider install or billing change is authorized by this Work Order. The pipeline's required repository checks must remain independent of SonarCloud, Socket, Codecov, CodeRabbit, Greptile and StepSecurity account continuity. Harden Runner stays audit-only and cannot make a workflow fail. No branch ruleset, product source, `main`, `v1.0.0`, artifact, release, or other repository is changed.

## Closeout

Complete only after exact-head checks, owner-operated audit (`OWNER_APPROVED`, not independent), squash merge into `release/1.1`, and post-merge verification. Preserve check URLs, run IDs, commit SHA, findings and unresolved optional-tier limitations here. Next legal action after closeout: refresh WO-009 Context Lock and revalidate its candidate against the new `release/1.1` base.
