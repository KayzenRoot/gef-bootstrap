# GBS-MOD-WO-002 — Implementation Evidence Bundle

**State:** `CORRECTION_IMPLEMENTED; SONAR_RECHECK_PENDING; HOSTED_TEST_REPORT_UNAVAILABLE`; Owner audit has not started.
**Work Order:** [GBS-MOD-WO-002](../work-orders/GBS-MOD-WO-002.md), admitted scope A1–A8.
**Issue:** [#396](https://github.com/KayzenRoot/gef-bootstrap/issues/396).
**Activation authorization:** [PR #460 Owner authorization](https://github.com/KayzenRoot/gef-bootstrap/pull/460#issuecomment-6168359370).
**Post-merge activation evidence:** [Issue #396 post-merge evidence](https://github.com/KayzenRoot/gef-bootstrap/issues/396#issuecomment-6168464573).
**Implementation base:** `main@58ace6c66c292faf5a61e431bbaccadcbc404287`.
**R3 correction source commits:** initial authenticated-report correction `df34d935fd7de63f40ad15850be95b29df747664` (tree `9e0a5ceac00f30c35596616ff9a8d2e9bc3ec6f1`); first Sonar complexity refactor `268a630164c881b10e9e2de4c241a72dfbd6b0bd` (tree `bda4c6f353bc258977ea95e719dd59ea19b7790e`); second refactor `bfea35e7c9d59efb95ddee853773ae34037b9f0e` (tree `8cba52156b121790a5d6fc3b464a6ad69d276caa`); strict enum validation and Sonar remediation `4539ebc245ac2515273237b760406b62d3247c78` (tree `37805f86a48a3c6e9a543506dd04a8802162d07b`); comparator and regex remediation `fdc9db2de7ff27d2ade3cb4d5f4676f85e2af9d4` (tree `cbe06e0203ea2220497a0afb90a68efa82764c1b`).
**Final PR #461 HEAD:** recorded in the PR's Exact-head Evidence Bundle after the final push; the evidence document commit itself is included in that HEAD.
**Execution risk:** `ELEVATED`; specialist review remains mandatory only if a HIGH_ASSURANCE trigger occurs.
**Checkpoint Delta:** `.engineering/checkpoint-deltas/GBS-MOD-WO-002-IMPLEMENTATION-PROPOSED.md` (`PROPOSED_ONLY`).

## Activation and source binding

The activation predicate was evaluated before implementation writes. PR #460 is the exact protected squash activation PR; its merge commit is `58ace6c66c292faf5a61e431bbaccadcbc404287`, which was verified as current `main`. Its required post-merge contexts and push workflows were green, the canonical checkpoint pair reconciles the product-level `activeWorkOrder=NONE` with the scoped conditional implementation authorization, and all 24 source fingerprints in the effective implementation Context Lock match `main`. The distinct Owner Codex authorization receipt is the PR #460 comment linked above. No canonical source conflict was found.

The implementation does not change product credit or release state: V1 remains `1088/1088`, stable CLI remains `1.1.2`, V1.2 remains `3/10`, and product-level `activeWorkOrder` remains `NONE`. The R3 receipt path binds each passing case to authenticated GitHub Actions report bytes, their recomputed SHA-256, the exact repository/run/attempt/job/check/HEAD, and a case name and outcome present in the parsed report. Caller-provided receipts are rejected. Missing, skipped, failed, stale-HEAD, or digest-altered cases cannot become `PASS`; absent trustworthy report bytes remain `UNPROVEN`/`NOT_VERIFIED`.

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

## Source correction commits and blob identities

The original R3 source/test correction is commit `df34d935fd7de63f40ad15850be95b29df747664`, based on `58ace6c66c292faf5a61e431bbaccadcbc404287`; its tree is `9e0a5ceac00f30c35596616ff9a8d2e9bc3ec6f1`. SonarCloud rejected PR HEAD `2d0561c3ea5caaded7348d1cc8b6f0b77fab4711` for five Cognitive Complexity findings; commit `268a630164c881b10e9e2de4c241a72dfbd6b0bd` refactored those stages. On PR HEAD `a87ead6ef17971b31584a7e3d1fe3061eac08c90`, Sonar check `116025369608` failed on `normalizeTestReportCollections` (complexity 53; limit 15). Commit `bfea35e7c9d59efb95ddee853773ae34037b9f0e` splits collection identity checks, exact-state validation, normalized output construction and receipt creation into small helpers. Sonar check `116031977280` then still failed the Reliability Rating gate on PR HEAD `3ffdfb2fe1330a032caa0e385b3cce7ed1e9abd2`; annotations included string coercion of untrusted enum values and repeated regular-expression/collection checks. Commit `4539ebc245ac2515273237b760406b62d3247c78` removes `String()` coercion from validation, checks enum values only after confirming strings, uses bounded sets, and simplifies the annotated input checks. Sonar check `116037645390` failed on PR HEAD `17a9484c8eccecb41b3de111a8afa57280a88868` with the required Reliability Rating D; its blocker required an explicit locale comparator for the private stable snapshot, and the annotations also flagged three over-complex credential regular expressions. Commit `fdc9db2de7ff27d2ade3cb4d5f4676f85e2af9d4` uses explicit English-locale comparison for the snapshot, separates credential patterns, and fixes the associated validation style findings. Its tree is `cbe06e0203ea2220497a0afb90a68efa82764c1b`; the exact-head Sonar recheck is pending after push. The latest source/test blob identities at `fdc9db2...` are:

| Path | Blob SHA |
| --- | --- |
| `packages/assurance-pipeline/src/provider-audit-packet.ts` | `56db3cb9da9a7dd086cdf3e53b35b54238ad7ef7` |
| `packages/contracts/src/provider-evidence.ts` | `d07a809820310d9944c860fd410a4f4e9293b06d` |
| `packages/evidence-engine/src/provider-evidence.ts` | `405d50983ba21a0c8b007ced53e8946ece641091` |
| `packages/evidence-engine/src/provider-test-report.ts` | `63a1d5b055100f502f4f46dcf6b1f38c797bd0f4` |
| `packages/evidence-engine/src/public.ts` | `55554c1741b5f0e92c6fb1da96c8b8b554540036` |
| `tests/gbs-mod-wo-002-evidence.test.mjs` | `47cece49fdedc098f767a53580d5da2ab2f84267` |

## Local validation

The latest source/test tree at `fdc9db2de7ff27d2ade3cb4d5f4676f85e2af9d4` (`cbe06e0203ea2220497a0afb90a68efa82764c1b`) was validated in a regular clone with locally installed dependencies. Results:

```text
npm run build                                  PASS
npm run typecheck                              PASS
node --test tests/gbs-mod-wo-002-evidence.test.mjs
39 passed, 0 failed, 0 skipped
npm_config_cache=/tmp/gef-bootstrap-npm-cache npm run validate
1855 passed, 0 failed, 4 skipped (1859 total)
npm_config_cache=/tmp/gef-bootstrap-npm-cache npm audit --audit-level=high
0 vulnerabilities
git diff --check                               PASS
```

The focused cases include the fabricated test-name/receipt controls; missing, failed, and skipped cases; a passing report from an earlier SHA; an altered receipt; an altered outcome after bundle re-sealing; mismatched run/attempt/check/job/suite; invalid report digest; denied or unavailable log access; and corrupt report bytes. The final full-suite run reported 1,855 passed, 0 failed, 4 skipped of 1,859 total. `npm audit --audit-level=high` reported 0 vulnerabilities. The regular clone was based on exact source/test commit `fdc9db2...`; the Evidence Bundle update is a separate documentation commit. The final PR description binds the pushed PR HEAD, exact base/tree, all changed-file blob SHAs and hosted check/run/job IDs. There is no `lint` script.

## Hosted provider validation

At PR HEAD `2d0561c3ea5caaded7348d1cc8b6f0b77fab4711`, `Repository validation` run `38612106429`, attempt `1`, job/Check Run `116017807297`, passed. `Pipeline Integrity` run `38612106713`, job/Check Run `116017809043`, passed. Gitleaks and Trivy passed in run `38612106875`, with Check Runs `116017809335` and `116017809690`. These checks are stale for source commit `268a630...` and are not evidence for its hosted validation.

SonarCloud Code Analysis Check Run `116018201358` failed on PR HEAD `2d0561c3...`: its Reliability Rating was D while the required gate was A. Its five Cognitive Complexity findings were `extractTextFiles` (51), `parseSpecReport` (24), and `collectGitHubTestExecutionReport` (36) in `packages/evidence-engine/src/provider-test-report.ts`; `normalizeWorkflows` (21) in `packages/evidence-engine/src/provider-evidence.ts`; and `parseFileBlobs` (18) in `packages/contracts/src/provider-evidence.ts`, each above 15. Commit `268a630...` refactored those functions. SonarCloud Code Analysis Check Run `116025369608` failed on PR HEAD `a87ead6ef17971b31584a7e3d1fe3061eac08c90` with the required Reliability Rating D; its blocker was `normalizeTestReportCollections` (complexity 53, limit 15). Commit `bfea35e...` split that function into bounded stages and helpers. SonarCloud Check Run `116031977280` on PR HEAD `3ffdfb2fe1330a032caa0e385b3cce7ed1e9abd2` still failed the D Reliability gate; annotations included unsafe string coercion in untrusted enum validation and other static findings. Commit `4539ebc...` removes those coercions and simplifies the annotated validation code. SonarCloud Check Run `116037645390` on the next PR HEAD `17a9484c8eccecb41b3de111a8afa57280a88868` still failed D because the private stable snapshot used a default sort comparator; annotations also identified three over-complex credential patterns. Commit `fdc9db2...` now uses explicit locale comparison and split credential patterns. Its hosted recheck is pending after push and must pass before owner audit readiness.

The authenticated collector was run against `Repository validation` on the old PR HEAD `2d0561c3...`, run `38612106429`, attempt `1`, job/check `116017807297`, and returned `UNAVAILABLE` with reason `GITHUB_TEST_REPORT_LOGS_UNAVAILABLE`, zero cases and no digest. It was retried on later PR HEAD `a87ead6ef17971b31584a7e3d1fe3061eac08c90`, run `38614195889`, attempt `1`, Check Run `116024942488`; the hosted check passed but the collector again returned `UNAVAILABLE`, the same reason, zero cases and no digest. GitHub API metadata was available, but the signed Actions log download redirects to a storage host inaccessible from this environment's egress; no signed URL is persisted or shown. Neither check supplies a case-level test receipt. After the next push, the collector must be retried against the exact final HEAD. Unless the raw report bytes can be retrieved and verified there, no A1–A8 test case is claimed as hosted `PASS`, and the requested ready stop condition remains blocked.

After the final push, the existing PR #461 description's **Exact-head Evidence Bundle** records the exact PR HEAD/base/tree, every changed-file blob SHA, required-context conclusions, check-run IDs, workflow run/attempt/job IDs, provider links and final dispositions. These receipts apply only to the exact PR HEAD listed there. The Checkpoint Delta remains `PROPOSED_ONLY`; this work performs no merge or checkpoint promotion.

## Review boundary

This bundle and packet issue no `APPROVED` state, make no merge decision, accept no security risk, and do not promote or rewrite either canonical checkpoint file. Owner audit must inspect the exact PR HEAD, full diff, local and hosted evidence, and unresolved-risk inventory independently.
