# GBS-M07-S02 — Variables

Status: `FROZEN`

## Purpose
Freeze the deterministic, typed and non-executable variable contract for `GBS-M07 — Template Engine`. S02 defines how template variables are declared, which scalar value classes are admitted, how values are supplied and selected with provenance, how variable markers resolve without recursive interpretation, how missing/unknown/conflicting bindings fail, and how target-path and secret/reference boundaries remain safe.

S02 consumes the frozen S01 format. It does **not** evaluate conditional branches, materialize rendered files, validate the complete rendered template or perform writes. Those responsibilities remain with S03-S05 and M05/M06.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M07_S02`;
- frozen M07-S01 Template Format, including `template.json`, `{{gef:var <identifier>}}`, targetPattern rules and S0 read-only loading;
- M02 explicit precedence/provenance and “secrets are references, not values” principles;
- M03 project/repository identity separation from template/value identity;
- M04 bounded discovery and explicit-input rules;
- M05 MODULE_DONE transaction, Dry Run and exact desired-state semantics;
- M06 MODULE_DONE path authority and physical safety contracts;
- frozen Architecture deterministic-input, immutable-snapshot, startup-purity and canonical/derived/operational-state separation;
- frozen Security secret handling, environment/process policy, repository-content trust limits and capability-vs-authorization rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M08 ownership of project-profile selection/default binding;
- M09 ownership of Source Pack aggregation rather than variable semantics;
- M24/M25 ownership of broad evidence/proof-graph products;
- M37 ownership of global integrity/trust/authorship policy;
- M51 ownership of supported runtime/platform compatibility policy;
- M63 ownership of quantitative executor-performance thresholds.

## Ownership boundary
M07-S02 OWNS:
- versioned variable declarations added to the S01 manifest envelope;
- variable identifier grammar;
- admitted scalar types and exact type validation;
- required/default semantics;
- allowed binding-source vocabulary and precedence;
- provenance-preserving resolution;
- variable usage-context declarations and enforcement;
- non-recursive/single-pass value semantics;
- missing, unknown, duplicate and conflicting binding behavior;
- target-path variable value safety;
- non-secret sensitive-reference classification and redaction rules;
- compact value/resolution identity for later rendering/evidence;
- bounded/cancellable read-only variable resolution.

M07-S02 DOES NOT OWN:
- conditional truth/branch semantics (M07-S03);
- final byte rendering, line-ending transformation or output materialization (M07-S04);
- full rendered-template validation, cross-entry target collision or final logical target validation (M07-S05);
- project profile content/selection (M08);
- Source Pack distribution/aggregation (M09);
- secret acquisition, secret-store integration or credential materialization;
- semantic transaction apply/rollback/idempotency (M05);
- physical path authority, symlink/reparse safety or atomic writes (M06);
- shell/process/tool execution (M01/Security and the owning future operation);
- Git/provider mutation (M29/M30+);
- global trust/integrity policy (M37);
- compatibility-matrix policy (M51);
- quantitative latency/resource thresholds (M63).

## Manifest extension frozen by S02
S02 adds one versioned top-level field to the S01 manifest envelope:

```text
TemplateBundleManifest {
  ...S01 fields...
  variables[]?
}

TemplateVariableDeclaration {
  variableId
  type
  required
  default?
  enumValues?            // ENUM only
  allowedContexts[]
  allowedBindingSources[]?
  valueClass?
}
```

`variables` is declarative and order-independent. Canonical semantic processing orders declarations by `variableId`; JSON array position never becomes precedence or execution order.

An absent `variables` field is equivalent to an empty declaration set. A marker that references an undeclared variable still fails closed.

## Frozen Variables contract

### VAR-01 — Every variable is explicitly declared
Every identifier referenced by `{{gef:var ...}}`, by a targetPattern variable marker, or by a later S03 condition must correspond to exactly one admitted S02 declaration.

There is no implicit variable creation from environment names, project keys, Git metadata, profile fields, file names or marker spelling.

Duplicate declarations after canonical identifier comparison fail closed.

### VAR-02 — Identifier grammar is strict, lowercase and dotted
`variableId` uses this canonical grammar:

```text
^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$
```

Additional rules:
- total identifier length is at most 128 ASCII bytes;
- each dotted segment is at most 32 bytes;
- empty segments are forbidden;
- case folding is not performed;
- first segment `gef` is reserved for future product-owned variables and is rejected for ordinary template declarations;
- whitespace, hyphens, underscores, brackets, quotes, slashes, backslashes, colons, operators and shell sigils are not part of the grammar.

This keeps marker references data-only and avoids expression-language ambiguity.

### VAR-03 — S02 admits four scalar types
The frozen variable types are:
- `STRING`;
- `BOOLEAN`;
- `INTEGER`;
- `ENUM`.

Objects, arrays, maps, executable callbacks, functions, dates with host-local interpretation, binary blobs and arbitrary JSON values are not S02 variable values.

A future new type requires a versioned/gated contract change.

### VAR-04 — Type validation is exact; coercion is forbidden
Bindings/defaults must already have the declared type.

Examples of forbidden coercion:
- string `"true"` is not BOOLEAN `true`;
- string `"42"` is not INTEGER `42`;
- integer `1` is not BOOLEAN `true`;
- floating-point `42.0` is not accepted merely because it prints like an integer;
- enum comparison is not case-folded or trimmed.

Resolution never guesses intent from textual resemblance.

### VAR-05 — STRING values are deterministic text data
A STRING value must be a valid Unicode scalar sequence encodable as UTF-8 and must not contain NUL.

S02 does not trim, case-normalize, Unicode-normalize, expand escapes from another language, substitute environment syntax or reinterpret line endings. The exact admitted string is the logical value.

When the same value is used in a target path, the stricter path-context rules below apply in addition.

### VAR-06 — BOOLEAN values are exact booleans
BOOLEAN accepts only typed `true` or `false`.

S02 exposes the typed boolean to S03/S04. It does not define S03 conditional truth behavior beyond preserving the exact boolean type and refusing string/numeric truthiness coercion.

### VAR-07 — INTEGER values are safe exact integers
INTEGER accepts only finite JSON/TypeScript-safe integers in the inclusive range `-(2^53-1)` through `2^53-1`.

NaN, Infinity, negative zero as a distinct semantic value, fractions and out-of-range integers are invalid.

Its canonical textual projection for later rendering is base-10 with no leading plus and no unnecessary leading zeroes; S04 owns insertion into output bytes.

### VAR-08 — ENUM values are exact declared strings
An ENUM declaration MUST provide a non-empty, bounded, duplicate-free `enumValues` set of valid STRING values.

Ordering of `enumValues` is non-semantic. The selected binding/default must exactly equal one declared member.

ENUM is a validation constraint, not authorization and not a switch for executable behavior.

### VAR-09 — Required/default semantics are explicit
Each declaration has `required: true|false`.

A `default` value, when present:
- must satisfy the declared type and all declaration constraints;
- is output-relevant template semantics;
- is the lowest-precedence value source;
- cannot depend on another variable;
- cannot call environment, clock, random, Git, filesystem, provider or network state;
- is treated as literal data even when its string contains `{{gef:` or other marker-looking text.

`required: true` means resolution must produce an effective value from an admitted source, including a valid template default.

`required: false` with no effective value produces `UNBOUND_OPTIONAL`, not implicit empty-string substitution.

### VAR-10 — Unbound optional is first-class and never silently rendered empty
`UNBOUND_OPTIONAL` is a legitimate S02 resolution state.

However:
- a `var` marker in text cannot render an unbound value;
- a targetPattern marker cannot render an unbound value;
- S04 must block rather than silently substitute empty text;
- S03 owns whether a condition referencing an unbound optional variable is admissible and what explicit condition result, if any, follows.

This prevents missing configuration from disappearing into ambiguous output.

### VAR-11 — Binding-source vocabulary is closed
The frozen runtime binding sources, from lower to higher precedence, are:

```text
TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT
```

`TEMPLATE_DEFAULT` exists only when the declaration carries `default`.

`PROFILE_BINDING` is an injected M08-owned profile result. S02 does not discover profiles itself.

`EXPLICIT_INPUT` is an invocation-scoped binding supplied through the governed application API.

No other source participates unless a later contract version explicitly adds it.

### VAR-12 — Environment is never a generic variable layer
Process environment variables, cwd, home-directory state, shell variables and ambient process globals are not automatic template binding sources.

If a future owning contract needs an environment-derived non-secret input, it must resolve/validate that input explicitly before handing a typed `EXPLICIT_INPUT` or profile binding to S02 with provenance.

M07 never performs `${VAR}`, `%VAR%`, `$env:VAR`, tilde or shell-style expansion by implication.

### VAR-13 — Allowed binding sources can only narrow, not invent authority
A declaration may specify `allowedBindingSources` as a subset of:
- `PROFILE_BINDING`;
- `EXPLICIT_INPUT`.

Omission means both are allowed. Template default is governed separately by the presence of `default`.

A higher-precedence candidate from a disallowed source blocks that candidate; S02 never silently accepts it because it “looks safe”.

Binding-source permission does not grant filesystem, process, provider or security authorization.

### VAR-14 — Precedence is deterministic and provenance-preserving
For every variable, S02 selects the highest-precedence admitted binding source with an effective value.

The compact resolution result retains at least:
- variable ID/type;
- resolution status;
- selected source class;
- sanitized source reference/provenance identifier;
- declaration contract/version identity;
- value digest or bounded structural summary;
- shadowed source classes, if relevant, without copying their raw values.

Resolution provenance is evidence, not canonical project truth.

### VAR-15 — Duplicate same-layer bindings are conflicts
Two distinct candidates for the same variable at the same precedence layer are ambiguous and fail closed unless the owning source contract has already deterministically collapsed them before S02.

S02 does not use last-write-wins based on JSON/object order, file order, profile order or request order.

### VAR-16 — Unknown supplied bindings fail closed
A PROFILE_BINDING or EXPLICIT_INPUT key that is not declared by the target template is rejected for that template resolution request by default.

This catches typos and accidental cross-template context leakage. M08/M09 may filter a broader upstream context into an exact declared binding set before invoking S02; S02 itself does not silently ignore unknown keys.

### VAR-17 — Variable usage contexts are explicit
Each declaration carries non-empty `allowedContexts` selected from:
- `TEXT_CONTENT`;
- `TARGET_PATH_SEGMENT`;
- `CONDITION_REFERENCE`.

S02 builds/consumes a compact usage index from the frozen S01 marker scan and targetPattern markers.

Use of a variable in a context not admitted by its declaration fails closed.

`CONDITION_REFERENCE` only permits S03 to inspect the typed resolution result; it does not define S03 truth semantics.

### VAR-18 — Target-path use requires explicit opt-in
A variable appearing in `targetPattern` MUST explicitly allow `TARGET_PATH_SEGMENT`.

Path use is never inferred merely because a STRING happens to contain path-like text.

A variable may be used in both TEXT_CONTENT and TARGET_PATH_SEGMENT only when both contexts are explicitly declared.

### VAR-19 — Path-context values must satisfy the portable segment predicate
Before a resolved variable value may participate in a targetPattern, S02 converts its scalar value to the canonical textual projection and validates it as a **single portable path-segment value**.

The value MUST:
- be non-empty;
- be valid UTF-8/Unicode scalar text;
- be Unicode NFC;
- contain no NUL or control characters;
- contain no `/` or `\\`;
- contain no colon;
- not equal `.` or `..`;
- not end in dot or space;
- not begin or end with whitespace;
- not match a Windows reserved device alias such as `CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9` or `LPT1`-`LPT9` under case-insensitive comparison.

S02 does not percent-encode, sanitize, truncate or rewrite an unsafe value into a “safe-looking” one. It fails closed.

### VAR-20 — Full resolved target validation still belongs to S05/M06
S02's segment predicate is necessary but insufficient.

After all variable substitutions, S05 must validate the complete logical target for traversal, empty/colliding components and cross-entry conflicts, and M06 must separately authorize the physical target under the actual platform/root/path contract.

A marker embedded inside a larger path component can therefore pass S02 while the final combined component still fails S05/M06.

### VAR-21 — Sensitive reference is a value classification, not secret material
`valueClass` defaults to `PLAIN` and may be set to `SENSITIVE_REFERENCE`.

`SENSITIVE_REFERENCE` means the effective STRING/ENUM value is a **non-secret opaque reference identifier** to externally owned sensitive material or capability. M07 does not dereference it.

Rules:
- the reference itself is not authorization;
- the reference cannot be used in TARGET_PATH_SEGMENT;
- standard evidence/receipts redact or digest the raw reference by default;
- M07 does not contact environment/keychain/provider/connector to resolve it;
- a template may render the literal reference identifier in TEXT_CONTENT only when that usage context is explicitly allowed.

### VAR-22 — Secret material is not an admitted M07 variable value
Actual passwords, API keys, private keys, access tokens, session tokens and other secret material are outside the current M07 variable contract.

M07 MUST NOT intentionally acquire, persist, log, hash-for-evidence, cache or render secret material through ordinary variable bindings.

If a binding source marks a candidate as secret material, resolution blocks with a typed security gap. High-confidence probable-secret detection likewise creates a blocking security finding without echoing the value. Any future secret-materialization feature requires a separately owned and reviewed contract.

### VAR-23 — Secret/reference provenance never echoes sensitive material
Diagnostics and compact resolution evidence for sensitive references expose only bounded metadata such as variable ID, source class, reference category and opaque digest/reference fingerprint as policy permits.

They never copy resolved secret material and do not need to copy a sensitive reference's raw identifier to prove which declaration/source class was used.

### VAR-24 — Resolution is single-pass and non-recursive
A variable's effective value is data. It is never re-lexed as template syntax after selection.

If a STRING/default contains:
- `{{gef:var other}}`;
- `{{gef:if x}}`;
- shell syntax;
- environment syntax;
- JSON/YAML fragments;
- code-like text;

those bytes remain literal value data for S04 insertion. They cannot create new M07 markers, dependencies, conditions or execution.

Variable-to-variable interpolation/computed variables are not admitted by S02.

### VAR-25 — No language-guessing escape engine
S02 does not infer JSON/YAML/TOML/shell/JavaScript/SQL/HTML escaping from file extension or surrounding text.

For `TEXT_CONTENT`, S02 provides the exact typed scalar plus its canonical textual projection. S04 may insert that projection literally under the frozen rendering contract, but inserted value bytes are never re-tokenized as M07 syntax.

For `TARGET_PATH_SEGMENT`, safety is validation-based under VAR-19, not escaping or rewriting.

Generating content that another system later executes does not grant execution authority; that later execution remains behind its own Security/M01 capability gate.

### VAR-26 — Canonical textual projection is deterministic
For later S04 rendering:
- STRING projects to its exact admitted text;
- BOOLEAN projects to lowercase `true` or `false`;
- INTEGER projects to canonical base-10 form from VAR-07;
- ENUM projects to its exact selected member text.

No host locale, locale-specific digits, newline default, timezone or formatting preference participates.

S02 computes/provides the projection logically but performs no file rendering.

### VAR-27 — Variable declarations enter template semantic identity
The output-relevant declaration semantics frozen by S02 participate in `templateSemanticDigest`, including at least:
- variable ID;
- type;
- required/default semantics;
- enum member set;
- allowed contexts;
- allowed binding-source policy;
- value class.

Changing these semantics requires a new semantic digest and, under S01 FMT-04, an appropriate template-version change for governed release/promotion.

Runtime binding values do **not** mutate the template's semantic identity.

### VAR-28 — Runtime values get separate compact identities
S02 maintains two conceptual runtime identities:

1. `variableValueDigest`
   - binds the template semantic identity plus canonical effective typed values/statuses needed to determine output;
   - independent of incidental input ordering and machine-local source paths;
   - used for render/cache stale binding.

2. `variableResolutionDigest`
   - binds `variableValueDigest` plus selected source classes, sanitized provenance identifiers and the active resolution-contract/policy version;
   - used for compact evidence/audit correlation.

Raw large values and sensitive references need not appear in receipts merely because they participate in the internal digest input. Secret material is not admitted at all under VAR-22.

### VAR-29 — Same output value may have different resolution evidence
Two invocations resolving the same effective typed values from different admitted sources may share the same `variableValueDigest` while having different `variableResolutionDigest` values.

This separates output/cache identity from provenance/evidence identity.

### VAR-30 — Resolution result is immutable for one invocation
A successful S02 resolution produces an immutable invocation-scoped snapshot.

Ambient profile/config/environment changes do not silently rewrite it mid-render. A later explicit invocation/re-resolution creates a new snapshot and new dependency/evidence identity.

S04/S05 must reject a snapshot whose bound template semantic identity or declared external dependency identity is stale when their operation requires freshness.

### VAR-31 — Variable resolution is S0 read-only
S02 declaration validation, binding selection, type checking, path-context validation, provenance synthesis and digest computation are S0 read-only.

They MUST NOT:
- write project/template files;
- create staging/recovery state;
- mutate Git/provider state;
- load arbitrary executable modules;
- install packages;
- invoke shell/tools;
- change cwd/environment;
- fetch remote data to “complete” a missing variable.

### VAR-32 — Resolution work is bounded and cancellable
S02 consumes the finite S01 loader budget and adds bounded limits for at least:
- variable declaration count;
- identifier bytes/segments;
- enum member count and aggregate enum bytes;
- candidate binding count;
- scalar value bytes;
- usage references;
- compact diagnostics/provenance entries.

No unlimited production mode is admitted. Budget exhaustion is a typed block, not partial acceptance.

Cancellation/deadline is propagated through any future external binding/profile access performed by its owning port before/around S02. S02 itself creates no target effect.

### VAR-33 — Error vocabulary is typed and value-safe
Future implementation errors should distinguish at least:
- `VARIABLE_DECLARATION_INVALID`;
- `VARIABLE_DUPLICATE`;
- `VARIABLE_UNDECLARED_REFERENCE`;
- `VARIABLE_UNKNOWN_BINDING`;
- `VARIABLE_SOURCE_NOT_ALLOWED`;
- `VARIABLE_BINDING_CONFLICT`;
- `VARIABLE_MISSING_REQUIRED`;
- `VARIABLE_UNBOUND_FOR_RENDER`;
- `VARIABLE_TYPE_MISMATCH`;
- `VARIABLE_ENUM_MISMATCH`;
- `VARIABLE_CONTEXT_NOT_ALLOWED`;
- `VARIABLE_PATH_UNSAFE`;
- `VARIABLE_SECRET_MATERIAL_FORBIDDEN`;
- `VARIABLE_BUDGET_EXCEEDED`;
- `VARIABLE_CANCELLED_OR_TIMED_OUT`.

Diagnostics identify variable/source/category and bounded location information without echoing raw sensitive values.

### VAR-34 — Brownfield and startup purity remain mandatory
Resolving variables for a template in an existing project does not authorize scanning `.env`, package manifests, CI files, shell profiles, parent directories or neighboring configs for matching names.

Package import/parser construction performs no variable discovery, environment read, network access or filesystem mutation. All binding inputs are explicit.

### VAR-35 — Variable success cannot bypass later gates
A complete S02 resolution proves only that declared variables have an admissible typed resolution snapshot under this contract.

It does not prove:
- conditions are valid or selected (S03);
- final rendering is correct (S04);
- complete logical targets are collision-free/safe (S05);
- desired outputs may overwrite existing files (M05/M06);
- physical target paths are authorized (M06);
- generated content is safe to execute;
- any provider/tool/Git action is authorized;
- template/source/value provenance is trusted/authored by a particular party (M37).

## Canonical S02 logical result
A future implementation should conceptually produce a compact immutable result equivalent to:

```text
VariableResolutionSnapshot {
  templateSemanticDigest
  declarationContractVersion
  variables[] {
    variableId
    type
    usageContexts[]
    status                // RESOLVED | UNBOUND_OPTIONAL
    selectedSource?
    sanitizedProvenance?
    valueClass
    valueDigest?
    canonicalValue?       // internal render input, omitted/redacted from normal evidence as required
  }
  variableValueDigest
  variableResolutionDigest
  dependencyRefs[]
  warningsOrGaps[]
}
```

This is a logical contract, not a requirement to persist raw values or expose these exact TypeScript names before the M07 implementation Work Order selects API/package placement.

## Deterministic resolution lifecycle

```text
BIND FROZEN S01 TEMPLATE DESCRIPTOR
→ VALIDATE VARIABLE DECLARATIONS
→ BUILD EXACT MARKER/CONTEXT USAGE INDEX
→ VALIDATE PROVIDED BINDING KEYS/SOURCE CLASSES
→ GROUP CANDIDATES BY VARIABLE + PRECEDENCE
→ FAIL ON SAME-LAYER AMBIGUITY
→ SELECT HIGHEST ADMITTED SOURCE
→ VALIDATE TYPE / ENUM / VALUE CLASS
→ CLASSIFY RESOLVED OR UNBOUND_OPTIONAL
→ VALIDATE USAGE CONTEXTS
→ VALIDATE TARGET-PATH SEGMENT VALUES
→ BUILD SANITIZED PROVENANCE
→ COMPUTE VALUE + RESOLUTION DIGESTS
→ EMIT IMMUTABLE SNAPSHOT / TYPED BLOCK
```

No phase writes output files or evaluates conditional branches.

## Required future proof families
Any admitted M07 implementation Work Order must eventually prove at least:
1. no-variable template resolves deterministically;
2. valid STRING/BOOLEAN/INTEGER/ENUM declarations;
3. invalid variable ID, length and reserved `gef` prefix rejection;
4. duplicate declaration rejection independent of array order;
5. exact type validation with no string/number/boolean coercion;
6. safe-integer boundaries and fractional/out-of-range rejection;
7. ENUM duplicate/member/order semantics;
8. valid required variable from template default;
9. missing required variable blocks;
10. optional unbound remains first-class and does not become empty string;
11. precedence `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT`;
12. same-layer duplicate candidate conflict;
13. disallowed binding source block;
14. unknown supplied binding block;
15. environment/cwd/home not consulted implicitly;
16. provenance retained without copying shadowed values;
17. context-not-allowed block;
18. target-path use requires explicit context opt-in;
19. target-path separator/traversal/colon/control/trailing-dot-space rejection;
20. Windows reserved device alias rejection independent of host OS;
21. unsafe path values fail rather than being sanitized;
22. S02 success still requires S05/M06 full target checks;
23. PLAIN value resolution;
24. non-secret SENSITIVE_REFERENCE handling/redaction;
25. SENSITIVE_REFERENCE rejected in target path;
26. actual secret-material binding blocks without echoing value;
27. variable values containing `{{gef:...}}` are never recursively interpreted;
28. variable values containing shell/env/code syntax remain literal data;
29. no computed/default dependency on another variable;
30. deterministic canonical projections for boolean/integer/enum/string;
31. declaration changes alter template semantic digest;
32. runtime value change alters variableValueDigest but not templateSemanticDigest;
33. same effective values with different provenance separate value vs resolution digests;
34. binding/input ordering does not alter deterministic results;
35. immutable snapshot is not silently rewritten after ambient changes;
36. bounded declarations/enums/values/usages enforced;
37. cancellation/deadline yields no target effect;
38. diagnostics exclude secret/sensitive raw values;
39. brownfield `.env`/neighbor files are neither scanned nor modified;
40. package import/startup performs no variable discovery/network/process/filesystem mutation;
41. same portable inputs resolve equivalently on Windows/Linux/macOS fixtures;
42. S02 cannot bypass S03-S05, M05 or M06.

## Frozen decisions
1. all variables are explicitly declared;
2. variable IDs are lowercase bounded dotted ASCII identifiers;
3. S02 supports only STRING, BOOLEAN, INTEGER and ENUM scalars;
4. no implicit type coercion exists;
5. defaults are static literal semantics and cannot depend on ambient state/other variables;
6. optional absence is explicit `UNBOUND_OPTIONAL`, never implicit empty string;
7. runtime precedence is `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT`;
8. environment is not a generic binding layer;
9. unknown and same-layer ambiguous bindings fail closed;
10. usage contexts are explicit;
11. target-path use requires portable single-segment validation and later S05/M06 validation;
12. M07 never sanitizes an unsafe path value into a different value;
13. `SENSITIVE_REFERENCE` is non-secret reference metadata/data and never path authority;
14. actual secret material is outside current M07 variable rendering;
15. variable resolution is single-pass/non-recursive;
16. no destination-language escape engine is inferred by filename/context;
17. typed canonical scalar projection is deterministic;
18. variable declaration semantics extend templateSemanticDigest;
19. runtime values/provenance use separate value/resolution digests;
20. S02 is S0 read-only, bounded and cancellable;
21. S02 success is necessary but insufficient for rendering/apply.

## Token/time contract
Future implementation should minimize hot-path work:
- consume the compact frozen S01 descriptor rather than rereading template source bodies;
- build one variable declaration map and one usage index;
- sort declarations/keys once for canonical hashing;
- validate each effective scalar once;
- do not reread environment/project files to “discover” bindings;
- carry typed compact provenance instead of raw source documents;
- hash effective values while already available rather than serializing large duplicate evidence;
- reuse a resolution snapshot only while template semantic identity and explicit dependency identities remain current.

M63 later owns measured latency/token/resource thresholds; S02 freezes the structural requirement to avoid hidden discovery, duplicate parsing and recursive expansion.

## Session handoff
S02 freezes declarations, typing, precedence/provenance, scalar resolution, path-context variable safety and secret/reference boundaries.

The next legal planning session is `GBS-M07-S03 — Conditional Templates`. It must define condition truth semantics, branch structure/evaluation, nesting, dependency/short-circuit behavior and deterministic condition evidence while consuming S02 typed resolution snapshots. It may not introduce arbitrary expressions, function calls, loops or execution.

No M07 implementation or production credit is admitted by this planning session.

STOP CONDITION: `M07_S02_VARIABLES_FROZEN`.
