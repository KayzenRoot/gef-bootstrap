# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective re-audit is external

**Revision note.** This bundle supersedes the WO-002 evidence recorded at head
`8face8738c1640e0a7e1adbf460496cde4597210`, which received `CORRECTION_REQUIRED`
(objective audit comment `5707099902`: CRITICAL 0 / HIGH 3 / MEDIUM 3). Claims from that
revision that are no longer valid are explicitly retracted in §7.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Work branch | `feat/1.1/wo-002-cli-distribution` |
| Correction baseline (audited head) | `8face8738c1640e0a7e1adbf460496cde4597210` |
| Corrected implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |
| `release/1.1` | `66e223fe…` — **unmodified** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite was performed.

---

## 2. Closure mapping — H1 / H2 / H3 / M1 / M2 / M3

### HIGH H1 — managed filesystem effects now pass through the kernel transaction envelope

The previous revision wrote `.gef/*-state.json` and CLI receipts with `mkdirSync` +
`writeFileSync` after only `authorizeFilesystemPath`, and used a post-write fingerprint check
as if it were equivalent to the envelope. **That is corrected.**

**Implementation.** `packages/cli/src/transaction.ts` supplies the two ports the kernel leaves
to its substrate and drives the kernel engine. No parallel transaction layer was introduced:

- `compileTransactionPlan` compiles the plan; `applyTransaction` applies it.
- `createFilesystemEffectAdapter` performs the safety chain per intent:
  `authorizeFilesystemPath` → observe → `evaluateFilesystemOverwrite` →
  `proveFilesystemTraversal` → `atomicFacts` → `composeFilesystemPhysicalSafety` →
  `captureRecovery` → `stage` → `verifyStaged` → `revalidateCommitBarrier` → `promote` →
  `verifyPost` → `cleanup`.
- `createJournalPort` records durable journal evidence (`begin`/`update`/`finish`) that
  survives cleanup; `createStatePort` provides a **real** pre-state observation so the commit
  barrier can detect a target that appeared after planning.
- The CLI declares a truthful primitive capability: `noClobberCreate: true`,
  `raceResistant: true`, `visibilityAtomic: false`. Composition for an `UPDATE` is therefore
  refused by the kernel rather than silently downgraded.
- Case semantics are probed (`detectCaseSemantics`) instead of assumed; unknown semantics is a
  fail-closed capability error.
- **CLI receipts use the same governed path.** The kernel receipt port compiles and applies its
  own transaction; there is no ungoverned filesystem side channel.

**Regression coverage** — `tests/v11-wo-002-transaction-safety.test.mjs` (12 cases, all PASS):

| Rule | Case |
|---|---|
| traversal | `../`, `a/../../`, absolute path all refused before any effect; root mutation refused |
| case semantics | probed, never assumed; probe leaves no residue |
| overwrite / no-clobber | existing artifact refused and preserved byte for byte; primitive truthfully declines replacement; an `UPDATE` composition is refused |
| alias / hard-link | a hard-linked destination is refused; the aliased inode is untouched |
| symlink / reparse | a symlinked destination is refused and never written through |
| stale target / race | a destination created after staging is refused at the commit barrier (`commit_barrier_stale`, `ABORTED_STAGED_NO_TARGET_EFFECT`) and the competing writer's content survives |
| post-effect recovery | a refused transaction leaves no target effect and no staging residue; an applied transaction leaves journal evidence |
| digests | plan digest, receipt digest and the promoted artifact fingerprint are all reported and verified |

Platform note: the symlink case reports a diagnostic and does not assert on this host
(`EPERM`); the hard-link case is exercised here.

### HIGH H2 — the frozen delegation map is implemented

| Command | Previously | Now |
|---|---|---|
| `gef init` | `installPlan`, `githubBootstrap`, `safetyDecision` | **`installPlan`, `repositoryState`, `githubBootstrap`, `detectDrift`, `resolveCanonical`** + kernel transaction engine |
| `gef adopt` | `installPlan`, `normalizeRestrictedPath`, `backupManifest`, `recoveryPlan` | **`detectDrift`, `resolveCanonical`, `backupManifest`, `recoveryPlan`, `installPlan`** + kernel transaction engine |

Symbols are bound by explicit module ownership (C5): `repositoryState` and `githubBootstrap`
from `area-h-governance`; `detectDrift`, `resolveCanonical`, `backupManifest`, `recoveryPlan`
and `safetyDecision` from `security-reliability-integrations`; `installPlan` and `helpIndex`
from `m48-m54-maintenance`. `compatibility`, `redactSecrets` and `digest` are never consumed.

New observations feeding those engines are read-only, bounded and truthful: `observeRepository`
reads `.git/HEAD` plus the well-known operation sentinels and reports
`WORKING_TREE_DIRTINESS_NOT_OBSERVED` rather than asserting a clean tree;
`observeCanonicalSources` reads a fixed candidate list and never fabricates a value.
A repository mid-operation is a precondition block for apply.

Proven by `CLI-E2E-06` (each engine's payload appears in the run output) and by unit tests
asserting the engine surface exposes exactly the required symbols.

### HIGH H3 — distribution is now proven by a real local install

The previous `DIST-SMOKE-01` extracted the tarball by hand and then copied `contracts`,
`kernel` and three engine modules out of the source tree. **That is not an install proof and is
retracted.**

**Implementation.** `packages/cli/scripts/prepare-package.mjs` assembles the distribution in a
**staging directory** and packs from there, so the package directory is never written to:

- the verified engine modules are vendored under `vendor/engines/<name>/…`, the first candidate
  of the loader's declared resolution order;
- `@gef-bootstrap/contracts` and `@gef-bootstrap/kernel` are staged into the package's own
  `node_modules` so npm bundles them (`bundleDependencies`) — they are never demanded from a
  registry;
- the repository `LICENSE` is added as legal payload;
- `vendor/MANIFEST.json` records the sha256 of every vendored artefact.

**Clean-install evidence** (`tests/v11-wo-002-dist-smoke.test.mjs`, 7 cases, all PASS):

| Case | Evidence |
|---|---|
| `DIST-SMOKE-01` | `npm install <tarball>` into a fresh temporary directory yields a package containing `dist`, `vendor`, `schemas` — and no `src` or `tsconfig.json` |
| `DIST-SMOKE-01b` | the installed payload contains `README.md`, `LICENSE` and both schema assets; the installed manifest keeps the `gef` bin mapping, stays `private`, and declares both bundled dependencies, which are present under the installed package's `node_modules` |
| `DIST-SMOKE-01c` | from that install alone — **no source checkout copied in** — `gef --help`, `gef --version`, `gef init`, `gef init --apply` and `gef adopt --apply` all succeed; the vendored manifest is present and every engine artefact carries a recorded digest |
| `DIST-SMOKE-02` | a missing built entry exits 40 without a stack trace; a missing engine bundle makes engine-dependent commands (including `--help`) exit 40 while `--version` still works, and the target is not mutated |
| `DIST-SMOKE-03` | uninstalling removes only installed files; user files, user source and the governed `.gef/init-state.json` survive |
| `DIST-SMOKE-04` | `private: true`, no `publishConfig`, no `.npmrc`; the shipped runtime carries no `node:http`/`node:https`/registry references; the suite invokes only `npm init` and `npm install` |

Tarball: 168 entries, 130 bundled runtime files, `vendor/engines`, `schemas/` and `LICENSE`
included. No package-topology change was required, so the `BLOCKED` branch in the correction
prompt does not apply.

### MEDIUM M1 — help is projected by `helpIndex`

The hard-coded `usageText()` authority was **removed**. `HELP_INVENTORY` is passed to the
verified `helpIndex` engine, which owns the inventory and its deterministic id ordering;
`render.ts` only draws the lines. The engine inventory is also the `--help --json` payload.
Proven by unit tests (sorted order, reversed input produces the same order, per-verb filtering)
and by `CLI-E2E-01`.

Consequence, explicitly accepted: `--help` now requires the engine inventory. In a broken
install it fails closed with exit 40 instead of rendering invented help. `--version` remains
engine-free.

### MEDIUM M2 — the non-TTY output contract is implemented

`RunDependencies.stdoutIsTty` is an explicit, injectable capability; `runCli` selects JSON when
`--json` is present **or** when stdout is not a TTY. `parser.ts` remains pure and never reads
ambient state. Covered in-process for all four combinations (TTY/pipe × `--json`/no flag),
including failures, and through the real process in `CLI-E2E` and in the automatic-JSON
end-to-end case.

### MEDIUM M3 — persisted documents carry a JSON Schema contract and ship with the package

- `packages/cli/schemas/gef-cli-state.schema.json` (`urn:gef:schema:cli-state:1`) and
  `gef-cli-receipt.schema.json` (`urn:gef:schema:cli-receipt:1`), both JSON Schema 2020-12 with
  an explicit `schemaVersion` constant, matching the repository's existing schema convention.
- Emitted state and receipt documents are bound to `schemaVersion: "1.0"`.
- `requireSupportedSchemaVersion` fails closed for a missing, malformed or unsupported-major
  version; the CLI applies it when reading a persisted artifact, and the runtime verification
  port applies it to the document it just wrote.
- The packed payload includes `schemas/`, `README.md` and `LICENSE`.

No compatibility claim is fabricated: the matrix remains a skeleton and this WO asserts none.

---

## 3. Changed files and reasons

17 paths: 11 modified, 6 added (one directory of schemas, one of scripts).

| Path | Kind | Reason |
|---|---|---|
| `packages/cli/src/transaction.ts` | A | H1: real physical port, intent resolver, journal, state port and governed driver |
| `packages/cli/scripts/prepare-package.mjs` | A | H3: staging-based distribution build with vendored engines and bundled runtime |
| `packages/cli/schemas/gef-cli-state.schema.json` | A | M3 |
| `packages/cli/schemas/gef-cli-receipt.schema.json` | A | M3 |
| `packages/cli/src/schemas.ts` | A | M3: document builders and the fail-closed version guard |
| `tests/v11-wo-002-transaction-safety.test.mjs` | A | H1 regression suite |
| `packages/cli/src/registry.ts` | M | H1 (transaction), H2 (delegation map), M1 (`helpIndex`) |
| `packages/cli/src/main.ts` | M | H1 (governed receipt persistence, schema-bound verification), M2 (TTY capability), unique run ids |
| `packages/cli/src/render.ts` | M | M1 (render from projected entries) |
| `packages/cli/src/parser.ts` | M | M1: the hard-coded help authority was removed |
| `packages/cli/src/index.ts` | M | public surface for the new modules |
| `packages/cli/package.json` | M | H3/M3: `files` includes `vendor`/`schemas`/`LICENSE`; `bundleDependencies`; staging scripts |
| `packages/cli/README.md` | M | documents delegation, the transaction envelope, schemas and the install path |
| `tests/v11-wo-002-cli.test.mjs` | M | M1/M2/M3 and the H2 delegation assertions |
| `tests/v11-wo-002-cli-e2e.test.mjs` | M | H1/H2 behavior through the real process |
| `tests/v11-wo-002-dist-smoke.test.mjs` | M | H3: real clean install replaces the hand-assembled sandbox |
| `.gitignore` | M | reverted: nothing is generated inside the package directory any more |

**No `.engineering/` production state was modified** except this evidence bundle. No accepted
V1 artifact, workflow or package source outside `packages/cli` was touched.

---

## 4. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `npm run validate` | **0** | **1270 tests, 1270 pass, 0 fail, 0 skipped** |
| 4 | `node --test tests/v11-wo-002-cli.test.mjs` | **0** | 30/30 |
| 5 | `node --test tests/v11-wo-002-cli-e2e.test.mjs` | **0** | 10/10 |
| 6 | `node --test tests/v11-wo-002-transaction-safety.test.mjs` | **0** | 12/12 |
| 7 | `node --test tests/v11-wo-002-dist-smoke.test.mjs` | **0** | 7/7 |
| 8 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| 9 | `npm audit` | 0 | `found 0 vulnerabilities` |
| 10 | `node scripts/prepare-package.mjs --pack --destination <dir>` | **0** | `gef-bootstrap-cli-1.1.0.tgz`, 168 entries |

Baseline: the audited head carried 1251 tests. This revision carries **1270** (+19 net: 30 CLI
unit − 2 replaced, 10 E2E − 0 replaced, 12 new safety, 7 dist-smoke − 0 replaced, plus the
pre-existing 1211 branch baseline). No regression in any pre-existing suite.

---

## 5. Explicit non-modification statement

| Asset | Statement | Verification |
|---|---|---|
| `main` | **NOT modified** | `origin/main` = `72c17bd3…`, unchanged |
| tag `v1.0.0` | **NOT moved, replaced or deleted** | object `aac89f9c…` → `866fe3af…` |
| `release/1.1` | **NOT rewritten** | `66e223fe…` |
| `.engineering/` production state | **NOT modified** | `git status --porcelain .engineering/` clean except this bundle |
| V1.0.0 acceptance history | **NOT rewritten** | no acceptance artifact, gate or receipt edited |
| Packages outside `packages/cli` | **NOT modified** | no other package source changed |
| Publication | **NOT performed** | no registry, no tag, no release artifact uploaded |
| Merge | **NOT performed** | PR #282 left open |
| Force-push / history rewrite | **NOT performed** | the branch advanced by ordinary commits |

---

## 6. Findings by severity

**CRITICAL: 0. HIGH: 0.**

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H1 | was HIGH | direct filesystem mutation bypassed the transaction/safety envelope | **CLOSED** — routed through the kernel engine; 12-case regression suite |
| H2 | was HIGH | the required delegation map was incomplete | **CLOSED** — all required symbols bound and proven |
| H3 | was HIGH | distribution proof was a hand-assembled sandbox | **CLOSED** — real `npm install` of a self-contained tarball, exercised end to end |
| M1 | was MEDIUM | hard-coded help authority | **CLOSED** — `helpIndex` projection |
| M2 | was MEDIUM | non-TTY JSON contract missing | **CLOSED** — explicit TTY capability |
| M3 | was MEDIUM | persisted documents had no schema contract | **CLOSED** — schemas, version binding, packaged payload |
| F1 | MEDIUM | the kernel's `applyTransaction` classifies any `checkPhysicalSafety` failure as `CAPABILITY` (`physical_safety_unavailable`), so a no-clobber refusal on an existing artifact surfaces as exit **40**, not 20. The CLI preserves the engine's classification rather than reinterpreting it. | Recorded. Owner: kernel/M05 semantics if a distinct precondition projection is wanted. |
| F2 | MEDIUM | `observeRepository` cannot derive working-tree dirtiness without reading the Git index, so it reports `WORKING_TREE_DIRTINESS_NOT_OBSERVED` and passes only what it observed. The verdict still comes from `repositoryState`. | Recorded. Owner: WO-003 (Doctor/status) may widen the observation. |
| F3 | LOW | `--help` now depends on the engine inventory and fails closed (exit 40) in a broken install. | Accepted, documented in the package README. |
| F4 | LOW | the hard-link and symlink cases depend on platform support; the symlink case reports a diagnostic and does not assert on this host (`EPERM`). | Recorded; the case is written to run where the platform allows it. |
| C4 | MEDIUM | carried from WO-001: `ARCHITECTURE.md` vs `D-0043` constitutional version. | Open. Owner: Project Owner. |
| C8 | MEDIUM | carried from WO-001: `Repository validation` triggers only for PRs to `main`. | Open. Owner: WO-009. |

No HIGH/CRITICAL finding was suppressed.

---

## 7. Retracted claims from the audited head

| Claim at `8face873` | Status |
|---|---|
| "`DIST-SMOKE-01` packed executable resolves and runs" | **RETRACTED** — it proved a hand-assembled workspace-shaped sandbox. Replaced by a real clean install (`DIST-SMOKE-01/01b/01c`). |
| "help must not require any engine" | **RETRACTED** — `--help` is now projected by `helpIndex`; in a broken install it fails closed. |
| "Managed artifacts are created exclusively (`wx`) after `authorizeFilesystemPath`" | **RETRACTED** as a sufficiency claim — exclusive create was not the transaction envelope. The effect now runs through `applyTransaction` with the full safety chain. |
| "the packed executable resolves and runs from the tarball" | **SUPERSEDED** — true only when the surrounding workspace was present. The tarball is now self-contained. |

---

## 8. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent
  verification and does **not** claim `APPROVED`.
- Local execution is `win32`. The suites avoid platform-conditional assertions except where
  noted (npm `.cmd` shim, symlink support), so CI is expected to reproduce them on Linux and
  macOS; cross-platform evidence is produced by CI, not by this bundle.
- No performance improvement is claimed. No token metric is available in this environment and
  none is estimated.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_REAUDIT`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED.
