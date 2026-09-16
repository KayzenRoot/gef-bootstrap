# GBS-V11-WO-001 - Release Foundation and Compatibility Lock

Status: `READY_FOR_EXECUTOR`
Release: `1.1.0`
Base branch: `release/1.1`
Work branch: `feat/1.1/wo-001-release-foundation`
Assurance: `STANDARD`, escalate to `ELEVATED` for release/compatibility contract changes.

## OBJECTIVE
Create the governed architectural foundation for GEF Bootstrap V1.1 before broad implementation: freeze CLI architecture, distribution strategy, compatibility/migration policy, stable-main release-channel contract, benchmark baseline and V1.1 test strategy. Produce implementation-ready contracts for subsequent Work Orders while preserving V1.0.0 production acceptance.

## CONTEXT
V1.0.0 is production accepted. `main` is production-only. V1.1 development occurs on `release/1.1` and subordinate branches. V1.1 adds a real CLI/distribution surface plus executor acceleration, incremental validation, proof reuse, upgrade/doctor hardening, compatibility and performance telemetry.

## CONTEXT LOCK
Executor MUST begin by recording:
- `git rev-parse HEAD`
- `git rev-parse release/1.1`
- `git status --short`
- Node/npm versions
- hashes/fingerprints of canonical sources read

Expected authorized release/1.1 lineage at WO creation: `331414660a195716471ce3b150ff6d20c3dcec51`.
If canonical Scope, DoD, Architecture, Decisions Ledger, V1.1 Scope or Release Plan changes incompatibly after compilation, mark the Work Order `STALE` and stop for recompile/rebase.

## FILES / SOURCES TO READ FIRST
1. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`
2. `.engineering/DECISIONS-LEDGER.md`
3. `.engineering/SCOPE.md` if present, otherwise the canonical scope source identified by repository inspection
4. `.engineering/DEFINITION-OF-DONE.md`
5. `.engineering/ARCHITECTURE.md`
6. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`
7. `.engineering/releases/V1.1-SCOPE.md`
8. `.engineering/releases/V1.1-RELEASE-PLAN.md`
9. `package.json`, workspace package manifests and current CLI/runtime entrypoints
10. current distribution, upgrade, compatibility, doctor, context compiler, test-impact, evidence/proof and telemetry implementations/tests/docs

Repository evidence overrides assumptions in this Work Order if a conflict is discovered. Report the conflict rather than silently changing approved policy.

## SCOPE
### A. Release channel contract
- Codify `main = latest PRODUCTION_APPROVED`.
- `release/1.1` is integration only until production acceptance.
- Define `1.0.x` hotfix lineage and mandatory forward-port into V1.1 where applicable.
- Define exact-head promotion requirements and tag immutability.

### B. CLI architecture contract
Design the production CLI architecture for:
- `gef init`
- `gef adopt`
- `gef doctor`
- `gef status`
- `gef upgrade`
Define command parsing boundary, service/application boundary, structured output contract, deterministic exit codes, help/version behavior, non-interactive/CI behavior, filesystem safety, error mapping and test seams. Reuse existing V1 engines rather than duplicating business logic.

### C. Distribution strategy
Specify the supported V1.1 install/distribution model and packaging contract. Preserve source-workspace compatibility where reasonable. Define version provenance, executable/bin mapping, package contents, install verification, uninstall/cleanup boundaries and cross-platform constraints. Do not claim publication until actually proven by later release evidence.

### D. Compatibility and migration policy
Define compatibility dimensions for GEF version, project adoption mode, schema/config versions, generated/managed files and supported Node/platform ranges. Define preservation-first upgrade behavior, dry-run, conflict classification, transactional apply/recovery, backup/rollback or roll-forward semantics and unsupported-path behavior.

### E. Executor acceleration architecture
Freeze the V1.1 Execution Capsule contract: minimal canonical sources, affected files/dependencies, constraints, acceptance criteria, selected tests, reusable evidence references, fingerprints/invalidation metadata and STOP CONDITION. It MUST be deterministic enough for repeatable compilation and MUST fail closed when context certainty is insufficient.

### F. Incremental validation + proof reuse architecture
Define how Test Impact selects validations and when it escalates to broader/full assurance. Define proof reuse eligibility/invalidation using lineage, source fingerprints, dependency impact, policy/version compatibility and expiration if applicable. No proof reuse may manufacture production credit.

### G. Performance telemetry + benchmark baseline
Define comparable metrics and baseline procedure for representative executor workloads: wall-clock duration, context/source volume, files inspected, tests/checks executed, cache/proof reuse, retries/rework and outcome. Incomparable populations MUST be reported as incomparable, not converted into a speedup claim.

### H. Test strategy
Produce V1.1 test matrix covering unit, integration, CLI E2E, install/distribution smoke, upgrade/migration/recovery, compatibility, context capsule determinism, incremental-validation fail-closed behavior, proof invalidation, telemetry semantics, security/integrity and Windows/Linux/macOS assurance.

## OUT OF SCOPE
- Broad implementation of WO-002 through WO-010.
- Publishing packages/releases.
- Merging V1.1 to `main`.
- Moving/replacing tag `v1.0.0`.
- Breaking accepted V1 contracts without an explicit governed compatibility decision.
- Unrelated refactors or cosmetic cleanup.

## REQUIRED DELIVERABLES
Create or update governed V1.1 architecture/specification artifacts as repository conventions dictate. At minimum evidence must cover:
1. release-channel ADR/decision;
2. CLI/distribution architecture;
3. compatibility/migration contract and matrix skeleton;
4. Execution Capsule schema/contract;
5. incremental-validation/proof-reuse contract;
6. performance benchmark protocol/baseline plan;
7. V1.1 test matrix;
8. implementation decomposition mapping each contract to WO-002..WO-010;
9. Evidence Bundle for this Work Order.

Prefer extending canonical documents when that is the established repository pattern. Do not create competing sources of truth.

## ACCEPTANCE CRITERIA
- No change to V1.0.0 acceptance history or tag.
- `main` remains untouched by this Work Order.
- Every V1.1 NECESSARY scope item maps to an implementation Work Order and verification path.
- CLI architecture delegates to existing domain engines where available.
- Distribution claims are explicit about what is designed vs already proven.
- Upgrade policy is preservation-first and fail-closed on unsafe ambiguity.
- Execution Capsule has deterministic identity/fingerprint and explicit invalidation semantics.
- Incremental validation cannot silently omit uncertain affected tests.
- Proof reuse requires valid lineage/fingerprints and cannot fabricate credit.
- Benchmark protocol prevents incomparable speedup claims.
- Test matrix includes Windows, Linux and macOS.
- Existing repository validation remains green.
- CRITICAL/HIGH findings = 0 for WO acceptance.

## TESTS / VALIDATION
Run repository-prescribed validation. At minimum, if supported by current package scripts:
- typecheck
- full automated test suite
- dependency/security audit at the repository's accepted severity threshold
- any architecture/schema/contract validation introduced by this WO

If a prescribed command is unavailable, record that fact and use the canonical equivalent discovered in the repo. Do not invent passing evidence.

## EVIDENCE BUNDLE
Record:
- exact base/head SHAs;
- changed files;
- commands executed + exit codes;
- test counts/results;
- audit/security results;
- generated contract/schema validation;
- unresolved findings by severity;
- explicit statement that `main`/`v1.0.0` were not modified;
- mapping from acceptance criterion to proof.

## EXECUTOR RULES
1. Inspect before editing.
2. Implement only this Work Order.
3. Prefer deterministic Git/AST/schema/tests over LLM inference.
4. Do not force-push or rewrite history.
5. Do not merge to `main`.
6. Do not mark complete from prose alone; completion requires evidence.
7. Commit and push the work branch, then open a PR targeting `release/1.1`.
8. PR title/body must include `GBS-V11-WO-001` and evidence summary.
9. Finish with a concise pt-BR execution report containing status, PR, exact head, tests/evidence, findings and STOP CONDITION.

## REVIEW FORMAT
Auditor returns exactly one primary disposition: `APPROVED`, `CORRECTION_REQUIRED`, or `BLOCKED`, followed by severity findings and evidence references. Known HIGH/CRITICAL forbids advancement.

## STOP CONDITION
Stop only when the WO implementation/specification is committed, pushed, PR opened against `release/1.1`, required validation/evidence is attached or referenced, and executor reports:
`GBS_V11_WO_001_READY_FOR_OBJECTIVE_AUDIT`.
