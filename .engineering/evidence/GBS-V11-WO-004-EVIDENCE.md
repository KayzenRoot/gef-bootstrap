# GBS-V11-WO-004 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-004.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-004.json`
Execution Brief: `.engineering/execution-briefs/GBS-V11-WO-004-CODEX.md`
Stop condition: `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`
Audit disposition: **executor evidence only; independent objective audit remains required**

## 1. Exact base and implementation binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Implementation branch | `feat/1.1/wo-004-upgrade-recovery-clean` |
| Base branch | `release/1.1` |
| Refreshed base | `b97f2b454ef2647823b682da13b69a501d82c794` |
| Cleanup governance | PR #287, review `5290922504`, APPROVED 0/0 |
| Cleanup decision | `D-0061` / `ADR-0005` |
| Historical implementation/test head | `48baddcd82fd2013780c4fe75b6493b10f8d6997` |
| Historical local qualification | 1,483 passed, 0 failed, 0 skipped |
| Historical exact-head cross-platform upgrade assurance | run `35820242860`, SUCCESS |
| Current implementation PR | #288, base `release/1.1`, draft pending refreshed qualification |
| Production branch `main` | Not modified |
| Release tag `v1.0.0` | Not moved |

The original WO-004 implementation became stale only because the product owner first detached the
legacy ecosystem-specific bindings from the V1.1 canonical Architecture/Scope/Decisions. The
implementation files were replayed without semantic redesign onto a branch created from the exact
post-cleanup base. The refreshed Context Lock fingerprints that new canonical base and includes
ADR-0005. The cleanup does not change the admitted upgrade requirements.

Current evidence is not promoted merely because the historical implementation passed. PR #288 must
re-run exact-head assurance against the refreshed tree, including the current-tree detachment guard,
before objective audit.

## 2. Implemented scope

- `gef upgrade` is a read-only preview; `gef upgrade --apply` is the separately authorized mutation.
- A versioned compatibility matrix and JSON Schema 2020-12 documents describe the admitted 1.0.0 to
  1.1.0 migration and upgrade state. Unknown versions, platforms, runtimes, capabilities, or Git
  authority fail closed.
- Preview inventories source state, receipts, target state, user modifications, conflicts and
  recovery status. It binds the exact source bytes, receipt bytes, target observation and ordered
  migration plan into a deterministic digest.
- Apply re-observes its preconditions and executes through the kernel transaction path. It preserves
  source bytes, refuses user-owned or conflicting destinations, verifies the promoted state,
  writes a receipt, and treats repeated apply as an idempotent no-op.
- Recovery is bound to the intent and transaction, verifies the exact promoted fingerprint and
  contained traversal, and uses the kernel rollback journal. Invalid material remains
  `RECOVERY_REQUIRED`; rollback removes only the verified file entry.
- Package preparation records matrix and schema digests. The installed-package smoke proves preview
  and apply work without source-checkout injection.
- The cross-platform workflow now checks out the exact PR head rather than GitHub's synthetic PR
  merge ref, then runs Windows effective-rights parity, focused cases, full validation and audit as
  applicable.

## 3. Required criterion results

| Criterion | Evidence and result |
|---|---|
| UPG-MIG-01 | `tests/v11-wo-004-upgrade.test.mjs`: preview is deterministic, read-only and inventories preservation state — PASS |
| UPG-MIG-02 | V1.0 to V1.1 apply matches the preview digest and preserves source bytes — PASS |
| UPG-MIG-03 | Injected post-promotion failure is rolled back and reports `RECOVERED` — PASS |
| UPG-MIG-04 | Corrupted recovery material remains `RECOVERY_REQUIRED` with journal evidence — PASS |
| UPG-MIG-05 | User-modified and conflicting managed state is not overwritten — PASS |
| UPG-MIG-06 | Repeated apply is idempotent and preserves upgraded-state bytes — PASS |
| UPG-MIG-07 | A stale transaction journal cannot authorize another run — PASS |
| COMPAT-01 | Verified 1.0.0 to 1.1.0 row is supported on Windows, Linux and macOS fixtures — PASS |
| COMPAT-02 | Unsupported version pairs are explicit and cannot be applied — PASS |
| COMPAT-03 | Unsupported platform and Node runtime fail closed — PASS |
| COMPAT-04 | Missing matrix row or required capability never becomes `SUPPORTED` — PASS |
| COMPAT-05 | Schema dialects, criterion references and packaged hashes are checked — PASS |
| COMPAT-06 | Untrusted Git is indeterminate and Windows machine-write policy stays strict — PASS |

The test matrix binds these 13 required criteria to the matrix row's `evidenceRefs`. `CI-01` also
checks that the workflow uses the exact PR head for checkout and verification and that evidence-file
changes trigger the workflow.

## 4. Local qualification at the implementation commit

All commands below were run with `HEAD=da00eaa83ec6c1df73bfcf9c8caf0bcfcfceb0c5`:

| Gate | Result |
|---|---|
| `npm run build -- --force` | PASS |
| `npm run typecheck` | PASS |
| `node --test tests/*.test.mjs` | PASS — 1,483 passed, 0 failed, 0 skipped |
| WO-004 focused upgrade and compatibility tests | PASS — UPG-MIG-01..07, COMPAT-01..06 and CI-01 (14/14) |
| `node packages/cli/scripts/rights-decision-gate.mjs` | PASS — `parity=yes`; both Git candidates had 8 denied rights, 0 allowed and 0 unknown |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `git diff --check` / staged diff check | PASS — no whitespace errors |

The aggregate `npm run validate` script could not be invoked directly because its `&&` chaining is
unsupported by the installed Windows PowerShell version. Its declared gates were run separately:
`npm run typecheck` and `node --test tests/*.test.mjs`; both passed. The build was run separately as
required by the workflow.

The full suite emitted host-capability notes that file symlink creation requires elevation and that
POSIX permission proofs are unavailable on Windows. These tests reported those platform evidence
limits explicitly; no test was skipped and the required Windows replacement-rights oracle passed.

## 5. Hosted macOS correction cycle

The exact-head workflow run [35818694679](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/35818694679)
tested PR head `0346c3cd3d9450c2e7d2f4643271b32008cec351`. Windows and Ubuntu passed. macOS exposed
an outdated assertion in `tests/v11-wo-002-transaction-safety.test.mjs`: it assumed every non-Windows
filesystem is case-sensitive. The filesystem probe correctly reported the hosted macOS volume's
measured behavior, so the test-only correction in `735dd5630807539132833ed54aca4aef49865afb` removes
that platform assumption while retaining the check that the result is a supported case mode and
that the probe leaves no residue.

At `HEAD=735dd5630807539132833ed54aca4aef49865afb`, the focused case-semantics test passed, the full
suite passed (1,483 passed, 0 failed, 0 skipped), and `npm run typecheck` passed. The correction and
this evidence update still require exact-head hosted qualification after publication; this earlier
workflow run does not qualify the corrected head.

## 6. External state and stop boundary

- PR #288 remains open and draft for independent objective audit.
- The implementation was not merged, tagged, published, or applied to `main` or `v1.0.0`.
- Exact-head GitHub Actions for the final evidence commit must complete successfully before the
  executor reports `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`.
- Required final boundary: **MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED**.


## 7. Refreshed-baseline qualification requirement

The final objective audit must bind to the current PR #288 head and verify that the replay preserves
all historical WO-004 results **and** the post-cleanup D-0061/ADR-0005 boundary. A historical green
run is provenance, not current proof. Exact-head workflow IDs and final test counts are appended only
after the refreshed branch finishes CI.

