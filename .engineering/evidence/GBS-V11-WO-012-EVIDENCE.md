# GBS-V11-WO-012 Evidence Bundle

**State:** local implementation and package smoke passed; automatic provider checks are to be read on the exact current head of the draft PR. **PR:** [#362](https://github.com/KayzenRoot/gef-bootstrap/pull/362). **Branch:** `hotfix/v1.1.2-release-state-preflight`. **Base:** `main@5a32a607ccf2055fab722f3d5d452791c6aae3e6`. **Implementation/source commit:** `2f2ed16969bab21184d7d26e50d4aca7008159a3`. **Context Lock SHA-256:** `ff0f7602a4bc6677a09ec42fe3761f355fa8bb8fce4d7e410728109909775d26`.

This bundle is committed after the implementation commit and records that tested source identity. The bundle-sync commit becomes the PR's final candidate head; its SHA and every required provider result are authoritative on the live [PR checks page](https://github.com/KayzenRoot/gef-bootstrap/pull/362/checks). Results from earlier heads do not transfer. The PR remains draft until the exact-head results are complete. Owner audit, merge, checkpoint promotion, tag creation, GitHub Release and npm publication have not occurred.

## Authority and bounded decisions

- The admitted execution contract is `GBS-V11-WO-012`, Issue #361, with the Context Lock above and base `5a32a607ccf2055fab722f3d5d452791c6aae3e6`.
- D-0064 / ADR-0009 routes this post-production patch to `main`; it does not authorize merge, tag, publication or consumer rollout.
- Owner Correction Delta #1 authorizes the six checkpoint/distribution assertions listed in the Context Lock. Direct owner replies additionally authorize the legacy-detachment test, the exact 1.1.2 compatibility matrix, the WO-002 progression assertion and `tests/v11-wo-010-publish-workflow.test.mjs`, each with its recorded narrow constraint.
- The Context Lock allowlist matched all **37 implementation paths** before the implementation commit; adding the three authorized Evidence Bundle deliverables makes **40 current-task paths, with 0 outside the allowlist**. The PR also carries the Work Order and direct execution brief from its earlier admission commits; neither was changed during implementation.

## Implementation and regression results

- Candidate identity is `@gef-bootstrap/cli@1.1.2`, `private: false`, `license: UNLICENSED`, repository `https://github.com/KayzenRoot/gef-bootstrap.git`, Node `>=22`.
- The checkpoint now records published V1.1.1 history separately and identifies WO-012 / V1.1.2 as the active patch. Human and JSON checkpoint tests pass. No production acceptance or checkpoint promotion is claimed.
- The consumer adoption preflight inspects only the bounded local impact-contract files. Unsupported, incomplete or ambiguous fail-closed contract semantics block before mutation; deterministic rejection of generated `.gef` paths also blocks before mutation. Tests verify unchanged target state on block and successful compatible/no-contract paths.
- Upgrade compatibility now includes the exact historical 1.0.0/1.1.0/1.1.1 to 1.1.2 rows and preserves source state/receipt bytes in the 1.1.1 to 1.1.2 test.
- The 1.1.2 release path is tag-bound, packages and tests one receipt-bound tarball on Ubuntu/Windows/macOS, and gates OIDC publication behind those checks. A separate post-publish recovery workflow is constrained to read-only retrieval/verification. No tag or publication was attempted.

The admitted-head automatic runs `36933793904`, `36933793942`, `36933793817`, `36933793842`, `36933793949` and `36933793987` predate the implementation commit. They failed because the legacy-detachment test's exact accepted-governance set did not yet include the three WO-012 governance files; the Windows assurance failure was downstream of the same full-validation failure. The owner-authorized exact-path correction is present in this candidate. Those historical results are not credited as final; check the new exact-head runs linked above.

### Local validation on the implementation source tree

- Focused WO-012/regression group: **91 passed, 0 failed, 0 skipped**. It includes the six Correction Delta #1 tests, the owner-authorized WO-010 publisher assertion, WO-011 workflow regression, checkpoint/promotion tests, upgrade compatibility and adoption preflight/release-state tests.
- `npm run build`: **PASS**.
- `npm run typecheck`: **PASS**.
- `npm run validate`: **PASS, 1630/1630, 0 failed, 0 skipped**.
- `npm audit --audit-level=high`: **PASS, 0 vulnerabilities**.
- JSON parsing for checkpoint JSON, Context Lock, compatibility matrix, root package manifest, lockfile and CLI package manifest: **PASS (6/6)**.
- `git diff --check`: **PASS** (Git emitted only its normal LF-to-CRLF notice for the Context Lock on this Windows checkout).
- Changed-file credential-pattern preflight: **0 matches**. This is not a substitute for the required exact-head Gitleaks result.

### Exact local package smoke

The tarball was created from source commit `2f2ed16969bab21184d7d26e50d4aca7008159a3` and installed into an isolated Windows consumer with lifecycle scripts disabled and npm offline mode. The same tarball passed CLI version/help, `doctor --json`, `status --json`, library import, 1.0.0-to-1.1.2 migration with source/receipt preservation, and uninstall checks. Result: **PASS `win32-x64`**.

- Tarball: `gef-bootstrap-cli-1.1.2.tgz`
- Local artifact path: `%TEMP%\gef-wo012-exact-2f2ed169-package\gef-bootstrap-cli-1.1.2.tgz`
- Size: `2,742,868` bytes
- SHA-256: `65cf97205343f6448b793a691ed2068d0b937fdc8da50f5a9c3cc9cd6dc9fc30`
- SRI: `sha512-JwK5PSzYdNOnS7VBMe5JFt2bqpZswngoPV9ssAkoaCm5mzSPtbFDUABdqogqzsjjLggrn+Z0OwMBgVYMzFGJEg==`

This is a local candidate artifact, not a release receipt. The final PR-head package candidate and same-artifact Ubuntu/macOS/Windows runs must pass before the stop condition.

## Security, provider checks and remaining limits

- Local high-severity npm audit is clean. The credential-pattern preflight found no candidate matches.
- Gitleaks, Trivy, CodeQL, SonarCloud, Codecov, Dependency Review, Pipeline Integrity, Socket and exact-head cross-platform assurance must each be confirmed on the final PR head through the live checks page. Historical checks on `4d249dda9b2b730471f558925141ec62f7d554c6` are stale after this implementation and evidence-sync commit.
- No consumer repository was changed. HIVE's existing dependency-graph blocker and Neryn World's UADS prerequisite remain consumer-owned and unfixed by WO-012.
- Known release boundary: package registry state, Trusted Publisher execution, immutable `v1.1.2` tag, GitHub Release, publication and registry verification are not exercised or claimed by this pre-audit candidate.

## Changed paths

The complete branch change inventory, including the five admission/governance files already present in PR #362 and all implementation/evidence paths, is recorded in `GBS-V11-WO-012-RELEASE-MANIFEST.json`.

## Proposed checkpoint disposition

Keep V1.0 production at `1088/1088`; retain V1.1.0 production acceptance and V1.1.1's published-but-post-publish-verification-failed history. WO-012 / 1.1.2 remains the sole active patch. After all final-head checks pass, the proposed stop marker is `GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT` and the next action is the owner's exact-head audit. This bundle does **not** promote the checkpoint, mark 1.1.2 accepted, or authorize merge/tag/publication.
