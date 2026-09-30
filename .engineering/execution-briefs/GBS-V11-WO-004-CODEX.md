# Codex Execution Brief — GBS-V11-WO-004

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Executor: Codex / equivalent external executor
Authority: `ADR-0003-D3`
Assurance: `HIGH_ASSURANCE`
Work Order: `.engineering/work-orders/GBS-V11-WO-004.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-004.json`
Implementation branch: `feat/1.1/wo-004-upgrade-recovery`

## FIRST ACTION — EXACT BASE
Before any edit:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/release/1.1
git merge-base --is-ancestor origin/release/1.1 HEAD
```

The implementation branch MUST be created from the exact WO-004 admission merge recorded on `release/1.1`. If not, STOP as `STALE_CONTEXT`. Never rebase, reset, force-push, guess or recreate history.

## MINIMUM READ SET
Read in this order:
1. `.engineering/work-orders/GBS-V11-WO-004.md`
2. `.engineering/context-locks/GBS-V11-WO-004.json`
3. `.engineering/CHECKPOINT.json`
4. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
5. `.engineering/decisions/ADR-0004-WINDOWS-EFFECTIVE-RIGHTS-ORACLE.md`
6. `.engineering/releases/V1.1-SCOPE.md`
7. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
8. `.engineering/releases/V1.1-TEST-MATRIX.md`
9. `packages/cli/src/parser.ts`
10. `packages/cli/src/registry.ts`
11. `packages/cli/src/engines.ts`
12. `packages/cli/src/transaction.ts`
13. `packages/cli/src/schemas.ts`
14. maintenance engine only for `upgradePreview`, maintenance `compatibility`, `installPlan`
15. safety/recovery engine only for `backupManifest`, `recoveryPlan`, and explicitly required safety/integrity symbols

Do not start with repository-wide search. Expand only on concrete compile/type/test/dependency evidence and record expansions in the Evidence Bundle.

## IMPLEMENTATION TARGET
Implement exactly:
- `gef upgrade` -> `gef.upgrade.preview`, read-only by default;
- `gef upgrade --apply` -> `gef.upgrade.apply`, explicit mutation;
- versioned compatibility/migration matrix + JSON Schema;
- V1.0 -> V1.1 supported path with evidence;
- preservation-first migration;
- deterministic preview/apply plan digests;
- bounded backup/recovery material;
- rollback/recovery-required behavior;
- idempotent successful re-apply;
- packaged-install parity;
- dedicated cross-platform upgrade/recovery assurance.

This upgrades a managed target project. It does NOT update the installed CLI package.

## FROZEN DELEGATION / COLLISION RULE
Bind by explicit owner:
- maintenance: `upgradePreview`, `compatibility`, `installPlan`;
- safety/recovery: `backupManifest`, `recoveryPlan`, `safetyDecision`, `integritySnapshot` only as applicable;
- existing repository/toolchain observation and kernel transaction authority.

Do not accidentally bind the safety package's unrelated `compatibility` export where the maintenance compatibility contract is intended.

If existing engine semantics cannot satisfy the Work Order, add only the smallest deterministic upgrade-domain layer required. Do not copy policy into CLI rendering.

## PREVIEW ALGORITHM
1. Resolve and bind target.
2. Read managed state using existing bounded/contained diagnostic rules where applicable.
3. Determine current product/schema version from governed state.
4. Load and validate the packaged compatibility matrix.
5. Select exactly one row or produce `UNSUPPORTED`/`INDETERMINATE`.
6. Observe repository/toolchain safety without weakening WO-003.
7. Inventory managed candidate files and classify preservation state.
8. Build backup/recovery requirements.
9. Build ordered migration operations.
10. Compute deterministic semantic `planDigest`.
11. Return preview without creating transaction/private/project mutations.

## APPLY ALGORITHM
1. Repeat all safety/compatibility observations.
2. Recompute the plan and require exact digest/pre-state compatibility with the apply inputs/current state.
3. Reject stale or conflicting state.
4. Require explicit `--apply`.
5. Capture verified recovery material before first write.
6. Route mutations through the existing transaction/private-journal path.
7. Stage and verify writes.
8. Promote atomically where supported.
9. Verify post-state.
10. Persist versioned state/receipt only after successful verification.
11. If failure is provably recoverable, restore and emit `RECOVERED`.
12. If restoration is incomplete/unprovable, emit `RECOVERY_REQUIRED`; never claim success.

## REQUIRED NEGATIVE TESTS
At minimum:
- unsupported version pair;
- unknown blocking dimension;
- unsupported platform;
- Node/runtime below matrix constraint;
- required capability absent;
- matrix malformed/unsupported schema;
- no verified row without proof;
- `USER_MODIFIED` managed file;
- `CONFLICTING` managed file;
- stale preview/pre-state before apply;
- forced failure before write;
- forced failure mid-apply with complete recovery;
- forced failure with missing/corrupt recovery material;
- journal from another run/target;
- second apply after success;
- missing/unavailable trusted Git;
- Windows privileged caller refused by the existing oracle;
- no source-tree injection in packed install.

## TEST MATRIX IDS — MANDATORY
Prove every canonical case:
- `UPG-MIG-01` through `UPG-MIG-07`
- `COMPAT-01` through `COMPAT-06`

Evidence must map each ID to exact tests and exact outcomes.

## CROSS-PLATFORM
Upgrade/compatibility/recovery assurance must execute on Windows, Linux and macOS as required by the frozen V1.1 Test Matrix. A suite run on only one platform is a gap.

Do not weaken the Windows Git-rights policy merely to make mutation tests available. If the hosted Windows token is too privileged to admit Git, use a bounded fixture/injected already-approved tool-observation seam to exercise upgrade transaction semantics while separately proving the production trust decision stays fail-closed.

## PACKAGING
The compatibility matrix and schema must ship in the locally packed CLI and be integrity-verifiable. Existing native Koffi packaging and WO-003 installed parity must remain green.

No registry publication, no GitHub Release, no post-install network dependency.

## VALIDATION LADDER
1. build + typecheck;
2. focused compatibility/matrix tests;
3. preview preservation tests;
4. apply/recovery/idempotence tests;
5. process E2E;
6. packed-install upgrade smoke;
7. unchanged WO-002 + WO-003 regressions;
8. `npm ci --dry-run --no-audit --no-fund`;
9. full `npm run validate` under the repository's canonical shell/CI;
10. `npm audit --audit-level=high`;
11. Windows/Linux/macOS exact-head upgrade assurance;
12. all applicable existing exact-head workflows.

## EVIDENCE
Create `.engineering/evidence/GBS-V11-WO-004-EVIDENCE.md` containing:
- admitted base and implementation head;
- changed files and reasons;
- matrix/schema fingerprints;
- command/test counts and exit codes;
- every UPG-MIG/COMPAT case mapping;
- preview no-mutation proof;
- preview/apply digest proof;
- user-modified/conflict refusal evidence;
- forced recovery + recovery-required evidence;
- idempotence;
- cross-platform assurance;
- packaged install;
- prior-command regressions;
- dependency audit;
- CRITICAL/HIGH/MEDIUM/LOW findings;
- production/publication boundary.

## HARD BOUNDARIES
Do NOT:
- merge;
- tag;
- publish;
- force-push;
- rewrite history;
- mutate `main` or `v1.0.0`;
- silently self-update the CLI;
- invoke npm/package managers for product upgrade;
- overwrite user-modified/conflicting content;
- weaken WO-002 transaction ownership/journal rules;
- weaken WO-003 Git/process/trust rules;
- implement WO-005+;
- self-approve.

## FINAL RESPONSE
Return in pt-BR:
- Work Order, branch and exact final head;
- implementation summary;
- compatibility matrix row(s);
- changed files;
- test commands/counts/exits;
- UPG-MIG/COMPAT mapping;
- preview no-mutation evidence;
- recovery/idempotence evidence;
- cross-platform + package evidence;
- regressions;
- findings by severity;
- PR number/link;
- exact statement `MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED`.

STOP CONDITION: `GBS_V11_WO_004_READY_FOR_OBJECTIVE_AUDIT`
