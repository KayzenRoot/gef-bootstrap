# GBS-M07-S03 — Conditional Templates

Status: `FROZEN`

## Purpose
Freeze deterministic conditional selection for M07. S03 consumes frozen S01 condition markers plus the immutable S02 variable snapshot and emits a compact branch-selection snapshot for S04. It is read-only and does not render bytes or perform effects.

## Ownership
S03 owns condition structure, BOOLEAN truth semantics, nesting, short-circuiting, deterministic evaluation order and condition-decision evidence.

S03 does not own marker vocabulary (S01), variable resolution (S02), rendering (S04), final rendered validation (S05), artifact existence, filesystem/transaction effects (M05/M06), process execution or provider/Git mutation.

## Frozen contract

### COND-01 — No expression language
Only frozen S01 markers are valid: `if <identifier>`, `else`, and `end` within the GEF marker namespace. S03 adds no comparisons, operators, literals, functions, loops, macros, includes, eval or alternate branches such as elseif.

### COND-02 — BOOLEAN-only conditions
Each `if` references exactly one declared S02 variable. The declaration must allow `CONDITION_REFERENCE` and have type BOOLEAN. STRING, INTEGER and ENUM have no truthiness semantics.

Unknown declarations, wrong type or disallowed context fail even when the branch would later be inactive.

### COND-03 — Exact truth result
For a reached condition:
- true selects PRIMARY;
- false selects ALTERNATE when `else` exists;
- false without `else` selects EMPTY for that span.

No coercion or inversion exists.

### COND-04 — Optional absence is not false
A reached S02 `UNBOUND_OPTIONAL` condition blocks with a typed unbound-condition result. It is never silently false.

A nested optional condition inside a subtree excluded by an outer decision is not evaluated and therefore does not block solely because its value is absent. Required missing values remain S02 failures.

### COND-05 — Full static validation before selection
Every TEXT_TEMPLATE condition tree is structurally validated before runtime branch selection. Validation includes declaration existence, BOOLEAN type, context permission, pairing, nesting and budgets.

Short-circuiting may skip runtime values only; it never skips static validity.

### COND-06 — Deterministic short-circuit and order
Reachable conditions evaluate in stable source-tree preorder. Inactive nested subtrees are NOT_EVALUATED, never fabricated as FALSE.

Parallel internal scheduling may not alter selections, evidence order or digest semantics.

### COND-07 — Proper branch tree
Each `if` has zero or one `else` and exactly one matching `end` within the same TEXT_TEMPLATE source. Duplicate/unmatched else, unmatched end, unclosed if, crossing structure or cross-entry closure fail closed.

Nesting follows nearest-open stack semantics and finite depth limits. Empty branches are valid.

### COND-08 — Text selection only
Conditions select logical text spans inside TEXT_TEMPLATE. They do not suppress TemplateEntry existence, choose target paths, delete artifacts or affect BINARY_COPY.

Condition directives remain forbidden in targetPattern. An entry whose selected content is empty remains an entry for S04/S05.

### COND-09 — No whitespace magic
Condition control markers are not output data, but S03 performs no whitespace trimming, newline chomping, indentation rewriting or automatic cleanup around them. S04 owns byte materialization.

### COND-10 — Variable values cannot create new conditions
S02 values are single-pass data. Marker-looking bytes contained in a variable value are never re-lexed as S03 control syntax.

### COND-11 — No ambient truth source
S03 reads no environment, cwd, home, clock, random, Git, filesystem, network or provider state to decide truth. It consumes only a compatible immutable S02 snapshot bound to the same template semantics.

A mismatched snapshot blocks rather than being silently refreshed.

### COND-12 — Static and evaluated dependencies differ
S03 tracks:
- `staticConditionRefs`: every structurally valid condition reference;
- `evaluatedConditionRefs`: only condition variables actually reached.

Inactive conditions remain part of template semantics but not runtime-evaluated dependencies.

### COND-13 — Separate deterministic decision identity
Runtime BOOLEAN values do not change `templateSemanticDigest`. S03 produces a separate `conditionalDecisionDigest` bound to template semantic identity, compatible S02 value identity, S03 contract version, stable condition-node identities, reached outcomes, selected branches and evaluated dependencies.

Clocks, random/run IDs, telemetry and machine-local paths are excluded.

### COND-14 — Compact truthful evidence
Condition-node identity is deterministic from stable template structure, not random. Evidence may expose node ID, variable ID, TRUE/FALSE, PRIMARY/ALTERNATE/EMPTY and sanitized dependency identity.

Unreached nodes are NOT_EVALUATED. Normal evidence excludes source bodies and absolute local paths.

### COND-15 — Read-only, bounded and cancellable
S03 is S0 read-only. It performs no writes, staging, recovery, package installation, process execution, network fetch, cwd/environment mutation or brownfield normalization.

Finite budgets cover node count, branch count, nesting depth, reachable evaluations and evidence size. Budget exhaustion or cancellation/deadline causes a typed block with no target effect.

### COND-16 — Selection is not rendering or authorization
S03 success proves only valid condition structure and deterministic branch selection. S04 still owns rendering, S05 final validation, and M05/M06 all effects and path authority.

## Logical result

```text
ConditionalSelectionSnapshot {
  conditionContractVersion
  templateSemanticDigest
  variableValueDigest
  entries[] {
    entryId
    conditionTreeDigest
    selectedStructure
    decisions[] { conditionNodeId, variableId, evaluationStatus, booleanOutcome?, selectedBranch? }
  }
  staticConditionRefs[]
  evaluatedConditionRefs[]
  conditionalDecisionDigest
  gaps[]
}
```

`selectedStructure` is a compact span/token selection, not output bytes.

## Deterministic lifecycle

`BIND S01 → BIND S02 → VALIDATE FULL TREE → VALIDATE CONDITION DECLARATIONS → EVALUATE REACHABLE NODES → SHORT-CIRCUIT INACTIVE SUBTREES → BUILD SELECTION → DIGEST → EMIT SNAPSHOT`

## Frozen decisions
1. no expression language;
2. one declared BOOLEAN variable per if;
3. no truthiness/coercion;
4. reached UNBOUND_OPTIONAL blocks;
5. short-circuit skips values, never structural validation;
6. else is optional and unique;
7. every if has one end in the same source;
8. proper stack/tree nesting;
9. empty branches are valid;
10. conditions select text spans only, not artifact existence;
11. no targetPattern or BINARY condition semantics;
12. no whitespace magic;
13. variable-produced markers are never re-evaluated;
14. no ambient truth state;
15. static and evaluated dependencies remain distinct;
16. runtime decisions have separate deterministic identity;
17. S03 is read-only, bounded and cancellable;
18. S03 cannot bypass S04/S05/M05/M06.

## Proof contract
The exact implementation proof families are frozen in companion `S03-PROOF.md`, which is normative for the eventual M07 Work Order.

## Handoff
Next legal planning session after exact-head approval/checkpoint promotion: `GBS-M07-S04 — Rendering`. S04 must consume frozen S01/S02/S03, remain side-effect free and cannot bypass S05/M05/M06.

No implementation or production credit is admitted.

STOP CONDITION: `M07_S03_CONDITIONAL_TEMPLATES_FROZEN`.
