## 2026-10-14 source-identity addendum after #451

**CURRENT, governing navigation; original pre-#451 planning and historical hashes below remain preserved for audit.** The separately Owner-authorized [PR #451](https://github.com/KayzenRoot/gef-bootstrap/pull/451) protected squash has **MERGED** at real `main@e71120266c40235089444c9c0122280c5da4e5bd`. Canonical `.engineering/CHECKPOINT.md` has Git blob `686a2e3f7da1b541f9a4ee10a4d9432358105e0a`, `.engineering/CHECKPOINT.json` has blob `4a653772c31dffee869a9bac17345241cfc6db03`; their earlier WO-002 temporal `STATE_CONFLICT` was resolved in that exact main, with new-main required CI verified. The source and conflict claims in the original 2026-10-13 planning section below are **historical, no longer current**. Canonical WO-002 is `WO002_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK`, `implementationAuthorized=false`, `implementationStarted=false`, effective implementation lock null. The current [PR #450](https://github.com/KayzenRoot/gef-bootstrap/pull/450) remains a non-executable synchronized DRAFT, **not** an implemented M24 interface, and its planning CI green confers no execution right.

**Still-current blockers:** WO-003 itself remains `PLANNING_CANDIDATE_NOT_ADMITTED`, not part of active scheduler runtime. Evidence WO-002 #396 not implemented or promoted; workspace factory #402 and Codex dispatch bridge #408 not admitted; current ADR-0008 reserves code/tests/CI to Codex; no new Owner permission to implement WO-003 or activate any execution lock. Historical all-ref Gitleaks #439 remains 21 UNKNOWN, and npm 1.1.3 release blocked. Risk remains proposed ELEVATED, future allocation only after exact-current main lock, code/actor permission and review gates. Original A1–A10, risk floors, no-implementation flags, three-file planning allowlist and STOP remain unchanged.

**STOP:** `GBS_MOD_WO003_POST451_SOURCE_RECTIFIED_PLANNING_ONLY_DO_NOT_EXECUTE`.

---

# GBS-MOD-WO-003 — Dependency DAG + Parallel-Safe Codex Agent Pool

**STATE:** `PLANNING_CANDIDATE_NOT_ADMITTED`. **DO NOT EXECUTE.**
**Program:** [#393](https://github.com/KayzenRoot/gef-bootstrap/issues/393). **Issue:** [#397](https://github.com/KayzenRoot/gef-bootstrap/issues/397).
**Predecessor:** GBS-MOD-WO-001 [#394](https://github.com/KayzenRoot/gef-bootstrap/issues/394) governance-promoted.
**Dependent interfaces:** GBS-MOD-WO-002 [#396](https://github.com/KayzenRoot/gef-bootstrap/issues/396) planning-only; WO-008 [#402](https://github.com/KayzenRoot/gef-bootstrap/issues/402) and WO-013 [#408](https://github.com/KayzenRoot/gef-bootstrap/issues/408) planning-only. No dependent implementation is admitted by this document.
**PLANNING BASE:** `KayzenRoot/gef-bootstrap main@e0356f1de5dae2351d8701a76c736a22832929c2` (verified equal to live `main` by Git compare).
**Risk:** `ELEVATED` planning classification; actual implementation risk cannot be downgraded and must be separately Owner-admitted against an exact source lock. Escalate to Security/S4 for privileged mutations, repo policy, credentials, security gates or destructive recovery.
**Actor today:** ChatGPT may produce governed planning, provider inspection and audit `NOT_INDEPENDENT`; **Codex is the sole code/test/CI/fixture author** by effective ADR-0008/D-0063. A separately proposed actor change [#452](https://github.com/KayzenRoot/gef-bootstrap/issues/452) is not effective.
**Canonical barrier:** `CHECKPOINT.md` and `CHECKPOINT.json` carry a WO-002 temporal `STATE_CONFLICT`; [PR #451](https://github.com/KayzenRoot/gef-bootstrap/pull/451) has only authorization to PREPARE/REVIEW, **not MERGE**. [PR #450](https://github.com/KayzenRoot/gef-bootstrap/pull/450) is an inactive, nonexecutable WO-002 implementation-lock draft. The scheduler cannot assume those gates are passed.
**STOP:** `GBS_MOD_WO_003_PLANNING_PACKET_EXACT_HEAD_AUDIT_READY_NOT_ADMITTED`.

## OBJECTIVE / ROI

Compile a deterministic dependency DAG and conservative conflict matrix for **already admitted** Work Orders. Schedule up to a bounded configurable number of independent Codex agents into physically distinct Git worktrees, branches and effective Context Locks, preserve exact-state evidence and stage receipts, and stop/invalidate only affected successors when dependencies change. Eliminate repeated orchestration prompting when an already governed execution contract is reusable. It is **not** general authorization to launch background Codex, merge PRs, change rulesets or confer review authority.

## NEED / CANONICAL SOURCES

MUST_READ:
- `AGENTS.md` blob `492f1d4ae66abe8749a082d68decc81a3b4fd702`;
- `.engineering/SOURCE-HIERARCHY.md` blob `bedc10c97d28154efe59ff43fc1d175add37f568`;
- canonical `.engineering/CHECKPOINT.md` blob `866d0fcef2253560a45a8dbca147d9cd451d0960` + `.engineering/CHECKPOINT.json` blob `af21419f47fc9f106abb49203b5b52c135a66ee1`, treat their active shared-field conflict as `STATE_CONFLICT`;
- `.engineering/SECURITY.md` blob `799206278e9f5bc02aec07c8e6d4489c530bb320`; `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md` blob `f3246fc074b450da986ad3dcda76f3d005dc8c6a`;
- `.engineering/ARCHITECTURE.md` blob `5c2b44db3805dbd5329dc99a8a9b774360c4136a`; `.engineering/REQUIREMENTS.md` blob `6220bba3e8d1c8c50d488e00e4ea9661e2647939`; `.engineering/DEFINITION-OF-DONE.md` blob `b6faba1b969724401e5ce38ee9db5c5aa120056c`; `.engineering/DECISIONS-LEDGER.md` blob `569479a700f1956bdb2d97be30a27aaccf592b7e`;
- Issue #397, parent #393, predecessor #394 and #396, real admitted WO/lock and risk receipts at exact target HEAD, and current exact GitHub ruleset required contexts.
READ_IF_TRIGGERED: `packages/AGENTS.md` and `tests/AGENTS.md`, focused contracts, `.engineering/TEST-BENCHMARK-PLAN.md`, `DEPLOYMENT.md`, CI workflows, portable workspace #402, dispatch adapter #408, schema registry #427; Security specialist proof for risk, provider credentials and Git writes. No optional input supplants mandatory truth.

## EXISTING CODE / OWNERSHIP REUSE (read-only snapshot)

- `packages/contracts/src/work-order.ts` blob `9a665ae1a4dff817349d48d799dfaa105eb5aff8`: `parseWorkOrderContract`, `resolveWriteAuthority`, `normalizeWorkOrderPath`, `matchesWorkOrderPattern`, `workOrderContractDigest`, `maxWorkOrderRisk`, risk enum `LOW | STANDARD | ELEVATED | HIGH_ASSURANCE`. Use it for schema validation and *per-path* authority; **glob-vs-glob intersection and transitive outputs are new proof obligations**, not known capabilities of `resolveWriteAuthority`.
- `packages/preflight/src/change-impact.ts` blob `5aff784c3f68e295a9b6a98ef4086d324a69fb54`: `normalizeChangePath`, `classifyChangeImpact`; risk and unclassified-path inflation, no implicit scheduler permission.
- `packages/task-context-compiler/src/s07-tiered-context-lock.ts` blob `2e03843a8bf24582e50f1a58add82598e69f8ab0`: `compileTieredContextLock`, stale-risk binding; plan an adapter, not an alternative authority compiler.
- `packages/assurance-pipeline/src/gef-gate.ts` blob `aaafa732305f20c4738429a8b6e29879d2156819`: `decideGefGate`, `verifyGefGateReceipt`, `gefGateReceiptIsCurrent`; has **false** for self-selected required checks, relax ruleset, promote or release. The Agent Pool inherits those restrictions.
- `packages/AGENTS.md` blob `fa14a7eb190d722382507402f12d82a72a934237` and `tests/AGENTS.md` blob `b08e069681f685c2cd8a567cc0cb5a837583bb78`: deterministic APIs, strict TS, adversarial tests, no weakening.

No source-code, glob, module owner, directory or public API changes are asserted or authorized by this mapping. Confirm actual package/module target(s) and neighboring test APIs before future admission.

## SCOPE / FUNCTIONAL CONTRACT

1. Input graph contains only **individually admitted, source-bound** Work Order contracts plus verified predecessor state, exact base/head, lock digest, read/write manifests, generated outputs and current risk proof. Issue labels, chat directives and draft PR states never suffice as execution authority.
2. Build a deterministic, cycle-detecting DAG. Handle duplicate/missing WO ID, inconsistent dependency, distinct required predecessor states and partially promoted predecessors. `PLANNED`/unverified/blocked never counts as promoted.
3. Normalize explicit write/read globs, changed-file probes, renames/moves, case-folded collisions on supported systems, symlink aliases and generated effects before proving pairwise disjointness. If exact intersection or observed write closure cannot be proved, classify `UNKNOWN` and serialize/block, **never guess independent**.
4. Pair classification stable vocabulary: `HARD_CONFLICT`, `ORDERED_DEPENDENCY`, `SOFT_SHARED_READ`, `INDEPENDENT`, `UNKNOWN`. A pair may be safely parallel only if independently admitted and `INDEPENDENT` or a strictly read-only `SOFT_SHARED_READ` proven free of all shared writes, provider-side mutations and unsafe build outputs.
5. Default `SEQUENTIAL_SAFE`; `DAG_PARALLEL` only with positive evidence and explicit per-project cap. The scheduler may reserve up to `min(cap, proven-ready-count)`; cap `0`, negative, NaN, unknown or unbounded is INVALID/BLOCKED. Never invent a license/cost/transport from available CPUs.
6. Each execution slot gets a unique **OS-independent workspace identity**, distinct worktree path + Git branch + effective WO-specific Context Lock; no shared mutable workdir, build artifacts, cache writes without isolation proof, ports/service side effects or credentials. Paths are a runtime allocation, not canonical identity. Workspace factory #402 owns provisioning; adapter #408 owns transport and retry; scheduler owns dependency/reservation logic.
7. Reservation + dispatch must be idempotent across webhook replay, 429 retry, restart and duplicate notification; lock on immutable WO/source+stage+workspace ID, not a mutable issue label. Never dispatch under expired/unknown token, quota, security or role policy.
8. Every agent emits source-bound progress/heartbeat/validated-stage receipts and evidence references. Crash, stale heartbeat, workspace cleanup failure, dirty worktree or rejected generated output stops/reclaims only when an explicit recovery proof deems safe.
9. Predecessor correction/merge checks reverse dependency closure, invalidates affected successors and rebinds their base, locks and required evidence. Unrelated validated work must not be re-run without causal invalidation.
10. Scheduler outputs a **proposed** deterministic merge order and plan. It NEVER performs merges, checkpoint promotion, npm/tag/release, irreversible mutations or Owner/independent review; downstream exact-head audit and protected merge authority remain separate.
11. A future installable profile may expose the policy *after* own production evidence and distinct Owner promotion (#402/#406), not merely because a planning PR is green.

## NON-GOALS / EXCLUSIONS

NO auto-merge; NO provider writes without separately authorized transport; NO scheduled autonomous background Codex from this planning branch; NO modification of security policy, branch protection, scanner, CI, release workflow, package lock/manifest, canonical checkpoint, frozen Architecture/DoD or established product denominator. No local daemon/cloud service prerequisite; no paid plan, force push or silent history rewrite. Do not assume WO-002 Evidence Bundle/packets are already implemented just because planned interface names exist.

## WRITE BOUNDARY

**THIS PLANNING PR only:** `.engineering/work-orders/GBS-MOD-WO-003.md`; `.engineering/planning/GBS-MOD-WO-003-SCHEDULER-DESIGN.md`; `.engineering/context-locks/GBS-MOD-WO-003-PLANNING.json`. Nothing else.
**FUTURE IMPLEMENTATION WRITE_ALLOWED:** **NOT ASSIGNED**. A later separately approved and SHA-rebound Work Order/lock must first identify actual package owners, tests and exact globs. This planning packet does not authorize any `packages/**`, `tests/**`, workflow, `.github/**`, `AGENTS.md`, root manifest, checkpoint, data migrations or provider mutations.
**Preserve:** V1 1088/1088; V1.2 3/10; published stable `@gef-bootstrap/cli@1.1.2`; #439 21 UNKNOWN historical all-ref secrets blocking 1.1.3.

## ACCEPTANCE / NEGATIVE TEST MATRIX

A1. Three independent ADMITTED fixture WOs with distinct exact locks and worktree/branch identity are scheduled concurrently **only in DAG_PARALLEL with cap >=3**, each with separate receipt; the **same fixture in SEQUENTIAL_SAFE** dispatches max one.
A2. Glob intersection (including different spellings, parent-child, rename, generated path, lockfile, workflow and symlink alias) forces `HARD_CONFLICT` or `UNKNOWN`, never a parallel write collision.
A3. A dependent WO cannot dispatch until exact predecessor promoted state is verified from canonical source. `CORRECTION_REQUIRED`, DRAFT, `STATE_CONFLICT`, missing evidence or wrong branch blocks it.
A4. A predecessor correction/merge invalidates just transitive dependent nodes, preserving identical source-bound proof for unrelated nodes; changed shared base requires proof of unaffected bindings.
A5. Unknown path ownership, incomplete glob intersection, missing lock, stale HEAD, incomplete dependency graph, untrusted provider response and ambiguous source state yield `UNKNOWN/BLOCKED`, even with free concurrency slots.
A6. Crash after valid stage receipt resumes without redoing unrelated validated stages; dirty workspace/cleanup failure never permits workspace reuse or contamination.
A7. Same immutable graph + config generates same stable planned merge order across permutation of issue/API results; any predecessor integration causes required downstream source/lock rebind; no ungoverned rebase or Git force push.
A8. All receipts have `mayApprove=false`, `mayMerge=false`, `mayPromote=false`; even all-green tests cannot flip these flags. Owner/ChatGPT audit `NOT_INDEPENDENT`.
A9. Invalid/unbounded concurrency cap rejected. Cap 1 means serial execution, cap 2 dispatches at most two proven independent items, cap 3 A1 proof; idempotent launch under event replay/429.
A10. Once **separately promoted**, bootstrap fixture installs the governed policy/profile reproducibly; absence of install evidence in the current planning phase = `NOT_VERIFIED`, not PASS.

**Additional attack fixtures:** case-insensitive filesystem alias, symlink traversal, working tree with spaces, mixed Windows/Linux separators, truncated git diff, untrusted generated path, two WOs racing one submodule/config, double dispatch, stale heartbeat, missing reviewer, canceled agent with partial file write, malicious issue body trying to label itself admitted, missing platform support and external Codex bridge unavailable.

## PROOF LADDER / STOP

PLANNING now: exact source fingerprint inventory; scoped three-file doc-only diff; parsable non-executable planning lock; hosted required checks; owner exact-head `NOT_INDEPENDENT` review; STOP.
FUTURE ADMISSION requires #451 resolution via its separately authorized protected action, canonical checkpoint parity, actual #396 interface maturity/compatibility, newly Owner-admitted ELEVATED implementation WO, freshly bound effective Context Lock with precise runtime write globs, full Security/S4 and CI proof.
FUTURE EXECUTION only by governed Codex adapter with sandbox/owner approvals and no self-merging; package+focused/adversarial tests and cross-platform validation; provenance/evidence; separate owner/security independent review where required; separate checkpoint promotion.
**Planning STOP:** `GBS_MOD_WO_003_PLANNING_PACKET_EXACT_HEAD_AUDIT_READY_NOT_ADMITTED`.
**Future implementation STOP:** `GBS_MOD_WO_003_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`.
