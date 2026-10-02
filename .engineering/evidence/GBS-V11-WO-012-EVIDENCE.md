# GBS-V11-WO-012 Evidence Bundle

**State:** local validation, package smoke, and all 141 reported checks passed on implementation candidate `bcc81a81f910a5064fe325077730df508303b195`. **PR:** [#362](https://github.com/KayzenRoot/gef-bootstrap/pull/362). **Branch:** `hotfix/v1.1.2-release-state-preflight`. **Base:** `main@5a32a607ccf2055fab722f3d5d452791c6aae3e6`. **Original implementation commit:** `2f2ed16969bab21184d7d26e50d4aca7008159a3`. **Correction commit:** `bcc81a81f910a5064fe325077730df508303b195`. **Context Lock SHA-256:** `d263388e82c1e3ddd154b0dde943bd5f6fef42aef0c11124d5de9dac4062f505`.

The checks listed below were observed on exact implementation head `bcc81a8`. This Evidence Bundle is being synchronized in a following documentation commit, which changes the PR head and triggers fresh exact-head checks. Do not transfer the `bcc81a8` results to that evidence-sync head; verify the live [PR checks page](https://github.com/KayzenRoot/gef-bootstrap/pull/362/checks) before the owner audit. PR #362 remains draft. Owner audit, merge, checkpoint promotion, tag creation, GitHub Release and npm publication have not occurred.

## Authority and bounded decisions

- The admitted execution contract is `GBS-V11-WO-012`, Issue #361, with the Context Lock above and base `5a32a607ccf2055fab722f3d5d452791c6aae3e6`.
- D-0064 / ADR-0009 routes this post-production patch to `main`; it does not authorize merge, tag, publication or consumer rollout.
- Owner Correction Delta #1 authorizes the six checkpoint/distribution assertions listed in the Context Lock. Direct owner replies additionally authorize the legacy-detachment test, the exact 1.1.2 compatibility matrix, the WO-002 progression assertion and `tests/v11-wo-010-publish-workflow.test.mjs`, each with its recorded narrow constraint. The owner's delegated exact-path choice adds only the WO-012 Evidence Bundle Markdown and release manifest to the legacy-detachment test's accepted governance-history set; all other retired-binding scans remain active.
- The Context Lock allowlist matched all **37 implementation paths** before the implementation commit; adding the three authorized Evidence Bundle deliverables makes **40 current-task paths, with 0 outside the allowlist**. The PR also carries the Work Order and direct execution brief from its earlier admission commits; neither was changed during implementation.

## Implementation and regression results

- Candidate identity is `@gef-bootstrap/cli@1.1.2`, `private: false`, `license: UNLICENSED`, repository `https://github.com/KayzenRoot/gef-bootstrap.git`, Node `>=22`.
- The checkpoint now records published V1.1.1 history separately and identifies WO-012 / V1.1.2 as the active patch. Human and JSON checkpoint tests pass. No production acceptance or checkpoint promotion is claimed.
- The consumer adoption preflight inspects only the bounded local impact-contract files. Unsupported, incomplete or ambiguous fail-closed contract semantics block before mutation; deterministic rejection of generated `.gef` paths also blocks before mutation. Tests verify unchanged target state on block and successful compatible/no-contract paths.
- Upgrade compatibility now includes the exact historical 1.0.0/1.1.0/1.1.1 to 1.1.2 rows and preserves source state/receipt bytes in the 1.1.1 to 1.1.2 test.
- The 1.1.2 release path is tag-bound, packages and tests one receipt-bound tarball on Ubuntu/Windows/macOS, and gates OIDC publication behind those checks. A separate post-publish recovery workflow is constrained to read-only retrieval/verification. No tag or publication was attempted.
- The exact-head Sonar findings were corrected without changing the quality gate: `validateConsumerImpactRegistry` delegates module-shape, dependency-edge and cycle checks to bounded helpers, and the 1.1.0/1.1.1 compatibility tests share one parameterized assertion while retaining distinct source-version inputs.
- The 1.1.2 artifact smoke no longer duplicates the historical V1.1 artifact smoke implementation. It retains exact receipt/tarball identity, disabled lifecycle scripts, native runtime load, CLI/library/doctor/status, migration byte-preservation and uninstall checks. Windows npm invocation uses the installed npm CLI directly without shell execution.

The admitted-head automatic runs `36933793904`, `36933793942`, `36933793817`, `36933793842`, `36933793949` and `36933793987` predate the implementation commit. They failed because the legacy-detachment test's exact accepted-governance set did not yet include the three WO-012 governance files; the Windows assurance failure was downstream of the same full-validation failure. The owner-authorized exact-path correction is present in this candidate. Those historical results are not credited as final; check the new exact-head runs linked above.

### Local validation on the implementation source tree

- Correction/regression focused group: **26 passed, 0 failed, 0 skipped** across the legacy-detachment, WO-004 upgrade and WO-010 publisher workflow tests. WO-012 release-state static tests: **4 passed, 0 failed**.
- `npm run build`: **PASS**.
- `npm run typecheck`: **PASS**.
- `npm run validate`: **PASS, 1630/1630, 0 failed, 0 skipped**.
- `npm audit --audit-level=high`: **PASS, 0 vulnerabilities**.
- `node --check .github/scripts/run-v11-wo012-artifact-smoke.mjs` and `git diff --check`: **PASS**.
- `git diff --check`: **PASS** (Git emitted only its normal LF-to-CRLF notice for the Context Lock on this Windows checkout).
- Changed-file credential-pattern preflight: **0 matches**. This is not a substitute for the required exact-head Gitleaks result.

### Exact local package smoke

The tarball was prepared from the committed source tree at `bcc81a81f910a5064fe325077730df508303b195` and installed into an isolated Windows consumer with lifecycle scripts disabled and npm offline mode. It passed CLI version/help, `doctor --json`, `status --json`, library import, 1.0.0-to-1.1.2 migration with source/receipt preservation, and uninstall checks. Result: **PASS `win32-x64`**.

- Tarball: `gef-bootstrap-cli-1.1.2.tgz`
- Local artifact path: `%TEMP%\gef-wo012-bcc81a8-smoke-70470969f3c34391a5808a622b50baf2\gef-bootstrap-cli-1.1.2.tgz`
- Size: `2,742,869` bytes
- SHA-256: `47cb63ac50dcd3369c72f4f7c8ae0f73b5a210a6e997fe015a586e9ead7f4fcc`
- SRI: `sha512-AVjYd6eZ4vgzNXFhgMA5ngA3Bhofrp2uVGXz3qm/6pHNMUYvTc3BlTbyxRoebmIEzGGff1UoI83iH+/td9RfMw==`

This is a local candidate artifact, not a release receipt. The exact-head same-artifact Ubuntu/macOS/Windows workflow also passed on `bcc81a8`; the new evidence-sync head must pass a fresh run before the stop condition.

## Security, provider checks and remaining limits

- Local high-severity npm audit is clean. Gitleaks, Trivy, CodeQL, SonarCloud, Codecov, Dependency Review, Pipeline Integrity, Socket, Repository Validation and Ubuntu/macOS/Windows exact-head assurance all passed on implementation head `bcc81a81f910a5064fe325077730df508303b195` (141/141 reported checks). The evidence-sync commit changes HEAD, so fresh results on that newer SHA are required; only the live [PR checks page](https://github.com/KayzenRoot/gef-bootstrap/pull/362/checks) determines final status.

  - [Codecov Node coverage](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207247/job/110639261645)
  - [SonarCloud Code Analysis](https://sonarcloud.io/dashboard?id=KayzenRoot_gef-bootstrap&pullRequest=362)
  - [Gitleaks and Trivy](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207401)
  - [CodeQL](https://github.com/KayzenRoot/gef-bootstrap/runs/110639720046)
  - [Dependency Review](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207323/job/110639260021)
  - [Pipeline Integrity](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207284/job/110639306425)
  - [Repository Validation](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207344/job/110639260378)
  - Same tarball: [Ubuntu](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639606505), [macOS](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639606374), [Windows](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639606352)
  - Release assurance: [Ubuntu](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639260132), [macOS](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639260202), [Windows](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36943207240/job/110639260204)
- No consumer repository was changed. HIVE's existing dependency-graph blocker and Neryn World's UADS prerequisite remain consumer-owned and unfixed by WO-012.
- The immutable `v1.1.2` publication and registry verification are complete. Correction Delta #3 created the stable GitHub Release for that existing tag; no tag or npm artifact mutation was performed during closeout.

## Changed paths

The complete branch change inventory, including the five admission/governance files already present in PR #362 and all implementation/evidence paths, is recorded in `GBS-V11-WO-012-RELEASE-MANIFEST.json`.

## Proposed checkpoint disposition

Keep V1.0 production at `1088/1088`; retain V1.1.0 production acceptance and V1.1.1's published-but-post-publish-verification-failed history. WO-012 / 1.1.2 remains the sole active patch. After all final-head checks pass, the proposed stop marker is `GBS_V11_WO_012_EXACT_HEAD_READY_FOR_OWNER_AUDIT` and the next action is the owner's exact-head audit. This bundle does **not** promote the checkpoint, mark 1.1.2 accepted, or authorize merge/tag/publication.

## Post-merge owner audit and merge receipt

The pre-audit evidence above remains the execution record for implementation head `bcc81a81f910a5064fe325077730df508303b195` and the evidence-sync head that followed it. The final exact implementation PR head was `ca22282dd6f6891797430451968bc6bf244a28af`.

- Owner exact-head review: `#5387212864`, verdict `OWNER_APPROVED / NOT_INDEPENDENT`.
- Ready-state retrigger proof: `157/157` check-runs SUCCESS on `ca22282dd6f6891797430451968bc6bf244a28af`, with no pending/failing run before merge.
- PR #362 merge: squash merge to `main` as `4c0f9bdab51e3c831263f7d45d6b5a8ee533dfd5`.
- Post-merge merge-commit checks observed before checkpoint promotion: Repository Validation `SUCCESS`, Node coverage LCOV `SUCCESS`, Analyze TypeScript `SUCCESS`.
- No `v1.1.2` tag, npm publication, GitHub Release, registry verification or consumer rollout had occurred at this checkpoint-promotion admission.
- HIVE dependency-graph and Neryn World UADS remain consumer-owned boundaries.

The next governed state is `MERGED_AWAITING_PUBLICATION`. Production acceptance remains prohibited until the immutable `v1.1.2` publication path and post-publish registry verification succeed.

## Immutable V1.1.2 publication and registry-verification receipt

The post-merge checkpoint promotion merged to `main` as `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`. The owner then created annotated tag `v1.1.2` on that exact commit.

- Annotated tag object: `d8241d55231fa1a608546e37f4b178c7695d1fdd`
- Tag target: `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`
- Trusted Publisher workflow run: `36957290788`
- Publish job `110683489629`: SUCCESS
- Package: `@gef-bootstrap/cli@1.1.2`
- Release artifact id: `11206700200`
- Workflow artifact ZIP digest: `sha256:1015261f76b8a66c48150d44697bc1b386c7522021b166a6da710a468f6b7092`
- Exact release tarball SHA-256: `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`
- Exact release SRI: `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`
- npm Trusted Publishing emitted SLSA provenance and Sigstore transparency log index `3046460318`.

The first post-publish public verification ran immediately after npm reported that the package was still being processed and received `E404 No match found for version 1.1.2`. This was after the publish job had succeeded. The failed-jobs-only rerun did not republish the package.

Workflow attempt 2 completed SUCCESS:
- public verification job `110688730992`: SUCCESS;
- registry version lookup: PASS;
- exact SRI equality: PASS;
- npm registry ECDSA signature: VERIFIED with active signing key `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`;
- SLSA provenance metadata: VERIFIED;
- clean package-lock/install with lifecycle scripts disabled: PASS;
- installed CLI version smoke: PASS at `1.1.2`.

This satisfies the Work Order's technical terminal condition for immutable publication plus registry verification. At Correction Delta #3 admission the GitHub Release did not exist; it has now been created for the existing tag. Canonical checkpoint promotion remains with the owner after exact-head closeout audit.

## Correction Delta #3 — production closeout evidence

- Repository/PR: `KayzenRoot/gef-bootstrap`, PR `#364`, branch `docs/v1.1.2-production-closeout`.
- Main base: `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`; pre-edit branch head: `24cc02890b84154f25225163154cf53111353062`.
- GitHub Release: [GEF Bootstrap v1.1.2](https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.2), release ID `401675074`, published `2026-10-02T09:10:56Z`, `draft=false`, `prerelease=false`.
- Release tag object and target remained `d8241d55231fa1a608546e37f4b178c7695d1fdd` and `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82` after release creation.
- Package: `@gef-bootstrap/cli@1.1.2`, published through npm Trusted Publishing. Registry SRI is `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`; tarball SHA-256 is `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`.
- Workflow run [36957290788, attempt 2](https://github.com/KayzenRoot/gef-bootstrap/actions/runs/36957290788) is `SUCCESS`; publish job `110683489629` and registry verification job `110688730992` are `SUCCESS`. npm ECDSA signature and SLSA provenance verification passed; Sigstore log index `3046460318`.
- The stable release notes record Trusted Publishing, the immutable source target, successful registry-integrity/ECDSA/SLSA verification, the consumer-safe adoption preflight, the v1.1.1 recovery corrections, and the still-unresolved consumer-owned HIVE and Neryn World prerequisites.
- Operator documentation now identifies 1.1.2 as the current production-accepted package while preserving V1.1.0 acceptance and the V1.1.1 post-publish artifact-download incident. The authorized checkpoint tests recognize only the exact future state `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`; historical state assertions remain intact.
- Focused WO-012/admission tests: **52 passed, 0 failed, 0 skipped**; the retired-ecosystem detachment regression also passed (**1/1**), for **53/53** combined focused checks.
- In the conventional validation clone, `npm run build`, `npm run typecheck`, `npm run validate` (**1632/1632**), `npm audit --audit-level=high` (**0 vulnerabilities**) and `git diff --check` all passed. The first linked-worktree full-suite attempt exposed two tests that require a normal `.git` directory; the full suite was then run in the conventional clone and passed.
- During this correction no npm publish, tag movement/recreation, checkpoint promotion, merge or consumer rollout was performed. Await the exact-head checks and owner audit; stop condition is `GBS_V11_1_1_2_PRODUCTION_CLOSEOUT_READY_FOR_OWNER_AUDIT`.

