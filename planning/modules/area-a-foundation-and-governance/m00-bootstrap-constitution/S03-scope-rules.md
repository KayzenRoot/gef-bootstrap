# GBS-M00-S03 — Scope Rules

Status: `IN_DISCUSSION`

## Purpose
Define how GEF Bootstrap decides what belongs in V1, what may enter an active increment, what must be deferred, and how scope expansion is controlled without suppressing valuable engineering discoveries.

This session governs **classification and admission**, not detailed product Scope content. The canonical `.engineering/SCOPE.md` is updated only after this session is reviewed/frozen.

## Core problem
GEF Bootstrap is intentionally deep and innovation-heavy. Without explicit scope rules, every useful idea can become an immediate requirement and turn V1 into an endless horizon. Conversely, overly rigid scope control can reject mechanisms that are genuinely required for correctness, token economy, brownfield adoption or assurance.

The system therefore needs a deterministic bias:

```text
DISCOVER IDEA
   -> preserve it
   -> classify it
   -> test necessity for current objective
   -> admit / defer / reject
   -> record dependencies and rationale
```

Discovery is cheap. Admission is governed.

## Existing constitutional classification
Planning Protocol already defines:

- `NECESSARY`
- `IMPORTANT`
- `FUTURE`
- `OUT_OF_SCOPE`

Only `NECESSARY` automatically enters V1. S03 must now define the semantics and promotion/demotion rules precisely enough that later modules cannot inflate scope casually.

## Candidate classification semantics
### NECESSARY
Without it, V1 cannot satisfy a frozen purpose, constitutional principle, security/assurance floor, required adoption mode, completion obligation or another already-admitted NECESSARY dependency.

### IMPORTANT
Materially improves quality, token/time efficiency, usability, maintainability or evidence, but V1 can still satisfy its frozen obligations without it. May be promoted only with explicit evidence/decision.

### FUTURE
Valuable capability whose design/implementation is not justified for V1 by current dependencies, evidence or ROI. Preserve with owner and trigger for reconsideration.

### OUT_OF_SCOPE
Conflicts with product boundary, belongs to another product/version, duplicates an owned mechanism without added value, or has been explicitly rejected for this V1.

## Necessity test candidate
A candidate is `NECESSARY` only if at least one admission basis is explicit and traceable:

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

A vague claim that something is "professional", "enterprise" or "nice to have" is insufficient.

## Scope admission rule
No discovered technology, module, session, artifact or behavior becomes a V1 requirement merely because it is documented, discussed, added to the Technology Ledger or present in the Master Module Index.

Admission requires:

```text
candidate
+ classification
+ admission basis
+ owner
+ dependency impact
+ acceptance/completion impact
+ explicit governed decision when promotion is required
```

## Master Module Index rule
The Master Module Index is an inventory/roadmap, not proof that every registered module/session belongs to V1.

During Scope freeze, each module/session or appropriate grouped unit must be mapped to V1 classification. FUTURE/OUT_OF_SCOPE entries may remain in the repository as planned placeholders without inflating V1 completion denominator.

## Scope expansion during active work
An active session/work order may not silently absorb a newly discovered feature.

New discoveries are classified as:

- `IN_SCOPE_CLARIFICATION`: resolves ambiguity without changing approved outcome;
- `REQUIRED_DEPENDENCY`: necessary to complete the approved outcome safely;
- `SCOPE_EXPANSION_CANDIDATE`: valuable but not necessary for current outcome;
- `DEFECT/CONFORMANCE_GAP`: approved obligation is not actually satisfied;
- `FUTURE_DISCOVERY`: preserve and continue current work.

Only clarification, required dependency and defect/conformance repair may enter the active increment without a separate product-scope expansion decision, and even those must remain bounded and traceable.

## Scope Expansion Gate
If an executor/planner discovers work outside the current admitted boundary, the default is STOP/route rather than improvise.

Candidate outcomes:

- `SCOPE_MATCH`
- `SCOPE_CLARIFICATION`
- `SCOPE_DEPENDENCY_REQUIRED`
- `SCOPE_EXPANSION_REQUIRED`
- `SCOPE_CONFLICT`
- `SCOPE_DEFERRED`

Codex should never decide a product-scope expansion by itself.

## Innovation preservation
Scope control must not kill invention. Every material idea that is not admitted immediately should retain enough metadata to be reconsidered later without rediscovery:

```text
id
idea/technology
classification
reason
owner
origin session
dependencies
promotion trigger
rejection/supersession state
```

The Technology & Innovation Ledger is the preferred routing mechanism for technical inventions.

## Token-economy rule
Scope itself has token cost. Every additional mandatory artifact, module, protocol, check and execution obligation increases future context, validation and maintenance burden.

Therefore a V1 addition must be evaluated not only for capability gain but for **recurring cognitive/token surface area**. A feature that saves 5% execution tokens but permanently adds 20% context/maintenance complexity is suspect unless assurance/quality benefit justifies it.

This creates a `Scope Carrying Cost` concept for later ROI/baseline modules.

## Brownfield rule
Existing projects must not be forced to adopt every V1 optimization at once merely because the capability is NECESSARY for the Bootstrap product.

Distinguish:

```text
PRODUCT_V1_NECESSARY
TARGET_PROJECT_IMMEDIATE_REQUIRED
TARGET_PROJECT_PROGRESSIVE
```

A capability can be mandatory for GEF Bootstrap V1 to support, while its application to an existing target project remains progressive/shadowed based on risk and maturity.

## No denominator gaming
Completion metrics must not improve by reclassifying unfinished NECESSARY work as FUTURE merely to raise percentage or meet a date. Demotion of admitted scope requires an explicit decision with rationale and impact on Purpose/DoD.

Likewise, adding FUTURE inventory must not reduce V1 completion percentage.

## Candidate anti-scope-creep invariants
- Every material discovery is preserved before it is deferred.
- Inventory is not commitment.
- NECESSARY requires traceable admission basis.
- IMPORTANT does not auto-enter V1.
- FUTURE does not count against V1 completion.
- OUT_OF_SCOPE remains auditable.
- Active executors cannot authorize product-scope expansion.
- Required dependencies are not mislabeled feature creep.
- Defect repair against an already-approved obligation is not a new feature.
- Scope cannot be manipulated to fabricate progress.
- Brownfield support and brownfield immediate adoption are different questions.
- Optimization complexity must pay for its recurring carrying cost or assurance value.

## Questions to close before freeze
1. Should `NECESSARY` require exactly one admission basis, or one-or-more with a primary basis?
2. Should IMPORTANT work ever enter V1 automatically when budget/time is available, or always require explicit promotion?
3. What metadata is mandatory for FUTURE items so they remain useful without bloating normal context?
4. What exact decision authority can promote/demote scope during planning versus implementation?
5. How should `Scope Carrying Cost` be represented in V1: qualitative flag, deterministic score, or deferred metric?
6. At what granularity should the 64-module/282-session inventory be classified for V1 without creating hundreds of low-value classifications?
7. Which current modules are structurally obsolete/need renaming because the product changed from CLI/runtime to instruction-first governance, and should S03 classify them now or leave detailed refactoring to Scope/Architecture planning?

## Current direction
S03 is moving toward **preserve every idea, admit only traceably necessary work, make scope expansion fail-closed, separate inventory from V1 commitment, and charge recurring context/maintenance cost against optimization value**.
