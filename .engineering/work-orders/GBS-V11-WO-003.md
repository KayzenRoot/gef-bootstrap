# GBS-V11-WO-003 — Doctor 2.0 + Status

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `ELEVATED`
Executor: external executor permitted by `ADR-0003-D3` only after this admission increment merges into `release/1.1`
Implementation branch after admission: `feat/1.1/wo-003-doctor-status`

## OBJECTIVE
Extend the production-grade V1.1 CLI with deterministic, read-only operational diagnostics:

- `gef doctor` => environment/repository/toolchain/integrity diagnostics plus actionable remediation guidance;
- `gef status` => concise governed project/repository status derived from existing verified engines.

The commands must remain thin CLI projections over existing domain engines. This Work Order must not introduce destructive automatic repair, upgrade/migration behavior, or new semantic authorities.

## CONTEXT / AUTHORITY
Read authority in this order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/releases/V1.1-SCOPE.md`
5. `.engineering/DEFINITION-OF-DONE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
8. `.engineering/releases/V1.1-TEST-MATRIX.md`
9. this Work Order + Context Lock + Execution Brief
10. exact merged WO-002 CLI implementation at the admitted base SHA

Repository/code/tests/evidence at the exact base SHA outrank conversation recollection.

## SCOPE
### A. `gef doctor`
Register and expose canonical command ID `gef.doctor.run` as a read-only diagnostic command.

Delegate to the existing architecture-named verified surfaces, including where applicable:
- `doctor`
- `repairSuggestion`
- `invariantResult`
- `dependencySecurity`
- `githubSecurity`
- `integritySnapshot`
- `capabilityEnvelope`
- `safetyDecision`

Diagnostics should cover the observable subset supported by those engines at the exact base, including install/package integrity, Node/toolchain capability, Git/repository state, GitHub capability/security when available, canonical/source-pack/documentation integrity, CI/assurance visibility where already represented, and relevant configuration/invariant inconsistencies.

Unknown or unavailable evidence must be represented truthfully as unavailable/indeterminate/failing according to the owning engine. Never synthesize a healthy verdict.

Remediation is guidance only. No destructive automatic repair. Preserve the existing `repairSuggestion` posture (`automatic:false`, `previewRequired:true`) where applicable.

### B. `gef status`
Register and expose canonical command ID `gef.status.show` as a read-only status command.

Delegate to architecture-named verified surfaces, including where applicable:
- `operatorStatus`
- `repositoryState`
- `documentationManifest`
- `navigationPlan`

Status must summarize observed/governed state without inventing completion, production approval, branch safety, or evidence credit. V1.0 production truth and V1.1 development overlay must remain distinguishable.

### C. CLI integration
- Extend parser/help/registry/rendering only as needed for `doctor` and `status`.
- Preserve `gef init` / `gef adopt` behavior and every WO-002 safety contract.
- Preserve human output on TTY and automatic JSON on non-TTY / `--json`.
- No implicit prompt and no mutation flag for doctor/status in this increment.
- Unknown command/malformed flag stays on canonical exit path 10.
- Engine/capability failures use canonical `projectExitCode` projection.

### D. Packaged-install parity
The locally packed/installed CLI must expose `doctor` and `status` with the same semantics as the source workspace. No source-tree injection, no registry publication, no tag/release creation.

### E. Evidence
Add objective evidence for command registration/delegation, deterministic output, failure behavior, clean-install execution, source-workspace regression, and zero mutation.

## KNOWN FINDINGS TO CONSUME
- WO-002 F2: Git dirtiness observation requires a `git` binary. Where Git is unavailable, doctor should surface an actionable capability diagnostic; status must fail closed rather than report a clean repository.
- WO-002 F1 remains owned by kernel/M05 semantics. Do not rewrite kernel exit classification in this WO.
- C4 constitutional version binding and C8 repository-wide validation scope remain carried to their existing owners; do not opportunistically expand this WO.

## FILE SEEDS / EXPECTED IMPLEMENTATION SURFACE
Start here:
- `packages/cli/src/parser.ts`
- `packages/cli/src/registry.ts`
- `packages/cli/src/render.ts`
- `packages/cli/src/main.ts` only if composition requires it
- `packages/cli/src/engines.ts` only to expose already-existing architecture-named engine symbols
- `packages/cli/README.md`
- `tests/v11-wo-003-doctor-status.test.mjs`
- `tests/v11-wo-003-doctor-status-e2e.test.mjs`
- `tests/v11-wo-003-dist-smoke.test.mjs` when needed for installed parity
- `.engineering/evidence/GBS-V11-WO-003-EVIDENCE.md`

Read existing domain packages only when a named architecture dependency requires it. Any write outside this surface needs a concrete dependency reason in evidence.

## OUT OF SCOPE
- destructive or automatic repair
- `gef upgrade` or compatibility/migration/recovery implementation (WO-004)
- Context Compiler / Execution Capsule compiler implementation (WO-005)
- incremental validation/proof reuse implementation (WO-006/007)
- telemetry platform implementation (WO-008)
- integrated release-channel redesign (WO-009)
- V1.1 production acceptance/promotion (WO-010)
- npm/GitHub Release publication
- mutation of `main` or `v1.0.0`
- broad package/kernel refactors

## ARCHITECTURE RULES
1. Library/application API first, thin CLI second.
2. Doctor/status are diagnostic projections, not new semantic engines.
3. Commands are read-only in this Work Order.
4. No destructive automatic repair.
5. Existing domain findings and remediation structures are preserved rather than reinterpreted.
6. Unknown capability/evidence/state fails closed.
7. No provider model dependency from CLI.
8. Existing WO-002 transaction/private-filesystem contracts must not regress.
9. No executor self-approval.
10. `main` is never an execution target.

## ACCEPTANCE CRITERIA
1. `gef doctor` resolves through canonical `gef.doctor.run`, exit/output deterministic for the same observed inputs.
2. `gef status` resolves through canonical `gef.status.show` and remains read-only.
3. Registry introspection proves explicit engine ownership/delegation for both commands.
4. Doctor surfaces actionable structured diagnostics for observed capability/integrity/repository problems without fabricated healthy defaults.
5. Missing Git/toolchain/provider capability is explicit and fail-closed, not reported as clean/ready.
6. Status distinguishes V1 production truth from V1.1 development state where represented by existing engines/sources.
7. Human and JSON projections remain semantically aligned; non-TTY automatically uses JSON.
8. Neither command mutates project files, private transaction state, Git state, GitHub state, tags, branches, config, or canonical documents.
9. No automatic destructive repair is introduced.
10. Source-workspace `init`/`adopt` regression remains green.
11. Real locally installed package executes doctor/status without source-checkout injection.
12. Full typecheck/regression and applicable dependency audit pass at exact head.
13. Evidence bundle records exact head, commands, counts, delegation map, no-mutation proof, installed parity, findings and deferred items.
14. CRITICAL = 0 and HIGH = 0 at objective audit.
15. `main` and `v1.0.0` remain unchanged.

## TEST / VALIDATION LADDER
- L1: focused parser/registry/render/doctor/status tests + affected typecheck.
- L2: process E2E for doctor/status, representative success/failure/non-TTY JSON/no-mutation cases.
- L3: local packed install smoke for doctor/status and WO-002 regression.
- L4: full `npm run validate` + repository dependency audit before evidence closure.
- Exact-head GitHub assurance required before objective approval.

## EXECUTOR BOUNDS
Executor MAY implement, test, commit, push and update/open the WO-003 implementation PR on `feat/1.1/wo-003-doctor-status`.

Executor MUST NOT merge, tag, publish, force-push, rewrite history, mutate `main`, move `v1.0.0`, rewrite V1 acceptance history, self-approve, or expand scope.

## EVIDENCE BUNDLE
Must include:
- exact base/final head;
- changed files/reasons;
- commands/exit codes/test counts;
- doctor/status delegation evidence;
- no-mutation proof;
- Git-unavailable/capability-failure evidence;
- local packed-install parity proof;
- init/adopt regression proof;
- explicit no-publication and production-boundary statement;
- findings by severity and deferred owners.

## REVIEW FORMAT
Objective reviewer returns exactly one terminal disposition: `APPROVED`, `CORRECTION_REQUIRED`, or `BLOCKED`, bound to the exact implementation head. Executor evidence is not self-approval.

## STOP CONDITION
Stop after implementation, tests, evidence and PR update are complete. Do not merge.

STOP CONDITION: `GBS_V11_WO_003_READY_FOR_OBJECTIVE_AUDIT`
