# GBS-V12-WO-003 | Implementation evidence candidate

**State:** `PROPOSED_ONLY / NOT_ACCEPTED`  
**Issue:** #462 | **Implementation PR:** #470 (DRAFT)  
**Current code HEAD (pre-evidence update):** `8b8ffc661a674481fc0302b3a311d58e14433b7e`  
**Base main:** `3824cbc0baf3e7b7b6527608c7cc765b23f05a2c`  
**Actor authority:** owner-authorized ChatGPT under D-0066, PR #469 protected squash.  
**Independent review:** `NOT_INDEPENDENT` | **V1.2 credit:** `UNCHANGED_3_OF_10`.

## Implemented, source-bound surfaces

- **U12-03 / Marathon:** deterministic DAG waves, explicit SKIPPED state with durable non-completion stop reason, write/read exclusions, M15 Execution Pack admission, exact actor/base/lock/source-bound state hashes, START intent persisted before provider call, pause/resume, cancellation and first-failure stopping, atomic local filesystem CAS and creation under single-host trusted directory; durable restart and ambiguous-active reconciliation via read-only provider lookup. Persisted settlement requires external verified evidence; provider exception cannot cause automatic retry. Operator projection exposes eligible starts, reason-coded next actions and terminal stop provenance. A caller cannot forge a settlement verb to evade proof authority (negative test at `0d9e77e`). An **M17/M18 continuity gate** uses the actual M17 checkpoint+handoff+readiness and M18 resume receipt verifier ports; requires exact plan/state/base/lock, fresh durable snapshot after async verification and never grants provider authority. M63 read-only P1–P8 performance telemetry is bound to the same work order, source SHA, plan and state and preserves missing metrics as UNAVAILABLE.
- **U12-05 / Delta Assurance:** original first failing proof retained despite passing retries; bounded deterministic/flake candidate observations; graph-targeted conservative invalidation; M26 Bug Proof mandatory tests propagated without importing historic PASS as current evidence; externally verified test-attempt receipts append through durable CAS local file ledger; causal repair hypothesis remains `HYPOTHESIS_ONLY` until independently validated.

**Functional files:** `packages/execution-pack-compiler/src/v12-marathon*.ts` and `packages/heds-delta-review/src/v12-delta*.ts`, exported through existing public modules. No new provider authority, hosted worker, or branch/security workflow changes.

## Proof references and native checks

- Test suites: `tests/v12-wo-003-core.test.mjs` (43 declared scenarios), `tests/v12-wo-003-durable-file.test.mjs` (5), `tests/v12-wo-003-durable-delta.test.mjs` (3), `tests/v12-wo-003-telemetry.test.mjs` (2), `tests/v12-wo-003-continuity.test.mjs` (4 using actual M17/M18 exports), total **57 declared scenarios**. These are defined tests, not a DoD acceptance verdict. Test count is not an acceptance verdict.
- Scenarios include cycle/conflicting writes, stale actor/base/lock, duplicate intent/replay, cancellation, restart with active ambiguous effect, failed CAS, orphan lock, independently verified proof, first failure retained on retry, forged proof and wrong HEAD, proof-closure cycles, null receipt, M15/M26 admission, and operator stop reasons.
- The predecessor implementation HEAD `d0cff7df74356ecfab4fbb8f17da0d740b8f7d35` completed **53/53 GitHub checks SUCCESS**, including SonarCloud, native Windows/macOS/Linux suites and four required contexts. This is NOT an assertion that the newer code or the evidence-only final HEAD passed.
- The previous code HEAD `0d9e77e7104a740467c161605b9dfae7b67a6bfd` had all required contexts green. On the code HEAD `8b8ffc661a674481fc0302b3a311d58e14433b7e`, GitHub `Repository validation` ran `npm run validate` successfully, including the new continuity tests, and all tests/build/typecheck therein. The final full workflow matrix and any external quality-gate results require fresh read **after this documentation-only commit**. No previous head's success is credited to a later head. The prior telemetry commit `5199998e` failed installed-CLI smoke tests due to a non-vendored new import; `d099a816` inlines the M63 adapter into the already-vendored entrypoint without package or workflow changes. Do not silently count the failing intermediate head. `npm run build`, `npm run typecheck`, `npm run validate`, security and compatibility are delegated to native check attestations, not re-claimed without a matching current final HEAD.
- Performance/cost savings and prompt/CI invocation improvements: **UNAVAILABLE** without matched baseline samples. Do not invent percentages.

## Remaining work for A1/A2 acceptance

1. A bounded **real M17/M18 continuity proof is now implemented and directly tested** (4 integration tests), together with `SKIPPED` terminal non-completion and stop-reason tests. Remaining A1 is the complete M14/M15/M17/M18/M63 governed runtime recovery chain with independently corroborated provider receipts and release-compatible end-to-end operator runs. Read-only continuity admission does not grant executor authority.
2. Directly demonstrate M24/M25/M27/M28 proof and final assurance reconciliation for Delta, including fresh CI/security/platform tests on the final effective HEAD. A1/A2 cannot use proof reuse to suppress the mandatory final sweep.
3. Run final exact-HEAD CI for the last documentation commit, reconcile any remaining Sonar maintainability findings, verify all permitted write patterns, no unresolved review threads and no HIGH/CRITICAL blocker. Obtain actual independent approval where required, not an invented ChatGPT independent reviewer.
4. Only after code acceptance and protected **separately authorized** merge: verify new main, seek specific owner-approved checkpoint promotion of U12-03/U12-05 (at most 5/10 total). WO-004 remains dependent on this admission.

## Enforcement

- NO change to canonical `.engineering/CHECKPOINT.md` or `.engineering/CHECKPOINT.json`.
- NO self-merge, release, npm, tag, workflow waiver or paid integration.
- Historical security release blocker #439 must be independently reconciled before production release.
- **STOP:** `GBS_V12_WO003_IMPLEMENTATION_EVIDENCE_PROPOSED_NOT_ACCEPTED`.
