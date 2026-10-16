# GBS-V12-WO-003 — Marathon + Delta Assurance: fast-track Wave A

**Tracking:** [Issue #462](https://github.com/KayzenRoot/gef-bootstrap/issues/462) · Fast delivery [#437](https://github.com/KayzenRoot/gef-bootstrap/issues/437).
**Status:** `ADMITTED_CONDITIONALLY` após PR #465/#466; emenda D-0066 de ator ChatGPT ainda `PENDING_PROTECTED_MERGE` nesta branch candidata. O código do produto não é considerado iniciado na `main`.
**Historical planning read base:** `main@8254918df8eaa7189105236d44c0ff8fdf3ccc6b`. **Current amendment read base:** `main@af9a0746b8542f212fd169ffd11e282c409c8528`; implementation must use the actual post-amendment `main` and source hashes after protected merge. No self-admission by this Markdown alone.
**Source:** `.engineering/REQUIREMENTS.md` U12-03/U12-05; V1.2 Source Pack, DoD, Architecture, Security, ADR-0008, AGENTS, effective Context Lock and CHECKPOINT have precedence.

## Outcome and why now

Deliver **2/7 still missing universal V1.2 items in ONE coherent Work Order**. Existing credited 3/10 (U12-01/U12-02/U12-04) must remain unchanged until evidence-bound promotion. This WO is distinct from the Agent-Native maintenance `GBS-MOD-WO-002` issue #396. Prioritize real usability for other GEF-governed systems: fewer repeated Codex turns, resumable bounded work, tests based on actual impact, without hiding required failures.

## Scope and objective acceptance

### A1. U12-03 / C04 Marathon execution on existing M14–M18 + M63

- Reuse `task-context-compiler`, `execution-pack-compiler`, `checkpoint-engine`, `resume-engine`, `m62-m63-final` rather than create second executor or hosted worker service.
- Compile an admitted dependency-ordered wave graph and immutable per-step execution intent; refuse cycles, write conflicts, unadmitted nodes and source/lock drift.
- Bounded continuation, pause/resume and receipt reuse. A crash/restart/replay must **not** duplicate promoted side effects. When the local Git cache alone is stale, first recover safely per merged Fast Resume guidance; a true canonical lock mismatch still blocks affected writes.
- Track each result `PENDING|ACTIVE|VERIFIED|FAILED|BLOCKED|SKIPPED` with exact work order ID, actor, base/head, dependency proof and stop reason, exposing next legal action. Independent admitted waves may continue where their proof/source remains valid.
- Realistic negative cases: duplicate delivery, changed source SHA, partial step completion, retries that would double-apply, conflicting write sets, cycles, cancelled execution, stale but recoverable local refs, unexpected provider failure. Fail closed for protected operations.

### A2. U12-05 / C06 Delta Assurance on existing M24–M28

- Reuse `evidence-engine`, `proof-graph`, `heds-delta-review`, `assurance-pipeline`, `test-impact-engine` and shared contracts.
- First introduced root failing test/proof is preserved with original evidence, current reruns, causal repair hypothesis and dependency closure; no loss by passing retry or flake reclassification.
- Separate observed flake candidates, confirmed nondeterminism, deterministic failure and unknown root cause; retain immutable per-attempt/HEAD/toolchain identity. Bounded retries cannot erase a HIGH/CRITICAL finding.
- Constrained impact-based intermediate verification, reusing unchanged valid proof; **all applicable mandatory final tests and branch CI/security/platform assurance still run at the final acceptance gate**.
- Adversarial fixtures: random flake, deterministic false negative/true negative, modified source/proof dependency, replay of old PASS, root-cause mismatch, wrong-head evidence, waiver attempt against required security failure.
- No fake performance percentage. If real comparable samples are insufficient, return `UNAVAILABLE`/unmeasured.

### A3. Compatibility and authority

- Keep stable CLI `1.1.2` behavior and V1.2 U12-01/U12-02/U12-04 exports and regression suites passing.
- Preserve ADR-0008 except the narrow adopted ADR-0012/D-0065 and proposed D-0066 executor supersession: ChatGPT or Codex may implement this WO **only after** the specific governed actor amendment is protected-merged and effectivity proven; owner audit `NOT_INDEPENDENT`, Security/DoD, independent specialist requirements and protected merge remain. Do not automate privileged/release operations.
- No subscription/paid tools, external persistent service or second agent/orchestration runtime.
- Implement the **complete vertical slices A1+A2**, not merely types/mock files. If one U12 remains incomplete, report its individual `NOT_IMPLEMENTED` status, never artificially award 5/10.

## Source and preliminary file-intent capsule

**MUST_READ** (canonical, tracked by proposed lock): `.engineering/CHECKPOINT.md`, `.engineering/CHECKPOINT.json`, `.engineering/REQUIREMENTS.md`, `.engineering/ARCHITECTURE.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/SECURITY.md`, `.engineering/DECISIONS-LEDGER.md`, `AGENTS.md`, this WO, prior V1.2 WOs #372/#380 and effective Fast Resume guidance. Inspect actual package public exports before writing.

**PROPOSED_WRITE_ALLOWED, not yet admitted until exact future effective lock and Owner approval:**
`packages/task-context-compiler/src/**`, `packages/execution-pack-compiler/src/**`, `packages/checkpoint-engine/src/**`, `packages/resume-engine/src/**`, `packages/m62-m63-final/src/**`, `packages/evidence-engine/src/**`, `packages/proof-graph/src/**`, `packages/heds-delta-review/src/**`, `packages/assurance-pipeline/src/**`, `packages/test-impact-engine/src/**`, `packages/contracts/src/**`, `tests/v12-wo-003-*.test.mjs`, `.engineering/evidence/GBS-V12-WO-003-*`, `.engineering/checkpoint-deltas/GBS-V12-WO-003-*`. Narrow this list if the inspect-first actual exported APIs allow; it is a maximum, not a reason to churn unrelated code.

**WRITE_FORBIDDEN:** canonical checkpoints until later separately authorized promotion, `.github/workflows/**`, GitHub branch/security rulesets, `.engineering/SECURITY.md`, Constitution, DoD, ADRs, `package.json`, lockfile, CLI package/release, tags/deployment/npm and all code outside the admitted list. Additional write surfaces must be owner-approved through a scoped correction before use, no inferred permissions.

## One-pass authorized executor implementation and final evidence

Once a **single exact-base Context Lock** and Owner admission are effective:
1. `PREFLIGHT`: on fresh main, compare canonical source blobs, check author/write boundary and actual APIs. Handle recoverable Git cache drift via automatic fetch/worktree; do not stop for stale cache. Stop true normative lock/source conflict only for affected operation.
2. `BUILD`: implement A1 (Marathon) and A2 (Delta Assurance) sequentially in one authorized ChatGPT/GitHub or Codex mission, with internal checkpoints *within the task* instead of a new Owner approval per microchange. Focused deterministic and adversarial tests per coherent vertical slice; repair within admitted paths in same run.
3. `FINAL ASSURANCE`: run required `npm run build`, `npm run typecheck`, targeted U12 and regression `npm run validate`, security audit and all required exact-HEAD GitHub contexts. No "test everything only after code is done": focused checks during work, full proof at final gate.
4. `DELIVER`: one scoped implementation PR and Evidence Bundle with actual baselines/run attempts/check statuses; `PROPOSED_ONLY` Checkpoint Delta. Owner ChatGPT reviews the actual final HEAD, not every internal attempt. If fails, correct on same PR.
5. **STOP** before protected implementation merge or checkpoint promotion, no WO-004 start while dependent acceptance remains unresolved.

**Progress:** only after future separately authorized code integration + current native/end-to-end assurance + owner promotion can U12-03 and U12-05 increment the core from 3/10 to a maximum 5/10. Current V1.2 stays 3/10.

**Current candidate STOP:** `GBS_V12_WO_003_OWNER_AUTHORIZED_CHATGPT_EXECUTOR_AMENDMENT_PENDING_PROTECTED_MERGE_AND_FINAL_PREFLIGHT`.
