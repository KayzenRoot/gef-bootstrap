# Installation · GEF Bootstrap V1.0.0

## Distribution model
V1.0.0 is distributed as a source workspace. It is not yet a published npm package or standalone global CLI.

## Prerequisites
- Git
- Node.js 22 recommended
- npm
- Windows, Linux or macOS

## Stable release install
```bash
git clone https://github.com/KayzenRoot/gef-bootstrap.git
cd gef-bootstrap
git checkout v1.0.0
npm ci
npm run validate
```

## Current maintenance source
```bash
git clone https://github.com/KayzenRoot/gef-bootstrap.git
cd gef-bootstrap
npm ci
npm run validate
```

## Windows PowerShell
```powershell
git clone https://github.com/KayzenRoot/gef-bootstrap.git
Set-Location gef-bootstrap
git checkout v1.0.0
npm ci
npm run validate
```

## Verification
A valid local checkout should complete `npm run validate`. For security/dependency verification also run:
```bash
npm audit --audit-level=high
```

## Source archive
The GitHub Release for `v1.0.0` provides generated source ZIP/TAR archives. After extraction run `npm ci` and `npm run validate` from the repository root.

## Important boundary
Do not advertise or rely on `npm install -g gef-bootstrap` for V1.0.0. The workspace and `@gef-bootstrap/cli` package remain private workspace packages and the CLI surface is a library-facing implementation, not a published executable.

## Published V1.1.0 and current V1.1.1 patch

V1.1.0 is the production-accepted release. V1.1.1 is the admitted hotfix candidate until its own exact-head checks, owner audit and release gates complete. To use the published V1.1.0 package:

```bash
npm install --global @gef-bootstrap/cli@1.1.0
gef --help
gef --version
```

The version-specific 1.1.1 package is not available until published. Do not infer availability from a source branch or GitHub tag alone. `docs/V1.1-OPERATIONS-RUNBOOK.md` describes project-state compatibility, explicit apply boundaries and recovery handling.

## V1.1 operations and fresh-chat continuity

V1.1.0 is production accepted; the 1.1.1 maintenance patch is governed by WO-011. For project-construction, upgrade and recovery procedures, see [V1.1 Operations Runbook](V1.1-OPERATIONS-RUNBOOK.md). Start every new chat from the canonical checkpoint, active Work Order, Context Lock and verified provider head; use M18/M20 to state exactly one next action or an explicit `NONE/UNKNOWN` stop state.
