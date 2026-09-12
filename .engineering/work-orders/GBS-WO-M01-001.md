# GBS-WO-M01-001 — Implement Deterministic Work Plane Kernel Foundation

Status: `EVIDENCE_PENDING`

## OBJECTIVE
Implement the production foundation of `GBS-M01 — Deterministic Work Plane Kernel` from frozen S01-S05 contracts, creating a deterministic TypeScript/Node LTS library-first substrate with typed command routing, invocation lifecycle, process-exit projection and shared typed error/result semantics.

## CONTEXT
This is the first functional construction increment after Source Pack closure. The repository now contains the first functional TypeScript workspace for M01. GEF Bootstrap itself is implemented exclusively by ChatGPT + connected project tools; Codex is prohibited.

## SOURCE BINDING
Execution began from `main` after the approved M01 module gate. The implementation candidate is reviewed only against the final PR head after CI and evidence collection.

Authoritative inputs:
- `.engineering/ARCHITECTURE.md`
- `.engineering/SECURITY.md`
- `.engineering/TEST-BENCHMARK-PLAN.md`
- `.engineering/DEFINITION-OF-DONE.md`
- `.engineering/BACKLOG.md`
- `.engineering/DEPLOYMENT.md`
- `.engineering/SOURCE-HIERARCHY.md`
- `.engineering/M01-MODULE-GATE.md`
- `planning/PLANNING-PROTOCOL.md`
- `planning/modules/area-a-foundation-and-governance/m01-cli-kernel/S01-runtime.md`
- `S02-command-router.md`
- `S03-lifecycle.md`
- `S04-exit-codes.md`
- `S05-error-model.md`

## SCOPE
### Repository/build foundation required for this work order
Because no functional workspace existed before this increment, this Work Order creates only the minimum production-grade monorepo substrate needed to implement and test M01 without pre-implementing later modules:
- root npm workspace/package metadata;
- strict TypeScript build configuration;
- deterministic test scripts;
- `packages/contracts` for M01-owned/shared machine types that cross package/API boundaries;
- `packages/kernel` for M01 runtime/router/lifecycle/error mechanics;
- a minimal `packages/cli` projection only where needed to prove exit-code mapping and library-first separation;
- focused tests required by M01 acceptance.

### Functional obligations
Implemented candidate obligations include:
1. runtime context and injectable ports for clock, IDs, environment, process, filesystem, Git/provider/persistence references without implementing later owners;
2. cheap side-effect-free library import/startup;
3. stable command IDs `gef.<domain>.<action>` and explicit registry composition;
4. duplicate/unknown/invalid registration failures;
5. pre-handler input/capability/policy/target/budget hook ordering through neutral contracts;
6. one-primary-handler routing and prohibition of recursive router dispatch by design;
7. compact typed execution context with runtime identity;
8. explicit logical invocation lifecycle and exactly one terminal classification per run;
9. cancellation/timeout distinction and propagation into verification/receipt contracts;
10. bounded read concurrency plus conservative mutation serialization;
11. frozen exit-code mapping `0,10,20,30,40,50,60,70,80,90`;
12. 13-category typed error model with global `gef.<category>.<reason>` codes;
13. mandatory non-success severity, retryability and recoverability metadata;
14. bounded/redacted cause representation and exclusion of raw stack traces from normal machine output;
15. structured remediation action IDs rather than self-authorizing shell text;
16. deterministic registry/introspection ordering where owned by M01;
17. structured telemetry hook boundary without implementing M43 storage/schema ownership.

## OUT OF SCOPE
Do not implement competing ownership for M02+ engines. Neutral interfaces/ports and deterministic test doubles are allowed and required where necessary.

## ARCHITECTURE RULES
- TypeScript strict mode, modern ESM-oriented Node LTS semantics.
- Monorepo modular workspaces.
- Library/application API first; CLI thin and non-authoritative.
- Core/kernel must not import GitHub-specific models.
- No daemon baseline.
- No hidden network or repository mutation on import/startup.
- Child-process abstraction defaults to `executable + argv`.
- Canonical/derived/operational state classes remain distinct.
- No worker-thread or polyglot/native baseline.

## SECURITY CONSTRAINTS
- no secret values in runtime identity, normal errors, telemetry hooks or test snapshots;
- no implicit S4 authorization;
- no shell interpolation mechanism in the default process port;
- errors fail toward less disclosure;
- cancellation/failure cannot be returned as successful completion;
- partial/recovery-required truth outranks generic failure projection where applicable.

## ACCEPTANCE CRITERIA
A candidate implementation is acceptable only if all applicable conditions below are proven at one exact head:
1. workspace installs/builds deterministically from committed package metadata/lockfile;
2. TypeScript strict typecheck passes;
3. package dependency direction conforms to Architecture;
4. importing contracts/kernel causes no filesystem mutation, network request or broad repository scan;
5. typed library invocation functions without CLI parsing;
6. registry rejects duplicates and unknown command IDs without fuzzy fallback;
7. capability/policy/target/precondition failures stop before handler side effects in focused tests;
8. command handler mapping is exact and deterministic;
9. lifecycle tests cover success, blocked, cancelled, timed-out, failed, recovery-required and partial-external-effect semantics;
10. successful mutation-class result cannot reach terminal success without verification/receipt hook completion;
11. exit-code projection matches S04 and never contradicts typed terminal result;
12. error envelopes match S05 categories/reasons/severity/retry/recovery rules;
13. normal machine output omits stack traces/secrets;
14. cause chains are bounded, acyclic and deterministically serialized enough for current M01 needs;
15. remediation uses structured action IDs/params;
16. focused security tests for shell-free process request representation, redaction and authorization boundaries pass;
17. no M02+ semantic responsibility is accidentally implemented inside M01;
18. evidence bundle maps acceptance criteria to test/proof/exact head;
19. semantic review reports no HIGH/CRITICAL finding;
20. checkpoint and weighted progress are promoted only after evidence-backed verdict.

## REQUIRED TESTS / PROOF
T0-T2 focused validation plus security checks, import-side-effect proof, deterministic clock/ID proof, cancellation/timeout, bounded concurrency, mutation serialization and exact-head audit are required for this increment.

## DELIVERABLES
- functional TypeScript workspace foundation needed by M01;
- contracts/kernel code and minimal thin CLI projection;
- tests;
- committed dependency lockfile;
- exact-head evidence/review record;
- updated checkpoint/progress after verdict.

## REVIEW FORMAT
Review reports exact base/head SHA, files changed, architecture/security conformance, commands/tests, acceptance mapping, fixed failures, open findings, `MODULE_DONE` eligibility and promoted progress only if approved.

## PROGRESS RULE
M01 frozen weight is `20`. This Work Order does not itself earn weight. On evidence-backed `MODULE_DONE`, earned project weight becomes `36/1088 = 3.31%`, with `1052/1088 = 96.69%` remaining. Do not publish that promoted percentage until APPROVED.

## CURRENT EVIDENCE STATE
- PR: `#47`
- preliminary local validation before final hardening: PASS
- final hardening adds explicit delegated ports, runtime identity, bounded read concurrency, conservative mutation serialization and cancellation/deadline propagation into verification/receipt boundaries;
- hosted validation must pass on the final exact PR head before semantic verdict;
- no production weight promoted yet.

## STOP CONDITION
Stop only at one of:
- `M01_IMPLEMENTATION_CANDIDATE_READY_FOR_EVIDENCE`
- `SOURCE_CONFLICT`
- `SCOPE_EXPANSION_REQUIRED`
- `BLOCKED_EVIDENCE`
- `NEEDS_ARCHITECTURE`

No silent movement to M02 is permitted before the M01 implementation verdict and checkpoint promotion.
