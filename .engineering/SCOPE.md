# Scope

Status: `IN_DISCUSSION`

## Binding
Scope is derived from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, frozen Requirements and the Project Owner decision that GEF Bootstrap will target **one complete production version**, not a deliberately reduced V1/MVP slice.

The Master Module Index remains an inventory until this Scope classifies/reframes it, but there is no schedule pressure to minimize capability merely for earlier release.

## Product release model
GEF Bootstrap will be planned and built toward a **single complete production target** containing all capabilities that survive governed planning as useful, coherent and justified for the product.

The project is not optimizing for an MVP, pilot, cut-down V1 or fastest possible first release. Planning depth and implementation time may increase when that produces a more complete, robust and reusable system.

This does not mean every brainstormed idea automatically enters production. Discovery still uses governed classification to prevent duplication, incoherence and unnecessary permanent complexity. Classification now answers **whether a capability belongs in the complete product**, not whether it must be cut merely to ship sooner.

## Admission model for the complete target
Use:

- `CORE_REQUIRED` — required for correctness, governance, assurance, continuity or the fundamental hybrid operating model.
- `PRODUCT_INCLUDED` — materially improves the complete product and is justified by utility/engineering ROI even if not logically indispensable.
- `EXPERIMENTAL_GATED` — desirable advanced capability that must prove safety/ROI through benchmark/shadow validation before production promotion.
- `OPTIONAL_ADAPTER` — integration/profile that is supported but cannot block independent core completion.
- `OUT_OF_SCOPE` — conflicts with product identity, duplicates another capability without value, belongs to another product, or creates unjustified risk/complexity.

Legacy `NECESSARY / IMPORTANT / FUTURE / OUT_OF_SCOPE` semantics remain historically valid for prior planning, but this complete-target Scope will map them into the model above. `FUTURE` is no longer a parking lot merely because implementation would take longer. A feature stays deferred only when evidence/design maturity, not schedule pressure, requires it.

## Complete hybrid production boundary
The target product includes both planes:

### Semantic/governed plane
- project/repository identity and source authority;
- complete Source Pack and governance contracts;
- requirements, scope, architecture, security, testing, deployment, DoD, decisions and checkpoint continuity;
- new-project and brownfield adoption;
- task/context compilation and Minimum Sufficient Context;
- execution-pack/prompt compilation;
- review compilation and HEDS/delta review;
- evidence/proof/invalidation/assurance contracts;
- progress, estimation and truthful completion state;
- token/time/engineering-cost telemetry and benchmark governance;
- documentation, runbooks, upgrades, compatibility and release governance.

### Deterministic work plane
- local repository/filesystem inspection;
- Git state and project identity inspection;
- mutation planning/dry-run/diff;
- governed file/template materialization and update;
- schema/contract validation;
- fingerprints/hashes and state comparison;
- dependency/invalidation support where deterministic;
- test/validation selection support where deterministic;
- conformance checks;
- machine evidence/receipts;
- transaction/recovery support for GEF-managed mutations;
- installation/upgrade/migration mechanisms needed for practical operation;
- platform-profile operations such as GitHub where applicable.

A CLI may be included if Architecture concludes it is the best interface for the deterministic plane. CLI is not the product brain and is not required to own semantic decisions.

## Completion philosophy
The production target should not intentionally omit a high-value approved capability solely to hit an earlier date. When a proposed capability is coherent, useful, testable and its carrying cost is justified, it should be designed into the single complete target.

The bar for exclusion is therefore one of:

1. outside product identity;
2. duplicate/superseded;
3. unsafe without evidence that cannot yet be obtained;
4. unjustified permanent complexity/maintenance cost;
5. external ecosystem feature better kept as an optional adapter;
6. speculative technology whose benchmark/shadow gate has not passed.

## Advanced optimization policy
Advanced mechanisms already discovered, such as adaptive context memory, context deduplication, knowledge appreciation, engineering ROI, proof carry-forward, failure/negative knowledge, delta context, latency optimization and other product-owned improvements, must be evaluated for inclusion rather than automatically deferred to a hypothetical later major version.

Where an advanced mechanism lacks evidence, it enters `EXPERIMENTAL_GATED` and remains in the same product plan with explicit promotion criteria. It is not discarded simply because there is no urgency to ship.

## Integrations
UADS, Hive, UGAS and other ecosystem integrations remain `OPTIONAL_ADAPTER` by default. The independent GEF Bootstrap must be fully usable without them. They may be planned and implemented where valuable, but failure/absence of an adapter cannot invalidate completion of the independent product core unless a future explicit Product Owner decision changes this boundary.

## Construction invariant
All GEF Bootstrap planning, implementation, tests, documentation, reviews, releases and production preparation are performed through ChatGPT and connected project tools. Codex is not an implementation executor for this repository.

## Scope-stage work now required
1. Reclassify all 64 inventory modules against `CORE_REQUIRED`, `PRODUCT_INCLUDED`, `EXPERIMENTAL_GATED`, `OPTIONAL_ADAPTER`, `OUT_OF_SCOPE`.
2. Reframe legacy CLI/runtime-oriented names and responsibilities while preserving stable IDs.
3. Identify overlapping modules/capabilities that should be consolidated without losing functionality.
4. Promote valuable previously `IMPORTANT/FUTURE` mechanisms when they belong in the complete target.
5. Define benchmark/shadow gates for advanced experimental mechanisms rather than dropping them.
6. Define the complete representative profile/platform set.
7. Define complete test/conformance/recovery/security coverage for production.
8. Build the admitted backlog and weighting model from the complete target, not from a reduced release slice.
9. Only after Scope + DoD + admitted backlog/weights are frozen, publish trustworthy completion percentage and ETA.

## Explicit OUT_OF_SCOPE candidates
Unless later superseded, the following remain outside the product identity:
- general-purpose IDE/editor;
- hard-coded AI planner replacing the governed semantic/planning role;
- always-on service solely for the sake of being a service;
- granting cross-project learned knowledge authority over local canonical truth;
- fabricated universal optimization guarantees;
- destructive rewriting of healthy brownfield architecture merely for GEF naming conformity.

## Current decision
GEF Bootstrap targets **one complete, production-quality hybrid product**, not a small V1 followed by deferred major versions. Completeness does not mean indiscriminate feature accumulation: every included capability still needs governed ownership, evidence, tests, maintenance justification and a coherent relationship to the product mission.

## Questions to close before Scope freeze
1. Which of the 64 modules remain separate product responsibilities and which should be consolidated?
2. Which previously FUTURE/IMPORTANT technologies should become PRODUCT_INCLUDED versus EXPERIMENTAL_GATED?
3. What profiles/platforms belong in the complete production distribution beyond GitHub-first support?
4. Which optional adapters should actually ship with the first complete production release, if any?
5. What production-grade installation/distribution interface best fits the deterministic work plane, including whether a CLI should ship?
6. How should weights be assigned across governance, deterministic code, quality/security, integrations, documentation and release work without gaming progress?
7. What precise state name should replace the old `V1_DONE` wording for the single complete release (candidate: `PRODUCTION_RELEASE_DONE`)?

## Current stop
Do not begin Architecture or implementation yet. Complete the full module/capability classification and product boundary first.

STOP CONDITION: `COMPLETE_PRODUCT_SCOPE_CLASSIFICATION_REQUIRED`.
