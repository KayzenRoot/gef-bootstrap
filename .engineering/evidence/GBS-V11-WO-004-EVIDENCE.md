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
| Implementation branch | `feat/1.1/wo-004-upgrade-recovery` |
| Base branch | `release/1.1` |
| `origin/release/1.1` at execution | `f5141d6548474f41884f19ffd432bddd3d23f6fc` — verified ancestor of the implementation commit |
| Handoff parent | `fc33612b4961ad365cd68264272a5074627f7c56` |
| Implementation commit tested locally | `da00eaa83ec6c1df73bfcf9c8caf0bcfcfceb0c5` |
| Pull request | [#286](https://github.com/KayzenRoot/gef-bootstrap/pull/286), base `release/1.1`, kept open and in draft |
| Production branch `main` | Not modified |
| Release tag `v1.0.0` | Not moved |

The implementation commit is an ancestor of the branch tip at evidence capture. The final evidence
commit contains this report only. The pull-request workflow checks out `pull_request.head.sha`,
asserts that exact SHA on all three operating systems, and runs the complete validation matrix for
the final PR head. Its evidence must be reviewed at the current PR head before the stop condition is
reported as reached.

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

- PR #286 remains open and draft for independent objective audit.
- The implementation was not merged, tagged, published, or applied to `main` or `v1.0.0`.
- Exact-head GitHub Actions for the final evidence commit must complete successfully before the
  executor reports `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`.
- Required final boundary: **MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED**.
