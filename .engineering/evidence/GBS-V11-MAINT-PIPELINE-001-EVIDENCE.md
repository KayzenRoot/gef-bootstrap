# Evidence Bundle — GBS-V11-MAINT-PIPELINE-001

Status: `PASS`

## Exact-state bindings

- Base `release/1.1`: `e69d887a0f12b46218f40e849fdcf180e455eb3d`
- Post-merge `release/1.1`: `44c6618ece1593365fb6c7f559d13c7166e7df26`
- Main baseline: `73ab68f3f33f894027fb7a04c2696b02b839060a`
- Shared ancestor: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`
- Implementation branch: `feat/1.1/maint-pipeline-001`
- Final PR candidate SHA: `a29986a715e11be91b24065775cd79752a51d3d4` (implementation `0af66d00280c22f789ea2cd64d36983e7333a244` plus exact-head Evidence Bundle update)
- PR: [#309](https://github.com/KayzenRoot/gef-bootstrap/pull/309)
- Owner audit: [`OWNER_APPROVED`, not independent](https://github.com/KayzenRoot/gef-bootstrap/pull/309#issuecomment-5880190800)
- Merge SHA: `44c6618ece1593365fb6c7f559d13c7166e7df26`; nine applicable post-merge workflows passed.

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
| OpenSSF Scorecard | PASS | [run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871) on default branch SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`; Scorecard scan and private repository SARIF upload succeeded. | supply-chain signal, not a release gate; public Scorecard API publication disabled; high maturity findings are triaged below |
| Codecov | NOT_APPLICABLE | Node 24.19 LCOV probe: 234 records, including 224 generated `dist` JS files, one test fixture, and zero TypeScript records; no source-only coverage claim is safe | optional; no Codecov workflow added |
| SonarCloud | PASS | [PR #309 Quality Gate](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=309); 0 new/accepted issues, 0 hotspots, 0% duplication on new code at the candidate head | optional; not a branch-protection requirement |
| Socket | PASS | [Project report](https://socket.dev/dashboard/org/nexlabs/sbom/ece2d4bd-2b70-48cd-8836-93d886647686) and `Socket Security: Pull Request Alerts` passed on PR #309 | optional; not a branch-protection requirement |
| CodeRabbit | BLOCKED | Billing page shows Advanced trial and estimated US$90/month after 12 Oct 2026; user requested cancellation, but the final cancel control requires a manual account-owner click. | optional; not a branch requirement; no payment method observed; no paid upgrade or usage billing enabled |
| Greptile | BLOCKED | Current trial hit its 50-credit limit; account page says add a payment method to continue after trial. | optional; not a branch requirement; do not add a card; no permanent free continuity confirmed for this `UNLICENSED` project |
| StepSecurity app scope | NOT_VERIFIED | App is installed and Harden Runner passed in audit mode; GitHub required sudo reauthentication before repository selection could be read. | workflow remains `audit` + `continue-on-error`; this integration cannot block CI |

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
| Scorecard supported-branch run | `main` / `73ab68f3f33f894027fb7a04c2696b02b839060a` | [run 36485873871](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36485873871); scan and SARIF upload succeeded; `publish_results: false` | PASS |
| Owner audit | `a29986a715e11be91b24065775cd79752a51d3d4` / PR #309 | [`OWNER_APPROVED`, not independent](https://github.com/KayzenRoot/gef-bootstrap/pull/309#issuecomment-5880190800); 132/132 exact-head checks and zero review threads | PASS |
| Post-merge check state | `44c6618ece1593365fb6c7f559d13c7166e7df26` | [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36495266671), [Free Security Pilot](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36495266550), [Repository Validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36495266676), [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36495266604), and WO-003..WO-007 run IDs recorded in the checkpoint | PASS |

## Profiling and claims

The workflow-only PR produced 128 successful checks at candidate `0af66d00280c22f789ea2cd64d36983e7333a244`; the core measured jobs were Pipeline Integrity 7 s, Dependency Review 11 s, Gitleaks 14 s, Trivy 23 s, Repository Validation 66 s, and CodeQL Analyze TypeScript 93 s. Their summed execution time is 214 s across parallel runs; the common run batch began at 22:34:48Z and the last of these core jobs completed at 22:36:26Z (98 s wall time). The workflow-run API reports `created_at == run_started_at`; the inspected API does not expose per-job queue time or billed minutes. The repository is public and these jobs use standard GitHub-hosted runners; no larger runner or paid provider is required. No comparable before/after timing/cost population exists, so no percentage saving is claimed. The only implemented optimization removes a duplicate build from Repository Validation after confirming the V1.1 `validate` script covers the required path. The PR also demonstrates that `.engineering/**`/workflow path inclusions fan out to more than 100 checks; do not weaken those frozen assurance triggers in this Work Order.

## Security, free-tier and scope

No provider install or billing change is authorized by this Work Order. The pipeline's required repository checks must remain independent of SonarCloud, Socket, Codecov, CodeRabbit, Greptile and StepSecurity account continuity. Harden Runner stays audit-only and cannot make a workflow fail. No branch ruleset, product source, `main`, `v1.0.0`, artifact, release, or other repository is changed.

## Closeout

Completed: exact-head checks passed on `a29986a715e11be91b24065775cd79752a51d3d4`, the owner-operated audit was `OWNER_APPROVED` (not independent), PR #309 was squash-merged at `44c6618ece1593365fb6c7f559d13c7166e7df26`, and all nine applicable post-merge workflows passed. No release promotion or production acceptance was performed. The next legal action is to refresh the separate WO-009 Context Lock and revalidate its candidate against the new `release/1.1` base.

## Post-merge findings, free continuity, and stop condition

### Scorecard findings on `main`

Scorecard completed on `main` SHA `73ab68f3f33f894027fb7a04c2696b02b839060a`. The repository code-scanning API returned 15 total findings, including three open HIGH Scorecard maturity findings:

| Alert | Rule | Observed result | Triage |
|---|---|---|---|
| [#3](https://github.com/KayzenRoot/gef-bootstrap/security/code-scanning/3) | BranchProtectionID | Score 3: stale-review dismissal, approver requirement, CODEOWNERS review, last-push approval and up-to-date branches are not all enabled. | Do not add a mandatory independent approver while the repo has no authorized independent reviewer. Existing PR requirement, four mandatory checks, thread resolution, no-delete/no-force-push and zero bypass actors remain active. Reassess governance when an independent reviewer is authorized. |
| [#13](https://github.com/KayzenRoot/gef-bootstrap/security/code-scanning/13) | CodeReviewID | Score 0: no approved changesets were detected in the first 30 sampled changesets. | Consistent with owner-only review under ADR-0006 and the current lack of an authorized independent reviewer; keep the pilot ready for independent review before rollout. |
| [#14](https://github.com/KayzenRoot/gef-bootstrap/security/code-scanning/14) | MaintainedID | Score 0 because the repository is less than 90 days old. | Time-dependent maturity signal; no code change can resolve the repository-age condition. |

These are Scorecard governance/maturity signals, not newly introduced product vulnerabilities. The original `js/clear-text-logging` CodeQL rule does not appear in the current `state=all` code-scanning alert list; that does not clear the still-open WO-009 release gate on `release/1.1` without the separate exact-head WO-009 audit.

### Tier and cost continuity

- No subscription, paid feature, payment method, credit purchase or trial extension was activated by this Work Order. GitHub-native Actions checks remain the required pipeline path.
- SonarQube Cloud, Socket and Codecov account pages showed their free plans. Their analyses remain optional: Sonar/Socket checks passed where configured; Codecov was not added because the existing LCOV contains generated JavaScript and no TypeScript source records.
- StepSecurity is best-effort only. Harden Runner completed in audit mode; the account's exact repository scope and post-trial plan remain `NOT_VERIFIED` because GitHub requested sudo reauthentication.
- CodeRabbit cancellation remains pending owner action. The billing UI exposes a “Cancel subscription” control that downgrades the current Advanced trial at its end; this workflow did not click the final consequential billing control. Greptile trial usage is exhausted and its free continuity is not established for this unlicensed repository. Neither app is a required check.
- A machine-readable summary of final app plans and their official free-tier references is in `docs/MASTER-ENGINEERING-PIPELINE-PILOT.md` on `main`; no account-wide app scope was expanded.

### Stop condition

`GBS_V11_PIPELINE_ADOPTED_EXACT_HEAD_AND_POST_MERGE_VERIFIED` is satisfied for the pipeline forward-port. This does not satisfy WO-009 product acceptance, clear its inherited release blocker, promote `main`, authorize the corporate rollout, or replace the required independent review before rollout.
