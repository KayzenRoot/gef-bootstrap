# Evidence Bundle — GBS-V11-MAINT-PIPELINE-001

Status: `IN_PROGRESS`

## Exact-state bindings

- Base `release/1.1`: `e69d887a0f12b46218f40e849fdcf180e455eb3d`
- Main baseline: `73ab68f3f33f894027fb7a04c2696b02b839060a`
- Shared ancestor: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`
- Implementation branch: `feat/1.1/maint-pipeline-001`
- Candidate SHA: `0af66d00280c22f789ea2cd64d36983e7333a244` (implementation plus default-branch Scorecard guard; Evidence Bundle update follows this validated candidate)
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
| Repository Validation | PASS | [run 36493219288](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219288), check `109166491162`, head `0af66d00280c22f789ea2cd64d36983e7333a244` | repository workflow |
| Pipeline Integrity | PASS | [run 36493219299](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219299), check `109166489654`, head `0af66d00280c22f789ea2cd64d36983e7333a244` | repository workflow |
| Gitleaks | PASS | [run 36493219209](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219209), check `109166489261`, head `0af66d00280c22f789ea2cd64d36983e7333a244` | repository workflow; no leak finding reported |
| Trivy | PASS | [run 36493219209](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219209), check `109166489450`, head `0af66d00280c22f789ea2cd64d36983e7333a244` | repository workflow; no HIGH/CRITICAL threshold finding reported |
| CodeQL | PASS | [analysis run 36493219075](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219075), plus exact-head CodeQL check `109167022995` with 0 annotations, head `0af66d00280c22f789ea2cd64d36983e7333a244` | 0 new high-severity finding in changed code; inherited WO-009 issue remains release-blocking |
| Harden Runner | PASS | audit pre/run/post steps succeeded in both jobs in [run 36493219209](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219209); `continue-on-error`, telemetry non-blocking | best-effort; no network blocking enabled |
| Dependency Review | PASS | [run 36493219166](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36493219166), check `109166489898`, head `0af66d00280c22f789ea2cd64d36983e7333a244` | GitHub Action; no newly introduced HIGH/CRITICAL dependency blocker |
| OpenSSF Scorecard | NOT_VERIFIED | [manual run 36492033264](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36492033264) failed at `c118c2984fbeeadd25aec980c62b095ec378b29e`: upstream rejects non-default refs; SARIF upload skipped. Workflow guard added for default branch only; successful `main` run remains pending after promotion. | supply-chain signal, not a release gate; public Scorecard API publication disabled |
| Codecov | NOT_APPLICABLE | Node 24.19 LCOV probe: 234 records, including 224 generated `dist` JS files, one test fixture, and zero TypeScript records; no source-only coverage claim is safe | optional; no Codecov workflow added |
| SonarCloud | PASS | [PR #309 Quality Gate](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=309); 0 new/accepted issues, 0 hotspots, 0% duplication on new code at the candidate head | optional; not a branch-protection requirement |
| Socket | PASS | [Project report](https://socket.dev/dashboard/org/nexlabs/sbom/ece2d4bd-2b70-48cd-8836-93d886647686) and `Socket Security: Pull Request Alerts` passed on PR #309 | optional; not a branch-protection requirement |
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
| Targeted validation | `0af66d0…` | YAML parse for 42 workflow files, 127 full-SHA `uses` entries, `git diff --check`; local `npm ci --ignore-scripts` and `npm run build` were separately recorded against the locked base | PASS |
| PR exact-head checks | `0af66d0…` / PR #309 | 128/128 checks successful at this head; see [PR #309 checks](https://github.com/KayzenRoot/gef-bootstrap/pull/309/checks) | PASS |
| Scorecard non-default dispatch diagnostic | `c118c298…` / run 36492033264 | Failed before scanning because the upstream Action only supports default branch `main`; `0af66d0…` restricts the job to `main`, and Pipeline Integrity passed | FAIL (expected-ref mismatch; no Scorecard artifact was produced) |
| Scorecard supported-branch run | post-merge exact `main` SHA | pending | NOT_VERIFIED |
| Owner audit | pending | pending | NOT_VERIFIED |
| Post-merge check state | pending | pending | NOT_VERIFIED |

## Profiling and claims

The workflow-only PR produced 128 successful checks at candidate `0af66d00280c22f789ea2cd64d36983e7333a244`; the core measured jobs were Pipeline Integrity 7 s, Dependency Review 11 s, Gitleaks 14 s, Trivy 23 s, Repository Validation 66 s, and CodeQL Analyze TypeScript 93 s. Their summed execution time is 214 s across parallel runs; the common run batch began at 22:34:48Z and the last of these core jobs completed at 22:36:26Z (98 s wall time). The workflow-run API reports `created_at == run_started_at`; the inspected API does not expose per-job queue time or billed minutes. The repository is public and these jobs use standard GitHub-hosted runners; no larger runner or paid provider is required. No comparable before/after timing/cost population exists, so no percentage saving is claimed. The only implemented optimization removes a duplicate build from Repository Validation after confirming the V1.1 `validate` script covers the required path. The PR also demonstrates that `.engineering/**`/workflow path inclusions fan out to more than 100 checks; do not weaken those frozen assurance triggers in this Work Order.

## Security, free-tier and scope

No provider install or billing change is authorized by this Work Order. The pipeline's required repository checks must remain independent of SonarCloud, Socket, Codecov, CodeRabbit, Greptile and StepSecurity account continuity. Harden Runner stays audit-only and cannot make a workflow fail. No branch ruleset, product source, `main`, `v1.0.0`, artifact, release, or other repository is changed.

## Closeout

Complete only after exact-head checks, owner-operated audit (`OWNER_APPROVED`, not independent), squash merge into `release/1.1`, and post-merge verification. Preserve check URLs, run IDs, commit SHA, findings and unresolved optional-tier limitations here. Next legal action after closeout: refresh WO-009 Context Lock and revalidate its candidate against the new `release/1.1` base.
