# GBS-V12-WO-000 — V1.2 source admission, baseline and scope freeze

**Issue:** #367  
**Status:** `OWNER_AUTHORIZED / ADMISSION_ONLY / NO_IMPLEMENTATION`  
**Risk:** `STANDARD` for this planning/audit increment; candidate financial/Web3/privileged-operation packs are `HIGH_ASSURANCE` if later admitted  
**Exact execution base:** `main@203dc6a86de035b8502453100ea6e2a4788cae57`  
**Current stable package:** `@gef-bootstrap/cli@1.1.2`  
**Current release state:** `GBS_V11_1_1_2_PRODUCTION_ACCEPTED`  
**Planning branch:** `planning/v1.2/wo-000-source-admission`  
**Archived research source:** `planning/gef-v12-research-dossier-001@c85cc91c899b553c1c37fe53ada236b8f76de3e2`

## OBJECTIVE

Admit GEF Bootstrap V1.2 from the current accepted V1.1.2 production line without importing stale V1.1 branch state.

Reconcile the preserved 25-file V1.2 research dossier against current canonical sources and current V1.1.2 implementation reality; measure a reproducible V1.1.2 baseline; classify every proposed V1.2 concept; identify duplicate/obsolete proposals; expose only genuinely blocking owner decisions; then, after those decisions are recorded, prepare the finite canonical V1.2 Source Pack delta for exact-head owner audit.

This Work Order authorizes planning, read-only audit, benchmark execution and governance/evidence artifacts only. It does **not** authorize V1.2 product/runtime implementation.

## CONTEXT

V1.1.2 is production accepted. The old V1.2 planning branch is preserved as research evidence only and must never be merged as canonical authority.

The current canonical route is:
1. `main@203dc6a86de035b8502453100ea6e2a4788cae57`;
2. Issue #367;
3. this Work Order;
4. its Context Lock;
5. Codex source/capability audit and reproducible baseline;
6. owner decisions only for unresolved blockers;
7. canonical Source Pack proposal;
8. exact-head owner audit;
9. promotion of WO-000;
10. only then may WO-001 be separately admitted.

ADR-0007's retirement of the provider-specific integration remains binding. ADR-0008 / D-0063 keeps Codex as sole author of implementation, tests, CI and migrations. Owner-operated semantic audit is explicitly `NOT_INDEPENDENT`.

## SCOPE

### Phase A — source and capability audit

- Read all 25 archived V1.2 planning files at exact commit `c85cc91c899b553c1c37fe53ada236b8f76de3e2`.
- Compare every proposed capability against current V1.1.2 packages, CLI/API, schemas, modules M00-M63, tests, Source Pack, security model, deployment model, evidence/review system and provider contracts.
- Produce a complete disposition map for:
  - C01-C12 universal candidate core;
  - D01-D12 conditional domain packs;
  - R01-R05 experimental/deferred tracks.
- For each item classify:
  - `ALREADY_EXISTS`;
  - `PARTIAL_DELTA`;
  - `GENUINE_V12_DELTA`;
  - `CONDITIONAL_PROFILE`;
  - `EXPERIMENT`;
  - `FUTURE`;
  - `OUT_OF_SCOPE`;
  - `STALE_OR_DUPLICATE`.
- Record owning V1.1.2 modules/contracts and exact repository evidence.
- Reject duplicate engines, renamed copies of existing capability and stale V1.1 assumptions.

### Phase B — reproducible V1.1.2 baseline

Measure representative current behavior from a pinned checkout without changing product/runtime source:

- fresh-project bootstrap;
- brownfield adoption;
- representative small governed Work Order;
- representative larger governed Work Order where practical;
- `gef doctor` / status/resume flows;
- proof reuse and impact-selection behavior;
- build/typecheck/validation wall time;
- selected CI/provider wall time from verifiable receipts where available;
- retry/flake observations;
- security/audit posture;
- token/context inputs only when they can be measured from concrete execution artifacts.

No fabricated percentage, estimate presented as measurement, or synthetic speedup claim is permitted.

### Phase C — blocking owner-decision gate

After A+B, stop and present only unresolved decisions that materially change V1.2 scope. The maximum decision set is:

1. first end-to-end V1.2 pilot profile;
2. core-only release versus core plus reference conditional packs;
3. first Web3 chain if a Web3 pilot is admitted;
4. first game engine/platform if a game pilot is admitted;
5. paid-tool / CI budget boundary for V1.2 validation;
6. specialist independent-review trigger for high-risk financial/contract/privileged operations.

Do not ask a decision that canonical sources or measured evidence already resolve.

### Phase D — canonical Source Pack proposal

Only after Phase C decisions are recorded, prepare proposed V1.2 deltas for:

- Scope;
- Requirements;
- Architecture;
- Security;
- Test & Benchmark Plan;
- Deployment;
- Definition of Done;
- Decisions Ledger / ADRs;
- release denominator;
- profile matrix;
- finite Work Order sequence.

The provisional implementation sequence is:

- WO-001 — Marathon Engine + context acceleration;
- WO-002 — Bug Hunter + contract/property/mutation proof;
- WO-003 — Delta Assurance + Flake Control + Causal Repair;
- WO-004 — Autonomous Review + GitHub hardening under owner-operated `NOT_INDEPENDENT` audit governance;
- WO-005 — Engineering Intelligence + supported application profiles;
- WO-006 — release assurance and promotion.

Codex may recommend a different decomposition only when the capability audit proves that the above sequence would duplicate existing capability, create unsafe coupling or violate current architecture.

### Phase E — admission gate

WO-000 reaches terminal admission only after the proposed canonical Source Pack delta is exact-head audited, all required checks pass, CRITICAL/HIGH = 0 and the V1.2 denominator is explicit and finite.

## OUT OF SCOPE

- V1.2 product/runtime code;
- product tests, CI workflow changes or migrations for V1.2;
- merging `planning/gef-v12-research-dossier-001`;
- rewriting V1/V1.1 accepted history;
- changing `v1.1.2`, its npm artifact or GitHub Release;
- lowering coverage/security/branch-protection requirements;
- reinstating the retired provider-specific integration;
- automatic admission of any D01-D12 domain pack;
- selecting legal/custody/financial security posture by assumption;
- claiming V1.2 completion from planning-file count;
- paid services, paid CI expansion or external certification without owner decision;
- implementation of WO-001 or later WOs.

## FILES / SOURCES TO READ

Read before any executor mutation:

- `AGENTS.md`;
- `.engineering/SOURCE-HIERARCHY.md`;
- `.engineering/CHECKPOINT.md`;
- `.engineering/CHECKPOINT.json`;
- `.engineering/SCOPE.md`;
- `.engineering/DEFINITION-OF-DONE.md`;
- `.engineering/ARCHITECTURE.md`;
- `.engineering/REQUIREMENTS.md`;
- `.engineering/SECURITY.md`;
- `.engineering/TEST-BENCHMARK-PLAN.md`;
- `.engineering/DEPLOYMENT.md`;
- `.engineering/DECISIONS-LEDGER.md`;
- ADR-0007 retirement decision document;
- `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md`;
- `.engineering/handoffs/V1.2-NEXT-STATE.md`;
- `package.json`;
- current package/source/test surfaces needed to map M00-M63 capability;
- all 25 files under the archived V1.2 dossier at exact commit `c85cc91c899b553c1c37fe53ada236b8f76de3e2`.

## REQUIREMENTS

- Preserve domain-specific source authority.
- Treat current code/repository state as descriptive truth and canonical sources as normative truth.
- Treat research snapshot content as evidence, never automatic authority.
- Every candidate C/D/R item must receive one explicit disposition.
- Every `ALREADY_EXISTS` or `PARTIAL_DELTA` finding must cite the owning current capability.
- Every proposed new V1.2 obligation must identify why V1.1.2 is insufficient.
- Benchmarks must record command, exact SHA, environment, sample count where relevant and raw outcome.
- Separate measured values from targets and hypotheses.
- No owner decision may be inferred when it changes release scope, paid-tool use, legal/custody posture or high-assurance review policy.
- High-assurance domain packs must preserve fail-closed design, rollback/roll-forward obligations and independent specialist review where later required by owner decision.
- No unresolved CRITICAL/HIGH finding may be promoted.

## ARCHITECTURE RULES

- Preserve library/application API first; CLI remains a thin transport.
- Preserve deterministic plan → stage → verify → promote/recover semantics.
- Preserve provider-neutral core boundaries and provider adapters.
- Preserve exact-state evidence binding and targeted invalidation.
- Preserve Minimum Sufficient Context and executor-cognition minimization.
- Prefer reuse/extension of M00-M63 capabilities over parallel engines.
- Domain packs extend the universal core through explicit contracts and profiles; they must not fork governance semantics.
- Financial value movement, signing, privileged authentication and irreversible Web3 operations are `HIGH_ASSURANCE`.
- Games and Web3 integrations remain conditional profiles until a real owner-approved target supplies acceptance contracts.

## CONSTRAINTS

- Execution base is exactly `203dc6a86de035b8502453100ea6e2a4788cae57`.
- If `main`, Scope, DoD, Architecture, Requirements, Security, Test Plan, Deployment, Decisions, ADR-0007 or ADR-0008 changes before Codex begins, mark this Context Lock `STALE` and stop for recompile/rebase.
- Do not mutate product/runtime source in Phases A-C.
- Do not modify product tests or CI in Phases A-C.
- Do not force-push, rewrite history or perform destructive cleanup.
- Do not install paid tools.
- Do not add dependencies solely for this audit unless separately admitted.
- Keep archived V1.2 branch/history intact.
- Use owner account `KayzenRoot` for GitHub writes.
- Required Main Branch Protection contexts remain:
  - Repository validation;
  - Pipeline integrity;
  - Gitleaks secrets;
  - Trivy filesystem and configuration.
- Any proposed change to required contexts is future governance, not an implicit part of WO-000.

## ACCEPTANCE CRITERIA

### Phase A+B intermediate gate

- all 25 archived research files inventoried at the exact archived commit;
- C01-C12, D01-D12 and R01-R05 all have explicit dispositions;
- current owner/module/contract overlap identified;
- duplicate and stale proposals called out;
- reproducible V1.1.2 baseline artifact exists with raw measured evidence;
- no product/runtime/test/CI source changed;
- unresolved blocking owner choices reduced to the minimum decision set;
- CRITICAL/HIGH planning or evidence integrity blockers = 0.

### Final WO-000 gate

- owner blocking decisions are recorded;
- proposed Source Pack delta is finite and internally consistent;
- release denominator/profile matrix is explicit;
- WO-001..WO-006 sequence is justified or evidence-backed replacement sequence is provided;
- exact-head required checks pass;
- objective owner semantic audit returns `APPROVED / NOT_INDEPENDENT`;
- CRITICAL/HIGH = 0;
- checkpoint promotion states only proven admission facts;
- no V1.2 implementation is claimed or started.

## TESTS / BENCHMARKS

During Phases A+B run only non-mutating or disposable-fixture validation needed to establish the baseline, including where applicable:

- `npm ci --ignore-scripts` in a disposable/pinned environment when dependency materialization is needed;
- `npm run build`;
- `npm run typecheck`;
- `npm run validate`;
- `npm audit --audit-level=high`;
- `git diff --check`;
- representative CLI bootstrap/adopt/doctor/status flows in disposable repositories;
- existing benchmark harnesses relevant to M45/M57/M63;
- read-only GitHub Actions timing/flake evidence where available.

Do not alter source merely to make a baseline benchmark pass. A failing baseline is evidence to record and classify, not permission to repair product code in WO-000.

## DELIVERABLES

Initial planning artifacts:
- `.engineering/work-orders/GBS-V12-WO-000.md`;
- `.engineering/context-locks/GBS-V12-WO-000.json`.

Codex Phase A+B artifacts:
- `.engineering/evidence/GBS-V12-WO-000-SOURCE-AUDIT.md`;
- `.engineering/evidence/GBS-V12-WO-000-CAPABILITY-MAP.json`;
- `.engineering/benchmarks/GBS-V12-WO-000-V11-BASELINE.json`;
- PR description update with exact executed head, commands, results and intermediate STOP state.

After owner decisions:
- proposed canonical Source Pack deltas;
- proposed Decisions/ADR delta;
- proposed release denominator/profile matrix;
- proposed Checkpoint Delta;
- final Evidence Bundle for exact-head owner audit.

## REVIEW FORMAT

Final review language: Portuguese (Brazil).

Verdict must be exactly one of:
- `APPROVED`;
- `CORRECTION REQUIRED`;
- `BLOCKED`.

Review must include:
- base/head;
- changed paths;
- source-fingerprint status;
- research inventory count;
- C/D/R disposition completeness;
- measured baseline summary;
- required check state;
- CRITICAL/HIGH findings;
- unresolved owner decisions;
- proposed checkpoint disposition.

Owner audit must be labeled `NOT_INDEPENDENT`.

## STOP CONDITION

First executor stop, mandatory:

`GBS_V12_WO_000_SOURCE_AUDIT_READY_FOR_OWNER_DECISIONS`

Do not proceed to canonical Source Pack promotion until owner decisions are recorded.

Second stop:

`GBS_V12_WO_000_CANONICAL_SOURCE_PACK_READY_FOR_OWNER_AUDIT`

Terminal after approved promotion:

`GBS_V12_WO_000_ADMITTED_NO_IMPLEMENTATION`
