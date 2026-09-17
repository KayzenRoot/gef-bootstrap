# @gef-bootstrap/cli

Thin operator CLI surface for GEF Bootstrap V1.1.

This package is **transport and rendering only**. Command parsing, result rendering and the
process boundary live here; all domain behaviour is delegated to existing V1 engines through
the kernel `CommandRegistry`/`KernelRuntime`, and no business policy is implemented in CLI
handlers.

## Admitted commands (WO-002 increment)

| Command | Canonical command ID | Effect |
| --- | --- | --- |
| `gef --help` | — | deterministic usage, no network |
| `gef --version` | — | canonical product version |
| `gef init` | `gef.init.plan` | read-only initialization plan |
| `gef init --apply` | `gef.init.run` | governed initialization run |
| `gef adopt` | `gef.adopt.preview` | read-only adoption preview |
| `gef adopt --apply` | `gef.adopt.apply` | governed adoption run |

`doctor`, `status` and `upgrade` are **not** implemented in this increment; they arrive with
their owning Work Orders (WO-003, WO-004).

## Behavior

- Default `init`/`adopt` paths are read-only. Mutation requires an explicit `--apply`.
- Exit codes are projected only through the kernel `projectExitCode` mapping.
- `--json` emits a stable machine envelope; human output is never required for automation.
- The CLI never reads stdin, so a non-TTY invocation cannot hang on an implicit prompt.
- Apply paths run as kernel mutation commands: policy, target binding, execution,
  verification and receipt are all enforced by the runtime.
- Governed artifacts are created **exclusively**; existing content is never overwritten.

## Distribution

Distributed as part of the GEF source workspace. A local `npm pack` path exists for smoke
testing. **No publication to npm, GitHub Releases or any registry is performed or claimed by
this increment.**

## License

All rights reserved. See the repository `LICENSE` for the current rights notice. No
open-source license is granted merely by the package being installable.
