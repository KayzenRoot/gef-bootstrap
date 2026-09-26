# GBS-WO-M03-001 — Implement Project Identity Foundation

Status: `APPROVED_MODULE_DONE`

## COMPLETION EVIDENCE
- Implementation PR: `#70`
- Base SHA: `ffa99ba5a12f6380bdacbd3d441944aa62998439`
- Exact reviewed head SHA: `d536df4822be6cc58f7b62c4dcd6de0bdec2ca8a`
- Squash merge SHA: `aed42faedd275d4b8a313067b1b60f25bb442fcc`
- GitHub Actions run: `34727238254`
- Verification: `91 PASS / 0 FAIL / 0 SKIP / 0 TODO`
- Strict TypeScript build/typecheck: `PASS`
- Locked dependency install/audit: `PASS / 0 vulnerabilities`
- Exact-head semantic verdict: `APPROVED`
- Canonical evidence: `.engineering/M03-MODULE-EVIDENCE.md`
- M03 production credit: `17/17`

## OBJECTIVE
Implement the bounded production foundation of `GBS-M03 — Project Identity` from frozen S01-S04 contracts, reusing M01 kernel and M02 configuration/schema infrastructure without implementing later-module ownership.

## CONTEXT
Base is `main` after canonical M03-S04 checkpoint `c75a96d1d345128362fc3c618ca24a581cf20a6f` plus this gate PR when merged.

Read before changes: Source Hierarchy, Scope, Architecture, Security, Definition of Done, Test/Benchmark Plan, Backlog, current checkpoint, M01/M02 module/evidence contracts, and M03 S01-S04.

## SCOPE
Implement only M03-owned capability:
- project ID validation/generation and identity lifecycle states;
- identity projection from `.gef/project.json`;
- versioned project fingerprint manifests and binding-strength checks;
- provider-neutral repository identity normalization/projection;
- local-only repository binding semantics;
- collision classification;
- rekey, repository rebind and fork-adoption preview/apply orchestration contracts;
- compact identity-transition receipts;
- focused tests and exact-head evidence.

## OUT OF SCOPE
Do not implement broad project discovery (M04), transactional filesystem engine (M05/M06), project registry storage/indexing (M19), proof invalidation engine (M25/M37), Git command engine (M29), GitHub/provider APIs (M30+), global content hashing, release governance or broad UX.

## ARCHITECTURE RULES
1. TypeScript/Node, library-first, deterministic pure functions where possible.
2. Reuse M01 typed errors/lifecycle conventions and M02 config/schema contracts.
3. Keep project identity, repository identity and fingerprint state distinct.
4. Canonical project ID is lowercase UUIDv4 and never inferred from name/path/remote.
5. No silent ID generation during ordinary migration/repair.
6. Fingerprint hashing uses an injected digest port; M03 owns semantic manifest, not M37 algorithm policy.
7. Repository core remains provider-neutral and strips credentials/query/fragment before canonical projection.
8. Absolute path, machine, branch, HEAD, dirty state, clock and secrets never enter canonical identity/fingerprint input.
9. Rekey/rebind/fork operations are preview-first and exact-state bound.
10. No redundant interactive prompt for STANDARD pure rebind when an admitted exact-scope Work Order already authorizes it; stronger assurance keeps acknowledgement gates.

## ACCEPTANCE CRITERIA
1. Project IDs validate as canonical lowercase UUIDv4.
2. Production ID generation uses injectable cryptographically secure UUIDv4 generation; deterministic tests inject a controlled generator.
3. `UNADOPTED`, `IDENTITY_BOOTSTRAP_REQUIRED`, valid-adopted and invalid/conflicted states are distinguishable.
4. Legacy adopted state missing project ID does not silently receive one.
5. Normal config merge/migration cannot rewrite `projectId`.
6. Same project ID survives path, machine and ordinary clone changes.
7. Versioned project fingerprint input is deterministic and structurally serialized.
8. Fingerprint output carries schema/manifest version, algorithm, digest, binding strength and repository projection state.
9. `PROJECT_ONLY` uses validated project ID directly; weaker binding cannot satisfy stronger consumers.
10. `IDENTITY_STATE` works with unresolved repository identity; `REPOSITORY_BOUND` does not.
11. Delta classification includes `BASELINE_CREATED` plus project/repository/policy/algorithm/manifest change classes.
12. Unrelated project config changes do not alter the identity projection.
13. Equivalent admitted SSH/HTTPS remote forms normalize to the same provider-neutral locator when deterministically provable.
14. Credential material, query and fragment never enter repository identity.
15. Remote alias and local checkout path changes alone do not change repository identity.
16. Local-only repository binding requires an explicit persisted binding ID.
17. Multiple incompatible remote candidates and unsafe remotes fail closed.
18. Trusted stable provider repository ID may prove continuity across locator rename without making provider APIs mandatory.
19. Repository path case remains opaque in generic core unless a provider/profile rule is injected.
20. Same-lineage clones are not classified as collisions.
21. Authoritative incompatible project/repository pairings produce explicit collision classes and block identity-dependent mutation.
22. Normal rekey/fork-adoption generates a secure UUIDv4 during preview and apply must use that exact preview-bound value.
23. Caller-supplied target project IDs are rejected in normal rekey and admitted only by explicit controlled import/recovery validation path.
24. Rekey and repository rebind are distinct; rekey invalidates project-bound artifacts while pure rebind invalidates repository-bound artifacts only.
25. Transition apply rejects stale project/repository/config state.
26. Fork-adoption requires explicit lineage-split acknowledgement.
27. STANDARD pure rebind may consume admitted Work Order authorization without another prompt; ELEVATED/HIGH_ASSURANCE still require acknowledgement.
28. Registry-only duplicate evidence is represented as suspicion and cannot auto-rekey/rebind canonical state.
29. Transition receipts link old/new identity state and invalidation classes without secrets or broad snapshots.
30. Strict typecheck/build and focused unit/integration/security tests pass with no skipped critical path.
31. Hosted exact-head evidence exists and no HIGH/CRITICAL semantic finding remains.

## TESTS
Cover at minimum: UUID syntax/generation injection; brownfield identity bootstrap; config immutability; fingerprint determinism/deltas/binding strengths; SSH/HTTPS normalization; credential stripping; path/alias invariance; local-only binding; conflicting remotes; provider-stable-ID continuity; same-lineage clone; collision classes; rekey/rebind/fork previews; stale-plan rejection; assurance acknowledgement; registry suspicion; secret-free receipts.

## DELIVERABLES
- M03 production package/module and exports;
- schema/config integration only where M03 identity fields require it;
- focused tests;
- workspace/build wiring;
- Evidence Bundle with base/head SHA, changed files, tests, typecheck/build, dependency/security observations, risks and proposed Checkpoint Delta;
- PR for exact-head review.

## REVIEW FORMAT
Return in Brazilian Portuguese: summary, exact base/head, files, tests/checks, acceptance mapping, findings by severity, residual risks, evidence links/receipts and proposed Checkpoint Delta.

## STOP CONDITION
Satisfied as `M03_MODULE_DONE_APPROVED`. Do not reopen this Work Order without governed change control.
