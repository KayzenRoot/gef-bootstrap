# GBS-V11-GOV-CODEX-FORWARDPORT-003 — Release governance forward-port

**Status:** ADMITTED_FOR_BOUNDED_IMPLEMENTATION; execution branch codex/gbs-v11-forwardport-003-replacement. **Risk:** STANDARD; reclassify to ELEVATED only if the actual diff introduces a release/production merger, data mutation, or irreversible action. **Approval:** Issue #340 owner admission directive, appended after Context Lock preparation comment #5897697149; NOT_INDEPENDENT. **Target:** release/1.1 only.

## OBJECTIVE

Prepare and execute one cohesive, documentation-only forward-port of the already-promoted main ADR-0008/D-0063 Codex-only authorship and GitHub-first handoff rules to release/1.1. Preserve release owner authority under ADR-0006, accepted V1.1 WO-001..009, main V1.0 production acceptance 1088/1088, branch history, release safety gates and all unrelated frozen product decisions.

This Work Order and its Context Lock were committed on the clean subordinate branch before any normative source edit. Their exact source binding is in .engineering/context-locks/GBS-V11-GOV-CODEX-FORWARDPORT-003.json. Compare them to the approval in Issue #340 before normative changes. Stop BLOCKED if the approved intent cannot be met within this lock.

## CONTEXT / SOURCE AUTHORITY

Issue #340 and its owner admission directive authorize this bounded execution. Issue #335 and merged planning PR #336 supply the approved source plan. Issue #338, merged PR #339 and its current historical lock/evidence supply admission-preparation lineage only; neither merge adopted ADR-0008 on release. The current promoted release authority remains ADR-0006 until a separate exact-head audit and checkpoint promotion.

The release checkpoint contains an outdated next-action reference to PR #278. Live PR #278 is CLOSED_NOT_MERGED. Treat that as recorded project-state drift, not a live PR gate. Keep both checkpoint files unchanged in this Work Order; include a proposed factual checkpoint delta in the Evidence Bundle for later separate review.

Issue #334's verified LCOV/Codecov cause and Issue #337's proposed coverage repair remain separate. The coverage threshold stays unchanged. No claim from closed PR #278 or older checks transfers to a future cumulative integration.

## SCOPE

One actual-diff PR targeting release/1.1. Reconcile only construction-actor, GitHub-first planning/handoff, and pending branch-applicability text in the approved paths below. Add the release-local ADR-0008 and workflow with explicit provenance and NOT_YET_EFFECTIVE status. Preserve decision IDs and branch meanings.

### MUST_READ

- Both exact locked revisions of AGENTS.md, Source Hierarchy, Checkpoint.md/json, Decisions Ledger, Decisions Supersession Map, Constitution Lock, Constitution Amendment 0001, Project Overview, Requirements, Scope, Architecture, Security, Test/Benchmark Plan, Definition of Done, Executor Acceleration Contract and README.
- Release ADR-0001 through ADR-0006 and main ADR-0001, ADR-0002, ADR-0007 and ADR-0008. The lock identifies the main-only historical ADR-0007 by its branch-qualified decision and blob ID; do not duplicate its active filename or provider-specific text into release files.
- Main .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md.
- Merged #336 Work Order and lineage map; #339 Context Lock and Evidence Bundle; merge receipts for #336 and #339; Issue #338 post-merge receipt; Issues #334 and #337.
- Bound package.json, release validation/security/integrity/cross-platform workflows, Windows validation helper, and tests that enforce release decision lineage and active-document detachment.
- Issue #340 owner admission approval and the fresh fingerprint/conflict matrix.

### READ_IF_TRIGGERED

Release execution handoffs, older ADRs, or additional tests only if an exact hunk or an existing validation failure directly depends on them. Record the trigger and added sources in the Evidence Bundle; do not broaden discovery speculatively.

### WRITE_ALLOWED

1. This Work Order and its Context Lock (committed first, before normative edits).
2. AGENTS.md.
3. .engineering/CONSTITUTION-LOCK.md.
4. .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md.
5. .engineering/PROJECT-OVERVIEW.md.
6. .engineering/REQUIREMENTS.md.
7. .engineering/SCOPE.md.
8. .engineering/ARCHITECTURE.md.
9. .engineering/DEFINITION-OF-DONE.md.
10. .engineering/EXECUTOR-ACCELERATION-CONTRACT.md.
11. README.md.
12. New .engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md.
13. New .engineering/GITHUB-FIRST-CODEX-WORKFLOW.md.
14. .engineering/DECISIONS-LEDGER.md.
15. .engineering/DECISIONS-SUPERSESSION-MAP.md.
16. This PR's .engineering/evidence/GBS-V11-GOV-CODEX-FORWARDPORT-003-EVIDENCE.md.

### WRITE_FORBIDDEN

- .engineering/CHECKPOINT.md and .engineering/CHECKPOINT.json; any applied checkpoint delta or promotion.
- .engineering/SOURCE-HIERARCHY.md, .engineering/SECURITY.md, .engineering/TEST-BENCHMARK-PLAN.md.
- Existing ADR-0001 through ADR-0007, including release ADR-0003..0006 and historical main ADR-0007.
- Product source, tests, fixtures, build scripts, CI/workflows, dependency manifests/lockfiles, coverage configuration or metrics.
- Release/production tags, package publication, main, history rewrite, force-push, unrelated cleanup.
- Any D-0064 / ADR-0009 allocation, global D-0062 remapping, change to D-0062@release/ADR-0006 meaning, or declaration that ADR-0008 is already effective on release.

## APPROVED DECISION CLOSURE

- Keep D-0062@release / ADR-0006 effective with its owner-operated exact-head audit and release merge restrictions.
- Keep D-0062@main / ADR-0007 branch-qualified and preserve its source through exact immutable blob provenance. Do not overwrite, renumber or assert supersession.
- D-0063 / ADR-0008 is an approved main source only. The release copy and ledger/map entry must say PENDING_RELEASE_ADOPTION / NOT_EFFECTIVE; effectiveness requires a distinct exact-head owner audit and checkpoint promotion.
- D-0064 and ADR-0009 remain unallocated. If global mapping becomes necessary, stop and request a separate owner decision.
- Preserve ADR-0003..0006, V1.1 accepted WO-001..009, WO-010 NOT_ADMITTED and main 1088/1088 history.
- The known PR #278 checkpoint drift is not resolved by this PR. Prepare an unapplied, separately reviewable checkpoint delta only.

## PER-FILE / HUNK INTENT

Only apply a hunk when exact comparison confirms that the release clause still conflicts. Do not copy main files wholesale; retain all release-specific material and the legacy historical decision text.

| Path | Exact section / bounded intent |
|---|---|
| AGENTS.md | Add an actor/GitHub-first handoff paragraph near the authority section, marked pending release promotion. Preserve all current owner-operated review/merge, fresh-context, exact-head and release gates verbatim. |
| .engineering/CONSTITUTION-LOCK.md | Reconcile only Self-construction constraint; mark ADR-0008/D-0063 prospective and pending release adoption. Preserve constitutional boundary, canonical source list and ADR-0006 authority. |
| .engineering/CONSTITUTION-AMENDMENT-0001-HYBRID.md | Insert a historical supersession notice before Self-construction policy, limited to actor restriction and gated on audit/promotion. Retain Amendment 0001 and D-0054 historical text verbatim. |
| .engineering/PROJECT-OVERVIEW.md | Reconcile Self-construction policy and numbered product-truth item 15 only; retain all product boundary, adapter, integration and release facts. State pending adoption and preserve historical D-0054 lineage. |
| .engineering/REQUIREMENTS.md | Reconcile Construction constraint and its freeze-audit statement only; retain all functional, compatibility, platform and product requirements. |
| .engineering/SCOPE.md | Reconcile Construction invariant and its matching freeze-audit statement only; preserve 64 IDs, 282 sessions, the complete-product classification and all release scope. |
| .engineering/ARCHITECTURE.md | Reconcile the construction-actor principle and its freeze-audit result only. Do not copy main's changed adapter/package topology or alter any contract/dependency boundary. |
| .engineering/DEFINITION-OF-DONE.md | Add the owner-directed process overlay as pending promotion; preserve every existing DoD, acceptance denominator and V1.1 release gate. |
| .engineering/EXECUTOR-ACCELERATION-CONTRACT.md | Reconcile the sole obsolete self-construction prohibition and add the approved bounded GitHub-first handoff section; retain the rest of the safety and validation contract. |
| README.md | Add a concise release-qualified construction-process note and links; retain the V1.1 operations runbook entry and all existing release/install guidance. |
| New ADR-0008 | Preserve main decision content/IDs by source provenance; adjust only branch applicability/status to pending release adoption and explicitly non-effective before release audit/promotion. |
| New GitHub-first workflow | Derive from the approved main companion; carry over roles, Work Order content, exact-head safety and Evidence Bundle gates; qualify release authority and mark pending adoption. |
| .engineering/DECISIONS-LEDGER.md | Keep the release D-0062/ADR-0006 entry unchanged. Add only a branch-qualified reference to main D-0063/ADR-0008 with source blob and NOT_EFFECTIVE_ON_RELEASE; no duplicate D-0062 decision or new ID. |
| .engineering/DECISIONS-SUPERSESSION-MAP.md | Preserve the existing D-0062 release closure and historical entries; add a pending release-adoption note for main D-0063/ADR-0008, not an effective supersession. |
| Evidence Bundle | Record exact base/head, changed hunk list, proof results/URLs, branch decision map, conflict handling, risk, limitations and the unapplied checkpoint delta. |

## ORDERED EXECUTION

1. Verify clean branch and exact starting base; re-fetch live refs.
2. Commit the Work Order and Context Lock first. Verify their sections, all fingerprint values, decision closures and file intent against Issue #340 owner approval. Do not edit normative sources until this comparison passes.
3. Inspect current hunk anchors at exact release/main blobs and re-run the decision collision scan. If a required path/symbol moved or any source differs from this lock, stop STALE.
4. Apply the complete, necessary bounded normative delta in the same subordinate branch. Keep the release checkpoints and all forbidden paths untouched.
5. Validate JSON/fingerprints, diff/path allowlist, legacy-detachment scanner, document coherence, whitespace and the full repository validation. Fix in-scope regressions on this branch.
6. Create one draft PR to release/1.1; do not merge or mark ready. Run/collect all then-required security, repository, integrity and V1.1 cross-platform checks on its exact final HEAD.
7. Update that same PR and this Issue with the complete Evidence Bundle; stop at the exact-head owner-audit gate.

## ACCEPTANCE / TEST MATRIX

| Criterion | Proof |
|---|---|
| Source lock | Live main/release SHAs and trees equal the Context Lock; all 44 input fingerprints and 132 ref comparisons match; merge base/divergence, PR #336/#339 receipts and related issue/PR state rechecked. |
| Approved intent | Work Order and Context Lock committed before any normative change and compared to the exact Issue #340 owner approval. |
| Branch decision safety | Both D-0062 meanings remain qualified and distinct; no D-0064 allocation; release ADR-0006 and ADR-0003..0005 remain unchanged/effective; release copy of ADR-0008 is explicitly pending and non-effective. |
| Scope | PR diff only contains necessary authorized document paths and this Evidence Bundle; no checkpoint or forbidden file changed; no production, coverage, dependency, test or CI claim changed. |
| Text safety | node --test tests/v11-legacy-ecosystem-detachment.test.mjs passes on final content; active release docs contain none of the retired integration's forbidden identifiers. |
| Local validation | git diff --check; JSON parse and 44-source/132-value recomputation; required document/heading/coherence checks; npm run validate (typecheck plus all tests/*.test.mjs). |
| GitHub assurance | Current required Repository validation, Pipeline integrity, security/dependency checks and V1.1 release assurance on Ubuntu, Windows and macOS all succeed on exact final PR HEAD; no pending/stale/failing required status and no unresolved CRITICAL/HIGH. |
| Coverage boundary | No threshold/config changes. Closed #278 checks are historical. Any new cumulative release-to-main Codecov/Sonar gate (including unchanged Codecov patch floor 97.85%) is later work after separate coverage correction/admission. |
| Evidence / stop | Same PR includes exact-base/head/tree, changed files/hunks, test outputs and check URLs, decision/conflict map, risks, unapplied checkpoint delta and owner verdict requirements. Stop unmerged at GBS_V11_GOV_CODEX_FORWARDPORT_003_CLEAN_REPLACEMENT_EXACT_HEAD_READY_FOR_OWNER_AUDIT. |

## RISKS / ESCALATION

- The release checkpoint's #278 pointer is stale. Do not edit it here; attach a factual proposed delta for separate owner review.
- D-0062 has two branch-qualified meanings. Any need to unify them or allocate a new ID blocks this Work Order.
- Existing release detachment checks reject certain retired integration names in active text. Preserve provenance using branch-qualified decision IDs and blob hashes.
- Exact refs moving, a newly discovered canonical-source conflict, an unapproved hunk, or a required check failing for an out-of-scope cause => record evidence and stop BLOCKED/STALE; do not waive or broaden.
- No merge, checkpoint promotion, tag, publication, release-to-main PR or V1.1 completion claim is permitted.

## EVIDENCE BUNDLE LAYOUT

The same PR must include:
1. exact base/main/release SHAs and trees, merge-base/divergence, Work Order/Context Lock artifact blob IDs;
2. 44 source-input fingerprints and 132 comparisons, current D-0062/D-0063/D-0064 disposition and literal/semantic conflict map;
3. changed file and hunk map against this approved intent, plus explicit no-change assertions for forbidden paths;
4. each local command, exact result, runtime and log/output path or GitHub check URL;
5. all exact-head workflow names, conclusions, run/check links, CRITICAL/HIGH status;
6. risk/security/compatibility/dependency impact, known checkpoint drift, unresolved limitations;
7. proposed checkpoint delta clearly marked unapplied and separate from this normative PR;
8. audit disposition requested as APPROVED / CORRECTION_REQUIRED / BLOCKED, owner audit NOT_INDEPENDENT.

## REVIEW FORMAT

Português brasileiro. State exact base/head; list actual changed files/hunks; map each acceptance criterion to proof; separate observed results from historical evidence; call out limitations and severity; use only the exact stop state.

## STOP CONDITION

GBS_V11_GOV_CODEX_FORWARDPORT_003_CLEAN_REPLACEMENT_EXACT_HEAD_READY_FOR_OWNER_AUDIT.

No merge, checkpoint mutation/promotion, tag, publication, threshold waiver or cumulative release-to-main integration.
## SECURITY HISTORY CORRECTION DELTA — Issue #340 / review #5358546986

**Candidate:** codex/gbs-v11-forwardport-003-replacement, created directly from the freshly verified release/1.1 tip. This is the same Work Order and admitted governance-document scope, represented by a new candidate lineage. It does not descend from PR #341, cherry-pick its commits, or rewrite its history.

**Reason and preserved decision state:** PR #341 at 4e1e9113ac4db7a333aa4be719770ccca700ce7c was blocked because full-range Gitleaks runs 36629906683 and 36631337977 reported one generic-api-key match in the Context Lock metadata at the first candidate commit 3a7a9bbc563613adf6e550e9677d2087fbcbb55b. The review https://github.com/KayzenRoot/gef-bootstrap/pull/341#pullrequestreview-5358546986 records that the scanner redacted the match: a false positive is plausible but not proven by that log. The replacement uses a neutral metadata field name (sourceId) from its first commit and preserves all 132 source fingerprint values and immutable source/blob provenance. No scanner finding is suppressed or waived.

**Mandatory order and gates:**
1. Re-fetch main, release/1.1, merge-base, source trees, PR #336/#339 merge receipts and approved Issue #340 sources. Stop STALE if a locked canonical ref moved or any of the 132 values differs.
2. Commit this Work Order and its replacement Context Lock first on the clean branch, with the new branch binding, neutral metadata field, refreshed capture time, PR #341 blocked lineage and replacement stop condition. Before touching normative documents, compare both committed artifacts with the Issue #340 admission and this approved correction; verify 44 inputs / 132 values, unchanged decisions and exact allowlist.
3. Recreate only the already-reviewed semantic result from #341 in the admitted normative paths. Copy file contents as a new bounded diff; do not import #341 history. Preserve both branch-qualified D-0062 meanings, release ADR-0006 authority, unallocated D-0064, pending/non-effective release D-0063/ADR-0008, checkpoint immutability and the 17-path maximum allowlist. Omit paths with no necessary approved delta. No code, tests, CI/workflows, dependencies, coverage, thresholds, security policy, decision, or checkpoint changes.
4. Update the Evidence Bundle with the replacement/base/lineage, the prior blocked finding and redacted-evidence limitation, exact source matrix and conflict/decision maps, changed hunks and non-changes, validation results, and exact-head run URLs. Never include scanner secret/match values.
5. Before opening any PR, run the repository-pinned Gitleaks v8.30.1 with the exact pinned policy/configuration and full merge-base..HEAD commit interval (including merge diffs), redacted reporting, and no ignore entries. The locally verified Windows executable checksum is d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e; the pinned policy checksum is e163e53b9e7e8a8511e77271e2b323ed057759542a6d988258afe3a1fa329caf. If any finding remains, a real credential is suspected, or a result cannot be verified, stop BLOCKED and do not open a PR.
6. Run the required targeted detachment test, JSON/source fingerprint and document validations, git diff --check, and npm run validate. Push only after the full local scan and validations pass; create one draft replacement PR to release/1.1. Revalidate every required security, integrity, repository, dependency and Ubuntu/macOS/Windows release-assurance check on its exact final HEAD. Update that same PR and Issue #340 with the complete Evidence Bundle.
7. Once the replacement candidate is reviewable with exact lineage and successful required checks, mark PR #341 superseded and close it without merge, with a cross-reference to the replacement. Do not merge either PR, promote the checkpoint, publish, or claim release effectiveness.

## REPLACEMENT STOP CONDITION

GBS_V11_GOV_CODEX_FORWARDPORT_003_CLEAN_REPLACEMENT_EXACT_HEAD_READY_FOR_OWNER_AUDIT.

If refs or fingerprints drift, the admitted artifact comparison fails, the full-range scan reports any finding, required checks fail, or a canonical/decision conflict appears, record the precise evidence and stop BLOCKED/STALE at that boundary. No workaround, suppression, scope expansion, or history rewrite is authorized.