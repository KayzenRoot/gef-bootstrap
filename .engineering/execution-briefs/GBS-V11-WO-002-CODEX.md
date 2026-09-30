# Codex Execution Brief — GBS-V11-WO-002

State: `NOT_EXECUTABLE_UNTIL_ADMISSION_MERGE`
Executor: Codex / equivalent external executor
Authority: `ADR-0003-D3`
Work Order: `.engineering/work-orders/GBS-V11-WO-002.md`
Context Lock: `.engineering/context-locks/GBS-V11-WO-002.json`
Implementation branch: `feat/1.1/wo-002-cli-distribution`

## FIRST ACTION — MANDATORY BASE CHECK
Before changing anything:

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse origin/release/1.1
git merge-base --is-ancestor origin/release/1.1 HEAD
```

The implementation branch MUST be created from the exact **WO-002 admission merge SHA** recorded in `release/1.1` after the admission PR closes. If local HEAD/base differs, STOP and report `STALE_CONTEXT`; do not rebase or guess.

## MINIMUM READ SET — READ IN THIS ORDER
1. `.engineering/work-orders/GBS-V11-WO-002.md`
2. `.engineering/context-locks/GBS-V11-WO-002.json`
3. `.engineering/CHECKPOINT.json` (`v11` only plus immutable top-level production fields)
4. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md` (D3/D4/D5)
5. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
6. `.engineering/releases/V1.1-TEST-MATRIX.md` §2.1 + §3
7. `package.json`
8. `packages/cli/package.json`
9. `packages/cli/src/index.ts`
10. directly referenced kernel/contracts/domain modules needed to satisfy the exact delegation map

Do **not** start with repository-wide search. Expand reads only when an import/type/test failure or a named dependency from the CLI architecture requires it. Record every expansion in the evidence bundle.

## IMPLEMENTATION TARGET
Build a thin CLI/distribution foundation only:

- `gef --help`
- `gef --version`
- `gef init` => safe plan
- `gef init --apply` => governed run
- `gef adopt` => safe preview
- `gef adopt --apply` => governed apply
- global `--json`
- verb-level `--help`
- real `gef` bin mapping and local `npm pack`/install smoke path

No `doctor`, `status`, or `upgrade` implementation in this WO.

## FROZEN FILE BLUEPRINT
Prefer this structure unless existing code proves a smaller equivalent is safer:

```text
packages/cli/
  package.json                  # version/bin/runtime deps
  bin/gef.mjs                   # tiny executable shim
  src/index.ts                  # public CLI API exports
  src/parser.ts                 # pure argv parser
  src/render.ts                 # human/json renderer
  src/registry.ts               # command registration/delegation composition
  src/main.ts                   # process boundary only

tests/
  v11-wo-002-cli.test.mjs
  v11-wo-002-cli-e2e.test.mjs
  v11-wo-002-dist-smoke.test.mjs

.engineering/evidence/
  GBS-V11-WO-002-EVIDENCE.md
```

## DO NOT REDISCOVER THESE DECISIONS
- CLI is transport/rendering only. Business policy remains in domain engines.
- Default `init`/`adopt` actions are non-mutating; mutation requires explicit `--apply`.
- Exit mapping goes through the existing `projectExitCode` path.
- Root `package.json.version` is the canonical candidate version source; align CLI package/version output to it. Candidate version may be `1.1.0` on `release/1.1` without publication/production claim.
- Keep source-workspace usage valid.
- Local packaging proof is required; publication is forbidden.
- C3: no package-topology rewrite.
- C5: explicit imports/aliases for colliding exports, no ambiguous flat barrel.
- C6: resolve CLI version/bin only, not workspace-wide version cleanup.
- `main` and `v1.0.0` are untouchable.

## IMPLEMENTATION LOOP
1. Inspect only the minimum read set and named dependencies.
2. Implement parser + result renderers with unit tests.
3. Register/delegate `init` and `adopt` through existing kernel/domain contracts.
4. Add process entry + bin shim.
5. Reconcile canonical version provenance and lockfile.
6. Run focused CLI typecheck/tests.
7. Run process E2E.
8. Run local pack/install smoke without registry publication.
9. Run full `npm run validate` and repository dependency audit before evidence closure.
10. Produce `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` with exact commands, exit codes, counts, changed-file reasons, case mapping and findings.
11. Commit/push branch and open/update PR to `release/1.1`.
12. STOP. Do not merge and do not claim APPROVED.

## REQUIRED TEST-MATRIX EVIDENCE
Map evidence explicitly to:
- `CLI-E2E-01..07` where applicable to the admitted commands;
- `DIST-SMOKE-01..04`;
- future-command portions are `DEFERRED_TO_OWNING_WO`, never green by inference.

At minimum prove:
- help deterministic/no network;
- version single-source agreement;
- malformed/unknown => exit 10/no mutation;
- stable JSON success/failure envelope;
- no non-TTY hang;
- registry IDs/owners/mutation declarations correct;
- exit-code projection exact;
- packed executable resolves;
- broken install/self-check fails closed where implemented;
- cleanup/uninstall test never deletes project data;
- no publication claim/action.

## FAILURE / EXPANSION TRIGGERS
STOP or expand conservatively if:
- canonical source/base drift;
- required named domain symbol is absent/incompatible;
- safe apply path cannot use the kernel transaction envelope;
- package resolution requires broad workspace restructuring;
- any proposed write touches `main`, release tags or V1.0 acceptance history;
- any HIGH/CRITICAL finding appears.

For a bounded new dependency/file required to satisfy the WO, record why, update evidence, and continue. For architecture/scope expansion, STOP.

## FINAL RESPONSE FORMAT
Return in pt-BR:
- Work Order + branch + exact final head
- what was implemented
- files changed
- tests/evidence with command + exit code + counts
- `CLI-E2E` / `DIST-SMOKE` mapping
- CRITICAL/HIGH/MEDIUM/LOW findings
- deferred items with owners
- PR number/link
- explicit statement: `MERGE NOT PERFORMED; OBJECTIVE AUDIT REQUIRED`

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_AUDIT`
