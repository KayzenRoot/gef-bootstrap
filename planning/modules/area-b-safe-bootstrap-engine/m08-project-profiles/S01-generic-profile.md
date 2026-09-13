# GBS-M08-S01 — Generic Profile

Status: `FROZEN`

## Purpose
Freeze the deterministic, portable, non-executable baseline contract for `GBS-M08 — Project Profiles`. S01 defines the generic project-profile envelope, the built-in generic profile identity, deterministic profile selection/default behavior, exact template-reference and profile-binding projection semantics, immutable selection evidence, and the safety boundary between profile intent and the already-completed M07/M05/M06 contracts.

The generic profile is deliberately technology-neutral. It MUST be usable when no language/framework-specific profile is selected and MUST NOT guess Node, TypeScript, Python, web, app, package manager, framework, deployment target or repository topology from ambient state. Specialized content belongs to S02-S04; inheritance/overlay composition belongs to S05.

S01 is planning only. It performs no filesystem mutation, template fetching, rendering, dependency installation, shell/process execution, Git/provider mutation or Source Pack materialization.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S01`;
- completed M00-M07 public contracts;
- M02 deterministic schema/versioning, explicit precedence/provenance, strict core fields and inert-extension principles;
- M03 project/repository identity separation from content/profile identity;
- M04 bounded discovery, explicit-input and hosted-profile observation rules;
- M05 MODULE_DONE transactional desired-state/apply/rollback/idempotency contracts;
- M06 MODULE_DONE path authority, overwrite, link/reparse, staging and atomicity contracts;
- M07 MODULE_DONE template format, typed variables, conditional templates, rendering and complete desired-artifact validation;
- M07-S02 frozen precedence `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT` and prohibition on ambient environment as a generic binding layer;
- frozen Architecture deterministic-input, immutable-snapshot, startup-purity, library-first and canonical/derived/operational-state separation rules;
- frozen Security repository-content trust limits, secret handling, process-execution policy and capability-vs-authorization rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M09 ownership of Source Pack aggregation/distribution and template-source resolution;
- M24/M25 ownership of broad evidence/proof-graph products;
- M37 ownership of global trust/integrity/authorship policy;
- M51 ownership of supported platform/runtime compatibility policy;
- M63 ownership of quantitative executor-performance thresholds.

## Ownership boundary
M08-S01 OWNS:
- the versioned generic project-profile envelope;
- generic profile identity and technology-neutral semantics;
- deterministic explicit-profile versus generic-default selection;
- exact selected-profile snapshot semantics;
- declarative template-reference intent carried by a profile;
- declarative M07 `PROFILE_BINDING` candidates carried by a profile;
- profile semantic identity/digest inputs;
- compact profile-selection/projection evidence;
- fail-closed duplicate/unknown/conflicting profile content behavior;
- bounded, cancellable, S0 read-only profile parse/selection/projection behavior;
- the baseline constraints that specialized profiles in S02-S04 may only refine, never weaken.

M08-S01 DOES NOT OWN:
- TypeScript/Node profile semantics (M08-S02);
- Python profile semantics (M08-S03);
- Web/App profile semantics (M08-S04);
- profile inheritance, parent graphs, overlays or merge precedence (M08-S05);
- template syntax, variable declarations/types/contexts, conditions, rendering or rendered-output validation (M07);
- template/source fetching, catalog distribution or Source Pack aggregation (M09);
- repository/project identity (M03);
- repository discovery heuristics or tool probing (M04);
- semantic transaction apply/rollback/idempotency (M05);
- physical filesystem/path authority or atomic writes (M06);
- process/tool execution, dependency installation or arbitrary code loading (M01/Security and later owning modules);
- Git/provider mutation (M29/M30+);
- global integrity/trust policy (M37);
- compatibility-matrix policy (M51);
- quantitative performance thresholds (M63).

## Canonical logical profile envelope

Conceptually:

```text
ProjectProfile {
  schemaVersion
  profileContractVersion
  profileId
  profileVersion
  profileKind
  displayMetadata?
  templateBindings[]?
  extensions?
}

ProfileTemplateBinding {
  bindingId
  templateId
  templateVersion
  templateSemanticDigest?
  variableBindings[]?
}

ProfileVariableBinding {
  variableId
  valueType
  value
  valueClass?
}

ProfileSelectionRequest {
  mode                  // EXPLICIT_PROFILE | DEFAULT_GENERIC
  profileId?            // required only for EXPLICIT_PROFILE
  expectedProfileVersion?
  expectedProfileDigest?
}
```

This is a logical contract, not permission to invent alternate profile loaders. Future implementation may choose a library-owned serialized form, but it MUST preserve the exact semantics frozen here and MUST NOT turn profile loading into module execution.

## Frozen Generic Profile contract

### PRF-01 — Profile data is declarative and non-executable
A project profile is data. Loading, validating, selecting or projecting a profile MUST NOT execute repository code, import arbitrary modules, resolve package entry points, run hooks, evaluate expressions or invoke shell/tools.

JavaScript/TypeScript executable config modules, callbacks, functions, templated code evaluation and package lifecycle hooks are not admitted profile semantics.

### PRF-02 — Core profile shape is strict and versioned
Every admitted profile MUST carry:
- `schemaVersion`: positive integer schema discriminator;
- `profileContractVersion`: canonical bounded contract-version string;
- `profileId`: stable profile identifier;
- `profileVersion`: canonical SemVer content version;
- `profileKind`: closed kind vocabulary for the active contract version.

Unknown core fields fail closed. Compatibility with an unrecognized contract/schema version is never inferred by best effort.

A top-level `extensions` object MAY contain namespaced inert extension data. An unknown extension cannot change selection, templates, bindings, authority, execution, mutation or authorization.

### PRF-03 — Profile identity is not project/repository identity
`profileId` identifies a profile definition only. It MUST NOT be treated as M03 project identity, repository identity, filesystem authority, signer identity, trust level or authorization.

Canonical `profileId` uses a bounded lowercase ASCII identifier grammar:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Maximum length is 64 ASCII bytes. Case folding is not performed.

### PRF-04 — `generic` is the reserved built-in baseline profile ID
The canonical generic profile ID is exactly `generic`.

`generic` is product-owned and MUST resolve only to the versioned built-in generic-profile definition admitted by the active GEF Bootstrap release. Repository-local content cannot shadow, replace or redefine the product-owned `generic` ID under the same selection source.

A future user/custom profile namespace requires an explicit owning contract and cannot impersonate `generic`.

### PRF-05 — Generic profile semantics are technology-neutral
The built-in generic profile MUST NOT assume or require:
- Node.js, TypeScript, JavaScript or npm-family tooling;
- Python or a Python package manager;
- browser/web frameworks;
- mobile/desktop app frameworks;
- containers, cloud providers or deployment platforms;
- monorepo/single-package topology;
- a particular CI provider;
- a particular license, database, API style or UI stack.

Those choices belong to explicit later profiles/contracts.

### PRF-06 — Profile version changes with semantic changes
`profileVersion` is canonical SemVer. Any output-relevant change to template references, profile bindings or other frozen semantic content requires a corresponding new profile semantic identity and an appropriate governed version change.

Version text alone is not trust, freshness or authorization.

### PRF-07 — S01 admits two selection modes only
The baseline selection modes are:
- `EXPLICIT_PROFILE`;
- `DEFAULT_GENERIC`.

No `AUTO`, `LATEST`, `BEST_MATCH`, fuzzy-name, nearest-framework or heuristic selection mode is admitted by S01.

### PRF-08 — Explicit selection is exact and fail-closed
`EXPLICIT_PROFILE` requires exactly one canonical `profileId`.

If the requested profile is absent, ambiguous, unsupported, malformed, stale against supplied expectation fields, or otherwise inadmissible, selection fails. It MUST NOT silently fall back to `generic`.

This preserves user/operator intent and makes unsupported specialization visible.

### PRF-09 — Generic default is explicit policy, not heuristic discovery
`DEFAULT_GENERIC` deterministically selects the built-in `generic` profile.

It does not inspect package files, source extensions, dependency manifests, Git history, directory names, README text, environment variables, installed tools or network/provider metadata to decide that another profile would be “better”.

Later sessions may define explicit specialized selection inputs, but they cannot retroactively make S01's generic default heuristic or ambient.

### PRF-10 — Explicit selection always dominates generic default intent
A request cannot simultaneously mean “explicit X” and “default generic”. Ambiguous dual-mode input fails closed.

The generic profile is a baseline/default, never a shadowing override for an explicit requested profile.

### PRF-11 — Optional expectation binding prevents stale profile use
A selection request MAY bind expected profile version and/or semantic digest.

When supplied, those expectations are exact preconditions. Mismatch blocks selection instead of silently accepting a newer/older/different profile.

This allows resumable operations and future checkpoints to pin profile semantics without treating a display name as sufficient identity.

### PRF-12 — Selection produces an immutable snapshot
Successful selection produces an invocation-scoped immutable `SelectedProfileSnapshot` logically containing at least:
- selected profile ID;
- profile contract/schema version;
- profile content version;
- profile semantic digest;
- selection mode/source class;
- sanitized request/expectation identity;
- selected template-binding identities;
- compact selection/projection diagnostics.

Ambient repository/config changes cannot rewrite the snapshot in place. A later selection creates a new snapshot.

### PRF-13 — Profile content may reference templates but cannot resolve/fetch them
A profile may carry declarative `templateBindings` pointing to exact M07 template identities.

M08-S01 MUST NOT:
- fetch remote templates;
- scan the repository for matching templates;
- resolve registries/catalogs;
- choose `latest`;
- install packages;
- infer a template by file extension/name.

M09 or another explicit owning source contract resolves an admitted template reference into exact template bytes/snapshot later.

### PRF-14 — Template references are exact, never floating ranges
Each `ProfileTemplateBinding` identifies a template by exact `templateId` and exact canonical `templateVersion`.

A profile MAY additionally pin `templateSemanticDigest`; when present, digest mismatch blocks use.

SemVer ranges, wildcards, `latest`, moving tags, branch names and “newest compatible” lookup are not deterministic profile semantics.

### PRF-15 — Binding IDs are stable and unique
Every profile template binding has a stable canonical `bindingId` using the same bounded lowercase/hyphen identifier discipline as profile IDs.

Duplicate `bindingId` values fail closed. Two entries that target the same exact template identity but disagree in bindings are also a conflict unless S05 later defines an explicit, separately reviewed composition rule.

JSON/list order is never precedence.

### PRF-16 — Profile template order is non-semantic
`templateBindings` are a declarative set. Their serialized/list order MUST NOT imply execution, render, write or precedence order.

Canonical hashing/evidence orders them deterministically by stable binding identity.

### PRF-17 — Profile bindings are candidates for M07 `PROFILE_BINDING`, not direct render values
`variableBindings` are M08-owned declarative candidates that may be projected into M07's frozen `PROFILE_BINDING` layer.

M08 does not bypass M07. For each selected template, the projected candidates remain subject to M07 declaration existence, exact type, allowed context, allowed binding source, sensitive-reference and unknown/conflict rules.

### PRF-18 — Profile binding value types mirror the closed M07 scalar vocabulary
S01 admits only the existing M07 scalar value types:
- `STRING`;
- `BOOLEAN`;
- `INTEGER`;
- `ENUM`.

No objects, arrays, maps, functions, dates, binary blobs or arbitrary JSON values are admitted as baseline profile variable bindings.

The M08 representation MUST preserve the original typed value; stringification/coercion is forbidden.

### PRF-19 — M08 never coerces a profile binding to satisfy M07
Examples that remain invalid:
- string `"true"` for BOOLEAN;
- string `"42"` for INTEGER;
- integer `1` for BOOLEAN;
- case-folded or trimmed ENUM guessing.

A profile binding that does not satisfy the target M07 declaration blocks projection/use. It is never repaired silently.

### PRF-20 — Unknown profile bindings are not silently ignored
A profile may be broader than one concrete template request only when the owning later projection step deterministically scopes bindings by explicit template binding identity.

Within an active `ProfileTemplateBinding`, a supplied variable key that is not declared/admitted by the resolved target template MUST surface a typed failure before render. Typos and cross-template leakage cannot disappear silently.

### PRF-21 — Explicit input still has higher precedence than profile binding
M08 MUST preserve M07-S02's frozen precedence:

```text
TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT
```

Profiles cannot mark their bindings “forced”, “locked”, “unoverrideable” or otherwise outrank a valid M07 `EXPLICIT_INPUT` under the current contract.

Any future policy that changes precedence requires an explicit versioned cross-module decision, not a profile field.

### PRF-22 — Profiles cannot create new M07 variables
A profile does not declare template variables by mentioning them.

Variable declarations, types, allowed contexts and allowed binding sources remain part of M07 template semantics. M08 only offers candidates to declarations that already exist in the resolved template.

### PRF-23 — Ambient environment is not a generic profile-binding source
S01 MUST NOT auto-import process environment variables, shell variables, cwd/home state, Git user config, hostnames or machine-local preferences into profile bindings.

If another owning contract resolves an environment-derived non-secret value, it must hand that value forward through an explicit governed input/source with provenance. S01 itself performs no ambient expansion.

### PRF-24 — Secret material is not admitted profile content
Passwords, API keys, private keys, access/session tokens and similar secret material MUST NOT be intentionally stored in or projected from generic project profiles.

A profile may carry an M07-compatible non-secret `SENSITIVE_REFERENCE` only when the target M07 declaration permits it. M08 MUST NOT dereference the reference or acquire secret material.

Diagnostics/evidence MUST avoid echoing suspected secret values.

### PRF-25 — Display metadata is inert
Optional human-facing metadata such as display name or description cannot affect:
- profile selection;
- template identity;
- variable values;
- precedence;
- execution;
- filesystem/provider authority;
- semantic digest unless an owning contract explicitly classifies a field as semantic.

Machine decisions use frozen semantic fields, never presentation text.

### PRF-26 — Profile semantic identity is deterministic
The `profileSemanticDigest` binds canonical output-relevant profile semantics including at least:
- profile contract/schema version;
- profile ID/version/kind;
- canonical set of exact template-binding identities;
- exact template version/digest pins;
- canonical typed profile variable bindings;
- any future admitted output-relevant S01 field.

It excludes incidental serialization order, whitespace, display metadata, local file paths, timestamps and machine-local source locations.

### PRF-27 — Selection/projection evidence is separate from profile semantic identity
Runtime evidence may bind:
- profile semantic digest;
- selection mode;
- expected version/digest preconditions;
- sanitized source/provenance identifier;
- target template identity/digest when resolved;
- projection status and typed error/gap codes.

This operational evidence does not mutate canonical profile content identity.

### PRF-28 — Profile source location is not semantic authority
Whether a profile definition is built-in, loaded from a future catalog, or supplied through another admitted source does not by itself grant trust or mutation authority.

Source/provenance is recorded separately. Global trust/integrity decisions remain with M37 and owning source policies.

### PRF-29 — Repository content cannot shadow product-owned generic profile
A repository file named `generic`, `profile.json`, `.gef/profile.*` or similar does not automatically replace the built-in generic profile.

Any future repository-local custom-profile discovery requires an explicit owning contract, bounded discovery rules and namespace/precedence semantics. S01 has none.

### PRF-30 — Profile intent grants no M05/M06 authority
Template/profile content may describe desired logical outputs and provide variable candidates, but it cannot grant:
- overwrite permission;
- delete/move authority;
- path escape;
- symlink/reparse traversal;
- filesystem root authority;
- irreversible-operation authorization;
- recovery bypass.

M07 produces validated desired artifacts; M05/M06 separately decide and authorize physical effects.

### PRF-31 — Profile intent grants no process/tool/provider authority
A profile cannot authorize or trigger:
- shell commands;
- package installation;
- build/test commands;
- scripts/hooks;
- network calls;
- Git mutations;
- GitHub/provider mutations;
- connector/plugin actions.

Later modules must own and authorize such operations explicitly.

### PRF-32 — S01 has no inheritance or overlay merge semantics
The baseline S01 profile has no parent, `extends`, mixin, overlay, deep-merge, last-write-wins or multiple-inheritance behavior.

If such fields appear under the S01 contract, they are unknown core fields and fail closed unless carried as inert namespaced extension data that cannot affect semantics.

S05 alone owns future inheritance/composition semantics.

### PRF-33 — Specialized profiles may refine but not weaken S01 safety
S02-S04 may add technology-specific template bindings, variable bindings and explicit profile metadata under versioned contracts.

They MUST NOT weaken:
- strict/versioned parsing;
- non-executable profile data;
- exact selection semantics;
- explicit-over-default behavior;
- M07 typed binding validation;
- no-secret-material rule;
- M05/M06 authority boundaries;
- no ambient heuristic fallback;
- immutable snapshot/digest behavior.

Any incompatible relaxation requires a separately governed architecture/security decision.

### PRF-34 — Profile evaluation is S0 read-only
Parsing, validating, selecting, hashing and projecting a profile are S0 read-only operations.

They MUST NOT:
- write project/profile/template files;
- create transaction staging/recovery state;
- mutate Git/provider state;
- install packages;
- invoke processes/tools;
- change cwd/environment;
- fetch remote data to “complete” a profile.

### PRF-35 — Work is bounded and cancellable
Future implementation MUST enforce finite budgets for at least:
- profile document bytes;
- extension bytes;
- template-binding count;
- variable-binding count;
- identifier lengths;
- scalar value bytes;
- diagnostics/evidence entries;
- canonicalization/hash work.

No unlimited production mode is admitted. Budget exhaustion or cancellation produces a typed non-success result, never partial profile acceptance.

### PRF-36 — Duplicate and conflicting data fail closed
The profile parser/model MUST detect duplicate semantic keys/IDs before ordinary host-object collapsing can hide them.

Last-write-wins based on JSON/object/list order is forbidden for profile IDs, binding IDs, variable IDs or other semantic keys.

Prototype-pollution-sensitive keys/structures MUST be rejected or represented through prototype-safe data structures in future implementation.

### PRF-37 — Generic profile is portable across supported hosts
Generic semantics MUST not depend on host path separators, locale, timezone, clock, random values, username/home directory, platform-specific newline defaults or filesystem case behavior.

The same admitted generic profile plus the same explicit inputs and exact template snapshots must yield the same profile-selection/projection semantics on supported hosts.

Physical filesystem differences remain M06/M51 concerns.

### PRF-38 — Error vocabulary is typed and stable enough for later evidence
Future implementation should distinguish at least:
- `PROFILE_SCHEMA_INVALID`;
- `PROFILE_CONTRACT_UNSUPPORTED`;
- `PROFILE_ID_INVALID`;
- `PROFILE_KIND_UNSUPPORTED`;
- `PROFILE_NOT_FOUND`;
- `PROFILE_AMBIGUOUS`;
- `PROFILE_EXPECTATION_MISMATCH`;
- `PROFILE_DUPLICATE_BINDING`;
- `PROFILE_TEMPLATE_REFERENCE_INVALID`;
- `PROFILE_TEMPLATE_EXPECTATION_MISMATCH`;
- `PROFILE_VARIABLE_BINDING_INVALID`;
- `PROFILE_VARIABLE_UNKNOWN`;
- `PROFILE_VARIABLE_TYPE_MISMATCH`;
- `PROFILE_SECRET_MATERIAL_FORBIDDEN`;
- `PROFILE_BUDGET_EXCEEDED`;
- `PROFILE_CANCELLED`;
- `PROFILE_INTERNAL_CONTRACT_VIOLATION`.

Error details MUST remain bounded and secret/value safe.

### PRF-39 — Success vocabulary is explicit
Baseline profile processing exposes explicit non-ambiguous states such as:
- `PROFILE_SELECTED`;
- `PROFILE_PROJECTED`;
- `PROFILE_BLOCKED`;
- `PROFILE_INDETERMINATE`.

A caller MUST NOT interpret a thrown/empty/null result as successful generic fallback.

### PRF-40 — Startup purity applies
Importing the future project-profiles package/module MUST NOT perform repository scans, filesystem mutation, network requests, environment harvesting, Git/provider access, package discovery or process execution.

Profile operations begin only through explicit API calls with explicit ports/inputs.

## Generic profile minimum semantic content
The built-in `generic` profile is intentionally small. Under S01 it MUST:
- identify itself as `profileId = generic`;
- carry the active S01 contract/schema versions and governed `profileVersion`;
- use `profileKind = GENERIC`;
- remain technology-neutral;
- contain only explicitly governed template references/bindings admitted by the release, if any;
- contain no hidden ambient-derived bindings;
- contain no inheritance/overlay fields;
- contain no secret material;
- grant no execution or mutation authority.

An empty `templateBindings` set is semantically valid at the S01 contract level. Whether a production GEF release must ship one or more useful generic template bindings is decided by the complete M08/M09/DoD integration gate, not invented here by unsafe placeholder references.

## Deterministic selection algorithm
Conceptually, S01 selection follows this order:

1. Validate the selection request shape and mode.
2. If `EXPLICIT_PROFILE`, validate the exact requested ID and resolve only that admitted profile identity through the supplied profile source/registry port.
3. If `DEFAULT_GENERIC`, resolve only the product-owned built-in `generic` profile.
4. Validate strict profile schema/contract/ID/version/kind and duplicate-free semantic structure.
5. Compute/verify canonical `profileSemanticDigest`.
6. Enforce any supplied expected version/digest preconditions.
7. Produce an immutable selected-profile snapshot.
8. When an exact M07 template snapshot is supplied for a declared template binding, project only that binding's typed profile candidates into M07's `PROFILE_BINDING` layer.
9. Let M07 independently validate declaration/type/source/context and produce its own resolution/render/validation results.
10. Emit compact bounded selection/projection evidence.

No step auto-discovers a specialized profile or authorizes effects.

## Proof obligations for future implementation
At minimum, the M08 implementation Work Order must require executable evidence that:
1. `DEFAULT_GENERIC` selects only the built-in generic profile.
2. Missing explicit profiles do not fall back to generic.
3. Explicit/digest/version expectation mismatch fails closed.
4. Repository-local shadow attempts cannot replace product-owned `generic` under S01.
5. Duplicate IDs/keys/bindings fail before last-write-wins collapse.
6. Unknown schema/contract/kind fails closed.
7. Template references are exact and reject floating/range/latest semantics.
8. Profile bindings preserve M07 scalar types without coercion.
9. Profile bindings remain below explicit input in M07 precedence.
10. Unknown/disallowed/type-invalid M07 bindings fail rather than disappear.
11. Actual secret material is rejected/redacted safely.
12. Import/startup performs zero ambient discovery/effects.
13. Selection/projection performs no filesystem/Git/provider/process/network mutation.
14. Cancellation and finite budgets are enforced.
15. Canonical digest is independent of semantic-set serialization order and display metadata.
16. Identical admitted input yields identical selected-profile semantic identity across supported hosts.
17. Stale selected-profile snapshots are detectable through pinned semantic identity.
18. Specialized profiles cannot use S01 APIs to bypass M07/M05/M06 authority boundaries.

## Review checklist
- [x] Next legal stage matched canonical checkpoint.
- [x] Generic profile is deterministic, strict, technology-neutral and non-executable.
- [x] Explicit selection and generic-default behavior are unambiguous.
- [x] No heuristic/ambient profile guessing was introduced.
- [x] Profile identity remains separate from project/repository identity and authorization.
- [x] Template references are declarative/exact and do not fetch or execute.
- [x] M07 `PROFILE_BINDING` precedence/type/context boundaries are preserved.
- [x] Secret material is not admitted.
- [x] M05/M06 mutation/path authority is not weakened.
- [x] S02-S04 specialization and S05 inheritance remain deferred.
- [x] S0 read-only, startup purity, cancellation and resource bounds are explicit.
- [x] Future implementation proof obligations are testable.

## Session completion rule
S01 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL architecture, security, determinism or ownership-boundary defect.

Promotion of S01 earns **no M08 production credit**. After a separate checkpoint promotion, the only next legal planning stage is:

`GBS-M08-S02 — TypeScript and Node`

No M08 Work Order may be compiled until all M08 planning sessions S01-S05 are frozen and the separate M08 Module Gate returns implementation-ready.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
