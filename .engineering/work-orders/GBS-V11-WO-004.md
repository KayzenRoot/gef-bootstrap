# GBS-V11-WO-004 — Upgrade + Compatibility + Recovery

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `HIGH_ASSURANCE`
Executor: external executor permitted by `ADR-0003-D3` only after this admission increment merges into `release/1.1`
Implementation branch after admission: `feat/1.1/wo-004-upgrade-recovery`

## OBJECTIVE
Implement the governed V1.1 upgrade path for already-managed GEF projects without weakening the V1/WO-002 transaction, ownership, recovery, evidence, distribution, or fail-closed guarantees.

The increment introduces:
- `gef upgrade` => deterministic, side-effect-free preview;
- `gef upgrade --apply` => explicit governed mutation only after the preview/compatibility/recovery preconditions are satisfied;
- a versioned compatibility/migration matrix with at least the admitted V1.0 -> V1.1 path;
- preservation-first migration, backup/recovery material, deterministic plan digests, rollback or `RECOVERY_REQUIRED` evidence;
- installed-package parity on Windows, Linux and macOS.

This is target-project migration. It is **not** silent CLI self-update, registry publication, or release promotion.

## CONTEXT / AUTHORITY
Read authority in this order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/decisions/ADR-0004-WINDOWS-EFFECTIVE-RIGHTS-ORACLE.md`
5. `.engineering/releases/V1.1-SCOPE.md`
6. `.engineering/DEFINITION-OF-DONE.md`
7. `.engineering/ARCHITECTURE.md`
8. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
9. `.engineering/releases/V1.1-TEST-MATRIX.md`
10. this Work Order + Context Lock + Execution Brief
11. exact merged WO-002/WO-003 CLI implementation at the admitted base SHA

Repository/code/tests/evidence at the exact base SHA outrank conversation recollection.

## FROZEN COMMAND CONTRACT
- `gef upgrade` => `gef.upgrade.preview`, mutation `false`, default behavior.
- `gef upgrade --apply` => `gef.upgrade.apply`, mutation `true`, explicit operator intent required.
- No implicit prompt, no silent auto-apply, no network self-update, no package-manager invocation.
- Human output on TTY; JSON on `--json` or non-TTY.
- Unknown/malformed input stays on the canonical usage path.
- Exit projection remains the canonical `projectExitCode`.

## VERIFIED ENGINE DELEGATION
Bind existing architecture-owned symbols explicitly, without flattening collision-prone exports:
- maintenance owner: `upgradePreview`, maintenance `compatibility`, `installPlan`;
- safety/recovery owner: `backupManifest`, `recoveryPlan`, `safetyDecision`, `integritySnapshot` where applicable;
- existing repository/toolchain observation from WO-002/WO-003;
- kernel transaction envelope for every managed filesystem effect.

The maintenance `compatibility` export and safety `compatibility` export are **not interchangeable**. WO-004 must bind the maintenance compatibility semantics for version/platform/runtime requirements and may use safety capability compatibility only when a separately named requirement demands it.

If a required engine surface is too weak to satisfy an acceptance criterion, implement the smallest bounded deterministic upgrade-domain layer under the existing application/library-first architecture. Do not move product policy into the renderer.

## COMPATIBILITY / MIGRATION MATRIX
Create one canonical machine-readable matrix for supported upgrade paths plus an explicit JSON Schema 2020-12 contract.

Minimum matrix semantics:
- schema/version identity;
- source product version/range;
- destination product version/range;
- source state-document/schema major where relevant;
- supported platforms;
- minimum Node/runtime constraint;
- required capabilities;
- ordered migration IDs;
- recovery strategy;
- evidence state for the row.

Required states:
- `SUPPORTED`
- `UNSUPPORTED`
- `INDETERMINATE`

Unknown required dimension is never coerced to `SUPPORTED`.

At least one V1.0 -> V1.1 row must exist and be objectively exercised. No row may claim verified support without matching tests/evidence.

## PREVIEW CONTRACT
Preview is read-only and must:
1. bind target identity and current managed state;
2. determine current product/schema version from governed state, never from guesswork;
3. select exactly one compatible matrix row or fail closed;
4. inventory the managed surface and classify each candidate path at least as `UNCHANGED`, `GEF_MANAGED_CHANGED`, `USER_MODIFIED`, `CONFLICTING`, or equivalent explicit states;
5. compute backup/recovery requirements before any apply;
6. produce ordered operations and a deterministic `planDigest`;
7. report unsupported/indeterminate dimensions with actionable structured reasons;
8. leave project tree, Git state, private transaction state and provider state unchanged.

Repeated preview over identical observed inputs must produce the same semantic plan/digest.

## APPLY CONTRACT
Apply must:
- re-observe all preview inputs and refuse stale preview/changed pre-state;
- require an applicable `SUPPORTED` matrix row;
- require explicit `--apply`;
- route all managed filesystem effects through the existing transaction/private-journal authority;
- capture sufficient bounded recovery material before the first irreversible write;
- never overwrite `USER_MODIFIED` or `CONFLICTING` content without an already-existing explicit authorization contract; WO-004 introduces no new override flag;
- stage, verify, promote and post-verify under Architecture A5;
- emit a versioned receipt and updated managed state only after successful post-state verification;
- on safe recoverable failure, restore and report `RECOVERED`;
- when restoration cannot be proved complete, report `RECOVERY_REQUIRED` and preserve recovery evidence;
- never silently convert partial effect into success.

## RECOVERY / IDEMPOTENCE
Required properties:
- preview and apply plan digests match for identical inputs;
- second apply after successful upgrade is `NOOP` or an equivalent explicit idempotent terminal state;
- interrupted PREPARE/STAGE path has a deterministic recovery action;
- committed state is not rolled back merely because a later read-only observation failed;
- backup manifest digests are verified before being credited;
- recovery material is target/run bound and cannot be reused against a different pre-state;
- no stale transaction journal from another command/run can authorize upgrade effects.

## FILE SEEDS / EXPECTED IMPLEMENTATION SURFACE
Start with:
- `packages/cli/src/parser.ts`
- `packages/cli/src/registry.ts`
- `packages/cli/src/main.ts`
- `packages/cli/src/engines.ts`
- `packages/cli/src/transaction.ts`
- `packages/cli/src/schemas.ts`
- `packages/cli/README.md`
- product compatibility matrix + schema under a bounded CLI/package-owned data/schema surface
- packaging script only as required to ship the matrix/schema
- focused tests `tests/v11-wo-004-*.test.mjs`
- `.engineering/evidence/GBS-V11-WO-004-EVIDENCE.md`

Existing WO-002/WO-003 source may be modified only when required to preserve shared command/packaging/transaction contracts. Broad kernel/domain refactors require escalation.

## REQUIRED TEST / ASSURANCE CASES
Consume the canonical V1.1 Test Matrix `UPG-MIG-01..07` and `COMPAT-01..06` in full, including:
- preview side-effect-free;
- preview/apply digest equality;
- forced mid-apply failure with complete recovery => `RECOVERED`;
- incomplete recovery => `RECOVERY_REQUIRED`;
- `USER_MODIFIED` never silently overwritten;
- `CONFLICTING` never automatically resolved;
- V1.0 -> V1.1 migration row exists and applies;
- unsupported pair => `UNSUPPORTED`, no mutation;
- unknown blocking dimension => `INDETERMINATE`, fail closed;
- unsupported platform and Node/runtime constraints;
- absent required capability produces a gap, never bypass;
- no verified compatibility row without proof.

Also prove:
- no regression in init/adopt/doctor/status;
- locally packed/installed upgrade parity;
- Windows/Linux/macOS assurance for upgrade/compatibility/recovery surfaces;
- transaction ownership/journal protections from WO-002 remain effective.

## OUT OF SCOPE
- updating the installed CLI package itself or invoking npm/package managers;
- registry/GitHub Release publication;
- silent/background self-update;
- provider/GitHub mutation as part of core project migration unless separately admitted by an existing provider contract;
- Context Compiler / Execution Capsule implementation (WO-005);
- Incremental Validation (WO-006);
- Proof Reuse (WO-007);
- telemetry/benchmark platform (WO-008);
- integrated V1.1 assurance/release promotion (WO-009/010);
- breaking V1 public contracts merely for cleanup;
- mutation of `main` or `v1.0.0`;
- broad unrelated refactors.

## ARCHITECTURE / SECURITY RULES
1. Preview first; apply only with explicit intent.
2. Library/application API first, thin CLI second.
3. Existing kernel transaction authority remains the only managed filesystem effect path.
4. Compatibility claims are evidence-bound and versioned.
5. Unknown/incompatible state fails closed.
6. User content preservation outranks migration convenience.
7. Recovery evidence is captured before mutation and verified before credit.
8. No new arbitrary executable/process authority.
9. Existing Windows trusted-Git rights oracle and POSIX trust chain must not regress.
10. No executor self-approval; `main` is never an execution target.

## ACCEPTANCE CRITERIA
1. Canonical `gef.upgrade.preview` and `gef.upgrade.apply` registrations exist with correct mutation declarations.
2. Default `gef upgrade` is read-only; `--apply` is the only admitted mutation intent.
3. Versioned compatibility matrix/schema exists, is packaged, deterministic and validated.
4. V1.0 -> V1.1 compatibility/migration path is exercised with objective evidence.
5. Unsupported/indeterminate version/platform/runtime/capability states fail closed without mutation.
6. Preview identifies user-modified/conflicting managed files and never authorizes silent overwrite.
7. Preview and apply produce equal plan digests for identical pre-state.
8. Apply revalidates pre-state before mutation and rejects stale plans.
9. All effects use the existing transaction/journal/ownership safety boundary.
10. Complete-recovery forced failure restores the pre-state and reports `RECOVERED`.
11. Incomplete/unprovable recovery reports `RECOVERY_REQUIRED` with no fabricated success.
12. Successful re-apply is idempotent/no-op.
13. init/adopt/doctor/status regressions remain green.
14. Packed installed CLI executes upgrade preview/apply semantics without source-tree injection.
15. Windows/Linux/macOS required upgrade/compatibility/recovery assurance passes.
16. Full typecheck/regression and dependency audit pass at exact head.
17. Evidence Bundle maps requirements to exact tests/results and records exact implementation state.
18. Objective audit reports CRITICAL=0 and HIGH=0.
19. `main`, `v1.0.0`, publication and production acceptance remain unchanged.

## TEST / VALIDATION LADDER
- L1: compatibility/matrix/plan/preservation focused tests.
- L2: real-process preview/apply/recovery E2E over disposable repositories.
- L3: packed-install upgrade smoke + unchanged WO-002/WO-003 regression suites.
- L4: full repository validation + dependency audit.
- L5: dedicated cross-platform upgrade/recovery assurance on Windows/Linux/macOS.
- Exact-head GitHub assurance required before objective approval.

## EXECUTOR BOUNDS
Executor MAY implement, test, commit, push and open/update the WO-004 PR on `feat/1.1/wo-004-upgrade-recovery`.

Executor MUST NOT merge, tag, publish, force-push, rewrite history, mutate `main`, move `v1.0.0`, weaken accepted WO-002/WO-003 guarantees, self-approve, or implement WO-005+.

## EVIDENCE BUNDLE
Must include:
- exact admitted base and implementation head;
- compatibility matrix/schema fingerprints;
- preview/apply digest proof;
- preservation/conflict classification proof;
- forced recovery and recovery-required cases;
- idempotence proof;
- cross-platform results;
- packed-install result;
- unchanged prior-command regressions;
- dependency audit;
- findings by severity/deferred owner;
- explicit production/publication boundary.

## REVIEW FORMAT
Objective reviewer returns exactly one terminal disposition: `APPROVED`, `CORRECTION_REQUIRED`, or `BLOCKED`, bound to the exact implementation head. Executor evidence is never self-approval.

## STOP CONDITION
Stop after implementation, validation, evidence and PR update are complete. Do not merge.

STOP CONDITION: `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`
