# GBS-MOD-WO-001 — Evidence Bundle

**Work Order:** `GBS-MOD-WO-001` — context, contract and assurance router
**Issue:** [#394](https://github.com/KayzenRoot/gef-bootstrap/issues/394) · **Program:** #393
**Implementation PR:** [#407](https://github.com/KayzenRoot/gef-bootstrap/pull/407)
**Branch:** `feat/mod/wo-001-agent-native-gate`
**Implementation base:** `main@921493797728a43aadc9f7840c954ce7e3ebc416`
**Candidate identity:** the branch tip of `feat/mod/wo-001-agent-native-gate` that carries this bundle. A commit cannot state its own SHA, so the candidate is bound to the branch plus its owner-audited parent `0f983b8b8b624ffa93fe7ab7a8072dcda1628b88`; resolve with `git rev-parse origin/feat/mod/wo-001-agent-native-gate`.
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

Full delta against the implementation base `921493797728a43aadc9f7840c954ce7e3ebc416`: **26 paths**. Every path is inside
`implementationAuthorization.writeAllowed`; no path is in `writeForbidden`. Blob identities are
stated at evidence assembly, and this bundle's own blob is omitted because it cannot state its own
identity without a fixed point.

| Git blob | Path | Intent |
| --- | --- | --- |
| `6418cc0507e41c6a04c36d50fa94cb2ee7b7b949` | `.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md` | **new** — proposed checkpoint delta |
| `daeb98629b4267e40be74f2fb3bec252ae45cf22` | `.engineering/context-locks/GBS-MOD-WO-001.json` | factual execution/evidence binding, candidate-bound |
| `45fe6fca3e481b9a04989173882f67d44428ee97` | `.engineering/evidence/GBS-MOD-WO-001-BENCHMARK.json` | **new** — measured benchmark receipt |
| `9ca3d32eb0baf8ee79c93c9baadfd5cef9bf60f5` | `.engineering/work-orders/GBS-MOD-WO-001.md` | machine-readable contract and executed-delta binding |
| `492f1d4ae66abe8749a082d68decc81a3b4fd702` | `AGENTS.md` | compacted into a trigger router |
| `cf8707dfbf2dbd9596d54ce23cc43524db014612` | `packages/assurance-pipeline/src/gef-gate.ts` | **new** — GEF Gate decision and receipt |
| `ea77b45f6194888a7337baae7fa494beccb35d47` | `packages/assurance-pipeline/src/public.ts` | export the GEF Gate |
| `8a18102efcb67b9d7866a010bd6a52db415e11cc` | `packages/contracts/src/index.ts` | re-export the work-order contract |
| `9a665ae1a4dff817349d48d799dfaa105eb5aff8` | `packages/contracts/src/work-order.ts` | **new** — versioned Work Order contract, parser, glob authority |
| `78710b58b6e747b17b61c4941172434b23011fcd` | `packages/preflight/src/change-impact.ts` | **new** — deterministic path classification, risk tier, obligations |
| `5139133c4e3589b5e9b8638bdcdef8d797eb77aa` | `packages/preflight/src/index.ts` | re-export change impact |
| `c9c99ba0e051e93a6f51beadbad05ef58ab70605` | `packages/task-context-compiler/src/public.ts` | export the tiered Context Lock |
| `94d3bad9933f21451c728936a0593e5faa4644dd` | `packages/task-context-compiler/src/s07-tiered-context-lock.ts` | **new** — tiered Context Lock compiler |
| `780bd950580067038a47511101f161a0a9021717` | `packages/test-impact-engine/src/gate-closure.ts` | **new** — changed-path to source closure and validation floor |
| `b46bc5ab5db4cecc9358e1e93d450f2b41822f79` | `packages/test-impact-engine/src/public.ts` | export gate closure |
| `d60b79836cca354190870115c06c3fd85652d290` | `tests/gbs-mod-wo-001-benchmark.test.mjs` | **new** — focused proof |
| `ec164b3ec20e30e345315652bef30959cea5c6dd` | `tests/gbs-mod-wo-001-change-impact.test.mjs` | **new** — focused proof |
| `aebe8eb71d06d86e7ab1145cb6131bf1dde1a5e3` | `tests/gbs-mod-wo-001-context-lock.test.mjs` | **new** — focused proof |
| `5cc5d3523d29db9a6c9a4e271b11049845ca4723` | `tests/gbs-mod-wo-001-gate-closure.test.mjs` | **new** — focused proof |
| `ba6a1e89926bab95b991e2df482a2a0c7593d40d` | `tests/gbs-mod-wo-001-gef-gate.test.mjs` | **new** — focused proof |
| `2e1e18c8e276c5fa1d42a77bb5aa4482def1419c` | `tests/gbs-mod-wo-001-pipeline-integrity.test.mjs` | **new** — routing-surface proof; corrected to read stored Git object IDs |
| `dab779acf3c0bda1bcec523967c515d8ce5a852a` | `tests/gbs-mod-wo-001-routing.test.mjs` | **new** — focused proof |
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
| `npm run validate` (typecheck + `node --test tests/*.test.mjs`) | **1781 tests, 1781 pass, 0 fail, 0 skipped** |
| `npm run validate` in a **depth-1 checkout** (the CI condition) | **1781 tests, 1781 pass, 0 fail, 0 skipped** |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `git diff --check` | clean |

Baseline before this implementation, at head `c76c2d8a8459f461bad519729d6b2fe83eed9d3d`:
**1659 tests, 1659 pass, 0 fail**. Net new: 121 tests against the implementation base.

The Context Lock's regression list was re-verified through `npm run validate`, which executes every
`tests/*.test.mjs`, including `tests/m14-*`, `tests/m27-*`, `tests/m28-*`, `tests/m04*`,
`tests/v12-wo-001-*` and the M27/M28 hardening and policy-drift suites.

The run is executed on Node `v24.19.0`.

### Cross-platform proof

The owner audit found the pipeline-integrity proof failing only on `windows-latest`. The whole
working tree of the committed candidate was converted LF -> CRLF to emulate a Windows checkout with
`core.autocrlf`, and the full suite was executed again: **1780 / 1780 pass**. Under that same
conversion:

| `repository-validation.yml` | value |
| --- | --- |
| working-tree SHA-1 (CRLF) | `cec22b62b1c1779e3cc118f0ab93d1c4ee1047d0` |
| stored Git object ID (`git rev-parse HEAD:<path>`) | `38c801e6009663448194045ab27ef25c7dcbf0f0` |
| recorded blob at the implementation base | `38c801e6009663448194045ab27ef25c7dcbf0f0` |

The working-tree hash no longer equals the recorded identity — the exact mismatch class the owner
reported — while the stored object ID does, so the assertion passes on both platforms. This is local
corroboration on a Linux host; the authoritative Ubuntu, macOS and Windows results are the GitHub
Actions runs on the candidate head.

### Exact-head GitHub disposition

Observed on the owner-audited parent `0f983b8b8b624ffa93fe7ab7a8072dcda1628b88`, from the GitHub
check-runs API: **64 check runs, 62 success, 2 failure, 0 pending.** All four required ruleset
contexts succeeded.

| Check | Result | Disposition |
| --- | --- | --- |
| Repository validation | SUCCESS | — |
| Pipeline integrity | SUCCESS | — |
| Gitleaks secrets | SUCCESS | — |
| Trivy filesystem and configuration | SUCCESS | — |
| Analyze TypeScript (CodeQL) | SUCCESS | — |
| Dependency Review | SUCCESS | — |
| Socket Security | SUCCESS | — |
| V1.1 release assurance / ubuntu-latest | SUCCESS | — |
| V1.1 release assurance / macos-latest | SUCCESS | — |
| **V1.1 release assurance / windows-latest** | **FAILURE** | corrected in this candidate |
| **SonarCloud Code Analysis** | **FAILURE** | corrected in this candidate |
| codecov/patch | SUCCESS | 99.50421%, 10 changed lines uncovered — advisory, additional branch coverage added |

Both failures were the owner audit's HIGH blockers 1 and 2, and both are addressed above. The
candidate head's own check runs are `PENDING_EXACT_HEAD_RUN_NOT_YET_OBSERVED`: this bundle was
assembled before the correction was pushed, so it records no disposition it cannot see.

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
4. **Candidate-head CI is not yet observed.** Section 7 records the parent head's exact disposition
   (62/64, both failures corrected). The candidate head's own runs are
   `PENDING_EXACT_HEAD_RUN_NOT_YET_OBSERVED` and must be read before the next audit.
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

## 11. Owner audit correction (review 5436978682, verdict CORRECTION REQUIRED)

Both HIGH blockers were corrected in this candidate. No rule was suppressed and no threshold was
lowered.

**Blocker 1 — cross-platform pipeline integrity.** The assertion compared a hash of the
checked-out working-tree bytes against Git blob IDs recorded at the implementation base. A Windows
checkout rewrites LF to CRLF unless `.gitattributes` says otherwise, so the two byte strings differ
per platform. It now reads the stored Git object ID with `git rev-parse --verify --quiet HEAD:<path>`,
which is the same value on every platform and at the recorded base. The assertion is unchanged in
strength: it still demands the exact recorded blob ID for all ten workflows, and an unusable Git, a
missing revision or an absent path is a test failure rather than a skip. Three tests were added: one proves
that the same file has two different SHA-1 values under CRLF/LF while one stored identity, one proves
that a missing path or unusable revision fails closed, and one corroborates the recorded base blob
whenever the base revision happens to be fetched.

**The first attempt at this correction was itself defective, and is recorded here.** It also required
the recorded base revision, which made the suite fail on a depth-1 pull-request checkout — exactly how
CI checks out. That regression was found by pushing, then reproduced locally in a depth-1 clone. The
fix separates the two concerns: the equivalence proof itself reads only the candidate's stored object
IDs and needs no history, while the base-side corroboration runs when the base is present and states
its absence when it is not. Both the depth-1 clone and the full-history clone now pass 1781 / 1781,
and a negative control — tampering with one workflow blob — still fails the proof.

**Blocker 2 — Sonar Reliability Rating D on new code.** The Quality Gate failed on
"D Reliability Rating on New Code (required >= A)". The rating is driven by BUG findings; the head
carried 41 open issues, 10 of them BUG, all `typescript:S2871` — alphabetical sorts with no
comparator or with a `localeCompare`-free one. All ten are removed: each package now exposes one
canonical code-point comparator used by every sort.

`localeCompare` was deliberately **not** adopted even though the rule text suggests it. Collation
depends on locale and ICU build, so the same repository state could produce two different receipt
digests on two runners — reintroducing precisely the platform-dependent-evidence defect blocker 1 is
about. Code-point ordering is locale-independent. The rule is satisfied by making the ordering
explicit and canonical, not by accepting a weaker property.

The remaining 31 code smells on the same head were also resolved rather than left behind: nested
ternaries (S3358), cognitive complexity in all flagged functions (S3776), chained sorts (S4043),
nested template literals (S4624), verbose digit classes (S6353), implicit stringification of
untrusted values (S6551), optional-chain preference (S6582), negative indexing (S7755), array
membership (S7776), `String#replace` over `replaceAll` (S7781) and a module-scope assertion (S8784).

## 12. Stop condition

`GBS_MOD_WO_001_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`

Next legal action: owner exact-head semantic audit of PR #407 in Brazilian Portuguese, followed by
audit of `.engineering/checkpoint-deltas/GBS-MOD-WO-001-PROPOSED.md`. No merge, no checkpoint
promotion and no ruleset change is authorized by this bundle.