# Evidence Bundle — GBS-V11-MAINT-PIPELINE-001

Status: `IN_PROGRESS`

## Exact-state bindings

- Base `release/1.1`: `e69d887a0f12b46218f40e849fdcf180e455eb3d`
- Main baseline: `73ab68f3f33f894027fb7a04c2696b02b839060a`
- Shared ancestor: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`
- Implementation branch: `feat/1.1/maint-pipeline-001`
- Candidate SHA: `c118c2984fbeeadd25aec980c62b095ec378b29e` (first CI-validated candidate; follow-up guard change pending)
- PR: [#309](https://github.com/KayzenRoot/gef-bootstrap/pull/309)
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
| Repository Validation | PASS | [run 36491387445](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387445), check `109160558210`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | repository workflow |
| Pipeline Integrity | PASS | [run 36491387123](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387123), check `109160557285`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | repository workflow |
| Gitleaks | PASS | [run 36491387155](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387155), check `109160557486`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | repository workflow |
| Trivy | PASS | [run 36491387155](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387155), check `109160557106`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | repository workflow |
| CodeQL | PASS | [run 36491387541](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387541), check `109160559356`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | repository workflow; inherited WO-009 finding remains separately release-blocking |
| Harden Runner | PASS | audit pre/run/post steps succeeded in both jobs in [run 36491387155](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387155); `continue-on-error`, telemetry non-blocking | best-effort; no network blocking enabled |
| Dependency Review | PASS | [run 36491387341](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36491387341), check `109160558201`, head `c118c2984fbeeadd25aec980c62b095ec378b29e` | GitHub Action |
| OpenSSF Scorecard | NOT_VERIFIED | [manual run 36492033264](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36492033264) failed at `c118c2984fbeeadd25aec980c62b095ec378b29e`: upstream rejects non-default refs; SARIF upload skipped. Workflow guard added for default branch only; successful `main` run remains pending after promotion. | supply-chain signal, not a release gate; public Scorecard API publication disabled |
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
| YAML syntax | 42 workflow YAML files | parsed locally with Prettier 3.6.2; corrective diff parsed again before staging | PASS |
| Immutable Action policy | 127 `uses` entries / 42 workflow YAML files | local immutable-SHA scan | PASS |
| Targeted validation | `c118c298…` | YAML parse for 42 workflow files, 127 full-SHA `uses` entries, `git diff --check`, `npm run build`; local run of `git diff --check` and YAML parse repeated for the corrective diff before staging | PASS |
| PR exact-head checks | `c118c298…` / PR #309 | 128/128 checks successful at this head; see [PR #309 checks](https://github.com/KayzenRoot/gef-bootstrap/pull/309/checks) | PASS |
| Scorecard non-default dispatch diagnostic | `c118c298…` / run 36492033264 | Failed before scanning because the upstream Action only supports default branch `main`; workflow now guards the job to that ref | FAIL (expected-ref mismatch; correction pending CI) |
| Scorecard supported-branch run | post-merge exact `main` SHA | pending | NOT_VERIFIED |
| Owner audit | pending | pending | NOT_VERIFIED |
| Post-merge check state | pending | pending | NOT_VERIFIED |

## Profiling and claims

The workflow-only PR produced 128 successful checks at candidate `c118c2984fbeeadd25aec980c62b095ec378b29e`; the core measured jobs were Pipeline Integrity 6 s, Dependency Review 10 s, Gitleaks 12 s, Trivy 25 s, Repository Validation 44 s, and CodeQL 85 s. Their summed execution time is 182 s across parallel runs; the overall window from common run start (22:16:22Z) to the last of these core jobs completing (22:18:43Z) was 141 s. GitHub's queried run metadata showed `created_at == run_started_at`, but per-job queue time and billed minutes were not exposed by the inspected endpoint. No before/after cost or runtime population is comparable, so no percentage saving is claimed. The only implemented optimization removes a duplicate build from Repository Validation after confirming the V1.1 `validate` script covers the required path. The PR also demonstrates that `.engineering/**`/workflow path inclusions fan out to more than 100 checks; do not weaken those frozen assurance triggers in this Work Order.

## Security, free-tier and scope

No provider install or billing change is authorized by this Work Order. The pipeline's required repository checks must remain independent of SonarCloud, Socket, Codecov, CodeRabbit, Greptile and StepSecurity account continuity. Harden Runner stays audit-only and cannot make a workflow fail. No branch ruleset, product source, `main`, `v1.0.0`, artifact, release, or other repository is changed.

## Closeout

Complete only after exact-head checks, owner-operated audit (`OWNER_APPROVED`, not independent), squash merge into `release/1.1`, and post-merge verification. Preserve check URLs, run IDs, commit SHA, findings and unresolved optional-tier limitations here. Next legal action after closeout: refresh WO-009 Context Lock and revalidate its candidate against the new `release/1.1` base.
