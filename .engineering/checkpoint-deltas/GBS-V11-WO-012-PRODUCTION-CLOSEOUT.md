# Production Closeout Delta — GBS-V11-WO-012 / V1.1.2

**State:** `ADMITTED_PENDING_GITHUB_RELEASE_AND_CODEX_SYNC`

**Issue:** #361

**Source main:** `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`

## Proven release facts

- immutable tag: `v1.1.2`
- annotated tag object: `d8241d55231fa1a608546e37f4b178c7695d1fdd`
- tag target: `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`
- package: `@gef-bootstrap/cli@1.1.2`
- Trusted Publisher workflow run: `36957290788`
- publish job: `110683489629` — SUCCESS
- public verification job: `110688730992` — SUCCESS on workflow attempt 2
- release artifact id: `11206700200`
- tarball SHA-256: `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97`
- SRI: `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==`
- npm registry ECDSA signature: VERIFIED
- signing key: `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`
- SLSA provenance: VERIFIED
- Sigstore transparency log index: `3046460318`
- clean published-consumer install with lifecycle scripts disabled: PASS
- published CLI version smoke: PASS, `1.1.2`

The first post-publish verification attempt failed only because the npm registry returned an immediate propagation-time 404 after the successful publish. No republish occurred. A failed-jobs-only rerun passed.

## Required hosted closeout

Create exactly one GitHub Release for existing tag `v1.1.2`:
- title: `GEF Bootstrap v1.1.2`
- draft: false
- prerelease: false
- tag target must remain unchanged
- do not republish npm

After provider confirmation, record release id, URL and publication timestamp.

## Target canonical state

After GitHub Release creation, Codex synchronization, exact-head checks and owner audit:

- `v11.status = GBS_V11_1_1_2_PRODUCTION_ACCEPTED`
- `activeWorkOrder = NONE`
- `activeWorkOrderStatus = NONE`
- `nextLegalAction = V1_1_2_PRODUCTION_MAINTENANCE_OR_NEXT_GOVERNED_WORK_ORDER`
- `stopState = GBS_V11_1_1_2_PRODUCTION_ACCEPTED`
- `stableRelease.version = 1.1.2`
- `stableRelease.status = PRODUCTION_ACCEPTED`
- stable release must record tag object/target, GitHub Release metadata, package, SRI, tarball SHA-256, publication run and successful registry verification
- preserve V1.1.0 acceptance as historical release evidence
- preserve V1.1.1 as `PUBLISHED_POST_PUBLISH_VERIFICATION_FAILED`
- close the active candidate as accepted
- consumer rollout remains `NOT_STARTED` until separately governed

## Required validation

- focused closeout tests
- `npm run build`
- `npm run typecheck`
- `npm run validate`
- `npm audit --audit-level=high`
- `git diff --check`
- exact-head provider/security/cross-platform checks
- owner exact-head audit before merge

## Safety

No tag movement, npm republish, product/runtime change, CI change, dependency change, threshold change or consumer mutation.

**STOP CONDITION:** `GBS_V11_1_1_2_PRODUCTION_CLOSEOUT_READY_FOR_OWNER_AUDIT`.
