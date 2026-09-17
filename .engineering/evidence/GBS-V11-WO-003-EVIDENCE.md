# GBS-V11-WO-003 — Evidence Bundle

Work Order: `.engineering/work-orders/GBS-V11-WO-003.md`
Title: Doctor 2.0 + Status
Release line: `1.1.x`
Assurance: `ELEVATED`
Executed by: external executor under `ADR-0003-D3` (bounded authorization)
Audit disposition: **not self-assessed** — objective audit is external

**Revision note (Windows replacement-rights correction, disposition BLOCKED).** This bundle supersedes
the evidence recorded at head `38e19dd1d05121e1bb4b2dbbcd393286eaea361a`, which received
`CORRECTION_REQUIRED` (review `5240757786`: CRITICAL 0 / HIGH 1). The claim `CRITICAL: 0 / HIGH: 0`
recorded at that head is **retracted** in §19. The remaining Windows half of H14 is corrected in §9 by
failing the high-assurance policy closed there; the resulting loss of Git-backed capability on
Windows, including the WO-002 managed-mutation precondition, is a product-level consequence that
requires an owner decision above this Work Order, so the disposition is **BLOCKED**.

**Prior revision (final H14 correction).** This bundle also supersedes the evidence recorded at head
`23fe092fc32b7d7694796999fb8342c94c4805fb`, which received `CORRECTION_REQUIRED` (review
`5239917392`: CRITICAL 0 / HIGH 1). The claim `CRITICAL: 0 / HIGH 0` recorded at that head is
**retracted** in §19. The remaining H14 defect — the trust anchor was not proven, so the Windows path
could return FOUND with an unproven directory chain and the POSIX proof stopped at the declared root
instead of running to the filesystem root — is corrected in §8. H13 is untouched and still closed.

**Prior revision (H13–H14 correction).** This bundle also supersedes the evidence recorded at head
`c1ad0144c3d6a02c0c96911bff5f16d140e5d403`, which received `CORRECTION_REQUIRED` (objective reaudit
review `5239594304`: CRITICAL 0 / HIGH 2). The claim `CRITICAL: 0 / HIGH: 0` recorded at that head is
**retracted** in §18. H13 (invocation authority was process-global mutable state) and H14 (physical
admission did not prove the executable was non-replaceable by the caller) are corrected in §7. The
H1–H12 closures of §2–§6 are preserved and re-verified in §10.

**Prior revision (H11–H12 correction).** This bundle also supersedes the evidence recorded at head
`570b235ea7bb4b21a0d564f88f9b92cd6b529cad`, which received `CORRECTION_REQUIRED` (objective reaudit
review `5238855257`: CRITICAL 0 / HIGH 2, plus one MEDIUM for a stale workspace lockfile). The claim
`CRITICAL: 0 / HIGH: 0` recorded at that head is **retracted** in §17. H11 (trust admission was
lexical, not physical), H12 (executable identity was not bound to the process actually spawned) and
M3 (manifest/lock drift) are corrected in §6. The H1–H10 closures of §2–§5 are preserved and
re-verified at the current head in §9.

**Prior revision (H9–H10 correction).** This bundle also supersedes the evidence recorded at head
`d7329784b758ebee1f320d2fdd75d177e36d1ea8`, which received `CORRECTION_REQUIRED` (objective reaudit
review `5238264811`: CRITICAL 0 / HIGH 2). The claim `CRITICAL: 0 / HIGH: 0` recorded at that head is
**retracted** in §16. The two blocking HIGH findings — H9 the Git probe inherited the caller's whole
environment and H10 the executable was chosen by ambient `PATH` — are corrected in §5 and mapped to
code and negative tests in §5.5. The H1–H8 closures of §2–§4 are preserved and re-verified at the
current head in §8; they remain the historical record of those cycles.

**Prior revision (H7–H8 correction).** This bundle also supersedes the evidence recorded at head
`e99751f99fc34394fce93322fd8d6d6ac0e9767b`, which received `CORRECTION_REQUIRED`
(objective reaudit review `5237495234`: CRITICAL 0 / HIGH 2). The claim `CRITICAL: 0 / HIGH: 0`
recorded at that head is **retracted** in §15. The two blocking HIGH findings — H7 the dirtiness
probe could write the repository index, and H8 it could execute a repository-configured FSMonitor
hook or start the daemon — are corrected in §4 and mapped to code and negative tests in §4.5. The
H1–H6 closures of §2 and §3 are preserved and re-verified at the current head in §12; they are
retained as the historical record of those cycles, not as current-head proof of the Git dirtiness
subprocess.

**Prior revisions.** This bundle also supersedes the evidence recorded at head
`49ceca340119d3cec53f4b06593f0a6d64ee3a70` (`CORRECTION_REQUIRED`, review `5237002898`: CRITICAL 0 /
HIGH 2, H5–H6) and at head `89b2d137839995a63e706b5f68c4d592ba9eabf8` (`CORRECTION_REQUIRED`, review
`5236410386`: CRITICAL 0 / HIGH 4, H1–H4). Every earlier `CRITICAL: 0 / HIGH: 0` claim recorded at
those heads was retracted in its own cycle and is not reinstated here.

---

## 1. Exact base / head binding

| Item | Value |
|---|---|
| Repository | `KayzenRoot/gef-bootstrap` |
| Implementation branch | `feat/1.1/wo-003-doctor-status` |
| WO-003 admission merge | `7592624f7c9bf8726a7a460629f5e862a35a857d` |
| Implementation base (branch activation commit) | `77204f569388744e734b19acdaf2115bf0f7f3f6` |
| `origin/release/1.1` at execution | `7592624f7c9bf8726a7a460629f5e862a35a857d` — ancestor of HEAD (verified with `git merge-base --is-ancestor`) |
| First implementation head | `89b2d137839995a63e706b5f68c4d592ba9eabf8` — audited, `CORRECTION_REQUIRED` (H1–H4) |
| H1–H4 corrected head | `49ceca340119d3cec53f4b06593f0a6d64ee3a70` — reaudited, `CORRECTION_REQUIRED` (H5–H6) |
| H5–H6 corrected head | `e99751f99fc34394fce93322fd8d6d6ac0e9767b` — reaudited, `CORRECTION_REQUIRED` (H7–H8) |
| H7–H8 corrected head | `d7329784b758ebee1f320d2fdd75d177e36d1ea8` — reaudited, `CORRECTION_REQUIRED` (H9–H10) |
| H9–H10 corrected head | `570b235ea7bb4b21a0d564f88f9b92cd6b529cad` — reaudited, `CORRECTION_REQUIRED` (H11–H12) |
| H11–H12 corrected head | `c1ad0144c3d6a02c0c96911bff5f16d140e5d403` — reaudited, `CORRECTION_REQUIRED` (H13–H14) |
| H13–H14 corrected head | `23fe092fc32b7d7694796999fb8342c94c4805fb` — reaudited, `CORRECTION_REQUIRED` (final H14) |
| Final H14 corrected head | `38e19dd1d05121e1bb4b2dbbcd393286eaea361a` — reaudited, `CORRECTION_REQUIRED` (Windows rights) |
| **Windows-rights corrected head (BLOCKED)** | `2a7010368481b4fa720e34ec1097dd49f2e00754` |
| Production branch `main` | `72c17bd3e7e421790ac382022b1f0ebbb0275ea4` — **unmodified** |
| Release tag `v1.0.0` | object `aac89f9c3f0c884474958025bf14828bc338b5ee` → target `866fe3af8cccc65c929aaf6a47a924401fa448b3` — **unmoved** |

Toolchain: Node `v24.18.0` · npm `11.16.0` · Git `2.55.0.windows.3` · `win32`.
No rebase, no force-push, no history rewrite, no tag creation, no publication.

---

## 2. Correction cycle — H1–H4 (objective audit review `5236410386`)

Disposition at the audited head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 4. All four HIGH findings
are corrected in this revision. The corrections are confined to the S0 diagnostic read surface of
`packages/cli/src/registry.ts`; no engine, no kernel contract, no WO-002 transaction behavior and
no command contract changed.

### 2.1 H1 — contained reads / alias safety

**Defect.** The governance, documentation, canonical-source, recorded-baseline and package-manifest
readers used a lexical `resolve` followed by `existsSync` / `readFileSync`, which follows symlinks,
junctions and reparse points. A target could point `.engineering/CHECKPOINT.json`, `.engineering`,
`README.md` or `package.json` outside the approved root and make `doctor` / `status` read external
content, and that content could reach the projection.

**Correction.** One shared helper now implements the entire S0 read policy — there is no second,
ad-hoc policy anywhere in the CLI:

`readContainedDiagnosticFile(targetRoot, requestedRef, budget = DIAGNOSTIC_FILE_MAX_BYTES)`

1. binds the approved root and rejects an empty, NUL-containing or absolute reference;
2. resolves the candidate and **rejects lexical escape** (`..` traversal never leaves the root);
3. walks every component from the root to the final path with `lstat` — a non-following primitive —
   and refuses any **link-like component** (symlink, junction or reparse point as reported by Node)
   and any link-like final target;
4. requires every ancestor to be a directory and the **final target to be a regular file**;
5. proves **physical containment**: `realpath(root)` and `realpath(candidate)` must agree on
   containment, which catches a reparse redirect that `lstat` does not surface;
6. opens the file and verifies through `fstat` that the opened object is **the exact `dev:ino` the
   non-following walk inspected**, closing the window between the walk and the open;
7. returns a structured outcome — `OK | ABSENT | UNREADABLE | ALIAS_REFUSED | NOT_REGULAR |
   OVER_BUDGET` — with content only on `OK`, plus a deterministic limit code.

The helper is now used by `observeGovernance`, `observeGovernanceFiles`,
`observeGovernanceFileLimits`, `observeDocumentation`, `observeCanonicalSources`,
`readRecordedArtifact` and the package-manifest reads in `doctorComposition`. Deterministic codes
propagate into `doctor` and `status` output: `DIAGNOSTIC_ALIAS_REFUSED:`, `DIAGNOSTIC_PATH_ESCAPE:`,
`DIAGNOSTIC_NOT_REGULAR:`, `DIAGNOSTIC_FILE_OVER_BUDGET:`, `DIAGNOSTIC_PATH_UNREADABLE:`. An
**absence is not a limit**: a path that simply does not exist is reported as absent, not as a
refusal.

**H1-adjacent hardening (disclosed, not requested).** `observeRepository` read `.git/HEAD`, then
`readFileSync(resolve(gitDirectory, refName))` where `refName` is attacker-controlled file content —
a lexical traversal on the diagnostic read path. The ref name is now accepted only in the exact
shape of a real symbolic ref (`/^refs\/[A-Za-z0-9._\/-]+$/`, no `..`, no `//`); anything else yields
the explicit `GIT_HEAD_REF_UNUSABLE` observation limit and no HEAD value. Real repositories are
unaffected (a genuine symbolic ref always has that shape), and the escape is now closed rather than
left open on the audited path.

**Tests** (`tests/v11-wo-003-doctor-status.test.mjs`): helper lexical escape (relative and
absolute); ancestor directory alias refused **and the sentinel proven absent from `doctor`/`status`
output**; link-like final governance target refused; link-like documentation source never enters the
manifest; directory-where-a-file-is-expected refused as `NOT_REGULAR`; contained regular files still
work. Process-level: `tests/v11-wo-003-doctor-status-e2e.test.mjs` runs the real binary against an
aliased `.engineering`; `tests/v11-wo-003-dist-smoke.test.mjs` proves the **packed and installed**
artifact carries the same refusal.

**Sensitivity.** The ancestor-alias test also asserts that a naive `readFileSync` of the same path
*does* return the external sentinel. The fixture therefore demonstrates that the escape is real and
that only the contained read refuses it; the test cannot pass against the pre-correction code, which
had no refusal status and reported `readable: true` with the aliased values.

### 2.2 H2 — resource bounds

**Defect.** `readBoundedFile` was not bounded: it performed an unrestricted `readFileSync` and then
hashed or parsed the result, so checkpoint, documentation and manifest files could drive arbitrary
synchronous memory, hashing and JSON work.

**Correction.** Explicit budgets — `DIAGNOSTIC_FILE_MAX_BYTES` (1 048 576; the largest diagnostic
source in this repository is ~15 KB and lockfiles legitimately reach hundreds of KB) and
`DIAGNOSTIC_SOURCE_MAX_FILES` (64). The helper `fstat`s before reading and **rejects over-budget
content before any read is attempted**; for admitted content it allocates exactly the observed size
and reads exactly that many bytes, so truncation-after-read can never present oversized content as
valid evidence. A short read is refused as `UNREADABLE` rather than accepted. The Git process bounds
(timeout and `maxBuffer`) are unchanged. Over-budget is **never** reported as absent or healthy: it
produces `DIAGNOSTIC_FILE_OVER_BUDGET:<ref>` and no result. Hash and parse operate only on admitted
content.

**Tests:** budgets are explicit integers within sane bounds; at-limit accepted / one-byte-over
refused with `bytes === null`; the default budget enforced at its own boundary; an over-budget
checkpoint yields `present: true, readable: false, valid: false, production: null` with only the
over-budget code; an over-budget documentation source cannot enter the manifest while the same file
is admitted under a larger budget; over-budget is never reported as `GOVERNANCE_SOURCE_ABSENT`.
Process-level, the E2E suite writes a syntactically valid ~1 MiB checkpoint and proves neither
`doctor` nor `status` emits its content or lets it populate production/progress.

### 2.3 H3 — no false drift when the baseline is absent

**Defect.** With no `.gef/init-state.json` or `.gef/adopt-state.json`, the code still called
`detectDrift(NO_RECORDED_STATE, current)`, producing `changed: true`, `class: 'UNEXPECTED'` and
`operator.stale: true` — a manufactured change event that directly contradicted
`driftBaseline.state = ABSENT`.

**Correction.** Baseline presence is determined before any comparison, through
`recordedBaselineSupported(recorded)` (present ∧ supported document ∧ an actual recorded observation
fingerprint). When no supported baseline exists, `detectDrift` is **not called at all** and drift is
projected as `null` — unavailable, not changed. `driftBaseline` keeps
`{state: 'ABSENT', ref: null}` for a never-governed target and reports
`{state: 'UNSUPPORTED', ref}` when a recorded document exists but cannot be interpreted; the
corresponding `drift.baseline.absent` / `drift.baseline.unsupported` limits are emitted. Because
`operatorStatus` coerces its `stale` input to a boolean and cannot express "unknown", the
conservative `stale: true` is retained **and made explicit** by
`operator.stale.unknown_conservative`; nothing is claimed fresh. When a supported baseline exists,
the engine's own verdict is reported verbatim, unchanged.

**Scope decision (disclosed).** The `init` / `adopt` *plan* bodies still call `detectDrift` with the
`NO_RECORDED_STATE` sentinel. That is the WO-002-approved plan contract, covered by the accepted
WO-002 E2E assertions on `plan.drift.class`, and the audit finding is specifically about the
diagnostic projection contradicting `driftBaseline`. Changing the plan contract would be a WO-002
behavioral change, which this correction is explicitly forbidden to make. The contradiction the
finding names existed only in `status` and is fixed there.

**Tests:** a never-governed target has `drift === null`, no `UNEXPECTED` substring anywhere in the
projection, `driftBaseline {ABSENT, null}`, and both explicit limits; a governed unchanged target
(fixture whose recorded fingerprint matches the current observation) reports `changed: false`,
`class: 'NONE'`; a governed changed target still reports `changed: true`,
`class: 'UNEXPECTED'`; an adopted target is a valid baseline (`RECORDED`,
`.gef/adopt-state.json`); an unusable recorded document is `UNSUPPORTED`, not a comparison.

### 2.4 H4 — checkpoint validation before semantic promotion

**Defect.** Any parseable JSON at `.engineering/CHECKPOINT.json` fed `status`, `release.production`
and `operatorStatus`. That violates the filesystem trust boundary and SEC-09 schema/version
discipline: a local file was treated as authoritative because it parsed.

**Correction.** `validateGovernanceCheckpoint(parsed)` is a minimal deterministic gate over exactly
the fields this command consumes — no product-wide checkpoint schema is invented. It requires a
non-array top-level object; a supported `schemaVersion` (the explicit, exported
`SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS`, currently `[2]`); the expected primitive type for each
projected production field; a finite `overallCompletionPercent` within 0..100; and a V1.1 overlay
that is an object or null. Any failure yields `valid: false` with `production`/`development` `null`
and one deterministic code: `GOVERNANCE_CHECKPOINT_NOT_OBJECT`,
`GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:<v>`, `GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:<field>`,
`GOVERNANCE_CHECKPOINT_PROGRESS_OUT_OF_RANGE:<v>`, `GOVERNANCE_CHECKPOINT_OVERLAY_INVALID`.

`GovernanceObservation` now reports three separate facts — `present`, `readable` (the bytes yielded
an interpretable document) and `valid` (the document passed the gate) — and `status.release` and
`doctor.governance` expose all three. `operatorStatus` consumes state and progress only when
`governance.valid` is true, so an invalid checkpoint cannot supply an operator state or a progress
percentage. Presence is still reported: the file is not hidden, it is simply not authoritative.

**Tests:** the gate accepts well-formed supported documents; rejects non-objects, arrays, nested
arrays and every unsupported or malformed version; rejects wrong field types, `NaN`, `Infinity`,
out-of-range progress and non-object overlays with the exact expected code; a valid checkpoint still
projects production and the V1.1 overlay separately. Integration: a parseable checkpoint containing
`status: "GBS_V1_PRODUCTION_ACCEPTED"`, `overallCompletionPercent: 100` and a fabricated
`APPROVED` overlay produces `present: true, readable: true, valid: false, production: null,
development: null`, `operator.progress === null`, an operator state that is not the fabricated one,
and no occurrence of the fabricated strings anywhere in the output.

### 2.5 Live confirmation at the corrected head

```
$ gef status --target . --json            # repository root, real checkpoint
release.valid        true
release.production   GBS_V1_PRODUCTION_ACCEPTED / 100
release.development  GBS_V11_WO_003_ADMITTED
operator             GBS_V1_PRODUCTION_ACCEPTED | progress 100 | stale true
drift                null
driftBaseline        {"state":"ABSENT","ref":null}
observationLimits    ["drift.baseline.absent","operator.stale.unknown_conservative"]

== H1: ancestor alias (junction on win32) ==
present/readable/valid true false false | production null
limit DIAGNOSTIC_ALIAS_REFUSED:.engineering/CHECKPOINT.json
docs entries 0 | sentinel leaked? false

== H2: over-budget checkpoint (1 MiB + padding) ==
present/readable/valid true false false | production null
limit DIAGNOSTIC_FILE_OVER_BUDGET:.engineering/CHECKPOINT.json

== H4: validation gate ==
supported versions [2]
valid        VALID
progress 999 invalid GOVERNANCE_CHECKPOINT_PROGRESS_OUT_OF_RANGE:999
version 3    invalid GOVERNANCE_CHECKPOINT_SCHEMA_UNSUPPORTED:3
wrong type   invalid GOVERNANCE_CHECKPOINT_FIELD_TYPE_INVALID:status
overlay array invalid GOVERNANCE_CHECKPOINT_OVERLAY_INVALID
```

### 2.6 Correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H1 alias/containment | `readContainedDiagnosticFile`, `DiagnosticReadOutcome`, `diagnosticReadLimits`, `isContained` | focused H1 cases (6), E2E `an ancestor alias is refused through the real process`, dist-smoke `the installed package carries the contained-read hardening` |
| H1-adjacent HEAD ref | `observeRepository` symbolic-ref shape gate + `GIT_HEAD_REF_UNUSABLE` | covered by the WO-002 repository suites (real symbolic refs unchanged); the refusal is recorded as a limit |
| H2 budgets | `DIAGNOSTIC_FILE_MAX_BYTES`, `DIAGNOSTIC_SOURCE_MAX_FILES`, size gate before read, exact-size bounded read | focused H2 cases (5), E2E `an over-budget checkpoint cannot populate release or operator truth` |
| H3 drift | `recordedBaselineSupported`, `drift: DriftResult \| null`, `driftBaseline.state`, `operator.stale.unknown_conservative` | focused H3 cases (5) |
| H4 checkpoint gate | `validateGovernanceCheckpoint`, `SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS`, `GovernanceObservation.valid` | focused H4 cases (5), E2E `an invalid checkpoint never becomes production or operator truth` |

### 2.7 Platform evidence gap (explicit, not inferred)

A real **file** symlink cannot be created on this Windows host without elevation
(`fs.symlinkSync` fails with `EPERM`; Developer Mode is not enabled). The affected cases therefore
do two things locally: they exercise the identical link-like refusal with a **directory junction**
(which Windows reports as a symbolic link through `lstat`, and which is the unprivileged alias a
Windows target can actually create), and they report the gap through the test runner's diagnostic
channel rather than claiming the file-symlink case as locally covered. The genuine file-symlink
paths run in CI on `ubuntu-latest` and `macos-latest`, where the same tests create real symlinks.
No PASS is claimed by inference for the elevated-only case on Windows.

---

## 3. Correction cycle — H5–H6 (objective reaudit review `5237002898`)

Disposition at the H1–H4 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 2. The reaudit
confirmed the governance/documentation path was materially closed — contained regular-file reads,
explicit byte/source budgets, absent-baseline drift suppression and checkpoint validation were all
accepted — and identified the two remaining gaps in the *same* S0 trust boundary: Git metadata
still bypassed the contained-read policy (H5) and was still unbounded (H6). Both are corrected here.

### 3.1 H5 — Git metadata must use containment / non-alias reads

**Defect.** `observeRepository()` still read `.git/HEAD` and the symbolic-ref target with a direct
`readFileSync(resolve(...))`, and probed the operation sentinels with a link-following `existsSync`.
A `.git` directory alias, a `HEAD` alias or a ref-file alias could therefore escape the target root
and read external filesystem content into the observation. The symbolic-ref shape gate added in H1
only constrained the *text* of the ref after `HEAD` had already been read through a following path.

**Correction.** The containment primitive was factored out of `readContainedDiagnosticFile` into
`walkContained`, so there is now exactly one containment policy with two thin consumers instead of
one policy per caller:

| Consumer | Purpose |
|---|---|
| `readContainedDiagnosticFile(root, ref, budget)` | content read: walk → regular-file requirement → `realpath` containment → open → `fstat` identity binding → size gate → exact-size bounded read |
| `containedEntryKind(root, ref)` | non-following existence probe, used for the Git operation sentinels so they no longer fall back to a link-following `existsSync` |

`readGitMetadata(root, ref)` is a thin specialization over the same primitive with the Git budget
substituted — explicitly not a second policy. Every Git metadata read now goes through it, and
`.git`, `.git/HEAD` and any symbolic-ref target are bound to the approved project root:

- **`.git` classification without following links.** `containedEntryKind(root, ".git")` is consulted
  first. `ABSENT` keeps the known-absent `NOT_APPLICABLE` state; `ALIAS_REFUSED` / `UNREADABLE`
  produce `UNKNOWN` with `GIT_DIRECTORY_ALIAS_REFUSED` and the underlying
  `DIAGNOSTIC_ALIAS_REFUSED:.git` — the Git subprocess is **not** run, so nothing follows the alias;
  a non-directory `.git` (a `gitdir:` worktree/submodule file, or any other indirection form) yields
  `GIT_DIRECTORY_NOT_A_DIRECTORY` and `UNKNOWN`. None of these invent a clean tree.
- **`HEAD` read under containment and budget.** A refused or over-budget `HEAD` returns `UNKNOWN`
  with no head value and the concrete refusal code.
- **Symbolic-ref target read under containment and budget.** The ref name must match the exact
  shape of a real symbolic ref (`refs/…`, no `..`, no `//`); otherwise `GIT_HEAD_REF_UNUSABLE`. The
  referenced file is then read through the same helper as `.git/<refName>`, so an aliased or
  escaping ref file is refused rather than followed, and the ref name is reported without a value.
- **Detached identity validated by shape.** A `HEAD` whose content is neither a ref name nor a Git
  object id is `GIT_HEAD_UNUSABLE` rather than being propagated as a head value. This is an
  additional hardening beyond the letter of H5, disclosed here: without it, arbitrary (bounded) file
  content would still reach the projection as `repository.head`.
- **Process bounds unchanged.** The argv-based `git status` call and the `git --version` probe keep
  their existing timeout and `maxBuffer` limits; they were not weakened.

### 3.2 H6 — Git metadata reads must be byte-bounded

**Defect.** The direct `HEAD` and ref reads had no byte limit, so a hostile or accidentally oversized
`.git/HEAD` could consume unbounded memory/CPU before the already-bounded `git status` subprocess
ran (SECURITY.md resource safety, T12).

**Correction.** `GIT_METADATA_MAX_BYTES = 4096`, an explicit small budget separate from — and
strictly below — the general `DIAGNOSTIC_FILE_MAX_BYTES`, because Git metadata is read before any
subprocess bound applies. The shared helper already checks object type and size **before** reading
and never reads-then-truncates; for Git metadata the same path yields `OVER_BUDGET` with
`DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD` (or `…:.git/refs/heads/<name>`), `bytes === null`, a
`UNKNOWN` dirtiness, no head/branch value and no repository verdict. Oversized content is never
embedded in diagnostics or error metadata: the limit code carries only the reference, never the
content, and the padding does not appear anywhere in the projection.

### 3.3 Live confirmation at the H5–H6 corrected head

```
== H5: .git directory alias (junction on win32) ==
.git kind              ALIAS_REFUSED
dirtiness              UNKNOWN
head                   undefined
limits                 ["DIAGNOSTIC_ALIAS_REFUSED:.git","GIT_DIRECTORY_ALIAS_REFUSED","WORKING_TREE_NOT_OBSERVED"]
sentinel leaked?       false
naive read leaks?      true          <- the alias is a genuine escape; only the contained read refuses it

== H5: aliased symbolic-ref target ==
readGitMetadata        {"status":"ALIAS_REFUSED","ref":".git/refs/heads/main","bytes":null,
                        "limit":"DIAGNOSTIC_ALIAS_REFUSED:.git/refs/heads/main"}
head                   ""
limits                 ["DIAGNOSTIC_ALIAS_REFUSED:.git/refs/heads/main"]

== H5: traversal in symbolic ref ==
head                   ""
limits                 ["GIT_HEAD_REF_UNUSABLE"]

== H5: .git as a gitfile ==
.git kind              FILE
dirtiness              UNKNOWN
limits                 ["GIT_DIRECTORY_NOT_A_DIRECTORY","WORKING_TREE_NOT_OBSERVED"]

== H6: Git metadata byte budget ==
GIT_METADATA_MAX_BYTES   4096
DIAGNOSTIC_FILE_MAX_BYTES 1048576
at limit status        OK
at limit head          aaaaaaaaaaaa... / DETACHED
over by one status     OVER_BUDGET
over by one limit      DIAGNOSTIC_FILE_OVER_BUDGET:.git/HEAD
over by one bytes      null
dirtiness              UNKNOWN
head                   undefined
padding echoed?        false
```

The `naive read leaks? true` line is a deliberate sensitivity assertion: a direct `readFileSync` of
the aliased path really does return the external sentinel, so the fixture exercises the escape and
the test cannot pass against the pre-correction behaviour, which had no refusal state at all.

### 3.4 H5–H6 correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H5 containment for Git metadata | `walkContained` (single primitive), `containedEntryKind`, `readGitMetadata`, rewritten `observeRepository` | focused H5 cases (6): `.git` alias, `HEAD` alias, symbolic-ref alias, traversal text, gitfile, normal repository intact; E2E `an aliased Git directory is refused through the real process`; dist-smoke `the installed package refuses aliased and oversized Git metadata` |
| H5 detached-identity shape (disclosed extra) | `GIT_HEAD_UNUSABLE` gate in `observeRepository` | focused H6 exact-limit case asserts the valid shape is accepted; the unusable shape is covered by the same gate |
| H6 Git metadata budget | `GIT_METADATA_MAX_BYTES`, `readGitMetadata` | focused H6 cases (4): budget constant, at-limit/one-over `HEAD`, over-budget ref (with at-budget admission), over-budget semantics + determinism + no content echo; E2E `oversized Git metadata is refused through the real process`; dist-smoke installed-package case |

### 3.5 Platform note

The genuine file-symlink form still requires elevation on this Windows host, so the aliased `HEAD`
and aliased ref cases use a directory junction — which Windows reports as a symbolic link through
`lstat` and which is the alias a Windows target can actually create (verified live: a junction
pointing at an external file path is reported as a link and refused). Real file symlinks are
exercised in CI on `ubuntu-latest` and `macos-latest`. No coverage is claimed by inference.

---

## 4. Correction cycle — H7–H8 (objective reaudit review `5237495234`)

Disposition at the H5–H6 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 2. The reaudit
confirmed H1–H6 were materially closed and identified two remaining gaps in the **Git dirtiness
subprocess**: it could write the repository index while merely observing it (H7), and it inherited
repository configuration that can make Git execute a repository-selected FSMonitor hook or start the
built-in daemon during a read-only diagnostic (H8). Both are corrected here, narrowly, in the probe
argv and environment.

### 4.1 H7 — `git status` must not write the index

**Defect.** `observeRepositoryDirtiness()` ran
`git -C <target> status --porcelain -z --untracked-files=normal` without Git's
`--no-optional-locks` protection. Git documents that `git status` refreshes the index and may write
the refreshed index as an optimization, which contradicts the WO-003 S0/zero-mutation contract. The
write only happens when the refresh has something to update, which is exactly why a benign fixture
had proved nothing.

**Correction.** The probe now runs as
`git -c core.fsmonitor=false --no-optional-locks -C <target> status --porcelain -z --untracked-files=normal`,
and the probe environment binds `GIT_OPTIONAL_LOCKS=0` as a deterministic second expression of the
same guarantee, so the protection does not rest on argument precedence alone. Invocation stays a
direct executable plus argv array with no shell string, under the existing 10 s timeout and the
now-explicitly-named `GIT_STATUS_MAX_BUFFER` output bound. Dirtiness semantics are untouched: the
classification still comes from the same `--porcelain` output, and nothing is suppressed to obtain a
side-effect-free probe.

### 4.2 H8 — repository config must not execute FSMonitor during the S0 probe

**Defect.** The same subprocess inherited repository Git configuration. Git uses
`core.fsmonitor` during `status`, and a repository can set it to a hook command path — so running a
read-only `gef doctor` or `gef status` could execute a target-selected process.

**Correction.** `-c core.fsmonitor=false` is passed in the same argv invocation. Command-line
configuration outranks system, global, local and worktree configuration, so a target repository
cannot re-enable FSMonitor for this probe, cannot have its hook executed, and cannot make the
diagnostic require or start the built-in daemon. The override is **process-local**: no user or
repository configuration is read into GEF state, rewritten or persisted — verified by asserting the
repository's `core.fsmonitor` still names its own hook after the probe. Fail-closed behaviour and
full working-tree observation are preserved.

**Environment note (SEC-05).** The probe keeps the inherited environment, because Git needs `PATH`,
`HOME` and `SystemRoot` and narrowing it is neither required by the finding nor safe to do narrowly,
and adds exactly one binding: `GIT_OPTIONAL_LOCKS=0`. No other variable is set, removed or emitted,
and no secret is read into evidence.

### 4.3 Live confirmation at the H7–H8 corrected head

```
== H7: index byte identity ==
plain git status               possible=true  (fixture is refreshable)
index before                   c4e60de74bb42db41f9b0377cb63e88f
gef doctor exit                0     index unchanged? true
gef status exit                0     index unchanged? true
index after                    c4e60de74bb42db41f9b0377cb63e88f
index.lock left?               false
branch/HEAD/refs               master / 427230321001 / 1 ref(s)
dirtiness preserved            OBSERVED / dirty=false

== H8: fsmonitor hook ==
plain status: hook ran?        true  sentinel=true  (fixture is live)
gef doctor exit=0              hook ran? false  sentinel? false
  hook path echoed?            false
gef status exit=0              hook ran? false  sentinel? false
  hook path echoed?            false
repo config preserved?         true
fsmonitor=true doctor          exit=0 hook=false daemon-artifact=false
fsmonitor=true status          exit=0 hook=false daemon-artifact=false
```

The `plain git status` lines are the liveness proof: without optional-lock suppression the fixture's
index really is rewritten, and the configured FSMonitor hook really is executed and writes its
external sentinel. The fixtures are therefore dangerous, and the GEF results are meaningful rather
than vacuous.

### 4.4 Sensitivity proof — the new tests fail against the audited behaviour

The audited-head argv was reintroduced faithfully (the safety arguments removed and the
`GIT_OPTIONAL_LOCKS` binding dropped) and the suite re-run:

```
defect reintroduced
✖ H7: doctor and status leave .git/index byte-for-byte identical
✖ H8: doctor and status never execute a repository fsmonitor hook
✖ H8: core.fsmonitor=true needs no daemon or hook for the probe
ℹ tests 19  ℹ pass 16  ℹ fail 3
```

The two liveness tests still passed, as they must: they assert that the fixtures are dangerous, not
that GEF is safe. The fix was then restored and the suite returned to 19/19. This is the direct
evidence that the H7/H8 tests are not vacuous.

### 4.5 H7–H8 correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H7 no index mutation | `GIT_STATUS_SAFETY_ARGV`, `GIT_STATUS_MAX_BUFFER`, probe `env` binding | E2E `H7: the fixture's index really is refreshable by a plain git status` (liveness), `H7: doctor and status leave .git/index byte-for-byte identical`, dist-smoke `the installed package probes dirtiness without index or fsmonitor side effects` |
| H8 no FSMonitor execution | `-c core.fsmonitor=false` in `GIT_STATUS_SAFETY_ARGV` | E2E `H8: the fsmonitor fixture is live — a plain git status does run the hook` (liveness), `H8: doctor and status never execute a repository fsmonitor hook`, `H8: core.fsmonitor=true needs no daemon or hook for the probe`, dist-smoke installed-package case |

Both themes are additionally checked by the pre-existing `neither command mutates the project tree,
.gef state or Git state` case, whose `gitState` comparison now also covers `refs`, local `config`
and the index digest, and by the WO-002 dirtiness suites which remain green.

### 4.6 A red CI check, its diagnosis, and the fixture correction

The first push of this correction (`8480f07`) produced **one failing check**:
`M55-M61 Integrated Assurance → regression` on `ubuntu-latest`, with

```
not ok 1384 - doctor and status mutate neither the project tree nor Git state
error: "ENOENT: no such file or directory, stat
        '/tmp/gef-nomut-HK8ZdY/.git/objects/maintenance.lock'"
```

**Diagnosis.** The failure was in the test harness, not in the product. That case compares a
recursive digest snapshot of the whole tree — including `.git/` — before and after each command,
and its own `gitState()` helper ran a **plain** `git status`, which allows Git's optional
sub-operations (auto-gc and `maintenance run --auto`) to run. On Linux those can detach, so a
transient `.git/objects/maintenance.lock` appeared and disappeared while the walk was running, and
`statSync` on a path that had just been listed threw `ENOENT`. Nothing in GEF creates that path;
`GIT_OPTIONAL_LOCKS=0` — which the corrected probe now sets — is precisely what disables those
optional sub-operations. The change therefore made the probe strictly safer while shifting the
timing of Git's own detached maintenance, which had been a latent flake in the harness since the
first cycle. It is recorded here because a green re-run must not be presented as if the red one had
never happened.

**Correction (harness only).** Two changes, both to test fixtures:

1. The comparison helper now reads status through the same side-effect-free invocation
   (`-c core.fsmonitor=false --no-optional-locks`, `GIT_OPTIONAL_LOCKS=0`), so the harness cannot
   perturb the state it measures.
2. Every repository fixture in the three WO-003 suites now sets `gc.auto=0` and
   `maintenance.auto=false`, so Git's own background maintenance cannot become a second writer in a
   tree whose whole purpose is to prove that nothing writes to it.

The tree snapshot was deliberately kept **strict** (a vanished path still fails) rather than made
tolerant: ignoring disappearing files would weaken exactly the assertion that case exists to make,
and it would convert an unexplained change into a pass.

---

## 5. Correction cycle — H9–H10 (objective reaudit review `5238264811`)

Disposition at the H7–H8 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 2. The reaudit
confirmed H1–H8 closed and identified the last two gaps in the same boundary: `observeRepositoryDirtiness`
still launched Git with `env: { ...process.env, … }` (H9), and both probes still resolved the
executable through ambient `PATH` (H10). Both are corrected by binding the Git subprocess to the
frozen M04-S04 toolchain authority and to an explicit minimal child environment.

### 5.1 H9 — minimal child environment and target binding

**Defect.** The probe copied the caller's environment wholesale. `SEC-05` requires a minimal
allowlisted child environment, and Git gives ambient variables semantic authority over repository
and index location — so `GIT_DIR`/`GIT_WORK_TREE` could point the "target-bound" probe at a different
repository, and `GIT_INDEX_FILE` at a foreign index, while argv still said `-C <target>`.

**Correction.** `gitProbeEnvironment()` builds the child environment from an explicit allowlist of
nine keys, each admitted for a stated runtime reason:

| Key | Why admitted |
|---|---|
| `PATH` | the child's own runtime portability. It is **not** the resolution mechanism: the executable is absolute and chosen by policy |
| `HOME`, `USERPROFILE` | the platform's home location, used by Git for its global configuration |
| `SystemRoot`, `WINDIR` | required by the Win32 runtime on Windows |
| `PATHEXT` | executable extension resolution on Windows |
| `TEMP`, `TMP`, `TMPDIR` | the platform's temporary directory |
| `GIT_OPTIONAL_LOCKS` | set explicitly to `0`, never inherited (H7) |

Because it is an allowlist, `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`,
`GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_NAMESPACE`, `GIT_CEILING_DIRECTORIES`, `GIT_COMMON_DIR`,
`GIT_CONFIG*` and trace variables cannot reach the child **by construction** rather than by being
denied one at a time, and `--target` remains the repository authority. The same environment is used
for both Git probes.

*Honest note:* on this host the probes also succeed with a completely empty environment, so `PATH` is
admitted as a portability allowance for the child's runtime rather than as a proven requirement — and
it cannot influence *which* Git runs.

### 5.2 H10 — approved / trusted Git executable resolution

**Defect.** `gitBinaryAvailable()` and the dirtiness probe called `spawnSync("git", …)`, so ambient
`PATH` chose the executable. A directory placed first on `PATH` could supply a `git` that ran merely
because an operator asked for a read-only diagnostic.

**Correction.** The CLI now resolves Git through the frozen preflight toolchain authority, reached at
a dedicated `@gef-bootstrap/preflight/toolchain` subpath export (the module has no runtime imports of
its own, so the packaged runtime grows by exactly one package instead of pulling in the unrelated
config/identity machinery behind the package root):

- `ToolDescriptor` with `resolution: { kind: "TRUSTED_PATH", executable, policyRef }` and the declared
  policy `gef.cli.git-executable-policy.v1`;
- `ToolObservationPort`, implemented once as the smallest adapter around the frozen contract, since
  the repository ships no other implementation;
- `ToolObservationSession`, which normalizes the observation and produces the gap codes;
- a Git-specific `parseVersion` with `parseVersionRef` (`gef.cli.git-version-parser.v1`), because the
  frozen default parser does not accept a vendor suffix such as `2.55.0.windows.3`.

The admitted locations are a **frozen constant, not derived from the environment**: `%ProgramFiles%\Git\cmd`,
`%ProgramFiles%\Git\bin` and `%ProgramFiles(x86)%\Git\cmd` on Windows; `/usr/bin`, `/bin`,
`/usr/local/bin`, `/opt/homebrew/bin` and `/opt/local/bin` elsewhere — all machine-owned, so writing
there needs administrative privilege. A descriptor naming any other path is refused by the policy
itself (`gef.cli.git.path_not_admitted`), and a `PATH_NAME` descriptor — the weaker kind — is refused
outright (`gef.cli.git.untrusted_resolution_kind`). No caller can widen the trusted set by
constructing a descriptor, and no environment value can add, reorder or redirect a location.

Resolution happens **once** per invocation and is memoized (`gitTool()`), so the version probe and
the dirtiness probe provably use the same binary; the identity is
`sha256(physical path | dev | ino | size)`. A failed resolution returns `null` and the probes report
`UNKNOWN`/unavailable — there is no path from a failed trusted resolution to ambient `PATH`
execution. The doctor projection exposes the frozen evidence (`toolchain.git`: tool id, presence,
executable identity, observed version, probe status, compatibility `NOT_CHECKED`, gaps) and carries
no absolute path, no `PATH` contents and no raw probe output (M04-S04 TOOL-18).

### 5.3 Live confirmation at the H9–H10 corrected head

```
== H10: approved executable resolution ==
policy ref                         gef.cli.git-executable-policy.v1
admitted locations                 3
resolved executable                true (absolute, identity below)
executable identity                2302c560267fbd0aadd7365a01dc239626f26a1aa07354b1025f790b19b24462
resolution kind                    TRUSTED_PATH
version probe                      SUCCEEDED exit=0
non-admitted path                  UNAVAILABLE gef.cli.git.path_not_admitted
PATH_NAME descriptor               UNAVAILABLE gef.cli.git.untrusted_resolution_kind
refused resolver -> tool           null (no ambient fallback)

== H9: admitted child environment ==
admitted keys                      GIT_OPTIONAL_LOCKS, HOME, PATH, PATHEXT, SystemRoot, TEMP, TMP, USERPROFILE, WINDIR
GIT_OPTIONAL_LOCKS                 0
forbidden keys present             none

== H9: hostile GIT_DIR / GIT_WORK_TREE (A clean, B dirty) ==
A porcelain (plain)                ""
A with GIT_DIR=B                   "?? only-in-b.txt\n"
gef status dirtiness               OBSERVED
gef status dirty?                  false
B marker leaked?                   false

== H9: hostile GIT_INDEX_FILE ==
plain with external index          exit=128 stdout=""
gef dirtiness                      OBSERVED
gef dirty?                         false
external index intact?             true

== H10: runnable fake git first on PATH ==
plain PATH lookup                  exit=0 is-git-version=false
fake executed?                     a different program answered
gef toolchain presence             FOUND
gef probe status                   SUCCEEDED
gef identity == approved           true
gef dirtiness under fake           OBSERVED dirty=false
```

The fixture is discriminating by construction: repository A is clean and repository B carries an
untracked file, so a redirected observation is visible as dirtiness that A does not have. The plain
`A with GIT_DIR=B` line shows the redirect really happens; `gef status` reports A clean and never
mentions B's file.

### 5.4 Sensitivity proof — the new tests fail against the audited behaviour

Two rounds were needed, and the first is recorded because it is the more useful finding.

**Round 1 (failed to prove anything).** The pre-correction probes were reintroduced faithfully and the
suite still passed. The tests were not sensitive:

- the H9 assertions did not read the discriminating observable — both fixture repositories looked
  the same to the assertion, so a redirect was invisible;
- the H10 Windows fixture used a `.cmd` fake, and Node refuses to spawn `.cmd` without a shell, so
  the fake never ran even under the vulnerable code — the fixture was not live.

**Round 2 (after rewriting the tests).** The pre-correction behaviour was reintroduced again:

```
✖ Git presence no longer depends on ambient PATH at all
✖ the approved Git is used even with an empty PATH, and status still observes the tree
✖ H9: GIT_DIR and GIT_WORK_TREE cannot redirect the admitted target
✖ H9: GIT_INDEX_FILE is neither consumed nor modified
✖ H10: a runnable fake git first in PATH is never executed
ℹ tests 28  fail 5
```

The Windows fake is now a copy of a genuine system executable named `git.exe`, which Node does
spawn: the liveness line shows it answers an ambient lookup with something that is not a Git version,
and, because it prints its error text on stdout with exit 0, a vulnerable probe parses that text as
porcelain output and reports fabricated dirtiness — which is what the corrected assertion catches.
The fix was then restored and the suite returned to 28/28.

A defect was also found in the correction itself while writing these tests: the port originally
trusted any path named by a descriptor carrying the policy reference. The policy now enforces its own
admitted set, which the test `H10: a descriptor outside the declared policy is refused` pins.

### 5.5 H9–H10 correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H9 minimal environment | `gitProbeEnvironment`, `GIT_PROBE_ENVIRONMENT_KEYS`, probe wiring in `observeRepositoryDirtiness` and `cliToolObservationPort.probe` | E2E `H9: GIT_DIR and GIT_WORK_TREE cannot redirect the admitted target`, `H9: GIT_INDEX_FILE is neither consumed nor modified`, `H9: object-store and config redirection variables cannot change the observation`, `H9: an arbitrary ambient variable is not forwarded or echoed`, `H9: the Git probe environment is an explicit allowlist` |
| H10 approved resolution | `GIT_APPROVED_EXECUTABLES`, `GIT_EXECUTABLE_POLICY_REF`, `gitToolDescriptor`, `inspectAdmittedExecutable`, `cliToolObservationPort`, `resolveGitToolWith`, `gitTool`, `observeGitTool`, `parseGitVersion` | E2E `H10: a runnable fake git first in PATH is never executed`, `H10: a failed resolution does not fall back to ambient git`, `H10: the approved locations are a frozen constant list`, `H10: a descriptor outside the declared policy is refused`, `Git presence no longer depends on ambient PATH at all`, `the approved Git is used even with an empty PATH…`; dist-smoke `the installed package resolves Git through the approved policy, not PATH` |
| Toolchain evidence | `doctor.toolchain.git` projection in `doctorComposition` | asserted through the E2E doctor cases |

---

## 6. Correction cycle — H11–H12 (objective reaudit review `5238855257`) + lockfile (M3)

Disposition at the H9–H10 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 2, plus one
MEDIUM. The reaudit confirmed H1–H10 closed and found that the trust admission was still only
lexical (H11) and that the executable identity was not bound to the process actually spawned (H12).
The stale workspace lockfile (M3) is reconciled in the same increment.

### 6.1 H11 — physical trust, not lexical admission

**Defect.** `GIT_APPROVED_EXECUTABLES` admitted fixed *path strings*, and `inspectAdmittedExecutable`
then used `statSync()` — which follows aliases — with `realpathSync.native()` only to build an
identity digest. The physical resolved target was never authorized, so an admitted path could be a
symlink, junction or reparse alias to an executable outside the declared trust surface and still
return `FOUND`.

**Correction.** Admission now applies to the physical executable:

1. **Lexical admission** — the requested reference must be one of the policy's declared candidates.
2. **Physical admission** — `realpathSync.native(candidate)` must be inside one of the policy's
   approved **physical roots**, compared after resolving each root too, so a root that is itself an
   alias is normalized consistently.
3. The physical target must be a regular file the process may execute.
4. On platforms exposing POSIX permission bits it must additionally not be writable by group or
   others. Where the platform exposes no such primitive the admission returns
   `permissionProof: "UNAVAILABLE_ON_PLATFORM"` rather than claiming the proof passed.

**Alias behaviour is explicit:** aliases are permitted, but only when the final physical target
passes the physical-root and permission policy. A payload reached through a link is refused when it
lands outside the approved roots, and an admitted path with a legitimate alias (a distribution that
symlinks `/bin` to `/usr/bin`) still works because the physical target is inside an approved root.

The roots are a frozen constant with a per-platform rationale, **not derived from the environment**,
and the policy refuses a `PATH_NAME` descriptor outright. The policy reference became
`gef.cli.git-executable-policy.v2`. Deterministic refusals: `gef.cli.git.path_not_admitted`
(lexical), `gef.cli.git.physical_path_not_admitted` (physical escape),
`gef.cli.git.physical_path_writable_by_others`, `gef.cli.git.executable_not_regular`,
`gef.cli.git.executable_not_executable`, `gef.cli.git.executable_unresolvable`.

### 6.2 H12 — identity bound to the process actually spawned

**Defect.** `gitTool()` cached `{ executable, identity }` in a module global that outlived one
`runCli` call, and the probes executed only the cached path with no revalidation before `spawnSync`.
A replacement between resolution and execution could make the evidence claim identity A while the
process that ran was B.

**Correction.** The port that verified an executable is now **the only place a Git process is
launched**, and it re-inspects under the same policy immediately before every spawn:

- `probe` re-inspects the executable, compares the physical path and identity against what the
  policy admitted, and on any difference **refuses without spawning**, recording the refusal as
  `gef.cli.git.identity_changed_before_spawn`.
- Resolution is **scoped to one invocation**: `runCli` installs the snapshot with
  `beginGitToolInvocation` and removes it in a `finally`, so no module-global value carries an
  identity across invocations. `deps.gitExecutablePolicy` is the injection point — deliberately not
  an environment variable.
- Outside an invocation a probe resolves for that call alone and discards the result with it, so
  nothing is reused across calls (M04-S04 TOOL-14).
- Evidence reports an identity **only when a probe actually succeeded through a verified
  executable**. A refused or stale resolution reports no identity at all. A defect found while
  writing the tests is fixed with it: the observation previously fell back to the snapshot's
  identity when the resolution failed, which is exactly the H12 failure mode.

The version observation and the dirtiness observation therefore run through the same
invocation-bound port, and the identity in the projection is the identity verified for the process
that answered.

### 6.3 Live confirmation at the H11–H12 corrected head

```
H11 physical escape (injected test policy over a temporary approved root)
  liveness        executing the admitted lexical path runs the external payload
  inspection      status UNAVAILABLE, reason gef.cli.git.physical_path_not_admitted
  identity        none issued for a refused target
  resolveGitToolWith(port) -> null

H11 valid approved physical target
  inspection      FOUND, aliasTraversed false, identity sha256
  runGitProbe     ok, identity == the admitted identity, the approved payload is what ran

H11 permission proof
  POSIX           chmod 0777 -> UNAVAILABLE / physical_path_writable_by_others; 0755 -> FOUND
  Windows         permissionProof UNAVAILABLE_ON_PLATFORM (recorded, not claimed)

H12 swap between resolution and execution
  first probe     payload A answers
  swap to B       runGitProbe -> ok false, reason gef.cli.git.identity_changed_before_spawn
  B executed?     no
  snapshot        unchanged (not silently rewritten)

H12 swap between the version probe and the dirtiness probe
  version probe   ok (payload A)
  swap to B       observeRepositoryDirtiness -> UNKNOWN, refusal code, B not executed

H12 two logical invocations in one process
  invocation 1    identity == the identity the policy admits for payload A
  swap to B       invocation 2 identity != identity A, re-resolved
```

### 6.4 Sensitivity proof — the tests fail against the audited behaviour

Three defects were reintroduced faithfully (lexical-only admission, no execution-time revalidation,
module-global snapshot reused across invocations) and the suite re-run:

```
defects reintroduced: 3 of 3
✖ H11: an admitted lexical path whose physical target escapes the root is refused
✖ H12: a replacement between resolution and execution is refused, never executed
✖ H12: a replacement between the version probe and the dirtiness probe is refused
✖ H12: a second logical invocation re-resolves instead of reusing the first identity
```

Two mistakes made during this cycle are recorded rather than smoothed over. First, an earlier
reintroduction of the cross-invocation defect did not actually apply — the edit silently matched
nothing — so that test appeared insensitive; the check was repeated against the source and the
defect was reintroduced properly, after which the test failed as it should. Second, the first version
of the fixtures copied `node.exe` (~80 MB) as the payload, which made the probes timing-sensitive
under a loaded parallel `npm run validate` and produced two intermittent failures in the
`executableIdentity` assertions. The payloads were replaced with two small distinct system
executables, and the assertions now compare against output captured from the source binary, so
nothing depends on knowing what a payload prints.

### 6.5 M3 — workspace lockfile reconciliation

`packages/cli/package.json` declared `@gef-bootstrap/preflight`, but the root `package-lock.json`
still recorded only `contracts` and `kernel`. The lockfile was regenerated with the canonical
`npm install --package-lock-only --no-audit --no-fund` and the resulting diff is exactly the
expected lines — the CLI entry's `dependencies` gains `@gef-bootstrap/preflight: 0.0.0` and its
`bundleDependencies` gains the same package — with **no unrelated version changes**:

```
 package-lock.json | 8 +++++++-
 1 file changed, 7 insertions(+), 1 deletion(-)
```

Two guards now fail on any workspace manifest/lock drift:
`every workspace manifest agrees with the root lockfile` (compares every workspace package's
`dependencies`, bundled dependencies and version against its lock entry) and
`the CLI lockfile entry records the toolchain runtime dependency`. `npm ci --dry-run --no-audit
--no-fund` exits 0 against the reconciled lockfile.

### 6.6 H11–H12 correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H11 physical trust | `GitExecutableTrustPolicy`, `ApprovedExecutableRoot`, `DEFAULT_GIT_TRUST_POLICY`, `GIT_TRUST_POLICY_REF`, `inspectAdmittedExecutable` (physical admission + permission proof), `PhysicalTrustInspection` | focused `H11: an admitted lexical path whose physical target escapes the root is refused` (live alias + liveness), `H11: a valid approved physical target is admitted and usable`, `H11: a group/other-writable physical target is refused where the platform expresses it` |
| H12 execution-time identity | `createCliToolObservationPort` (verified map + revalidation in `probe`), `beginGitToolInvocation` / `endGitToolInvocation`, `gitScope`, `runGitProbe`, `observeGitTool` identity rule | focused `H12: a replacement between resolution and execution is refused, never executed`, `H12: a replacement between the version probe and the dirtiness probe is refused`, `H12: a second logical invocation re-resolves instead of reusing the first identity`, `H12: the reported identity is the one verified for the process that answered`, `H12: no fallback to PATH survives the invocation boundary` |
| M3 lockfile | `package-lock.json` | dist-smoke `every workspace manifest agrees with the root lockfile`, `the CLI lockfile entry records the toolchain runtime dependency` |

---

## 7. Correction cycle — H13–H14 (objective reaudit review `5239594304`)

Disposition at the H11–H12 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / HIGH 2. The reaudit
confirmed H1–H12 materially closed — physical realpath containment, execution-time identity recheck,
sequential cross-invocation re-resolution, the reconciled lockfile and green exact-head assurance —
and found the last two properties missing: the invocation authority was still process-global mutable
state (H13), and physical admission still did not prove that the executable cannot be replaced by the
caller (H14).

### 7.1 H13 — invocation authority bound to the async execution context

**Defect.** `activeInvocation` plus a `previousInvocations` stack were module-global mutable state,
while `runCli` is asynchronous. Two overlapping invocations could interleave — one installing its
scope, the other replacing it — and a probe could then observe another invocation's policy, port or
executable. The stack also assumed completion order matched nesting order, which concurrent promises
do not guarantee.

**Correction.** The authority is bound with `AsyncLocalStorage`:

```ts
const gitInvocationContext = new AsyncLocalStorage<GitToolInvocation>();

export function createGitToolInvocation(policy = DEFAULT_GIT_TRUST_POLICY): GitToolInvocation { /* own port, own policy, own resolved tool */ }
export function withGitToolInvocation<T>(policy: GitExecutableTrustPolicy, body: () => T): T {
  return gitInvocationContext.run(createGitToolInvocation(policy), body);
}
```

`gitScope()` reads only the store of the asynchronous chain it is running in. Nested invocations get
their own store and restore the outer one on return; sibling invocations started from the same
context cannot see each other; out-of-order completion changes nothing because there is no shared
slot to restore. The global `activeInvocation` / `previousInvocations` pair is gone.

A helper outside any invocation still resolves for that call alone and discards the result with it,
so it can never observe another invocation's policy, port, tool or refusal state (M04-S04 TOOL-14).

`runCli` also gained one small, explicitly documented embedding/test seam —
`deps.onGitInvocationScoped` — invoked once the invocation's authority is bound and before any
command runs. Tests use it as a barrier to hold two invocations open simultaneously and to force a
completion order opposite to the start order; without such a point the overlap could only be
approximated with sleeps, which is exactly what the finding rules out.

### 7.2 H14 — effective write authority on the executable and its path

**Defect.** `inspectAdmittedExecutable` proved lexical admission, physical-root containment,
regular-file/`X_OK` and, on POSIX only, the absence of **group/other** write bits. It never proved
owner identity, effective caller write authority, or replacement authority through a parent
directory. A current-user-owned `0755` executable — the shape of the H11 temporary fixture, and of a
typical Homebrew prefix — was accepted as `FOUND`. On Windows `permissionProof:
"UNAVAILABLE_ON_PLATFORM"` still returned `FOUND`, so the default policy trusted the path although no
write proof had been established, leaving the residual H12 TOCTOU window open.

**Correction.** The policy now declares the write-authority requirement it enforces, and the machine
policy enforces `MACHINE_NON_REPLACEABLE`:

1. **The executable itself** — an OS-enforced write attempt: `openSync(physical, "r+")` must fail.
   This is the effective-write primitive: an open for writing is evaluated by the operating system's
   own permission model, so it answers "can this process modify this object" rather than "do the
   mode bits look a certain way". No byte is written; the handle is closed immediately. Any refusal
   code other than the write-denial codes is treated as *not* proof of non-writability, so an
   unexpected failure can never be read as trust.
2. **Every component whose replacement could redirect execution** — from the approved root down to
   the executable's own directory. On POSIX the effective-write bit answers it directly; the first
   writable component refuses with `gef.cli.git.physical_path_parent_replaceable_by_process`.
3. **Windows** exposes no non-mutating directory-write primitive, so that component proof is
   reported as `directoryProof: "UNAVAILABLE_ON_PLATFORM"` and the executable's own ACL denial — a
   genuine proof, `EPERM` on `open(r+)` — is the whole basis. The weaker basis is disclosed in the
   projection rather than silently treated as equivalent, which is the distinction the finding
   demanded.

**Post-check replacement is infeasible under the admitted threat model** because admission requires
that this process cannot obtain a write handle on the executable, and this process and the operator
share an identity. Atomic execution-to-object binding is not available through Node's process
primitives, so the policy takes the finding's alternative: it makes replacement infeasible rather
than claiming a binding it cannot prove. A privileged actor (root, or a Windows administrator) can
replace anything; such an actor is not admitted, because the write probe succeeds for them and the
candidate is refused.

**The weaker option is explicit and separate.** `USER_MANAGED_GIT_TRUST_POLICY` (and
`userManagedGitTrustPolicy(roots)`) is a distinct policy reference,
`gef.cli.git-executable-policy.user-managed.v1`, with `writeAuthority: "USER_MANAGED_DECLARED"`: it
still requires a declared root, a regular executable inside it and the absence of group/other write
bits, but it accepts that the owner may replace the target. It is reachable only by deliberate
injection — never the default, never through an environment variable — and the H11/H12 temporary-root
fixtures now use it, which is precisely the "separately explicit trust decision with an owning
policy" the finding asks for. Default policy reference became `gef.cli.git-executable-policy.v3`.

### 7.3 Live confirmation at the H13–H14 corrected head

```
== H14: effective write authority ==
admitted executable (identity)           300efd9fa81b3b869bd064f226cc694a47c6f3a044f062749bb9a050c9fa2b29
this process can write it?               false
permissionProof                          UNAVAILABLE_ON_PLATFORM
directoryProof                           UNAVAILABLE_ON_PLATFORM
user-owned fixture can be written?       true
machine policy verdict                   UNAVAILABLE gef.cli.git.physical_path_writable_by_process
user-managed policy verdict              FOUND

== H13: two invocations alive at once, opposite completion order ==
both alive at once?                      yes (neither released yet)
A sees its own identity?                 true
B sees its own identity?                 true
identities differ?                       true
  releasing B first, then A (opposite to start order)
B completed first?                       yes
both completed                           yes
```

The H14 fixture is discriminating: the same file that the machine policy refuses is admitted by the
explicit user-managed policy, so the refusal is the write-authority rule and not a path problem. The
admitted system executable is one this process provably cannot write; the user-owned fixture is one
it provably can.

### 7.4 Sensitivity proof — the new tests fail against the audited behaviour

Two defects were reintroduced faithfully: module-global mutable authority in place of the async
context, and admission without the write-authority rule. Ten tests fail:

```
defects reintroduced: 2 of 2
✖ H13: concurrent invocations keep their own Git authority
✖ H13: each concurrent invocation reports only its own identity through doctor and status
✖ H13: a nested invocation is isolated and the outer authority is restored
✖ H13: no invocation authority survives outside an invocation
✖ H14: a caller-writable executable is refused by the machine policy
✖ H14: an alias whose physical target is caller-replaceable is refused
✖ H12: a replacement between resolution and execution is refused, never executed
✖ H12: a replacement between the version probe and the dirtiness probe is refused
✖ H12: a second logical invocation re-resolves instead of reusing the first identity
✖ H12: no fallback to PATH survives the invocation boundary
ℹ tests 64  pass 53
```

The four H12 failures are collateral from removing the invocation binding, which is expected: the
H12 guarantees rest on that binding. The H14 cases that still pass are correct — the
parent-component case is POSIX-only and the "genuinely non-replaceable" case asserts the system
executable is admitted, which is true with or without the write rule.

### 7.5 H13–H14 correction-to-code-and-test map

| Finding | Code | Tests |
|---|---|---|
| H13 async authority | `gitInvocationContext` (`AsyncLocalStorage`), `createGitToolInvocation`, `withGitToolInvocation`, `gitScope`, `RunDependencies.onGitInvocationScoped` | focused `H13: concurrent invocations keep their own Git authority`, `H13: each concurrent invocation reports only its own identity through doctor and status`, `H13: a nested invocation is isolated and the outer authority is restored`, `H13: no invocation authority survives outside an invocation` |
| H14 write authority | `GitExecutableTrustPolicy.writeAuthority`, `canOpenForWriting`, `writableComponent`, `DirectoryProof`, `USER_MANAGED_GIT_TRUST_POLICY`, `userManagedGitTrustPolicy` | focused `H14: a caller-writable executable is refused by the machine policy`, `H14: replacement authority through a path component is refused where provable`, `H14: an alias whose physical target is caller-replaceable is refused`, `H14: a genuinely non-replaceable admitted executable still succeeds` |

### 7.6 Windows behaviour, stated plainly

- **File authority**: proven. `open(r+)` on a machine-owned executable is denied with `EPERM`, so the
  default policy admits `%ProgramFiles%\Git\…` and refuses any executable this process can write.
- **Directory authority**: **not provable** with Node primitives, because there is no non-mutating
  directory-write check. The projection reports `directoryProof: "UNAVAILABLE_ON_PLATFORM"` and the
  executable's own ACL denial is the entire Windows basis. This is recorded as an evidence gap, not
  converted into an equivalence claim.
- **POSIX**: both proofs are available and enforced; the machine policy is strictly stronger there.

---

## 8. Final H14 cycle — trust-anchor closure (objective review `5239917392`)

Disposition at the H13–H14 corrected head: `CORRECTION_REQUIRED`, CRITICAL 0 / **HIGH 1**. H13 was
accepted as closed (`AsyncLocalStorage` gives invocation-local authority; the concurrent tests
overlap two real `runCli` calls with distinct policies, reversed completion order and no cross-talk).
The remaining HIGH was the trust anchor itself: the Windows path returned `FOUND` while
`directoryProof` said `UNAVAILABLE_ON_PLATFORM`, and the POSIX proof started at the declared root
although that root's own entry is controlled by its parent.

### 8.1 The trust-anchor model

The replacement-authority proof is one chain, walked from the executable upward **through the
declared root and every ancestor, terminating at the filesystem root** — which has no parent and
needs no further proof. Every link must deny this process effective replacement authority; the first
link that does not is the refusal reason.

```
executable → its directory → … → declared root → … → filesystem root
   ↑ file must deny write          ↑ every directory must deny replacement
```

| Platform | Executable | Each directory component |
|---|---|---|
| POSIX | `open(r+)` denied — the OS permission model | effective-write bit: `access(W_OK)` must fail |
| Windows | `open(r+)` denied — the ACL | **`open(dir, r+)` denied — the ACL** |

The Windows directory primitive was found empirically and is the key result of this cycle: the
runtime opens a directory through the backup-semantics path and requests write access, so the ACL
answers. `C:\Program Files\Git\cmd`, `C:\Program Files\Git`, `C:\Program Files` and `C:\` all deny
this process; a user-writable temporary directory opens successfully. Nothing is created, renamed or
deleted — the handle is closed immediately.

That replaces the previous fail-open: **directoryProof "UNAVAILABLE_ON_PLATFORM" can no longer
accompany `status: "FOUND"`**, and a test asserts that invariant over every candidate the default
policy can admit. Fail-closed remains the behaviour for refused or absent targets, where no chain is
established at all.

**TOCTOU.** The execution-time identity recheck stays mandatory, and the chain proof is what makes
replacement across the check-to-spawn interval infeasible under the admitted threat model: the
caller provably cannot write the executable and provably cannot replace any directory entry on the
path to it. No claim is made that a pathname recheck alone removes TOCTOU.

### 8.2 Live confirmation at this head

```
== chain for the real Git on Windows ==
C:/Program Files/Git/cmd   writable by this process? false
C:/Program Files/Git       writable by this process? false
C:/Program Files           writable by this process? false
C:/                       writable by this process? false

== chain for a user-writable temporary root ==
…/Temp/gef-chain-…         writable? true
…/Temp                    writable? true
C:/Users/csn19/AppData     writable? true
C:/Users/csn19             writable? true
C:/Users                   writable? false
```

The admitted executable is one whose entire chain denies replacement; a Homebrew/local-style prefix
owned by the current user is refused by the machine policy and admitted only by the explicitly named
user-managed policy.

### 8.3 Sensitivity proof

The audited chain behaviour was reintroduced (Windows fail-open, and only the executable's own
directory checked on POSIX) and three tests fail:

```
✖ H14: replacement authority through a path component is refused where provable
✖ H14-final: a caller-writable ancestor above the declared root is refused
✖ H14-final: a caller-replaceable root is unavailable under the default policy
```

The fixtures are live: the directory that holds the executable is demonstrably replaceable by this
process (POSIX effective-write bit, Windows ACL write-open) before the policy is asked to refuse it,
and the root-above-root case proves replacement authority one level higher than the old proof
reached.

### 8.4 A red CI round, its cause, and the fixture cleanup

The first push of this cycle (bc9ae59) turned **all 23 workflows red**. The failures were in the
three new H14 fixtures on Linux, with

```
Error: EACCES, Permission denied: /tmp/gef-h14-parent-...
```

These fixtures deliberately make a directory non-writable to prove the refusal, and the cleanup hook
then tried to delete that directory: removing an entry needs write authority on its directory, so the
harness could not undo what the test had just proved. Windows does not gate deletion on the POSIX
mode bits, which is why the same tests were green locally and red on ubuntu-latest. The cleanup now
restores the mode bits level by level before removing, and the three tests are green on both
platforms. A second round of the same origin surfaced two more fixture defects, both harness bugs:
the ancestor fixture asserted the declared root was non-replaceable without ever making it so, and the
prefix fixture placed the executable where the user-managed policy declares no candidate, so the
admission was refused for a path reason instead of being admitted by the explicit policy. The product
behaved identically throughout. Both red rounds are recorded here rather than presented as if the
green re-run had been the only outcome.

### 8.5 Regression status

H13 remains green unchanged: the concurrent-overlap tests were re-run and the `AsyncLocalStorage`
binding was not touched. The lockfile reconciliation is untouched and `npm ci --dry-run` is clean.
No WO-002 suite changed its result.

---

## 9. Windows replacement-rights correction (objective review `5240757786`)

Disposition at head `38e19dd…`: `CORRECTION_REQUIRED`, CRITICAL 0 / **HIGH 1**. H13 was confirmed
closed, and the POSIX trust-anchor chain was accepted as materially closed. The remaining finding was
the Windows half of H14.

### 9.1 The found defect, verified against the platform

The Windows proof treated a denied `open(r+)` as evidence that a path entry cannot be replaced. That
is only evidence that generic read/write access is denied. Windows replacement authority is governed
by two independent rights — `DELETE` on the target object and `FILE_DELETE_CHILD` on the containing
directory — and a process may lack generic write while holding either of them.

This was verified rather than reasoned about: a file whose `r+` open is refused because it is
read-only can still be renamed by the same process.

```
r+ denied?                                    true
rename/delete/replace authorised by the OS?   true
```

The previous Windows chain proof was therefore unsound, and the old test helper shared the production
predicate, which made it circular.

### 9.2 Why no proof can be built inside this Work Order

The supported runtime exposes no way to request `DELETE` or `FILE_DELETE_CHILD` access — Node maps only
read/write/create/truncate/append flags — and no security-descriptor API. So no OS-enforced probe for
those rights exists, and evaluating a descriptor against the current token would need a native binding
or a P/Invoke evaluator (the only Windows mechanisms that publish the decision in a non-localized,
non-free-form form). Adding either is an architecture and packaging decision above WO-003, so the
correction takes the alternative the finding prescribes.

### 9.3 The Windows rights model actually implemented

- The high-assurance policy returns `UNAVAILABLE` with the deterministic code
  **`gef.cli.git.replacement_rights_proof_unavailable`** for every Windows candidate.
- `directoryProof` is reported as `UNAVAILABLE_ON_PLATFORM` on Windows, so **`FOUND` can never
  accompany it**; a test asserts that invariant over every candidate.
- The executable-content check (`open(r+)` denial) is retained, because "the caller cannot modify the
  executable contents" remains a real, provable requirement — it is simply not sufficient alone.
- **Availability is not preserved by assumption**: no Windows path is trusted because it starts with
  `C:\Program Files`, and no owner-name, mode-bit or path-location heuristic is used.
- The POSIX model is unchanged and still accepted: lexical admission, physical-root containment,
  regular executable, contents non-writable, and the effective-write chain from the executable
  upward to the filesystem root.
- The execution-time identity recheck remains mandatory: the whole inspection, including the trust
  decision, runs again immediately before every spawn, so a change in either identity or trust rights
  refuses without executing.

### 9.4 The required non-circular Windows fixtures

| Fixture | What it proves |
|---|---|
| Write denied, replacement authorised | The dangerous case, with an **independent rename oracle** performed inside the disposable fixture — not the production predicate. The corrected policy returns `UNAVAILABLE` with the rights code. |
| Parent permits deletion | A protected executable inside a caller-replaceable directory is refused; the directory side of the decision is exercised by creating and removing a real entry. |
| Target-DELETE-only / delete-child-only | Both are refused because neither right is observable. Authoring an ACL that grants exactly one of them needs ACL editing the test runtime does not expose; that construction limit is recorded as an evidence gap, and the consequence it exists to assert — that a candidate holding either right cannot be trusted by assumption — is covered because **no** Windows candidate is admitted. |
| Trusted inverse | On POSIX the system chain is provable and admitted with `EFFECTIVE_WRITE_PER_COMPONENT`; on Windows nothing is admitted and the test asserts exactly that. |
| No fake execution | Every refused fixture asserts its sentinel executable was never spawned. |

All four Windows fixtures and the POSIX ones run in the focused suite: **72 / 72 passing**.

### 9.5 The consequence, and why this is a blocked decision

With no admitted Git on Windows, the working tree cannot be observed there: `gef doctor` reports the
toolchain as `UNAVAILABLE` with an actionable finding, `gef status` reports the repository as
`UNKNOWN` with a `null` verdict, and — because WO-002 deliberately blocks managed mutation when the
working tree cannot be observed — `init --apply` / `adopt --apply` are blocked on that platform.

That breaks five tests in the **accepted** WO-002 suites, which encode that accepted behaviour and
have been left unmodified:

```
tests/v11-wo-002-repository-state.test.mjs   fail 3
tests/v11-wo-002-cli.test.mjs                fail 1
tests/v11-wo-002-cli-e2e.test.mjs            fail 1
```

Local ladder on this host: `npm run validate` → exit **1**, tests 1456 / pass 1437 / fail 5 /
skipped 14. CI runs the full suite on `ubuntu-latest`, where the POSIX chain is proven and the whole
suite passes; the exact-head workflows for the head carrying this section are **23 runs / 89 checks,
all `success`**.

No safety guarantee is weakened — every path is strictly more conservative — but a supported platform
loses Git-backed capability, including managed mutations, which is a product-level decision WO-003
cannot make. Per the correction prompt this is the stated blocked condition: exact Windows
replacement rights cannot be proven inside the supported runtime without a frozen architecture
decision (a native effective-rights binding or an equivalent P/Invoke evaluator), so the default
machine policy fails closed and the disposition is **BLOCKED** pending that owner decision. The
WO-003 suites assert the truthful Windows outcome with explicit diagnosed skips for the Git-backed
cases rather than silently passing them.

---

## 10. What was delivered

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
- Drift is computed only when a supported recorded baseline exists (see §2.3), so the absence of
  governed state is never read as drift of governed state.

---

## 11. Changed files and reasons

### 11.1 Files inside the Context Lock `expectedWriteSurface`

| File | Change | Reason |
|---|---|---|
| `packages/cli/src/parser.ts` | `CliVerb` gains `doctor`/`status`; `ACTION_MAP` gains both frozen actions; `ADMITTED_VERBS` grows to four; new `APPLY_CAPABLE_VERBS` gates `--apply` | WO-003 scope A/B/C — canonical verb → command-ID mapping and the refusal of a mutation flag on a read-only verb |
| `packages/cli/src/registry.ts` | Read-only probes (`gitBinaryAvailable`, `observeGovernance`, `observeGovernanceFiles`, `observeDocumentation`); `DiagnosisInput`/`validateDiagnosisInput`; `doctorObservations`, `doctorComposition`, `statusComposition`, `diagnosisEnginesFailure`, `diagnosisHandler`; two registrations; `CLI_COMMAND_IDS` and `HELP_INVENTORY` extended to six. **H1–H4 correction:** the shared `readContainedDiagnosticFile` policy replaces every ad-hoc read, `DIAGNOSTIC_FILE_MAX_BYTES` / `DIAGNOSTIC_SOURCE_MAX_FILES` bound it, `validateGovernanceCheckpoint` gates the checkpoint, `recordedBaselineSupported` gates drift, and the symbolic-ref shape gate closes the `.git/HEAD` traversal | WO-003 scope A/B/C — engine binding and read-only composition; then the four blocking audit corrections (§2) |
| `packages/cli/src/index.ts` | Barrel exports for the added probes, types and constants | Mechanical: the added surface must be reachable and the type layer consistent (see 4.2) |
| `packages/cli/src/render.ts` | One line: the "not yet available" note now names only `upgrade` | WO-003 scope C — the deferred-command note must not claim doctor/status are unavailable |
| `packages/cli/src/main.ts` | `commandRequestFor` omits the apply key for read-only verbs | WO-003 scope C — a read-only command request declares no mutation intent at all |
| `packages/cli/src/engines.ts` | Three module sources added (`m41-m47-platform`, `m55-m61-quality`, `m62-m63-final`); ten symbols added to `REQUIRED_SYMBOLS`; interfaces and bindings for each | WO-003 scope A/B — expose the architecture-named symbols that already exist at the base; no engine logic is added |
| `packages/cli/README.md` | Command table, delegation table, doctor/status behaviour section, vendored-engine list, contained-read, checkpoint-validation, Git-metadata, trusted-executable and minimal-environment behaviour | WO-003 evidence/AC-13 — the documented surface must match the implemented surface |
| `tests/v11-wo-003-doctor-status.test.mjs` | new; 16 tests initially, 38 after the H1-H4 correction | WO-003 ladder L1 |
| `tests/v11-wo-003-doctor-status-e2e.test.mjs` | new; 9 tests initially, 12 after the H1-H4 correction | WO-003 ladder L2 |
| `tests/v11-wo-003-dist-smoke.test.mjs` | new; 5 tests initially, 6 after the H1-H4 correction | WO-003 ladder L3 |
| `.engineering/evidence/GBS-V11-WO-003-EVIDENCE.md` | new (this file) | WO-003 evidence bundle |

### 11.2 Context expansions (writes outside the Context Lock surface, each with a concrete dependency reason)

| File | Reason |
|---|---|
| `packages/cli/src/index.ts` | The package barrel re-exports the registry surface. The new probes and types must be exported for library consumers and for the tests; without this the added surface is unreachable and the type layer is inconsistent. Mechanical consequence of the registry change, no new policy. |
| `packages/cli/scripts/prepare-package.mjs` | Packaging parity (brief step 8) is impossible without vendoring the three engine modules the diagnostic commands resolve. `vendor/engines` would otherwise lack `m41-m47-platform`, `m55-m61-quality` and `m62-m63-final`, and the installed CLI would fail closed instead of matching the source workspace. |
| `tests/v11-wo-002-cli.test.mjs` | Mechanical assertion update: the test encoded the four-command inventory and the nineteen-symbol engine surface. Both numbers are now six and twenty-nine. Required by "preserve `init`/`adopt` behavior" — the assertions describe the surface, not the behavior. |
| `tests/v11-wo-002-cli-e2e.test.mjs` | Same mechanical update in the process-level suite (command inventory and deferred-command expectations). |
| `tests/v11-wo-002-dist-smoke.test.mjs` | Same mechanical update in the packed-install suite (installed `--help` inventory). |

No expansion touched `packages/kernel`, the V1.0 accepted history, any workflow, or any
upgrade/migration or WO-005+ surface. The negative-search ledger in §17 records what was deliberately
not changed.

### 11.3 Read scope

Read only the Execution Brief minimum read set plus the directly named engine modules required to
bind the verified symbols (`m48-m54-maintenance`, `area-h-governance`,
`security-reliability-integrations`, `m41-m47-platform`, `m55-m61-quality`, `m62-m63-final`). No
repository-wide rediscovery pass was performed. `detectDrift` and `operatorStatus` were read to
confirm their exact contracts before composing inputs.

### 11.4 A projection defect found and fixed during the initial implementation

`detectDrift` compares two observations and is not told whether a governed baseline exists. The
first working version of `statusComposition` passed the `"NO_RECORDED_STATE"` sentinel on a target
with no `.gef` state, so the engine returned `changed: true, class: "UNEXPECTED"` — an assertion that
a target had drifted when in fact it had never been governed. That is uncertainty converted into a
definite negative claim.

The initial correction stated the baseline explicitly through `driftBaseline`. That was **not
sufficient**: the audit (H3) correctly observed that a manufactured `UNEXPECTED` event still
contradicted the declared `ABSENT` baseline. The corrected behaviour — no comparison at all when no
supported baseline exists, `drift: null`, and `operator.stale.unknown_conservative` — is documented
in §2.3.

```json
"driftBaseline": { "state": "RECORDED" | "ABSENT" | "UNSUPPORTED", "ref": ".gef/init-state.json" | ".gef/adopt-state.json" | null }
```

The baseline is taken from whichever managed artifact exists — `init` **or** `adopt` — because
`status` is verb-agnostic and an adopted target is governed too. Covered by the tests
`the status baseline is taken from whichever governed artifact exists` and the §2.3 H3 cases.

---

## 12. Validation ladder — commands, exit codes, counts

All figures below are at the final-H14 corrected head. The figures recorded at the earlier heads —
`89b2d137…` (16 / 9 / 5 focused, 1374 total), `49ceca34…` (38 / 12 / 6, 1400 total),
`e99751f…` (48 / 14 / 7, 1413 total), `d732978…` (48 / 19 / 8, 1419 total) and `570b235…`
(48 / 19 / 9, 1429 total) and `c1ad014…` (56 / 28 / 11, 1439 total) and `23fe092…` (64 / 28 / 11, 1447 total) — are **historical**; they
are retained as the record of those cycles and are not current-head proof.

| Step | Command | Exit | Result |
|---|---|---|---|
| Build | `npm run build -- --force` | 0 | 28 projects compiled from scratch |
| Typecheck | `npm run typecheck` | 0 | clean |
| L1 focused (incl. H1–H14 final) | `node --test tests/v11-wo-003-doctor-status.test.mjs` | 0 | tests 68 / pass 68 / fail 0 |
| L2 process E2E (incl. H7–H10) | `node --test tests/v11-wo-003-doctor-status-e2e.test.mjs` | 0 | tests 28 / pass 28 / fail 0 |
| L3 packed install | `node --test tests/v11-wo-003-dist-smoke.test.mjs` | 0 | tests 11 / pass 11 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-cli.test.mjs` | 0 | tests 30 / pass 30 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-cli-e2e.test.mjs` | 0 | tests 11 / pass 11 / fail 0 |
| WO-002 regression | `node --test tests/v11-wo-002-dist-smoke.test.mjs` | 0 | tests 7 / pass 7 / fail 0 |
| L4 full | `npm run validate` | 0 | tests 1451 / pass 1451 / fail 0 |
| Dependency audit | `npm audit --audit-level=high` | 0 | found 0 vulnerabilities |

The combined six-suite run reports tests 155 / pass 155 / fail 0 (30 + 11 + 7 + 68 + 28 + 11). No test
was skipped to reduce runtime; every required suite ran in full.

### Observed projections (source workspace, target = repository root)

`gef doctor --target . --json` → exit 0, `commandId: gef.doctor.run`, `terminal: SUCCEEDED`,
`effect: NONE`:

```
findings      toolchain.node HEALTHY · toolchain.platform HEALTHY · toolchain.git HEALTHY · repository.observable HEALTHY
remediation   []
invariants    platform.supported pass · toolchain.nodeMajor pass · toolchain.git pass
security      dependency REVIEW (provenance unverified) · github REVIEW (no provider evidence) · safety READY (classification NONE)
capabilities  COMPATIBLE · unknown []
governance    .engineering/CHECKPOINT.json present+readable+valid · observationLimits []
```

`gef status --target . --json` → exit 0, `commandId: gef.status.show`, `terminal: SUCCEEDED`,
`effect: NONE`:

```
repository    verdict DIRTY (the working tree carries this increment's uncommitted changes) · dirtiness OBSERVED
release       valid true · production.status GBS_V1_PRODUCTION_ACCEPTED · overallCompletionPercent 100
              development.status GBS_V11_WO_003_ADMITTED · releaseLine 1.1.x
operator      state GBS_V1_PRODUCTION_ACCEPTED · progress 100 · stale true
drift         null
driftBaseline { state: "ABSENT", ref: null }
limits        ["drift.baseline.absent","operator.stale.unknown_conservative"]
```

The repository root carries no `.gef` governed artifact, so the baseline is reported as absent and
**no drift comparison is performed at all** — there is no `UNEXPECTED` event, and the conservative
`stale: true` is explained rather than asserted. The `operator.state` shown here is the state
**declared by the validated governance source**, not a claim about the repository; the repository
claim is `repository.verdict`, which is `DIRTY` because this increment's changes are still
uncommitted at smoke time.

Human (TTY) projection for both commands is the unchanged WO-002 renderer contract:
`<commandId>: <terminal>` followed by the same value payload. The renderers were **not** extended:
the existing contract is already deterministic and semantically aligned with the JSON envelope, and
the Execution Brief permits renderer extension only where the current renderers need it.

---

## 13. No-mutation proof

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

## 14. Git-unavailable / capability fail-closed proof (WO-002 F2 closure)

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
- An unreadable `.git/HEAD` symbolic ref → `GIT_HEAD_REF_UNUSABLE` with no HEAD value (see §2.1).

---

## 15. Local packed-install parity proof

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
| Bundled runtime closure | `@gef-bootstrap/contracts`, `@gef-bootstrap/kernel` and `@gef-bootstrap/preflight` (the toolchain authority), each installed with the package, with the lockfile entry reconciled to the manifest |
| Trusted Git in the installed package | the installed CLI resolves the approved executable and never executes a runnable fake `git` placed first on `PATH` |
| Alias containment in the installed package | a junction/symlink `.engineering` is refused with `DIAGNOSTIC_ALIAS_REFUSED` and no external sentinel appears in output |
| Git metadata in the installed package | an aliased `.git` is refused and an oversized `.git/HEAD` is refused without echoing its content |
| Git subprocess side effects in the installed package | the installed probe leaves `.git/index` byte-identical and does not execute a repository fsmonitor hook |

---

## 16. `init` / `adopt` regression proof

The three WO-002 suites run unchanged in behavior at this head: 30 + 11 + 7 = 48 tests, all
passing. The only edits to those files are assertion updates for the grown command inventory and
engine-symbol count; no `init`/`adopt` behavioral assertion was weakened, removed or relaxed, and no
transaction, traversal, recovery, private-containment, journal-ownership or authorization contract
was modified. `packages/kernel` is untouched by this increment (see §17).

---

## 17. Negative-search ledger — deliberate non-changes

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
| Rest of `observeRepositoryDirtiness` | Unchanged: argv-only invocation, the 10 s timeout and the 8 MiB output bound are preserved; only the safety overrides and the `GIT_OPTIONAL_LOCKS` binding were added. |
| Git `gitdir:` worktree indirection | Not followed: resolving it would read metadata outside the approved root. Reported as `GIT_DIRECTORY_NOT_A_DIRECTORY` / `UNKNOWN` (see finding L5). |
| Git executable on `PATH` | Never consulted for resolution. The admitted locations and their physical roots are frozen constants; a `PATH_NAME` descriptor is refused outright. |
| Ambient environment | Never forwarded wholesale. The Git probe environment is an explicit nine-key allowlist; on this host the probes also succeed with an empty environment, which is recorded rather than claimed as a requirement. |
| Trust admission | Never lexical-only: a candidate whose physical target escapes the approved roots is refused even when its path string is admitted. |
| Write authority | The machine policy admits an executable only when this process provably cannot write it and cannot replace any directory entry on the path to it, up to the filesystem root. |
| User-managed tool locations | Never silently equivalent to a machine-trusted default: they require the separately named user-managed policy, which only deliberate injection can select. |
| Executable identity | Revalidated under the same policy immediately before every launch; a change between resolution and execution refuses rather than spawns. |
| `observeCanonicalSources` output shape | Routed through the shared contained-read policy, but its projection is unchanged, so the WO-002 `init`/`adopt` plan contract and digests are preserved for normal targets. |
| `init`/`adopt` plan `drift` field | Left as the WO-002-approved contract (see §2.3). Only the diagnostic projection was corrected. |
| Repository-wide search | Not performed; the read set was the Execution Brief minimum set plus the directly named engine modules. |

---

## 18. No-publication and production-boundary statement

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

## 19. Findings by severity

### Retraction

The claim `CRITICAL: 0 / HIGH: 0` recorded for head `38e19dd1d05121e1bb4b2dbbcd393286eaea361a` is
**retracted**. Objective reaudit review `5240757786` found **CRITICAL 0 / HIGH 1** at that head. That
finding is corrected in §9, and the product-level consequence it creates is escalated as BLOCKED.

Both earlier retractions also stand: `CRITICAL: 0 / HIGH: 0` for head `49ceca34…` was retracted after
review `5237002898` found CRITICAL 0 / HIGH 2, and for head `89b2d137…` after review `5236410386`
found CRITICAL 0 / HIGH 4. None is reinstated.

Six successive objective reviews have each found blocking HIGH findings that the executor's own
severity claim missed, and every one was in the same S0 trust boundary. The pattern is recorded here
rather than hidden: an executor severity claim about its own change is not evidence about that
change. The H9/H10 cycle added a second lesson — the *first* version of those very tests proved
nothing and passed against the vulnerable code until the fixtures were made live and discriminating
(§5.4, and again in §6.4).

### CRITICAL — 0

### HIGH — 0 at this head

| ID | Finding | Status |
|---|---|---|
| H1 | Target escape through symlink/junction aliases in the S0 diagnostic readers | **Corrected** in the H1–H4 cycle, preserved and re-verified at this head (§2.1) |
| H2 | Diagnostic reads were not resource bounded | **Corrected** in the H1–H4 cycle, preserved and re-verified at this head (§2.2) |
| H3 | Absent baseline still emitted false `UNEXPECTED` drift | **Corrected** in the H1–H4 cycle, preserved and re-verified at this head (§2.3) |
| H4 | Parseable but invalid checkpoint promoted into status semantics | **Corrected** in the H1–H4 cycle, preserved and re-verified at this head (§2.4) |
| H5 | Git metadata reads bypassed the contained-read policy | **Corrected** in the H5–H6 cycle, preserved and re-verified at this head (§3.1) |
| H6 | Git metadata reads were unbounded | **Corrected** in the H5–H6 cycle, preserved and re-verified at this head (§3.2) |
| H7 | The dirtiness probe could write the repository index | **Corrected** — `--no-optional-locks` plus a `GIT_OPTIONAL_LOCKS=0` binding; index proven byte-identical and the fixture proven refreshable (§4.1) |
| H8 | The dirtiness probe could execute a repository-configured FSMonitor hook or start its daemon | **Corrected** — `-c core.fsmonitor=false` in the same argv invocation, process-local, with a live hook fixture proving the danger and GEF's refusal (§4.2) |
| H9 | The Git probe inherited the caller's whole environment, so ambient Git-control variables could redirect repository and index | **Corrected** — one explicit allowlisted child environment shared by both probes; forbidden keys absent by construction; A/B redirect fixture with a discriminating dirtiness observable (§5.1) |
| H10 | The Git executable was chosen by ambient `PATH` | **Corrected** in the H9–H10 cycle, preserved and re-verified at this head (§5.2) |
| H11 | Trust admission was lexical, so an admitted path could alias an executable outside the trust surface | **Corrected** — admission applies to the physical target, which must be inside an approved physical root and, where the platform exposes it, not group/other writable; alias behaviour explicit; live alias fixture with an external payload (§6.1) |
| H12 | Executable identity was not bound to the process actually spawned, and the snapshot was a module global | **Corrected** in the H11–H12 cycle, preserved and re-verified at this head (§6.2) |
| H13 | Invocation authority was process-global mutable state, so overlapping invocations could observe each other | **Corrected** — the authority is bound to the asynchronous execution context with AsyncLocalStorage; nested and concurrent invocations are isolated independently of completion order, and nothing survives an invocation (§7.1) |
| H14 | Physical admission did not prove the executable was non-replaceable by the caller | **Corrected** in the H13–H14 cycle, and completed in the final H14 cycle: the proof is now a chain to the filesystem root, proven on Windows through the ACL-enforced write-open on each directory and on POSIX through the effective-write bit, so  can no longer coexist with an unproven chain (§8) |

The HIGH count is stated as 0 **at this head only**, on the strength of the re-run ladder in §12 and
the tests in §2/§3/§4. It is not a claim that no further finding exists; that determination belongs
to the objective reaudit.

### MEDIUM — 2 (carried, not introduced)

| ID | Finding | Owner | Disposition |
|---|---|---|---|
| C4 | Constitutional version binding | Project Owner | Not expanded into WO-003, per the Work Order's known-findings section. |
| M-H4 | `SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS` is a CLI-local allowlist (`[2]`) over the governance checkpoint's `schemaVersion`. It validates only the fields this command consumes. If the governance checkpoint version advances, the CLI must be updated in the same increment or `status` will fail closed. | WO-003 owner / next governance-checkpoint change | Deliberate: the correction explicitly forbids inventing a product-wide checkpoint schema. Fail-closed on an unknown version is the safe direction. |
| M3 | Workspace lockfile was stale after the preflight runtime dependency was added | WO-003 (this cycle) | **Resolved** in §6.5: lockfile regenerated with the canonical npm workflow, diff limited to the expected lines, and two drift guards added. |

### LOW — 5

| ID | Finding | Owner | Disposition |
|---|---|---|---|
| L1 | The human (TTY) projection for `doctor` and `status` is the unchanged WO-002 renderer contract — a terminal line followed by the value payload. It is deterministic and semantically aligned with the JSON envelope, but it is not a hand-formatted diagnostic report. | WO-004 or later operator-surface increment | Deliberate: extending the renderer was permitted but not required, and the brief scopes renderer changes to "only where current renderers need extension". |
| L2 | The drift engine itself compares two observations without being told whether a governed baseline exists. The CLI now avoids the comparison entirely when no supported baseline exists, but the engine could accept an explicit baseline-presence input. | M37 drift engine (`security-reliability-integrations`) | Recorded, not changed. Extending an accepted domain engine is out of scope for WO-003 (architecture rule 5). |
| L3 | `dependencySecurity` reports `REVIEW` because the CLI passes `provenance: "unverified"`. A verified provenance path would require a real audit invocation, which is a mutation-free but heavier capability not granted by this Work Order. | WO-004 or later | Deliberate: `REVIEW` is the honest answer while no independent verification exists. Reporting `PASS` would be a fabricated healthy default. |
| L4 | A real **file** symlink cannot be created on this Windows host without elevation, so the file-symlink alias cases are proven locally with an unprivileged directory junction (verified to be reported as a symbolic link by `lstat`, and to be refused when pointed at an external file path) and the gap is reported by the test runner; the genuine file-symlink paths are covered in CI on Linux and macOS. | CI / platform evidence | Recorded as an explicit evidence gap, not inferred as covered (§3.5). |
| L5 | Git worktrees and submodules use a `.git` **file** containing a `gitdir:` pointer. That form is deliberately not followed, so such a target reports `GIT_DIRECTORY_NOT_A_DIRECTORY` with `UNKNOWN` repository state rather than a resolved identity. | WO-004 or later, if worktree support is wanted | Deliberate: following the pointer would read metadata outside the approved root, which is exactly what the containment rule forbids. `UNKNOWN` is the fail-closed answer, and `git status` still governs mutation preconditions. |

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
| Checkpoint schema-version allowlist maintenance (M-H4) | WO-003 owner / next governance-checkpoint change |

---

## 20. Executor statement

All work in this bundle is executor evidence. It is **not** self-approval and it does not claim
`APPROVED`. The objective reviewer must return exactly one terminal disposition — `APPROVED`,
`CORRECTION_REQUIRED` or `BLOCKED` — bound to the exact implementation head.

This revision corrects objective reaudit review `5240757786` (Windows replacement rights) and stops as
BLOCKED on the product-level consequence of failing closed there. It does not merge, tag,
publish, force-push, rewrite history, touch `main`, move `v1.0.0`, or self-approve.

STOP CONDITION: BLOCKED — Windows replacement rights (DELETE / FILE_DELETE_CHILD) cannot be proven
in the supported runtime without a frozen architecture decision; the default machine policy fails
closed there and the resulting Windows capability loss needs an owner decision.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED

The head carrying this revision is `b324ad8d067bf0451a83051ba7f59624a918cda1` (code change at
`2a7010368481b4fa720e34ec1097dd49f2e00754`); its exact-head assurance is 23 workflow runs / 89 check
runs, all `success`.

MERGE NOT PERFORMED; OBJECTIVE REAUDIT REQUIRED