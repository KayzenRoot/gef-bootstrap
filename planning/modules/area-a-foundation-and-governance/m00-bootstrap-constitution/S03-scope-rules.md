# GBS-M00-S03 — Scope Rules

Status: `FROZEN`

## Purpose
Define how GEF Bootstrap decides what belongs in V1, what may enter an active increment, what must be deferred, and how scope expansion is controlled without suppressing valuable engineering discoveries.

This session governs **classification and admission**, not detailed product Scope content. The canonical `.engineering/SCOPE.md` remains unplanned until its dedicated scope materialization step.

## Core rule

```text
DISCOVER IDEA
   -> preserve it
   -> classify it
   -> test necessity
   -> admit / defer / reject
   -> record dependencies and rationale
```

Discovery is cheap. Admission is governed.

## V1 classifications
### NECESSARY
Without it, V1 cannot satisfy a frozen purpose, constitutional principle, source-truth requirement, security/assurance floor, required adoption mode, completion obligation or another already-admitted NECESSARY dependency.

### IMPORTANT
Materially improves quality, token/time efficiency, usability, maintainability or evidence, but V1 can still satisfy its frozen obligations without it. IMPORTANT never auto-enters V1 merely because capacity remains.

### FUTURE
Valuable capability whose design/implementation is not justified for V1 by current dependencies, evidence or ROI. It remains preserved with a reconsideration trigger.

### OUT_OF_SCOPE
Conflicts with product boundary, belongs to another product/version, duplicates an owned mechanism without added value, or has been explicitly rejected for this V1.

## NECESSARY admission basis
A NECESSARY item must carry one **primary admission basis** and may carry additional supporting bases.

Allowed constitutional bases:

```text
CONSTITUTION_REQUIRED
SOURCE_TRUTH_REQUIRED
SECURITY_REQUIRED
ASSURANCE_REQUIRED
V1_DOD_REQUIRED
DEPENDENCY_REQUIRED
NEW_PROJECT_REQUIRED
EXISTING_PROJECT_REQUIRED
TOKEN_OBJECTIVE_REQUIRED
EXECUTOR_LATENCY_REQUIRED
CONTINUITY_REQUIRED
EVIDENCE_REQUIRED
```

A vague claim such as "professional", "enterprise", "best practice" or "nice to have" is not an admission basis.

## IMPORTANT promotion rule
IMPORTANT work never enters V1 automatically because time, token budget or implementation capacity happens to remain.

Promotion to NECESSARY requires an explicit governed decision identifying the new primary admission basis, dependency/completion impact, carrying-cost impact and whether Scope/DoD/Backlog/estimate must change.

## FUTURE metadata contract
To preserve value without bloating hot context, a FUTURE item needs only:

```text
id
title
reason
authoritative owner/origin
promotion trigger
key dependencies, if known
```

Optional richer notes remain cold/addressable. Routine executor context must not load FUTURE details unless a promotion trigger is relevant.

## Scope decision authority
### During planning
ChatGPT/planning governance may propose classification and promotion/demotion, but canonical scope changes require the applicable planning decision to be reviewed and frozen before `.engineering/SCOPE.md` changes.

### During implementation
Executors may classify a discovery provisionally but may not authorize product-scope expansion. They may continue automatically only for bounded `IN_SCOPE_CLARIFICATION`, demonstrably necessary `REQUIRED_DEPENDENCY`, or `DEFECT_CONFORMANCE_GAP` against an already-approved obligation.

Anything else stops/routes as `SCOPE_EXPANSION_REQUIRED` or is preserved as FUTURE/IMPORTANT.

### Demotion
An admitted NECESSARY item may be demoted only by an explicit superseding decision proving the original admission basis no longer applies or that governing Purpose/DoD changed. Demotion solely to improve ETA or completion percentage is forbidden.

## Scope admission record
No discovered technology, module, session, artifact or behavior becomes a V1 requirement merely because it is documented, discussed, in the Technology Ledger or present in the Master Module Index.

A V1-admitted unit must be traceable to:

```text
classification
primary admission basis
owner
dependency impact
acceptance/completion impact
scope decision/reference
```

## Scope Expansion Gate
Discoveries during active work are classified as:

- `IN_SCOPE_CLARIFICATION`
- `REQUIRED_DEPENDENCY`
- `SCOPE_EXPANSION_CANDIDATE`
- `DEFECT_CONFORMANCE_GAP`
- `FUTURE_DISCOVERY`

Gate outcomes:

- `SCOPE_MATCH`
- `SCOPE_CLARIFICATION`
- `SCOPE_DEPENDENCY_REQUIRED`
- `SCOPE_EXPANSION_REQUIRED`
- `SCOPE_CONFLICT`
- `SCOPE_DEFERRED`

Codex or another executor never decides product-scope expansion by itself.

## Scope Carrying Cost V1
V1 uses a **qualitative deterministic profile**, not a fabricated numeric score.

Each proposed permanent obligation can be tagged:

```text
CONTEXT_SURFACE: LOW | MEDIUM | HIGH
MAINTENANCE_SURFACE: LOW | MEDIUM | HIGH
VALIDATION_SURFACE: LOW | MEDIUM | HIGH
REVIEW_SURFACE: LOW | MEDIUM | HIGH
MIGRATION_SURFACE: LOW | MEDIUM | HIGH
```

A short rationale is required only for HIGH values. Later telemetry/baseline modules may replace qualitative tags with evidence-backed measurements.

## Inventory classification granularity
The 64-module / 282-session inventory is **not classified session-by-session by default**.

V1 classification occurs hierarchically:

```text
AREA default, if useful
  -> MODULE classification
       -> SESSION override only when needed
```

Rules:
- module is the normal admission unit;
- all sessions inherit module classification unless an explicit override exists;
- session-level classification is used only when a module mixes NECESSARY and non-V1 work;
- area-level defaults may reduce repetition but never override explicit module/session classification;
- grouped classifications may be used when several modules share one identical admission basis and owner.

## Master Module Index semantics
The Master Module Index is inventory/roadmap, not V1 commitment.

FUTURE/OUT_OF_SCOPE modules may remain as placeholders without entering V1 completion denominator. IMPORTANT also does not enter the denominator until explicitly promoted. Only admitted NECESSARY work contributes to V1 planned completion obligations.

## Legacy-name / architecture-drift handling
The scaffold contains names inherited from the earlier runtime/CLI interpretation, including at least `GBS-M01 — CLI Kernel`, `GBS-M47 — CLI UX`, `GBS-M49 — Installation`, and quality modules whose wording assumes a runtime executable.

S03 does not delete, renumber or silently rewrite these modules. Their planning state is:

```text
REFACTOR_REQUIRED
```

Meaning:
- stable ID remains;
- legacy display name is not frozen architecture;
- detailed rename/responsibility redesign belongs to Scope/Architecture planning;
- module may be renamed/reframed, split or reclassified without pretending it was already correctly specified;
- references should prefer stable IDs during transition.

Likely directions, not frozen names: M01 toward bootstrap/agent orchestration lifecycle; M47 toward agent interaction/output UX; M49 toward bootstrap consumption/adoption/distribution; M53–M58 toward protocol/template/conformance/behavioral validation where runtime testing does not apply.

## Innovation preservation
Every material idea not admitted immediately remains addressable with classification, reason, owner/origin and promotion trigger. Technology inventions route through the Technology & Innovation Ledger. Preservation never equals admission.

## Brownfield scope rule
Distinguish:

```text
PRODUCT_V1_NECESSARY
TARGET_PROJECT_IMMEDIATE_REQUIRED
TARGET_PROJECT_PROGRESSIVE
```

A capability may be mandatory for Bootstrap V1 to support while its adoption in an existing target repository remains progressive, shadowed or domain-specific.

## No denominator gaming
- unfinished NECESSARY work cannot be demoted merely to raise completion percentage or meet a date;
- adding FUTURE/IMPORTANT inventory cannot lower V1 completion percentage;
- promoting new NECESSARY work legitimately changes the denominator and must trigger baseline/ETA recalculation once those systems exist;
- defect repair against an admitted obligation remains part of that obligation rather than a new feature;
- scope metrics must expose material reclassification events.

## Scope/token doctrine
Scope itself has recurring token, context, validation, review and maintenance cost. A permanent mechanism must justify its carrying cost through required assurance, correctness, adoption value, token/time savings or another frozen objective.

Optimization that reduces one cost while expanding the total recurring engineering surface without sufficient benefit should not be admitted merely because it sounds sophisticated.

## Frozen invariants
- Every material discovery is preserved before defer/reject.
- Inventory is not commitment.
- NECESSARY has one traceable primary admission basis.
- IMPORTANT never auto-enters V1.
- FUTURE stays out of hot context and V1 denominator.
- OUT_OF_SCOPE remains auditable.
- Executors cannot authorize product-scope expansion.
- Required dependencies are not mislabeled feature creep.
- Defect/conformance repair is not a new feature.
- Scope cannot be manipulated to fabricate progress.
- Brownfield support and immediate brownfield adoption are different decisions.
- Scope carrying cost is considered before permanent admission.
- Stable IDs survive naming/refactoring of legacy scaffold concepts.

## Freeze audit
- S01 consistency: PASS
- S02 consistency: PASS
- Planning Protocol boundary: PASS
- Decisions Ledger synchronization: PASS
- Technology Ledger synchronization: PASS
- `.engineering/SCOPE.md` unchanged by this session: PASS
- inventory vs V1 commitment separation: PASS
- active executor expansion authority: FAIL-CLOSED
- anti-denominator-gaming protection: PASS
- brownfield distinction: PASS
- legacy IDs preserved: PASS
- fake numeric carrying-cost precision: AVOIDED
- accidental product implementation: NONE

STOP CONDITION: `READY_FOR_GBS-M00-S03_REVIEW_AND_CHECKPOINT`.
