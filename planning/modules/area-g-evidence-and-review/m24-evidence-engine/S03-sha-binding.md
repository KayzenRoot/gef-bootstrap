# GBS-M24-S03 — SHA & Exact-State Binding
Status: `FROZEN`
Module weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze cryptographic and exact-state binding rules that prevent evidence from being transplanted across projects, lineages, revisions, heads, trees, checkpoints, policies, runtimes, platforms or claim subjects. M24 binds evidence to authoritative identities; it does not infer equivalence from names, timestamps, branch labels or file presence.

## Frozen mechanisms
1. **ESD24 — Evidence Semantic Digest**: domain-separated injected SHA-256 over canonical material evidence semantics, independent of presentation/order noise.
2. **XSB24 — Exact Subject Binding**: canonical envelope for project/lineage/subject kind/subject ID and applicable exact-state identities.
3. **XRB24 — Exact Revision Binding**: binds base/head/tree/revision/checkpoint identities that are applicable to the evidence claim, with explicit absence rather than fabricated values.
4. **DAB24 — Digest Algorithm Boundary**: distinguishes M24 semantic SHA-256 identities from externally owned object identifiers such as Git commit/tree IDs; algorithm/type confusion fails closed.
5. **MSW24 — Mix-and-Match Splice Witness**: detects individually valid evidence fragments/receipts combined from incompatible subject/revision/authority contexts.
6. **PCE24 — Producer Chain Envelope**: binds producer authority entry, producer attestation/source identity and evidence item semantic identity into one independently checkable chain.
7. **BIC24 — Binding Integrity Certificate**: recomputes all required subject/revision/producer/validity bindings and states whether the evidence remains exactly bound.
8. **CBB24 — Cross-Boundary Binding Guard**: blocks cross-project, cross-lineage, cross-work-order/module, cross-runtime/platform/policy reuse unless an owning canonical compatibility witness explicitly authorizes the translation.

## Digest rules
1. M24 semantic digests use injected SHA-256 and canonical domain separation. No fallback hash is allowed.
2. External identifiers remain typed opaque identities. A Git SHA, provider ID or artifact checksum is never relabeled as an M24 semantic digest.
3. A digest is not authority by itself. Authority comes from its owning source plus verified semantic binding.
4. Two equal-looking values from different identity domains are not interchangeable.
5. Canonical list/set fields use deterministic ordering before hashing where order has no semantics.
6. Semantically ordered chains preserve order in their digest.
7. Any malformed/unsupported digest capability fails closed before acceptance.

## Exact-state binding model
XSB24/XRB24 support applicable identities including:
- project ID and lineage ID/digest;
- module/work-order/backlog/requirement/DoD criterion IDs;
- checkpoint/status snapshot identities;
- base/head/tree/revision identifiers;
- source/config/architecture/policy fingerprints;
- tool/runtime/platform identity;
- test/workflow/run/artifact semantic identities;
- producer authority/attestation identities;
- predecessor/supersession identities where history matters.

Fields are explicit and typed. Absence is `null/not-applicable`, not an empty string or guessed current value.

## Exact-head rule
Evidence making an exact-head claim must bind the exact reviewed subject revision. A PR number, branch name, tag, latest workflow, historical green run or merge status alone cannot substitute for the exact head/tree binding required by the claim.

Where a provider run checks a merge ref, evidence must preserve both provider execution identity and the governed source head/tree relationship. Provider-generated merge refs do not silently replace the intended subject identity.

## Compatibility/translation rule
Evidence may cross an identity boundary only when a canonical owning compatibility/translation witness explicitly binds before/after identities and declares the permitted claim scope. M24 records and validates that witness but does not manufacture compatibility authority.

## MAX_ASSURANCE adversarial obligations
Implementation must test:
- head from A + tree from B splice;
- valid receipt attached to another project/lineage;
- same work-order ID in another project;
- Git object ID passed as semantic SHA-256 and vice versa;
- merge-ref run incorrectly presented as exact source-head run;
- branch/tag recency substituted for exact revision;
- platform/runtime/policy drift with unchanged test result;
- canonical object key/list permutation invariance where appropriate;
- ordered-chain permutation rejection where order is semantic;
- digest provider returning malformed/non-SHA output;
- resealed outer payload with inner source/producer digest tamper;
- explicit compatibility witness acceptance and stale/mismatched witness rejection.

## Invariants
1. Material subject-state change changes evidence validity binding even if evidence payload text is identical.
2. Exact-state evidence cannot become portable by deleting binding fields.
3. Unknown identity-domain/algorithm is not interpreted optimistically.
4. A verified semantic digest cannot compensate for unverified producer authority.
5. BIC24 recomputes rather than trusts stored `valid=true` labels.
6. Binding verification is deterministic, bounded/cancellable and startup-pure.

STOP CONDITION: `M24_S03_FROZEN`.
