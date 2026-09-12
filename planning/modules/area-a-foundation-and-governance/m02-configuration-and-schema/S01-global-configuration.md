# GBS-M02-S01 — Global Configuration

Status: `IN_DISCUSSION`

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

## Frozen design candidate

### GC-01 — Global configuration is optional
A missing global configuration file is valid. GEF must still operate from product defaults plus project-scoped governed configuration when present. Absence is not an error and must not trigger repository scanning.

### GC-02 — OS-aware location, abstracted from domain logic
The global configuration file lives in the platform-appropriate per-user configuration directory selected by a dedicated path resolver. Domain/kernel code consumes a resolved location and must not hard-code Windows/Linux/macOS paths.

Candidate logical filename: `gef/config.json` under the resolved user configuration root. The exact path mapping is implementation-owned by the cross-platform resolver and compatibility tests.

No global configuration is discovered from arbitrary parent directories, home-directory globbing or broad filesystem search.

### GC-03 — Precedence is explicit and provenance-preserving
Effective configuration is assembled in this order, lowest to highest precedence:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

Environment variables are not a generic shadow configuration layer. They may supply explicitly allowlisted operational inputs or credential references defined by a specific contract. This prevents invisible environment state from silently rewriting governed policy.

Every effective non-default value must retain provenance: source layer plus source location/reference and normalized key. Sensitive references retain provenance metadata without exposing secret values.

### GC-04 — Global layer may tune behavior, never project truth
Allowed global domains are operator preferences and bounded execution policy that make sense across repositories, such as:
- output/rendering preferences;
- telemetry/privacy opt-in/out controls within frozen policy;
- default assurance/performance preferences where a project may safely tighten them;
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

Unknown keys are handled by schema policy from S03. Candidate rule: unknown top-level/domain keys fail by default for machine-governed configuration; explicitly versioned extension namespaces may be preserved when their contract allows it. No silent typo acceptance.

### GC-06 — JSON is canonical persisted interchange
The canonical global configuration representation is UTF-8 JSON and will be governed by the M02 schema/version contracts. Human-facing tooling may later offer guided editing, but YAML/TOML/etc. are not parallel canonical formats unless a future governed decision proves a need.

Rationale: one representation reduces parser surface, ambiguity, dependency cost, migration burden, token duplication and cross-platform drift.

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

## Candidate machine model
Conceptual shape, not yet the S03 canonical schema:

```text
GlobalConfigurationDocument
  schemaVersion
  configVersion
  operator
  execution
  assurance
  telemetry
  providers
  distribution
  features
  extensions

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

## Required future proof
Implementation acceptance for this contract must eventually prove at least:
- missing global file is valid;
- deterministic known-path resolution on Windows/Linux/macOS fixtures;
- precedence/provenance correctness;
- malformed/unknown/unsafe config behavior;
- no secret-value persistence/logging;
- safety-floor non-downgrade;
- deterministic snapshot/fingerprint;
- no broad filesystem/repository scan;
- brownfield non-interference.

## Open decisions before freeze
1. Freeze the logical global config name as `gef/config.json`, or use a single file such as `gef.json` under the platform config root?
2. Should explicitly versioned extension namespaces be preserved-but-inactive when the owning adapter is absent, or fail closed until the adapter is available?
3. Which global domains are mandatory in the initial canonical schema versus omitted until their owner modules define fields?

## Session completion rule
S01 can become `FROZEN` only when the three open decisions above are resolved and exact-head semantic review confirms no conflict with Architecture/Security or M01 ownership.

STOP CONDITION: `GLOBAL_CONFIGURATION_DECISIONS_REQUIRED`.
