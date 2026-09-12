# GBS-M02-S04 — Defaults

Status: `IN_DISCUSSION`

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

## Candidate defaults contract

### DF-01 — Product defaults are the lowest precedence layer
Effective configuration remains:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

A product default applies only when no higher permitted layer supplies a value. The resolved snapshot records provenance as `PRODUCT_DEFAULT` so consumers can distinguish inherited behavior from explicit user/project intent.

### DF-02 — Defaults are code/schema-owned, not copied into every project
A formal GEF adoption marker may exist in `.gef/project.json`, but default-valued fields are omitted unless explicit persistence has semantic value.

GEF MUST NOT materialize a full expanded config merely to show current defaults. Tooling may render an explanatory/effective view without writing it back.

Rationale:
- less repository churn;
- fewer migration edits;
- smaller prompts/diffs;
- no ambiguity between inherited default and explicit project choice;
- easier global improvement of safe defaults.

### DF-03 — A default requires an owning semantic module
A default may enter the canonical catalogue only when:
1. an owning module/contract exists;
2. the field semantics are frozen enough to be deterministic;
3. omission has a single safe meaning;
4. precedence/override policy is known;
5. security/assurance implications are classified;
6. compatibility impact of changing it can be evaluated.

No speculative placeholder defaults for future modules.

### DF-04 — Safety floors are constraints, not ordinary defaults
Security minimums, authorization requirements, integrity gates and mandatory assurance floors are not represented as weakenable convenience defaults.

A configurable value may have a safe product default plus a non-negotiable floor/ceiling. Higher-precedence config may change the value only within the allowed policy range.

Example concept:

`defaultConcurrency = N` is a default.

`concurrency >= 1` and a resource-policy maximum are constraints.

`S4 requires explicit authorization` is policy, never a default that config can toggle off.

### DF-05 — Defaults must be deterministic and environment-independent
Product defaults cannot silently depend on:
- current directory;
- repository contents;
- CPU/RAM count;
- network availability;
- provider permissions;
- environment variables;
- wall-clock time;
- machine identity.

Those are runtime/preflight inputs. If adaptive behavior is later justified, it must be derived explicitly from observed capabilities and its provenance must not be labelled `PRODUCT_DEFAULT`.

### DF-06 — Default catalogue is machine-addressable
The implementation must expose a compact deterministic catalogue keyed by stable configuration path/field identity, with at least:
- owning module;
- value or explicit `NO_DEFAULT` marker;
- value type/schema binding;
- override policy reference;
- security/assurance classification where relevant;
- introduced-in product/contract version;
- optional deprecation/change metadata.

The catalogue may be represented in generated TypeScript/JSON as implementation chooses, but it must be mechanically checked against canonical schemas/contracts.

### DF-07 — `NO_DEFAULT` is first-class
Some fields must require explicit selection rather than silently guessing. The system distinguishes:
- field absent because product default applies;
- field absent because owner says `NO_DEFAULT` and explicit value is required;
- field unavailable because owning capability/profile is absent.

A required explicit decision yields a typed configuration/precondition diagnostic before side effects.

### DF-08 — Effective-config rendering is non-mutating
GEF may provide machine/human views such as:
- effective value;
- provenance;
- inherited/default status;
- overrideability;
- policy bounds;
- difference from product default.

Rendering these views does not rewrite `.gef/project.json` or global config.

### DF-09 — Default changes are compatibility-relevant
Changing a default can change behavior in repositories that omitted that field. Therefore a default change is never treated as cosmetic merely because schema shape stayed compatible.

Every default change must be classified at least as:
- behavior-preserving/editorial metadata;
- backward-compatible behavior adjustment;
- behavior-changing migration/compatibility event;
- security/assurance correction.

S05 owns version/migration mechanics, but S04 requires the change signal to exist.

### DF-10 — Security fixes may supersede old defaults
A previous default does not become an eternal compatibility promise when it is unsafe. Security/assurance corrections may tighten behavior, but the release must record the behavioral change and migration/compatibility implications rather than silently pretending nothing changed.

### DF-11 — Explicit values remain explicit across default evolution
If a project/global config explicitly stores a value equal to the old default, a future product-default change does not silently rewrite that explicit intent. The configured value continues to win if still valid under policy.

This is why default-valued settings should not be materialized automatically during adoption.

### DF-12 — Minimal initial catalogue
The initial M02 implementation should define only defaults required by currently owned M02 behavior and M01 runtime/config integration. Fields owned by M14/M27/M43/M49/M63 etc. join the catalogue only when those owners freeze their semantics.

Candidate M02-level defaults are limited to mechanics such as:
- absence of global config is allowed;
- canonical known paths defined by S01/S02 are fixed conventions, not user defaults;
- unknown core fields are rejected by schema policy, not a user default;
- extension payloads are inactive until owner compatibility exists;
- no generic environment override layer.

Concrete execution/assurance/telemetry numeric defaults remain with their owning modules rather than being invented here.

### DF-13 — Token/latency economy
Defaults must reduce recurring context cost by allowing the resolver to communicate only:
- non-default overrides;
- compact effective snapshot/fingerprint;
- default catalogue version/fingerprint;
- changed-default delta when product versions differ.

LLM/executor prompts should not carry the complete default catalogue unless the task actually touches default semantics.

### DF-14 — Brownfield neutrality
Adopting GEF in an existing repository does not implicitly persist hundreds of defaults or change unrelated project files. Adoption applies safe product defaults in memory and writes only the minimal explicit adoption/config material required by frozen contracts.

## Candidate default resolution output
Conceptual only:

```text
ResolvedField
  path
  value
  provenanceLayer
  provenanceRef?
  inheritedFromDefault: boolean
  defaultCatalogVersion
  overridePolicy
  policyBounds?
```

## Security and reliability invariants
1. Defaults cannot weaken frozen policy floors.
2. Environment/provider observations are never disguised as defaults.
3. `NO_DEFAULT` cannot silently coerce to a guessed value.
4. Explicit persisted intent wins over a later changed default when still valid.
5. Default changes that alter behavior are compatibility-significant.
6. Sensitive values/secrets never appear in the default catalogue.

## Future implementation proof
Eventually prove:
- precedence/provenance between defaults/global/project/explicit override;
- omission does not materialize redundant fields;
- `NO_DEFAULT` produces deterministic failure;
- explicit old-default value remains explicit after product-default change;
- safety floors cannot be downgraded by a changed/default value;
- adaptive runtime observations are classified separately;
- default catalogue/schema alignment;
- deterministic catalogue/snapshot fingerprints;
- effective-config rendering has no mutation side effect;
- brownfield adoption does not expand config unnecessarily.

## Open decisions before freeze
1. Should the default catalogue itself be a persisted JSON artifact with a canonical schema, or remain a build-time/runtime machine contract generated from product code/contracts?
2. Should a config field explicitly set to its current product default be preserved verbatim, or may normalization remove it as redundant?
3. Do we freeze a product-wide rule that defaults may never depend directly on machine capability, requiring all adaptive values to live in a separate derived-policy layer?
4. Should default catalogue changes receive their own fingerprint/version independent from general product version for targeted invalidation and delta review?

## Session completion rule
S04 may freeze only after these four decisions are resolved and exact-head review confirms consistency with S01-S03, Security and future S05 migration ownership.

STOP CONDITION: `DEFAULTS_DECISIONS_REQUIRED`.
