# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective audit is external

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission PR | #281, verdict APPROVED, objective audit comment `5706624163`, 0 CRITICAL / 0 HIGH |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Work branch | `feat/1.1/wo-002-cli-distribution` |
| Branch head at execution start | `3aec797e2642644ebd6d9f6bf1806dd20f2d9c98` |
| Lineage check | `git merge-base --is-ancestor origin/release/1.1 HEAD` → **OK**; merge-base = `66e223f` |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |

### Toolchain

| Tool | Version |
|---|---|
| Node.js | `v24.18.0` |
| npm | `11.16.0` |
| Git | `2.55.0.windows.3` |
| Platform | `win32` |

### Context Lock verdict

**VALID — not STALE.** Ten of eleven locked `git-blob-sha1` fingerprints match exactly.
The eleventh, `.engineering/CHECKPOINT.json`, differs and was investigated rather than
assumed: the only changes are the authorized WO-001 → WO-002 governance transition
(`v11.status: GBS_V11_FOUNDATION_PROMOTED → GBS_V11_WO_002_ADMITTED`,
`v11.executorAuthority.state: EFFECTIVE_ON_PROMOTION_MERGE → EFFECTIVE`,
`v11.cliAdmission.state → EFFECTIVE`, `activeWorkOrder: GBS-V11-WO-002`, `ADMITTED`,
`implementationBranch`, `nextLegalAction`). **No immutable top-level production field
changed** (`GBS_V1_PRODUCTION_ACCEPTED`, `1088/1088`, `V1_RELEASE_MAINTENANCE`). That is the
base check the Execution Brief prescribes, not drift.

### Minimum-read-set expansions

Reads beyond the brief's numbered list, each on a concrete dependency trigger:

| Expansion | Trigger |
|---|---|
| `packages/kernel/src/{registry,runtime,runtime-types,errors,lifecycle,ports}.ts` | the runtime contract the WO mandates the CLI to use |
| `packages/kernel/src/filesystem-{paths,types,traversal,overwrite}.ts` | the safety envelope rule for managed mutation |
| `packages/{m48-m54-maintenance,area-h-governance,security-reliability-integrations}` sources | exact delegation signatures |
| `packages/contracts/src/index.ts` | `GefResult`/`HandlerOutcome`/`ProcessExitCode` shapes |

No repository-wide search was performed.

---

## 2. Changed files and reasons

14 paths: 11 new, 5 modified.

| Path | Kind | Reason |
|---|---|---|
| `package.json` | M | canonical product version `1.0.0` → `1.1.0` (Scope E); `@types/node` devDependency |
| `package-lock.json` | M | lockfile reconciled with the manifest changes (Scope E) |
| `packages/cli/package.json` | M | version `0.0.0` → `1.1.0`, real `gef` bin mapping, `files`, `license`, `engines` (Scope D/E) |
| `packages/cli/tsconfig.json` | M | `types: ["node"]` so the CLI project sees Node globals |
| `packages/cli/src/index.ts` | M | public CLI surface (parser/render/registry/main exports) |
| `packages/cli/src/parser.ts` | A | pure argv parsing and frozen action mapping (Scope A/B) |
| `packages/cli/src/render.ts` | A | human + stable JSON rendering only (Scope B) |
| `packages/cli/src/registry.ts` | A | typed engine boundary, target observation, governed artifact persistence, command registrations (Scope C) |
| `packages/cli/src/main.ts` | A | process boundary, kernel runtime port composition, exit projection (Scope B) |
| `packages/cli/bin/gef.mjs` | A | executable shim resolving the built entry without a shell pipeline (Scope D) |
| `packages/cli/README.md` | A | legal/docs payload for a packed package (Scope D) — outside the brief's file list, recorded reason below |
| `tests/v11-wo-002-cli.test.mjs` | A | UNIT/INT contract (Scope F) |
| `tests/v11-wo-002-cli-e2e.test.mjs` | A | real-process CLI E2E (Scope F) |
| `tests/v11-wo-002-dist-smoke.test.mjs` | A | local pack/install smoke and no-publication proof (Scope F) |
| `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` | A | this bundle |

**No file under `.engineering/` other than this bundle was modified.** No existing package
source, workflow or accepted V1 artifact was touched.

### Out-of-blueprint additions and their reasons

| Addition | Reason |
|---|---|
| `packages/cli/README.md` | the WO requires "normal legal/docs payload" in the package; `packages/cli` had no README to state the license and no-publication boundary |
| `@types/node@^22.20.3` (devDependency) | the CLI is the first package using Node APIs (`node:fs`, `node:crypto`, `node:path`, `process`). No `@types` package existed anywhere in the workspace, so `node:` imports were unresolvable under `strict`. Verified non-breaking by a forced rebuild of all 28 projects (§3 command 1) |

---

## 3. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects — proves `@types/node` did not regress any existing package |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `node --test tests/*.test.mjs` | **0** | **1251 tests, 1251 pass, 0 fail, 0 skipped** |
| 4 | `node --test tests/v11-wo-002-cli.test.mjs` | **0** | 25/25 pass |
| 5 | `node --test tests/v11-wo-002-cli-e2e.test.mjs` | **0** | 9/9 pass |
| 6 | `node --test tests/v11-wo-002-dist-smoke.test.mjs` | **0** | 6/6 pass |
| 7 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| 8 | `npm audit` | 0 | `found 0 vulnerabilities` |
| 9 | `npm pack` (in `packages/cli`) | **0** | `gef-bootstrap-cli-1.1.0.tgz`, 23 files, 23.2 kB packed, 95.8 kB unpacked |
| 10 | `git merge-base --is-ancestor origin/release/1.1 HEAD` | 0 | branch descends from the admission merge |

**Baseline correction.** The WO-001 evidence recorded 1184 tests. The branch baseline at
execution start was **1211**: the WO-001 promotion (#280) and the WO-002 admission (#281)
added `v11-wo-001-promotion.test.mjs` (10), `v11-wo-002-admission.test.mjs` (9),
`v11-wo-001-audit-corrections.test.mjs` (7) and one further case. WO-002 adds **40** tests
with **zero regressions**: 1211 → 1251.

---

## 4. Test-matrix case mapping

### `CLI-E2E` — admitted commands

| Case | Result | Evidence |
|---|---|---|
| `CLI-E2E-01` help deterministic, exit 0, no network | **PASS** | `--help` and `init/adopt --help` byte-identical across runs, exit 0, empty stderr; shipped `dist/*.js` asserted free of `node:http`, `node:https`, `node:net`, `node:dgram`, `fetch(` |
| `CLI-E2E-02` version agrees with canonical provenance | **PASS** | `gef --version` = `gef 1.1.0` = root `package.json` = CLI `package.json`; `--json` agrees |
| `CLI-E2E-03` unknown command / malformed flag → exit 10, no mutation | **PASS** | unknown command, unknown flag, missing `--target` value and the three deferred verbs all exit 10; target listing and absence of `.gef` asserted afterwards |
| `CLI-E2E-04` stable JSON envelope, success and failure | **PASS** | success and failure envelopes parse with the exact ordered key set; `--json` applies even when it follows the failing token |
| `CLI-E2E-05` non-TTY never blocks | **PASS** | open, never-written stdin pipe with a 30 s bound; completion asserted; shipped sources asserted free of `process.stdin` and `readFileSync(0)` |
| `CLI-E2E-06` delegation to registered engines | **PASS** | introspection: 4 canonical IDs, correct `mutation`/`requiresTarget`/`owner`; results carry real `installPlan` phases, `safetyDecision` classification and adoption/drift/recovery payloads |
| `CLI-E2E-07` exit-code projection exact | **PASS** | in-process table over all 13 `ProcessExitCode` rows plus process-level 0/10/20 assertions |

### `DIST-SMOKE`

| Case | Result | Evidence |
|---|---|---|
| `DIST-SMOKE-01` packed executable resolves and runs | **PASS** | `npm pack` → extract into an isolated sandbox → `gef --help`/`--version` exit 0; bin target exists; `init` reaches `READY` when the workspace runtime is present |
| `DIST-SMOKE-02` broken install fails closed | **PASS** | built entry removed → exit 40 with a bounded capability message and no stack frame; engines absent → engine commands exit 40 with a structured `CAPABILITY`/`BLOCKED` error, while `--help`/`--version` still exit 0 and the target is not mutated |
| `DIST-SMOKE-03` uninstall never deletes project data | **PASS** | after `--apply`, removing the installed package leaves user files, user source and the governed `.gef/init-state.json` intact, and does not disturb sibling runtime packages |
| `DIST-SMOKE-04` no publication | **PASS** | `private: true` on the CLI and root manifests, no `publishConfig`, no `.npmrc`, packed manifest still private, README states the no-publication boundary, shipped runtime free of registry-write references, and the suite's only npm verb is `pack` |

### `UNIT` / `INT`

25 cases in `v11-wo-002-cli.test.mjs` cover parser determinism and failure modes, renderer
stability and non-reinterpretation, registry introspection/ownership/mutation flags,
registration uniqueness and canonical-ID compliance, input validation, real-engine
delegation, the C5 collision guard, target-observation determinism and boundedness,
fingerprint behaviour, the filesystem root descriptor, and the full exit-code table.

### Deferred rows — `DEFERRED_TO_OWNING_WO`, never asserted green

| Rows | Owner |
|---|---|
| `CLI-E2E-*` for `gef doctor`, `gef status` | **WO-003** |
| `CLI-E2E-*` for `gef upgrade` | **WO-004** |
| `UPG-MIG-01..07`, `COMPAT-01..06` | WO-004 |
| `CTX-DET-01..08` | WO-005 |
| `INC-VAL-01..05` | WO-006 |
| `PROOF-INV-01..05` | WO-007 |
| `TELEM-01..06` (including the `ADR-0003-D4` CLI ROI comparison) | WO-008 |
| `SEC-INT-01..06` (V1.1 scope) | WO-009 |
| `REG-07` exact-head production acceptance | WO-010 |

`doctor`, `status` and `upgrade` are additionally asserted to **fail as usage** (exit 10)
rather than partially work, so a deferred verb cannot be mistaken for an implemented one.

---

## 5. Distribution evidence (no publication)

| Item | Value |
|---|---|
| Command | `npm pack` (cwd `packages/cli`) |
| Filename | `gef-bootstrap-cli-1.1.0.tgz` |
| Package size | 23.2 kB |
| Unpacked size | 95.8 kB |
| Files | 23 |
| Contents | `dist/**`, `bin/gef.mjs`, `README.md`, `package.json` |
| Bin mapping | `{ "gef": "./bin/gef.mjs" }` |
| Packed manifest `private` | `true` |

**Explicit no-publication statement.** No package was published to npm, GitHub Releases or
any other registry; no tag was created; no release artifact was uploaded. The suite
performs no registry write, and `private: true` plus the absence of `publishConfig` and
`.npmrc` make an accidental publication mechanically impossible. The
`V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md` rule is respected: a designed distribution model is
never described as proven.

---

## 6. Version provenance proof

Frozen by the WO: root `package.json.version` is canonical.

| Source | Value | Agreement |
|---|---|---|
| root `package.json` | `1.1.0` | canonical |
| `packages/cli/package.json` | `1.1.0` | asserted equal by test |
| `gef --version` (raw) | `gef 1.1.0` | asserted equal by E2E |
| `gef --version --json` | `"version": "1.1.0"` | asserted equal by E2E |
| packed manifest (`npm pack`) | `1.1.0` | asserted equal by dist-smoke |
| `package-lock.json` root + workspace entry | `1.1.0` | reconciled |
| persisted governed artifact `productVersion` | runtime-resolved | asserted equal to root in E2E |

A version string is **not** release evidence: `main` and `v1.0.0` remain production truth
until WO-010 promotion.

---

## 7. `main` and `v1.0.0` non-modification proof

| Asset | Statement | Verification |
|---|---|---|
| `main` | **NOT modified** | `origin/main` = `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`, unchanged from admission |
| tag `v1.0.0` | **NOT moved, replaced or deleted** | object `aac89f9c…` → `866fe3af…`, unchanged |
| `release/1.1` base | **NOT rewritten** | `origin/release/1.1` = `66e223fe…`, the admission merge |
| `.engineering/` production state | **NOT modified** | `git status --porcelain .engineering/` shows only this new evidence bundle |
| V1.0.0 acceptance history | **NOT rewritten** | no acceptance artifact, gate, evidence receipt or module record edited |
| Publication | **NOT performed** | see §5 |
| Merge | **NOT performed** | PR #282 left open for objective audit |

---

## 8. Findings by severity

**CRITICAL: 0. HIGH: 0.**

### Constraint dispositions required by the Work Order

| ID | Disposition |
|---|---|
| **C3** architecture package-name mismatch | **Respected, not resolved.** The implemented layout at the exact base is used unchanged; no monorepo reorganization and no package-topology rewrite. Broad reconciliation remains WO-009. |
| **C5** colliding exports | **Resolved for this WO.** `compatibility`, `redactSecrets`, `containedPath`/`normalizeRestrictedPath` are never consumed through a flat barrel; only `normalizeRestrictedPath` is bound, by explicit module ownership. `digest` is imported from no engine (node:crypto is used directly). A test asserts the engine surface exposes exactly the seven explicitly bound symbols and that `compatibility`/`redactSecrets` are unreachable. No accepted V1 export was renamed. |
| **C6** CLI version / no-bin inconsistency | **Resolved for the CLI portion only.** Root and CLI versions reconciled to `1.1.0`, real `gef` bin mapping added, lockfile updated. No unrelated package-version normalization was performed — the other 27 packages were left untouched. |

### New findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| **F1** | MEDIUM | The packed CLI package is **not self-contained**. It resolves `@gef-bootstrap/contracts`, `@gef-bootstrap/kernel` and the three engine modules from the surrounding installation, so a standalone tarball install cannot run engine-backed commands (it fails closed with exit 40 — see `DIST-SMOKE-02b`). A self-contained artifact needs either engine package manifests (blocked by C3) or a bundler (a new dependency). | **Deferred** to WO-009 integrated distribution acceptance, or a later WO-002 increment. Owner: WO-009. Not hidden: the CLI README states the package is distributed as part of the GEF source workspace. |
| **F2** | LOW | `@types/node@^22.20.3` added as a devDependency. | Accepted. Bounded, dev-only, required for `node:` imports; verified non-breaking by a forced rebuild of all 28 projects. |
| **F3** | LOW | `packages/cli/README.md` added outside the brief's file list. | Accepted. Required by the Scope D "legal/docs payload" obligation. Recorded in §2. |
| **F4** | LOW | Engine resolution uses relative paths from the CLI `dist`, which encodes an expected installation shape (`packages/<engine>/…` in the workspace, `@gef-bootstrap/<engine>/…` when installed). A different layout yields a fail-closed capability error rather than a wrong result. | Recorded. Any relocation must keep this shape or introduce explicit dependency manifests (see F1). |
| **F5** | INFO | The `--apply` mutation in this increment writes only the GEF-reserved governed state artifact (`.gef/<verb>-state.json`) plus a kernel receipt. Full project materialization is **not** part of WO-002. | Recorded so the scope boundary is explicit; the plan/preview compositions are the substantive output of this increment. |
| **C4** | MEDIUM | Carried from WO-001: `ARCHITECTURE.md` binds to `GBS-CONSTITUTION-v1.1` while `D-0043` establishes `v1.0`. | Still open. Owner: Project Owner. Unaffected by this WO. |
| **C8** | MEDIUM | Carried from WO-001: the required check `Repository validation` triggers only on pull requests targeting `main`; PRs to `release/1.1` rely on path-filtered module workflows. | Still open. Owner: WO-009 / release-channel enforcement. |

No HIGH/CRITICAL finding was suppressed, and none is required to be resolved for WO-002 to
proceed.

---

## 9. Performance observations

Reported strictly as MEASURED / ESTIMATED / UNAVAILABLE, per the benchmark protocol. No
optimization claim is made by this Work Order.

| Metric | Value | Source |
|---|---|---|
| `gef --help` wall-clock, 5 samples, `win32`, Node `v24.18.0` | mean **143.7 ms**, min 129.2 ms, max 161.6 ms | **MEASURED** |
| Packed package size / unpacked size | 23.2 kB / 95.8 kB | **MEASURED** |
| Input/output tokens for this execution | — | **UNAVAILABLE** (not exposed by the execution environment) |
| Comparative gain versus the V1.0.0 source-workspace path | — | **UNAVAILABLE** — no comparable baseline population exists yet; the `ADR-0003-D4` CLI ROI comparison is WO-008's obligation |

Single-platform, five-sample measurement. It is not a cross-platform result and is not a
speedup claim.

---

## 10. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent
  verification and does **not** claim `APPROVED` — objective audit is external
  (`ADR-0003-D2` bound 5).
- Local execution is `win32`. The E2E and dist-smoke suites are written to run unchanged on
  Linux and macOS (no shell-dependent paths, no platform-conditional assertions beyond the
  npm `.cmd` shim); cross-platform execution evidence is produced by CI, not by this bundle.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.
- Findings F1 and C4/C8 are reported rather than resolved; resolving them would exceed the
  Work Order scope.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_AUDIT`.
