# GBS-M02-S01 — Global Configuration

Status: `FROZEN`

## Purpose
Freeze the global configuration contract for GEF Bootstrap without mixing project-specific configuration, schema mechanics, defaults, migrations, credentials, operational state or semantic project decisions into this session.

Global configuration is the small, portable operator/product policy layer that can apply across repositories. It configures deterministic behavior; it never becomes a second source of project truth.

## Binding sources
- `GBS-CONSTITUTION-v1.1`
- frozen Project Overview, Requirements, Scope, Architecture, Security, DoD and Deployment
- `GBS-M01` frozen contracts and completed kernel boundary
- Master Module Index and Planning Protocol

## Ownership boundary
M02-S01 OWNS:
- global configuration discovery contract;
- global configuration location abstraction;
- allowed global configuration domains;
- precedence position of the global layer;
- provenance requirements;
- strict/lenient handling policy for non-security unknown fields;
- secret/reference prohibition;
- deterministic normalization expectations.

M02-S01 DOES NOT OWN:
- repository/project configuration values (S02);
- canonical JSON schemas and validation implementation (S03);
- default value catalogue (S04);
- migration/version evolution (S05);
- project identity (M03);
- environment/tool discovery (M04);
- credentials or secret storage (Security/provider mechanisms);
- runtime caches/transactions/checkpoints (later owners).

## Frozen decisions

### GC-01 — Global configuration is optional
A missing global configuration file is valid. GEF must still operate from product defaults plus project-scoped governed configuration when present. Absence is not an error and must not trigger repository scanning.

### GC-02 — OS-aware location with one logical path
The global configuration file lives at logical path `gef/config.json` beneath the platform-appropriate per-user configuration root selected by a dedicated path resolver. Domain/kernel code consumes a resolved location and must not hard-code Windows/Linux/macOS paths.

The directory form is frozen rather than a single root-level `gef.json` because it gives one reserved product namespace for future bounded companion artifacts without multiplying top-level files or inventing parallel discovery rules.

No global configuration is discovered from arbitrary parent directories, home-directory globbing or broad filesystem search.

### GC-03 — Precedence is explicit and provenance-preserving
Effective configuration is assembled in this order, lowest to highest precedence:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

Environment variables are not a generic shadow configuration layer. They may supply explicitly allowlisted operational inputs or credential references defined by a specific contract. This prevents invisible environment state from silently rewriting governed policy.

Every effective non-default value must retain provenance: source layer plus source location/reference and normalized key. Sensitive references retain provenance metadata without exposing secret values.

### GC-04 — Global layer may tune behavior, never project truth
Allowed global domains are operator preferences and bounded execution policy that make sense across repositories, such as:
- output/rendering preferences;
- telemetry/privacy controls within frozen policy;
- default assurance/performance preferences where project policy may safely tighten them;
- bounded concurrency/resource budgets;
- provider/profile preference references;
- update/distribution preference;
- explicitly supported feature flags that cannot weaken frozen security/assurance floors.

Global configuration MUST NOT define or override:
- project requirements, scope, architecture or DoD;
- repository/project identity;
- accepted risks/waivers;
- S4 authorization;
- canonical checkpoint/evidence verdicts;
- security minimums;
- secret values.

A project can tighten a global preference when project policy is authoritative. A global value cannot weaken a project or product safety floor.

### GC-05 — Fail closed for unsafe ambiguity
Malformed configuration, duplicate semantic keys after normalization, incompatible required contract version, invalid security/assurance-affecting value, or ambiguous path/encoding yields a typed configuration failure before governed side effects.

Unknown top-level/domain keys fail by default for machine-governed configuration. Explicitly versioned extension namespaces are the sole exception under GC-11. No silent typo acceptance.

### GC-06 — JSON is canonical persisted interchange
The canonical global configuration representation is UTF-8 JSON and will be governed by the M02 schema/version contracts. Human-facing tooling may later offer guided editing, but YAML/TOML/etc. are not parallel canonical formats unless a future governed decision proves a need.

One persisted representation reduces parser surface, ambiguity, dependency cost, migration burden, token duplication and cross-platform drift.

### GC-07 — Secrets are references, not values
Global configuration never intentionally stores credentials/tokens/private keys. A configuration field that needs a credential stores only a non-secret provider/credential reference identifier accepted by the relevant capability contract. Resolution occurs through authorized external credential mechanisms.

Redaction and diagnostics must never echo resolved secret values.

### GC-08 — Deterministic normalization
Loading produces a normalized immutable configuration snapshot for one invocation. Normalization is deterministic and side-effect-free after bounded file read/parse/validation. The snapshot carries:
- contract/schema version;
- effective values;
- provenance map;
- warnings/gaps;
- fingerprint over normalized non-secret configuration inputs;
- source descriptors needed for invalidation.

The snapshot does not watch files or mutate configuration automatically. A later invocation/reload explicitly creates a new snapshot.

### GC-09 — Token and latency economy
Configuration resolution must be deterministic so an LLM never needs to reread or reason over raw configuration when a compact validated snapshot/fingerprint is sufficient.

Required optimization properties:
- bounded known-path reads only;
- no repository-wide discovery for global config;
- normalized compact machine snapshot;
- stable fingerprint for reuse/invalidation;
- provenance delta so reviews can inspect changed keys instead of whole files;
- no duplicate serialization formats.

### GC-10 — Brownfield safety
Adopting GEF in an existing project must not require creating global configuration. Existing project files are not interpreted as GEF global configuration by resemblance. Import/conversion from other tools requires an explicit future adapter/migration path and preview.

### GC-11 — Versioned extension preservation without activation
Explicitly versioned extension namespaces may be syntactically/schema-preserved while their owning adapter/provider is absent, but they are **inactive and non-authoritative** until ownership, compatibility and capability validation succeed.

Rules:
- extension namespace identity/version must be explicit;
- preserved inactive content cannot alter effective core configuration;
- security/assurance-critical unknown fields cannot be silently ignored if they claim to affect core behavior;
- an operation requiring an inactive extension fails with a typed capability/configuration error rather than guessing behavior;
- round-tripping may preserve validated opaque extension payloads, but core never interprets them semantically.

This permits portable configuration and optional-adapter workflows without turning missing plugins into hidden execution semantics.

### GC-12 — Minimal initial canonical domains
The initial global schema includes only domains whose semantics are already defined strongly enough to validate without speculation:
- `schemaVersion` / `configVersion` metadata;
- `operator` for non-secret interaction/render preferences;
- `execution` for bounded deterministic execution preferences such as concurrency/resource budgets;
- `assurance` only for preferences that can never weaken frozen minimum gates;
- `telemetry` only for privacy/collection preferences within frozen policy;
- `distribution` for update/channel preferences where Deployment owns semantics;
- `features` only for explicitly registered safe feature flags;
- `extensions` for GC-11 versioned namespaces.

`providers` is omitted from the initial core schema until provider/profile owners freeze portable fields. Provider credential values are never admitted. New domains are added only when their owner freezes semantics and S03/S05 compatibility rules admit them.

## Conceptual machine model
This is not yet the S03 canonical schema:

```text
GlobalConfigurationDocument
  schemaVersion
  configVersion
  operator?
  execution?
  assurance?
  telemetry?
  distribution?
  features?
  extensions?

ResolvedConfigurationSnapshot
  schemaVersion
  effective
  provenance
  warnings
  fingerprint
  sources
```

Field-level schemas/defaults are deliberately deferred to S03/S04 so this session freezes semantics without prematurely duplicating ownership.

## Security and reliability invariants
1. Global config cannot authorize S4.
2. Global config cannot weaken frozen security/assurance floors.
3. Secrets are prohibited as persisted config values.
4. Parsing/validation happens before governed mutation.
5. Symlink/path safety follows M06/Security once filesystem ownership is implemented.
6. Unknown/invalid security-relevant data never degrades silently.
7. Provenance survives merge/normalization.
8. Effective config is immutable for an invocation.
9. Inactive extensions cannot influence core behavior.
10. New config domains require an owning contract, not speculative placeholders.

## Required future proof
Implementation acceptance for this contract must eventually prove at least:
- missing global file is valid;
- deterministic known-path resolution on Windows/Linux/macOS fixtures;
- logical `gef/config.json` mapping;
- precedence/provenance correctness;
- malformed/unknown/unsafe config behavior;
- inactive extension preservation without activation;
- no secret-value persistence/logging;
- safety-floor non-downgrade;
- deterministic snapshot/fingerprint;
- no broad filesystem/repository scan;
- brownfield non-interference.

## Resolved freeze questions
1. Logical global config path: **`gef/config.json` under platform user config root — FROZEN**.
2. Unknown explicitly versioned extensions: **preserve validated payload but keep inactive/non-authoritative until owner is available — FROZEN**.
3. Initial schema domains: **minimal owner-backed domains only; speculative/provider-specific domains omitted until their owners freeze semantics — FROZEN**.

## Session completion rule
This session is frozen subject to exact-head review and merge. No functional implementation is introduced by this planning session.

STOP CONDITION: `M02_S01_EXACT_HEAD_REVIEW_REQUIRED`.
