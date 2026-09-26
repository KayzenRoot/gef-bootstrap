# GBS-M07-S01 — Template Format

Status: `FROZEN`

## Purpose
Freeze the deterministic, portable and non-executable source-format contract for `GBS-M07 — Template Engine`. S01 defines what a GEF template bundle is, how its manifest and referenced content are represented, how a template source is identified, what lexical marker namespace is reserved for later M07 sessions, and which constructs are categorically forbidden because they would create hidden code execution, path authority or side effects.

S01 is deliberately format-only. It does **not** resolve variables, evaluate conditions, render output, write files or validate final rendered targets. Those responsibilities remain with S02-S05 and, for physical effects, M05/M06.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M07_S01`;
- M02 deterministic schema/versioning, strict core fields and inert-extension principles;
- M03 project/repository identity separation from content identity;
- M04 bounded discovery and smallest-sufficient-read principles;
- M05 MODULE_DONE semantic transaction, Dry Run, recovery and idempotency contracts;
- M06 MODULE_DONE path authority, overwrite, link/reparse, staging and atomicity contracts;
- frozen Architecture library-first/deterministic-input/startup-purity/state-separation rules;
- frozen Security process-execution, repository-content, secret/evidence and capability-vs-authorization rules;
- frozen Requirements, Scope, Definition of Done and Test & Benchmark Plan;
- M08 ownership of project profiles and profile-driven selection;
- M09 ownership of Source Pack aggregation/distribution rather than template-language semantics;
- M24/M25 ownership of broad evidence/proof-graph products;
- M37 ownership of global trust/integrity policy;
- M51 ownership of supported platform/runtime compatibility policy;
- M63 ownership of quantitative executor-performance thresholds.

## Ownership boundary
M07-S01 OWNS:
- the versioned template-bundle envelope;
- the canonical manifest filename and logical bundle layout;
- template identity/version syntax;
- entry identity and entry-kind vocabulary;
- bundle-relative source references;
- portable logical target-pattern representation;
- deterministic text/binary source representation rules;
- the reserved inline marker namespace and lexical marker classes;
- deterministic source-bundle and semantic-template identity inputs;
- bounded parsing/loading requirements;
- explicit prohibition of executable/template-hook constructs;
- source-format portability and startup/read-only behavior.

M07-S01 DOES NOT OWN:
- variable declaration, typing, defaults, provenance, escaping or resolution (M07-S02);
- conditional truth model, branch evaluation or condition dependencies (M07-S03);
- final rendering, output materialization or rendered-output digest semantics (M07-S04);
- cross-entry/full-template validation and rendered target conflict validation (M07-S05);
- project/profile selection or defaults (M08);
- Source Pack aggregation, fetching or distribution (M09);
- semantic transaction planning/apply/rollback/idempotency (M05);
- physical path authority, link safety or atomic writes (M06);
- shell/process/tool execution (M01/Security and owning later operation);
- Git mutation (M29) or provider mutation (M30+);
- global integrity/trust/authorship policy (M37);
- compatibility-matrix policy (M51);
- quantitative performance thresholds (M63).

## Canonical template bundle

A template is represented as a **directory-style logical bundle**, not as an executable package and not as a canonical archive format.

The canonical logical layout is:

```text
<template-root>/
  template.json
  content/
    ... exact source files referenced by template.json ...
  ... unreferenced documentation/auxiliary files may exist but are not template inputs ...
```

Only `template.json` plus the exact `content/**` sources referenced by admitted entries participate in the template source model. The loader MUST NOT recursively ingest the whole bundle merely because files are present.

### Frozen manifest envelope

Conceptually:

```text
TemplateBundleManifest {
  schemaVersion
  templateContractVersion
  templateId
  templateVersion
  metadata?
  entries[]
  extensions?
}

TemplateEntry {
  entryId
  kind
  sourceRef
  targetPattern
  textPolicy?      // TEXT only
}
```

Later M07 sessions may add versioned fields owned by those sessions, but they may not reinterpret the frozen S01 fields incompatibly under the same contract version.

## Frozen Template Format contract

### FMT-01 — `template.json` is the sole canonical manifest
The canonical manifest filename is exactly `template.json` at the admitted logical template root.

The manifest is strict UTF-8 JSON. YAML, JavaScript, TypeScript, TOML, executable config modules, package scripts and host-language object loaders are not canonical M07 template formats.

Parsing a template manifest MUST NOT execute repository code, resolve package entry points, invoke hooks or import arbitrary modules.

### FMT-02 — Core manifest shape is strict and versioned
The manifest MUST carry:
- `schemaVersion`: positive integer schema discriminator;
- `templateContractVersion`: canonical bounded contract-version string;
- `templateId`: stable template identifier;
- `templateVersion`: canonical template-content version;
- `entries`: bounded list of template entries.

Unknown core fields fail closed under the active contract version. Version compatibility is explicit; an unrecognized version never falls back to “best effort” parsing.

A dedicated top-level `extensions` object MAY carry namespaced extension data. Unregistered extensions are inert: they cannot alter output, authority, execution, target selection or authorization merely by being present.

### FMT-03 — Template identity is content identity, not project authority
`templateId` identifies the template definition. It MUST NOT be treated as project identity, repository identity, filesystem authority, signer identity or authorization.

`templateId` uses a bounded ASCII identifier grammar suitable for stable machine references. Case-folding ambiguity is forbidden; canonical IDs are lowercase.

A template copied into another repository remains the same template content identity unless its semantic template definition changes. Project binding remains M03/M08/M09-owned.

### FMT-04 — Template version is explicit and immutable for a semantic revision
`templateVersion` is a canonical SemVer value without host-local metadata. Changing output-relevant template semantics while retaining the same content version is invalid for governed release/promotion.

The version is descriptive compatibility/content metadata, not authorization and not proof of trust.

### FMT-05 — Entries are declarative desired-output sources, never ordered commands
Each entry describes a potential output artifact. Entries are not commands, hooks or a procedural execution list.

Every entry has a unique, stable `entryId`. Entry order in JSON MUST NOT create semantic execution order. Canonical processing orders entries deterministically by stable identity where an order is needed for hashing/evidence.

Dependencies or imperative “run this after that” constructs are outside S01 and MUST NOT be encoded as hidden entry-order semantics.

### FMT-06 — S01 admits only two source entry kinds
The frozen entry kinds are:
- `TEXT_TEMPLATE`: UTF-8 text eligible for the safe M07 marker grammar;
- `BINARY_COPY`: exact byte-for-byte source payload with no inline interpolation.

S01 does not admit executable-entry, script, command, symlink, junction, device, FIFO, socket, permission mutation or arbitrary filesystem-operation entry kinds.

A later addition of a new entry kind requires an explicit versioned/gated contract change; it cannot be inferred from filename extensions.

### FMT-07 — Source references are logical, bundle-relative and bounded
`sourceRef` is a portable logical path under the bundle's `content/` namespace.

It MUST:
- be relative;
- use `/` as the logical separator on every platform;
- be Unicode NFC if non-ASCII characters are present;
- contain no NUL;
- contain no `.` or `..` traversal component;
- contain no empty component;
- contain no backslash-based alternate path grammar;
- contain no drive, UNC, URI or device namespace;
- remain under `content/` after lexical normalization.

`sourceRef` does not grant filesystem authority. Loading its bytes requires an admitted read capability bound to the template root and no-follow/source-containment evidence. Link-like or otherwise ambiguous source resolution produces a typed gap/block, not a redirect.

### FMT-08 — The loader reads only exact referenced sources
After reading `template.json`, the loader may request only the exact `sourceRef` values needed by admitted entries.

It MUST NOT:
- recursively scan the entire repository;
- recursively absorb every file below the template root;
- auto-discover extra templates by filename;
- follow arbitrary includes/imports;
- access user home/cwd-relative fallback locations;
- fetch remote content merely because a manifest string resembles a URL.

Unreferenced files are inert and excluded from template semantics.

### FMT-09 — Target patterns are portable logical destinations, not write authority
`targetPattern` describes the intended logical output location using `/` separators. It is not an absolute path and never grants M05/M06 mutation permission.

The static portions of a target pattern MUST reject:
- absolute/drive/UNC/device forms;
- `.` or `..` traversal components;
- NUL;
- backslash as an alternate separator;
- host-specific cwd/home aliases;
- empty path components.

Only the safe variable marker class reserved below may appear dynamically in a target pattern. Conditional directives are not valid inside target paths.

After variables are resolved, S02/S05 MUST revalidate the resulting logical target and M06 MUST separately authorize the physical target. No template string can bypass those later gates.

### FMT-10 — Target patterns cannot encode overwrite authority
The template format does not carry `force`, `overwrite-anyway`, ownership claims, authorization tokens or implicit destructive policy.

A template may describe desired bytes for a logical target. M05/M06 still decide whether that desired state is a no-op, create, governed update, conflict, remove/move action or blocked operation.

### FMT-11 — TEXT_TEMPLATE encoding is deterministic
`TEXT_TEMPLATE` source bytes MUST be valid UTF-8. Invalid UTF-8 blocks the entry.

UTF-8 BOM is not canonical and MUST be rejected rather than silently stripped.

Line endings are source-data semantics, not host semantics. The format supports an explicit `textPolicy.lineEndings` value from:
- `PRESERVE_SOURCE`;
- `LF`;
- `CRLF`.

No `NATIVE`, `HOST_DEFAULT` or environment-derived line-ending mode is allowed. S04 owns the final deterministic transformation semantics.

### FMT-12 — BINARY_COPY is byte-exact and marker-free
`BINARY_COPY` content is opaque bytes. Inline template markers are never parsed inside binary entries.

Binary bytes participate in source identity through a digest, not by being copied into logs/evidence. S01 does not infer MIME type or executable authority from extension or contents.

### FMT-13 — M07 reserves one namespaced inline marker introducer
Only the exact byte sequence `{{gef:` enters the M07 inline marker grammar.

Ordinary `{{ ... }}` text that does not begin with the `gef:` namespace remains literal template content and cannot accidentally activate M07 behavior.

The reserved marker terminator is `}}`.

S01 recognizes these lexical marker classes:
- `{{gef:var <identifier>}}` — variable marker, semantics owned by S02;
- `{{gef:if <identifier>}}` — conditional-open marker, semantics owned by S03;
- `{{gef:else}}` — conditional alternate marker, semantics owned by S03;
- `{{gef:end}}` — conditional-close marker, semantics owned by S03;
- `{{gef:literal-open}}` — fixed escape marker representing literal reserved introducer text, final rendering owned by S04.

No other marker class is valid under this contract version.

### FMT-14 — Marker grammar is intentionally non-Turing-complete
The reserved grammar does not admit:
- arbitrary expressions;
- function calls;
- method/property execution;
- pipes/filters;
- arithmetic;
- loops;
- macros;
- dynamic includes;
- eval;
- shell interpolation;
- command substitution;
- environment-variable syntax by implication;
- reflection or host-language escape hatches.

S02 and S03 may define safe identifier lookup and boolean condition semantics only within their ownership. They may not silently turn the marker body into a general expression language.

### FMT-15 — Marker identifiers are lexical references, never executable source
The identifier portion of `var` and `if` markers uses a bounded ASCII dotted-name grammar defined fully by S02/S03. S01 requires it to remain data-only.

Characters that imply code/expression parsing, such as parentheses, brackets, quotes, semicolons, backticks, shell sigils or operator sequences, are not admitted as executable syntax.

Malformed/unclosed/reserved markers fail typed lexical validation. They are not passed through as ambiguous “probably literal” output.

### FMT-16 — Target patterns admit variable markers only
`targetPattern` may contain the S02-owned `var` marker class. It may not contain `if`, `else`, `end` or other directives.

Path-context variables are a distinct safety context: S02/S05 must ensure a resolved variable cannot inject `/`, `\\`, traversal, drive/UNC/device syntax, NUL or platform-conflicting path semantics.

S01's allowance of a marker does not pre-approve any resolved value.

### FMT-17 — No template inheritance, remote include or implicit composition in S01
The canonical S01 format has no `extends`, `include`, `import`, URL dependency, package execution or recursive template-inheritance feature.

Composition/selection across templates belongs to later governed modules such as M08/M09 or a future explicit M07 contract amendment. The absence of such a feature is intentional to keep source closure, dependency graphs and trust surfaces bounded.

### FMT-18 — No hooks or lifecycle code
A template manifest cannot declare pre-render/post-render/pre-write/post-write hooks, package scripts, executables or callbacks.

Repository-controlled template content cannot cause process execution merely by being parsed/rendered. If a future product use-case needs tool execution, it requires a separate owning module, security class, approved executable capability and M01 process policy.

### FMT-19 — No secret acquisition or embedded authorization semantics
The S01 format has no credential, token, password, private-key or authorization field and no directive that fetches secrets.

Static source bytes are treated as source content, not trusted secret storage. Evidence/log projections MUST NOT copy source bodies merely to explain parse/render decisions. Secret resolution, if ever required by a later governed use-case, must remain a separate reference-based capability and cannot be smuggled through template syntax.

### FMT-20 — Parsing/loading is S0 read-only
Manifest parsing, source loading, lexical marker scanning, normalization and digest computation are S0 read-only operations.

They MUST NOT:
- create target directories/files;
- create staging/recovery material;
- mutate Git/provider state;
- install packages;
- execute tools;
- change cwd;
- mutate environment;
- repair/normalize unrelated repository files.

M07 rendering/output planning remains side-effect free until later M05/M06 apply semantics are explicitly invoked by an admitted operation.

### FMT-21 — Template loading is bounded by mandatory finite budgets
Every loader/parser request consumes a versioned finite budget contract covering at least:
- manifest bytes;
- entry count;
- logical path/component length;
- referenced source count;
- per-source bytes;
- aggregate referenced bytes;
- marker count;
- marker length;
- nesting depth for conditional marker structure once S03 applies.

No “unlimited” production setting is valid. Exact default/support thresholds are implementation/compatibility/performance policy and must be mechanically tested; M63 owns quantitative optimization thresholds.

Budget exhaustion yields a typed capability/input block with bounded diagnostics, not partial semantic acceptance.

### FMT-22 — Cancellation/deadline is propagated through source loading
Any future implementation performing filesystem reads or hashing MUST accept the request cancellation/deadline contract and stop bounded work when cancellation/deadline is observed, subject to honest completion of already-issued read operations.

Cancellation during S01 work has no target effect because S01 is read-only.

### FMT-23 — Canonical semantic ordering is independent of JSON array/object order where order is not semantic
Manifest object-key order never affects semantic identity.

Entry list order does not affect semantic identity; entries canonicalize by stable `entryId` because S01 entries are declarative, not procedural.

If later sessions introduce an order-sensitive structure, that structure must explicitly declare order as semantic rather than inheriting incidental JSON order.

### FMT-24 — Source identity and semantic identity are distinct
M07 maintains two conceptually separate identities:

1. `sourceBundleDigest`
   - binds exact admitted manifest data plus exact referenced source-byte digests;
   - useful for stale-input/cache/evidence binding;
   - may include inert extension/display metadata because it identifies the exact admitted source bundle.

2. `templateSemanticDigest`
   - binds only output-relevant template semantics under the active template-contract version;
   - includes template ID/version, canonical entry semantics, source content digests, target patterns, entry kinds, text policy and recognized semantic marker bytes;
   - excludes physical template-root location, cwd, timestamps, random IDs, scan order, telemetry and secrets.

Changing an output-relevant field or referenced source bytes changes semantic identity. Moving an otherwise identical bundle to another local directory does not.

Digest equality proves content equality under the selected digest contract; it does not prove trust, authorship or authorization. Global integrity/trust remains M37-owned.

### FMT-25 — Display metadata cannot alter output
Optional human-facing metadata such as title, description or tags is non-semantic unless a later frozen contract explicitly promotes a field into output semantics.

Display metadata cannot select tools, targets, roots, authorization, conditions or variable values.

### FMT-26 — Extensions are namespaced and inert by default
Extension keys must be explicitly namespaced. An unregistered extension:
- may remain part of exact source-bundle identity;
- does not enter template semantic behavior;
- cannot grant target/path/process/provider capability;
- cannot weaken validation.

Activating an extension requires an explicit owning capability/contract version and its semantic fields become digest-bound.

### FMT-27 — Brownfield templates are local and non-normalizing
Reading a template from an existing project does not authorize broad repository cleanup or conversion to a preferred greenfield layout.

Only the admitted manifest and exact referenced sources are template inputs. Unrelated project files are neither scanned for “template-like” content nor rewritten during S01/S02/S03/S04 planning/render preview.

### FMT-28 — No startup/import side effects
Importing the future M07 package, constructing a parser or registering a format MUST NOT scan for templates, read cwd/home automatically, mutate files, perform network access or load project-controlled executable code.

All source acquisition begins from explicit request inputs/capabilities.

### FMT-29 — Parse result is compact and source-body-minimized
The canonical parse/format result should expose compact structural facts such as:
- template ID/version;
- contract/schema versions;
- entry IDs/kinds;
- logical source/target references;
- source/semantic digests;
- marker counts/classes;
- bounded diagnostics/dependency refs.

Large source bodies, binary bytes, absolute machine-local template roots and sensitive values do not belong in normal receipts/evidence.

### FMT-30 — Format validity is necessary but never sufficient for apply
A syntactically valid template bundle is only an admitted source candidate.

It is not automatically:
- variable-complete;
- condition-valid;
- renderable;
- conflict-free;
- safe to write;
- authorized;
- trusted.

S02-S05 plus M05/M06 remain mandatory owners of those later claims.

## Canonical S01 logical result
A future S01 implementation should conceptually produce a compact immutable descriptor equivalent to:

```text
TemplateFormatDescriptor {
  schemaVersion
  templateContractVersion
  templateId
  templateVersion
  entries[] {
    entryId
    kind
    sourceRef
    targetPattern
    textPolicy?
    sourceDigest
    markerSummary?
  }
  sourceBundleDigest
  templateSemanticDigest
  dependencyRefs[]
}
```

This is a logical contract, not a requirement to persist the descriptor or expose these exact TypeScript property names before the later implementation Work Order chooses package placement and public/private API boundaries.

## Deterministic lifecycle
S01 format work follows this read-only sequence:

```text
BIND TEMPLATE ROOT
→ READ EXACT template.json
→ PARSE STRICT JSON
→ VALIDATE ENVELOPE / VERSION / IDS / ENTRY SHAPES
→ AUTHORIZE EXACT BUNDLE-RELATIVE SOURCE REFS FOR READ
→ READ ONLY REFERENCED SOURCES
→ VALIDATE TEXT/BINARY REPRESENTATION
→ LEX RESERVED MARKERS
→ CANONICALIZE SEMANTIC FIELDS
→ COMPUTE SOURCE + SEMANTIC DIGESTS
→ EMIT COMPACT FORMAT DESCRIPTOR / TYPED BLOCK
```

No phase in this lifecycle writes project state.

## Required future proof families
Any admitted M07 implementation Work Order must eventually prove at least the following S01 families:
1. valid minimal TEXT_TEMPLATE bundle;
2. valid BINARY_COPY bundle;
3. malformed/non-JSON manifest;
4. invalid UTF-8 manifest;
5. unknown/missing schema/contract version;
6. unknown core field fail-closed plus inert namespaced extension behavior;
7. invalid/case-ambiguous template ID;
8. invalid template SemVer;
9. duplicate entry IDs;
10. array/object ordering does not alter semantic identity where non-semantic;
11. semantic entry/source change alters semantic digest;
12. physical bundle relocation does not alter semantic digest;
13. source-bundle digest distinguishes exact-source/display/inert-extension changes as specified;
14. `sourceRef` traversal/absolute/drive/UNC/device/URI/backslash rejection;
15. sourceRef outside `content/` rejection;
16. no-follow/link-like source-resolution block or explicit capability gap;
17. only exact referenced sources are read; unrelated bundle/repository files remain unread;
18. targetPattern traversal/absolute/alternate-namespace rejection;
19. targetPattern cannot grant overwrite/force authority;
20. TEXT_TEMPLATE invalid UTF-8/BOM rejection;
21. deterministic LF/CRLF/PRESERVE_SOURCE policy independent of host OS;
22. BINARY_COPY exact bytes and marker non-parsing;
23. ordinary `{{...}}` remains literal unless namespaced `{{gef:`;
24. malformed/unclosed/unknown GEF marker fails closed;
25. no function/eval/loop/include/shell expression admitted by marker grammar;
26. targetPattern rejects conditional directive markers;
27. no hooks/process execution during parse/load;
28. no remote include/network side effect;
29. finite manifest/entry/source/marker budgets enforced;
30. cancellation/deadline during source loading exits with no target effect;
31. evidence/result excludes source bodies/binary bytes and unnecessary absolute local paths;
32. brownfield unrelated files are neither scanned nor modified;
33. package import/startup causes no filesystem/network/process mutation;
34. Windows/Linux/macOS logical-format fixtures yield the same semantic result for the same portable bundle;
35. content digest equality is not treated as trust/authorship/authorization;
36. S01 success cannot bypass S02-S05 or M05/M06.

## Frozen decisions
1. canonical manifest is strict JSON `template.json`;
2. canonical bundle is directory/logical-root based, not executable/archive based;
3. source content lives behind exact `content/**` references;
4. only TEXT_TEMPLATE and BINARY_COPY entry kinds are admitted by S01;
5. entry order is non-semantic;
6. target patterns are portable logical paths and never path authority;
7. template format carries no overwrite/force authorization;
8. reserved inline syntax is namespaced under `{{gef:`;
9. marker grammar is intentionally non-Turing-complete;
10. no loops/macros/functions/eval/includes/hooks exist in S01 contract;
11. binary content is exact and uninterpolated;
12. text encoding is UTF-8 without BOM and line endings never depend on host defaults;
13. parsing/loading is S0 read-only, bounded and cancellable;
14. exact source identity and semantic template identity remain separate;
15. digest equality is not trust;
16. unregistered extensions are inert;
17. no recursive template inheritance or remote dependencies are admitted;
18. M05/M06 remain the only route from rendered desired output to governed filesystem effect.

## Token/time contract
Future implementation should keep the hot path small:
- one exact manifest read;
- no repository-wide discovery;
- only referenced source reads;
- source digest calculated while bytes are already read rather than through duplicate reads;
- canonical sorting by entry ID once;
- lexical marker scan once per TEXT_TEMPLATE source;
- binary bodies never tokenized as text;
- compact descriptors/evidence retain digests and summaries rather than bodies;
- cache/reuse is valid only while exact manifest/source dependency identities remain current.

M63 later owns measured budgets/thresholds; S01 freezes the structural requirement to avoid unnecessary file I/O and duplicate parsing.

## Session handoff
S01 freezes the template source/envelope/lexical format only.

The next legal planning session is `GBS-M07-S02 — Variables`, which must define variable declarations, types, provenance/defaults, identifier grammar, context-sensitive escaping/resolution, missing/unknown variable behavior, secret/reference handling and path-context safety without expanding the marker language into arbitrary expressions.

No M07 implementation is admitted by this planning session.

STOP CONDITION: `M07_S01_TEMPLATE_FORMAT_FROZEN`.
