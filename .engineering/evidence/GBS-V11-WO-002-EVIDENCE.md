# GBS-V11-WO-002 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Title: CLI + Distribution Foundation
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective re-audit #3 is external

**Revision note (V3).** This bundle supersedes the evidence recorded at head
`7c06443964fc8df827d27f4675c5fddee28cadf8`, which received `CORRECTION_REQUIRED`
(objective reaudit #3, review `5234282893`: CRITICAL 0 / HIGH 2). The claim
`CRITICAL: 0 / HIGH: 0` recorded at that head is **retracted** in §7. Every previously closed item
— H1/H2/H3, M1/M2/M3, H4, H5, H6 — is preserved; H4 and H5 were recorded by that review as
"materially improved but not fully closed" and are now closed through H7 and H8 respectively.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Admission merge (implementation base) | `66e223fe0d791c612e494a180eb12df9516cff87` |
| Corrected heads in this lineage | `8face873…` → `17a81fac…` → `7c064439…` |
| Reaudit #3 baseline (audited head) | `7c06443964fc8df827d27f4675c5fddee28cadf8` |
| Implementation head | the commit introducing this bundle; exact SHA reported in PR #282 |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |
| `release/1.1` | `66e223fe…` — **unmodified** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite.

---

## 2. Closure mapping — H7 / H8

### HIGH H7 — private filesystem authority is containment-proven and zero-effect before authorization

The previous head measured case semantics by creating `<target>/.gef-private/probes/<token>` before
`applyTransaction` reached its authorization gate, and `createOwnedProbeDirectory` built that chain
with recursive `mkdir`, so a newly created `.gef-private` root survived cleanup. An initial
authorization denial could therefore leave a target-visible effect. The same private area — probes,
staging and journal — used direct path operations, so a symlink or reparse point on `.gef-private`
or one of its subpaths could redirect a private effect outside the admitted target.

**Correction.**

1. **Read-only case-semantics measurement.** `measureCaseSemantics` compares the identity
   (`dev:ino`) of an existing path with the identity of its case-flipped sibling, walking up until
   a component with a cased letter is found. Nothing is created. Equal identity ⇒ `INSENSITIVE`,
   absent sibling ⇒ `SENSITIVE`, anything else ⇒ `UNKNOWN` (fail closed). The durability probe —
   which must write — runs in `atomicFacts`/`captureRecovery`, *after* the authorization gate.
2. **A dedicated private authority** (`packages/cli/src/private-authority.ts`) now owns every
   private path:
   - lexical containment is proven with `path.relative` (no `..`, no absolute escape);
   - every existing ancestor between the target root and the candidate is `lstat`ed and a
     symlink/reparse point is refused (`ALIAS_ANCESTOR`);
   - the deepest existing ancestor is `realpath`ed and required to be inside the resolved target
     root (`PHYSICAL_ESCAPE`) — this catches junctions and any alias the `lstat` check might miss;
   - directories are created level by level with **non-recursive** `mkdir`, so the invocation knows
     exactly which levels it created, and an occupied name that is not a directory is a
     `NOT_A_DIRECTORY` namespace conflict rather than something to write through;
   - removal revalidates the recorded identity at the destructive point and is non-recursive, so a
     path swapped to an alias, or a directory containing foreign content, is never followed or
     deleted;
   - an invocation-created private root is pruned when it is still empty.
3. **A containment refusal is a governed block.** A `PrivateAuthorityError` raised during journal
   or staging work is projected as `BLOCKED_BEFORE_EFFECT` with a `PRECONDITION` category, not as
   an internal failure.
4. `detectCaseSemantics` no longer writes at all, so **no project-visible path is created before
   the initial authorization gate succeeds**.

**Regression evidence** — `tests/v11-wo-002-private-authority.test.mjs` (9 cases, all PASS):

| Case | Evidence |
|---|---|
| zero delta before authorization | whole-tree identity (kind, size, content hash, link target) is compared before and after an initial-denial apply and is **identical**; no `.gef-private`, `.gef`, `probes`, `journal` or staging path exists; the read-only measurement also leaves the tree identical |
| private-root alias | a pre-existing `.gef-private` alias to an external directory with a sentinel ⇒ `BLOCKED_BEFORE_EFFECT`, `private_authority_*`, external tree unchanged, no artifact |
| probe-subpath alias | `.gef-private/probes` aliased externally ⇒ read-only measurement still answers, the transaction refuses, external tree unchanged |
| journal-subpath alias | `.gef-private/journal` aliased externally ⇒ refused before any external mutation, external tree unchanged |
| staging-subpath alias | `.gef-private/<txId>` aliased externally ⇒ refused, external tree unchanged |
| ordinary private content | user files directly under `.gef-private` and inside `.gef-private/probes` survive a successful apply; no probe residue beside them |
| private-root pruning | a refusal before the gate leaves no private root at all |
| cleanup identity swap | an owned directory swapped for an alias after ownership was recorded ⇒ release returns `false`, the external sentinel survives, the alias is left alone |
| containment proof | `..` and nested `..` escapes are rejected as `NOT_CONTAINED` |

Directory aliases are created with a real symlink where the host allows it and fall back to a
junction on Windows; both are reparse points and both are detected. A host that can create neither
records an explicit diagnostic rather than passing silently.

### HIGH H8 — the command and mutation purpose are part of the authorization binding

`createAuthorizationPort` verified the run, the presented policy reference, the plan requirement
and the target, then called the safety decision; `context.commandId` was used only in error
metadata. A caller could therefore pair a valid policy string with an unrelated command identity,
and receipt persistence reused a state-command identity under an unrelated receipt policy.

**Correction.** `ADMITTED_MUTATION_BINDINGS` is one deterministic authorization binding per
admitted command and mutation purpose:

| command | purpose | policy | module owner | surface | classification |
|---|---|---|---|---|---|
| `gef.init.run` | `STATE_INIT` | `cli:init:managed-write:v1` | `m48-m54-maintenance` | `.gef/init-state.json` | `MUTATING` |
| `gef.adopt.apply` | `STATE_ADOPT` | `cli:adopt:managed-write:v1` | `security-reliability-integrations` | `.gef/adopt-state.json` | `MUTATING` |
| `gef.init.run` | `RECEIPT_INIT` | `cli:receipt:managed-write:v1` | `cli.transport` | `.gef/receipts/` | `REVERSIBLE` |
| `gef.adopt.apply` | `RECEIPT_ADOPT` | `cli:receipt:managed-write:v1` | `cli.transport` | `.gef/receipts/` | `REVERSIBLE` |

On every authorization call the port re-derives the binding **from what the plan actually
declares** — the single mutation surface, the single pre-state module owner, the plan's declared
policy requirement and reference, and the target binding — and requires it to equal the binding the
port was created for. An unknown command or an unadmitted purpose has no binding and is refused
before the transaction starts. Receipt persistence now has its own admitted purpose rather than
borrowing a state identity. The default decision calls the verified safety engine with the
**binding's own classification**, so the operation context is bound rather than a generic mutating
label, and the same re-derivation runs at the initial gate and at the commit barrier.

**Negative evidence** — `tests/v11-wo-002-command-binding.test.mjs` (8 cases, all PASS):

| Case | Evidence |
|---|---|
| table self-consistency | unique command/purpose keys, immutable table, each row resolves to itself, read-only commands have no binding |
| mismatched combinations | init+adopt policy, adopt+init policy, unknown command+valid policy, state purpose+receipt policy, receipt purpose+state policy, owner mismatch, surface outside the bound artifact — all yield **no admitted binding** |
| tampered plan | a tampered module owner or a tampered surface is refused as `binding_not_admitted` |
| unadmitted command/purpose | `BLOCKED_BEFORE_EFFECT`, `AUTHORIZATION`, `binding_not_admitted`, no artifact and no private root |
| cross-command / cross-policy pairing through the real driver | refused before effects with zero target delta |
| no over-blocking | a correct adopt binding still returns `APPLIED` |
| commit barrier | approving the first call and tampering with the plan surface on the second proves the barrier re-authorizes and re-derives the binding (`ABORTED_STAGED_NO_TARGET_EFFECT`, staging cleaned, no artifact) |
| bound decision context | the decision hook observes `gef.init.run/STATE_INIT/MUTATING` on **both** calls |

---

## 3. Preservation of every previously closed item

| Prior finding | Status |
|---|---|
| H1 kernel transaction/effect integration | **Preserved** — all managed state and receipt effects still go through `compileTransactionPlan`/`applyTransaction`; the 12-case transaction safety suite still passes |
| H2 frozen delegation map | **Preserved** |
| H3 real clean install | **Preserved** — staging-based distribution and the real `npm install` smoke still pass |
| M1 `helpIndex` authority | **Preserved** |
| M2 automatic non-TTY JSON | **Preserved** |
| M3 schemas and package payload | **Preserved** |
| H4 probe hygiene | **Closed further** by H7: probes are now containment-proven and an invocation-created private root is pruned; probe tests still pass |
| H5 real reauthorization | **Closed further** by H8: the port now enforces the command/purpose/policy/owner/surface binding, at both calls |
| H6 Git dirtiness fail-closed | **Preserved and re-verified** — bounded argv-based `git status --porcelain -z`, no verdict when unknown, apply blocked; the full clean/modified/staged/untracked/conflicted/mid-operation matrix still passes |
| No publication / tag / promotion | **Preserved** |

---

## 4. Changed files and reasons

13 paths: 6 modified, 4 added, plus this bundle.

| Path | Kind | Reason |
|---|---|---|
| `packages/cli/src/private-authority.ts` | A | H7: containment/alias-proven private area, ownership-proven removal, read-only case-semantics measurement |
| `packages/cli/src/transaction.ts` | M | H7: read-only measurement, private-area probes/staging/journal, identity-revalidated cleanup, governed containment refusal; H8: binding table and enforcement |
| `packages/cli/src/registry.ts` | M | H8: passes the mutation purpose for state writes |
| `packages/cli/src/main.ts` | M | H8: receipt persistence declares its own purpose |
| `packages/cli/src/index.ts` | M | publishes the new surface |
| `packages/cli/README.md` | M | documents read-only probing, the private authority and the binding |
| `tests/v11-wo-002-private-authority.test.mjs` | A | H7 regression suite |
| `tests/v11-wo-002-command-binding.test.mjs` | A | H8 negative suite |
| `tests/v11-wo-002-transaction-safety.test.mjs` | M | bound to the command identity; private area wired into the inline port |
| `tests/v11-wo-002-probe-safety.test.mjs` | M | occupancy case follows the read-only measurement |
| `tests/v11-wo-002-authorization.test.mjs` | M | plans carry the binding-relevant fields |
| `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` | M | this bundle |

No `.engineering/` production state was modified. No package outside `packages/cli` was touched,
and `packages/kernel`/`packages/contracts` are unmodified — the kernel safety chain was not
weakened.

---

## 5. Commands executed and results

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `npm run build -- --force` | **0** | forced rebuild of all 28 projects |
| 2 | `npm run typecheck` | **0** | clean |
| 3 | `npm run validate` | **0** | **1307 tests, 1307 pass, 0 fail, 0 skipped** |
| 4 | `node --test …/v11-wo-002-private-authority.test.mjs` | **0** | 9/9 |
| 5 | `node --test …/v11-wo-002-command-binding.test.mjs` | **0** | 8/8 |
| 6 | `node --test …/v11-wo-002-probe-safety.test.mjs` | **0** | 7/7 |
| 7 | `node --test …/v11-wo-002-authorization.test.mjs` | **0** | 6/6 |
| 8 | `node --test …/v11-wo-002-repository-state.test.mjs` | **0** | 6/6 |
| 9 | `node --test …/v11-wo-002-transaction-safety.test.mjs` | **0** | 12/12 |
| 10 | `node --test …/v11-wo-002-cli.test.mjs` | **0** | 30/30 |
| 11 | `node --test …/v11-wo-002-cli-e2e.test.mjs` | **0** | 11/11 |
| 12 | `node --test …/v11-wo-002-dist-smoke.test.mjs` | **0** | 7/7 |
| 13 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| 14 | `gef init --apply` then `gef adopt --apply` on a fresh target | **0** | both `APPLIED`, both receipts persisted under their own binding |

Baseline: the reaudited head carried 1290 tests; this revision carries **1307** (+17: 9 private
authority, 8 command binding). No regression in any pre-existing suite.

---

## 6. Explicit non-modification statement

| Asset | Statement | Verification |
|---|---|---|
| `main` | **NOT modified** | `origin/main` = `72c17bd3…` |
| tag `v1.0.0` | **NOT moved, replaced or deleted** | object `aac89f9c…` → `866fe3af…` |
| `release/1.1` | **NOT rewritten** | `66e223fe…` |
| `.engineering/` production state | **NOT modified** | only this bundle changed |
| Packages outside `packages/cli` | **NOT modified** | no other package source changed |
| Kernel safety chain | **NOT weakened** | `packages/kernel` unmodified; the CLI now satisfies more of it |
| Publication / tag / release | **NOT performed** | — |
| Merge | **NOT performed** | PR #282 left open |
| Force-push / history rewrite | **NOT performed** | ordinary commits only |

---

## 7. Retractions

| Claim at `7c064439` | Status |
|---|---|
| "CRITICAL: 0. HIGH: 0" | **RETRACTED** — objective reaudit #3 (`5234282893`) found H7 and H8. |
| "Capability probes never touch project content" | Retained for content, **corrected for effect**: the case-semantics probe still created a private path before authorization. Measurement is now read-only. |
| "Probes now run through an invocation-owned probe authority … created exclusively with a collision-resistant name" | Retained, and **extended**: the authority is now containment- and alias-proven and prunes the private root it created. |
| "the authorization decision defaults to the verified safety engine and is re-asked on every call" | Retained, and **extended**: the decision is now bound to the command and mutation purpose, and is evaluated in the bound operation context. |

---

## 8. Findings by severity

**CRITICAL: 0. HIGH: 0** (after correction).

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H7 | was HIGH | private authority could mutate before authorization and could escape through aliases | **CLOSED** — read-only measurement, containment/alias-proven private area, identity-revalidated cleanup; 9-case suite |
| H8 | was HIGH | command/verb were not part of the authorization binding | **CLOSED** — deterministic binding table enforced at both gates; 8-case negative suite |
| F1 | MEDIUM | the kernel classifies any `checkPhysicalSafety` failure as `CAPABILITY`, so a no-clobber refusal exits 40 rather than 20. The CLI preserves the engine's classification. | Recorded. Owner: kernel/M05 semantics. |
| F2 | MEDIUM | repository dirtiness requires a `git` binary; where git is unavailable, `--apply` blocks. Intended fail-closed behaviour, but a real operational dependency. | Recorded. Owner: WO-003 should surface it as an actionable diagnostic. |
| F5 | LOW | an occupied non-directory in the reserved private namespace now fails the transaction closed rather than proceeding with an unproven durability capability. This is stricter than strictly necessary and is deliberate. | Recorded. |
| F3 | LOW | `--help` depends on the engine inventory and fails closed in a broken install. | Accepted, documented. |
| F4 | LOW | a host that cannot create a directory alias reports a diagnostic instead of asserting; junctions cover Windows, symlinks cover Linux/macOS. | Recorded; cross-platform coverage is exercised by the assurance matrix. |
| C4 | MEDIUM | carried from WO-001: `ARCHITECTURE.md` vs `D-0043` constitutional version. | Open. Owner: Project Owner. |
| C8 | MEDIUM | carried from WO-001: `Repository validation` triggers only for PRs to `main`. | Open. Owner: WO-009. |

No HIGH/CRITICAL finding was suppressed, and no security case was skipped silently to obtain a
PASS.

---

## 9. Limits of this bundle

- This bundle records what was executed in this environment. It is **not** independent verification
  and does **not** claim `APPROVED`.
- Local execution is `win32`. Alias cases use junctions here; the same cases use symlinks on
  Linux/macOS, where the primitive is available without elevation. Cross-platform evidence comes
  from CI.
- The containment proof adds one `lstat` per private path component and one `realpath` per private
  operation. That is a deliberate correctness cost, not a claimed optimisation.
- No performance improvement is claimed; token metrics are unavailable in this environment.
- The compatibility matrix remains a skeleton; this WO asserts no compatibility.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_REAUDIT_3`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED.
