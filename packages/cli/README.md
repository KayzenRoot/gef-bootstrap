# @gef-bootstrap/cli

Thin operator CLI surface for GEF Bootstrap V1.1.

This package is **transport and rendering only**. Command parsing, result rendering and the
process boundary live here; all domain behaviour is delegated to existing V1 engines through
the kernel `CommandRegistry`/`KernelRuntime`, and no business policy is implemented in CLI
handlers.

## Admitted commands (WO-002 increment)

| Command | Canonical command ID | Effect |
| --- | --- | --- |
| `gef --help` | — | usage projected from the verified `helpIndex` engine |
| `gef --version` | — | canonical product version |
| `gef init` | `gef.init.plan` | read-only initialization plan |
| `gef init --apply` | `gef.init.run` | governed initialization run |
| `gef adopt` | `gef.adopt.preview` | read-only adoption preview |
| `gef adopt --apply` | `gef.adopt.apply` | governed adoption run |

`doctor`, `status` and `upgrade` are **not** implemented in this increment; they arrive with
their owning Work Orders (WO-003, WO-004), and are refused as usage errors rather than
partially working.

## Delegation

The CLI composes these verified V1 engines and adds no replacement semantics:

| Command | Engines |
| --- | --- |
| `init` | `installPlan`, `repositoryState`, `githubBootstrap`, `detectDrift`, `resolveCanonical` |
| `adopt` | `detectDrift`, `resolveCanonical`, `backupManifest`, `recoveryPlan`, `installPlan` |
| both apply paths | the kernel transaction engine |

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
- Persisted documents (`.gef/<verb>-state.json` and `.gef/receipts/<runId>.json`) are bound to
  JSON Schema 2020-12 contracts shipped in `schemas/`; an unsupported schema major version
  fails closed on read.

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

**No publication to npm, GitHub Releases or any registry is performed or claimed by this
increment.** `private: true` and the absence of `publishConfig` make an accidental publication
mechanically impossible.

## License

All rights reserved. See the repository `LICENSE` for the current rights notice. No
open-source license is granted merely by the package being installable.
