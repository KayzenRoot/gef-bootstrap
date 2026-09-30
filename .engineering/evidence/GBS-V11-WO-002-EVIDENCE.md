# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective re-audit #5 is external

**Revision note (V5).** This bundle supersedes the evidence recorded at head
`d22be7544a8c84a17d8703b391c418f7539505ce`, which received `CORRECTION_REQUIRED`
(objective reaudit #5, review `5235152314`: CRITICAL 0 / HIGH 2). The claim
`CRITICAL: 0 / HIGH: 0` recorded at that head is **retracted** in §7. Every previously closed item —
H1–H10, M1/M2/M3, the command/purpose authorization binding, Git dirtiness fail-closed, private
containment, the clean install, schemas, packaging, `helpIndex`, non-TTY JSON and the no-publication
guarantees — is preserved.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Corrected heads in this lineage | `8face873…` → `17a81fac…` → `7c064439…` → `4e3cd1c…` → `d22be75…` |
| Reaudit #5 baseline (audited head) | `d22be7544a8c84a17d8703b391c418f7539505ce` |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |
| `release/1.1` | `66e223fe…` — **unmodified** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite.

---

## 2. Closure mapping — H11 / H12

### HIGH H11 — a concurrently-created directory is never claimed as owned

`ensureChain` observed a missing directory, called `mkdir`, accepted `EEXIST` as a concurrent
creator — and then wrote `.gef-owner` and registered the path in the ownership map anyway. A
directory created by another actor in that window could therefore be marked as this invocation's and
later pruned or removed.

**Correction.** Ownership is conferred by exactly one thing: **this invocation's own successful
`mkdir`**. The create is tracked (`createdHere`), and only a successful create leads to the marker
write and the ownership registration. On `EEXIST` the path is revalidated for containment/type/alias
state and then treated as **pre-existing and unowned**: no marker is written into another actor's
directory, nothing is entered into the ownership registry, and the path is never removable by this
invocation. Every caller inherits the distinction — `claimStagingDirectory` reports `owned: false`,
the probe parent is not marked and is never pruned, and the journal directory is not marked.

A deterministic seam (`PrivateAreaOptions.onBeforeCreate`) runs after the absence observation and
immediately before this invocation's `mkdir`, so the interleaving is exercised exactly rather than
probabilistically. It cannot change a production decision: whatever it does is observed by the
ordinary `mkdir` result.

**Regression evidence** — `tests/v11-wo-002-concurrent-ownership.test.mjs` (9 cases, all PASS):

| Case | Evidence |
|---|---|
| concurrent creator wins | the observed-absent → created-by-other → `EEXIST` interleaving is produced deterministically; the claim returns `owned: false` |
| no marker written | `readdirSync(staging)` is exactly the concurrent creator's content; no `.gef-owner` exists |
| not registered as owned | cleanup refuses with `PREEXISTING_DIRECTORY` rather than removing it |
| never removed | the concurrently-created directory survives cleanup even when empty |
| content preserved | the concurrent creator's file is byte for byte identical after cleanup |
| probe parent | a raced `probes` directory is **not** marked, and survives the pruning that removes the probe directory created inside it |
| journal parent | a raced `journal` directory is not marked and its user file survives |
| normal path intact | an invocation-created directory still receives its marker and is still pruned, including its created private root |
| checks not weakened | lexical escape is still `NOT_CONTAINED`; a raced alias is never owned and the external target is untouched |

### HIGH H12 — the journal handle survives the whole rollback lifecycle

`createJournalPort` mapped `beginRollback`, `updateRollback` and `finishRollback` to one internal
phase and closed **and discarded** the claimed journal record whenever it saw that phase. The first
`beginRollback` therefore released the claim, and the next `updateRollback` attempted a fresh
exclusive claim of the already-existing journal file, failed with `ALREADY_PRESENT`, and escalated
recovery over a journaling artefact rather than a real recovery defect.

**Correction.** The two lifecycles are explicitly distinct — `APPLY_BEGIN`/`APPLY_UPDATE`/
`APPLY_FINISH` and `ROLLBACK_BEGIN`/`ROLLBACK_UPDATE`/`ROLLBACK_FINISH` — and both write the
transaction's **single owned journal file**:

- One claim record per transaction is retained for its whole lifetime. A lifecycle that reaches a
  terminal phase releases its descriptor but keeps the record.
- When a later lifecycle needs the authority, the port **reopens the transaction's own file** with
  identity *and* content verification instead of claiming anew. A replacement cannot reuse the inode
  of a file this invocation still owns, and the content check covers a replacement made while no
  descriptor was held.
- `applyGovernedCreate` releases any outstanding descriptor in a `finally`, so a lifecycle that never
  reaches its terminal phase cannot leak a handle — and releasing a descriptor never removes the
  evidence file.

**Regression evidence** — `tests/v11-wo-002-rollback-journal.test.mjs` (6 cases, all PASS), driving
the **real certified rollback engine** (`rollbackTransaction`) rather than isolated port calls:

| Case | Evidence |
|---|---|
| certified rollback | a real apply receipt is produced by `applyTransaction`; `rollbackTransaction` then reaches `beginRollback` → `updateRollback` (the `ALREADY_RESTORED` leg) → `finishRollback`, and the result is **not** `RECOVERY_ESCALATION_REQUIRED`; the recorded terminal phase is `ROLLBACK_FINISH` with the kernel snapshot at `ROLLBACK_RECEIPTING` and the rollback outcome |
| one file across both lifecycles | the same journal file, for the same transaction, holds `APPLY_FINISH` after the apply and `ROLLBACK_FINISH` after the rollback |
| replacement between rollback updates | the file is replaced after `beginRollback` has claimed its descriptor: the update is refused, the outcome escalates, and the replacement survives byte for byte |
| repeated rollback | a second rollback lifecycle reuses the same owned authority and does not fail as `ALREADY_PRESENT` |
| distinct phases | both phases are recorded in one evidence file per transaction |
| release | releasing descriptors leaves the evidence file present and unmodified |

**Test sensitivity, proven rather than assumed.** Reintroducing the audited behaviour faithfully
(closing on the rollback-begin phase *and* discarding the claim record) makes **4 of these 6 cases
fail**, with the reported symptom `RECOVERY_ESCALATION_REQUIRED` and the message "rollback must not
escalate over journal ownership". The suite therefore exercises the dangerous lifecycle instead of
merely passing beside it.

---

## 3. Preservation of every previously closed item

| Prior finding | Status |
|---|---|
| H1 kernel transaction/effect integration | **Preserved** — 12-case transaction safety suite passes |
| H2 frozen delegation map | **Preserved** |
| H3 real clean install | **Preserved** — staging-based distribution and the real `npm install` smoke pass |
| M1 / M2 / M3 | **Preserved** — `helpIndex` authority, automatic non-TTY JSON, schemas and package payload |
| H4 probe hygiene | **Preserved** — probe suite passes |
| H5 real reauthorization | **Preserved** — authorization suite passes |
| H6 Git dirtiness fail-closed | **Preserved and re-verified** — bounded argv-based `git status --porcelain -z`, no verdict when unknown, apply blocked; full state matrix passes |
| H7 private containment | **Preserved** — private-authority suite passes; H11 tightens it further |
| H8 command/purpose binding | **Preserved and re-verified** — 8-case binding suite passes, at both authorization calls |
| H9 staged-file identity + fingerprint | **Preserved and re-verified** — ownership suite passes |
| H10 exclusive journal claim + replacement detection | **Preserved and re-verified** — the same suite passes; H12 extends it across the rollback lifecycle |
| No publication / tag / promotion | **Preserved** |

---

## 4. Changed files and reasons

| Path | Kind | Reason |
|---|---|---|
| `packages/cli/src/private-authority.ts` | M | H11: ownership only on this invocation's own successful `mkdir`, `onBeforeCreate` race seam; H12: `reopenOwnedFile` with identity and content verification, shared handle wrapper |
| `packages/cli/src/transaction.ts` | M | H12: two explicit journal lifecycles over one owned file, retained claim record, `release()` for outstanding descriptors |
| `packages/cli/src/index.ts` | M | publishes `OWNER_MARKER` and the new types |
| `packages/cli/README.md` | M | documents concurrent-creation ownership and the two journal lifecycles |
| `tests/v11-wo-002-concurrent-ownership.test.mjs` | A | H11 deterministic race suite |
| `tests/v11-wo-002-rollback-journal.test.mjs` | A | H12 certified rollback integration suite |
| `tests/v11-wo-002-ownership.test.mjs` | M | the recorded apply phase is now the explicit `APPLY_FINISH` |
| `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` | M | this bundle |

No `.engineering/` production state was modified. No package outside `packages/cli` was touched, and
`packages/kernel`/`packages/contracts` are unmodified — no kernel contract, containment rule or
authorization semantic was weakened to make a test pass.

---

## 5. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `npm run validate` | **0** | **1337 tests, 1337 pass, 0 fail, 0 skipped** |
| 4 | `node --test …/v11-wo-002-concurrent-ownership.test.mjs` | **0** | 9/9 (H11) |
| 5 | `node --test …/v11-wo-002-rollback-journal.test.mjs` | **0** | 6/6 (H12) |
| 6 | `node --test …/v11-wo-002-ownership.test.mjs` | **0** | 15/15 |
| 7 | `node --test …/v11-wo-002-private-authority.test.mjs` | **0** | 9/9 |
| 8 | `node --test …/v11-wo-002-command-binding.test.mjs` | **0** | 8/8 |
| 9 | `node --test …/v11-wo-002-probe-safety.test.mjs` | **0** | 7/7 |
| 10 | `node --test …/v11-wo-002-authorization.test.mjs` | **0** | 6/6 |
| 11 | `node --test …/v11-wo-002-repository-state.test.mjs` | **0** | 6/6 |
| 12 | `node --test …/v11-wo-002-transaction-safety.test.mjs` | **0** | 12/12 |
| 13 | `node --test …/v11-wo-002-cli.test.mjs` / `-e2e` / `-dist-smoke` | **0** | 30/30 · 11/11 · 7/7 |
| 14 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| 15 | `init --apply` then `adopt --apply` on a fresh target | **0** | both `APPLIED`; only the journal remains in the private area |
| 16 | defect-reintroduction experiment on H12 | — | 4 of 6 rollback cases fail with `RECOVERY_ESCALATION_REQUIRED`; the suite is sensitive to the audited defect |

Baseline: the reaudited head carried 1322 tests; this revision carries **1337** (+15: 9 concurrent
ownership, 6 certified rollback). No regression in any pre-existing suite.

---

## 6. Explicit non-modification statement

| Asset | Statement | Verification |
|---|---|---|
| `main` | **NOT modified** | `origin/main` = `72c17bd3…` |
| tag `v1.0.0` | **NOT moved, replaced or deleted** | object `aac89f9c…` → `866fe3af…` |
| `release/1.1` | **NOT rewritten** | `66e223fe…` |
| `.engineering/` production state | **NOT modified** | only this bundle changed |
| Packages outside `packages/cli` | **NOT modified** | no other package source changed |
| Kernel contracts | **NOT weakened** | `packages/kernel` unmodified |
| Publication / tag / release | **NOT performed** | — |
| Merge | **NOT performed** | PR #282 left open |
| Force-push / history rewrite | **NOT performed** | ordinary commits only |

---

## 7. Retractions

| Claim at `d22be754` | Status |
|---|---|
| "CRITICAL: 0. HIGH: 0" | **RETRACTED** — objective reaudit #5 (`5235152314`) found H11 and H12. |
| "ownership is recorded at creation and revalidated before anything is removed" | **RETRACTED for the concurrent case**: a directory created by another actor in the observation-to-`mkdir` window was still marked and registered as owned. |
| "every lifecycle write goes through an identity-verified handle" | Retained for the apply lifecycle, and **incomplete**: the rollback lifecycle closed and discarded the claim at `beginRollback`. |

---

## 8. Findings by severity

**CRITICAL: 0. HIGH: 0** (after correction).

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H11 | was HIGH | a concurrently-created directory could be claimed as owned | **CLOSED** — ownership requires this invocation's own successful `mkdir`; 9-case deterministic race suite |
| H12 | was HIGH | the journal claim was closed and discarded at `beginRollback` | **CLOSED** — two explicit lifecycles over one owned file with verified reopen; 6-case certified-rollback suite, sensitivity proven |
| F7 | LOW | a descriptor opened for the journal is released in a `finally`, so an abandoned lifecycle does not leak it; the evidence file is never removed by that release. | Recorded. |
| F1 | MEDIUM | the kernel classifies any `checkPhysicalSafety` failure as `CAPABILITY`, so a no-clobber refusal exits 40 rather than 20. The CLI preserves the engine's classification. | Recorded. Owner: kernel/M05 semantics. |
| F2 | MEDIUM | repository dirtiness requires a `git` binary; where git is unavailable `--apply` blocks. Intended fail-closed behaviour and a real operational dependency for WO-003 to surface. | Recorded. |
| F6 | LOW | cleanup refusals are recorded in the transaction verification results and refusal error metadata rather than in the journal, because the port cannot write the journal itself. | Recorded; worth revisiting when WO-008 adds telemetry. |
| F5 | LOW | an occupied non-directory in the reserved private namespace fails the transaction closed rather than proceeding with an unproven durability capability. Deliberate. | Recorded. |
| F3 / F4 | LOW | `--help` depends on the engine inventory and fails closed in a broken install; a host without a directory-alias primitive reports a diagnostic. | Recorded. |
| C4 | MEDIUM | carried from WO-001: `ARCHITECTURE.md` vs `D-0043` constitutional version. | Open. Owner: Project Owner. |
| C8 | MEDIUM | carried from WO-001: `Repository validation` triggers only for PRs to `main`. | Open. Owner: WO-009. |

No HIGH/CRITICAL finding was suppressed. No race or rollback scenario was marked PASS without the
dangerous interleaving or lifecycle actually being exercised: the concurrent creator really wins the
`mkdir` race through an injected seam, and the certified rollback really fails when the audited
behaviour is reintroduced.

---

## 9. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent verification
  and does **not** claim `APPROVED`.
- Local execution is `win32`. The H11 race is exercised through a deterministic seam and the H12
  suite drives the real kernel rollback engine; neither depends on platform-specific timing. Alias
  cases use junctions here and symlinks on Linux/macOS.
- The ownership model adds a marker file per invocation-created private directory, one `lstat` per
  created entry and one path/descriptor comparison per journal write. That is a deliberate
  correctness cost, not a claimed optimisation.
- No performance improvement is claimed; token metrics are unavailable in this environment.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_REAUDIT_5`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED.
