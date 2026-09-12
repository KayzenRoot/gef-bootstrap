# GBS-M02-S02 — Project Configuration

Status: `IN_DISCUSSION`

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

## Candidate project configuration model

### PC-01 — One tracked canonical project config
Candidate canonical path: `.gef/project.json` at the repository root.

Properties:
- repository-scoped and version-controlled by default;
- bounded known-path lookup only;
- never discovered by recursive search;
- no alternate hidden aliases;
- UTF-8 JSON only;
- absence is valid for unadopted/brownfield repositories until explicit GEF adoption materializes it.

### PC-02 — Private operational state is physically separate
Candidate private root: `.gef/private/`, ignored by version control by default.

It may contain derived caches, transaction/recovery state, temporary runtime material and other later-owner operational artifacts, but never the sole copy of canonical project truth.

Tracked `.gef/project.json` and ignored `.gef/private/` deliberately share the product namespace while remaining semantically and Git-policy distinct. Ignore rules must target the private subtree, not blanket-ignore `.gef/`.

### PC-03 — Project configuration is below semantic governance
Project config may express deterministic product behavior and project-scoped preferences/capabilities, but cannot redefine or silently override:
- Requirements;
- Scope/Out-of-Scope;
- Architecture decisions;
- Security minimums;
- DoD;
- accepted risks/waivers;
- checkpoint/evidence verdicts;
- S4 authorization.

Where a project config value conflicts with an authoritative governed source, the authoritative source wins and the configuration layer reports a conflict rather than silently coercing either side.

### PC-04 — Precedence contract
Effective configuration remains:

`PRODUCT_DEFAULTS < GLOBAL_CONFIG < PROJECT_CONFIG < EXPLICIT_INVOCATION_OVERRIDE`

But higher precedence does not imply authority to weaken a lower-layer safety floor. Precedence applies only within fields whose contract explicitly permits override.

Each effective value retains provenance and policy metadata sufficient to answer: `what value won?`, `from which layer?`, `why was override permitted?`.

### PC-05 — Project config domains
Candidate project-scoped domains include only fields with deterministic ownership, for example:
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
Project config must not contain:
- tokens/passwords/private keys;
- absolute user-home paths when portability is expected;
- machine-specific caches/temp paths unless represented through a portable symbolic contract;
- volatile runtime observations that belong to preflight/discovery;
- locally accepted secret values.

Use external credential references, portable path tokens/roots, or runtime discovery ports instead.

### PC-09 — Repository portability
A cloned project should preserve the same semantic project configuration without copying private runtime state. Therefore:
- tracked project config is portable;
- `.gef/private/` is disposable/rebuildable except explicitly retained recovery material;
- environment-specific resolved values remain derived/runtime state;
- platform differences are normalized through contracts rather than committed ad hoc.

### PC-10 — Deterministic snapshot and token economy
Project config participates in the same resolved immutable snapshot as S01. The resolver must support:
- known-path reads only;
- field-level provenance;
- compact fingerprint;
- delta/invalidation by source fingerprint;
- no LLM interpretation for mechanical merge/precedence;
- no re-reading unchanged raw config when validated snapshot remains compatible.

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

## Candidate conceptual shape
Not yet the S03 schema:

```text
ProjectConfigurationDocument
  schemaVersion
  configVersion
  execution?
  assurance?
  profiles?
  telemetry?
  distribution?
  features?
  extensions?
  projectBinding?   # reference contract owned by M03
```

## Security invariants
1. Tracked project config is never secret storage.
2. `.gef/private/` is ignored by default and cannot silently become canonical.
3. Config cannot authorize S4 or waive product/project safety floors.
4. Existing `.gef/` collisions are detected before mutation.
5. Unknown security-relevant behavior fails closed.
6. A config change inherits the risk class of the behavior it enables.

## Future implementation proof
Eventually prove:
- exact known-path lookup;
- tracked/ignored boundary correctness;
- safe `.gitignore` behavior without hiding `.gef/project.json`;
- precedence + provenance against global config;
- governed conflict reporting against higher-authority sources;
- brownfield collision handling;
- secret/machine-local value rejection where schema-owned;
- cloned-project portability;
- compact fingerprint/invalidation behavior;
- no recursive repository scan for config.

## Open decisions before freeze
1. Freeze tracked project config path as `.gef/project.json`?
2. Freeze private operational root as `.gef/private/`, with selective ignore rules rather than ignoring `.gef/` entirely?
3. Should project config be created during initial adoption only when at least one non-default project-scoped value is needed, or always materialized as an explicit adoption marker?
4. Should project config allow project-level distribution/update preferences, or should those remain global-only until a release profile owner requires project persistence?

## Session completion rule
S02 may freeze only after these decisions are resolved and exact-head review confirms consistency with S01, Security SEC-03 and future M03/M04/M05/M06 ownership.

STOP CONDITION: `PROJECT_CONFIGURATION_DECISIONS_REQUIRED`.
