# Executor Marathon Pack Template

Status: `OWNER_DIRECTIVE_TEMPLATE`
Authority: `ADR-0002` + `.engineering/EXECUTOR-ACCELERATION-CONTRACT.md`

This template is for target repositories governed by GEF. It is intentionally allowed to be long. Completeness, precision and progress density outrank page count.

---

# 1. EXECUTION IDENTITY
- Project:
- Project ID / lineage:
- Work Order(s):
- Execution base / checkpoint:
- Candidate branch/head:
- Assurance intensity:
- Pack semantic digest:
- Valid until bindings change:

# 2. OBJECTIVE
State the concrete implementation result expected from this invocation.

## Forward-progress target
List the atomic increments/modules expected to finish in this run. Do not express progress only as “work for N hours”.

# 3. DO NOT REOPEN
List resolved product/architecture decisions and their canonical IDs.

For each decision:
- decision ID;
- selected option;
- source/authority;
- reopen trigger.

If no trigger is present, the executor MUST implement the decision rather than re-research alternatives.

# 4. EXECUTOR NAVIGATION MAP

## MUST_READ
Exact files/symbols to read before edits.

## READ_IF_TRIGGERED
Files that may be opened only when the named trigger occurs.

## WRITE_ALLOWED
Exact paths/domains allowed to change.

## WRITE_FORBIDDEN
Paths/domains outside the Work Order.

## KNOWN NEGATIVE SEARCHES
Facts/capabilities already proven absent so the executor does not search for them again.

# 5. IMPLEMENTATION SEED TREE
For every planned path:

```text
path:
mode: NEW_FILE_SEED | EXISTING_FILE_PATCH_INTENT | STRUCTURE_ONLY
owner:
purpose:
seed status:
```

# 6. FILE INTENT CAPSULES
For each file/change:

```text
FILE:
OWNER:
PURPOSE:
INPUTS:
OUTPUTS:
IMPORTS:
EXPORTS:
DEPENDENCIES:
INVARIANTS:
ERROR SEMANTICS:
ALGORITHM / CONTROL FLOW:
CONCURRENCY / TRANSACTION NOTES:
SECURITY NOTES:
IMPLEMENTATION TODO:
REQUIRED TESTS:
FORBIDDEN CHANGES:
OPEN QUESTIONS:
SOURCE / DECISION REFERENCES:
```

For brownfield existing files, include current validity fingerprint and exact symbols/regions expected to change.

# 7. EXECUTION WAVES

## Wave N
- mode: SERIAL_REQUIRED | PARALLEL_SAFE | FUSED_SERIAL
- prerequisites:
- files:
- implementation tasks:
- expected artifact/evidence:
- checkpoint after wave:
- stop if:

Dependent waves MUST stop when a predecessor requires correction. Independent completed waves remain valid if their bindings are unchanged.

# 8. HEAVY IMPLEMENTATION GUIDANCE
Provide enough algorithmic direction that the executor implements rather than redesigns. Include difficult edge cases, library integration constraints and known platform behavior.

Do not prescribe fake certainty where planning left an explicit unknown.

# 9. PROGRESSIVE VALIDATION PLAN

## L0 static
- targeted type/build/schema/static checks:

## L1 direct tests
- tests directly mapped to changed symbols:

## L2 impacted closure
- dependent tests selected by M28/Test Impact:

## L3 integration boundaries
- affected integration/API/provider/persistence tests:

## L4 risk expansion
- broader suites triggered by incomplete knowledge/high risk:

## L5 exact-head assurance
- final full regression / security / CodeQL / E2E / platform matrices required by assurance:

# 10. REUSABLE GREEN PROOFS
For each reusable previous PASS:
- Test Proof Reuse Receipt ID;
- prior result identity;
- source/test/config/toolchain/platform bindings;
- current compatibility verdict.

Never write “already passed, skip” without a current reusable receipt.

# 11. FAILURE-RETRY POLICY
When a test fails:
1. preserve failure fingerprint;
2. correct the narrow cause;
3. rerun the failed test;
4. rerun impacted closure;
5. widen only if systemic risk/uncertainty or policy requires it.

Do not restart all expensive suites after every tiny correction by default.

# 12. SEARCH / CONTEXT EXPANSION TRIGGERS
The executor may expand beyond MUST_READ only for explicitly permitted triggers such as:
- missing referenced symbol;
- stale fingerprint;
- compiler contradiction;
- unknown dependency;
- unexpected brownfield structure;
- assurance requirement.

Every expansion should record why the original context was insufficient.

# 13. EVIDENCE OUTPUTS
List exactly what the executor must leave behind:
- changed files;
- test/evidence receipts;
- diagnostics/findings;
- checkpoint delta;
- unresolved blockers;
- next legal action.

# 14. FINAL EXACT-HEAD GATE
Before completion, verify the required final suites on the exact candidate head. A subsequent relevant code/config/test change invalidates affected evidence.

## Owner audit and merge authority

The configured project-owner GitHub account is the final semantic auditor and merge actor. A collaborator review may be requested only as optional advice; it must not be required for progress or merge. Record the owner audit against the exact candidate SHA and do not describe it as independent.

Merge only when every required check is successful on that exact SHA, the owner audit is `OWNER_APPROVED`, the target branch is authorized, and no blocking CRITICAL/HIGH finding remains. Preserve all test, security, recovery and branch-protection gates. Never bypass failed/pending checks or rewrite history.

# 15. STOP CONDITIONS
Define:
- success stop;
- correction-required stop;
- blocked stop;
- indeterminate/context-expansion stop;
- recovery stop.

# 16. EXECUTOR RESPONSE CONTRACT
Return a compact machine/human summary containing:
- waves completed;
- files changed;
- tests run versus reused;
- failed/corrected tests;
- final exact-head evidence;
- blockers/findings;
- remaining work;
- next legal action.

---

## Template principle
The pack may span many pages. Remove redundancy, not obligations. The executor should finish reading with substantially fewer meaningful decisions left to make than it would have had from a generic “implement module X” prompt.
