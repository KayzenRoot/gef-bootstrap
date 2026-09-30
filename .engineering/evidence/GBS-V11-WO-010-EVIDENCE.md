# GBS-V11-WO-010 — Prepublication acceptance evidence

Issue #351; Master Issue #348; PR #350; branch codex/gbs-v11-release-integration-014.
Gate 2 owner admission: review #5368812257, OWNER_APPROVED / GATE 2 COMPLETE / NOT_INDEPENDENT at source head 8529883a048eb58aa131c68800b22fba87ce8da2.

## Package and local Windows proof

- Node v24.19.0; npm 11.17.0; npm ci --ignore-scripts: PASS, 33 packages added, 0 reported vulnerabilities.
- npm run build: PASS.
- Real npm pack tarball: gef-bootstrap-cli-1.1.0.tgz; SHA-256 4a8aaf9507549291402f80eff8201704d2573d3c1c9b67be4f4c6f723f8ee624.
- Tarball inspection: 316 entries; package manifest @gef-bootstrap/cli@1.1.0 remains private with UNLICENSED metadata; required README, LICENSE, CLI, dist, vendor manifest and schema payloads present; source, test, credential and development paths absent.
- Vendored manifest: 18 artifacts; all 13 entries carrying SHA-256 values were recomputed against the actual tarball and matched. Remaining entries identify bundled runtime package versions.
- Installed the exact tarball offline into a dedicated isolated consumer directory; gef --help, --version, doctor, status, library import and uninstall all PASS on Windows x64 / Node v24.19.0. Verified the read-only root package.json stayed byte-identical during the corrected isolated install/use/uninstall probe.
- The same tarball smoke harness verified receipt SHA-256, exact source/event/ref binding, install/use, CLI/library import, V1.0-to-V1.1 migration with user-state preservation and uninstall on Windows x64. Local tarball SHA-256 was unchanged: `4a8aaf9507549291402f80eff8201704d2573d3c1c9b67be4f4c6f723f8ee624`.
- Focused distribution/package/upgrade/recovery/compatibility/publisher/security suites: 32/32 PASS, 0 skipped. This includes actual pack/install/use/remove tests, UPG-MIG-01..07, COMPAT-01..06 and WO-010 guards.
- npm audit --audit-level=high: PASS, 0 vulnerabilities.
- npm run validate: PASS; typecheck and 1610/1610 tests, 0 failed and 0 skipped on Windows Node v24.19.0.

The local tarball was repacked and source-bound at commit `7cf5524468998a721ef3f1aeb1cc279c6811582d`; it has the same SHA-256 as the earlier isolated proof. Package payload source files are unchanged from the admitted package sources. Documentation, evidence and workflow changes are outside the npm package allowlist and do not enter this tarball. The PR-triggered exact-head producer will generate the final candidate receipt for the later full PR head.

## Exact-head release, security and supply-chain gates

Gate 2's exact approval is recorded in the Gate Matrix. WO-010 requires fresh results on the final PR #350 head. The existing release-assurance matrix retains its per-host full suite; its new exact-head producer uploads one tarball and receipt for the Ubuntu/Windows/macOS same-artifact matrix. Local static guards and the Windows run pass, while provider matrix, Codecov Option B, Gitleaks, Trivy, CodeQL, Dependency Review, Pipeline Integrity, Sonar and all exact-head check conclusions remain PENDING until the candidate commit is pushed and its checks complete. No prior-SHA check is credited.

The v11-publish.yml workflow has a non-publishing manual branch acceptance path and a separate push-of-exact-tag publication path. It verifies the stable tag and main ancestry before publication, validates public package metadata, runs build/validate/audit, inspects and smoke-tests the tarball, retains its checksum manifest, and isolates OIDC permission to the publish job. The pre-merge release-assurance matrix now provides the runnable exact-head same-tarball proof. npm provenance and registry signatures are designed for the future authorized publication path; no registry provenance or signature exists for this unpublished candidate.

## npm trusted-publishing preflight and required owner action

- npm whoami --registry=https://registry.npmjs.org/: ENEEDAUTH; authenticated npm identity could not be verified.
- npm access list packages @gef-bootstrap: HTTP 404, Scope not found.
- npm view @gef-bootstrap/cli@1.1.0 version: HTTP 404, package not found.
- Package-level Trusted Publisher and GitHub OIDC settings therefore could not be inspected or verified. No token was read, created or used.
- Publication was NOT_ATTEMPTED. The CLI package remains private and UNLICENSED; repository All Rights Reserved terms remain unchanged.

OWNER ACTION REQUIRED: an npm account controlled by the owner must establish or verify the @gef-bootstrap scope and @gef-bootstrap/cli package, confirm its public-release rights and configure npm Trusted Publishing for KayzenRoot / gef-bootstrap / v11-publish.yml / environment npm-publish. Do not provide or configure a long-lived npm token. Re-run the non-destructive identity, scope, package and publisher-binding checks after that setup.

## Boundary

No main merge, v1.1.0 tag, GitHub Release, staging publish or npm publication occurred. V1.0 production remains 1088/1088 accepted. Exact final candidate checks and Gate 3 owner audit remain separate. Current preflight stop, after exact-head checks pass: OWNER_ACTION_REQUIRED_NPM_SCOPE_OR_OIDC.
