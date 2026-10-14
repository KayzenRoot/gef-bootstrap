# GBS-MOD-WO-002 — Implementation Evidence Bundle

**State:** `CORRECTION_IMPLEMENTED; HOSTED_TEST_REPORT_UNAVAILABLE`; Owner audit has not started.
**Work Order:** [GBS-MOD-WO-002](../work-orders/GBS-MOD-WO-002.md), admitted scope A1–A8.
**Issue:** [#396](https://github.com/KayzenRoot/gef-bootstrap/issues/396).
**Activation authorization:** [PR #460 Owner authorization](https://github.com/KayzenRoot/gef-bootstrap/pull/460#issuecomment-6168359370).
**Post-merge activation evidence:** [Issue #396 post-merge evidence](https://github.com/KayzenRoot/gef-bootstrap/issues/396#issuecomment-6168464573).
**Implementation base:** `main@58ace6c66c292faf5a61e431bbaccadcbc404287`.
**R3 correction source commit:** `df34d935fd7de63f40ad15850be95b29df747664` (tree `9e0a5ceac00f30c35596616ff9a8d2e9bc3ec6f1`).
**Final PR #461 HEAD:** recorded in the PR's Exact-head Evidence Bundle after the final push; the evidence document commit itself is included in that HEAD.
**Execution risk:** `ELEVATED`; specialist review remains mandatory only if a HIGH_ASSURANCE trigger occurs.
**Checkpoint Delta:** `.engineering/checkpoint-deltas/GBS-MOD-WO-002-IMPLEMENTATION-PROPOSED.md` (`PROPOSED_ONLY`).

## Activation and source binding

The activation predicate was evaluated before implementation writes. PR #460 is the exact protected squash activation PR; its merge commit is `58ace6c66c292faf5a61e431bbaccadcbc404287`, which was verified as current `main`. Its required post-merge contexts and push workflows were green, the canonical checkpoint pair reconciles the product-level `activeWorkOrder=NONE` with the scoped conditional implementation authorization, and all 24 source fingerprints in the effective implementation Context Lock match `main`. The distinct Owner Codex authorization receipt is the PR #460 comment linked above. No canonical source conflict was found.

The implementation does not change product credit or release state: V1 remains `1088/1088`, stable CLI remains `1.1.2`, V1.2 remains `3/10`, and product-level `activeWorkOrder` remains `NONE`.

## Candidate source and exact diff

The implementation branch is based only on the admitted merge SHA above. The PR description's **Exact-head Evidence Bundle** is the authoritative record of the final pushed HEAD, its tree, base/head commit and tree identities, changed-file blob SHAs, PR number, hosted check/job IDs, and live provider links. Activation PR #460 checks are not reused as implementation evidence.

The complete diff is confined to these files, all inside the six effective `WRITE_ALLOWED` globs:

- `packages/assurance-pipeline/src/provider-audit-packet.ts`
- `packages/assurance-pipeline/src/public.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/provider-evidence.ts`
- `packages/evidence-engine/src/provider-evidence.ts`
- `packages/evidence-engine/src/provider-test-report.ts`
- `packages/evidence-engine/src/public.ts`
- `tests/gbs-mod-wo-002-evidence.test.mjs`
- `.engineering/evidence/GBS-MOD-WO-002-EVIDENCE.md`
- `.engineering/checkpoint-deltas/GBS-MOD-WO-002-IMPLEMENTATION-PROPOSED.md`

No CLI, proof-graph, workflow, dependency manifest/lockfile, scanner, ruleset, or canonical checkpoint file is changed. The report collector makes only authenticated, read-only GitHub API and signed job-log GET requests; it issues no provider writes.

## Delivered behavior

- **Contracts:** strict versioned provider envelope; bounded, allowlisted fields; canonical sorting; redacted diagnostics; credential-free HTTPS links; exact PR/base/head, tree/blob, changed-path, effective lock, ruleset, and required-context identity.
- **M24 Evidence:** deterministic check-run and workflow/job/attempt normalization; latest-attempt selection; exact-head and context identity enforcement; completeness and tamper-evident digest; missing, pending, denied, unavailable, partial, failed, blocked, stale, and ambiguous states remain distinct.
- **R3 test execution receipts:** the untrusted provider envelope rejects every caller-supplied non-empty `testExecutionReceipts` array. The evidence engine creates receipts only from a module-branded result of `collectGitHubTestExecutionReport`. The read-only collector binds the exact repository, run, attempt, workflow job, Check Run, check suite, HEAD, conclusion and job details URL; downloads the signed job-log ZIP without forwarding the API token; applies streaming size bounds, ZIP path/header/CRC checks and strict UTF-8; parses exactly one complete Node spec report; and recomputes SHA-256 over the raw report bytes. Each receipt refers to a case actually present in those bytes. Missing proof stays `UNPROVEN`/`NOT_VERIFIED`, skipped or unexecuted cases never pass, failed cases fail, and stale HEADs remain stale. Re-sealed envelopes and altered collection digests do not preserve the collector's private provenance.
- **M27 Audit Packet:** acceptance-to-proof rows for A1–A8 with provider check and report links; current-binding revalidation across base/head, tree/blob, lock, ruleset, contexts and diff; bounded unresolved-risk and optional-review inventory; explicit `NOT_INDEPENDENT`, `PROPOSED_ONLY`, and no-approval/no-merge/no-promotion fields.

## A1–A8 proof map

| Criterion | Focused proof | Expected disposition |
| --- | --- | --- |
| A1 | `A1 base binding mismatch is STALE and cannot become PASS` | Base or head mismatch is `STALE`. |
| A2 | `A2 missing and pending required checks remain NOT_VERIFIED and PENDING` | Missing is `NOT_VERIFIED`; pending is `PENDING`. |
| A3 | `A3 duplicate display names do not satisfy a different required context identity` | Each required context is resolved by stable context ID. |
| A4 | `A4 a newer attempt on an earlier SHA supersedes an older passing attempt and is STALE` | Newer old-head attempt supersedes and is `STALE`. |
| A5 | `A5 executor PASS prose cannot override a failed raw provider check` | Raw failed provider result wins; prose is omitted from output. |
| A6 | `A6 changed head, lock, ruleset, tree, or blob identity makes a prior packet STALE` | Any current-binding dimension change invalidates the prior packet. |
| A7 | `A7 denied, unavailable, or partial provider collection is NOT_VERIFIED even when check-shaped claims pass` | Provider denial/unavailability/partial data never becomes green. |
| A8 | `A8 acceptance criterion without a proof mapping remains UNPROVEN` | Missing proof map stays `UNPROVEN`. |

Adversarial cases cover a nonexistent test with a complete fabricated receipt, an absent or skipped case, a failed case, a digest changed from the raw report, stale HEAD, wrong attempt/check/run/suite, mismatched check details, duplicate cases, corrupt and multi-disk ZIPs, missing/empty token, denied/unavailable log access, an altered collection and an altered outcome with the bundle digest recomputed. The positive fixture verifies the SHA-256 of the exact report bytes and binds the passing case to the correct run/job/check/HEAD. Existing coverage also checks unknown fields, token-shaped values, bulk logs, malformed SHAs, unsafe links and paths, duplicate check/job/context identities, hostile object inspection, workflow reruns, out-of-scope paths, and missing required specialist review. Fixture-backed success is parser evidence only; it is not presented as a hosted run receipt.

## Correction commit identities

The R3 source/test correction is commit `df34d935fd7de63f40ad15850be95b29df747664`, based on `58ace6c66c292faf5a61e431bbaccadcbc404287`; its tree is `9e0a5ceac00f30c35596616ff9a8d2e9bc3ec6f1`. Its changed blob identities are:

| Path | Blob SHA |
| --- | --- |
| `packages/assurance-pipeline/src/provider-audit-packet.ts` | `f14cfb7bb8ad4184b726b65b4a630b303b54bb16` |
| `packages/contracts/src/provider-evidence.ts` | `6bc4bb5d1f67c1f083725cf637e241b2703187e2` |
| `packages/evidence-engine/src/provider-evidence.ts` | `df95749a06c08ef03959087700feee4c2c6b7524` |
| `packages/evidence-engine/src/provider-test-report.ts` | `e43b90beced71abc1e15ebd018c98ca629a5ecc2` |
| `packages/evidence-engine/src/public.ts` | `55554c1741b5f0e92c6fb1da96c8b8b554540036` |
| `tests/gbs-mod-wo-002-evidence.test.mjs` | `47cece49fdedc098f767a53580d5da2ab2f84267` |

## Local validation

The R3 source and test code was validated at commit `df34d935fd7de63f40ad15850be95b29df747664`, tree `9e0a5ceac00f30c35596616ff9a8d2e9bc3ec6f1`. A regular clone based on the implementation branch ran the full suite with the exact correction source/test tree. Local results:

```text
npm run build
npm run typecheck
node --test tests/gbs-mod-wo-002-evidence.test.mjs
39 passed, 0 failed, 0 skipped
npm_config_cache=/tmp/gef-bootstrap-npm-cache npm run validate
1855 passed, 0 failed, 4 skipped (1859 total)
npm_config_cache=/tmp/gef-bootstrap-npm-cache npm audit --audit-level=high
0 vulnerabilities
```

`npm run build`, `npm run typecheck`, the focused suite and the full `npm run validate` completed successfully; the full suite reported 1,855 passed, 0 failed and 4 skipped. `npm audit --audit-level=high` reported 0 vulnerabilities. `git diff --check` passed. The repository has no `lint` script. The final PR description binds the pushed PR HEAD, exact base/tree, changed-file blobs, and hosted check/run/job IDs. The code/test blobs remain those listed above; the PR body records the final evidence-document commit and exact PR HEAD.

## Hosted provider validation

The previously successful `Repository validation` check is run `38595933302`, attempt `1`, job/Check Run `115962534976`, and it belongs to the old HEAD `7d2fcc7d0d87914287005f5ed5697b3cb9dad503`; it is not evidence for the correction commit. Authenticated API metadata was readable, but the signed job-log download was not available to this environment. The collector returned `UNAVAILABLE` with `GITHUB_TEST_REPORT_LOGS_UNAVAILABLE`, no digest and no cases. Therefore the old check cannot supply a test-case receipt, and no A1–A8 test case is claimed as hosted `PASS` from that run.

After the final push, the PR description's **Exact-head Evidence Bundle** records the exact PR HEAD/base/tree, every changed-file blob SHA, required-context conclusions, check-run IDs, workflow run/attempt/job IDs, provider links, and final dispositions. These receipts are per-HEAD and apply only to the exact PR HEAD in that section. If hosted report logs remain unavailable, A1–A8 test-case proofs remain `NOT_VERIFIED`/`UNPROVEN` with the collector reason above; this limitation blocks the ready stop condition.

## Review boundary

This bundle and packet issue no `APPROVED` state, make no merge decision, accept no security risk, and do not promote or rewrite either canonical checkpoint file. Owner audit must inspect the exact PR HEAD, full diff, local and hosted evidence, and unresolved-risk inventory independently.
