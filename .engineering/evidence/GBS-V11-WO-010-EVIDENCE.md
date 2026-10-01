# GBS-V11-WO-010 clean replacement evidence — qualification in progress

Issue #351; Master Issue #348. Gate 2 admission review #5368812257 approved Option B on source head 8529883a048eb58aa131c68800b22fba87ce8da2. Correction Delta #17 is anchored to PR #350 review #5372870208.

## Clean candidate lineage

- Candidate branch: codex/gbs-v11-wo010-clean-replacement-delta17
- Current main base: f6738292c038eb6f0d08d1d32b3752c5c7dc417a
- Current admitted release/1.1 head: 4b2f66724ea5df94ddd8fda2d8088b12b9708c10
- Main/release common ancestor: e23311e77d79b84f3c70671072a22a6f8896d13d
- Fresh normal two-parent merge: 4e428d4c8657c19e05a30da3ba0064190007ab5f; tree 01acb6c2379304235b6213e3e9c7a2f87078069b; parents f6738292c038eb6f0d08d1d32b3752c5c7dc417a and 4b2f66724ea5df94ddd8fda2d8088b12b9708c10.
- Gate 2 state recreated in a new commit: 72db9380e7ac0afa8b5c339f72f09238f826f2a6; tree 6e78975f0c552edfe80e472f6198dd884209b26e, matching the admitted Gate 2 source tree.
- WO-010 implementation commit and replacement PR: pending. The full pinned Gitleaks interval scan must pass before the replacement PR opens.
- PR #350 and its descendants are not ancestors of this branch. Its tree and review were read-only references.

## Historical PR #350

PR #350 remains OPEN/DRAFT and unchanged. Review #5372870208 blocked its final head because its full-interval Gitleaks run retained one historical redacted finding. The finding value is not copied into the replacement. Historical implementation head: 59df2d1feadb18f5f5997f748f79339adb701f43; docs-only final head: 3cd5ba3f7e3e5cd4c81472f521b8b8a596ad68fe. No old tarball receipt or checksum is current evidence for this branch.

## Current replacement validation

- Workspace build: PASS on the staged replacement content.
- Directed Gate 2 admission/detachment tests: 13/13 PASS.
- Package-builder branch tests: 4/4 PASS.
- Remaining directed publisher/distribution/security tests: 27 passed; standalone artifact smoke requires an exact-source package receipt and is deferred until the clean implementation commit has a real tarball receipt.
- npm audit, npm run validate, package archive verification, same-artifact Ubuntu/Windows/macOS runs, Codecov Option B, Sonar, CodeQL, Trivy, Dependency Review, Pipeline Integrity, Socket and exact-head checks: NOT RUN on the clean candidate.
- Pinned Gitleaks 8.30.1 working-tree scan: six pre-existing repository findings remain at baseline coordinates; the WO-010 security row no longer triggers a finding. The pinned main..HEAD commit scan passed on the fresh merge and Gate 2 recreation; the complete interval must be rerun after the WO-010 commit and before PR creation.
- Unauthenticated public registry lookup for @gef-bootstrap/cli returned HTTP 404. npm identity and Trusted Publisher binding remain unverified; no token was used and no publication was attempted.

## Package, provenance and stop boundary

Package identity remains @gef-bootstrap/cli@1.1.0, private=true, license=UNLICENSED. Build a new real tarball and source/checksum receipt; all three OSes must consume the same checksum-bound tarball. GitHub OIDC Trusted Publishing remains the required publication design; the package-level binding is not claimed until verified. No replacement PR is open yet. Target stop: GBS_V11_WO_010_CLEAN_REPLACEMENT_EXACT_HEAD_READY_FOR_OWNER_AUDIT. No merge, tag, GitHub Release or npm publish is authorized.
