# GBS-M24-S01 — Machine Evidence Manifest
Status: `FROZEN`
Module weight: `20`
Assurance intensity: `MAX_ASSURANCE`

## Objective
Freeze M24 as the canonical Evidence Engine that validates machine-readable evidence about an exact governed subject state and emits immutable evidence identities/acceptance facts. M24 may decide whether evidence is valid/current/acceptable for a declared claim, but it may not fabricate the underlying test, execution, artifact, proof graph, assurance verdict, checkpoint promotion, progress amount or project status.

## Ownership boundary
M24 owns:
- machine evidence manifests and evidence-item identity;
- evidence producer/source authority admission;
- exact subject-state binding;
- evidence claim-to-requirement/criterion/unit mapping;
- evidence validity/acceptance lifecycle;
- evidence receipts, freshness and invalidation;
- owner-bound acceptance handoff to M21;
- validated evidence context handoff to future M25/M27.

M24 does NOT own:
- M12 DoD meaning/evaluation;
- M17 checkpoint promotion/next action;
- M21 progress calculation/denominator;
- M23 project status;
- M25 proof-graph reachability/sufficiency;
- M26 delta review;
- M27 assurance verdict;
- M28 test-impact selection;
- M43 telemetry collection;
- M44 audit-ledger persistence;
- M45 benchmark truth;
- M46 artifact storage/publication;
- M53-M58 test execution frameworks;
- Git/GitHub provider mutation.

## Frozen mechanisms
1. **EIC24 — Evidence Intent Capsule**: exact project/lineage/claim/subject request, requested evidence class and current binding expectations.
2. **EAB24 — Evidence Authority Boundary**: declares `EVIDENCE_VALIDATION_AND_ACCEPTANCE_ONLY`; explicitly denies proof/assurance/progress/status/checkpoint authority.
3. **MEM24 — Machine Evidence Manifest**: canonical bounded set of evidence items, producer identities, subject bindings, claim mappings and evidence refs.
4. **SAI24 — Source Authority Index**: canonical allowlist of evidence producers and evidence kinds they are authorized to attest; unknown or mismatched producers fail closed.
5. **SSB24 — Subject State Binding**: binds project, lineage and exact governed subject identities including applicable base/head/tree/checkpoint/work-order/module/runtime/platform/policy identities without assuming every subject has every field.
6. **ECM24 — Evidence Claim Mapping**: maps evidence items to stable requirement/DoD/backlog/module/contract/unit claim IDs without deciding proof-graph sufficiency.
7. **EBL24 — Evidence Binding Ledger**: deterministic anti-double-count/mix ledger of evidence IDs, semantic digests and claim bindings; duplicate IDs with divergent semantics are conflict, not newest-wins.
8. **EPM24 — Evidence Privacy Membrane**: manifests carry bounded metadata, semantic digests and opaque refs, never raw secrets, credentials, private-path payloads or unlimited logs.

## Machine evidence item contract
Each canonical evidence item must bind:
- stable evidence ID and evidence kind;
- producer owner ID plus producer authority binding;
- project/lineage when the subject is project-bound;
- exact subject-state binding digest;
- observation/result classification supplied by the producer;
- source identity/attestation digest;
- validity/dependency binding digest;
- opaque artifact/evidence refs where needed;
- claim IDs supported;
- semantic digest.

A producer saying `PASS` is not enough. Producer authority, subject binding, source identity and validity dependencies must all verify before M24 may emit `ACCEPTED`.

## Authority rules
1. `M24_EVIDENCE` is the acceptance owner presented to M21; it is not the producer identity of every underlying test/artifact.
2. Producer authorization comes from SAI24, not from a caller-provided owner string alone.
3. A producer is authorized only for explicitly admitted evidence kinds/scopes.
4. Generic external evidence requires an `EXTERNAL_CANONICAL` authority entry with exact source identity.
5. Future modules may become producers/consumers only through explicit authority-index entries; their names alone grant no authority.
6. M24 cannot accept its own synthetic assertion as independent underlying evidence.
7. M12 `evidenceRefs` remain references only; M24 validates those evidence identities but cannot rewrite DoD criteria/status.
8. M21 consumes M24 acceptance facts read-only and remains the only progress calculator.

## MAX_ASSURANCE threat/failure model
M24 must fail closed against:
- forged/resealed evidence payloads;
- owner/producer spoofing;
- authorized producer used for the wrong evidence kind;
- cross-project/cross-lineage/cross-module evidence reuse;
- stale head/tree/checkpoint/runtime/platform/policy evidence;
- duplicate evidence IDs with divergent semantics;
- evidence replay presented as new independent support;
- partial/truncated evidence presented as complete;
- evidence-item/claim mix-and-match;
- raw secret/private-path/log leakage into portable manifests;
- ambiguous source identity;
- evidence manufactured solely from M24's own acceptance output;
- missing validity dependencies treated as current;
- ordering/recency used to choose between conflicting authorities.

## Invariants
1. Same semantic evidence set under permutation yields the same manifest identity.
2. Unknown/contradictory mandatory evidence never becomes accepted by fallback.
3. Evidence acceptance cannot create underlying producer truth.
4. Evidence validity is dependency/state bound, not a universal wall-clock TTL.
5. Evidence IDs and claim IDs are stable, bounded and prototype-safe.
6. Manifest construction is bounded/cancellable.
7. SHA-256 semantic hashing is injected and fail-closed.
8. Semantic APIs are startup-pure with no hidden filesystem/network/process/provider/system-clock access.

## MAX_ASSURANCE obligations
Implementation must include producer-spoof/kind-confusion tests, cross-lineage/head mix attacks, duplicate-ID conflict tests, replay independence tests, raw-secret/private-path rejection, manifest permutation/property tests, malformed capability/digest tests, budget/cancellation tests, startup purity, three-OS focused CI, full regression, dependency audit, CodeQL and a dedicated semantic security/integrity pass.

STOP CONDITION: `M24_S01_FROZEN`.
