# Installation · Stable v1.1.2 and historical V1.0.0

## Distribution model
The current stable CLI is published as `@gef-bootstrap/cli@1.1.2`. V1.0.0 remains a historical source-workspace release. Parallel-module planning belongs to the **v1.1.3 candidate**, not to the current stable package.

## Prerequisites
- Git
- Node.js 22 recommended
- npm
- Windows, Linux or macOS

## Historical V1.0.0 source checkout
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

## Historical V1.0.0 Windows PowerShell checkout
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
Do not use the unrelated name `gef-bootstrap` for global npm installation. Install the published scoped CLI package as shown below; the root source workspace remains private.

## Published V1.1 releases

`@gef-bootstrap/cli@1.1.2` is the current production-accepted V1.1 package. Its immutable `v1.1.2` tag points to `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`; the npm registry integrity, ECDSA signature and SLSA provenance were verified. V1.1.0 remains the earlier production-accepted release. V1.1.1's publication succeeded, while its initial post-publish verification recorded an artifact-download incident; its package and tag were preserved during recovery.

Install the current stable package at the exact version:

```bash
npm install --global @gef-bootstrap/cli@1.1.2
gef --help
gef --version
```

The consumer-safe adoption preflight and v1.1.1 post-publish recovery corrections are included. `docs/V1.1-OPERATIONS-RUNBOOK.md` describes project-state compatibility, explicit apply boundaries and recovery handling.

## V1.1 operations and fresh-chat continuity

V1.1.2 is the current production-accepted release; V1.1.0 acceptance and the V1.1.1 post-publish verification incident remain historical evidence. For project-construction, upgrade and recovery procedures, see [V1.1 Operations Runbook](V1.1-OPERATIONS-RUNBOOK.md). Start every new chat from the canonical checkpoint, active Work Order, Context Lock and verified provider head; use M18/M20 to state exactly one next action or an explicit `NONE/UNKNOWN` stop state.

## Candidate parallel module planner

The `gef parallel plan|issues|prompt` commands are proposed for v1.1.3 and **are not available** in the stable v1.1.2 package. After audit, release and package installation validation, follow [parallel modules guide](PARALLEL-MODULES.md). Do not present branch code or a candidate tarball as a published stable release.
