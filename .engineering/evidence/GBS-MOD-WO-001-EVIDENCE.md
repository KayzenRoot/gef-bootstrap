# GBS-MOD-WO-001 — Evidence Bundle

**Work Order:** `GBS-MOD-WO-001` — context, contract and assurance router
**Issue:** [#394](https://github.com/KayzenRoot/gef-bootstrap/issues/394) · **Program:** #393
**Implementation PR:** [#407](https://github.com/KayzenRoot/gef-bootstrap/pull/407)
**Branch:** `feat/mod/wo-001-agent-native-gate`
**Implementation base:** `main@921493797728a43aadc9f7840c954ce7e3ebc416`
**Implementation head at evidence assembly:** `c76c2d8a8459f461bad519729d6b2fe83eed9d3d` plus the uncommitted implementation delta listed below
**Risk:** `ELEVATED` · **Product credit:** `NONE` · **V1.2 credit:** unchanged at `3 / 10`
**Stop condition reached:** `GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

This bundle records what was actually executed and observed. Owner audit is **NOT_INDEPENDENT**
(ADR-0006 / ADR-0007 owner-operated authority). No checkpoint was promoted, no merge was performed,
no version, tag, release, dependency or ruleset was changed.

---

## 1. Context Lock freshness, verified before the first mutation

The implementation Context Lock `.engineering/context-locks/GBS-MOD-WO-001.json` declares
`staleIf` conditions. All were checked against the live repository before any write.

| Condition | Required | Observed | Verdict |
| --- | --- | --- | --- |
| `main` equals `implementationBase.sha` before first mutation | `921493797728a43aadc9f7840c954ce7e3ebc416` | identical | NOT STALE |
| Implementation branch descends from `implementationBase.sha` | ancestor | ancestor | NOT STALE |
| Canonical + implementation source fingerprints unchanged | 28 blobs | 28 / 28 match | NOT STALE |
| Workflow fingerprints unchanged | 10 blobs | 10 / 10 match | NOT STALE |
| Branch descends from the implementation base | yes | yes | NOT STALE |

Verification is repeatable with the committed guard
`tests/gbs-mod-wo-001-pipeline-integrity.test.mjs`, which recomputes Git blob identities of every
workflow the lock bound at the base and fails on any mismatch.

## 2. Changed paths

Every path is inside `implementationAuthorization.writeAllowed`. No path is in `writeForbidden`.
Blob identities are stated at evidence assembly; this bundle's own blob is omitted because it cannot
state its own identity without a fixed point.

| Git blob | Path | Intent |
| --- | --- | --- |
| `22fccd620390d0844bb03a2cf7c063d2e3d078ff` | `.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md` | **new** — proposed checkpoint delta |
| `95cbc693beecef561df2b208b1338538392d9ac9` | `.engineering/context-locks/GBS-MOD-WO-001.json` | factual execution/evidence binding |
| `7ec3435645c211ffada77c6c3b5b2094b1422846` | `.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json` | **new** — measured benchmark receipt |
| `139acf1489170abfe858fddce3619fb598020cd1` | `.engineering/work-orders/GBS-MOD-WO-001.md` | machine-readable contract and executed-delta binding |
| `492f1d4ae66abe8749a082d68decc81a3b4fd702` | `AGENTS.md` | compacted into a trigger router |
| `030a6766593e52d2e3b3eaa7987d296a889e7e03` | `packages/assurance-pipeline/src/gef-gate.ts` | **new** — GEF Gate decision and receipt |
| `ea77b45f6194888a7337baae7fa494beccb35d47` | `packages/assurance-pipeline/src/public.ts` | export the GEF Gate |
| `8a18102efcb67b9d7866a010bd6a52db415e11cc` | `packages/contracts/src/index.ts` | re-export the work-order contract |
| `5e457869f0db0f7bcb36fae0b155b1ad4c12b6e6` | `packages/contracts/src/work-order.ts` | **new** — versioned Work Order contract, parser, glob authority |
| `c3bf728ad1bc7736f3021f86551169c320b9867b` | `packages/preflight/src/change-impact.ts` | **new** — deterministic path classification, risk tier, obligations |
| `5139133c4e3589b5e9b8638bdcdef8d797eb77aa` | `packages/preflight/src/index.ts` | re-export change impact |
| `c9c99ba0e051e93a6f51beadbad05ef58ab70605` | `packages/task-context-compiler/src/public.ts` | export the tiered Context Lock |
| `a5b373f6ff3fca16ab21755f36a28ce292344ec0` | `packages/task-context-compiler/src/s07-tiered-context-lock.ts` | **new** — tiered Context Lock compiler |
| `0d294a140a282d514d5a666d5843099e820ab208` | `packages/test-impact-engine/src/gate-closure.ts` | **new** — changed-path to source closure and validation floor |
| `b46bc5ab5db4cecc9358e1e93d450f2b41822f79` | `packages/test-impact-engine/src/public.ts` | export gate closure |
| `d60b79836cca354190870115c06c3fd85652d290` | `tests/gbs-mod-wo-001-benchmark.test.mjs` | **new** — focused proof |
| `963185ad5fd0fa58c6996a9086c162bc92d8dd9c` | `tests/gbs-mod-wo-001-change-impact.test.mjs` | **new** — focused proof |
| `aebe8eb71d06d86e7ab1145cb6131bf1dde1a5e3` | `tests/gbs-mod-wo-001-context-lock.test.mjs` | **new** — focused proof |
| `28f07d4c02985c51f20dc7b08af47270f30341cf` | `tests/gbs-mod-wo-001-gate-closure.test.mjs` | **new** — focused proof |
| `1597f351d80908df6b9af32dc7f843abb215310a` | `tests/gbs-mod-wo-001-gef-gate.test.mjs` | **new** — focused proof |
| `c6c4e8870541aaab3bba78ea353c5c01d89e71e1` | `tests/gbs-mod-wo-001-pipeline-integrity.test.mjs` | **new** — focused proof |
| `560fb188fc74d183a241e70c30a3f6978502a3fa` | `tests/gbs-mod-wo-001-routing.test.mjs` | **new** — focused proof |
| `9aa998f2d6a1b0860c16af90a9894e9db1613e5e` | `tests/gbs-mod-wo-001-work-order-contract.test.mjs` | **new** — focused proof |
| `b5473c20156e87a13c7b6f33f7b4531f8184d159` | `tests/helpers/gbs-mod-wo-001-benchmark-receipt.mjs` | **new** — shared routing/receipt helper |
| `f465e9389588301cc074e7d3a2aea9f3ba3c484f` | `tests/helpers/gbs-mod-wo-001-routing.mjs` | **new** — shared routing/receipt helper |

`.engineering/work-orders/GBS-MOD-WO-001.md` and `.engineering/context-locks/GBS-MOD-WO-001.json`
carry factual execution/evidence binding only, which the lock's `writeAllowed` explicitly permits.

## 3. Architecture ownership

Every mechanism landed in the package that already owns the concern. No parallel policy engine was
introduced and the frozen dependency graph was not modified.

| Node | Owner package | Extends |
| --- | --- | --- |
| A machine-readable Work Order contract | `packages/contracts` | existing contract layer; new `work-order.ts` |
| B change-impact + risk classification | `packages/preflight` | existing preflight package; new `change-impact.ts` |
| C tiered Context Lock | `packages/task-context-compiler` | existing M14 compiler; new `s07` stage |
| D dependency/test closure | `packages/test-impact-engine` | reuses `selectImpactedTests`, `progressiveValidationLevel`, `buildTestMap` |
| E GEF Gate receipt | `packages/assurance-pipeline` | new `gef-gate.ts`; mechanisms `GGD01/GGC02/GGV03/GGX04` registered separately from the frozen M27 registry |

No `package.json` or `tsconfig.json` was edited, so no dependency edge, project reference or
external dependency was added. The stages communicate only through plain data, which is the
existing M27/M28 convention: no stage imports another stage's implementation.

`packages/AGENTS.md` forbids silent filesystem, Git or provider work inside compiler and domain
packages. Classification is therefore a pure function of the changed-path set plus declared
repository facts; the Git reading stays with the caller.

## 4. What each acceptance criterion is proven by

| Criterion | Proof |
| --- | --- |
| A1 contract parses, rejects missing/ambiguous authority | `tests/gbs-mod-wo-001-work-order-contract.test.mjs` |
| A2 narrow task loads only required canonical sources, expands on triggered domains | `tests/gbs-mod-wo-001-context-lock.test.mjs` |
| A3 LOW/STANDARD/ELEVATED/HIGH_ASSURANCE reproducible from the same input | digest equality and permutation-invariance assertions in the change-impact, context-lock, closure, gate and routing suites |
| A4 governance-only selects a smaller proof set with an explicit receipt | `tests/gbs-mod-wo-001-benchmark.test.mjs` + `tests/gbs-mod-wo-001-routing.test.mjs` |
| A5 mixed/workflow/dependency/security/migration/release cannot use the fast path | `tests/gbs-mod-wo-001-routing.test.mjs`, `tests/gbs-mod-wo-001-change-impact.test.mjs` |
| A6 unknown/unclassified widens or blocks | empty set, unknown file, non-string path, incomplete attribution |
| A7 renames/moves/deletions and traversal/case variants cannot evade | adversarial routing suite; suspicious paths reach `BLOCKED` + `HIGH_ASSURANCE` |
| A8 checkpoint parity always enforced when either checkpoint file changes | explicit assertions for `.engineering/CHECKPOINT.md` and `CHECKPOINT.json` |
| A9 GEF Gate binds base/head and required checks | receipt binding assertions plus tamper detection on seven decision-bearing fields |
| A10 existing high-risk and release proof obligations intact | ruleset contexts retained at every tier; `RELEASE_ASSURANCE` + `SPECIALIST_REVIEW` added at HIGH_ASSURANCE; pipeline-integrity suite pins the workflow blobs |
| A11 no self-approval or checkpoint promotion path | `maySelectRequiredChecks`, `mayRelaxRulesetContexts`, `mayPromoteCheckpoint`, `mayRelease`, `manufacturesProductionCredit` are literal `false` |
| A12 comparable baseline and post measurement for one governance and one code fixture | `.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json`, regenerated and compared by the benchmark suite |

## 5. Measured benchmark

Measurement unit: **check runs selected by committed `pull_request` trigger definitions**. The
baseline is recorded from the implementation base `9214937`; no wall-clock claim is made. The
receipt is generated, never transcribed:

    node tests/helpers/gbs-mod-wo-001-benchmark-receipt.mjs

| Fixture | Baseline check runs | Tier | Decision | Required checks | Narrowing candidates |
| --- | --- | --- | --- | --- | --- |
| governance-only, declared LOW | 23 | `STANDARD` | `REDUCED_ADVISORY` | 9 | 6 |
| governance-only, declared ELEVATED | 23 | `ELEVATED` | `REDUCED_ADVISORY` | 9 | 6 |
| governance-only, declared HIGH_ASSURANCE | 23 | `HIGH_ASSURANCE` | `FULL_ASSURANCE` | 12 | 0 |
| product code, declared STANDARD | 38 | `ELEVATED` | `FULL_ASSURANCE` | 10 | 0 |

The `HIGH_ASSURANCE` row proposes no exclusions at all: when the dependency closure already demands
the whole suite (`L5`), the gate refuses to accept a caller's `outsideChangedClosure` claim and
retains every candidate as `NARROWING_REQUIRES_A_PROVEN_DEPENDENCY_CLOSURE`.

Every row keeps all four required main-branch ruleset contexts. The Context Lock's independent
observation of 38 check runs on real governance-only pull requests (#390, #395) is recorded beside
the model and is **not** claimed as reproduced by it: provider-side reports with no committed
workflow (SonarCloud, Socket, CodeRabbit) are outside the model by construction.

**Narrowing is reported, not enforced.** Every candidate carries
`enforcement: NOT_ENFORCED_PENDING_RULESET_AUTHORIZATION`.

## 6. Workflow routing: why no workflow changed

Scope item 6 and deliverable "workflow routing changes only after equivalence tests" were resolved
as *no workflow change*, for a stated reason rather than by omission:

- The four required main-branch ruleset contexts are produced by
  `repository-validation.yml`, `pipeline-integrity.yml` and `free-security-pilot.yml`. If a
  `paths:` filter were added to any of them, the required check would stop reporting on a
  governance-only pull request and the branch would become unmergeable under the existing ruleset.
- Narrowing CI is therefore only expressible once the ruleset can express it, and the ruleset
  rewrite is explicitly listed under *Important, not auto-included* in the Work Order.
- WRITE_FORBIDDEN additionally bars broad workflow deletion or threshold reduction.

What this Work Order delivers instead is the stable gate/check contract that a later authorized
ruleset update needs: the required context set, the per-check closure proofs, and the retention
reasons. `tests/gbs-mod-wo-001-pipeline-integrity.test.mjs` proves the current routing surface is
byte-for-byte unchanged and refuses to decide while the ruleset context set is unknown.

**Rollback path:** this Work Order's routing delta is empty. Reverting it is `git revert` of the
implementation commit; no workflow, ruleset or branch protection was touched, so there is nothing to
restore on the provider side.

## 7. Validation evidence

| Command | Result |
| --- | --- |
| `npm ci --ignore-scripts` | 33 packages, 0 vulnerabilities |
| `npm run build` | success, 27 packages |
| `npm run typecheck` | success, 27 packages |
| `npm run validate` (typecheck + `node --test tests/*.test.mjs`) | **1775 tests, 1775 pass, 0 fail, 0 skipped** |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `git diff --check` | clean |

Baseline before this implementation, at head `c76c2d8a8459f461bad519729d6b2fe83eed9d3d`:
**1659 tests, 1659 pass, 0 fail**. Net new: 116 tests.

The Context Lock's regression list was re-verified through `npm run validate`, which executes every
`tests/*.test.mjs`, including `tests/m14-*`, `tests/m27-*`, `tests/m28-*`, `tests/m04*`,
`tests/v12-wo-001-*` and the M27/M28 hardening and policy-drift suites.

The run is executed on Node `v24.19.0`. Exact-head GitHub required and security checks are
**NOT_VERIFIED** at this head: the evidence bundle was assembled before the push, and CI check-runs
are not observable from the executor environment.

## 8. Adversarial coverage

`tests/gbs-mod-wo-001-routing.test.mjs` drives the whole chain — classifier, Context Lock, closure,
gate — for each fixture, so a bypass at any stage is visible:

- traversal (`../`, `..\\`, embedded `..`), absolute paths, Windows drive prefixes, encoded
  separators and control characters → `BLOCKED`, `HIGH_ASSURANCE`, no receipt;
- case variants of `Packages/contracts/src/Index.ts`, `packages/CONTRACTS/src/A.TS` and
  `.ENGINEERING/SECURITY.md` → `UNKNOWN_SUSPICIOUS`; legitimately cased names such as `AGENTS.md`
  and `.engineering/CHECKPOINT.md` still classify;
- non-string path entries → suspicious rather than coerced;
- mixed documentation + code, workflow, dependency, build-config, schema and decision changes → fast
  path refused, `FULL_ASSURANCE`;
- renames/moves carrying both sides, and deletions outside the attribution index → closure widens;
- empty changed set, authority conflict, unproven changed state → no receipt at all;
- declared risk escalation to `HIGH_ASSURANCE` → specialist gate added, required contexts intact,
  and **no** exclusions proposed, because an `L5` closure floor refuses the caller's claim;
- frozen Scope, Requirements, Constitution and module gates → normative authority, fast path refused;
- executable files committed under `.engineering/` → product code;
- an unrecognised declared risk and truthy non-boolean fact flags → escalation, not silent pass;
- mandatory obligation floor, unproven ruleset set, unknown upstream states, duplicate candidate
  ordering and malformed collections all refused at the gate;
- traversal, case variants, encoded separators and non-string paths refused as write authority.

## 9. Self-review findings and their resolution

An adversarial review of the delta was run before the evidence was assembled. It found no bypass of
`classifyChangePath`, the traversal/case-variant handling, the closure attribution floor or the
gate's ruleset/SHA guards, and confirmed digest determinism across randomised input orderings. It did
find the following defects, all of which were fixed in this head and are now covered by tests:

| Finding | Resolution |
| --- | --- |
| Root-level `.engineering` documents (Scope, Requirements, Constitution, module gates, Technology Ledger) classified as descriptive `GOVERNANCE_DOC` at `LOW` with the fast path permitted | New `NORMATIVE_AUTHORITY_DOC` kind at `ELEVATED`, fast path refused; `SCOPE` and `REQUIREMENT` authority domains are now reachable |
| Executable content committed under `.engineering/` classified as a document | `.engineering/**/*.{ts,mts,js,mjs}` now classifies as `PRODUCT_CODE` before the document catch-all |
| An unrecognised `declaredRisk` was silently discarded | Escalates to `HIGH_ASSURANCE` with an `UNDECLARED_RISK_CLASS` reason |
| Fact flags compared with `=== true`, so a truthy non-boolean silently dropped an escalation | `factPresent` reads anything other than `undefined`/`false` as an escalation signal |
| `resolveWriteAuthority` returned `ALLOWED` for traversal paths that resolved outside the allowed subtree | `isAuthorizableWorkOrderPath` rejects traversal/`.`/empty/non-string paths and resolves them to `FORBIDDEN` |
| `dir/**` admitted the bare directory, authorising a directory rename the pattern never named | A trailing `**` now covers only the subtree below the directory it names |
| `**` was accepted as a pattern and admitted the entire repository | Rejected as the widest legal-looking spelling |
| `matchesWorkOrderPattern` threw on a non-string candidate | Returns `false`; a malformed candidate is a refusal, not a throw |
| `decideGefGate` order-dependence: duplicate check ids resolved by caller array order | Candidates normalized to one entry per id with the strictest reading winning |
| `decideGefGate` accepted unknown `impactState`, `contextLockState` and `validationFloor`, and threw on malformed collections | Validated up front with `GATE_STATE_UNKNOWN` / `GATE_INPUT_INVALID` / `GATE_BINDING_INVALID` |
| `decideGefGate` let a caller waive the mandatory obligation floor | `mandatoryObligationFloor` is enforced; a receipt missing any floor obligation is refused |
| `compileGateClosure` discarded an unrecognised `tierFloor` and iterated junk attribution values | Both validated up front; malformed input is refused rather than coerced |
| `compileTieredContextLock` threw on malformed collections and never loaded Requirements or Scope | Collections validated up front; `REQUIREMENTS.md` and `SCOPE.md` added at `ELEVATED` |
| A comment claimed the gate refuses when "the ladder demands the whole suite" while only excluding `L5` | Comment corrected to state what `L5` actually means, and why `L4` does not block narrowing |
| Tautological and self-comparing benchmark assertions | `narrowingEnforced` is now read from the receipt; the table is recomputed rather than compared with itself |

The review also flagged two disclosures that are recorded in section 10 rather than "fixed": the
Work Order contract has no production caller, and path attribution is caller-supplied.

## 10. Residual risk and disclosed limitations

1. **Narrowing is advisory only.** The gate names what a later authorized ruleset update could drop,
   but nothing is skipped today. Any expectation of a CI wall-time reduction is not yet supported.
2. **No wall-clock measurement.** Not reproducible from a deterministic test; the frozen Test &
   Benchmark Plan forbids an unsourced percentage.
3. **Baseline model scope.** It counts only check runs selected by committed `pull_request` trigger
   definitions, so it excludes provider-side reports with no committed workflow.
4. **Exact-head CI is unverified.** See section 7.
5. **Baseline risk classifier coverage.** A path that matches no classification rule is `UNKNOWN`
   and widens to `ELEVATED`; it does not block. Blocking on unknown is available through
   `changedStateUnproven`. A root-level `.engineering` document the domain table does not name is
   treated as normative authority (`NORMATIVE_AUTHORITY_DOC`, `ELEVATED`, fast path refused) rather
   than descriptive prose.
6. **The Work Order contract has no production caller.** `parseWorkOrderContract` proves the
   machine-readable grammar and the ambiguity rule, but GBS-MOD-WO-001's own write boundary is still
   prose in the Context Lock, and several entries there are descriptive phrases rather than globs
   (`packages/cli/src/** only if thin exposure is proven necessary`). Encoding this Work Order's
   boundary in the machine-readable form is follow-up work for the Work Order that first needs
   enforcement.
7. **Path attribution remains caller-supplied.** `compileGateClosure` widens to `L4` when
   attribution is incomplete and refuses malformed index values, but a caller that asserts
   completeness it cannot prove is still trusted; the gate cannot detect that from inside the
   contract.
8. **A malformed caller fact is read as an escalation, not as an error.** Fact flags accept any
   value other than `undefined`/`false` as present, and an unrecognised `declaredRisk` escalates to
   `HIGH_ASSURANCE`. This is deliberately fail-closed rather than fail-loud: a caller typo widens
   the gate instead of silently narrowing it.

## 11. Stop condition

`GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

Next legal action: owner exact-head semantic audit of PR #407 in Brazilian Portuguese, followed by
audit of `.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md`. No merge, no checkpoint
promotion and no ruleset change is authorized by this bundle.