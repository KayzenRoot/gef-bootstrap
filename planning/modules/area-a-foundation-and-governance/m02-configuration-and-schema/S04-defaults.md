# GBS-M02-S04 — Defaults

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze how product defaults are defined, applied, exposed and changed without bloating project configuration, weakening security/assurance floors or creating hidden behavior.

Defaults are product-owned fallback values. They are not copied project truth, not user intent, not accepted risk and not a substitute for explicit configuration where ambiguity would matter.

## Binding sources
- M02-S01 Global Configuration
- M02-S02 Project Configuration
- M02-S03 Schemas
- frozen Architecture, Security and DoD
- M01 deterministic kernel/error contracts

## Ownership boundary
M02-S04 OWNS:
- default-value authority and representation rules;
- eligibility criteria for introducing a default;
- default application/provenance behavior;
- safe-default invariants;
- omission/materialization behavior;
- default change governance and compatibility signals.

M02-S04 DOES NOT OWN:
- config location/precedence (S01/S02);
- schema mechanics (S03);
- migration execution/version evolution (S05);
- module-specific semantic values not yet owned by their modules;
- policy floors frozen elsewhere;
- project identity, preflight observations or secrets.

## Frozen defaults contract

### DF-01 — Product defaults are the lowest precedence layer
Effective configuration remains:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

A product default applies only when no higher permitted layer supplies a value. The resolved snapshot records provenance as `PRODUCT_DEFAULT` so consumers can distinguish inherited behavior from explicit user/project intent.

### DF-02 — Defaults are not copied into every project
A formal GEF adoption marker may exist in `.gef/project.json`, but default-valued fields are omitted unless explicit persistence has semantic value.

GEF MUST NOT materialize a full expanded config merely to show current defaults. Tooling may render an explanatory/effective view without writing it back.

### DF-03 — A default requires an owning semantic module
A default enters the canonical catalogue only when:
1. an owning module/contract exists;
2. field semantics are deterministic;
3. omission has one safe meaning;
4. precedence/override policy is known;
5. security/assurance implications are classified;
6. compatibility impact of changing it can be evaluated.

No speculative placeholder defaults for future modules.

### DF-04 — Safety floors are constraints, not ordinary defaults
Security minimums, authorization requirements, integrity gates and mandatory assurance floors are not weakenable convenience defaults.

A configurable value may have a product default plus a non-negotiable floor/ceiling. Higher-precedence config may change the value only within the allowed policy range.

### DF-05 — Defaults are environment-independent
Product defaults never depend directly on current directory, repository contents, CPU/RAM, network availability, provider permissions, environment variables, wall-clock time or machine identity.

Adaptive values belong to a separate derived-policy/capability-evaluation layer with explicit provenance. They are never labelled `PRODUCT_DEFAULT`.

### DF-06 — Default catalogue is a generated machine contract
The canonical default catalogue is a deterministic build/runtime machine contract derived from product-owned source/contracts and mechanically checked against canonical schemas. It is not a separately hand-maintained persisted truth file.

The product MAY emit a deterministic JSON representation for inspection, evidence, testing or distribution, but such output is generated/derived and cannot become a competing source of truth.

The catalogue exposes at least:
- stable configuration path/field identity;
- owning module;
- value or `NO_DEFAULT`;
- value type/schema binding;
- override policy reference;
- security/assurance classification where relevant;
- introduced-in contract/product version;
- deprecation/change metadata where applicable.

### DF-07 — `NO_DEFAULT` is first-class
The system distinguishes:
- absent because product default applies;
- absent because owner says `NO_DEFAULT` and explicit value is required;
- unavailable because owning capability/profile is absent.

A required explicit decision yields a typed configuration/precondition diagnostic before governed side effects.

### DF-08 — Explicit values remain explicit
A global/project field explicitly persisted by the user/project remains explicit even when its value equals the current product default. Normalization MUST NOT erase it merely as redundant.

Reason: equality with the current default does not erase provenance or intent. A later product-default change must not silently convert an explicit choice into inherited behavior.

### DF-09 — Effective-config rendering is non-mutating
GEF may render effective value, provenance, inherited/default status, overrideability, policy bounds and difference from product default. Rendering never rewrites global/project config.

### DF-10 — Default changes are compatibility-relevant
Changing a default can alter behavior in repositories that omitted that field. Every default change is classified at least as:
- behavior-preserving/editorial metadata;
- backward-compatible behavior adjustment;
- behavior-changing migration/compatibility event;
- security/assurance correction.

S05 owns migration/version mechanics.

### DF-11 — Security fixes may supersede old defaults
An unsafe historical default is not an eternal compatibility promise. Security/assurance corrections may tighten behavior, but releases must record the behavior change and migration/compatibility implications.

### DF-12 — Minimal initial catalogue
The initial M02 implementation defines only defaults required by already-owned M02 behavior and M01 runtime/config integration. Later modules add their defaults only after their own semantic contracts freeze.

### DF-13 — Independent catalogue version and fingerprint
The default catalogue has its own deterministic version/fingerprint independent from the general product version.

The fingerprint binds the semantic default catalogue inputs, including stable field IDs, values/`NO_DEFAULT`, override-policy bindings and compatibility-significant metadata. Editorial documentation changes that do not affect default semantics must not churn the semantic fingerprint.

This independent identity supports targeted cache/proof invalidation, changed-default delta review and compact executor context.

### DF-14 — Token/latency economy
Defaults reduce recurring context cost by allowing resolver/executor flows to communicate only:
- non-default overrides;
- compact effective snapshot/fingerprint;
- default catalogue version/fingerprint;
- changed-default delta when relevant.

The full catalogue is not carried into prompts unless the task touches default semantics.

### DF-15 — Brownfield neutrality
Adopting GEF in an existing repository does not persist large default expansions or change unrelated project files. Safe defaults are applied in memory and only minimal explicit adoption/config material is written.

## Security and reliability invariants
1. Defaults cannot weaken frozen policy floors.
2. Machine/provider observations are never disguised as defaults.
3. `NO_DEFAULT` cannot silently coerce to a guessed value.
4. Explicit persisted intent remains explicit after default evolution when still valid.
5. Behavior-changing defaults are compatibility-significant.
6. Sensitive values/secrets never appear in the default catalogue.
7. Adaptive policy cannot masquerade as `PRODUCT_DEFAULT`.
8. Catalogue fingerprint/version invalidates only when semantic catalogue inputs change.

## Future implementation proof
Eventually prove:
- precedence/provenance between defaults/global/project/explicit override;
- omission does not materialize redundant fields;
- `NO_DEFAULT` produces deterministic failure;
- explicit value equal to default remains explicit;
- explicit old-default value remains stable after product-default change when valid;
- safety floors cannot be downgraded;
- adaptive runtime observations are classified separately;
- generated catalogue/schema alignment;
- deterministic catalogue version/fingerprint;
- editorial-only changes do not churn semantic fingerprint;
- effective-config rendering has no mutation side effect;
- brownfield adoption does not expand config unnecessarily.

## Resolved freeze decisions
1. Default catalogue representation: **generated deterministic build/runtime machine contract; optional JSON is derived output only**.
2. Explicit value equal to current default: **preserved verbatim as explicit intent; normalization does not remove it**.
3. Machine-capability-dependent defaults: **prohibited product-wide; adaptive values use a separate derived-policy layer**.
4. Catalogue identity: **independent semantic version/fingerprint required for targeted invalidation and delta review**.

## Session completion rule
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M02-S05`.

STOP CONDITION: `M02_S04_EXACT_HEAD_REVIEW_REQUIRED`.
