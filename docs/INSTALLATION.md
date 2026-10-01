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

## Current stable V1.1.1 package

V1.1.1 is the current production-accepted V1.1 release. Install the published package:

```bash
npm install --global @gef-bootstrap/cli@1.1.1
gef --help
gef --version
```

Release identity:
- immutable tag: `v1.1.1`;
- release source: `1dc030f1358eab0347043a3d54c7fc311c7c2123`;
- release tarball SHA-256: `59cfbe2699c884f9c57bb50594fe3972c5f8667c44bff4f35a5e9a65e4ce53c3`;
- npm SRI: `sha512-YuLrx35lCo4aSBV6DI/EmaKPhkZJxjyUyDTQEhjvM8SdktV5x2rWJjeIY0T69A/PlILqOsL5E2zrz3BLRMPGVg==`;
- post-publish registry smoke: `SUCCESS`.

V1.1.0 remains an immutable historical release but is no longer the current stable V1.1 package.
## V1.1 operations and fresh-chat continuity

V1.1.1 is production accepted and registry-smoke verified; WO-011 now continues only with its authorized consumer rollout. For project-construction, upgrade and recovery procedures, see [V1.1 Operations Runbook](V1.1-OPERATIONS-RUNBOOK.md). Start every new chat from the canonical checkpoint, active Work Order, Context Lock and verified provider head; use M18/M20 to state exactly one next action or an explicit `NONE/UNKNOWN` stop state.
