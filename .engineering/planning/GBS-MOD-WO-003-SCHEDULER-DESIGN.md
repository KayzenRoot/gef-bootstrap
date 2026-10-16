## 2026-10-14 source addendum, current scheduler boundary

**Current reference:** `main@e71120266c40235089444c9c0122280c5da4e5bd`, after protected [PR #451](https://github.com/KayzenRoot/gef-bootstrap/pull/451). The older source `main@e0356f1de5dae2351d8701a76c736a22832929c2`, former Work Order blob `1d468631157ae3c0a38baf9fb678c44021fa0a61`, and checkpoint `STATE_CONFLICT` sentences below are **historical creation-time facts**, not active blockers; see current Work Order blob `1f3214a3bdf8de644fd91709e586feadd757be9d`. Canonical checkpoint pair now agrees at Markdown `686a2e3f7da1b541f9a4ee10a4d9432358105e0a` / JSON `4a653772c31dffee869a9bac17345241cfc6db03`, but **WO-002 remains implementation-not-started and without effective lock**. The scheduler must still *fail closed* on any **future** checkpoint disagreement, stale lock, missing predecessor, actor mismatch, unsafe shared resource, S4 or Security gap. Do not remove the `STATE_CONFLICT → BLOCKED` rule from the design.

**Current effectivity:** WO-003 remains planning-only `doNotExecute=true`, `doNotDispatch=true`; no worktrees, Codex, reservations, implementation writes, release, merge or checkpoint promotion. Current source correction is only a documentation update; tests/fixtures/CI for WO-003 have not been created, and original 10 acceptance criteria remain **NOT_RUN**. Current ADR-0008 makes Codex the sole code/test author **if separately admitted**. Dependency WO-002 #396, workspace factory #402 and dispatch #408 remain unimplemented/unadmitted as applicable. Historical security #439 has 21 UNKNOWN and release 1.1.3 blocked.

**STOP:** `GBS_MOD_WO003_SCHEDULER_DESIGN_CURRENT_SOURCE_PLANNING_ONLY`.

---

# GBS-MOD-WO-003 — Deterministic Scheduler Design / Test Specification

**STATUS: INFORMATIONAL PROPOSAL, NOT AN ADMITTED ENGINEERING DECISION.**
**Issue:** [#397](https://github.com/KayzenRoot/gef-bootstrap/issues/397). **WO blob:** `1d468631157ae3c0a38baf9fb678c44021fa0a61`. **Base:** `main@e0356f1de5dae2351d8701a76c736a22832929c2`.
**Producer:** ChatGPT governance planning, NOT_INDEPENDENT. **Executable implementation:** NO; Codex-only under ADR-0008 after future admission. **Security and state:** STATE_CONFLICT #451, historical secrets #439 21 UNKNOWN.

This is a proposed data-flow for the future implementation and MUST NOT be mistaken for a registered runtime/schema, evidence, approved Source Pack extension, effective scheduling policy, GH workflow configuration or dispatch instruction.

## 1. Ownership boundaries

| Plane / owner | Proposed responsibilities | Must NOT assume |
| --- | --- | --- |
| M14/M16 + `packages/contracts/src/work-order.ts` | Validate versioned WO, authorized write/read paths and risk before any schedule decision | `resolveWriteAuthority` proves two wildcard globs disjoint; it validates specific path authority |
| M04/WO-001 preflight + source hierarchy | Verify exact canonical risk/source/checkpoint truth and impact, produce fail-closed context state | A green PR CI equals promoted predecessor |
| WO-003 scheduler (future) | Build graph, prove conflict class, allocate bounded ready tokens, derive deterministic queue/reservations, revoke stale reservations and compute dependency invalidation | GitHub Issues, agent transport or local worktree are sources of semantic policy |
| #402 workspace factory (future) | Isolated directory allocation, worktree and branch lifecycle, health, dirty worktree, cleanup/recovery | Fixed absolute Windows path or a shared mutable worktree |
| #408 dispatch adapter (future) | Codex transport/availability/auth, bounded 429 retry, launch idempotency, quota signaling and session receipts | ChatGPT/GitHub automatically has a direct Codex bridge |
| #396 Evidence Bundle (future) | Collect exact-head tests/checks/provider facts, sanitize and map acceptance to proof | A logged success or missing status proves acceptance; #396 not yet implemented |
| GEF Gate + Owner/Security reviewer | Required risk/ruleset checks, exact-head audit and independent specialist proof where applicable | Scheduler can grant self-approval, merge, checkpoint promotion or release |

## 2. Proposed API shape (not a schema)

```text
ScheduleRequest:
  repositoryId: exact canonical owner/repo
  sourceSnapshot: {mainSha, checkpointMdBlob, checkpointJsonBlob, policyDigest}
  admittedWorkOrders[]:
    {id, workOrderDigest, risk, baseSha, effectiveContextLockDigest,
     allowedPaths, forbiddenPaths, predictedWrites, generatedWrites,
     requiredPredecessorIds, predecessorRequiredState,
     externalMutableResources, currentStage, stageReceiptDigest}
  concurrency: {mode: SEQUENTIAL_SAFE | DAG_PARALLEL, requestedCap, hardPolicyCap}
  observedResources: {platform, pathCasePolicy, workspaceCapacity,
                      agentAvailability, modelQuotaState}
  providerReadQuality: COMPLETE | PARTIAL | UNAVAILABLE

SchedulePlan:
  schemaVersion: proposed only
  sourceSnapshotDigest
  graphDigest, pairConflictMatrixDigest, readySetDigest
  selectedMode, enforcedCap
  decisions[]: {workOrderId, disposition, reasonCodes, dependencies,
                collidingPaths, selectedWorkspaceIdOrNull,
                requiresFreshEffectiveLock, receiptDigest}
  proposedMergeOrder[]: stable, unprivileged
  mayDispatch: false unless future separately admitted runtime authorizes
  mayApprove: false, mayMerge: false, mayPromote: false, mayRelease: false
```

This illustrative shape must be versioned under a future authorized contract owner; later #427 Schema Registry is only PLANNED and cannot be presumed current. Avoid widening existing strict Work Order schema with unknown fields without an explicit migration and validation plan.

## 3. Deterministic graph compiler and conflict classifier

**Input validation:** exact current project state; no SOURCE/STATE_CONFLICT; required WO/lock digests; verified predecessors; complete read/write closure, real platform policy. A planned issue, outdated lock, unknown actor, missing owner S4 authority or missing worktree factory/bridge at execution time => BLOCKED. Treat mutable GitHub labels/comments as *untrusted observations*.

**Graph:** Canonical node ID = Work Order ID + admitted binding, not PR title. Dependency edges = `predecessor -> dependent`; reject self-edge, duplicate distinct nodes with same ID, missing predecessor and cycles, preserve stable lexicographic ID ordering for topological ties. Unsupported cross-repository dependency makes completion `UNKNOWN`, not implicitly satisfied.

**Pair matrix precedence** (no inference of actual safety from simple string comparison):
1. Same WO, duplicated lease, any unsatisfied direct/transitive prerequisite, ordering explicitly required: `ORDERED_DEPENDENCY`, with predecessor required canonical state.
2. Known overlap of normalized explicit write paths, implicit build/generated outputs, provider mutable side effects, shared workspace/cache/lockfile, rename/move overlap, symlink alias: `HARD_CONFLICT`.
3. Any missing owner, incomplete glob intersection, missing generated output list, unavailable resolver, unknown target FS case behavior or parse conflict: `UNKNOWN`.
4. Shared **read-only** material without shared mutable side effect and with independently proven immutable source identities: `SOFT_SHARED_READ`. It can be parallelized only if additional proof says no implicit writes and each executor has a separate worktree.
5. Proved pairwise independent with no other risk/dependency closure: `INDEPENDENT`.

Never claim all wildcard globs non-overlapping because a few sampled concrete paths did not match. Build a sound intersection proof for supported glob dialect or conservatively UNKNOWN. Use existing `normalizeWorkOrderPath`/change-impact normalizers for known concrete paths, but account for OS-specific path interpretation and case-folding; do not silently permit unsupported glob syntax.

**Read-while-write:** source snapshot is pinned by SHA; a reader sharing the same branch name or mutable generated cache with a writer is *not* read-only independent. A shared immutable content-addressed cache requires integrity+concurrent reader proof and no unsafe writer. Absent that, class UNKNOWN/HARD_CONFLICT.

## 4. Dispatch-ready queue, budgets and reservations

```text
CONSERVATIVE_SELECT(request):
  if current checkpoint pair in conflict: return BLOCKED
  validate identities, permissions, admitted WO + lock + dependencies
  if partial graph, missing resource owner, impossible cap: return BLOCKED
  normalize and compute pairwise conflict matrix
  eligible = nodes whose predecessors are canonically promoted,
             whose Context Lock is current and whose actor/platform is ready
  if mode == SEQUENTIAL_SAFE: capacity = 1
  else: capacity = min(requestedCap, hardPolicyCap, provenResources)
  order eligible deterministically by canonically admitted priority,
       then dependency-ready sequence and stable Work Order ID
  reserve only pairwise compatible work with distinct workspace IDs
  emit proposed non-executable plan/receipts; never perform provider mutations
```

This pseudo-algorithm describes a **future implementation**. Hard cap must be positive, finite and policy-governed. A request for 3 agents is not proof three independent WOs exist. GPU/CPU/locale never grants extra safety authority. Worktree allocation (WO-008) and Codex transport (WO-013) require separate admitted contracts. Default future mode = `SEQUENTIAL_SAFE`. No fixed recurring background task is created by this document.

**Progress proof:** Per-agent `{WO, stageId, sourceSha, effectiveLockDigest, workspaceId, branch, validatedProofDigest, timestamp, leaseId, predecessorStageReceipt}`; latest validated stage survives cancellation/restart only if exact binding remains valid. Heartbeat timeout alone cannot authorize cleanup/reuse of a dirty worktree, nor revoke valid history.

## 5. Narrow invalidation

Let `children(x)` be graph successors. After a predecessor correction or merge:
- Determine changed source/blob/contract/lock/branch/required-checks and any shared immutable cache dependencies.
- Recompute exactly reverse dependent closure for changed nodes, and for nodes that consume changed common policy/source even without a declared WO predecessor.
- Revoke stale active reservations, stop affected agents at safe boundary, preserve unaffected validated stage receipts whose full dependency digests remain identical.
- Rebind new exact source before requeue. No force push, ungoverned rebase, autonomous merge or deletion of evidence.
- If dependency knowledge is incomplete, stop/widen affected closure rather than falsely claim an independent unaffected node.

## 6. Test fixtures, mapped to Issue #397 A1–A10

| Fixture | Expected result |
| --- | --- |
| 3 independent WOs with 3 isolated locks/worktrees; DAG_PARALLEL cap=3 | 3 reservations, all distinct, no merge |
| Same input SEQUENTIAL_SAFE or cap=1 | <=1 reservation |
| cap=2 with 3 independent WOs | <=2 reservations |
| two allowed-write globs have path intersection | HARD_CONFLICT, <=1 of pair |
| parent/child path overlap, two generated outputs target same manifest | HARD_CONFLICT |
| rename/move, symlink path, Windows case-fold alias | HARD_CONFLICT or UNKNOWN, never parallel |
| two WOs sharing immutable readonly proof | SOFT_SHARED_READ only with complete immutability proof |
| dependent A->B->C, A not promoted or in correction | B,C blocked; any independent D potentially ready |
| correction of A invalidates A-dependent B/C, but D's source digests identical | B/C revoked, D retained |
| new main SHA invalidates Context Lock of B | B BLOCKED pending new lock |
| duplicate issue event/agent restart/429 retry | same idempotency key, no duplicate Codex session |
| stale heartbeat + dirty worktree / cleanup failure | BLOCKED workspace reuse |
| unknown glob syntax, truncated provider pagination, missing owner | UNKNOWN, fail closed |
| invalid cap (-1, 0, NaN, huge > hard cap without policy) | input rejected or bounded with explicit reason, never unbounded |
| cycle A->B->C->A / missing predecessor | DAG compiler rejects, no dispatch |
| source pack decision changed while scheduler active | affected nodes invalidated; no stale admission |
| successful CI but missing Owner reviewer/S4 permission | no approval/merge |
| install fixture, WO-008/profile not promoted | A10 NOT_VERIFIED, no automatic installer |

Actual unit tests, fixtures, integrations and platform checks may be authored **only after future effective admission** and by the code-author role permitted by current ADR-0008. This document does not claim those tests have run.

## 7. Readiness to future implementation and minimal token cost

At a fresh authorized handoff, the executor should consume: Issue #397 and its 10 immutable acceptance criteria; this WO-003 plan and decision matrix; Source Hierarchy/paired checkpoints at actual current HEAD; effective Work Order machine contract; source-bound Context Lock; current package export map and existing #402/#408 interfaces; required CI/risk/rollback/stop. Ask only for evidence truly missing from the minimum sufficient context. Pin fingerprints, create isolated branch and baseline tests only **after** admission; split into Codex implementation stages:
- C1 deterministic graph+path classification contracts and exhaustive negative tests;
- C2 scheduling/reservations/idempotent proposed plans and test suite;
- C3 separate worktree/bridge integration (only if those earlier modules are admitted and promoted), crash/recovery/stop;
- C4 exact-HEAD packet/CI full regression, Owner audit and separate promotion.

**HARD STOP:** `GBS_MOD_WO_003_SCHEDULER_SPEC_REVIEW_ONLY_NO_DISPATCH_OR_CODE_AUTHORITY`.
