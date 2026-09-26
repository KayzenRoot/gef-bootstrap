# GBS-M13-S02 — New-Project Adoption

Status: `FROZEN_CANDIDATE`
Module: `GBS-M13 — GEF Adoption Engine`

## Purpose
Define the smallest safe path for a genuinely new project to become GEF-governed without inventing project decisions, without coupling adoption to a specific framework, and without granting the Adoption Engine direct filesystem authority.

## Entry criteria
`NEW_PROJECT` may be used only when:
- project identity is valid and stable;
- discovery finds no conflicting established canonical engineering system that must be reconciled;
- Source Pack required classes are satisfiable by creation or explicit N/A rules;
- selected M08 profile is admitted;
- operator/project intent explicitly requests new-project adoption;
- no unresolved HIGH/CRITICAL preflight defect blocks bootstrap.

The mere absence of files is not sufficient proof of a new project.

## Bootstrap phases
1. `IDENTITY_LOCK`
2. `PROFILE_BIND`
3. `CANONICAL_SOURCE_PLAN`
4. `GOVERNANCE_SEED`
5. `VALIDATION_PLAN`
6. `MUTATION_PLAN_READY`
7. `POST_APPLY_RESCAN`
8. `ADOPTION_RECEIPT_READY`

Each phase emits a deterministic intermediate descriptor. Mutation happens only through later admitted execution using M05/M06 and relevant Git ownership.

## Canonical source creation policy
M13 may propose the minimum canonical source set required by M09's Canonical Requirement Matrix, but it may not fabricate content decisions.

Three outcomes per required class:
- `CREATE_FROM_EXPLICIT_INPUT`
- `CREATE_SKELETON_REQUIRING_DECISION`
- `EXPLICIT_NOT_APPLICABLE`

No placeholder may masquerade as an approved decision. Skeletons are visibly incomplete and block dependent promotion.

## New GEF-native technology: Bootstrap Seed Graph (BSG)
A dependency graph of canonical artifacts that must exist before downstream artifacts can be valid.

Nodes carry:
- semantic class;
- source owner;
- creation mode;
- prerequisite decisions;
- profile/template bindings;
- mutation owner;
- postcondition checks.

BSG produces a topological creation plan but never treats topological order as authority order.

## New GEF-native technology: Minimal Governance Kernel (MGK)
The smallest governance subset that makes the repository safely resumable before full planning is complete.

MGK must include enough truth to identify:
- project;
- constitutional rules;
- checkpoint/progression state;
- decision authority;
- scope boundary;
- completion definition;
- implementation safety constraints.

MGK intentionally excludes optional process ceremony. Its goal is recoverability and deterministic continuation, not document volume.

## New GEF-native technology: Bootstrap Provenance Chain (BPC)
Every generated bootstrap artifact gets a provenance record linking:
- source input/capsule;
- template identity/version/digest where applicable;
- responsible semantic owner;
- generated semantic digest;
- transaction/apply receipt later supplied by M05/M06;
- validation result.

BPC allows later systems to distinguish generated structure from human-approved project semantics.

## New GEF-native technology: Empty-State Ambiguity Detector (ESAD)
Detects cases where a sparse repository looks new but evidence is insufficient.

Signals may include contradictory project metadata, retained history, remote configuration, existing releases or explicit user declaration. ESAD does not independently classify a project as brownfield; it emits `NEWNESS_UNCERTAIN`, forcing explicit resolution.

## Template/profile rules
- exact M07 template references only;
- M08 profile determines allowed defaults, never product scope;
- no floating template version;
- no package installation/build execution during adoption planning;
- generated source plan must remain cross-platform deterministic.

## Fail-closed conditions
- project identity changes during planning;
- selected profile digest changes;
- required source class cannot be created without an unresolved decision;
- template identity/version/digest mismatch;
- bootstrap graph cycle;
- proposed mutation exceeds ASE;
- unsupported policy/schema version.

## Required future tests
- true empty project;
- empty directory with conflicting retained metadata;
- deterministic seed graph ordering;
- skeleton vs approved-source distinction;
- exact template mismatch rejection;
- minimum-kernel completeness;
- provenance determinism;
- cross-host equality;
- no filesystem/network/process side effects during plan construction.

STOP CONDITION: `READY_FOR_GBS_M13_S03_EXISTING_PROJECT_ADOPTION`.