# GBS-V11-MAINT-PR278-COMPLEXITY-003 — Deterministic validator and proof-closure decomposition

Status: ADMITTED_BY_OWNER_CONTINUATION. Parent: GBS-V11-MAINT-POST-WO009-001. Exact release base: `343c619f1cd39d63ad0a9baeecd8091fa7468873`. Branch: `gbs/v11/maint-pr278-complexity-003`. Assurance: ELEVATED. Owner: KayzenRoot.

After approved [PR #321](https://github.com/KayzenRoot/gef-bootstrap/pull/321), PR #278 still fails cumulative Sonar (Security B, Reliability D, duplication displayed 3.0%) and conflicts with main. The provider inventory from PR #320, job `109417416793`, identifies Cognitive Complexity 62 in `validateExecutionCapsuleContract` and 26 in `downstreamFailureClosure`.

## Authorized changes
- Extract the *exact original ordered* capsule validators into ten single-responsibility internal phases: identity, base/Work Order, navigation, affected projection, acceptance, selected tests, proof references, fingerprints, invalidation and terminal checks. Preserve predicate semantics, failure error/reason/detail precedence, set uniqueness and the final `Result<true>` contract. First-failure short-circuit is mandatory.
- Divide the proof invalidation fixed-point into source and test dependency growth helpers. Preserve the original seed logic, source-before-test growth within each iteration, full transitive closure and returned sets/unknown flag. Evaluate both helpers before deciding whether another iteration is required.
- Preserve all exports, frozen contract tests, exact HEAD/producer bindings and provenance. No changes to unrelated modules, suppression, package or dependency data, CI definitions or scan thresholds.

Required verification: focused CTX-DET and PROOF-INV, full typecheck/repository validation, platform release assurance Ubuntu/Windows/macOS, security and dependency checks, Sonar, and exact-head owner audit. Remaining annotated complex functions (compileExecutionCapsule 29, compileProofReusePlan 70), cumulative quality gate and main divergence are out of this subincrement. No WO-010, publication or production main change.

STOP CONDITION: `GBS_V11_PR278_COMPLEXITY_003_EXACT_HEAD_VERIFIED_OR_BLOCKED`.
