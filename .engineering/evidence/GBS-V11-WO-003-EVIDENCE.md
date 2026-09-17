# GBS-V11-WO-003 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-003.md`
Title: Doctor 2.0 + Status
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective audit is external

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Implementation branch | `feat/1.1/wo-003-doctor-status` |
| WO-003 admission merge | `7592624f7c9bf8726a7a460629f5e862a35a857d` |
| Implementation base (branch activation commit) | `77204f569388744e734b19acdaf2115bf0f7f3f6` |
| `origin/release/1.1` at execution | `7592624f7c9bf8726a7a460629f5e862a35a857d` — ancestor of HEAD (verified with `git merge-base --is-ancestor`) |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #284 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → target `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite, no tag creation, no publication.

---

## 2. What was delivered

Two read-only diagnostic commands, registered on the canonical IDs and projected through the
existing renderer contract. No `--fix`, no destructive repair, no `upgrade`, no migration/recovery
feature, no kernel change.

| Command | Command ID | Mutation | Owner (registry) |
|---|---|---|---|
| `gef doctor` | `gef.doctor.run` | `false` | `m48-m54-maintenance+security-reliability-integrations` |
| `gef status` | `gef.status.show` | `false` | `m41-m47-platform+m55-m61-quality+m62-m63-final` |

Both are `requiresTarget: false`: the target resolves from `--target`, then the kernel-bound target,
then `GEF_TARGET`, then the process working directory. `--apply` is refused for both at parse time
(reason `apply_not_admitted`, exit 10) **and** rejected again by input validation (reason
`apply_not_admitted`), and `main.ts` omits the apply key entirely from a read-only command request.

### Delegation map actually used

`gef.doctor.run` — all eight architecture-named symbols are bound and called:

| Symbol | Source module | Role in the projection |
|---|---|---|
| `doctor` | `m48-m54-maintenance` | findings from the measured observation map |
| `repairSuggestion` | `m48-m54-maintenance` | remediation for every non-`HEALTHY` finding |
| `invariantResult` | `m48-m54-maintenance` | `platform.supported`, `toolchain.nodeMajor`, `toolchain.git` |
| `dependencySecurity` | `security-reliability-integrations` | manifest/lock digests, audit counts, provenance |
| `githubSecurity` | `security-reliability-integrations` | provider security posture |
| `integritySnapshot` | `security-reliability-integrations` | composite integrity digest |
| `capabilityEnvelope` | `security-reliability-integrations` | verified vs unknown capabilities |
| `safetyDecision` | `security-reliability-integrations` | declared safety classification for a non-mutating read |

`gef.status.show` — all four architecture-named symbols are bound and called:

| Symbol | Source module | Role in the projection |
|---|---|---|
| `operatorStatus` | `m41-m47-platform` | operator state, declared progress, evidence set, staleness |
| `repositoryState` | `security-reliability-integrations` | repository verdict, derived only from an observation that saw the tree |
| `documentationManifest` | `m55-m61-quality` | documentation entries and digest |
| `navigationPlan` | `m62-m63-final` | navigation file set and I/O budget |

`detectDrift` (`security-reliability-integrations`) is additionally used to compare the recorded
governed baseline with the current observation. No algorithm from any of these engines is
reimplemented in CLI code: the CLI only measures bounded observations, hands them to the engine and
renders the engine's answer.

### Honesty rules embedded in the composition

- Dependency security is called with `provenance: "unverified"`, so the engine returns `REVIEW`,
  never `PASS`. The CLI has not independently verified an audit.
- `githubSecurity({})` is called with no provider evidence, so the engine returns `REVIEW`.
  No provider access is attempted and no provider model is introduced.
- `doctorObservations` never passes an optimistic `true`: an observation that could not be taken is
  either omitted (not applicable) or passed as `false` (measured and failing).
- `repository.observable` is omitted, not passed as `true`, when there is no repository at all.
- Operator progress is the declared `overallCompletionPercent` or `null`; it is never estimated.
- `repository.verdict` is `null` while the working-tree dirtiness is `UNKNOWN`, so unknown evidence
  can never be presented as a clean precondition.
- Production truth and the V1.1 development overlay are reported as separate fields and never merged.
- `driftBaseline` is stated explicitly (see §3.4), so the absence of governed state is never read as
  drift of governed state.

---

## 3. Changed files and reasons

### 3.1 Files inside the Context Lock `expectedWriteSurface`

| File | Change | Reason |
|---|---|---|
| `packages/cli/src/parser.ts` | `CliVerb` gains `doctor`/`status`; `ACTION_MAP` gains both frozen actions; `ADMITTED_VERBS` grows to four; new `APPLY_CAPABLE_VERBS` gates `--apply` | WO-003 scope A/B/C — canonical verb → command-ID mapping and the refusal of a mutation flag on a read-only verb |
| `packages/cli/src/registry.ts` | Read-only probes (`gitBinaryAvailable`, `observeGovernance`, `observeGovernanceFiles`, `observeDocumentation`); `DiagnosisInput`/`validateDiagnosisInput`; `doctorObservations`, `doctorComposition`, `statusComposition`, `diagnosisEnginesFailure`, `diagnosisHandler`; two registrations; `CLI_COMMAND_IDS` and `HELP_INVENTORY` extended to six | WO-003 scope A/B/C — engine binding and read-only composition |
| `packages/cli/src/render.ts` | One line: the "not yet available" note now names only `upgrade` | WO-003 scope C — the deferred-command note must not claim doctor/status are unavailable |
| `packages/cli/src/main.ts` | `commandRequestFor` omits the apply key for read-only verbs | WO-003 scope C — a read-only command request declares no mutation intent at all |
| `packages/cli/src/engines.ts` | Three module sources added (`m41-m47-platform`, `m55-m61-quality`, `m62-m63-final`); ten symbols added to `REQUIRED_SYMBOLS`; interfaces and bindings for each | WO-003 scope A/B — expose the architecture-named symbols that already exist at the base; no engine logic is added |
| `packages/cli/README.md` | Command table, delegation table, doctor/status behaviour section, vendored-engine list | WO-003 evidence/AC-13 — the documented surface must match the implemented surface |
| `tests/v11-wo-003-doctor-status.test.mjs` | new, 16 tests | WO-003 ladder L1 |
| `tests/v11-wo-003-doctor-status-e2e.test.mjs` | new, 9 tests | WO-003 ladder L2 |
| `tests/v11-wo-003-dist-smoke.test.mjs` | new, 5 tests | WO-003 ladder L3 |
| `.engineering/evidence/GBS-V11-WO-003-EVIDENCE.md` | new (this file) | WO-003 evidence bundle |

### 3.2 Context expansions (writes outside the Context Lock surface, each with a concrete dependency reason)

| File | Reason |
|---|---|
| `packages/cli/src/index.ts` | The package barrel re-exports the registry surface. The new probes and types must be exported for library consumers and for the tests; without this the added surface is unreachable and the type layer is inconsistent. Mechanical consequence of the registry change, no new policy. |
| `packages/cli/scripts/prepare-package.mjs` | Packaging parity (brief step 8) is impossible without vendoring the three engine modules the diagnostic commands resolve. `vendor/engines` would otherwise lack `m41-m47-platform`, `m55-m61-quality` and `m62-m63-final`, and the installed CLI would fail closed instead of matching the source workspace. |
| `tests/v11-wo-002-cli.test.mjs` | Mechanical assertion update: the test encoded the four-command inventory and the nineteen-symbol engine surface. Both numbers are now six and twenty-nine. Required by "preserve `init`/`adopt` behavior" — the assertions describe the surface, not the behavior. |
| `tests/v11-wo-002-cli-e2e.test.mjs` | Same mechanical update in the process-level suite (command inventory and deferred-command expectations). |
| `tests/v11-wo-002-dist-smoke.test.mjs` | Same mechanical update in the packed-install suite (installed `--help` inventory). |

No expansion touched `packages/kernel`, the V1.0 accepted history, any workflow, or any
upgrade/migration or WO-005+ surface. The negative-search ledger in §9 records what was deliberately
not changed.

### 3.3 Read scope

Read only the Execution Brief minimum read set plus the directly named engine modules required to
bind the verified symbols (`m48-m54-maintenance`, `area-h-governance`,
`security-reliability-integrations`, `m41-m47-platform`, `m55-m61-quality`, `m62-m63-final`). No
repository-wide rediscovery pass was performed. `detectDrift` and `operatorStatus` were read to
confirm their exact contracts before composing inputs.

### 3.4 A projection defect found and fixed during implementation

`detectDrift` compares two observations and is not told whether a governed baseline exists. The
first working version of `statusComposition` passed the `"NO_RECORDED_STATE"` sentinel on a target
with no `.gef` state, so the engine returned `changed: true, class: "UNEXPECTED"` — an assertion that
a target had drifted when in fact it had never been governed. That is uncertainty converted into a
definite negative claim.

The correction is additive and does not reinterpret the engine: the engine's verdict is reported
verbatim, and the projection now states the baseline explicitly.

```json
"driftBaseline": { "state": "RECORDED" | "ABSENT", "ref": ".gef/init-state.json" | ".gef/adopt-state.json" | null }
```

`observationLimits` carries `drift.baseline.absent` when no governed artifact exists. The baseline is
taken from whichever managed artifact exists — `init` **or** `adopt` — because `status` is
verb-agnostic and an adopted target is governed too. Covered by the test
`the status baseline is taken from whichever governed artifact exists`.

---

## 4. Validation ladder — commands, exit codes, counts

| Step | Command | Exit | Result |
|---|---|---|---|
| Build | `npm run build -- --force` | 0 | 28 projects compiled from scratch |
| Typecheck | `npm run typecheck` | 0 | clean |
| L1 focused | `node --test tests/v11-wo-003-doctor-status.test.mjs` | 0 | tests 16 / pass 16 / fail 0 |
| L2 process E2E | `node --test tests/v11-wo-003-doctor-status-e2e.test.mjs` | 0 | tests 9 / pass 9 / fail 0 |
| L3 packed install | `node --test tests/v11-wo-003-dist-smoke.test.mjs` | 0 | tests 5 / pass 5 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-cli.test.mjs` | 0 | tests 30 / pass 30 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-cli-e2e.test.mjs` | 0 | tests 11 / pass 11 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-dist-smoke.test.mjs` | 0 | tests 7 / pass 7 / fail 0 |
| L4 full | `npm run validate` | 0 | tests 1374 / pass 1374 / fail 0 |
| Dependency audit | `npm audit --audit-level=high` | 0 | found 0 vulnerabilities |

The combined six-suite run reports tests 78 / pass 78 / fail 0. No test was skipped to reduce
runtime; every required suite ran in full.

### Observed projections (source workspace, target = repository root)

`gef doctor --target . --json` → exit 0, `commandId: gef.doctor.run`, `terminal: SUCCEEDED`,
`effect: NONE`:

```
findings      toolchain.node HEALTHY · toolchain.platform HEALTHY · toolchain.git HEALTHY · repository.observable HEALTHY
remediation   []
invariants    platform.supported pass · toolchain.nodeMajor pass · toolchain.git pass
security      dependency REVIEW (provenance unverified) · github REVIEW (no provider evidence) · safety READY (classification NONE)
capabilities  COMPATIBLE · unknown []
governance    .engineering/CHECKPOINT.json present+readable · observationLimits []
```

`gef status --target . --json` → exit 0, `commandId: gef.status.show`, `terminal: SUCCEEDED`,
`effect: NONE`:

```
repository    verdict DIRTY (the working tree carries this increment's uncommitted changes) · dirtiness OBSERVED
release       production.status GBS_V1_PRODUCTION_ACCEPTED · overallCompletionPercent 100
              development.status GBS_V11_WO_003_ADMITTED · releaseLine 1.1.x
operator      state GBS_V1_PRODUCTION_ACCEPTED · progress 100 · stale true
driftBaseline { state: "ABSENT", ref: null }
limits        ["drift.baseline.absent"]
```

The repository root carries no `.gef` governed artifact, so the baseline is reported as absent
rather than as a target that drifted. The `operator.state` shown here is the state **declared by the
governance source**, not a claim about the repository; the repository claim is `repository.verdict`,
which is `DIRTY` because this increment's changes are still uncommitted at smoke time.

Human (TTY) projection for both commands is the unchanged WO-002 renderer contract:
`<commandId>: <terminal>` followed by the same value payload. The renderers were **not** extended:
the existing contract is already deterministic and semantically aligned with the JSON envelope, and
the Execution Brief permits renderer extension only where the current renderers need it.

---

## 5. No-mutation proof

Every mutation-capable surface was compared before and after a real invocation.

| Surface | Method | Result |
|---|---|---|
| Project tree | recursive snapshot of every entry with type and sha256, before/after | identical |
| `.gef` state directory | existence check | never created |
| `.gef-private` transaction substrate | existence check | never created |
| Git working tree | `git status --porcelain` | identical |
| Git branch | `git rev-parse --abbrev-ref HEAD` | identical |
| Git HEAD | `git rev-parse HEAD` | identical |
| Git tags | `git tag --list` | identical |
| Governed artifact content | `.gef/adopt-state.json` read before/after | identical |
| Provider/GitHub state | no provider call is made at all | n/a |

Repository-root smoke with the real binary, immediately before writing this bundle:

```
$ git status --porcelain > before ; git rev-parse HEAD > head-before ; git tag --list > tags-before
$ node packages/cli/bin/gef.mjs doctor --target . --json   # exit 0
$ node packages/cli/bin/gef.mjs status --target . --json   # exit 0
$ git status --porcelain > after ; ...
TREE_UNCHANGED
HEAD_UNCHANGED
TAGS_UNCHANGED
```

The E2E suite performs the same comparison inside a real Git repository (the repository itself),
and the focused suite performs it over a recursive digest snapshot of a seeded project tree.
Neither command reads stdin, so a non-TTY invocation cannot block on an implicit prompt.

---

## 6. Git-unavailable / capability fail-closed proof (WO-002 F2 closure)

Reproduced with a real process and an emptied `PATH` (absolute Node path retained):

```
$ PATH="" node packages/cli/bin/gef.mjs doctor --target . --json     # exit 0
findings      toolchain.node HEALTHY · toolchain.platform HEALTHY
              toolchain.git FINDING · repository.observable FINDING
remediation   toolchain.git        { risk: REVIEW_REQUIRED, automatic: false, previewRequired: true }
              repository.observable { risk: REVIEW_REQUIRED, automatic: false, previewRequired: true }
invariants    toolchain.git { pass: false, actual: false, expected: true }
capabilities  state DEGRADED · unknown ["repository.observable","toolchain.git"]

$ PATH="" node packages/cli/bin/gef.mjs status --target . --json     # exit 0
repository    verdict null · dirtiness UNKNOWN
              observationLimits ["WORKING_TREE_NOT_OBSERVED","DIRTINESS_UNKNOWN:spawnSync git ENOENT"]
```

A missing Git binary is therefore an actionable, structured, non-automatic diagnostic in `doctor`,
and `status` reports the repository as unknown with a `null` verdict rather than clean. There is no
path by which Git absence becomes a healthy verdict or a `CLEAN` repository.

Additional fail-closed cases covered by tests:

- Git present but the target tree unobservable → `status` stays unknown.
- A broken install with `vendor/` removed → both commands exit 40 with a `CAPABILITY` envelope, no
  partial value, and no project mutation.
- A target with no governance source → `release.present: false`, `operator.progress: null`, and the
  V1.1 overlay is not invented.

---

## 7. Local packed-install parity proof

`tests/v11-wo-003-dist-smoke.test.mjs` builds the package with the repository's staging script
(`scripts/prepare-package.mjs --pack`), installs the tarball with a real `npm install` into a fresh
temporary directory, and runs the installed binary. Nothing from the source tree is copied in, and
no registry is contacted.

| Check | Result |
|---|---|
| Vendored engines present | `m48-m54-maintenance`, `area-h-governance`, `security-reliability-integrations`, `m41-m47-platform`, `m55-m61-quality`, `m62-m63-final` |
| `vendor/MANIFEST.json` | 6 engine artefacts, each with a recorded sha256 |
| Source-tree injection | absent — `src`, `tsconfig.json` and `scripts` are not packaged |
| Installed `gef doctor --target <dir> --json` | exit 0, `gef.doctor.run`, `readOnly: true`, `toolchain.git HEALTHY`, `github.state REVIEW` |
| Installed `gef status --target <dir> --json` | exit 0, `gef.status.show`, `readOnly: true`, production and development present |
| Installed `gef --version` | exit 0, version equals the package manifest |
| Installed `--help` | exit 0, six command IDs in `helpIndex` order |
| `--apply` on either command | exit 10, project untouched |
| Unknown flag | exit 10 |
| WO-002 behaviour | `init` plan is `effect: NONE` and does not create `.gef`; `init --apply` reports `APPLIED`; `status` leaves the governed artifact byte-identical |
| Vendored engines removed | both commands exit 40, `error.category CAPABILITY`, no `value`, no mutation |

---

## 8. `init` / `adopt` regression proof

The three WO-002 suites run unchanged in behavior at this head: 30 + 11 + 7 = 48 tests, all
passing. The only edits to those files are assertion updates for the grown command inventory and
engine-symbol count; no `init`/`adopt` behavioral assertion was weakened, removed or relaxed, and no
transaction, traversal, recovery, private-containment, journal-ownership or authorization contract
was modified. `packages/kernel` is untouched by this increment (see §9).

---

## 9. Negative-search ledger — deliberate non-changes

| Not changed | Why |
|---|---|
| `packages/kernel/**` | The diagnostic commands are read-only projections; no kernel contract needed modification. WO-002 F1 (kernel physical-safety exit classification) stays with its owner. |
| Kernel transaction, traversal, recovery, journal and authorization semantics | Preserved byte-for-byte; the WO forbids regression and no change was required. |
| `.github/workflows/**` | C8 remains owned by WO-009. No workflow was added, removed or relaxed. |
| `main`, tag `v1.0.0`, V1.0 acceptance history | Forbidden by the Work Order and the handoff production boundary. |
| `upgrade`, migration, recovery product features | Out of scope (WO-004). `upgrade` remains refused on the canonical usage path. |
| WO-005+ surfaces (Context Compiler, Execution Capsule, incremental validation, telemetry, channel redesign, production acceptance) | Out of scope. |
| `packages/cli/src/transaction.ts`, `private-authority.ts`, `schemas.ts`, `packages/cli/schemas/**` | Untouched. The diagnostic commands do not enter the private transaction area at all. |
| `render.ts` human formatting | Not extended: the existing renderer contract already satisfies AC-7 and the brief's "only where current renderers need extension". |
| Repository-wide search | Not performed; the read set was the Execution Brief minimum set plus the directly named engine modules. |

---

## 10. No-publication and production-boundary statement

- No merge was performed. PR #284 remains open and unmerged.
- No tag was created or moved; `v1.0.0` still resolves to object
  `aac89f9c3f0c884474958025bf14828bc338b5ee` → target
  `866fe3af8cccc65c929aaf6a47a924401fa448b3`.
- No npm publication, no GitHub Release, no registry contact. `private: true` and the absence of
  `publishConfig` make an accidental publication mechanically impossible.
- `main` was not read into, written to, or targeted. `main` is never an execution target of these
  commands.
- No force-push, no history rewrite, no self-approval. The executor does not claim `APPROVED`.

---

## 11. Findings by severity

### CRITICAL — 0

### HIGH — 0

### MEDIUM — 1 (carried, not introduced)

| ID | Finding | Owner | Disposition |
|---|---|---|---|
| C4 | Constitutional version binding | Project Owner | Not expanded into WO-003, per the Work Order's known-findings section. |

### LOW — 3

| ID | Finding | Owner | Disposition |
|---|---|---|---|
| L1 | The human (TTY) projection for `doctor` and `status` is the unchanged WO-002 renderer contract — a terminal line followed by the value payload. It is deterministic and semantically aligned with the JSON envelope, but it is not a hand-formatted diagnostic report. | WO-004 or later operator-surface increment | Deliberate: extending the renderer was permitted but not required, and the brief scopes renderer changes to "only where current renderers need extension". |
| L2 | The drift engine compares two observations without being told whether a governed baseline exists. The CLI compensates by stating `driftBaseline` explicitly, but the underlying engine could accept an explicit baseline-presence input. | M37 drift engine (`security-reliability-integrations`) | Recorded, not changed. Reinterpreting or extending an accepted domain engine is out of scope for WO-003 (architecture rule 5). The same call pattern already exists in the WO-002-approved `init`/`adopt` plan path, so the compensation is additive and consistent. |
| L3 | `dependencySecurity` reports `REVIEW` because the CLI passes `provenance: "unverified"`. A verified provenance path would require a real audit invocation, which is a mutation-free but heavier capability not granted by this Work Order. | WO-004 or later | Deliberate: `REVIEW` is the honest answer while no independent verification exists. Reporting `PASS` would be a fabricated healthy default. |

### Deferred items

| Item | Owner |
|---|---|
| `gef upgrade` and compatibility/migration/recovery | WO-004 |
| Context Compiler / Execution Capsule compiler | WO-005 |
| Incremental validation / proof reuse | WO-006 / WO-007 |
| Telemetry platform | WO-008 |
| Integrated release-channel redesign, repository-wide validation workflow scope (C8) | WO-009 |
| V1.1 production acceptance / promotion | WO-010 |
| Kernel physical-safety exit classification (F1) | kernel / M05 |
| Constitutional version binding (C4) | Project Owner |

---

## 12. Executor statement

All work in this bundle is executor evidence. It is **not** self-approval and it does not claim
`APPROVED`. The objective reviewer must return exactly one terminal disposition — `APPROVED`,
`CORRECTION_REQUIRED` or `BLOCKED` — bound to the exact implementation head.

STOP CONDITION: `GBS_V11_WO_003_READY_FOR_OBJECTIVE_AUDIT`

MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED