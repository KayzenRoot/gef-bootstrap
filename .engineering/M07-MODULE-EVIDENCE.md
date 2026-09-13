# GBS-M07 — Template Engine Module Evidence

Status: `MODULE_DONE_CANDIDATE`

## Governed increment
- Module: `GBS-M07 — Template Engine`
- Weight: `14`
- Work Order: `GBS-WO-M07-001`
- Exact admitted implementation base: `aafc6b87ab9f8d54d5ec7dc2dc6f0106f5ce596b`
- Implementation PR: `#133`
- Exact reviewed head: `a76bfc20a6a6300d6d98f42748bad01d77088716`
- Exact reviewed tree: `f5b9b6ad95dafaea2300e2711160d8673909d864`
- Exact-head semantic review: `5191003371`
- Implementation squash merge: `60e3c0f2a0da69ce2a505212e30bc09a2ece3afd`
- Review verdict: `PASS — no unresolved HIGH/CRITICAL findings`

This evidence bundle is promotion input. M07 earns production credit only when the separate MODULE_DONE promotion PR containing this bundle is exact-head reviewed and merged.

## Delivered capability
M07 now provides a dedicated library-first `packages/template-engine` implementing the frozen pure pipeline:

`load/parse format → resolve variables → select conditions → render → validate`

Delivered production behavior includes:
- strict UTF-8 JSON parsing with duplicate-member rejection and null-prototype data objects;
- exact manifest/referenced-source reads only, with no recursive repository discovery;
- versioned deterministic template/source/semantic identities;
- TEXT_TEMPLATE and byte-exact BINARY_COPY handling;
- closed non-executable `{{gef:...}}` marker vocabulary;
- typed STRING/BOOLEAN/INTEGER/ENUM variable resolution with explicit precedence/provenance;
- no ambient environment binding and no secret-material admission;
- BOOLEAN-only statically validated conditional selection with deterministic evidence preorder;
- deterministic single-pass rendering with explicit line-ending policy;
- versioned stale-bound S02/S03/S04 snapshots;
- pre-allocation render budgets including CRLF expansion;
- complete portable logical target validation and exact/case/prefix collision detection;
- immutable desired-artifact handoff with no ownership/overwrite/delete/security inference;
- fail-closed public runtime façade for malformed JavaScript callers/capability exceptions;
- explicit downstream M07 → M05 translation boundary;
- startup/import purity and focused cross-platform proof.

## Frozen contract bindings
- S01 Template Format: `1e5ea91fd101d95870f986ae5f4b3b8225b19d8f`
- S02 Variables: `645fb78e9ae8d007abc3654ec39e038c0907777c`
- S02 freeze: `45b878ee91dbb9ba69cdd23c9f48551a40ff91b1`
- S03 Conditional Templates: `b1432fedb11b58c652690ed81ef654a1abcd6d34`
- S03 proof: `97dc44d7b22cc5d03b0d27fb25780ad1f724e2c6`
- S04 Rendering: `5aae3086fb5846211d4844394f285e9751e34a42`
- S04 proof: `e80885670ed8eaca3f3808bac0f234d6987d6e2c`
- S04 freeze: `92d975e96e12332ca6b49cff719800396ac6b493`
- S05 Validation: `914eca2a22861c76d543a6b75aec4cf3c258b55a`
- S05 proof: `8ca2c81b2c9650dac04d32349a6a29f8f6dd20c5`
- S05 freeze: `2706157fec8323bc0cffe8b4d8872abf24f18703`
- M07 Module Gate: `097e0f890284b9e79ab3e3078250825c7126e5ba`
- Immutable compiled Work Order blob: `7d2e93c866957ace0ba39873efaf60874fdc9a38`

No frozen dependency changed between admission and exact-head review.

## Exact-head validation
Repository validation on exact reviewed head `a76bfc20a6a6300d6d98f42748bad01d77088716`:

### Main validation
- workflow: `m01-validation`
- run: `34762400016`
- job: `103737401876`
- conclusion: `SUCCESS`
- locked install: `PASS`
- npm dependency audit: `0 vulnerabilities`
- strict TypeScript/build: `PASS`
- tests: `324 PASS / 0 FAIL / 0 CANCELLED / 0 SKIP / 0 TODO`

### M07 platform matrix
- workflow: `m07-platform`
- run: `34762400076`
- Ubuntu job `103737402112`: `SUCCESS`
- Windows job `103737402218`: `SUCCESS`
- macOS job `103737402247`: `SUCCESS`
- each job: exact locked install + audit + typecheck/build + focused M07 deterministic portability/startup proof.

### M06 regression matrix
- workflow: `m06-platform`
- run: `34762400027`
- Ubuntu job `103737402211`: `SUCCESS`
- Windows job `103737402125`: `SUCCESS`
- macOS job `103737402001`: `SUCCESS`

This proves M07 did not weaken the existing M05/M06 physical-effect boundary.

## Proof-family mapping
### S01 — Template Format
Mechanically covered by `m07-format.test.mjs`, `m07-security.test.mjs`, `m07-contract-hardening.test.mjs`, `m07-startup-purity.test.mjs` and the 3-OS matrix:
- strict JSON/duplicate keys/prototype-sensitive payloads;
- version/core-field fail-closed behavior;
- exact referenced source reads only;
- traversal/absolute/alternate/device source rejection;
- UTF-8/BOM policy;
- TEXT vs binary separation;
- closed marker grammar/non-executable syntax;
- targetPattern directive restrictions;
- deterministic source/semantic identity and entry-order independence;
- finite aggregate budgets, post-read cancellation and startup purity.

### S02 — Variables
Mechanically covered by `m07-variables.test.mjs`, `m07-security.test.mjs`, `m07-contract-hardening.test.mjs`, `m07-proof-completion.test.mjs`:
- exact declaration grammar and reserved `gef` namespace;
- scalar type semantics, safe integers and negative-zero canonicalization;
- ENUM exactness;
- DEFAULT < PROFILE < EXPLICIT precedence and same-layer conflicts;
- unknown/disallowed binding failure;
- explicit usage-context policy;
- portable bounded target-segment rules including device stems;
- SENSITIVE_REFERENCE restrictions;
- secret-material rejection without value echo;
- single-pass marker-looking values;
- output-value identity separated from provenance/evidence identity;
- resolution contract version bound into evidence identity;
- default-only empty binding-source subset.

### S03 — Conditional Templates
All required S03 proof families are mapped to `m07-conditions.test.mjs`, `m07-contract-hardening.test.mjs`, `m07-proof-completion.test.mjs` and portability/startup tests:
- TRUE/FALSE/alternate/empty branches;
- empty branches and nested deterministic preorder;
- full static validation before runtime short-circuit;
- unreachable optional conditions as NOT_EVALUATED;
- reached unbound optional failure;
- every non-BOOLEAN condition type rejected;
- malformed stack/nesting failure;
- static/evaluated dependency sets;
- versioned conditional decision identity and boolean-dependent digest delta;
- stale/tampered S02 snapshot rejection;
- selected structure bound into S03 snapshot identity;
- evidence/cancellation bounds and no downstream-gate bypass.

### S04 — Rendering
All required S04 proof families are mapped to `m07-rendering.test.mjs`, `m07-proof-completion.test.mjs`, `m07-security.test.mjs` and the 3-OS matrix:
- exact literal/scalar insertion and literal-open behavior;
- marker-looking inserted data never re-tokenized;
- selected unbound variable failure while inactive unbound data is not required;
- no whitespace magic;
- PRESERVE_SOURCE/LF/CRLF including inserted STRING newlines;
- Unicode behavior/no synthesized BOM/no normalization;
- byte-exact BINARY_COPY;
- logical target substitution only;
- duplicate target products retained for S05;
- zero-byte output still represented;
- target/content/aggregate identity deltas and deterministic same-value identity;
- provenance excluded from output identity;
- versioned/stale-bound S02/S03 inputs;
- typed projection consistency;
- pre-allocation per-entry/aggregate budgets including CRLF expansion;
- no implicit language-specific escaping;
- cancellation/startup purity and no S05/M05/M06 bypass.

### S05 — Validation
All required S05 proof families are mapped to `m07-validation.test.mjs`, `m07-proof-completion.test.mjs`, `m07-integration.test.mjs`, `m07-security.test.mjs` and the 3-OS matrix:
- complete valid snapshot readiness;
- incomplete accounting without gap blocks;
- genuine mandatory render gap becomes INDETERMINATE;
- aggregate integrity is checked before INDETERMINATE;
- target/content/length/aggregate tamper detection;
- portable final-target rejection including traversal/device/NFC/control forms;
- exact, ASCII-case and ancestor/descendant collisions;
- identical content at distinct targets remains valid;
- deterministic validation identity;
- immutable in-process content reference reuse and frozen verified deserialized copy;
- desired-state output contains no operation/ownership/authorization inference;
- omission never creates REMOVE/MOVE;
- downstream occupancy/ownership remains M05/M06-owned and does not create false S05 indeterminacy;
- explicit M07→M05 translation required;
- evidence/content budgets, cancellation/deadline and startup purity.

## Work Order acceptance closure
All 56 compiled acceptance criteria are satisfied by production code plus exact-head mechanical evidence. Highlights:
- dedicated package/build integration: `PASS`;
- import/startup no side effects: `PASS`;
- narrow read/digest/control ports: `PASS`;
- strict JSON/prototype defenses: `PASS`;
- S01-S05 frozen behavior: `PASS`;
- runtime malformed caller fail-closed behavior: `PASS`;
- adversarial/budget/cancellation coverage: `PASS`;
- Ubuntu/Windows/macOS focused proof: `PASS`;
- explicit downstream M05 translation: `PASS`;
- no template-engine → kernel dependency: `PASS`;
- M00-M06 regression: `PASS`;
- exact-head CI and semantic audit: `PASS`.

## Findings corrected before acceptance
The implementation review cycle found and corrected, before final exact-head review:
1. startup-purity fixture compared `process.env` prototype rather than canonical values;
2. variable identifier grammar initially admitted underscore/segment ambiguity;
3. target component byte budget was missing;
4. marker count was initially per-source instead of aggregate evaluation budget;
5. cancellation needed a post-read check before parsing;
6. condition TRUE evidence order needed exact source-tree preorder;
7. empty `allowedBindingSources` needed to remain a valid subset;
8. stage snapshot versions were not all explicit/bound into evidence identities;
9. stale S02/S03 payloads needed digest revalidation before downstream use;
10. render byte limits initially checked after full concatenation rather than before materialization;
11. S05 initially classified gaps before aggregate-integrity validation;
12. immutable S04 content handoff needed reference reuse for in-process snapshots and frozen copy for deserialized inputs.

All were corrected before reviewed head `a76bfc20a6a6300d6d98f42748bad01d77088716`.

## Residual gaps
- No release-blocking M07 gap remains.
- Global trust/authorship of digests remains intentionally M37-owned.
- Quantitative performance thresholds remain intentionally M63-owned.
- Project-profile selection/content remains M08-owned.
- Source Pack aggregation/distribution remains M09-owned.
- Secret materialization remains out of M07 scope.

These are ownership boundaries, not incomplete M07 acceptance items.

## Production-credit proposal
Upon merge of the separate MODULE_DONE promotion PR:
- M07: `14 / 14`
- total earned: `139 / 1088 = 12.78%`
- remaining: `949 / 1088 = 87.22%`
- denominator change: `NONE`

## Next legal stage after promotion
`GBS-M08 — Project Profiles`, session `S01 — Generic Profile`.

Proposed checkpoint: `READY_FOR_GBS_M08_S01`.

STOP CONDITION: `M07_MODULE_DONE_EVIDENCE_READY_FOR_PROMOTION_REVIEW`.
