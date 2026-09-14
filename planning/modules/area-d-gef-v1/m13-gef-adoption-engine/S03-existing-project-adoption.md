# GBS-M13-S03 — Existing-Project / Brownfield Adoption

Status: `FROZEN_CANDIDATE`
Module: `GBS-M13 — GEF Adoption Engine`
Risk: `ELEVATED`

## Purpose
Make existing-project adoption a first-class production path. The system must deliver useful GEF benefits early while preserving existing engineering truth, avoiding destructive rewrites, and progressively reconciling only the domains needed for current governed work.

Brownfield is not “failed new-project adoption”. It has distinct semantics.

## Brownfield principles
1. existing code, tests, CI and repository structure are descriptive evidence;
2. existing documentation is not automatically normative merely because it exists;
3. new GEF canonical artifacts do not automatically supersede legacy sources;
4. unresolved disagreement is represented explicitly as drift;
5. adoption is domain-progressive, not all-or-nothing;
6. historical cleanup is not a prerequisite for current-task value;
7. legacy behavior may be explicitly accepted without pretending it matches target governance;
8. migration is bounded and reversible where feasible.

## Brownfield Truth Reconciler
TECH-0012 becomes a core M13 mechanism.

For each governed domain, the reconciler constructs a `TruthPair`:
- `observedTruth`: evidence of current repository behavior/state;
- `normativeTruth`: approved project intent/contract when one exists;
- `bindingEvidence`;
- `driftClass`;
- `confidence` only for descriptive discovery, never authority;
- `resolutionState`;
- `legacyAcceptanceRef` when applicable.

Recognized drift classes preserve M00 semantics including `DRIFT_NONE`, `DOCUMENTATION_DRIFT`, `IMPLEMENTATION_DRIFT`, `TEST_DRIFT`, `GOVERNANCE_DRIFT`, `ARCHITECTURAL_DRIFT`, `INTENT_UNKNOWN`, `CONFLICTING_INTENT`, `LEGACY_ACCEPTED`.

No timestamp/newest-file rule resolves drift.

## Progressive Governance Envelope
TECH-0013 becomes a core M13 mechanism.

Governance may mature independently per domain. A repository can, for example, have canonical Scope and Decisions while architecture remains `MAPPED` and CI remains `OBSERVED`.

Progress is represented by the S01 Governance Maturity Vector and may not collapse into one global compliance score.

## New GEF-native technology: Legacy Compatibility Membrane (LCM)
A boundary contract allowing legacy structures to remain in place while GEF exposes a normalized semantic view.

An LCM entry binds:
- legacy source identity;
- semantic class;
- transformation type (`ALIAS`, `PROJECTION`, `ADAPTER`, `LEGACY_ACCEPTANCE`);
- lossiness flag;
- mutation permission (`NONE` by default);
- owner module;
- invalidation fingerprint.

The membrane cannot silently reinterpret meaning. Lossy mappings must be explicit and cannot become canonical normative truth without a decision.

## New GEF-native technology: Adoption Slice Planner (ASP)
Computes the smallest adoption slice needed for a target governed capability.

Inputs:
- desired capability/domain;
- current GMV;
- Source Pack dependency graph;
- drift relations;
- required canonical classes;
- safety envelope.

Output:
- minimum prerequisite domains;
- required aliases/mappings;
- unresolved blockers;
- optional cleanup separated from necessary work;
- post-adoption maturity delta.

ASP optimizes for minimum safe governance delta, not minimum file count.

## New GEF-native technology: Legacy Debt Quarantine (LDQ)
Tracks known legacy debt that is intentionally outside the current adoption slice.

A quarantine record contains:
- exact domain/source binding;
- known issue/drift class;
- severity;
- reason for deferral;
- affected capability set;
- invalidation condition;
- promotion blocker flag.

LDQ prevents deferred debt from disappearing from memory while avoiding forced project-wide cleanup.

## New GEF-native technology: Drift Resolution Ladder (DRL)
A deterministic set of allowed resolution outcomes:
- `ACCEPT_OBSERVED_AS_NORMATIVE` only through explicit decision;
- `UPDATE_NORMATIVE_TO_APPROVED_INTENT`;
- `MIGRATE_IMPLEMENTATION_TO_NORMATIVE`;
- `MAP_WITH_ALIAS`;
- `LEGACY_ACCEPT_WITH_EXPIRY_OR_REVIEW_TRIGGER`;
- `DEFER_QUARANTINED`;
- `BLOCK`.

The ladder does not choose product intent. M11 owns the decision when intent is ambiguous.

## Discovery safety
Brownfield discovery must not:
- execute project code;
- run setup hooks or migration scripts;
- install dependencies;
- import application modules for metadata;
- access network services unless a future admitted capability explicitly owns it;
- treat generated artifacts as human approval;
- scrape secrets into Source Pack or receipts.

## Incremental benefit requirement
M13 is successful only if brownfield projects can obtain concrete benefits before full normalization, including at minimum:
- deterministic project/source identity;
- resumable checkpoint truth;
- bounded task planning support;
- reusable source mappings;
- drift visibility;
- reduced repeated discovery.

## Migration relationship
A migration is a separate bounded adoption increment with:
- exact before state;
- target state;
- admitted mutation surface;
- rollback/recovery plan;
- expected drift closure;
- validation contract.

M13 plans/adopts the migration strategy. M05/M06 execute safe writes; M29+ own Git behavior; assurance remains M24+.

## Failure classes
- `BROWNFIELD_MAPPING_AMBIGUOUS`
- `NORMATIVE_TRUTH_MISSING`
- `CONFLICTING_INTENT`
- `LOSSY_MAPPING_UNAPPROVED`
- `LEGACY_ALIAS_STALE`
- `ADOPTION_SLICE_UNBOUNDED`
- `DRIFT_BLOCKS_CAPABILITY`
- `QUARANTINED_HIGH_RISK_BLOCKER`
- `MIGRATION_REVERSIBILITY_UNKNOWN`

## Required future tests
- legacy docs disagree with code;
- tests disagree with implementation;
- architecture intent unknown;
- explicitly accepted legacy behavior;
- partial-domain adoption;
- stale alias invalidation;
- minimal adoption slice vs unnecessary cleanup;
- quarantine persistence;
- migration plan with no write authority;
- cross-host deterministic mapping.

STOP CONDITION: `READY_FOR_GBS_M13_S04_COMPATIBILITY_AND_PROGRESSIVE_NORMALIZATION`.