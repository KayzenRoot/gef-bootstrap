# Decisions Supersession Map

Status: `FROZEN`

## Purpose
Preserve historical decisions while making the current controlling interpretation explicit for humans and agents. This file does not delete history. It resolves later-governance supersession so old assumptions cannot be reactivated by accident.

## Current controlling product model
The active product model is:
- `HYBRID` semantic governance + deterministic work plane;
- one complete production target, terminal state `PRODUCTION_RELEASE_DONE`;
- GEF Bootstrap itself implemented only through ChatGPT + connected project tools;
- Codex may be used only in target repositories under GEF governance, not to build this repository;
- deterministic tooling is a required product component but never semantic authority;
- GitHub is the reference hosted profile, not a universal semantic dependency;
- 47 CORE_REQUIRED + 14 PRODUCT_INCLUDED block independent-product release; M39 and M41 remain ecosystem-specific optional tracks; M40 is the third, provider-neutral reserved context slot under ADR-0007, aligned with V1.1 ADR-0005/D-0061.

Controlling sources, in their applicable authority domains:
1. `GBS-CONSTITUTION-v1.1` + hybrid amendment;
2. frozen `.engineering/SCOPE.md` + ADR-0001 complete-production target;
3. frozen `.engineering/ARCHITECTURE.md`;
4. frozen `.engineering/SECURITY.md`;
5. frozen `.engineering/TEST-BENCHMARK-PLAN.md`;
6. frozen `.engineering/DEFINITION-OF-DONE.md`;
7. frozen `.engineering/BACKLOG.md`;
8. frozen `.engineering/DEPLOYMENT.md`;
9. current promoted Checkpoint for progression state.

## Superseded historical interpretations

### D-0003 legacy “GEF V1 default” wording
Historical meaning is retained as the origin of the GEF prompt/review model. It does not imply a reduced V1 product release. Current release semantics are the single complete production target from frozen Scope and ADR-0001.

### D-0004 instruction-first / no product runtime
Superseded in mechanics by the hybrid constitutional amendment and frozen Architecture. Semantic authority remains instruction/source-governed, but a deterministic work plane is now a REQUIRED_PRODUCT_COMPONENT.

### D-0006 Codex-oriented executor split
Superseded for construction of this repository by the current construction invariant: GEF Bootstrap is built through ChatGPT + connected project tools. The general reasoning/execution split remains valid for target repositories, where Codex or another governed executor may be used.

### D-0008 no standalone runtime implication
Superseded in mechanics by the hybrid product model. The target-repository materialization goal remains valid, but materialization is now supported by the required deterministic work plane rather than instruction-only behavior.

### D-0027 / D-0029 reduced-V1 admission model
Superseded for the current release denominator by frozen complete-production Scope. The historical and prospective inventory retain 47 CORE_REQUIRED + 14 PRODUCT_INCLUDED + 3 OPTIONAL_ADAPTER; M40 becomes a neutral reserved context slot under ADR-0007. No Hive-specific adapter is active. PRODUCT_INCLUDED is release-blocking for the one complete production version.

### D-0031 / D-0032 “V1” wording
Retained only as historical terminology. Current scope carrying cost/classification is interpreted through complete-production Scope, Architecture, DoD and weighted backlog.

### D-0033 refactor-required legacy names
Resolved by frozen Scope/Architecture stable reframes: M01 Deterministic Work Plane Kernel, M47 Interaction & Operator UX, M49 Distribution & Setup, M62 Production Acceptance. IDs remain stable.

### D-0034 / D-0039 “V1 completion” wording
Read as product completion under current `PRODUCTION_RELEASE_DONE` semantics. Evidence-bound completion and truthful telemetry requirements remain valid.

### D-0041 “GEF Bootstrap V1” wording
CONST-F1–F8 stable group IDs remain valid. The version label does not create a reduced release target.

### D-0047 optional deterministic CLI/tooling
Superseded in mechanics by the hybrid amendment and frozen Architecture. Deterministic tooling is required; CLI remains a thin operator surface over library/domain contracts and is not the product identity.

### D-0050 “V1 telemetry” wording
Retained substantively, relabeled operationally as complete-product telemetry/benchmark requirements.

### D-0051 Project Overview derived from Constitution v1.0
Project Overview remains frozen and valid where not superseded. Constitution v1.1 plus later frozen Source Pack artifacts control any conflicting downstream interpretation.

### D-0002 / D-0040 / ADR-0001-D3 — retired Hive adapter
Owner decision D-0062 and ADR-0007 supersede only the prospective Hive-specific integration permission, aligning with V1.1's pre-existing D-0061/ADR-0005. M40 remains a neutral RESERVED context slot, with no Hive identity, protocol, schema, code or activation; active code, deployment and operator instructions can no longer include Hive. Original decisions and accepted receipts/tags remain intact. M39 UADS and M41 UGAS are unrelated optional adapters. The 64-ID/282-session inventory and 61-module/1088-weight production denominator are unchanged. PR #297 was closed because it proposed Hive-first executor context.

## Agent rule
When a historical D-* entry conflicts with this map or a later frozen controlling source in the same authority domain, the later governed source controls. Never delete the historical entry merely to simplify context. Never use newest-wins across different authority domains.

## Closure status
This map resolves historical-model ambiguity for Source Pack closure without rewriting the Decisions Ledger history.
