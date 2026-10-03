# GBS-V12-WO-002 — Requirement, invariant and bug proof

**State:** OWNER_AUTHORIZED_FOR_ADMISSION_PLANNING / IMPLEMENTATION_NOT_YET_ADMITTED  
**Risk:** ELEVATED  
**Issue:** #380  
**Admission base:** `main@3213cc59293285748221b43b8dd7c6a51c8b5c2a`  
**Predecessor:** `GBS_V12_WO_001_PROMOTED`  
**Canonical V1.2 state at admission base:** U12-01/U12-02 = IMPLEMENTED/PASS; U12-03..U12-10 = NOT_IMPLEMENTED; universal implementation credit = 2/10.

## OBJECTIVE

Implement the bounded universal-core U12-04 / C05 delta after separate governed admission and a fresh implementation Context Lock.

Bug Hunter must bind the chain:

`requirement → invariant → hypothesis → test/probe → evidence → finding`

It must produce reproducible exact-state evidence, preserve negative and false-positive controls, distinguish an unproven hypothesis from a reproduced defect, and extend the current M24-M28 proof/evidence/assurance/test-impact machinery rather than replace it.

## CONTEXT

The canonical V1.2 backlog selects WO-002 after promoted WO-001.

C05 is `PARTIAL_DELTA`:
- M24 already owns machine evidence, authority, freshness, acceptance/rejection/staleness/conflict receipts and downstream proof handoff.
- M25 already owns claim/obligation/proof-graph evaluation, proof state, fingerprints and carry-forward.
- M26 already owns semantic finding lineage, review findings and finding registers.
- M27 already owns assurance classification, mandatory obligations and fail-closed assurance verdicts.
- M28 already owns source/test maps, impact selection, widening, regression radius, uncertainty handoff and V1.1 incremental-validation/proof-reuse overlays.

The missing universal delta is a single governed, deterministic requirement/invariant/hypothesis/bug-proof contract with retained controls. No second proof graph, finding engine, assurance engine, test-impact engine or executor is admitted.

## SCOPE

### NECESSARY
- U12-04 only.
- Stable deterministic identities for requirement, invariant, hypothesis, probe/test target and bug-finding lineage where needed by the delta.
- Exact project/source/proof/context binding for hypothesis and finding receipts.
- Requirement/invariant/hypothesis/test-or-probe/evidence/finding traceability.
- Finding states that make an unreproduced hypothesis visibly different from a reproduced defect.
- Negative-control evidence that is retained and cannot silently disappear from a success/defect claim.
- False-positive disposition with evidence/rationale and explicit lineage.
- Selective dependency-bound invalidation when source/proof truth changes.
- Deterministic target/probe selection through existing M28 semantics, including conservative widening on uncertainty.
- Evidence/proof/finding handoffs through existing M24-M27 ownership.
- Determinism, replay protection/deduplication, cancellation and bounded-resource behavior.

### IMPORTANT BUT NOT AUTO-INCLUDED
None. Any new requirement found during implementation must be escalated as a bounded Correction Delta before code expands.

## OUT OF SCOPE

- U12-03 Marathon completion.
- U12-05 Delta Assurance, including first-failure preservation, causal-repair linkage, flake registry/control or retry semantics.
- U12-06..U12-10.
- C03/C12 or D01-D12 profile implementation.
- SaaS-, EVM-, Godot- or other profile-specific Bug Hunter adapters.
- Autonomous arbitrary source mutation.
- Arbitrary command/process execution by M24-M28 semantic modules.
- A new top-level Bug Hunter, mutation, evidence, proof, finding, assurance or test-impact package.
- A second code executor or autonomous unbounded loop.
- Model/network/filesystem/Git/provider authority inside deterministic M24-M28 semantic code.
- New paid tools, expanded paid CI, new external SaaS, new hosted GEF runtime.
- Package version/tag/release/publication/deployment.
- Canonical checkpoint promotion before exact-head owner audit.
- ChatGPT authoring/fixing implementation code, tests, CI or migrations. Codex alone does those actions under ADR-0008 / D-0063.

## FILES / SOURCES TO READ

Before implementation preflight, read the current exact versions of:
1. `AGENTS.md`
2. `.engineering/SOURCE-HIERARCHY.md`
3. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`
4. `.engineering/DECISIONS-LEDGER.md` and applicable ADRs
5. `.engineering/SCOPE.md`
6. `.engineering/DEFINITION-OF-DONE.md`
7. `.engineering/ARCHITECTURE.md`
8. `.engineering/REQUIREMENTS.md`
9. `.engineering/SECURITY.md`
10. `.engineering/TEST-BENCHMARK-PLAN.md`
11. `.engineering/BACKLOG.md`
12. `.engineering/V1.2-RELEASE-DENOMINATOR.md`
13. `.engineering/V1.2-PROFILE-MATRIX.md`
14. this Work Order and its fresh implementation Context Lock
15. exported/current M24-M28 contracts and the focused tests that define their existing semantics.

## REQUIREMENTS

Canonical U12-04:
> Bug Hunter links requirement, invariant, hypothesis, test and finding; evidence distinguishes reproduced defects from hypotheses and retains negative/false-positive controls. It extends M24-M28 rather than replacing their proof graph.

Release-denominator proof contract:
> Reproducible requirement/invariant hypothesis proof with retained negative controls and classified findings.

No activity, generated hypothesis or passing test alone earns U12-04 credit. Credit requires the complete acceptance contract below, exact-head evidence, owner audit and governed checkpoint promotion.

## ARCHITECTURE RULES

1. **M24 Evidence Engine** remains evidence/freshness/authority/receipt owner. Do not create parallel evidence truth.
2. **M25 Proof Graph** remains claim/obligation/proof owner. Hypothesis/invariant proof must compose with it rather than create a second graph.
3. **M26 HEDS** remains semantic finding/lineage owner where its contracts are semantically sufficient. Extend boundedly only when required.
4. **M27 Assurance** retains risk floors and final-assurance ownership. Bug Hunter cannot waive or downgrade an assurance obligation.
5. **M28 Test Impact** retains test-target selection/widening. Unknown or incomplete impact can widen/block but never optimistically narrow.
6. Prefer an additive `s06`/V1.2 surface inside the existing owning package(s) only after Codex preflight proves the narrowest appropriate home.
7. No new top-level “bug-hunter”, “mutation-engine” or equivalent package without a separately owner-approved Architecture Correction Delta.
8. Hypothesis generation input may come from a semantic planner, but persisted/evaluated Bug Hunter mechanics are deterministic over governed input. The deterministic layer never invents product intent or authority.
9. A mutation/probe descriptor is inert planning/evidence data. It never authorizes source mutation, Git change or arbitrary process execution.
10. Machine contracts that cross package/persistence/public boundaries must remain versioned and exact-state bindable under frozen architecture rules.
11. Unknown/stale/conflicting proof is not PASS, reproduced defect or clean bill of health.
12. Profile-specific logic remains outside this universal-core Work Order.

## CONSTRAINTS

- Assurance overrides optimization.
- Fail closed on cross-project/cross-lineage evidence, stale bindings, missing authority, conflict, truncation or insufficient proof.
- Preserve current security/secret/process restrictions.
- No test weakening, threshold reduction or broad exclusion.
- No dependency/package/workflow change unless a separately owner-authorized Correction Delta proves it necessary.
- No progress percentage or ETA from implementation activity; canonical denominator remains 2/10 until governed promotion.
- Implementation branch must be freshly bound to post-admission/post-sync main before the first source edit.
- The admission-time Context Lock is not implementation authority.

## ACCEPTANCE CRITERIA — U12-04

1. **Stable hypothesis identity:** governed requirement + invariant + exact context produces a stable deterministic hypothesis identity.
2. **Complete trace:** requirement → invariant → hypothesis → target test/probe → evidence → finding IDs are retained without invented proof.
3. **Hypothesis is not defect:** an unexecuted, unreproduced or insufficiently evidenced hypothesis remains explicitly HYPOTHESIS/UNRESOLVED/INDETERMINATE and cannot be emitted as reproduced defect.
4. **Reproduction gate:** REPRODUCED defect state requires current accepted evidence satisfying the declared reproduction contract and exact-state binding.
5. **Negative controls retained:** negative-control identities/results are retained in the receipt and influence disposition; they cannot vanish merely because another probe failed.
6. **False-positive lineage:** false-positive disposition is explicit, rationale/evidence-bound and preserves the original hypothesis/finding lineage.
7. **Selective invalidation:** source/proof drift invalidates dependent hypotheses/findings only when narrower closure is proven; unrelated current evidence remains reusable.
8. **Mix-and-match protection:** cross-project, cross-lineage, stale proof, mismatched evidence, missing authority and conflicting evidence fail closed.
9. **M28 reuse:** targeted test/probe selection reuses M28 semantics and cannot suppress mandatory/final assurance; unknown impact widens or becomes INDETERMINATE.
10. **Dedup/replay:** equivalent/replayed inputs are deterministic and the same evidence/finding cannot be double-counted.
11. **Bounded failure:** cancellation, budget exhaustion or truncation yields truthful non-success/indeterminate output with no optimistic defect/PASS claim.
12. **Order determinism:** semantically equivalent input set ordering produces the same normalized semantic result/digest.
13. **No U12-05 leakage:** no causal-repair/flake/first-failure credit or semantics are inferred from this WO.
14. **No profile leakage:** no profile-specific adapter or conditional denominator earns credit.

## TESTS

After separately approved admission and fresh implementation-lock audit, Codex must run progressive validation:

1. package-local build/typecheck and focused U12-04 positive/negative tests for changed M24-M28 surfaces;
2. relevant existing M24 Evidence Engine suites;
3. relevant existing M25 Proof Graph suites;
4. relevant M26 HEDS finding/lineage suites when touched/consumed;
5. relevant M27 Assurance suites when touched/consumed;
6. relevant M28 Test Impact + V1.1 incremental-validation/proof-reuse regression;
7. new deterministic cases for traceability, unreproduced hypothesis, reproduced defect, negative controls, false-positive lineage, selective invalidation, stale/cross-lineage/mix-and-match, replay/dedup, uncertainty/widening, cancellation, budget/truncation and order independence;
8. `npm run build`;
9. `npm run typecheck`;
10. `npm run validate`;
11. `npm audit --audit-level=high`;
12. `git diff --check`;
13. exact-head required/security/integrated GitHub checks.

No weakening or deletion of existing coverage/assurance gates.

## DELIVERABLES

- bounded implementation within existing M24-M28 ownership where exact preflight confirms;
- public contract exports only where required;
- focused U12-04 tests plus applicable regressions;
- exact-head Evidence Bundle mapping every acceptance criterion to proof;
- base/head, changed files/symbols, source fingerprints and failures/corrections;
- CodeRabbit/security/check disposition;
- proposed Checkpoint Delta only, not canonical promotion by executor;
- implementation PR kept open for owner exact-head audit.

## EVIDENCE / CREDIT RULE

Before promotion, V1.2 canonical credit stays `2/10`.

U12-04 becomes PASS only after:
1. admitted implementation;
2. complete exact-head acceptance evidence;
3. owner exact-head audit `APPROVED / NOT_INDEPENDENT` with CRITICAL/HIGH = 0;
4. governed implementation merge and required post-merge assurance;
5. separate canonical checkpoint promotion.

No other U12 obligation earns credit from WO-002.

## REVIEW FORMAT

Português brasileiro. Include:
- exact base and head;
- changed paths and architecture ownership;
- Context Lock freshness;
- acceptance-case table;
- test/check evidence;
- negative/false-positive control evidence;
- CodeRabbit disposition;
- CRITICAL/HIGH counts;
- denominator impact;
- exactly one verdict: `APPROVED`, `CORRECTION REQUIRED`, or `BLOCKED`.

Owner-operated ChatGPT audit is always `NOT_INDEPENDENT`.

## STOP CONDITION

Admission planning:
`GBS_V12_WO_002_ADMISSION_READY_FOR_OWNER_AUDIT`

After approved admission and governed effectivity sync:
`GBS_V12_WO_002_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK`

After fresh implementation lock audit:
`GBS_V12_WO_002_ADMITTED_READY_FOR_CODEX`

Implementation:
`GBS_V12_WO_002_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

Terminal after governed promotion:
`GBS_V12_WO_002_PROMOTED`
