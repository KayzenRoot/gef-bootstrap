# GBS-WO-M01-001 — Implement Deterministic Work Plane Kernel Foundation

Status: `ADMITTED_READY`

## OBJECTIVE
Implement the production foundation of `GBS-M01 — Deterministic Work Plane Kernel` from frozen S01-S05 contracts, creating a deterministic TypeScript/Node LTS library-first substrate with typed command routing, invocation lifecycle, process-exit projection and shared typed error/result semantics.

## CONTEXT
This is the first functional construction increment after Source Pack closure. The repository currently contains governance/planning only and no functional package/runtime implementation. GEF Bootstrap itself is implemented exclusively by ChatGPT + connected project tools; Codex is prohibited.

## SOURCE BINDING
Execution must begin from the exact `main` state that contains M01-S05 merge and the approved M01 module gate. Before mutation, bind current main HEAD and re-check for source drift.

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
Because no functional workspace exists yet, create only the minimum production-grade monorepo substrate needed to implement and test M01 without pre-implementing later modules:
- root npm workspace/package metadata;
- strict TypeScript build configuration;
- deterministic test configuration/scripts;
- `packages/contracts` for M01-owned/shared machine types that cross package/API boundaries;
- `packages/kernel` for M01 runtime/router/lifecycle/error mechanics;
- a minimal `packages/cli` projection only where needed to prove exit-code mapping and library-first separation; no broad UX/help system;
- focused tests/fixtures required by M01 acceptance;
- developer-facing M01 implementation documentation/evidence manifest as needed.

### Functional obligations
Implement at minimum:
1. runtime context and injectable ports for clock, IDs, environment, process, filesystem, Git/provider/persistence references without implementing later owners;
2. cheap side-effect-free library import/startup;
3. stable command IDs `gef.<domain>.<action>` and explicit registry composition;
4. duplicate/unknown/invalid registration failures;
5. pre-handler input/capability/policy/target/budget hook ordering through neutral contracts;
6. one-primary-handler routing and prohibition of recursive router dispatch by design;
7. compact typed execution context;
8. explicit logical invocation lifecycle and exactly one immutable terminal classification per run;
9. cancellation/timeout distinction and truthful recovery/partial-effect terminals;
10. retry/idempotency metadata boundaries without unsafe automatic mutation retry;
11. frozen exit-code mapping `0,10,20,30,40,50,60,70,80,90`;
12. 13-category typed error model with global `gef.<category>.<reason>` codes;
13. mandatory non-success severity, retryability and recoverability metadata;
14. bounded/redacted cause representation and exclusion of raw stack traces from normal machine output;
15. structured remediation action IDs rather than self-authorizing shell text;
16. deterministic result/registry/introspection ordering where owned by M01;
17. structured telemetry hook boundary without implementing M43 storage/schema ownership.

## OUT OF SCOPE
Do not implement competing ownership for:
- M02 full configuration/schema engine or general version migrations;
- M03 project identity rules;
- M04 repository/provider discovery engine;
- M05/M06 mutation transaction/filesystem safety engine;
- M24/M25 evidence/proof graph;
- M29 Git engine;
- M34-M37 security/recovery/integrity engines;
- M42 third-party adapter isolation runtime;
- M43 telemetry storage/analytics;
- M47/M48 full operator UX/help;
- M49-M51 distribution/upgrade/compatibility product features;
- M63 optimization engine.

Neutral interfaces/ports and deterministic test doubles for those dependencies are allowed and required where necessary.

## ARCHITECTURE RULES
- TypeScript, strict mode, modern ESM-oriented Node LTS semantics.
- Monorepo modular workspaces; no one-package-per-module explosion.
- Library/application API first; CLI thin and non-authoritative.
- Core/kernel must not import GitHub-specific models.
- No daemon baseline.
- No hidden network or repository mutation on import/startup.
- Child-process abstraction defaults to `executable + argv`; shell is not the M01 default.
- Canonical/derived/operational state classes remain distinct.
- Filesystem-derived persistence baseline may be represented by a port; no SQLite dependency is required in this work order.
- No worker-thread baseline.
- No polyglot/native component.

## SECURITY CONSTRAINTS
- no secret values in runtime identity, normal errors, telemetry hooks or test snapshots;
- no implicit S4 authorization;
- untrusted external values remain untrusted until owning validation policy approves them;
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
10. successful mutation-class result cannot reach terminal success without verification/receipt hook completion where the use-case declares those requirements;
11. exit-code projection matches S04 and never contradicts typed terminal result;
12. error envelopes match S05 categories/reasons/severity/retry/recovery rules;
13. normal machine output omits stack traces/secrets;
14. cause chains are bounded, acyclic and deterministically serialized enough for current M01 needs;
15. remediation uses structured action IDs/params;
16. focused security tests for shell-free process request representation, redaction and authorization boundaries pass;
17. no M02+ semantic responsibility is accidentally implemented inside M01;
18. evidence bundle maps each acceptance criterion to test/proof/exact head;
19. semantic review reports no HIGH/CRITICAL finding;
20. checkpoint and weighted progress are promoted only after evidence-backed verdict.

## REQUIRED TESTS / PROOF
At minimum execute and record:
- T0: formatting/lint if configured, TypeScript strict typecheck, package/build graph sanity;
- T1: unit tests for command IDs/registry, lifecycle transitions, error model, exit mapping, bounded causes/redaction, retry/recovery metadata;
- T2: focused integration tests for typed invocation through registry + lifecycle + handler + result projection;
- security-focused tests for shell-free process specification, secret redaction, capability/policy pre-handler blocking and S4 non-bypass abstraction;
- import side-effect test;
- deterministic fake clock/ID test;
- cancellation/timeout tests;
- cross-platform-safe path/process contract fixtures where M01 owns behavior;
- exact-head diff/evidence audit.

Broader T3-T7 suites are not automatically required for this bounded M01 increment unless impact analysis, Security, Test Plan or discovered uncertainty expands the assurance radius.

## DELIVERABLES
- functional TypeScript workspace foundation needed by M01;
- contracts/kernel code and minimal thin CLI projection where acceptance requires it;
- tests/fixtures;
- committed dependency lockfile;
- compact M01 implementation/evidence manifest;
- exact-head review record;
- updated checkpoint/progress after verdict.

## REVIEW FORMAT
Review must report:
- exact base/head SHA;
- files changed;
- architecture/security conformance;
- commands/tests and outcomes;
- acceptance-criterion map;
- failures fixed;
- open findings and severity;
- whether M01 qualifies for `MODULE_DONE`;
- earned/remaining weight and official percentage if promoted.

## PROGRESS RULE
M01 frozen weight is `20`. This Work Order does not itself earn weight. On evidence-backed `MODULE_DONE`, earned project weight becomes `36/1088`, which is `3.31%` rounded, with `1052/1088` remaining or `96.69%`. Do not publish that promoted percentage until the module verdict is actually APPROVED.

## STOP CONDITION
Stop only at one of:
- `M01_IMPLEMENTATION_CANDIDATE_READY_FOR_EVIDENCE`
- `SOURCE_CONFLICT`
- `SCOPE_EXPANSION_REQUIRED`
- `BLOCKED_EVIDENCE`
- `NEEDS_ARCHITECTURE`

No silent movement to M02 is permitted before the M01 implementation verdict and checkpoint promotion.
