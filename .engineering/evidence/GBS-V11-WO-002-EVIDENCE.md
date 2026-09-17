# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective re-audit #4 is external

**Revision note (V4).** This bundle supersedes the evidence recorded at head
`4e3cd1cb603b5c164b2966d9d6a5459a409da0a2`, which received `CORRECTION_REQUIRED`
(objective reaudit #4, review `5234658809`: CRITICAL 0 / HIGH 2). The claim
`CRITICAL: 0 / HIGH: 0` recorded at that head is **retracted** in §7. Every previously closed item —
H1/H2/H3, M1/M2/M3, H4, H5, H6, H7 and H8 — is preserved; H9 and H10 are the ownership defects that
remained inside the private transaction substrate introduced by H7.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Corrected heads in this lineage | `8face873…` → `17a81fac…` → `7c064439…` → `4e3cd1c…` |
| Reaudit #4 baseline (audited head) | `4e3cd1cb603b5c164b2966d9d6a5459a409da0a2` |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |
| `release/1.1` | `66e223fe…` — **unmodified** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite.

---

## 2. Closure mapping — H9 / H10

### HIGH H9 — staging cleanup now retains creation-time ownership

`ensureStagingDirectory` returned only a path, and `releaseStagingDirectory` read the identity at
cleanup time and fed that same freshly-read token into the removal check — a tautology. A staging
path replaced by another *ordinary* directory was therefore accepted as owned, a pre-existing empty
`.gef-private/<transactionId>` could be removed, and named staged files were deleted whenever they
were merely non-symlinks, regardless of whether the transaction created them.

**Correction.** Ownership is now a property of creation, not of removal:

- `claimStagingDirectory` returns an `OwnedDirectory { path, identity, owned }`. The identity token
  is captured immediately after `mkdir`; `owned` is true only when **this invocation** created the
  directory. A pre-existing staging path is returned with `owned: false`.
- `releaseOwnedDirectory` refuses outright when `owned` is false (`PREEXISTING_DIRECTORY`) and never
  removes a pre-existing directory, even when it is empty.
- The directory identity is revalidated at the destructive point, **together with an ownership
  marker**: every directory this invocation creates receives a `.gef-owner` file holding a random
  16-byte token whose identity and content fingerprint are recorded. `dev:ino` alone proved
  insufficient — Linux readily reuses the inode number of a just-removed directory, so a
  replacement could present the same token. The marker is a value a replacement cannot reproduce,
  so an **ordinary-directory replacement is detected exactly like a symlink replacement**
  (`DIRECTORY_IDENTITY_CHANGED` or `DIRECTORY_OWNERSHIP_LOST`). This was found by CI, not by
  inspection: the first CI run at this revision failed three cases on Linux precisely because the
  inode was reused.
- `stage()` records the staged file's identity **and content fingerprint** the moment it creates it
  with `flag: "wx"`. Before unlinking, both are revalidated; a replaced file
  (`FILE_IDENTITY_CHANGED`) or an in-place content change (`FILE_CONTENT_CHANGED`) leaves the entry
  untouched and is reported as refusal evidence.
- `pruneCreatedAncestors` now stores `path -> identity token` for every directory this invocation
  created and revalidates that token before each `rmdir`; a swapped ancestor is never removed. Path
  membership in a set is no longer sufficient, and the prune also runs when the leaf is already
  gone.
- Removal remains non-recursive, so foreign content is never deleted, and a cleanup that refuses
  reports `gef.recovery.cleanup_ownership_refused` with the offending entries.
- A re-observation during the commit barrier re-ran `atomicFacts`; the ownership record is now read
  through the registry-aware claim so a later observation can never overwrite the creation-time
  record with an unowned one. (This defect was found by the new suite, not by inspection.)

**Regression evidence** — `tests/v11-wo-002-ownership.test.mjs` (H9 cases, all PASS):

| Case | Evidence |
|---|---|
| pre-existing empty private tree | `…/.gef-private/probes` exists before the run and survives the entire transaction and cleanup; no probe residue is left inside it |
| owned probe directory | pruned while the pre-existing parent and private root survive |
| pre-existing empty staging directory | claimed with `owned: false`, refused with `PREEXISTING_DIRECTORY`, and still present afterwards |
| ordinary-directory swap | the owned staging directory is replaced by a *different ordinary* directory holding user content: removal is refused (`DIRECTORY_IDENTITY_CHANGED` or `DIRECTORY_OWNERSHIP_LOST` — the assertion deliberately does not depend on the inode differing, because Linux reuses it), and the replacement content survives **byte for byte** |
| staged-file replacement | the staged file is replaced by a different regular file under the same name: refusal reported, replacement byte for byte intact, directory not removed |
| staged-file in-place change | the same path with different content is refused as `FILE_CONTENT_CHANGED` and left intact |
| created parent swapped | the created private root is swapped for another ordinary empty directory before pruning: `removed: false` and the swapped directory is untouched (device/inode compared) |
| normal transaction | removes only the transaction-owned staging directory and the probe directory it created; a user file placed in the private area survives |
| alias swap | the symlink/junction swap case remains refused with the external tree unchanged |

### HIGH H10 — the journal file is no-clobber and identity-owned

`createJournalPort().persist()` obtained a containment-proven path but wrote it with
`writeFile(..., { flag: "w" })`, and `ensureJournalFile` proved only the directory. A pre-existing
`.gef-private/journal/<id>.json` was truncated, and a file replaced between lifecycle writes was
overwritten. Containment is not ownership.

**Correction.**

- The first write for a transaction **claims the file with exclusive creation** (`open(path, "wx")`).
  An existing file — including a symlink to one — fails with `EEXIST`, which is reported as
  `ALREADY_PRESENT` **without a byte being changed**.
- The file identity is recorded immediately after that exclusive creation
  (`fstat` on the creating handle).
- The handle opened by that exclusive creation is **held for the whole lifecycle**, and every later
  write goes through it. Holding the handle keeps the original inode allocated, which is what makes
  replacement detection reliable rather than best-effort: an unlinked-but-open inode cannot be
  reused, so the path entry can only still match the descriptor while it really refers to this file.
  Each write compares the path entry's identity against the descriptor's, and refuses with
  `gef.integrity.journal_ownership_refused` when they differ — which covers both a regular-file
  replacement and a symlink/reparse replacement, regardless of inode reuse. The handle is released
  when the lifecycle reaches its terminal phase.
- The journal directory itself remains under the H7 containment and alias guarantees.
- Because the kernel treats a failed journal write as a transaction abort, a refusal produces
  `ABORTED_STAGED_NO_TARGET_EFFECT` with no artifact promoted.

**Regression evidence** — `tests/v11-wo-002-ownership.test.mjs` (H10 cases, all PASS):

| Case | Evidence |
|---|---|
| pre-existing journal file | sentinel content is asserted byte-for-byte identical after the attempt; the transaction refuses with no artifact promoted |
| regular-file replacement between writes | `begin` succeeds, the file is replaced, `update` returns `journal_ownership_refused` and the replacement survives byte for byte |
| symlink/junction replacement between writes | the alias is refused and the external tree — including its sentinel file — is unchanged |
| normal lifecycle | `begin`/`update`/`finish` all succeed against the owned file only; the directory contains exactly that one file and its recorded phase is `FINISH` |
| aborted transaction | an abort at the commit barrier (authorization revoked after the initial gate) still leaves valid journal evidence with the transaction identity, and the transaction-owned staging is cleaned up |
| containment | the journal directory is created under the containment-proven private area |

---

## 3. Preservation of every previously closed item

| Prior finding | Status |
|---|---|
| H1 kernel transaction/effect integration | **Preserved** — 12-case transaction safety suite still passes |
| H2 frozen delegation map | **Preserved** |
| H3 real clean install | **Preserved** — staging-based distribution and the real `npm install` smoke still pass |
| M1 `helpIndex` authority | **Preserved** |
| M2 automatic non-TTY JSON | **Preserved** |
| M3 schemas and package payload | **Preserved** |
| H4 probe hygiene | **Preserved** — probe tests still pass with the ownership model |
| H5 real reauthorization | **Preserved** — authorization suite still passes |
| H6 Git dirtiness fail-closed | **Preserved and re-verified** — bounded argv-based `git status --porcelain -z`, no verdict when unknown, apply blocked; the full clean/modified/staged/untracked/conflicted/mid-operation matrix still passes |
| H7 private containment | **Preserved and strengthened** — the private-authority suite still passes, and staging/journal now carry ownership on top of containment |
| H8 command/purpose binding | **Preserved and re-verified** — the 8-case binding suite still passes |
| No publication / tag / promotion | **Preserved** |

---

## 4. Changed files and reasons

5 paths: 3 modified, 1 added, plus this bundle.

| Path | Kind | Reason |
|---|---|---|
| `packages/cli/src/private-authority.ts` | M | H9: `OwnedDirectory`/`OwnedFile` with creation-time identity, `owned` flag, fingerprint revalidation, identity-token ancestor pruning; H10: `claimJournalFile` (exclusive) and `writeOwnedFile` (identity-verified handle) |
| `packages/cli/src/transaction.ts` | M | H9: staging claimed through the registry so the barrier cannot overwrite the ownership record; staged-file ownership recorded at `stage()`; cleanup refuses with evidence; H10: journal port claims exclusively and writes through the owned file |
| `packages/cli/src/index.ts` | M | publishes the ownership surface |
| `packages/cli/README.md` | M | documents creation-time ownership and the journal guarantee |
| `tests/v11-wo-002-ownership.test.mjs` | A | H9/H10 regression suite |
| `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` | M | this bundle |

No `.engineering/` production state was modified. No package outside `packages/cli` was touched, and
`packages/kernel`/`packages/contracts` are unmodified — the kernel traversal, transaction, recovery
and authorization contracts were not weakened to make anything pass.

---

## 5. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `npm run validate` | **0** | **1322 tests, 1322 pass, 0 fail, 0 skipped** |
| 4 | `node --test …/v11-wo-002-ownership.test.mjs` | **0** | 15/15 (H9 and H10) |
| 4b | first CI run at this revision, then the inode-reuse fix | — | 3 Linux cases failed on the inode-only proof; the ownership marker and the held journal handle close them. Reported rather than hidden: see §2. |
| 5 | `node --test …/v11-wo-002-private-authority.test.mjs` | **0** | 9/9 |
| 6 | `node --test …/v11-wo-002-command-binding.test.mjs` | **0** | 8/8 |
| 7 | `node --test …/v11-wo-002-probe-safety.test.mjs` | **0** | 7/7 |
| 8 | `node --test …/v11-wo-002-authorization.test.mjs` | **0** | 6/6 |
| 9 | `node --test …/v11-wo-002-repository-state.test.mjs` | **0** | 6/6 |
| 10 | `node --test …/v11-wo-002-transaction-safety.test.mjs` | **0** | 12/12 |
| 11 | `node --test …/v11-wo-002-cli.test.mjs` / `-e2e` / `-dist-smoke` | **0** | 30/30 · 11/11 · 7/7 |
| 12 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| 13 | `init --apply`, `adopt --apply`, then a repeated `init --apply` on a fresh target | **0** | both `APPLIED`; the repeat is refused with no target effect; staging removed, only the journal remains as evidence |

Baseline: the reaudited head carried 1307 tests; this revision carries **1322** (+15). No regression
in any pre-existing suite.

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

| Claim at `4e3cd1cb` | Status |
|---|---|
| "CRITICAL: 0. HIGH: 0" | **RETRACTED** — objective reaudit #4 (`5234658809`) found H9 and H10. |
| "cleanup revalidates the recorded identity before removing anything" | **RETRACTED for staging**: the recorded identity was read at removal time, making the check tautological, and file ownership was never recorded at all. |
| "the private transaction area is containment- and alias-proven" | Retained as far as it goes, and **incomplete**: containment is not ownership. Both now hold. |
| "a file-backed journal port records durable recovery evidence" | Retained, and **corrected**: the journal was written with a clobbering flag and could truncate a pre-existing file. |

---

## 8. Findings by severity

**CRITICAL: 0. HIGH: 0** (after correction).

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H9 | was HIGH | staging cleanup did not retain creation-time ownership | **CLOSED** — owned records, identity + fingerprint revalidation, identity-token ancestor pruning; 9 H9 cases |
| H10 | was HIGH | the journal file could clobber a pre-existing or replaced file | **CLOSED** — exclusive claim, identity-owned writes through a verified handle; 6 H10 cases |
| F1 | MEDIUM | the kernel classifies any `checkPhysicalSafety` failure as `CAPABILITY`, so a no-clobber refusal exits 40 rather than 20. The CLI preserves the engine's classification. | Recorded. Owner: kernel/M05 semantics. |
| F2 | MEDIUM | repository dirtiness requires a `git` binary; where git is unavailable `--apply` blocks. Intended fail-closed behaviour and a real operational dependency for WO-003 to surface. | Recorded. |
| F6 | LOW | cleanup refusals are recorded in the transaction's verification results (`CLEANUP_FAILED`) and in the refusal error metadata rather than in the journal, because the port cannot write the journal itself. | Recorded; sufficient for WO-002 evidence, worth revisiting when WO-008 adds telemetry. |
| F5 | LOW | an occupied non-directory in the reserved private namespace fails the transaction closed rather than proceeding with an unproven durability capability. Deliberate. | Recorded. |
| F3 | LOW | `--help` depends on the engine inventory and fails closed in a broken install. | Accepted, documented. |
| F4 | LOW | a host that cannot create a directory alias reports a diagnostic; junctions cover Windows, symlinks cover Linux/macOS. | Recorded. |
| C4 | MEDIUM | carried from WO-001: `ARCHITECTURE.md` vs `D-0043` constitutional version. | Open. Owner: Project Owner. |
| C8 | MEDIUM | carried from WO-001: `Repository validation` triggers only for PRs to `main`. | Open. Owner: WO-009. |

No HIGH/CRITICAL finding was suppressed. No security scenario was marked PASS without the dangerous
replacement actually being exercised: the owned directory really is replaced by a different ordinary
directory, and the staged file and journal file really are replaced before removal or update.

---

## 9. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent verification
  and does **not** claim `APPROVED`.
- Local execution is `win32`. Alias cases use junctions here and symlinks on Linux/macOS; the
  ordinary-directory replacement cases need no alias primitive and run everywhere.
- The ownership model adds one marker file per invocation-created private directory, one `lstat` per
  created entry and one path/descriptor comparison per journal write. That is a deliberate
  correctness cost, not a claimed optimisation.
- An invocation-created private directory therefore leaves a `.gef-owner` marker beside its
  contents while it exists; the marker is removed with the directory when it is pruned.
- No performance improvement is claimed; token metrics are unavailable in this environment.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_REAUDIT_4`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED.
