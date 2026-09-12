# GBS-M02-S02 — Project Configuration

Status: `FROZEN_CANDIDATE`

## Purpose
Freeze the repository-scoped GEF configuration contract for one target project while preserving canonical project truth, separating tracked configuration from private operational state, and preventing configuration from becoming a covert replacement for Requirements, Scope, Architecture, DoD, identity or accepted-risk decisions.

## Binding sources
- frozen Architecture and Security
- M02-S01 Global Configuration
- completed M01 deterministic kernel contracts
- Source Hierarchy, DoD, Backlog and Planning Protocol

## Ownership boundary
M02-S02 OWNS:
- project configuration discovery location;
- tracked vs private state boundary;
- project-layer precedence behavior;
- portability/brownfield adoption rules;
- project configuration provenance and mutation policy;
- relationship between project config and global config.

M02-S02 DOES NOT OWN:
- project identity generation/fingerprints (M03);
- repository discovery/preflight (M04);
- mutation transaction implementation (M05/M06);
- canonical schemas/defaults/version migrations (S03-S05);
- semantic Requirements/Scope/Architecture/DoD;
- credentials/secrets;
- checkpoints/evidence/receipts.

## Frozen project configuration contract

### PC-01 — Canonical tracked project config
Canonical path is `.gef/project.json` at the repository root.

Properties:
- repository-scoped and version-controlled by default;
- bounded known-path lookup only;
- never discovered by recursive search;
- no alternate hidden aliases;
- UTF-8 JSON only;
- materialized during formal GEF adoption as an explicit machine-readable adoption marker, even when no non-default project value is required yet.

The minimal adoption document remains schema-valid, versioned and semantically sparse. It must not copy defaults merely to create noise.

### PC-02 — Private operational state is physically separate
Canonical private root is `.gef/private/`, ignored by version control by default.

It may contain derived caches, transaction/recovery state, temporary runtime material and other later-owner operational artifacts, but never the sole copy of canonical project truth.

Tracked `.gef/project.json` and ignored `.gef/private/` deliberately share the product namespace while remaining semantically and Git-policy distinct. Ignore rules target the private subtree only. Blanket ignoring `.gef/` is prohibited because it could silently hide the tracked adoption/config contract.

### PC-03 — Project configuration is below semantic governance
Project config may express deterministic product behavior and project-scoped preferences/capabilities, but cannot redefine or silently override Requirements, Scope/Out-of-Scope, Architecture decisions, Security minimums, DoD, accepted risks/waivers, checkpoint/evidence verdicts or S4 authorization.

Where a project config value conflicts with an authoritative governed source, the authoritative source wins and the configuration layer reports a conflict rather than silently coercing either side.

### PC-04 — Precedence contract
Effective configuration remains:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

Higher precedence does not imply authority to weaken a lower-layer safety floor. Precedence applies only within fields whose contract explicitly permits override.

Each effective value retains provenance and policy metadata sufficient to answer: `what value won?`, `from which layer?`, `why was override permitted?`.

### PC-05 — Project config domains
Project-scoped domains include only fields with deterministic ownership, for example:
- project-level execution budgets/preferences;
- assurance preferences that may tighten but not weaken minimums;
- enabled built-in profiles/capability references;
- provider/profile references without credentials;
- feature flags admitted for project scope;
- telemetry/privacy preferences where project policy may be stricter;
- versioned extension namespaces.

Project identity fields are references/bindings owned by M03, not invented locally by M02.

### PC-06 — Brownfield adoption is explicit and non-destructive
Existing repositories are not considered configured merely because similarly named files exist. Adoption may preview/create `.gef/project.json` only through a governed adoption/materialization flow.

Rules:
- no automatic migration of unrelated config files;
- no deletion/renaming of existing tooling config to make room for GEF;
- existing `.gef/` collision is detected and classified before mutation;
- a collision or incompatible existing file fails closed or enters explicit migration planning;
- initial project config creation is previewable and reversible under transaction policy.

### PC-07 — Project config changes are governed repository changes
Because `.gef/project.json` is tracked canonical machine configuration, modifying it is not treated as ephemeral preference storage. Changes require the same expected-state, diff/review/evidence discipline appropriate to their security class.

A change that alters security/assurance/provider side-effect behavior inherits the highest applicable security class rather than being downgraded because it is "just config".

### PC-08 — Secrets and machine-local values are prohibited
Project config must not contain tokens/passwords/private keys, absolute user-home paths when portability is expected, machine-specific caches/temp paths unless represented through a portable symbolic contract, volatile runtime observations that belong to preflight/discovery, or locally accepted secret values.

Use external credential references, portable path tokens/roots, or runtime discovery ports instead.

### PC-09 — Repository portability
A cloned project should preserve the same semantic project configuration without copying private runtime state. Therefore:
- tracked project config is portable;
- `.gef/private/` is disposable/rebuildable except explicitly retained recovery material;
- environment-specific resolved values remain derived/runtime state;
- platform differences are normalized through contracts rather than committed ad hoc.

### PC-10 — Deterministic snapshot and token economy
Project config participates in the same resolved immutable snapshot as S01. The resolver must support known-path reads only, field-level provenance, compact fingerprint, delta/invalidation by source fingerprint, no LLM interpretation for mechanical merge/precedence, and no re-reading unchanged raw config when validated snapshot remains compatible.

### PC-11 — Extensions remain capability-gated
Versioned project extension namespaces follow S01 preservation rules. Unknown or unavailable owners may leave validated extension payload inactive, but inactive content cannot affect effective core behavior.

### PC-12 — Project config cannot become a dumping ground
A field enters project config only when:
1. an owning module exists;
2. semantics are deterministic enough for schema validation;
3. persistence at project scope is justified;
4. precedence behavior is defined;
5. security implications are classified;
6. migration/versioning policy can support it.

This gate intentionally favors a smaller stable config over a large speculative one.

### PC-13 — Distribution/update persistence is owner-gated
Project-level distribution/update settings are not part of the base project configuration merely because S01 permits a global distribution preference. They enter `.gef/project.json` only when M33/M49/M50 or an admitted release/profile owner defines a project-persistent field with clear precedence, portability, security and migration semantics.

Until then, distribution/update preferences remain global/operator-scoped or explicit invocation inputs. This prevents speculative release policy from leaking into every adopted repository.

## Conceptual shape
Not yet the S03 schema:

```text
ProjectConfigurationDocument
  schemaVersion
  configVersion
  adoption
  execution?
  assurance?
  profiles?
  telemetry?
  features?
  extensions?
  projectBinding?   # reference contract owned by M03
  distribution?     # only after admitted owner contract exists
```

## Resolved freeze decisions
1. Tracked project config path: `.gef/project.json` — **FROZEN**.
2. Private operational root: `.gef/private/`, selectively ignored without ignoring `.gef/` — **FROZEN**.
3. Formal GEF adoption always materializes a minimal `.gef/project.json` adoption marker; defaults are not redundantly copied — **FROZEN**.
4. Project-level distribution/update preferences are owner-gated and absent from the base schema until an admitted release/distribution owner requires them — **FROZEN**.

## Security invariants
1. Tracked project config is never secret storage.
2. `.gef/private/` is ignored by default and cannot silently become canonical.
3. Config cannot authorize S4 or waive product/project safety floors.
4. Existing `.gef/` collisions are detected before mutation.
5. Unknown security-relevant behavior fails closed.
6. A config change inherits the risk class of the behavior it enables.
7. Adoption marker materialization never implies authorization for unrelated mutations.

## Future implementation proof
Eventually prove:
- exact known-path lookup;
- tracked/ignored boundary correctness;
- safe `.gitignore` behavior without hiding `.gef/project.json`;
- minimal adoption marker materialization;
- precedence + provenance against global config;
- governed conflict reporting against higher-authority sources;
- brownfield collision handling;
- secret/machine-local value rejection where schema-owned;
- cloned-project portability;
- compact fingerprint/invalidation behavior;
- no recursive repository scan for config.

## Session completion rule
Planning content is frozen-candidate. Final `FROZEN` requires exact-head review, merge and checkpoint advancement to `GBS-M02-S03`.

STOP CONDITION: `M02_S02_EXACT_HEAD_REVIEW_REQUIRED`.
