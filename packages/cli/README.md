# @gef-bootstrap/cli

Thin operator CLI surface for GEF Bootstrap V1.1.

This package is **transport and rendering only**. Command parsing, result rendering and the
process boundary live here; all domain behaviour is delegated to existing V1 engines through
the kernel `CommandRegistry`/`KernelRuntime`, and no business policy is implemented in CLI
handlers.

## Admitted commands (WO-002 + WO-003 increments)

| Command | Canonical command ID | Effect |
| --- | --- | --- |
| `gef --help` | — | usage projected from the verified `helpIndex` engine |
| `gef --version` | — | canonical product version |
| `gef init` | `gef.init.plan` | read-only initialization plan |
| `gef init --apply` | `gef.init.run` | governed initialization run |
| `gef adopt` | `gef.adopt.preview` | read-only adoption preview |
| `gef adopt --apply` | `gef.adopt.apply` | governed adoption run |
| `gef doctor` | `gef.doctor.run` | read-only environment/repository/integrity diagnostics |
| `gef status` | `gef.status.show` | read-only governed project/repository status |

`upgrade` is **not** implemented; it arrives with its owning Work Order (WO-004) and is refused
as a usage error rather than partially working.

`doctor` and `status` are read-only and admit no mutation flag: `--apply` is refused on exit 10
before the command is resolved, and their command input carries no apply key at all.

## Delegation

The CLI composes these verified V1 engines and adds no replacement semantics:

| Command | Engines |
| --- | --- |
| `init` | `installPlan`, `repositoryState`, `githubBootstrap`, `detectDrift`, `resolveCanonical` |
| `adopt` | `detectDrift`, `resolveCanonical`, `backupManifest`, `recoveryPlan`, `installPlan` |
| both apply paths | the kernel transaction engine |
| `doctor` | `doctor`, `repairSuggestion`, `invariantResult`, `dependencySecurity`, `githubSecurity`, `integritySnapshot`, `capabilityEnvelope`, `safetyDecision` |
| `status` | `operatorStatus`, `repositoryState`, `documentationManifest`, `navigationPlan` |

Each diagnostic command is registered with an explicit composite engine owner, so registry
introspection proves the delegation instead of leaving it implicit.

## Behaviour

- Default `init`/`adopt` paths are read-only. Mutation requires an explicit `--apply`.
- **Output selection:** a JSON envelope is emitted when `--json` is present **or** when stdout
  is not a TTY. The TTY capability is injected into the runner, never sniffed during parsing.
- Exit codes are projected only through the kernel `projectExitCode` mapping.
- The CLI never reads stdin, so a non-TTY invocation cannot hang on an implicit prompt.
- **Managed mutation runs through the kernel transaction engine**, never through a direct file
  write. Each apply compiles a transaction plan and applies it with the filesystem effect
  adapter, which runs the full safety chain: path authorization, traversal proof, overwrite
  evaluation, physical-safety composition, recovery capture, staging, staged verification,
  commit barrier, promotion and post-state verification. Traversal, no-clobber, hard-link
  alias, symlink and stale-target races are all refused, and a transaction journal is recorded
  as recovery evidence.
- **Authorization is a real decision, re-evaluated at the commit barrier.** The transaction
  authorization port is bound to the admitted policy requirement, the run, the command and the
  target, and asks the verified safety engine on every call — an authorization that lapses
  between staging and commit is refused with no target-visible effect, and an unprovable
  decision is a denial.
- **Every mutation is bound to a command and a purpose.** One deterministic authorization binding
  exists per admitted command and mutation purpose, fixing the policy, the module owner, the
  declared plan surface and the safety classification. `init` cannot authorize an adopt policy or
  vice versa, an unknown command has no binding, and receipt persistence has its own admitted
  purpose rather than borrowing a state-command identity. The binding is re-derived from what the
  plan actually declares, at the initial gate and again at the commit barrier.
- **Repository state must be observed, never assumed.** Working-tree dirtiness is read
  deterministically from the target repository (`git status --porcelain` over an argv array, no
  shell string, bounded by a timeout). If the working tree cannot be observed, no verdict is
  claimed and `--apply` is blocked before any effect; a non-repository directory is reported as
  known-absent rather than unknown.
- **Nothing project-visible is created before authorization.** Case semantics is measured
  read-only, by comparing the identity of an existing path with its case-flipped sibling, so an
  initial authorization denial leaves an exact zero filesystem delta.
- **Capability probes never touch project content.** The durability probe runs in an
  invocation-owned directory under the reserved GEF private area, created exclusively with a
  collision-resistant name, and removes only what that invocation created and still owns.
- **The private area is containment- and alias-proven.** Every private path (probes, staging,
  journal) is proven lexically contained under the target root, every existing ancestor is proven
  not to be a symlink/reparse point, and the deepest existing ancestor is proven physically
  contained once resolved. A user-controlled alias therefore cannot redirect a private effect
  outside the target.
- **Ownership is recorded at creation and revalidated before anything is removed or overwritten.**
  A directory or file carries the identity (`dev:ino`) it had when this invocation created it. A
  pre-existing directory or file is never claimed, removed or overwritten, even when empty;
  cleanup removes only invocation-owned entries, revalidating the directory identity, each staged
  file's identity *and* content fingerprint, and each created ancestor's identity; identity
  mismatch or a content change leaves the entry untouched and is reported as refusal evidence. The
  journal is claimed with exclusive creation, and every lifecycle write goes through an
  identity-verified handle, so a journal path replaced by another file or by a symlink/reparse
  point is refused rather than overwritten.
- **A concurrently-created directory is never claimed.** Ownership is conferred only by this
  invocation's own successful `mkdir`. If another actor creates the path first, the `EEXIST` is
  treated as a pre-existing entry: no ownership marker is written into someone else's directory,
  nothing is registered as owned, and cleanup never removes it.
- **The apply and rollback journal lifecycles are distinct.** `begin`/`update`/`finish` and
  `beginRollback`/`updateRollback`/`finishRollback` both write the transaction's single owned
  journal file. The claim record is kept after a lifecycle closes its descriptor and reopened —
  with identity and content verification — when the next lifecycle needs it, so a rollback never
  double-claims an existing owned file and recovery is never escalated over a journaling artefact.
- Persisted documents (`.gef/<verb>-state.json` and `.gef/receipts/<runId>.json`) are bound to
  JSON Schema 2020-12 contracts shipped in `schemas/`; an unsupported schema major version
  fails closed on read.

### Doctor and status

Both commands are pure projections: they read a bounded set of already-governed observations,
hand them to the verified engines, and render the engine's answer. No domain algorithm is
reimplemented in the CLI, and neither command writes anything.

- **Zero effect.** They create no `.gef`, no `.gef-private`, no receipt, no staging, no journal,
  no Git branch/tag/config change and no provider call. They use bounded reads only, so the
  private transaction area is never entered.
- **Unknown is never upgraded to healthy.** Observations the CLI cannot make are simply not
  passed to the engine, and the engine's own fail-closed answer stands. Dependency security is
  reported as `REVIEW` rather than `PASS` while provenance is unverified; GitHub capability with
  no provider evidence is `REVIEW`; a missing capability envelope is `DEGRADED`.
- **Every diagnostic read is contained and bounded (S0 read policy).** One shared helper performs
  all read-only file reads: it binds the approved target root, rejects lexical escape, inspects
  every path component with a non-following `lstat`, refuses symlink/junction/reparse ancestors
  and link-like final targets, proves physical containment through `realpath`, requires a regular
  file, and verifies that the opened file is the exact object the walk inspected. Reads are
  capped at `DIAGNOSTIC_FILE_MAX_BYTES` per file and `DIAGNOSTIC_SOURCE_MAX_FILES` sources per
  command, and the size gate runs *before* any read — oversized content is never read and never
  truncated into apparently valid evidence. An alias is never followed merely because its
  destination is reachable. Each refusal produces a deterministic observation-limit code in the
  output: `DIAGNOSTIC_ALIAS_REFUSED:`, `DIAGNOSTIC_PATH_ESCAPE:`, `DIAGNOSTIC_NOT_REGULAR:`,
  `DIAGNOSTIC_FILE_OVER_BUDGET:`, `DIAGNOSTIC_PATH_UNREADABLE:`. Absence is a successful
  observation and is reported as absence, not as a limit.
- **Git metadata is read through the same policy, under its own budget.** `.git`, `.git/HEAD` and
  any symbolic-ref target are bound to the approved project root and read through the shared
  containment primitive with the tighter `GIT_METADATA_MAX_BYTES` budget, because they are read
  before any subprocess bound applies. A `.git` that is a symlink or junction is refused
  (`GIT_DIRECTORY_ALIAS_REFUSED`); a `.git` that is a file or any other indirection form yields
  `GIT_DIRECTORY_NOT_A_DIRECTORY`, never a clean repository; a symbolic ref whose text is not a
  well-formed `refs/...` name is `GIT_HEAD_REF_UNUSABLE`; a `HEAD` whose content is not a ref name
  or a Git object id is `GIT_HEAD_UNUSABLE`. Operation sentinels are probed with the same
  non-following primitive. Every one of those states reports `UNKNOWN` and a `null` repository
  verdict rather than inventing a clean tree. The argv-based `git status` and `git --version`
  probes keep their existing timeout and output bounds.
- **Checkpoint content is validated before it carries any meaning.** `.engineering/CHECKPOINT.json`
  is untrusted input, so presence, readability and validated authority are three separate fields.
  A document is accepted only when it is a non-array object, declares a supported `schemaVersion`,
  types every projected production field correctly, keeps `overallCompletionPercent` inside
  0..100, and carries an object-or-null V1.1 overlay. Anything else is reported as
  `present: true, valid: false` with `production`/`development` `null` and a deterministic code,
  and `operatorStatus` never consumes it.
- **Remediation is guidance.** Every `repairSuggestion` keeps its verified posture
  (`automatic: false`, `previewRequired: true`); there is no `--fix` and no destructive repair.
- **Git unavailable fails closed (WO-002 F2).** A missing or unusable `git` binary is surfaced by
  `gef doctor` as an actionable `FINDING` on `toolchain.git` with a non-automatic remediation and
  a failed invariant, and by `gef status` as `dirtiness: "UNKNOWN"` with a `null` verdict and an
  operator state that is never `CLEAN`. Git absence can never be reported as clean or ready.
- **Production and development state stay distinguishable.** `gef status` reports the declared
  production truth and the V1.1 development overlay as separate fields; it never merges them or
  invents completion.
- **The drift baseline is stated, not implied.** Drift is a comparison, so it is computed only
  when a supported recorded baseline actually exists, and the projection states that baseline
  explicitly via `driftBaseline`, taken from whichever managed artifact exists
  (`.gef/init-state.json` or `.gef/adopt-state.json`). A target with no governed state reports
  `{state: "ABSENT", ref: null}` and `drift: null` with `drift.baseline.absent` in
  `observationLimits`; a recorded document that cannot be interpreted reports
  `{state: "UNSUPPORTED"}` with `drift.baseline.unsupported`. Because `operatorStatus` cannot
  express unknown staleness, the conservative `stale: true` is kept and explained by
  `operator.stale.unknown_conservative` — an ungoverned target is never read as a target that
  drifted, and no `UNEXPECTED` drift event is manufactured.
- **No fabricated progress.** Operator progress is the declared percentage or `null`; an absent
  repository is reported as unobservable rather than assumed present.

## Distribution

The package is distributed as part of the GEF source workspace, and is also locally
installable:

```bash
node scripts/prepare-package.mjs --pack --destination <dir>
npm install <dir>/gef-bootstrap-cli-<version>.tgz
```

The tarball is self-contained: the verified engine modules are vendored under `vendor/engines`
and the runtime packages the CLI depends on are bundled, so an install needs no registry and no
surrounding source checkout. The package directory is never used as a scratch area — the
distribution is assembled in a staging directory. `vendor/MANIFEST.json` records the sha256 of
every vendored artefact.

Six engine modules are vendored: `m48-m54-maintenance`, `area-h-governance`,
`security-reliability-integrations`, `m41-m47-platform`, `m55-m61-quality` and `m62-m63-final`.
The last three were added by the WO-003 increment so the installed package can serve `doctor`
and `status` from the packaged payload alone.

**No publication to npm, GitHub Releases or any registry is performed or claimed by this
increment.** `private: true` and the absence of `publishConfig` make an accidental publication
mechanically impossible.

## License

All rights reserved. See the repository `LICENSE` for the current rights notice. No
open-source license is granted merely by the package being installable.
