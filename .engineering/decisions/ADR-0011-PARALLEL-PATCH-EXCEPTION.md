# ADR-0011 — Limited ChatGPT implementation exception for v1.1.3 parallel patch

Status: PROPOSED_BY_EXPLICIT_OWNER_DIRECTIVE (2026-10-09); NOT EFFECTIVE UNTIL EXACT-HEAD AUDIT, MERGE AND CHECKPOINT PROMOTION.
Work Order: GBS-V113-PARALLEL-001; GitHub Issue: #432; branch: hotfix/1.1.3-parallel-modules.

## Decision
The owner explicitly requested the 1.1.3 parallel-module patch be implemented directly in this conversation without invoking Codex, and authorized only evidenced, nearby installation/optimization defects. This proposal **reopens ADR-0008-D1/D6 solely for this patch**. It does not grant ChatGPT or other agents general authorship for subsequent releases, projects, modules or Work Orders. No self-approved audit is allowed. Existing historical V1/V1.1.2 acceptance stays unchanged.

## Boundaries
1. Code/test/packaging author is ChatGPT via GitHub-linked owner account **for Issue #432 only**; owner exact-head semantic audit must remain NOT_INDEPENDENT. The executor must not certify its own implementation as independently reviewed.
2. Implementation confined to CLI parallel manifest planning, bounded issue reconciliation, Codex launch prompt, packaging/docs and directly verified defects. No full WO-003 promotion or replacement scheduler architecture.
3. Patch comes from the currently accepted main, not the behind release/1.1 branch, consistent with ADR-0009. Preserve 1.1.2 tag and predecessor.
4. Full release requires exact-head check evidence, deterministic/security tests, CLI pack/install smoke, owner audit, checkpoint promotion, accepted tag and registry publication verification. An open PR is not a release.
5. Unknown conflicts, stale bindings, unavailable GitHub tool/permission or CI failures fail closed. No new paid service, no destructive actions or history rewrite.

## Proposed outcome
A narrowly scoped once-off exception. If rejected, the code PR is not authorized to merge and ADR-0008 remains fully controlling. Proposal does not silently rewrite canonical history.
