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
