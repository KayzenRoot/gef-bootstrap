# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective re-audit #2 is external

**Revision note (V2).** This bundle supersedes the evidence recorded at head
`17a81fac5d5417c1b14ade61fdf541b293dca59c`, which received `CORRECTION_REQUIRED`
(objective reaudit comment `5711990826`: CRITICAL 0 / HIGH 3). The claim
`CRITICAL: 0 / HIGH: 0` recorded at that head is **retracted** in §7. The H2/H3 and
M1/M2/M3 corrections from the previous cycle are preserved, not revisited.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Work branch | `feat/1.1/wo-002-cli-distribution` |
| Previous correction baseline | `8face8738c1640e0a7e1adbf460496cde4597210` |
| Reaudit #2 baseline (corrected head) | `17a81fac5d5417c1b14ade61fdf541b293dca59c` |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |
| `release/1.1` | `66e223fe…` — **unmodified** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite.

---

## 2. Closure mapping — H4 / H5 / H6

### HIGH H4 — capability probes no longer touch project content

`detectCaseSemantics()` wrote a fixed `${targetRoot}/.gef-private/CaseProbe` with a clobbering
write and then removed that path unconditionally; `probeDurability()` wrote a fixed
`${targetRoot}/.gef-private-durability-probe` with the default clobbering mode. Both were
target-visible mutations outside the transaction.

**Correction.** Probes now run through an invocation-owned probe authority
(`createOwnedProbe`): a collision-resistant `probe-<24 hex>` directory under the reserved
`.gef-private/probes` parent, created with `mkdir` **without** `recursive`, so `EEXIST` is the
ownership signal and the create is the proof. The measured file is written inside that directory
with `flag: "wx"`. Release removes only the files this invocation wrote and then calls `rmdir`
(non-recursive), which refuses a non-empty directory — anything not created here survives. The
`probes` parent itself is removed only if this invocation created it and it is still empty. A
file occupying the probe path cannot be claimed, so the measurement returns `UNKNOWN` and the
governed mutation fails closed without touching it.

**Regression evidence** — `tests/v11-wo-002-probe-safety.test.mjs` (7 cases, all PASS):

| Case | Evidence |
|---|---|
| successful apply | pre-existing `.gef-private/CaseProbe` and durability-probe content survive byte for byte; the governed artifact is still created |
| refused apply | a pre-existing artifact is refused and both probe-path files survive |
| residue | after probing, the `probes` directory does not exist and the private area is empty |
| pre-existing probe directory | reused, never removed; user content inside it survives |
| file at the probe path | preserved byte for byte; the probe yields `UNKNOWN` and the mutation refuses with no target effect |
| decoys in the probe parent | untouched; a free name is still owned |
| durability probe during a transaction | project content untouched |

### HIGH H5 — transaction authorization is a real decision

`applyGovernedCreate()` compiled a plan declaring `authorizationRequirements: [policyRef]` but
supplied `authorization: { authorize: () => ok(true) }`, making both the initial gate and the
commit-barrier reauthorization tautological, and it never passed `authorizationRefs`.

**Correction.** `createAuthorizationPort` replaces the unconditional allow and
`authorizationRefs: [policyRef]` is now supplied to `applyTransaction`. Every authorization call
re-evaluates: the revocation hook, the run identity, the presented policy references, the plan's
declared requirement, the plan's target binding, and the owning decision — which defaults to the
verified safety engine and is re-asked on every call, so an authorization that lapses between
staging and commit is refused. An unprovable decision (a throwing or unavailable capability) is a
denial, never an allow. `GovernedCreateOverrides.authorization` exists as a test seam; the
production default is the real port.

**Negative evidence** — `tests/v11-wo-002-authorization.test.mjs` (6 cases, all PASS):

| Case | Evidence |
|---|---|
| initial denial | `BLOCKED_BEFORE_EFFECT`, `AUTHORIZATION`, no `.gef` artifact, **no journal** (the transaction never started), no probe residue |
| revocation at the commit barrier | the port approves call 1 and denies call 2; the kernel demonstrably calls it twice; outcome `ABORTED_STAGED_NO_TARGET_EFFECT`, `AUTHORIZATION`, no artifact promoted, staging cleaned, abort journal recorded |
| unprovable decision | both a `{authorized:false}` decision and a throwing capability deny — the latter as `gef.authorization.decision_unavailable` |
| binding | run mismatch, policy not presented, requirement not declared, target mismatch and revocation each deny with a distinct reason code |
| production default | the real port consults the verified safety engine and admits |
| no over-blocking | an approving port results in `APPLIED` with exactly two authorization calls |

### HIGH H6 — unobserved dirtiness is never reported as clean

`observeRepository()` deliberately did not observe modified/staged/untracked files but passed
`repo/head/branch` with the dirty arrays omitted; the accepted engine reads omitted arrays as
empty and therefore returned `CLEAN`. Apply only blocked an in-progress Git operation, so unknown
evidence became a clean precondition.

**Correction.** `observeRepositoryDirtiness` reads the working tree deterministically with
`git status --porcelain -z` over an **argv array** (no shell string is ever built), against the
target repository only and bounded by a 10 s timeout. The parsed `modified`, `staged`,
`untracked` and `conflicted` arrays are supplied to `repositoryState`, so the verdict is derived
from real evidence. When `.git` exists but the tree cannot be read, the observation is `UNKNOWN`,
**no verdict is claimed at all**, and `--apply` blocks with `repository_state_unknown` before any
transaction-visible effect. A directory with no `.git` is `NOT_APPLICABLE` — a known-absent
repository, not an unknown one — so `init` on a fresh directory still works.

**Evidence** — `tests/v11-wo-002-repository-state.test.mjs` (6 cases, all PASS) plus
`CLI-E2E`:

| State | Observation | Engine verdict | Apply |
|---|---|---|---|
| no repository | `NOT_APPLICABLE`, `NO_LOCAL_GIT_DIRECTORY` | `BLOCKED` (missing repo) | allowed — the state is known |
| clean | `OBSERVED`, no limits | `CLEAN` | allowed |
| modified (unstaged) | `OBSERVED`, non-empty `modified` | `DIRTY` | allowed |
| staged | `OBSERVED`, non-empty `staged` | `DIRTY` | allowed |
| untracked | `OBSERVED`, non-empty `untracked` | `DIRTY` | allowed |
| conflicted (real merge conflict) | `OBSERVED`, non-empty `conflicted` | `BLOCKED` | blocked |
| mid-operation (`MERGE_HEAD`) | `OBSERVED`, `operation: MERGE` | `BLOCKED` | blocked (`repository_operation_in_progress`) |
| unreadable tree | `UNKNOWN`, `WORKING_TREE_NOT_OBSERVED` + the concrete reason, dirty arrays **absent** | none claimed (`verdict: null`) | blocked (`repository_state_unknown`) with zero target effect |

The conflicted fixture is a real two-branch merge conflict, so `UU` comes from Git rather than
from a hand-written status string.

---

## 3. Preservation of the previously closed findings

| Prior finding | Status |
|---|---|
| H1 kernel transaction/effect integration | **Preserved** — all managed state and receipt effects still go through `compileTransactionPlan`/`applyTransaction`; this cycle added authorization and probe corrections on top, and the 12-case transaction safety suite still passes |
| H2 frozen delegation map | **Preserved** — `installPlan`, `repositoryState`, `githubBootstrap`, `detectDrift`, `resolveCanonical`, `backupManifest`, `recoveryPlan` still bound by explicit module ownership |
| H3 real clean install | **Preserved** — the staging-based distribution and the real `npm install` smoke still pass with no source-checkout injection |
| M1 `helpIndex` authority | **Preserved** |
| M2 automatic non-TTY JSON | **Preserved** |
| M3 schemas and package payload | **Preserved** |
| No publication / tag / promotion | **Preserved** |

---

## 4. Changed files and reasons

14 paths: 9 modified, 5 added.

| Path | Kind | Reason |
|---|---|---|
| `packages/cli/src/transaction.ts` | M | H4 probe authority; H5 real authorization port; `commandId` binding; `authorizationRefs` |
| `packages/cli/src/engines.ts` | A | the verified engine boundary extracted so the registry and the transaction driver can share it without a circular import (H5 needs the safety decision there) |
| `packages/cli/src/registry.ts` | M | H6 dirtiness observation and the fail-closed apply gate; imports the extracted engine boundary |
| `packages/cli/src/main.ts` | M | passes `commandId` into the receipt transaction |
| `packages/cli/src/index.ts` | M | publishes the new surface |
| `packages/cli/README.md` | M | documents authorization, repository observation and probe ownership |
| `tests/v11-wo-002-probe-safety.test.mjs` | A | H4 regression suite |
| `tests/v11-wo-002-authorization.test.mjs` | A | H5 negative suite |
| `tests/v11-wo-002-repository-state.test.mjs` | A | H6 state matrix |
| `tests/v11-wo-002-cli.test.mjs` | M | the observation contract changed for the better |
| `tests/v11-wo-002-cli-e2e.test.mjs` | M | real-repository mid-operation fixture; unobservable-tree block case |
| `tests/v11-wo-002-dist-smoke.test.mjs` | M | the resolution-order assertion follows the extracted engine module |
| `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` | M | this bundle |

No `.engineering/` production state was modified. No package outside `packages/cli` was touched.

---

## 5. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `npm run validate` | **0** | **1290 tests, 1290 pass, 0 fail, 0 skipped** |
| 4 | `node --test …/v11-wo-002-probe-safety.test.mjs` | **0** | 7/7 |
| 5 | `node --test …/v11-wo-002-authorization.test.mjs` | **0** | 6/6 |
| 6 | `node --test …/v11-wo-002-repository-state.test.mjs` | **0** | 6/6 |
| 7 | `node --test …/v11-wo-002-transaction-safety.test.mjs` | **0** | 12/12 |
| 8 | `node --test …/v11-wo-002-cli.test.mjs` | **0** | 30/30 |
| 9 | `node --test …/v11-wo-002-cli-e2e.test.mjs` | **0** | 11/11 |
| 10 | `node --test …/v11-wo-002-dist-smoke.test.mjs` | **0** | 7/7 |
| 11 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |

Baseline: the reaudited head carried 1270 tests; this revision carries **1290** (+20: 7 probe
safety, 6 authorization, 6 repository state, 1 additional E2E case). No regression in any
pre-existing suite.

---

## 6. Explicit non-modification statement

| Asset | Statement | Verification |
|---|---|---|
| `main` | **NOT modified** | `origin/main` = `72c17bd3…` |
| tag `v1.0.0` | **NOT moved, replaced or deleted** | object `aac89f9c…` → `866fe3af…` |
| `release/1.1` | **NOT rewritten** | `66e223fe…` |
| `.engineering/` production state | **NOT modified** | only this bundle changed |
| Packages outside `packages/cli` | **NOT modified** | no other package source changed |
| Kernel safety | **NOT weakened** | no kernel source touched; the CLI now satisfies more of it |
| Publication / tag / release | **NOT performed** | — |
| Merge | **NOT performed** | PR #282 left open |
| Force-push / history rewrite | **NOT performed** | ordinary commits only |

---

## 7. Retractions

| Claim at `17a81fac` | Status |
|---|---|
| "CRITICAL: 0. HIGH: 0." | **RETRACTED** — objective reaudit #2 (`5711990826`) found three HIGH findings (H4, H5, H6). |
| "A file-backed journal port records durable recovery evidence; a real pre-state port lets the commit barrier detect a target that appeared after planning." | Retained, but **incomplete**: the same commit passed an unconditional authorization port, which is now corrected under H5. |
| "Case semantics are probed, never assumed." | Retained as a claim, but the probe itself was unsafe (H4); the probe is now ownership-proving and residue-free. |
| "Repository and canonical-source observations are read-only, bounded, and report what they cannot observe … instead of asserting a clean tree." | **RETRACTED for the clean case** — the observation reported the limitation while the *engine verdict* still became `CLEAN`. Corrected under H6. |

---

## 8. Findings by severity

**CRITICAL: 0. HIGH: 0** (after correction).

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H4 | was HIGH | probes could overwrite/delete user-owned files | **CLOSED** — owned, collision-resistant, no-clobber probes; 7-case regression suite |
| H5 | was HIGH | transaction authorization was an unconditional allow | **CLOSED** — real bound port re-evaluated at the commit barrier; 6-case negative suite |
| H6 | was HIGH | unobserved dirtiness was reported as `CLEAN` | **CLOSED** — deterministic dirtiness observation, no verdict when unknown, apply blocked; 6-case matrix |
| F1 | MEDIUM | the kernel classifies any `checkPhysicalSafety` failure as `CAPABILITY`, so a no-clobber refusal exits 40 rather than 20. The CLI preserves the engine's classification. | Recorded. Owner: kernel/M05 semantics. |
| F2 | MEDIUM | dirtiness now requires a `git` binary; where git is unavailable the CLI blocks `--apply`. This is the intended fail-closed behaviour, but it is a real operational dependency. | Recorded. Owner: WO-003 (Doctor) should surface it as an actionable diagnostic. |
| F3 | LOW | `--help` depends on the engine inventory and fails closed in a broken install. | Accepted, documented. |
| F4 | LOW | the symlink case reports a diagnostic and does not assert on this host (`EPERM`). | Recorded. |
| C4 | MEDIUM | carried from WO-001: `ARCHITECTURE.md` vs `D-0043` constitutional version. | Open. Owner: Project Owner. |
| C8 | MEDIUM | carried from WO-001: `Repository validation` triggers only for PRs to `main`. | Open. Owner: WO-009. |

No HIGH/CRITICAL finding was suppressed. No uncertainty was converted into a PASS.

---

## 9. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent
  verification and does **not** claim `APPROVED`.
- Local execution is `win32`. The new suites use real `git` fixtures and avoid
  platform-conditional assertions except where noted (the npm `.cmd` shim, symlink support);
  cross-platform evidence is produced by CI.
- The dirtiness observation adds one bounded `git status` call per repository-bearing apply. That
  is a deliberate correctness cost, not a claimed optimisation.
- No performance improvement is claimed; token metrics are unavailable in this environment.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_REAUDIT_2`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED.
