# GBS-V11-WO-002 — CLI + Distribution Foundation

Status: `ADMISSION_CANDIDATE`
Release line: `1.1.x`
Assurance: `ELEVATED`
Executor: external executor permitted by `ADR-0003-D3` only after this admission increment merges into `release/1.1`
Base candidate: `release/1.1` at `02e5926557e485e8c5e340e9bb9c4d2aee74e0ea`
Implementation branch after admission: `feat/1.1/wo-002-cli-distribution`

## OBJECTIVE
Implement the first production-grade V1.1 CLI/distribution increment: a thin, deterministic `gef` command surface for **`init` and `adopt`**, plus a locally packable/installable CLI path, while preserving the proven source-workspace path and every V1 safety/evidence invariant.

This Work Order is intentionally narrower than the complete V1.1 CLI inventory. `doctor`/`status` belong to WO-003 and `upgrade` belongs to WO-004.

## CONTEXT / AUTHORITY
Read authority in this order:
1. `.engineering/CHECKPOINT.md` + `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md` (`D-0042`, `D-0052..D-0059`)
3. `.engineering/decisions/ADR-0003-V1.1-RELEASE-CHANNEL-AND-EXECUTION-AUTHORITY.md`
4. `.engineering/releases/V1.1-SCOPE.md`
5. `.engineering/DEFINITION-OF-DONE.md`
6. `.engineering/ARCHITECTURE.md`
7. `.engineering/releases/V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
8. `.engineering/releases/V1.1-TEST-MATRIX.md`
9. `.engineering/releases/V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md`
10. this Work Order + its Context Lock / Execution Brief

Repository/code/tests/evidence at the exact base SHA outrank conversation recollection.

## SCOPE
### A. Thin CLI transport
Implement a real executable entry named `gef` with:
- `gef --help`
- `gef --version`
- `gef init`
- `gef adopt`
- global `--json`
- verb-level `--help`

Safe action mapping is frozen for this increment:
- `gef init` => `gef.init.plan` by default (read-only plan)
- `gef init --apply` => `gef.init.run`
- `gef adopt` => `gef.adopt.preview` by default (read-only preview)
- `gef adopt --apply` => `gef.adopt.apply`

Unknown command, malformed flag or invalid argument must exit through the canonical usage/input path (`10`) before any mutation.

### B. Parser / renderer / process boundary
- Pure argv parser => canonical `CommandRequest`/command invocation intent.
- Human renderer and stable JSON renderer over the same verified result semantics.
- Non-TTY execution must never block on an implicit prompt.
- No shell-string construction for subprocesses.
- One exit-code projection only: existing `projectExitCode` / `processExitCodeFor` path.
- Engine/domain payloads must not be semantically reinterpreted by the CLI.

### C. Command registration / delegation
Use the existing `CommandRegistry`/kernel runtime. The CLI must delegate rather than duplicate domain logic.

For `init`, compose only the minimum verified existing surfaces required by the architecture, including `installPlan` and the existing repository/bootstrap/safety mechanics discovered at the exact base.

For `adopt`, compose only the minimum verified existing adoption/drift/recovery/install surfaces required by the architecture.

If an architecture-named symbol is absent, incompatible, or cannot safely satisfy the command contract, STOP with an evidence-backed blocker. Do not invent a substitute semantic engine.

### D. Distribution foundation
- Add a real package `bin` mapping for executable name `gef`.
- Preserve source-workspace execution.
- Make the CLI package locally packable/installable for smoke testing (`npm pack` or repository-approved equivalent).
- Do **not** publish to npm, GitHub Releases, or any registry.
- Package only required runtime/build artifacts and normal legal/docs payload.
- Packaged executable must resolve without shell pipelines.
- Broken install/self-check conditions fail closed.

### E. Version provenance
Resolve C6 with one canonical product-version authority for V1.1 candidate builds.

Frozen choice for WO-002:
- root `package.json.version` is the canonical product version source;
- the V1.1 integration line may carry the unreleased candidate version `1.1.0` without implying production approval or publication;
- `packages/cli/package.json.version`, `gef --version`, packed manifest metadata and tests must mechanically agree with the canonical root version;
- update `package-lock.json` consistently if package metadata changes.

A version string is not release evidence. `main` and `v1.0.0` remain production truth until WO-010 promotion.

### F. Test evidence contributed by WO-002
Implement and run the applicable cases from `V1.1-TEST-MATRIX.md`:
- `CLI-E2E-01` through `CLI-E2E-07`, limited to the commands admitted here where a later verb is not yet implemented;
- `DIST-SMOKE-01` through `DIST-SMOKE-04`;
- `UNIT` and `INT` coverage for new parser/renderer/registration/distribution mechanics;
- existing full regression and typecheck.

Where a matrix row requires future commands (`doctor`, `status`, `upgrade`), record it as `DEFERRED_TO_OWNING_WO`, never PASS.

## KNOWN CONSTRAINTS / CONFLICT DISPOSITION
### C3 — architecture package-name mismatch
Do **not** reorganize the monorepo or create a broad canonical-package migration. Use the implemented package layout at the exact base. Record any mapping needed by this WO. Broad package-boundary reconciliation remains deferred to WO-009 unless a minimal dependency fix is strictly necessary.

### C5 — colliding exports
`compatibility`, `redactSecrets`, and path-containment names collide across packages. Never consume these through an ambiguous flat barrel. Bind/import by explicit package/module ownership and use local aliases where needed. Do not rename accepted V1 exports merely for convenience.

### C6 — CLI version/no-bin inconsistency
Resolve only the version/bin/distribution portion defined in Scope D/E. Do not expand into unrelated package-version normalization.

## FILE SEEDS / EXPECTED IMPLEMENTATION SURFACE
These paths are the intended surface; the executor should start here instead of repository-wide rediscovery:

### Existing files expected to change
- `package.json`
- `package-lock.json`
- `packages/cli/package.json`
- `packages/cli/src/index.ts`
- `packages/cli/tsconfig.json` only if required by new CLI files/build entry

### Expected new CLI files (names may change only with evidence-backed reason recorded in the PR)
- `packages/cli/src/parser.ts` — pure argv parsing and command/action mapping
- `packages/cli/src/render.ts` — human/JSON result rendering only
- `packages/cli/src/registry.ts` — bounded V1.1 CLI command registrations/delegation composition
- `packages/cli/src/main.ts` — process boundary, dependency composition, execution, stdout/stderr/exit projection
- `packages/cli/bin/gef.mjs` — minimal executable shim to built CLI entry
- `tests/v11-wo-002-cli.test.mjs` — unit/integration contract
- `tests/v11-wo-002-cli-e2e.test.mjs` — real process CLI cases
- `tests/v11-wo-002-dist-smoke.test.mjs` — local pack/install smoke and no-publication assertions
- `.engineering/evidence/GBS-V11-WO-002-EVIDENCE.md` — executor evidence bundle

### Read-if-triggered, not default-write
- existing domain packages named by `V1.1-CLI-DISTRIBUTION-ARCHITECTURE.md`
- existing kernel/contracts sources needed to type/compose the registrations
- root/build config only when mechanically required

Any write outside the expected implementation surface requires a concrete dependency reason in the evidence bundle and PR description. Broad cleanup is prohibited.

## OUT OF SCOPE
- `gef doctor`, `gef status` implementation (WO-003)
- `gef upgrade` implementation or migration engine changes (WO-004)
- Execution Capsule compiler implementation (WO-005)
- incremental validation/proof reuse implementation (WO-006/007)
- telemetry platform implementation beyond lightweight measurement hooks strictly needed to capture WO-002 benchmark evidence (WO-008 owns the system)
- cross-platform integrated acceptance workflow redesign (WO-009)
- V1.1 production acceptance/promotion (WO-010)
- npm/GitHub Release publication
- mutation of `main` or `v1.0.0`
- broad refactor/package reorganization
- changing accepted V1 public contracts without a separately governed compatibility decision

## ARCHITECTURE RULES
1. Library/application API first, thin CLI second.
2. No business logic in CLI handlers.
3. No direct GitHub-provider model dependency from CLI.
4. All managed filesystem mutation remains under the kernel transaction/safety envelope.
5. Preview/plan paths are side-effect free.
6. Apply/run paths require the owning authorization/precondition contracts and produce receipts.
7. Fail closed on unknown capability/evidence/state.
8. Canonical repository sources remain semantic authority.
9. No executor self-approval.
10. `main` is never an execution target.

## EXECUTOR BOUNDS (ADR-0003-D3)
The executor MAY implement, test, commit, push and open/update a PR for this Work Order on `feat/1.1/wo-002-cli-distribution`.

The executor MUST NOT:
- merge any PR;
- tag or publish;
- force-push or rewrite history;
- mutate `main`;
- move/change `v1.0.0`;
- rewrite V1.0 acceptance/checkpoint history;
- claim `APPROVED`;
- expand scope beyond this WO.

## ACCEPTANCE CRITERIA
1. `gef --help` deterministic, exit 0, no network.
2. `gef --version` equals the canonical root product version and packed package version.
3. Unknown command/malformed flag exits 10 and causes no mutation.
4. `--json` produces a stable machine envelope for representative success and failure.
5. Non-TTY execution never hangs waiting for an implicit prompt.
6. `init` default path is a no-effect plan; `--apply` reaches the governed run path only through kernel/domain contracts.
7. `adopt` default path is a no-effect preview; `--apply` reaches the governed apply path only through kernel/domain contracts.
8. Registry introspection demonstrates canonical command IDs, mutation flags and explicit engine ownership/delegation.
9. CLI handlers contain no duplicated business-policy algorithms.
10. Real locally packed executable resolves and runs on the CI host; package metadata contains a `gef` bin mapping.
11. Distribution smoke proves no publication is performed or claimed.
12. Source-workspace `npm ci`, typecheck/build and existing tests remain valid.
13. Exact-head dependency audit meets repository threshold.
14. Evidence bundle maps every applicable `CLI-E2E-*` / `DIST-SMOKE-*` case to command, result and exact head; future-command rows are explicitly deferred.
15. CRITICAL findings = 0 and HIGH findings = 0 at objective audit.
16. `main` and `v1.0.0` remain unchanged.

## TEST / VALIDATION LADDER
During implementation:
- L1: changed CLI unit tests + typecheck for affected packages.
- L2: CLI integration + process E2E.
- L3: local package/installation smoke.
- L4: full `npm run validate` + dependency audit when impact is uncertain or before PR evidence closure.
- L5/release-wide final assurance remains mandatory later; WO-002 evidence never manufactures V1.1 production acceptance.

Any unknown dependency impact escalates rather than suppresses tests.

## EVIDENCE BUNDLE
Must include:
- exact base SHA and final implementation head;
- changed files and reasons;
- commands/exit codes/test counts;
- applicable test-matrix case mapping;
- package tarball metadata or equivalent local packaging evidence, without publishing;
- version-provenance proof;
- explicit no-publication statement;
- `main` + `v1.0.0` non-modification proof;
- findings by severity;
- deferred rows and owners;
- performance observations only as MEASURED/ESTIMATED/UNAVAILABLE, never invented.

## REVIEW FORMAT
Objective reviewer returns exactly one terminal disposition: `APPROVED`, `CORRECTION_REQUIRED`, or `BLOCKED`, bound to the exact implementation head. Report CRITICAL/HIGH explicitly and distinguish executor evidence from independent verification.

## STOP CONDITION
Stop when implementation + tests + evidence are pushed and PR is ready for **objective audit**. Do not merge.

STOP CONDITION: `GBS_V11_WO_002_READY_FOR_OBJECTIVE_AUDIT`
