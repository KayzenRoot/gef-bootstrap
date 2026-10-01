# Evidence Bundle — GBS-V11-GOV-CODEX-FORWARDPORT-003

**Candidate state:** clean replacement for PR #341, based on the exact release/1.1 tip. Requested audit state is NOT_INDEPENDENT. This bundle records source/lineage facts and preflight evidence. The exact final candidate HEAD, required GitHub run/check URLs, and final local-validation results are maintained in the replacement PR description and Issue #340 comment after checks finish; no repository commit is added after those exact-HEAD checks.

## Authority and scope

- Admission source: Issue #340 owner approval and its Correction Delta for review #5358546986.
- Same Work Order ID and same admitted governance-document scope. No decision, checkpoint, threshold, security policy, code, test, CI, workflow, dependency, or release state change is authorized or included.
- Work Order and Context Lock were committed before normative edits in commit b5c1208c685e8c866ad0a8110a9bfa59242e40a2, whose sole parent is release/1.1 base f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be.
- The Work Order blob bound in the Context Lock is 1eb7b4fa7ce52668636fb7e6db35b9022436a618. The Context Lock records its first containing commit in the candidate lineage; it is not self-fingerprinted.
- Replacement branch codex/gbs-v11-forwardport-003-replacement does not descend from, cherry-pick, merge, rebase, or rewrite PR #341 history. The old branch remains a separate historical candidate.

## Exact source snapshot and fingerprints

| Source | Commit | Tree |
|---|---|---|
| main | f6738292c038eb6f0d08d1d32b3752c5c7dc417a | 0413bf3e8d706738f73c93578c81630ce027f4ec |
| release/1.1 | f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be | 1c7f88946c60defe175e065b241e2862a3933cbf |
| merge base | e23311e77d79b84f3c70671072a22a6f8896d13d | — |

The live remote refs matched the approved Issue #340 Context Lock at capture. Branch divergence was 2 main-only commits and 72 release-only commits. The 44-source matrix contains 132 source/ref values, including 97 non-ABSENT values. Recalculation against the merge base, current main and current release returned 132/132 matches and zero mismatches. The one historical source whose active path is intentionally omitted was resolved through immutable blob 687ee037d2dcd4936d118a23666665fc66410aed in main; it is absent from release. All source identifiers, paths where present, blob IDs and fingerprint values were retained; only the metadata field name is neutralized as sourceId.

The exact matrix is versioned in the Context Lock. The first candidate commit passed its comparison gate before any normative file was restored.

## Decision and conflict maps

| Branch-qualified record | Current disposition | Candidate treatment |
|---|---|---|
| D-0062 / release ADR-0006 | Effective owner-operated review and merge authority | Preserved unchanged; remains controlling for release |
| D-0062 / main historical source | Separate historical meaning identified by immutable provenance | Kept branch-qualified; no overwrite, renumbering, or global remap |
| D-0063 / main ADR-0008 | Approved main source | Release copy and reference remain PENDING_RELEASE_ADOPTION / NOT_EFFECTIVE |
| D-0064 / ADR-0009 | Unallocated | No allocation or new decision identity |

The Context Lock records two literal three-way conflicts: CHECKPOINT.json and DECISIONS-LEDGER.md. The checkpoint conflict is WRITE_FORBIDDEN; the ledger edit is bounded to approved decision-reference hunks. Semantic overlap is recorded there for AGENTS.md, Architecture, Checkpoint.md, Constitution Lock, DoD, Project Overview, Requirements, Scope, release ADR-0001 and README. Release-only ADR-0003..0006 and accepted work remain intact. Main-only historical decision provenance is carried by branch qualification and immutable blobs, not copied provider-specific active text.

## PR #341 security history and replacement rationale

PR #341 head 4e1e9113ac4db7a333aa4be719770ccca700ce7c targeted release/1.1 base f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be. Owner review #5358546986 returned BLOCKED / NOT_INDEPENDENT. Full-range Gitleaks runs 36629906683 and 36631337977 failed on a redacted generic-api-key match in Context Lock source metadata, attributed to first candidate commit 3a7a9bbc563613adf6e550e9677d2087fbcbb55b. The log redacted the matched value; the false-positive explanation is plausible but not proven by that log. No secret value is reproduced here, no finding is ignored, and scanner rules/configuration are unchanged.

The replacement starts at the live release tip, uses sourceId metadata from its first commit, and recreates only the already-reviewed semantic result. It preserves the 132 fingerprint values and all admitted decisions. The original #341 remains open/unmerged until this replacement has reviewable lineage and exact-head checks; it is then superseded and closed without merge.

## Changed-path and scope proof

The admitted maximum is 17 paths. The replacement candidate contains only the versioned Work Order, Context Lock, the same 14 reviewed normative-document paths from #341, and this Evidence Bundle:

- AGENTS.md
- .engineering/ARCHITECTURE.md
- .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md
- .engineering/CONSTITUTION-LOCK.md
- .engineering/DECISIONS-LEDGER.md
- .engineering/DECISIONS-SUPERSESSION-MAP.md
- .engineering/DEFINITION-OF-DONE.md
- .engineering/EXECUTOR-ACCELERATION-CONTRACT.md
- .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md
- .engineering/PROJECT-OVERVIEW.md
- .engineering/REQUIREMENTS.md
- .engineering/SCOPE.md
- .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md
- .engineering/context-locks/GBS-V11-GOV-CODEX-FORWARDPORT-003.json
- .engineering/evidence/GBS-V11-GOV-CODEX-FORWARDPORT-003-EVIDENCE.md
- .engineering/work-orders/GBS-V11-GOV-CODEX-FORWARDPORT-003.md
- README.md

No product source, tests, workflows/CI, dependency manifests, coverage config, security policy, Source Hierarchy, checkpoint, existing ADR-0001..0007, release tags, or main branch file is changed. The normative files are copied as file contents from the reviewed #341 candidate only; none of its commit objects are in this branch ancestry.

## Pre-PR security evidence

Pinned scanner: Gitleaks 8.30.1. Pinned config SHA-256: e163e53b9e7e8a8511e77271e2b323ed057759542a6d988258afe3a1fa329caf. Windows executable SHA-256 verified against the official release checksum list: d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e. Ignore file was empty; gitleaks:allow comments were not accepted.

- Before the artifact commit: scanned the two new Work Order/Context Lock files using the pinned config; exit 0, zero redacted findings.
- After artifact commit b5c1208c685e8c866ad0a8110a9bfa59242e40a2: full commit-range scan from f3b9ce62fe4e7a4ef64e5ad36e4569cecca658be through b5c1208c685e8c866ad0a8110a9bfa59242e40a2 with diff-merges=separate; one commit scanned, exit 0, zero findings.
- The final complete replacement-branch range scan is a mandatory pre-PR gate. Its exact base/head, result and redacted finding count are recorded in the PR description. Any finding or credential concern blocks PR creation.

## Validation and integration boundaries

Required local proofs are the targeted legacy-detachment test, JSON parse and exact 44-source/132-value recomputation, required document/heading/coherence checks, git diff --check, and npm run validate. Exact command results and final candidate identity are added to the PR description after execution.

Required GitHub evidence on the exact final PR HEAD is current repository validation, pipeline integrity, security and dependency checks, and V1.1 Ubuntu, Windows and macOS release assurance. Every required conclusion must be success; no pending, stale or failing check and no unresolved CRITICAL/HIGH finding. Exact run/check URLs and conclusions are listed in the PR description after they complete. Historical results from #336, #339 or #341 are not substituted for these runs.

Security, compatibility and dependency impact: documentation-only governance change; no runtime, product behavior, dependency, coverage threshold/config, CI, or security control change. Known risk: old #341 finding was redacted and cannot be retrospectively proven false from that log. The new full-range clean scan is the gate for this candidate.

## Unapplied checkpoint delta

UNAPPLIED / NOT PART OF THIS PR. The release checkpoint still points to PR #278 as the next cumulative integration action even though #278 is CLOSED_NOT_MERGED. Later separately audited maintenance should replace that stale pointer with the verified Issue #334 LCOV/Codecov diagnosis and the proposed, still separately governed correction in Issue #337. Do not claim #337 admitted, do not change checkpoint files here, and do not transfer #278 checks.

## Audit request and stop

Owner semantic audit remains NOT_INDEPENDENT. Requested disposition: APPROVED, CORRECTION_REQUIRED, or BLOCKED, against the exact final HEAD and the evidence links in the replacement PR description.

Stop condition: GBS_V11_GOV_CODEX_FORWARDPORT_003_CLEAN_REPLACEMENT_EXACT_HEAD_READY_FOR_OWNER_AUDIT.

No merge, checkpoint promotion, tag, publication, release-effectiveness claim, threshold waiver, cumulative release-to-main integration, or WO-010 admission.