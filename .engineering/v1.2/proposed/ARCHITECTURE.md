# Proposed V1.2 Architecture Delta

**State:** `PROPOSED / NOT_CANONICAL`

## Principle

V1.2 is an extension/composition release, not an engine rewrite.

Existing V1.1.2 authorities remain canonical unless a later ADR explicitly supersedes them.

## A1 Discovery and planning facade

New bounded contract:
`Discovery -> approved answers -> existing Source Pack / Planning / Decision / Scope authorities`.

No second project database or planning truth store.

## A2 Marathon orchestration

Marathon is a composition layer over:
- M14 task/context compilation;
- M15 execution packs/DAG/critical path/parallelism;
- M17 checkpoint;
- M18 resume;
- M63 execution waves/performance primitives.

Marathon may coordinate durable multi-wave execution but shall not replace these authorities.

## A3 Assurance plane

Bug Hunter and Delta Assurance extend:
- evidence;
- proof graph;
- assurance pipeline;
- test-impact/reuse;
- telemetry/performance gates.

Profile adapters may provide property testing, bounded mutation, browser/API checks or chain-specific tools. Results normalize into existing evidence/proof authorities.

## A4 Review and intelligence plane

Reviewer packets, Engineering Intelligence and status composition read from existing evidence/progress/estimation/project-status/performance sources.

Owner audit remains the semantic approval authority and is NOT_INDEPENDENT.

## A5 Profile router

Routing composes:
- project profiles;
- adoption engine;
- verified capability envelope;
- install plan;
- CLI delegation.

Recommendation may be automatic. Material/high-risk profile activation requires owner confirmation.

## A6 Visual-experience contract

A core interface defines visual acceptance artifacts and required proof shape.

WEB_APP_API activates the first implementation adapter. Browser/design libraries are profile dependencies, not universal core dependencies.

## A7 Operations feedback

Core defines the feedback evidence contract.

Collection, SLO integration, reproduction from production telemetry and deployment-specific feedback remain conditional on the target profile and explicit data/privacy admission.

## A8 Release plane

Current release/integrity/recovery/upgrade authorities remain canonical.

V1.2 adds only the metadata/proof necessary for new core/profile capabilities and preserves exact-artifact cross-platform verification.

## A9 Data/storage rule

No new universal database is introduced by default.

New durable state must:
- have a canonical owner;
- avoid duplicating existing evidence/proof/checkpoint/status records;
- define lifecycle, migration and invalidation;
- prove why existing repository/evidence state is insufficient.

## A10 External tools

Third-party tools are adapters selected by profile and evidence need.

They may never silently redefine canonical product state.

