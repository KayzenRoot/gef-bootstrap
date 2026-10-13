# GBS-MOD-WO-004 — Structural Architecture and Documentation Drift Enforcement

**STATUS:** `PLANNING_CANDIDATE_NOT_ADMITTED`; **do not execute, implement or promote**.
**Issue:** [#398](https://github.com/KayzenRoot/gef-bootstrap/issues/398). **Program:** [#393](https://github.com/KayzenRoot/gef-bootstrap/issues/393). **Predecessor:** #394 / GBS-MOD-WO-001 promoted. **Cross-program future interfaces:** #427 (internal Schema Registry, PLANNED), #429 (public application compatibility, PLANNED).
**Exact planning source:** `KayzenRoot/gef-bootstrap main@e0356f1de5dae2351d8701a76c736a22832929c2`.
**Risk:** `STANDARD` is Issue #398's *planning proposal*, **not an admitted implementation risk**. Raise to `ELEVATED` or `HIGH_ASSURANCE` when actual CI/security/ruleset, generated artifacts, protected source authority or critical boundaries are affected. A future exact-risk decision is separate.
**Actor:** ChatGPT writes planning/governance; effective ADR-0008-D1/D6 keeps CodeX the only code/test/CI author. No actor reassignment from Issue #452 / draft PR #453.
**Project state barrier:** post-#449 canonical CHECKPOINT MD and JSON disagree in WO-002 temporal admission semantics: `STATE_CONFLICT` until separate Owner-authorized protected corrective PR #451 is actually merged and revalidated. #451 is only PREPARE/REVIEW, **not MERGE authorized**. #450 remains inactive.
**Stable facts:** V1 1088/1088; V1.2 3/10 (7 remain); CLI published 1.1.2; #439 historical all-ref Gitleaks 21 UNKNOWN blocks 1.1.3. No credit for this planning increment.

## Objective and required behavior

Implement, only after future admission, **selectively scoped deterministic checks** that fail on high-confidence forbidden cross-package imports and canonical-source-dependent documentation drift, preserving accepted package boundaries and not increasing unrelated validation cost. Source hierarchy, Architecture, Security, product DoD and GEF Gate remain owners of their domains; the new checker is an evidence producer, **not a new source of architecture authority or a review/promotion engine**.

Deliver bounded, reason-coded proof: actual canonical rule ID → pinned governing source SHA → observed normalized import/path or source→derived dependency → exact HEAD and change scope → verdict/reasons/evidence links. Fail closed for UNKNOWN ownership, unsupported syntax, incomplete graph and source conflict. A clean fixture with explicitly permitted edges must pass. A generated/vendor exclusion requires positive owner policy, not a filename trick.

## Frozen source routing and blob fingerprint inventory

MUST_READ:
- `AGENTS.md` `492f1d4ae66abe8749a082d68decc81a3b4fd702`; `.engineering/SOURCE-HIERARCHY.md` `bedc10c97d28154efe59ff43fc1d175add37f568`.
- `.engineering/CHECKPOINT.md` `866d0fcef2253560a45a8dbca147d9cd451d0960` and `.engineering/CHECKPOINT.json` `af21419f47fc9f106abb49203b5b52c135a66ee1`: **STATE_CONFLICT**, no dependent execution.
- `.engineering/ARCHITECTURE.md` `5c2b44db3805dbd5329dc99a8a9b774360c4136a`, especially dependency direction and explicit forbidden examples around lines 251–268.
- `.engineering/SECURITY.md` `799206278e9f5bc02aec07c8e6d4489c530bb320`, `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md` `f3246fc074b450da986ad3dcda76f3d005dc8c6a`, `.engineering/DECISIONS-LEDGER.md` `569479a700f1956bdb2d97be30a27aaccf592b7e`.
- `.engineering/TEST-BENCHMARK-PLAN.md` `88768b891280e9b1e7ad752fec23f158e856c5ea`; frozen Scope/Requirements/DoD and future admitted Work Order/Context Lock. Issue #398 original A1–A7.
READ_IF_TRIGGERED:
- `packages/source-pack/src/public.ts` `e4ae465e2445f4728192e4adc6940a4452a861b9`: M09 `resolveAuthority`, `computeDriftShockwave`, `RequiredState`, `IntegrityState` and source proof ownership; use rather than fabricate Source Hierarchy.
- `packages/preflight/src/change-impact.ts` `5aff784c3f68e295a9b6a98ef4086d324a69fb54`: `classifyChangeImpact`, `normalizeChangePath`, risk/profile owner; no independent risk downgrade.
- `packages/contracts/src/work-order.ts` `9a665ae1a4dff817349d48d799dfaa105eb5aff8`: versioned strict path/WO contract `parseWorkOrderContract`, `resolveWriteAuthority`.
- `packages/task-context-compiler/src/s07-tiered-context-lock.ts` `2e03843a8bf24582e50f1a58add82598e69f8ab0`: `compileTieredContextLock`; source expansion from risk, never suppress missing canonical authority.
- `packages/assurance-pipeline/src/gef-gate.ts` `aaafa732305f20c4738429a8b6e29879d2156819`: `decideGefGate` and immutable GEF Gate receipt false for rule relaxation/checkpoint promotion/release.
- `packages/AGENTS.md` `fa14a7eb190d722382507402f12d82a72a934237`; `tests/AGENTS.md` `b08e069681f685c2cd8a567cc0cb5a837583bb78`; actual import/tsconfig/package exports and generation config once future scope triggers them.
- #427 WO-032 Schema Registry and #429 WO-034 app contract safety only IF **separately admitted**; their current issue proposals are NOT frozen product law.

## Rules and explicit authority non-overlap

1. **Architecture-derived examples (not automatically machine active):** forbid core → GitHub implementation models; core → CLI; kernel → model vendor; canonical schema → adapter implementation; assurance-verdict logic → UI renderer. The frozen preferred direction (operator/adapter → orchestration → contracts/policies → primitives) is *guidance*, not authority to fail every reversed import. Materialize only the subset with confirmed actual package boundary/owner and separately governed rule ID + exception policy.
2. Behavioral prohibition of reconstructing semantic decisions from operational SQLite/cache cannot be proven by imports only; it needs focused contract tests/actual behavior ownership, with separate admission.
3. **Parser:** resolve TS imports/exports/require where in scope, type-only imports, aliases, `package.json exports`, project references, real normalized path and package ownership. Do not pretend `tsconfig.references` alone is the import graph; it is insufficient. Unsupported syntax or truncated repo enumeration = `UNKNOWN/BLOCKED`, not PASS.
4. **Path safety:** match across case-fold and symlink/path alias where supported and detect renames/moves/forbidden transitive paths when rules specifically include transitive edges. Do not silently discard unknown slash/case policy or generated paths as out-of-scope.
5. **Source drift:** bind canonical source blob/approved rule + dependent generated artifact fingerprint and actual source-to-output relationship. Re-evaluate only changed dependency closure when provable; all invalid or missing authoritative sources/ambiguous supersessions block the dependent analysis. `DRIFT` is descriptive and **does not** itself rewrite canonical Architecture or checkpoint.
6. **Vendor/generated exclusions:** generated directories and dependency/vendor roots are excluded ONLY if explicitly declared in admitted profile/path facts with owner/fingerprint, with negative tests ensuring forbidden first-party source cannot masquerade as generated/vendor.
7. **Outputs:** bounded, versioned, sanitized machine evidence; immutable source/head/rule IDs, exact import site/edge, rule origin, affected dependent artifact, clear reason code/remediation. No secrets, unbounded logs, hidden network or write side effects. This output is *proposed*, not an effective schema until separate contract admission.
8. **Future compatibility:** #427 internal schema compatibility metadata and #429 app public-contract compatibility may later enrich checks; do NOT mistake them for currently promoted mechanics or conflate structural drift with semantic API BREAKING classification.

## PREPARATION-ONLY write boundary

Exactly these **three** documentation files, only on this planning branch:
- `.engineering/work-orders/GBS-MOD-WO-004.md`
- `.engineering/planning/GBS-MOD-WO-004-DRIFT-RULES.md`
- `.engineering/context-locks/GBS-MOD-WO-004-PLANNING.json`

**FUTURE IMPLEMENTATION WRITE_ALLOWED = NOT_ASSIGNED.** No implicit `packages/**`, `tests/**`, CI/workflows, toolchain or fixture rights. Frozen Architecture, Requirements, Security, Source Hierarchy, checkpoint pair, ADRs, branch protections, npm/release and Git history are all forbidden to this preparation. Risk and actual source impacts must be separately authorized in a new effective WO/lock. CI workflow changes are privileged, **not** magically authorized by a STANDARD docs plan.

## Acceptance A1–A7 preserved from Issue #398

A1. An **actual forbidden** dependency edge fails deterministically with rule, owner, import path and exact source binding. Fixture: real package boundary, unambiguous import; report rule ID.
A2. An explicitly allowed edge passes. Fixture: correctly scoped kernel → contracts reference and other approved package edges, but actual import ownership must be verified rather than inferred from TS references.
A3. Case/path alias, scoped transitive/indirect edge, symlink, rename and normalized path mismatch **cannot** evade relevant rules; for unsupported filesystem resolver, output UNKNOWN/BLOCKED.
A4. A changed canonical source invalidates only dependent generated docs/manifests where dependency closure can be proved; missing source or unsupported registry remains STALE/UNKNOWN, never silently update fingerprints.
A5. Unrelated documentation changes do not trigger broad Architecture scan/loading where affected graph is provably disjoint, without skipping Security/DoD floors required by target risk.
A6. Generated/vendor surfaces are excluded ONLY by explicit canonical project policy and never by arbitrary `generated` name, folder masquerade, path traversal or symlink.
A7. Unknown owner/dependency/registry/generated classification is BLOCKED/INDETERMINATE, **never false-green, never automatic code deletion**.

Negative suite additionally covers interrupted graph collection; mixed doc+code; stale HEAD/base after preflight; mismatched source lock; unknown rule ID; missing canonical ADR; same import under a renamed package; duplicate alias; type-only forbidden edge; conflict between generated policy and real file owner; mutation of source between analysis and reporting; excluded vendor path hiding first-party source; non-portable path.

## Future implementation dependency order and validation

F1. Obtain separate Owner admission of precise rule IDs and current Architecture meaning, exact package owners, risk and `WRITE_ALLOWED` on real `main`; compile/effectuate a **new** implementation lock. **No change while CHECKPOINT parity conflict remains**.
F2. Codex implements deterministic import resolver and versioned frozen-source rule registry with focused A1–A3/A6/A7 negative tests (only admitted paths).
F3. Codex implements source→derived drift binding and invalidation A4/A5, with impact-triggered test selection. No bypass of canonical GEF Gate.
F4. Full required static/unit/integration/integrity/security and cross-platform/risk-assurance CI at exact candidate HEAD; record raw run IDs, non-Green UNKNOWN; owner review NOT_INDEPENDENT plus independent specialists if Security demands them.
F5. Separate protected integration, postmerge true `main` checks, DoD proof and separately governed checkpoint promotion. No premature module credit. No automatic cleanup of probable/unknown unused code.

**Planning STOP:** `GBS_MOD_WO_004_ARCHITECTURE_DRIFT_PLANNING_READY_FOR_EXACT_HEAD_AUDIT_NOT_ADMITTED`.
**Future implementation STOP:** `GBS_MOD_WO_004_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`.
