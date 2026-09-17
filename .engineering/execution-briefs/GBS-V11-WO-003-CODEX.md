# Codex Execution Brief — GBS-V11-WO-003

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Executor: Codex / equivalent external executor
Authority: `ADR-0003-D3`
Work Order: `.engineering/work-orders/GBS-V11-WO-003.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-003.json`
Implementation branch: `feat/1.1/wo-003-doctor-status`

## FIRST ACTION — MANDATORY BASE CHECK
Before changing anything:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/release/1.1
git merge-base --is-ancestor origin/release/1.1 HEAD
```

The implementation branch MUST be created from the exact WO-003 admission merge recorded in `release/1.1`. If local HEAD/base differs, STOP as `STALE_CONTEXT`; do not rebase, force-push or guess.

## MINIMUM READ SET — READ IN THIS ORDER
1. `.engineering/work-orders/GBS-V11-WO-003.md`
2. `.engineering/context-locks/GBS-V11-WO-003.json`
3. `.engineering/CHECKPOINT.json` (`v11` overlay + immutable production fields)
4. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md` (D3/D4/D5)
5. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
6. `.engineering/releases/V1.1-TEST-MATRIX.md`
7. `packages/cli/src/parser.ts`
8. `packages/cli/src/registry.ts`
9. `packages/cli/src/render.ts`
10. `packages/cli/src/main.ts`
11. `packages/cli/src/engines.ts`
12. directly named domain modules only when required to bind the verified symbols

Do **not** start with repository-wide search. Expand only when an import/type/test failure or a named dependency requires it, and record every expansion in evidence.

## IMPLEMENTATION TARGET
Add only:

- `gef doctor` => `gef.doctor.run`
- `gef status` => `gef.status.show`
- human + JSON projections using the existing renderer contract
- help inventory entries
- local packed-install parity
- focused + E2E + distribution tests

No `--fix`, no destructive repair, no `upgrade`, no migration/recovery product feature, no WO-005+ implementation.

## FROZEN DELEGATION MAP
`gef doctor` delegates to existing verified symbols named by the CLI architecture, including where applicable:
- `doctor`
- `repairSuggestion`
- `invariantResult`
- `dependencySecurity`
- `githubSecurity`
- `integritySnapshot`
- `capabilityEnvelope`
- `safetyDecision`

`gef status` delegates to existing verified symbols named by the CLI architecture, including where applicable:
- `operatorStatus`
- `repositoryState`
- `documentationManifest`
- `navigationPlan`

Do not reproduce those algorithms in CLI code. If a required named symbol is absent/incompatible at the exact base, report evidence and STOP instead of inventing substitute semantics.

## DO NOT REDISCOVER THESE DECISIONS
- Doctor/status are read-only in WO-003.
- Remediation is guidance, not automatic destructive repair.
- `repairSuggestion` safe posture remains non-automatic/preview-first where applicable.
- Unknown evidence/capability fails closed.
- Git missing/unavailable must be surfaced as an actionable capability diagnostic, never as CLEAN.
- Output mode remains human on TTY and JSON on `--json` or non-TTY.
- Exit projection remains canonical `projectExitCode`.
- Existing `init`/`adopt` semantics and all WO-002 filesystem/authorization safety must not regress.
- `main` and `v1.0.0` remain untouchable.
- Local packaging proof is required; publication is forbidden.

## IMPLEMENTATION LOOP
1. Verify exact branch/base.
2. Read only the minimum read set and named engine dependencies.
3. Extend parser/help inventory for doctor/status.
4. Bind verified engines through registry composition with no duplicated domain policy.
5. Implement deterministic human/JSON projection only where current renderers need extension.
6. Add focused unit/integration tests, including no-mutation assertions.
7. Add real process E2E for doctor/status success/failure/non-TTY JSON.
8. Add/extend local packed-install smoke for doctor/status with no source-tree injection.
9. Run init/adopt regression suites from WO-002.
10. Run full typecheck + `npm run validate` + dependency audit.
11. Produce `.engineering/evidence/GBS-V11-WO-003-EVIDENCE.md` with exact head, commands, counts, delegation proof, no-mutation proof, installed parity and findings.
12. Commit/push and open/update PR to `release/1.1`.
13. STOP. Do not merge and do not claim APPROVED.

## REQUIRED NEGATIVE / FAILURE EVIDENCE
At minimum prove:
- missing Git/toolchain/provider capability does not become a healthy verdict;
- unknown repository state blocks/marks status truthfully;
- malformed/unknown CLI input remains exit 10 with no mutation;
- doctor remediation never performs destructive automatic action;
- doctor/status create no `.gef-private`, project artifact, Git branch/tag/config mutation, or provider mutation;
- non-TTY never waits for input and emits JSON;
- packed install behaves the same without source-checkout injection;
- broken engine/dependency fails closed with canonical structured error/exit mapping.

## FAILURE / EXPANSION TRIGGERS
STOP or expand conservatively if:
- base/context drift;
- required named engine symbol is absent/incompatible;
- a read-only command would require mutation to produce its result;
- packaging parity requires broad package topology change;
- a proposed fix requires kernel contract modification;
- any write would touch `main`, tags, V1 acceptance history, upgrade/migration scope or WO-005+;
- any HIGH/CRITICAL finding appears.

For a bounded file/dependency mechanically required by the Work Order, record why and continue. For scope/architecture expansion, STOP.

## FINAL RESPONSE FORMAT
Return in pt-BR:
- Work Order + branch + exact final head
- doctor/status implementation summary
- files changed
- engine delegation map actually used
- commands/tests with exit codes and counts
- no-mutation evidence
- local packed-install evidence
- init/adopt regression evidence
- CRITICAL/HIGH/MEDIUM/LOW findings
- deferred items and owners
- PR number/link
- explicit statement `MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED`

STOP CONDITION: `GBS_V11_WO_003_READY_FOR_OBJECTIVE_AUDIT`
