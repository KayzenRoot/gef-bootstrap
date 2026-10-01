# GEF V1.1.1 Hotfix and Rollout Report

**Work Order:** GBS-V11-WO-011  
**Issue:** #357  
**Release:** v1.1.1 / @gef-bootstrap/cli@1.1.1  
**Status:** RELEASE_GATE_COMPLETE — CONSUMER_ROLLOUT_AUTHORIZED  
**Date:** 2026-10-01

## Executive result

The GEF Bootstrap V1.1.1 release/registry gate is complete.

The immutable V1.1.1 package is published, its exact release artifact is bound to the original release source and receipt, registry integrity and signature evidence are verified, provenance metadata is present, registry installation succeeds with lifecycle scripts disabled, and the CLI/library/doctor/status smoke passes.

The remaining WO-011 stage is consumer rollout. The first authorized consumer is `KayzenRoot/goodz-menu`.

No Goodz Menu installation success is claimed by this report.

## Release identity

- Release source: `1dc030f1358eab0347043a3d54c7fc311c7c2123`
- Immutable tag: `v1.1.1`
- GitHub Release: https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.1
- npm package: `@gef-bootstrap/cli@1.1.1`
- Original release workflow run: `36904947907`
- Exact release tarball SHA-256: `59cfbe2699c884f9c57bb50594fe3972c5f8667c44bff4f35a5e9a65e4ce53c3`
- npm SHA-512 SRI: `sha512-YuLrx35lCo4aSBV6DI/EmaKPhkZJxjyUyDTQEhjvM8SdktV5x2rWJjeIY0T69A/PlILqOsL5E2zrz3BLRMPGVg==`

## Original release run disposition

Run `36904947907` proved:

- exact release source/tag binding: PASS;
- package build and validation: PASS;
- same exact tarball smoke on Ubuntu: PASS;
- same exact tarball smoke on Windows: PASS;
- same exact tarball smoke on macOS: PASS;
- npm OIDC publication: PASS.

The original post-publish verification job failed before registry smoke because `gh run download` executed outside a repository checkout without an explicit `--repo`. This was a workflow transport defect, not a package/runtime/publication defect.

## Correction Delta

Correction PR: #359  
Audited head: `c68114f0f8692551fc871bddd1e2fc6964374017`  
Audit: APPROVED / NOT_INDEPENDENT  
CRITICAL: 0  
HIGH: 0  
Merge: `5a32a607ccf2055fab722f3d5d452791c6aae3e6`

The correction:

1. bound artifact download to `$GITHUB_REPOSITORY`;
2. added a read-only recovery flow tied to the original immutable release run/artifact;
3. verified the published package's npm registry ECDSA signature directly against active npm signing keys;
4. preserved provenance verification and exact SRI comparison;
5. added regression tests for the transport/signature verification path.

A temporary PR-only CodeQL HIGH in a regression assertion was corrected before merge. Final correction head CodeQL was green.

## Registry recovery proof

Recovery run: `36912440350` — SUCCESS.

The recovery verified:

- original release receipt: PASS;
- release source/version/tag: PASS;
- original tarball SHA-256: PASS;
- npm package version and repository identity: PASS;
- exact registry SHA-512 SRI equals the tested tarball: PASS;
- npm registry ECDSA signature: PASS;
- npm provenance/attestation metadata: PRESENT;
- registry installation with lifecycle scripts disabled: PASS;
- CLI `--help`: PASS;
- CLI `--version`: PASS;
- package/library import: PASS;
- `gef doctor`: PASS;
- repeated `gef status`: PASS and deterministic.

## Exact-head assurance

Release assurance run: `36912440441` — SUCCESS.

At the exact correction head:

- Ubuntu release assurance: SUCCESS;
- Windows release assurance: SUCCESS;
- macOS release assurance: SUCCESS;
- same exact tarball Ubuntu: SUCCESS;
- same exact tarball Windows: SUCCESS;
- same exact tarball macOS: SUCCESS;
- Repository validation: SUCCESS;
- Pipeline integrity: SUCCESS;
- Gitleaks: SUCCESS;
- Trivy: SUCCESS;
- CodeQL: SUCCESS;
- Dependency Review: SUCCESS;
- m01 validation: SUCCESS;
- coverage/Codecov: SUCCESS;
- Sonar: SUCCESS;
- Socket checks: SUCCESS.

## Release-gate verdict

`GBS_V11_WO_011_REGISTRY_SMOKE_VERIFIED`

Release blocker counts:

- CRITICAL: 0
- HIGH: 0

The release/registry gate is **APPROVED and complete**.

## Consumer rollout state

State: `AUTHORIZED_NOT_STARTED`.

Authorized order begins with:

1. `KayzenRoot/goodz-menu`

The Goodz Menu step must independently prove:

- exact repository baseline;
- correct new-project bootstrap behavior;
- installation/use of `@gef-bootstrap/cli@1.1.1`;
- `gef init --apply` result;
- `gef doctor`;
- repeated `gef status`;
- generated governed state;
- repository checks/evidence.

## Next legal action

`ROLLOUT_GEF_V1_1_1_TO_GOODZ_MENU_FIRST`

**STOP STATE:** `GBS_V11_WO_011_REGISTRY_SMOKE_VERIFIED_GOODZ_MENU_NEXT`
