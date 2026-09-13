# GBS-WO-M07-001 — Implement Template Engine

Status: `COMPILED_PENDING_ADMISSION`
Risk: `MODERATE`

## Objective
Implement the complete deterministic, non-executable and side-effect-free `GBS-M07 — Template Engine` from frozen S01-S05 and the approved M07 Module Gate. The implementation must load exact template sources, resolve typed variables, select BOOLEAN-only conditional branches, render deterministic bytes/targets and validate the complete desired-artifact set without creating filesystem effects or weakening M05/M06 governance.

## Exact compilation base
- main base: `0328fe36ac534cdd0849f415af513c01706b2093`
- S01 Template Format blob: `1e5ea91fd101d95870f986ae5f4b3b8225b19d8f`
- S02 Variables semantic blob: `645fb78e9ae8d007abc3654ec39e038c0907777c`
- S02 normative freeze blob: `45b878ee91dbb9ba69cdd23c9f48551a40ff91b1`
- S03 Conditional Templates semantic blob: `b1432fedb11b58c652690ed81ef654a1abcd6d34`
- S03 proof blob: `97dc44d7b22cc5d03b0d27fb25780ad1f724e2c6`
- S04 Rendering semantic blob: `5aae3086fb5846211d4844394f285e9751e34a42`
- S04 proof blob: `e80885670ed8eaca3f3808bac0f234d6987d6e2c`
- S04 normative freeze blob: `92d975e96e12332ca6b49cff719800396ac6b493`
- S05 Validation semantic blob: `914eca2a22861c76d543a6b75aec4cf3c258b55a`
- S05 proof blob: `8ca2c81b2c9650dac04d32349a6a29f8f6dd20c5`
- S05 normative freeze blob: `2706157fec8323bc0cffe8b4d8872abf24f18703`
- M07 Module Gate blob: `097e0f890284b9e79ab3e3078250825c7126e5ba`
- root package manifest blob: `33f1fe6387e5add6274ed7839c9ba4879280b3fb`

All normative companions are binding implementation inputs. If a frozen source, Module Gate, Architecture, Security, Definition of Done, Test/Benchmark Plan, relevant M05/M06 public contract or workspace build topology changes before implementation exact-head review, mark this Work Order `STALE` and reconcile it before continuing.

## Approved placement
Implement M07 as the dedicated domain package:

`packages/template-engine`

The package is library-first and MUST NOT depend on CLI text parsing. It MUST NOT import `packages/kernel` merely to parse, resolve, select, render or validate templates.

Expected package shape may include:
```text
packages/template-engine/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts
    errors.ts
    ports.ts
    strict-json.ts
    format.ts
    variables.ts
    conditions.ts
    rendering.ts
    validation.ts
    engine.ts
```

Exact filenames may be refined, but moving M07 into `packages/kernel` or introducing a different top-level production architecture requires a governed Gate amendment.

## Dependency boundary
M07 may depend on `@gef-bootstrap/contracts` only where shared contracts are actually needed. New runtime dependencies require explicit justification and must not introduce executable template semantics.

Use narrow injected ports for:
- exact source-byte acquisition under an already admitted read capability;
- deterministic versioned digest computation;
- request cancellation/deadline and finite budgets.

M07 MUST NOT directly:
- write project files;
- create staging/recovery/temp files;
- invoke M06 write primitives;
- execute shell/process/tools;
- fetch provider/network data;
- scan cwd/home/repository broadly;
- acquire secrets;
- infer filesystem ownership or authorization.

## Required pipeline
Implement the frozen pipeline as typed immutable stages conceptually equivalent to:

`load/parse format → resolve variables → select conditions → render → validate`

Each stage must retain a distinct typed result/error boundary. A convenience end-to-end evaluator may compose the stages, but it cannot skip validation or downstream gates.

## Core invariants
1. Template content is data, never executable code.
2. `template.json` is strict UTF-8 JSON and duplicate object member names fail closed before semantic admission.
3. Parsed JSON never mutates runtime prototypes and is never processed through prototype-sensitive merges.
4. Only exact referenced source files are read; no recursive repository ingestion occurs.
5. Only `TEXT_TEMPLATE` and `BINARY_COPY` are admitted entry kinds.
6. The `{{gef:...}}` grammar remains the exact frozen non-Turing-complete marker vocabulary.
7. Variables are explicitly declared, strictly typed and never resolved from ambient environment/cwd/home state.
8. Secret material is not an admitted M07 variable value.
9. Variable resolution is single-pass; inserted values never create new template syntax.
10. Conditions are BOOLEAN-only and runtime short-circuit never bypasses full static validation.
11. Rendering is deterministic, single-pass and side-effect free.
12. Line-ending transformation follows only the explicit frozen policy.
13. BINARY_COPY remains byte-exact.
14. Render content is snapshot-safe and cannot change after its digest/length identity is fixed.
15. Final logical target validation is host-independent and collision-aware.
16. Files absent from the template never become delete candidates.
17. A template target never proves existing-file ownership or overwrite permission.
18. S05 emits desired artifact state only, never a ready-to-apply mutation plan.
19. M05 remains semantic transaction authority and M06 remains physical path/write authority.
20. Digest equality proves equality/correlation only, never trust/authorship/authorization.

## Acceptance criteria
1. `packages/template-engine` exists with package metadata, tsconfig, typed public exports and strict TypeScript compilation.
2. Root workspace build/typecheck includes `packages/template-engine` in dependency-safe order.
3. M07 public stages are library-first and do not require CLI parsing.
4. Importing the package and constructing stage/evaluator objects performs no filesystem/network/process side effect.
5. A narrow source-read port can provide exact manifest/source bytes without granting write authority.
6. A narrow versioned digest port is injected; M07 does not define global trust policy.
7. Strict JSON parser rejects duplicate member names at any object nesting level rather than accepting last-key-wins.
8. Prototype-sensitive names/payloads cannot mutate Object prototypes or semantic validator state.
9. Manifest UTF-8/BOM/version/core-field rules match frozen S01.
10. Unsupported schema/contract versions fail closed without best-effort fallback.
11. Template ID/version/entry identity and semantic/source digest behavior match S01.
12. Source loader reads only exact referenced `content/**` inputs and never recursively scans unrelated files.
13. `sourceRef` traversal/absolute/drive/UNC/device/URI/backslash/link-like ambiguity fails as frozen.
14. TEXT_TEMPLATE and BINARY_COPY format behavior matches S01, including binary non-parsing.
15. Reserved marker grammar accepts only frozen var/if/else/end/literal-open classes and rejects malformed/unknown executable-like syntax.
16. Variable declaration grammar/types/defaults/required semantics match frozen S02 plus S02-FREEZE.
17. INTEGER uses typed safe-integer semantics and negative zero canonicalizes to zero.
18. Variable precedence is exactly TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT with provenance preserved.
19. Unknown/duplicate same-layer/disallowed-source bindings fail closed and environment is never an implicit binding layer.
20. SENSITIVE_REFERENCE is restricted to STRING/ENUM, is never a target-path value, and actual secret material is rejected without echoing it.
21. TARGET_PATH_SEGMENT rules include the complete portable character/device-stem hardening from S02-FREEZE.
22. Variable values are single-pass data and marker-looking content never creates second-pass syntax.
23. Conditional structure uses only BOOLEAN variables with CONDITION_REFERENCE and no truthiness/coercion.
24. Full condition structure/type/context validity is checked before runtime short-circuit.
25. Reached UNBOUND_OPTIONAL conditions block while unreachable optional nested conditions remain NOT_EVALUATED.
26. if/else/end stack pairing, empty branches, source-boundary rules and deterministic preorder match S03.
27. Rendering consumes compatible S01/S02/S03 snapshots and blocks stale/mismatched inputs.
28. Rendering inserts exact S02 canonical projections and `literal-open` emits exact reserved introducer bytes without re-tokenization.
29. Condition control markers emit no bytes and no whitespace/newline magic occurs.
30. PRESERVE_SOURCE/LF/CRLF semantics match S04, including inserted STRING newlines and no host-native mode.
31. TEXT output is deterministic UTF-8 with no synthesized BOM or implicit Unicode/language-specific transformation.
32. BINARY_COPY output is byte-exact with no decoding or line-ending transformation.
33. targetPattern rendering performs logical substitution only and never resolves physical paths or sanitizes unsafe values.
34. Each entry yields one render product, including zero-byte TEXT output; rendering never resolves target collisions by order.
35. Render content representation is immutable/snapshot-safe and remains bound to exact content digest/length.
36. S05 validates exact artifact accounting and final portable logical targets after substitution.
37. Exact duplicate, ASCII-case alias and exact/case-folded ancestor-descendant target conflicts fail deterministically.
38. S05 collision results are host-filesystem-independent and do not use realpath/directory enumeration.
39. Tampered aggregate renderSnapshotDigest, target digest, content digest or byte length is detected.
40. Template absence never creates remove intent, and template presence never establishes current-file ownership/overwrite permission.
41. VALIDATED_FOR_EFFECT_PLANNING is emitted only for a complete internally valid desired-artifact set with no unresolved mandatory render gap.
42. S05 output contains desired artifacts/content refs/downstream requirements only, not CREATE/UPDATE/REMOVE/MOVE decisions.
43. Strict runtime validation handles malformed/untyped JavaScript callers with typed fail-closed results instead of uncaught structural exceptions.
44. All stage errors/diagnostics are compact, deterministic and do not copy source bodies, binary payloads or secret material unnecessarily.
45. Mandatory finite budgets propagate through manifest/source/marker/variable/condition/render/validation work and fail closed.
46. Cancellation/deadline propagates through every read/parse/resolve/evaluate/render/validate phase with no target effect and no valid partial final snapshot.
47. Canonical identities exclude clocks, random/run IDs, local absolute paths and telemetry wherever frozen contracts require.
48. Every proof family frozen in S01/S02/S03-PROOF/S04-PROOF/S04-FREEZE/S05-PROOF/S05-FREEZE is mapped to mechanical tests or explicit non-applicability evidence.
49. Focused portability/startup-purity fixtures pass on Ubuntu, Windows and macOS in CI without triplicating the full repository suite.
50. A focused integration test proves S05 desired artifacts can enter downstream M05 planning only through an explicit translation/orchestration step.
51. That integration cannot infer M05 security class/authorization, existing-file ownership, overwrite permission or REMOVE/MOVE from omission.
52. M07 production code has no direct M06 write invocation and no template-engine → kernel dependency cycle.
53. Existing M00-M06 regression suites remain green.
54. `npm ci --ignore-scripts`, dependency audit, `npm run typecheck`, `npm run build`, `npm test` and `npm run validate` pass on the exact final implementation head.
55. Exact-head hosted CI is green and exact-head semantic audit has no unresolved HIGH/CRITICAL finding.
56. The M07 Evidence Bundle maps frozen contracts/proof families to source/tests/CI/platform evidence and records residual typed gaps truthfully.

## Mandatory adversarial coverage
Include tests for at least:
- duplicate JSON keys at root and nested objects;
- `__proto__`, `constructor`, `prototype` and prototype-pollution-shaped payloads;
- malformed reserved markers and excessive nesting;
- oversized manifest/source/marker/variable/render/evidence inputs;
- traversal, absolute, drive, UNC, device and invalid portable target forms;
- exact/case/prefix target collisions;
- variable marker injection attempts;
- secret-like candidate rejection/redaction behavior;
- stale/mismatched S02/S03/S04 stage snapshots;
- tampered render content/digest/length/aggregate identity;
- cancellation/deadline at every pure stage;
- import/startup no-I/O/no-network/no-process behavior.

## Required platform proof
Add a focused M07 workflow matrix for:
- Ubuntu/Linux;
- Windows;
- macOS.

The matrix proves portable template/path/text semantics plus startup purity. It should run only the focused M07 portability suites needed for these claims. The full repository regression runs once in the normal validation workflow to control CI latency/cost.

## Validation minimum on final reviewed head
- `npm ci --ignore-scripts`;
- dependency vulnerability audit under current npm policy;
- `npm run typecheck`;
- `npm run build`;
- `npm test`;
- `npm run validate`;
- focused M07 format/variables/conditions/rendering/validation/security tests;
- focused M07 portability/startup-purity matrix on Ubuntu, Windows and macOS.

No frozen M07 proof family may be skipped and then counted as passing evidence.

## Deliverables
- `packages/template-engine` production package and public typed API;
- root workspace build/typecheck integration;
- deterministic pure stage implementations and end-to-end evaluator where useful;
- source-read/digest/cancellation-budget ports;
- focused unit/adversarial/integration tests;
- focused Ubuntu/Windows/macOS workflow matrix;
- Context Lock/exact-base freshness evidence;
- implementation PR;
- Evidence Bundle containing admitted base, exact reviewed head/tree, CI/jobs, platform evidence, findings/corrections, residual gaps and proposed checkpoint delta.

## Out of scope
Do not implement:
- M08 Project Profiles beyond accepting an already injected PROFILE_BINDING snapshot/input;
- M09 Source Pack aggregation/distribution;
- M29 Git mutation;
- M30+ provider mutation;
- M36 restart/orphan recovery;
- M37 global integrity/trust/authorship policy;
- M51 global compatibility-matrix ownership;
- M54/M56/M58 later full harness products beyond tests needed for this increment;
- M63 quantitative latency/token/resource thresholds;
- secret-store acquisition/materialization;
- template deletion-by-omission;
- template hooks/process execution;
- arbitrary expression language, loops, macros, functions, dynamic includes or remote includes;
- broad brownfield normalization or repository scanning;
- Codex construction of Bootstrap.

## Admission rule
This Work Order is **not admitted by compilation**. It becomes executable only when the separate admission checkpoint is reviewed and merged. The merge SHA of that admission checkpoint becomes the exact implementation base.

No production code may start from this compilation branch or from the compilation merge itself.

## Production accounting
- M07 weight: `14`
- earned at compilation: `0 / 14`
- total remains: `125 / 1088 = 11.49%`
- remaining remains: `963 / 1088 = 88.51%`
- denominator change: `NONE`

## Stop condition
Stop at `GBS_WO_M07_001_COMPILED_PENDING_ADMISSION` after exact-head review and merge of this Work Order compilation, or `STALE`/`BLOCKED` if a frozen dependency changes first.
