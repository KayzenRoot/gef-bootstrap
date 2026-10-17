# GBS-V12-WO-003 | Implementation evidence candidate

**State:** `PROPOSED_ONLY / NOT_ACCEPTED`  
**Issue:** #462 | **Implementation PR:** #470 (DRAFT)  
**Audited code HEAD (pre-evidence):** `34bc3d01a937c4af97660e227fb2500910cc8203`  
**Base main:** `3824cbc0baf3e7b7b6527608c7cc765b23f05a2c`  
**Actor authority:** owner-authorized ChatGPT under D-0066, PR #469 protected squash.  
**Independent review:** `NOT_INDEPENDENT` | **V1.2 credit:** `UNCHANGED_3_OF_10`.

## Implemented, source-bound surfaces

- **U12-03 / Marathon:** deterministic DAG waves and write/read exclusions, M15 Execution Pack admission, exact actor/base/lock/source-bound state hashes, START intent persisted before provider call, pause/resume, cancellation and first-failure stopping, atomic local filesystem CAS and creation under single-host trusted directory; durable restart and ambiguous-active reconciliation via read-only provider lookup. Persisted settlement requires external verified evidence; provider exception cannot cause automatic retry. Operator projection exposes eligible starts and reason-coded next actions.
- **U12-05 / Delta Assurance:** original first failing proof retained despite passing retries; bounded deterministic/flake candidate observations; graph-targeted conservative invalidation; M26 Bug Proof mandatory tests propagated without importing historic PASS as current evidence; externally verified test-attempt receipts append through durable CAS local file ledger; causal repair hypothesis remains `HYPOTHESIS_ONLY` until independently validated.

**Functional files:** `packages/execution-pack-compiler/src/v12-marathon*.ts` and `packages/heds-delta-review/src/v12-delta*.ts`, exported through existing public modules. No new provider authority, hosted worker, or branch/security workflow changes.

## Proof references and native checks

- Test suites: `tests/v12-wo-003-core.test.mjs` (41 declared scenarios), `tests/v12-wo-003-durable-file.test.mjs` (5), `tests/v12-wo-003-durable-delta.test.mjs` (3), total **49 declared scenarios**. Test count is not an acceptance verdict.
- Scenarios include cycle/conflicting writes, stale actor/base/lock, duplicate intent/replay, cancellation, restart with active ambiguous effect, failed CAS, orphan lock, independently verified proof, first failure retained on retry, forged proof and wrong HEAD, proof-closure cycles, null receipt, M15/M26 admission, and operator stop reasons.
- The predecessor implementation HEAD `d0cff7df74356ecfab4fbb8f17da0d740b8f7d35` completed **53/53 GitHub checks SUCCESS**, including SonarCloud, native Windows/macOS/Linux suites and four required contexts. This is NOT an assertion that the newer code or the evidence-only final HEAD passed.
- New code HEAD `34bc3d01a937c4af97660e227fb2500910cc8203` was verified in progress as of evidence preparation: full final check matrix and its exact-head result must be re-read from native GitHub after this document commit. `npm run build`, `npm run typecheck`, `npm run validate`, security and compatibility are delegated to native check attestations, not re-claimed without a matching current final HEAD.
- Performance/cost savings and prompt/CI invocation improvements: **UNAVAILABLE** without matched baseline samples. Do not invent percentages.

## Remaining work for A1/A2 acceptance

1. Directly demonstrate the existing M17 checkpoint and M18 resume continuity proofs and M63 read-only telemetry binding for Marathon; current durable/local port tests are not a substitute for *all* normative M14-M18/M63 interactions. Also decide whether the admitted `SKIPPED` terminal status and per-step stop receipt are required for A1, with exact negative tests.
2. Directly demonstrate M24/M25/M27/M28 proof and final assurance reconciliation for Delta, including fresh CI/security/platform tests on the final effective HEAD. A1/A2 cannot use proof reuse to suppress the mandatory final sweep.
3. Run final exact-HEAD CI, reconcile residual Sonar maintainability findings, verify all permitted write patterns, no unresolved review threads and no HIGH/CRITICAL blocker. Obtain actual independent approval where required, not an invented ChatGPT independent reviewer.
4. Only after code acceptance and protected **separately authorized** merge: verify new main, seek specific owner-approved checkpoint promotion of U12-03/U12-05 (at most 5/10 total). WO-004 remains dependent on this admission.

## Enforcement

- NO change to canonical `.engineering/CHECKPOINT.md` or `.engineering/CHECKPOINT.json`.
- NO self-merge, release, npm, tag, workflow waiver or paid integration.
- Historical security release blocker #439 must be independently reconciled before production release.
- **STOP:** `GBS_V12_WO003_IMPLEMENTATION_EVIDENCE_PROPOSED_NOT_ACCEPTED`.
