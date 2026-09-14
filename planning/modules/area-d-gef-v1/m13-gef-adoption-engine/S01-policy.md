# GBS-M13-S01 — Adoption Policy and Modes

Status: `FROZEN_CANDIDATE`
Module: `GBS-M13 — GEF Adoption Engine`
Risk: `ELEVATED`

## Purpose
Define the deterministic policy contract that decides how GEF may be introduced into a repository without confusing discovery with authority, without destructive normalization, and without requiring a project to be historically perfect before it can receive useful GEF benefits.

M13 owns adoption orchestration. It does not own source hierarchy semantics, runtime compatibility, task-context compilation, evidence verdicts, repository mutation primitives, or release policy.

## Adoption modes
The engine recognizes only explicit modes:

1. `NEW_PROJECT`
   - project has no meaningful pre-existing engineering history requiring reconciliation;
   - canonical GEF scaffold may be established from admitted bootstrap inputs.
2. `BROWNFIELD_INCREMENTAL`
   - existing repository remains authoritative for descriptive truth;
   - GEF governance is introduced progressively by domain;
   - no broad rewrite or historical cleanup prerequisite.
3. `BROWNFIELD_GOVERNED_MIGRATION`
   - explicit project decision authorizes a bounded migration slice;
   - migration scope, reversibility and success evidence are frozen before mutation.
4. `OBSERVE_ONLY`
   - GEF may inventory and diagnose but may not mutate or promote repository governance state.

No implicit mode inference from repository age, file count, language, git history length, package manager, framework or conversational phrasing is allowed.

## Admission inputs
A mode decision may depend only on governed inputs:
- exact project identity from M03;
- discovery/preflight evidence from M04;
- selected project profile from M08;
- Source Pack state from M09;
- planning/decision/scope state from M10-M12;
- explicit operator/project decision where required;
- provider capabilities already admitted by their owning modules.

Ambient environment state, current working directory naming, latest commit message, repository popularity and LLM confidence are non-authoritative.

## Adoption policy state machine
States:
- `UNASSESSED`
- `OBSERVED`
- `MODE_PROPOSED`
- `MODE_ADMITTED`
- `PARTIAL_GOVERNANCE`
- `GOVERNED`
- `MIGRATION_IN_PROGRESS`
- `BLOCKED`
- `ROLLED_BACK`

Transitions require explicit evidence and are monotonic only where the evidence remains valid. A change in project binding or source fingerprints may invalidate a prior admission and return the state to `OBSERVED` or `BLOCKED`.

## New GEF-native technology: Adoption Intent Capsule (AIC)
A compact immutable object binding:
- project identity;
- selected adoption mode;
- operator/project decision reference;
- source-pack semantic identity;
- applicable risk class;
- requested governance domains;
- excluded domains;
- exact policy version;
- digest.

The AIC prevents conversational intent from silently mutating adoption semantics. Equivalent admitted inputs produce equivalent AIC semantic identity.

## New GEF-native technology: Governance Maturity Vector (GMV)
Governance maturity is represented per authority domain rather than as a single repository score.

Per-domain states:
- `UNOBSERVED`
- `OBSERVED`
- `MAPPED`
- `GOVERNED_PARTIAL`
- `GOVERNED_CANONICAL`
- `DRIFTED`
- `BLOCKED`

The vector avoids the false claim that a repository is either globally “GEF compliant” or “not compliant”. It enables useful early adoption while preserving unresolved legacy areas.

## New GEF-native technology: Adoption Safety Envelope (ASE)
For each planned adoption increment, ASE records:
- allowed mutation surface;
- forbidden paths/domains;
- reversible operations;
- preconditions;
- required checks;
- abort conditions;
- rollback ownership;
- maximum tolerated unresolved severity.

ASE cannot grant mutation authority by itself. Actual writes remain M05/M06/Git-owner controlled.

## Policy invariants
- descriptive truth and normative truth remain distinct;
- brownfield projects are first-class, not degraded new projects;
- useful adoption may occur before full cleanup;
- no adoption step may erase unresolved drift merely to produce a clean status;
- no auto-rewrite of architecture, scope, requirements, tests, CI or documentation;
- no hidden dependency installation;
- no broad normalization unless an admitted migration increment owns it;
- adoption decisions are exact-project-bound and invalid across projects;
- mode changes require a new governed decision/capsule;
- no HIGH/CRITICAL known defect may be bypassed through adoption-state promotion.

## Failure classes
At minimum:
- `ADOPTION_MODE_MISSING`
- `ADOPTION_MODE_AMBIGUOUS`
- `PROJECT_BINDING_MISMATCH`
- `SOURCE_PACK_STALE`
- `REQUIRED_DECISION_MISSING`
- `UNSUPPORTED_GOVERNANCE_TRANSITION`
- `MUTATION_SURFACE_UNBOUNDED`
- `UNRESOLVED_HIGH_RISK_DRIFT`
- `ADOPTION_POLICY_VERSION_UNSUPPORTED`

## Ownership boundaries
M13 may classify/admit adoption strategy and produce deterministic adoption plans/receipts. It does not:
- alter Source Hierarchy (M00/M09);
- make product decisions (M11);
- redefine Scope/DoD (M12);
- compile task context (M14);
- compile execution packs (M15);
- own generic policy runtime (M16);
- own checkpoints/progress (M17/M21);
- own final evidence/assurance verdicts (M24+);
- own Git/GitHub mutation (M29+);
- own compatibility truth (M51).

## Technology classification
- TECH-0012 Brownfield Truth Reconciler: `NECESSARY`, M13-owned semantics.
- TECH-0013 Progressive Governance Envelope: `NECESSARY`, M13-owned semantics.
- Adoption Intent Capsule: `NECESSARY`, new M13 mechanism.
- Governance Maturity Vector: `NECESSARY`, new M13 mechanism.
- Adoption Safety Envelope: `NECESSARY`, new M13 mechanism.
- ML-based adoption recommendation: `FUTURE`, non-authoritative.
- heuristic repository “health score”: `FUTURE`, must never control authority.

## Required implementation evidence later
Tests must prove explicit-mode requirement, cross-project rejection, deterministic capsules, per-domain maturity, no newest-wins behavior, bounded safety envelopes, fail-closed transitions, cancellation/resource budgets and no mutation during assessment.

STOP CONDITION: `READY_FOR_GBS_M13_S02_NEW_PROJECT_ADOPTION`.