# GBS-V11-WO-009 — Integrated Assurance, Security, Documentation and Runbooks

Status: `OWNER_AUDIT_APPROVED_MERGED` on release/1.1. Historical admission base and conditions below remain preserved; implementation PR #316 merged at `cb6cf5cf4f27d9d717921aa833ee342863f0d172` after exact-head owner audit #5889695018. WO-010 production acceptance remains unadmitted and separate.
Release line: `1.1.x`
Assurance: `ELEVATED`
Implementation branch after admission (clean-lineage replacement): `feat/1.1/wo-009-integrated-assurance-clean-history`

## OBJECTIVE

Complete integrated V1.1 assurance and operational documentation before production acceptance. Prove the frozen V1.1 Test Matrix on Windows, Linux and macOS at one exact candidate head; resolve the currently reported HIGH CodeQL finding; publish accurate install, upgrade, recovery and fresh-context continuation runbooks; and ensure a new project chat resumes from canonical repository state and states the one next legal action.

WO-009 does not declare production acceptance. WO-010 retains production acceptance, promotion to `main`, and the `v1.1.0` tag.

## CONTEXT

- V1.0 remains production accepted at 1088/1088 on `main`; its history and `v1.0.0` tag are immutable.
- WO-008 is merged on `release/1.1`. Its CLI ROI verdict is `NO_CHANGE`; token count is `UNAVAILABLE`; `optimizationClaimEligible=false`. Do not imply measured optimization gains.
- Admission base: `2d6538c3d90b63107b0cb4a4f6255c44cbfa61d1`. Production `main` head: `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`. The `v1.0.0` tag object is `aac89f9c3f0c884474958025bf14828bc338b5ee` and targets `866fe3af8cccc65c929aaf6a47a924401fa448b3`.
- GitHub Advanced Security CodeQL check #108450457038 on PR #278 reports one new alert including one HIGH at the current release head. The associated CodeQL scan workflow succeeded, proving that scanning ran, not that findings are clear. Identify and resolve the HIGH, then verify exact-head closure before WO-009 final audit and WO-010 acceptance. No suppression, severity downgrade or assumption that the alert is unrelated is allowed.
- M18 already enforces conversation independence and safe handback. M20 defines the singular Next Necessary Action Capsule and stale-response rejection. Integrate and verify these authorities; do not create a competing source of project truth.

## SCOPE

1. Add a V1.1 release-assurance workflow that runs full repository validation and applicable focused suites on Ubuntu, Windows and macOS, bound to the exact PR/release-line head.
2. Preserve individual Work Order assurance workflows and the frozen Test Matrix. An aggregate green job does not replace required case evidence; an unrun row remains `NOT_RUN`.
3. Extend Security CodeQL coverage to the V1.1 release line and relevant JavaScript/TypeScript sources, tests and security workflow. Reproduce and resolve the finding reported by #108450457038. Retain its rule/source, remediation and exact-head disposition. Do not silence the finding or weaken thresholds.
4. Execute the frozen migration, compatibility, install, recovery, CLI, context compilation, incremental validation, proof reuse, telemetry, security and full-regression cases, including fail-closed paths.
5. Publish user-facing V1.1 install, upgrade and recovery guidance, linked from applicable documentation. State the source-workspace distribution truthfully; do not claim package publication or V1.1 production release before WO-010.
6. Verify governed construction handoffs across planning, implementation, test/evidence, review, blocked and resume states. Every human/machine handoff for a governed project build identifies the verified project/repository and release or project phase, active module/Work Order/stage, exact checkpoint/head, blockers, required prerequisites/tests, and exactly one canonical next necessary action when known. If canonical inputs conflict, are stale, or identify no action, surface `CONFLICT`, `INDETERMINATE`, `BLOCKED` or explicit `NONE/UNKNOWN`; do not guess from chat history.
7. Add an end-to-end fresh-context resume scenario with no prior conversation history. Reconstruct from canonical checkpoint/source bindings, emit the next construction stage, then prove stale-head and checkpoint/handoff conflicts stop execution without inventing a successor.
8. Update WO-010 release-plan language to match ADR-0006: `KayzenRoot` performs an exact-head owner audit, expressly not independent. Keep all objective evidence and production acceptance gates.
9. Produce an exact-head Evidence Bundle with case/result map, OS/toolchain/commands, workflow run IDs, security disposition, dependency audit, docs/runbooks, truthful benchmark status, risks and proposed Checkpoint Delta.

## OUT OF SCOPE

- WO-010 production acceptance, merge to `main`, tag creation/movement, publication or announcement.
- Changes to `main`, `v1.0.0`, repository rulesets, required checks or release protections.
- Collaborator approvals or writes from any account other than `KayzenRoot`.
- New product features unrelated to frozen V1.1 scope.
- A second resume/response authority beside M18/M20.
- Weakening, skipping, suppressing, downgrading or relabeling a required security, migration, recovery, regression or exact-head gate.
- Performance improvement claims not demonstrated by comparable WO-008 populations.

## FILES / SOURCES TO READ

1. `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`.
2. This Work Order, Context Lock and Direct Execution Brief.
3. `.engineering/releases/V1.1-RELEASE-PLAN.md`, `V1.1-SCOPE.md` and `V1.1-TEST-MATRIX.md`.
4. `.engineering/DEFINITION-OF-DONE.md` and `.engineering/ARCHITECTURE.md` (A10).
5. `.engineering/SECURITY.md` (T1-T12 and SEC-01..SEC-*).
6. `.engineering/releases/V1.1-COMPATIBILITY-MIGRATION-CONTRACT.md` and `V1.1-PERFORMANCE-BENCHMARK-PROTOCOL.md`.
7. `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`.
8. ADR-0003, ADR-0005 and ADR-0006.
9. `.engineering/evidence/GBS-WO-M18-001-EVIDENCE.md` and WO-002..WO-008 evidence bundles.
10. `planning/modules/area-e-continuity/m18-resume-engine/S01..S04` and `m20-response-contract/S01..S05`.
11. Existing M18/M20 tests, all prior V1.1 workflows, and affected code.
12. The PR #278 CodeQL finding and exact-head findings available through the connected GitHub integration.

Repository state at the admitted base outranks planning summary. If a required source changes after admission, stop and refresh the Context Lock.

## REQUIREMENTS

### R1 — Exact-head integrated matrix
Run all frozen Test Matrix suites/cases on each platform marked ✓. Every result binds to commit, OS and toolchain. Keep dedicated workflows; report `NOT_RUN` explicitly; never infer a pass.

### R2 — Full regression and repository quality
At the exact candidate head, pass complete repository build/typecheck/test/repository validation, CLI/distribution checks, dependency audit at the accepted threshold, and existing Work Order workflows. Record counts and run identities. No cached receipt suppresses the final sweep.

### R3 — Security finding closure
Include `SEC-INT-01..06`, T1-T12 threat-to-control mapping, dependency audit, secrets redaction, integrity drift, path/symlink boundaries and default-deny mutation proof. Make CodeQL run for relevant V1.1 changes. Identify and resolve the current HIGH from #108450457038, then demonstrate zero unresolved CRITICAL/HIGH findings applicable to the exact V1.1 candidate. A successful scan with an open alert is not clean. Add supplemental case SEC-INT-07 for exact-head CodeQL alert disposition.

### R4 — Migration and recovery
Prove dry-run side-effect freedom, digest agreement, complete recovery, incomplete recovery fail-closed, preservation of user-modified/conflicting files, unsupported/indeterminate compatibility and V1.0-to-V1.1 forward-port. No user data overwrite or silent partial state.

### R5 — Install, upgrade and recovery documentation
Runbooks state prerequisites, supported platforms/toolchain, safe install, brownfield preview, backup/checksum/provenance, migration dry-run/apply, interruption/recovery paths, diagnostics, permissions and stop/escalation conditions. Match actual CLI behavior and source-workspace distribution. Do not promise npm publication, automatic cloud setup or V1.1 production availability.

### R6 — Universal fresh-context project steering
Canonical Project Brain/checkpoint/Work Order/Context Lock and verified provider state are authority; chat history is informational. For each governed build response/handoff class, provide one canonical next stage/action or explicit `NONE/UNKNOWN`, plus checkpoint identity and blocking prerequisites. Include:
- `CONT-RESUME-01`: a new context reconstructs the exact active stage and next legal action without prior chat;
- `CONT-RESUME-02`: checkpoint/handoff conflict yields non-success and no selected successor;
- `CONT-RESUME-03`: stale branch/head or invalid evidence blocks resume;
- `CONT-RESUME-04`: planning, implementation, verification, review and blocked projections preserve the singular next-action contract and stop state.
No response may invent a stage, skip a Work Order or treat chat claims as a promoted checkpoint.

### R7 — Honest release and optimization language
Retain WO-008 `NO_CHANGE` and `UNAVAILABLE` results. Keep V1.1 in development/RC state until WO-010 acceptance. WO-010 requires an exact-head owner audit recorded as not independent.

### R8 — Owner-operated audit and merge
`KayzenRoot` performs a substantive exact-head owner audit in Brazilian Portuguese. Record candidate SHA, scope, matrix/case map, platform/regression/security evidence, finding disposition, CRITICAL/HIGH counts, production boundary and one disposition: `OWNER_APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`. Never call it independent. Collaborator approval is not required.

## ARCHITECTURE RULES

- M18 owns resume authority, canonical continuation, drift/stale detection and safe handback.
- M20 owns response verdict, blocker projection, singular Next Necessary Action Capsule, source provenance, machine/human parity and stale-response rejection.
- M17 checkpoint and the admitted Work Order remain canonical for the next build step.
- Security and final exact-head regression cannot be suppressed through incremental validation or proof reuse.
- Tests and runbooks perform no provider mutation and publish no release artifact.
- Preserve the neutral ecosystem boundary from ADR-0005.

## CONSTRAINTS

- Work only on the admitted branch based on the exact WO-009 governance/admission merge.
- No direct writes to `main` or `v1.0.0`; no force-push or history rewrite.
- Keep V1.0 acceptance, tag object/target and branch protections unchanged.
- All GitHub writes and the exact-head audit/merge use `KayzenRoot`; no collaborator review is requested.
- Never merge with a required check pending, failed, stale or bound to another head.
- Never merge with unresolved CRITICAL/HIGH blockers.
- Do not start WO-010 or claim promotion until WO-009 exact-head audit and gates are green.
- No new dependency without demonstrated need, security review and lockfile justification.
- If the current HIGH finding cannot be located or its disposition verified with connected GitHub evidence, stop final audit as `BLOCKED`.

## ACCEPTANCE CRITERIA

1. Every frozen Test Matrix suite/case is mapped to exact-head evidence on Windows, Linux and macOS; no required row is missing or inferred.
2. `UNIT`, `INT`, `CLI-E2E`, `DIST-SMOKE`, `UPG-MIG`, `COMPAT`, `CTX-DET`, `INC-VAL`, `PROOF-INV`, `TELEM`, `SEC-INT` and `REG` are green on all marked platforms.
3. Build/typecheck/test/repository validation and dependency/security audit pass at the accepted threshold on the exact candidate.
4. CodeQL runs for V1.1 and relevant source changes. Supplemental case SEC-INT-07 binds the check #108450457038 finding to the exact candidate and proves it is closed by verified remediation or conclusive safe disposition; no unresolved CRITICAL/HIGH remains applicable.
5. `UPG-MIG-01..07`, `COMPAT-01..06`, `SEC-INT-01..06` and `REG-01..07` meet the frozen Test Matrix.
6. Install, distribution smoke, upgrade dry-run/apply, interruption and recovery runbooks exist, are linked from relevant docs, and match actual CLI behavior on supported platforms.
7. User-facing docs state V1.1's development/RC boundary; they do not imply production acceptance, npm publication or tag `v1.1.0`.
8. `CONT-RESUME-01..04` pass through M18/M20: fresh context routes to the checkpoint's single legal next action; stale/conflicting state returns non-success without continuation.
9. Human/machine handoffs share the same response identity, checkpoint and next-action semantics. Every governed build response routes to the canonical construction stage or explicitly reports unknown/blocked.
10. Runbooks explain restarting a new chat from canonical sources without replaying chat history and how to proceed when repository/provider evidence is unavailable.
11. WO-010 release-plan text names an exact-head owner audit by `KayzenRoot` and says it is not independent.
12. Evidence Bundle maps source/candidate/head, all suite/case results, run IDs, security disposition, dependency audit, docs/runbooks, known limits and proposed Checkpoint Delta.
13. `main`, tag `v1.0.0`, production acceptance and repository rulesets are unchanged.
14. Exact-head owner audit is `OWNER_APPROVED`, all required checks succeed on the same SHA, CRITICAL=0/HIGH=0. It is not independent; collaborator review is not required.

## TESTS

Frozen mandatory suites/cases:
- `UNIT`, `INT`, `CLI-E2E-01..07`, `DIST-SMOKE-01..04`
- `UPG-MIG-01..07`, `COMPAT-01..06`
- `CTX-DET-01..08`, `INC-VAL-01..05`, `PROOF-INV-01..05`
- `TELEM-01..06`, `SEC-INT-01..06`, supplemental `SEC-INT-07` CodeQL finding disposition, `REG-01..07`

WO-009 continuation cases:
- `CONT-RESUME-01` fresh-context reconstruction;
- `CONT-RESUME-02` conflicting canonical checkpoint/handoff;
- `CONT-RESUME-03` stale branch/head/evidence;
- `CONT-RESUME-04` planning/implementation/verification/review/blocked projections.

Rerun the exact focused workflows owned by WO-002..WO-008 and the full repository regression. No final sweep is suppressed.

## DELIVERABLES

- Cross-platform V1.1 release-assurance workflow and exact-head run evidence.
- Security CodeQL trigger coverage for `release/1.1`, finding disposition, threat-to-control map and dependency audit.
- Install/upgrade/recovery and fresh-context continuation runbooks, linked from relevant docs.
- Continuation E2E tests and any narrowly required contract-conformance correction.
- ADR-0006-compliant WO-010 wording in the release plan.
- `.engineering/evidence/GBS-V11-WO-009-EVIDENCE.md` and proposed Checkpoint Delta.

## REVIEW FORMAT

Owner audit in Brazilian Portuguese on the PR conversation. Include exact candidate SHA, changed paths, matrix and CONT-RESUME mapping, all three platform results, build/typecheck/dependency checks, CodeQL finding/disposition, T1-T12 controls, migration/recovery, runbook links, production-boundary verification, CRITICAL/HIGH counts, risks and one disposition: `OWNER_APPROVED`, `CORRECTION_REQUIRED` or `BLOCKED`. This is an owner audit, not independent. No collaborator approval is required.

## STOP CONDITION

Stop after implementation, integrated tests/evidence, documentation/runbooks and exact-head owner audit. If `OWNER_APPROVED`, all required checks succeed on the exact same head, the CodeQL HIGH is closed and CRITICAL/HIGH=0, `KayzenRoot` may merge into `release/1.1` and promote the checkpoint. Then the next legal action is plan/admit WO-010. Do not perform WO-010 production acceptance, merge to `main`, tag or publish under this Work Order.

STOP CONDITION: `GBS_V11_WO_009_READY_FOR_OWNER_AUDIT`


## 2026-09-29 owner lineage correction

PR #302's ancestor source-restore commit `83a7d926d559741a7e0d09b6f9a7ee3fff22e65a` causes the complete-range Gitleaks gate to re-detect six already-present, unchanged planning/test fixtures even though those files are absent from the PR net diff. To preserve the full security scan without exceptions, a clean child branch of `5ea917ae50cc8ce45022b76695c1b8cc2c2fc37d` carries the identical net implementation tree. Keep PR #302 as a superseded audit trail, without force-push or rewritten history; do not infer security clearance until the clean exact-head checks and CodeQL alert disposition succeed. The Work Order scope, release boundary and all acceptance gates are unchanged.


## 2026-09-29 release security prerequisite reconciliation

Narrow security PR #317 was owner-audited on candidate `447cb34fc1fdc19d0d230b7972cfbde76bfedd50` with 12/12 required workflows and three post-ready rechecks successful. Its squash merge to `release/1.1`, `0172d774719d10ab8d7aab5de9ef0ace2cb5878d`, applied the CodeQL #2 source fix, SEC-INT-07 regression and expanded CodeQL coverage before WO-009 completion. This Work Order now resumes on the ancestry-preserving reconciled clean branch with Context Lock bound to `0172d774719d10ab8d7aab5de9ef0ace2cb5878d`, pending exact-head full assurance and provider-verified historical alert disposition. Do not merge to `main` or claim V1.1 production acceptance.
