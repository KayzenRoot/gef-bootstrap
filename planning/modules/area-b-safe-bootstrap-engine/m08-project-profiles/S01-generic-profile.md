# GBS-M08-S01 — Generic Profile

Status: `FROZEN`

## Purpose
Freeze the deterministic, portable, non-executable baseline contract for `GBS-M08 — Project Profiles`. S01 defines the generic project-profile envelope, the product-owned `generic` identity, exact explicit/default selection behavior, declarative template references, M07 profile-binding projection, immutable selection evidence, and the authority boundary between profile intent and completed M07/M05/M06 contracts.

The generic profile is technology-neutral. It MUST work without assuming Node, TypeScript, Python, web, app, package manager, framework, deployment target or repository topology. Specialized semantics belong to S02-S04; inheritance/composition belongs to S05.

S01 is planning only. It performs no filesystem mutation, template fetching, rendering, dependency installation, shell/process execution, Git/provider mutation or Source Pack materialization.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S01`;
- completed M00-M07 public contracts;
- M02 deterministic schema/versioning, explicit precedence/provenance, strict core fields and inert extensions;
- M03 project/repository identity separation from profile/content identity;
- M04 bounded discovery and explicit-input rules;
- M05 MODULE_DONE transactional desired-state/apply/rollback/idempotency contracts;
- M06 MODULE_DONE path authority, overwrite, link/reparse, staging and atomicity contracts;
- M07 MODULE_DONE template format, typed variables, conditions, rendering and desired-artifact validation;
- M07-S02 precedence `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT` and its prohibition on ambient environment as a generic binding layer;
- frozen Architecture startup-purity, deterministic-input, immutable-snapshot, library-first and state-separation rules;
- frozen Security repository-content trust limits, secret handling, process-execution policy and capability-vs-authorization rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M09 ownership of Source Pack aggregation/distribution and template-source resolution;
- M24/M25 ownership of broad evidence/proof-graph products;
- M37 ownership of global trust/integrity/authorship policy;
- M51 ownership of compatibility policy;
- M63 ownership of quantitative executor-performance thresholds.

## Ownership boundary
M08-S01 OWNS:
- the generic project-profile logical envelope;
- generic profile identity and neutral semantics;
- deterministic explicit-profile versus generic-default selection;
- immutable selected-profile snapshots;
- declarative exact template-reference intent;
- declarative typed candidates for M07 `PROFILE_BINDING`;
- profile semantic identity/digest inputs;
- compact selection/projection evidence;
- fail-closed duplicate/conflict behavior;
- bounded, cancellable, S0 read-only profile parsing/selection/projection;
- baseline rules that S02-S04 may refine but never weaken.

M08-S01 DOES NOT OWN:
- TypeScript/Node profile semantics (S02);
- Python profile semantics (S03);
- Web/App profile semantics (S04);
- inheritance, parents, overlays or merge precedence (S05);
- M07 template/variable/condition/render/validation semantics;
- template fetching/catalog/source distribution or Source Pack aggregation (M09);
- project identity (M03), repository discovery (M04), semantic transaction authority (M05), physical path authority (M06);
- process/tool execution, package installation or arbitrary module loading;
- Git/provider mutation (M29/M30+);
- global trust/integrity policy (M37), compatibility policy (M51), or quantitative performance thresholds (M63).

## Canonical logical envelope

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
}

ProfileSelectionRequest {
  mode                       // EXPLICIT_PROFILE | DEFAULT_GENERIC
  profileId?                 // required for EXPLICIT_PROFILE
  expectedProfileVersion?
  expectedProfileDigest?
}
```

The envelope is logical. Future serialization MUST preserve these semantics and MUST NOT turn profile loading into executable-module loading.

## Frozen contract

### PRF-01 — Profiles are declarative, never executable
Loading, validating, selecting or projecting a profile MUST NOT execute repository code, import arbitrary modules, resolve package entry points, run hooks, evaluate expressions or invoke shell/tools.

Executable JavaScript/TypeScript config, callbacks, functions and package lifecycle hooks are not profile semantics.

### PRF-02 — Core shape is strict and versioned
Every admitted profile MUST carry `schemaVersion`, `profileContractVersion`, `profileId`, `profileVersion` and `profileKind`.

Unknown core fields fail closed. Unknown schema/contract versions never fall back to best-effort parsing. Namespaced `extensions` MAY exist only as inert data and cannot change selection, bindings, execution, mutation or authorization.

### PRF-03 — Profile identity is separate from project identity and authority
`profileId` identifies only a profile definition. It is not M03 project/repository identity, signer/trust identity, filesystem authority or authorization.

Canonical profile IDs use:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Maximum 64 ASCII bytes; no case folding.

### PRF-04 — `generic` is the reserved product-owned baseline
The canonical generic profile ID is exactly `generic`.

Repository/local content cannot shadow or redefine the product-owned `generic` profile. A future custom-profile namespace requires an explicit owning contract.

### PRF-05 — Generic means technology-neutral
The built-in generic profile MUST NOT assume Node/TypeScript/JavaScript, Python, browser/mobile/desktop frameworks, package managers, containers/clouds, monorepo shape, CI provider, database, API style, UI stack or license.

### PRF-06 — Semantic changes require new identity/version
`profileVersion` is canonical SemVer. Output-relevant semantic change requires a new profile semantic digest and an appropriate governed version change. Version text itself is not trust or authorization.

### PRF-07 — S01 admits exactly two selection modes
- `EXPLICIT_PROFILE`;
- `DEFAULT_GENERIC`.

No `AUTO`, `LATEST`, `BEST_MATCH`, fuzzy matching or heuristic selection exists in S01.

### PRF-08 — Explicit selection is exact and fail-closed
`EXPLICIT_PROFILE` requires one canonical `profileId`. Missing, ambiguous, unsupported, malformed or stale-against-expectation profiles fail. They MUST NOT silently fall back to `generic`.

### PRF-09 — Generic default is explicit policy, not discovery
`DEFAULT_GENERIC` deterministically selects only the built-in `generic` profile. It does not inspect package files, source extensions, dependencies, Git history, directory names, README text, environment, installed tools or provider/network metadata to choose another profile.

### PRF-10 — Selection modes cannot conflict
A request cannot simultaneously be explicit and generic-default. Ambiguous dual-mode input fails closed. Explicit user/operator intent is never shadowed by the default.

### PRF-11 — Version/digest expectations are exact preconditions
A request MAY pin expected profile version and/or semantic digest. When supplied, mismatch blocks selection. This enables stale-state detection and resumable governed execution.

### PRF-12 — Selection produces an immutable snapshot
Successful selection produces an immutable invocation-scoped `SelectedProfileSnapshot` containing at least profile ID, schema/contract version, content version, semantic digest, selection mode/source class, sanitized expectation identity, selected template-binding identities and compact diagnostics.

Ambient changes cannot mutate that snapshot in place.

### PRF-13 — Profiles may reference templates but cannot fetch them
`templateBindings` may reference exact M07 template identities. S01 MUST NOT fetch templates, scan for templates, resolve registries/catalogs, install packages, choose `latest`, or infer templates by filename/extension.

M09 or another explicit owning source contract resolves admitted references later.

### PRF-14 — Template references are exact
Every template binding has exact `templateId` and exact canonical `templateVersion`. An optional `templateSemanticDigest`, when present, is an exact precondition.

SemVer ranges, wildcards, `latest`, moving tags and branch names are not deterministic profile semantics.

### PRF-15 — Binding identities are stable and duplicate-free
Every `ProfileTemplateBinding` has a stable `bindingId` under the same lowercase/hyphen grammar. Duplicate IDs fail closed. Conflicting bindings to the same exact template identity fail unless a later S05 composition contract explicitly defines otherwise.

Serialized/list order is never precedence.

### PRF-16 — Template-binding order is non-semantic
`templateBindings` are a declarative set. Their order does not imply execution, render, write or precedence order. Canonical hashing/evidence sorts by stable identity.

### PRF-17 — Profile bindings are only M07 `PROFILE_BINDING` candidates
`variableBindings` are declarative candidates that may be projected into M07's frozen `PROFILE_BINDING` layer. M08 cannot bypass M07 declaration existence, exact type, context, source-permission, sensitive-reference, unknown-binding or conflict rules.

### PRF-18 — Value types mirror M07 exactly
S01 profile values may be only:
- `STRING`;
- `BOOLEAN`;
- `INTEGER`;
- `ENUM`.

Objects, arrays, maps, functions, dates, binary blobs and arbitrary JSON are forbidden. Values retain their original type; coercion/stringification is forbidden.

### PRF-19 — M08 cannot reclassify M07 value semantics
`valueClass` is **not** a profile-owned field. `PLAIN` versus `SENSITIVE_REFERENCE` remains authority of the target M07 variable declaration.

A profile supplies only the typed value. During projection, M07 decides whether that value is admissible under the declaration's `valueClass`, contexts and allowed sources. M08 cannot mark a value safe, sensitive, secret, path-safe or executable to bypass M07 policy.

### PRF-20 — No value coercion or repair
Examples that remain invalid include string `"true"` for BOOLEAN, string `"42"` for INTEGER, integer `1` for BOOLEAN, or trimmed/case-folded ENUM guessing.

Invalid profile candidates block projection/use; they are never silently rewritten.

### PRF-21 — Unknown bindings are not ignored
Within an active template binding, a supplied variable ID that the resolved target template does not declare/admit MUST surface a typed failure before render. Typos and cross-template leakage cannot disappear silently.

### PRF-22 — Existing M07 precedence is immutable here
M08 MUST preserve:

```text
TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT
```

Profiles cannot declare values forced/locked/unoverrideable or otherwise outrank valid explicit input.

### PRF-23 — Profiles cannot create M07 declarations
Mentioning a variable in a profile does not declare it. Variable declaration/type/context/source policy remains M07 template semantics.

### PRF-24 — Ambient environment is not a binding layer
S01 MUST NOT auto-import process environment, shell variables, cwd/home state, Git user config, hostname or machine-local preferences into profile bindings. Another owning contract may resolve a non-secret value and pass it through an explicit governed source with provenance; S01 itself does not.

### PRF-25 — Secret material is forbidden profile content
Passwords, API keys, private keys, access/session tokens and similar secret material MUST NOT be intentionally stored or projected from generic profiles.

A non-secret reference value may be supplied only as ordinary typed data and only if the target M07 declaration classifies it as `SENSITIVE_REFERENCE`. M08 does not classify or dereference it. Diagnostics/evidence never echo suspected secret material.

### PRF-26 — Display metadata is inert
Human-facing display name/description data cannot affect selection, template identity, values, precedence, execution, authority or the S01 semantic digest.

### PRF-27 — Semantic identity is deterministic
`profileSemanticDigest` binds canonical output-relevant semantics including schema/contract version, profile ID/version/kind, canonical template-binding identities, exact template version/digest pins and canonical typed variable bindings.

It excludes list/order noise, whitespace, display metadata, local source paths, timestamps and machine-local provenance locations.

### PRF-28 — Runtime evidence is separate from semantic identity
Selection/projection evidence may bind profile digest, selection mode, expectation preconditions, sanitized provenance, resolved template identity and typed status/error codes. Evidence does not mutate canonical profile identity.

### PRF-29 — Source location is not authority
Built-in/catalog/future admitted source location does not by itself grant trust or mutation authority. Source provenance is separate; global trust decisions remain M37-owned.

### PRF-30 — Repository files cannot shadow `generic`
Files named `generic`, `profile.json`, `.gef/profile.*` or similar do not automatically replace the product-owned generic profile. Future repository-local discovery requires an explicit contract with bounded discovery and namespace/precedence rules.

### PRF-31 — Profiles grant no M05/M06 authority
Profiles/templates cannot grant overwrite/delete/move permission, path escape, symlink/reparse traversal, filesystem-root authority, irreversible-operation authorization or recovery bypass. M07 validates desired logical artifacts; M05/M06 separately authorize physical effects.

### PRF-32 — Profiles grant no process/tool/provider authority
Profiles cannot authorize shell commands, package installs, build/test commands, hooks, network calls, Git mutation, GitHub/provider mutation or connector/plugin actions.

### PRF-33 — No inheritance exists in S01
S01 has no parent, `extends`, mixin, overlay, deep-merge, last-write-wins or multiple-inheritance behavior. Such core fields are invalid until S05 defines a versioned composition contract.

### PRF-34 — Specialized profiles may refine, not weaken
S02-S04 may add technology-specific template/binding content, but may not weaken strict parsing, non-executable data, exact selection, explicit-over-default behavior, M07 validation, no-secret-material rules, M05/M06 authority boundaries, no ambient fallback, immutable snapshots or deterministic digests.

### PRF-35 — Profile evaluation is S0 read-only
Parsing, validation, selection, hashing and projection MUST NOT write files, create transaction staging/recovery state, mutate Git/provider state, install packages, invoke tools/processes, change cwd/environment or fetch remote data.

### PRF-36 — Work is bounded and cancellable
Future implementation MUST bound profile bytes, extension bytes, template-binding count, variable-binding count, identifier lengths, scalar bytes, diagnostics/evidence and canonicalization/hash work. Cancellation/budget exhaustion returns typed non-success, never partial acceptance.

### PRF-37 — Duplicates/conflicts fail before host-object collapse
Duplicate semantic keys/IDs/bindings must be detected before last-write-wins behavior can hide them. Prototype-pollution-sensitive structures must be rejected or represented with prototype-safe data structures.

### PRF-38 — Generic semantics are cross-host deterministic
Generic behavior MUST NOT depend on path separators, locale, timezone, clock, random values, username/home, host newline defaults or filesystem case behavior. Identical admitted inputs and exact template snapshots produce identical profile selection/projection semantics on supported hosts.

### PRF-39 — Typed result vocabulary
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

Success/non-success states should include `PROFILE_SELECTED`, `PROFILE_PROJECTED`, `PROFILE_BLOCKED` and `PROFILE_INDETERMINATE`. Empty/null/throw-only behavior cannot mean implicit successful fallback.

### PRF-40 — Startup purity is mandatory
Importing the future project-profiles package MUST NOT scan repositories, mutate files, make network requests, harvest environment state, access Git/providers, discover packages or execute processes. Operations begin only through explicit APIs with explicit inputs/ports.

## Generic minimum semantics
The product-owned `generic` profile MUST:
- use `profileId = generic`;
- carry active S01 schema/contract versions and governed `profileVersion`;
- use `profileKind = GENERIC`;
- remain technology-neutral;
- contain only explicitly governed template references/bindings admitted by the release, if any;
- contain no ambient-derived bindings, inheritance fields or secret material;
- grant no execution or mutation authority.

An empty `templateBindings` set is valid at S01 contract level. Whether production release must ship useful generic template bindings is decided by complete M08/M09/DoD integration, not by inventing placeholder references here.

## Deterministic selection/projection algorithm
1. Validate request shape/mode.
2. `EXPLICIT_PROFILE`: resolve only the exact requested admitted profile identity.
3. `DEFAULT_GENERIC`: resolve only product-owned `generic`.
4. Strictly validate schema/contract/ID/version/kind and duplicate-free structure.
5. Compute/verify canonical `profileSemanticDigest`.
6. Enforce supplied expected version/digest preconditions.
7. Produce immutable selected-profile snapshot.
8. For an exact supplied M07 template snapshot, project only that binding's typed candidates as M07 `PROFILE_BINDING` candidates.
9. Let M07 independently enforce declarations, types, value classification, contexts, source policy, resolution/render/validation.
10. Emit compact bounded selection/projection evidence.

No step auto-discovers a specialized profile or authorizes effects.

## Proof obligations for implementation
The later M08 Work Order must prove at minimum:
1. `DEFAULT_GENERIC` selects only product-owned generic.
2. Missing explicit profiles never fall back to generic.
3. Version/digest expectation mismatch fails closed.
4. Repository shadow attempts cannot replace generic.
5. Duplicate keys/IDs/bindings fail before last-write-wins collapse.
6. Unknown schema/contract/kind fails closed.
7. Template refs reject floating/range/latest semantics.
8. Profile values preserve M07 scalar types without coercion.
9. M08 cannot set/override M07 `valueClass`.
10. Profile binding remains below explicit input in M07 precedence.
11. Unknown/disallowed/type-invalid M07 bindings fail visibly.
12. Secret material is rejected/redacted safely.
13. Import/startup performs zero ambient discovery/effects.
14. Selection/projection performs no filesystem/Git/provider/process/network mutation.
15. Cancellation and finite budgets are enforced.
16. Digest is independent of set serialization order/display metadata.
17. Identical admitted inputs yield identical semantic identity across supported hosts.
18. Stale snapshots are detectable through pinned semantic identity.
19. Specialized profiles cannot bypass M07/M05/M06 boundaries through S01 APIs.

## Review checklist
- [x] Next legal stage matches canonical checkpoint.
- [x] Generic profile is strict, deterministic, technology-neutral and non-executable.
- [x] Explicit/default selection is unambiguous with no heuristic fallback.
- [x] Profile identity is separate from project identity/authorization.
- [x] Template references are exact and non-fetching.
- [x] M07 type, `valueClass`, source and precedence authority remains M07-owned.
- [x] Secret material is not admitted.
- [x] M05/M06 authority boundaries are preserved.
- [x] S02-S04 specialization and S05 inheritance remain deferred.
- [x] S0 read-only/startup purity/cancellation/resource bounds are explicit.
- [x] Future proof obligations are executable and auditable.

## Session completion rule
S01 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL architecture, security, determinism or ownership-boundary defect.

S01 earns **no M08 production credit**. After a separate checkpoint promotion, the only next legal planning stage is:

`GBS-M08-S02 — TypeScript and Node`

No M08 Work Order may be compiled until S01-S05 are frozen and the separate M08 Module Gate returns implementation-ready.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
