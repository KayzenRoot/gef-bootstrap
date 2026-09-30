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

## V1.1.0 production-acceptance candidate

V1.1.0 is still a candidate, not a stable production release. For the admitted package proof, create and install the real local tarball from a clean checkout; this does not publish to a registry:

```bash
npm ci --ignore-scripts
npm run build
mkdir -p /tmp/gef-package /tmp/gef-consumer
node packages/cli/scripts/prepare-package.mjs --pack --destination /tmp/gef-package
(cd /tmp/gef-consumer && npm init -y && npm install --offline --no-audit --no-fund /tmp/gef-package/gef-bootstrap-cli-1.1.0.tgz)
node /tmp/gef-consumer/node_modules/@gef-bootstrap/cli/bin/gef.mjs --help
node /tmp/gef-consumer/node_modules/@gef-bootstrap/cli/bin/gef.mjs --version
```

Use an isolated temporary directory appropriate to the operating system. Do not run `npm publish` or `npm stage publish`; npm namespace ownership and trusted-publisher configuration have not yet been verified. `docs/V1.1-OPERATIONS-RUNBOOK.md` describes the candidate's read-only checks, explicit apply boundary and recovery handling.

## V1.1 operations and fresh-chat continuity

V1.1 remains in development/release-candidate validation until WO-010. For the full project-construction, upgrade and recovery procedure, see [V1.1 Operations Runbook](V1.1-OPERATIONS-RUNBOOK.md). Start every new chat from the canonical checkpoint, active Work Order, Context Lock and verified provider head; use M18/M20 to state exactly one next action or an explicit `NONE/UNKNOWN` stop state.
