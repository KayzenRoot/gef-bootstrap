# GBS-M02-S03 — Schemas

Status: `IN_DISCUSSION`

## Purpose
Freeze the canonical machine-schema contract for persisted/interchanged GEF configuration and related M02 documents, ensuring one authoritative validation model, deterministic compatibility behavior, compact diagnostics and mechanical alignment with TypeScript.

## Binding sources
- frozen Architecture A8
- frozen Security
- M02-S01 Global Configuration
- M02-S02 Project Configuration
- completed M01 typed result/error contracts

## Ownership boundary
M02-S03 OWNS:
- canonical schema language/profile for M02 persisted/interchange documents;
- schema identity/version metadata;
- validation mode and unknown-field behavior;
- schema/type alignment rules;
- diagnostics shape for validation failures;
- extension namespace validation boundary;
- schema registry/bundling contract.

M02-S03 DOES NOT OWN:
- concrete default values (S04);
- migration policy/evolution steps (S05);
- project identity semantics (M03);
- arbitrary schemas owned by later modules, except shared conventions they adopt;
- runtime business policy beyond structural/contract validation.

## Candidate schema contract

### SC-01 — JSON Schema 2020-12 is canonical
Persisted/interchanged JSON owned by M02 uses JSON Schema 2020-12 as the language-neutral source of machine structural truth.

Schemas are version-controlled, bundled with the product and validated in tests. A schema file is not generated ad hoc at runtime.

### SC-02 — Stable schema identity
Every canonical persisted/interchange schema has:
- stable `$id` in the GEF schema namespace;
- explicit schema document version;
- document-level `schemaVersion` or equivalent contract-version field;
- stable artifact name independent of filesystem location;
- declared owner module.

Filesystem paths may evolve under governed migration without changing semantic identity accidentally.

### SC-03 — One source of machine structural truth
For any persisted/interchanged document, there is exactly one canonical schema authority. TypeScript types are generated from, or mechanically checked against, that schema where practical.

Handwritten TypeScript may exist for richer runtime behavior, but persisted field shape cannot silently diverge. CI must detect schema/type drift before release.

### SC-04 — Closed core, explicit extensions
Core configuration objects are closed by default. Unknown keys fail validation unless they occur inside a declared extension namespace whose owning contract explicitly permits preservation.

This prevents typos such as `assurence` from silently behaving as absent configuration.

Extension payloads that are structurally preservable but whose owner is unavailable remain inert. They cannot affect effective core behavior until owner compatibility/capability validation succeeds.

### SC-05 — Security-critical unknowns fail closed
Unknown or unsupported fields affecting authorization, security class, assurance floor, provider side effects, recovery, integrity or evidence never degrade to warnings merely for forward compatibility.

Readers may preserve unknown inert extension data, but must not interpret it permissively.

### SC-06 — Validation phases are explicit
Candidate deterministic validation pipeline:

`BYTES/UTF8 -> JSON_PARSE -> BASE_ENVELOPE -> SCHEMA_SELECT -> STRUCTURAL_VALIDATE -> OWNER/POLICY_VALIDATE -> NORMALIZE -> SNAPSHOT`

Structural schema validation does not pretend to replace semantic/policy validation. For example, a numeric concurrency value may be structurally valid yet rejected by policy bounds.

### SC-07 — Compact structured diagnostics
Validation failures produce machine-readable diagnostics rather than prose-only errors. Minimum fields:
- schema/artifact ID;
- document source descriptor;
- JSON Pointer or equivalent path;
- stable diagnostic code;
- category/severity;
- bounded safe message;
- expected constraint metadata where non-sensitive;
- offending value omitted/redacted when sensitive;
- optional remediation action ID.

Diagnostics integrate with M01 typed errors without embedding raw stack traces.

### SC-08 — Deterministic output ordering
Schema compilation/validation result ordering must be deterministic for identical inputs. Multi-error diagnostics are sorted by stable path/code rules so receipts, tests and LLM reviews do not churn because validator traversal order changed.

### SC-09 — Bounded validation
Schema validation has explicit limits against hostile/accidental pathological input: document size, nesting depth, collection sizes where appropriate, diagnostic count and extension payload bounds. Resource exhaustion is a typed failure, not process collapse.

### SC-10 — References are controlled
`$ref` resolution is local/bundled by default. Validation must not fetch arbitrary remote schemas at runtime. External network schema resolution is prohibited unless a future explicit capability contract admits and verifies it.

Schemas may reference other bundled GEF schemas through stable IDs resolved by the local registry.

### SC-11 — Schema registry is deterministic
The product exposes a read-only schema registry mapping stable artifact IDs and supported schema versions to bundled validators/schema documents.

Registry composition is explicit and deterministic. Duplicate IDs or ambiguous version registrations fail startup/build validation rather than using last-write-wins behavior.

### SC-12 — Schema compilation is reusable
Compiled validators may be cached as derived runtime artifacts keyed by schema bundle/version fingerprint. Cache invalidation is exact: schema/tooling input changes invalidate the compiled result.

LLM/executor flows should consume compact validation results/fingerprints instead of rereading full schemas when compatible proof remains valid.

### SC-13 — Canonical configuration artifacts
Initial M02 schema family should include only documents already justified by S01/S02:
- `gef.global-config`
- `gef.project-config`
- a shared resolved/provenance snapshot contract only if it crosses a persistence/process/public API boundary

Defaults catalogue and migration receipts are introduced only when S04/S05 freeze their ownership.

### SC-14 — Schema tests are contract tests
Each canonical schema eventually requires positive fixtures, negative fixtures, unknown-field tests, boundary/resource tests, secret/redaction-sensitive diagnostic tests, version-compatibility fixtures and schema/type alignment proof.

## Candidate schema repository structure
Illustrative only until implementation Work Order:

```text
schemas/
  config/
    global-config.schema.json
    project-config.schema.json
  shared/
    provenance.schema.json
    diagnostic.schema.json
```

Stable `$id` is authoritative; path is packaging organization.

## Token/latency economy
Schema design must reduce repeated reasoning by providing:
- stable machine validation instead of LLM interpretation;
- compact diagnostics with JSON Pointer paths;
- deterministic validator cache keys;
- schema bundle fingerprints;
- delta review against changed fields/contracts;
- no runtime remote resolution;
- no parallel JSON/YAML/TOML schema families.

## Security invariants
1. Remote `$ref` fetch is off by default.
2. Unknown security/assurance fields fail closed.
3. Sensitive offending values are redacted from diagnostics.
4. Malformed or oversized inputs fail before governed side effects.
5. Duplicate/ambiguous schema identity fails closed.
6. Validation never grants authorization or semantic approval.

## Future implementation proof
Eventually prove:
- canonical schema IDs/version selection;
- global/project positive and negative fixtures;
- strict unknown-key behavior;
- inert extension preservation;
- no remote `$ref` network access;
- deterministic diagnostic order;
- bounded pathological input handling;
- schema/type drift detection;
- validator cache invalidation by schema fingerprint;
- M01 typed error projection.

## Open decisions before freeze
1. Freeze schema IDs under an HTTPS-style namespace such as `https://schemas.gef.dev/...`, or use an opaque URN namespace such as `urn:gef:schema:...`?
2. Should canonical schemas use `additionalProperties: false` broadly, or `unevaluatedProperties: false` at composed object boundaries to support safer `$ref`/composition?
3. Do we freeze a persisted `ResolvedConfigurationSnapshot` schema now, or keep snapshots ephemeral until a later consumer proves persistence/interchange is required?
4. Which validator implementation constraints belong here versus the implementation Work Order: standards compliance only, or a preferred library as part of the contract?

## Session completion rule
S03 may freeze only after these four decisions are resolved and exact-head review confirms consistency with Architecture A8, Security and S01/S02.

STOP CONDITION: `SCHEMA_DECISIONS_REQUIRED`.
