# GBS-MOD-WO-002 — GitHub-native Evidence Bundle and Audit Packet

**Issue:** #396; **program:** #393; **predecessor:** #394 GBS-MOD-WO-001, `GBS_MOD_WO_001_PROMOTED`.  
**State:** `PLANNING_CANDIDATE_NOT_ADMITTED`. No implementation authority.  
**Exact planning baseline:** `main@7ebd39fdce8906d963c9d4605ae16bce5e3b6d46`; preceding squash `be286dbd0174156c6965482cdbdf1b16c9237534`.  
**Admission:** separately explicit governed Owner decision PENDING; subsequent freshly compiled effective implementation Context Lock PENDING.  
**Risk:** Issue #396 initially planned `STANDARD`. **Conservative admission recommendation: `ELEVATED` (PROPOSED, NOT EFFECTIVE)** because this contract consumes untrusted hosted-provider evidence and will influence owner audit/acceptance decisions (Security T10: evidence/attestation forgery). This is not itself an authorized security or release change. On a future source-bound gate, escalate further to `HIGH_ASSURANCE` for secret/security-policy, provider mutation, independent specialist review or other higher-assurance impact; never downgrade on convenience. A separate Owner risk decision must admit the final tier.  
**Product credit:** NONE; V1 1088/1088, V1.1.2 stable, V1.2 3/10 unchanged.

## OBJECTIVE
Use GitHub/provider facts instead of executor prose to generate reproducible, versioned, exact-base/HEAD-bound Evidence Bundles and acceptance-to-proof audit packets for the Owner's review. GitHub remains evidence, never source of semantic authority. The collector must not issue APPROVED, promote checkpoints, merge, publish or accept Security risk.

## SCOPE — NECESSARY
1. Bind repository, owner, PR number, exact base/HEAD SHA, changed paths, effective WO/Context Lock digest and current required ruleset contexts.
2. Normalize read-only provider CheckRuns, Actions workflow/job/attempt metadata, status/security/coverage/test results, exact commit/blob identities and source links; use a provider-neutral deterministic core, no hidden network writes.
3. Define a strict, versioned packet/receipt schema containing source/collection identity, proof subject SHA, attempt and check identity, acceptance ID, evidence links, verdict and reason code. Redact tokens, raw secrets, credential values and bulk logs.
4. Map every acceptance criterion to independent, verifiable proof. Distinguish PASS, FAILED/BLOCKED, PENDING, NOT_VERIFIED, UNPROVEN and STALE. Never turn missing-provider data or AI prose into PASS.
5. Preserve required context identity independently of duplicate display names; handle reruns, duplicate/superseded check attempts and mismatched SHA with deterministic fail-closed logic.
6. Emit a bounded audit packet for actual scope/diff, authority, proof map, unresolved risks, unavailable optional review tools and PROPOSED_ONLY Checkpoint Delta; Owner audit remains NOT_INDEPENDENT.
7. Re-read/revalidate binding after HEAD/base/ruleset/lock changes. Avoid a second policy engine or expanding/weakening existing GEF Gate routing.
8. Test adversarial normalization, partial provider data, malformed payload, audit claim without proof, and no-go results, with deterministic reason codes.

## OUT OF SCOPE
Autonomous admission/review approval/merge/checkpoint promotion; changes to rulesets, CI workflows, secret scanners, token management, release/tag/npm, dependencies, CLI interface or unrelated profiles; WO-003 agent scheduling; paid provider-review dependency. Any read-only adapter must respect existing provider boundaries and Auth S0-S4.

## SOURCE ROUTING / MUST_READ
`AGENTS.md`, `packages/AGENTS.md`, `tests/AGENTS.md`; paired `.engineering/CHECKPOINT.md` and `.engineering/CHECKPOINT.json`; `.engineering/SOURCE-HIERARCHY.md`, `.engineering/ARCHITECTURE.md`, `.engineering/SECURITY.md`, `.engineering/REQUIREMENTS.md`, `.engineering/SCOPE.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/TEST-BENCHMARK-PLAN.md`, `.engineering/DECISIONS-LEDGER.md`, `.engineering/BACKLOG.md`, `.engineering/GITHUB-FIRST-CODEX-WORKFLOW.md`, `.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md`, #396, #393, #394 [authenticated push proof](https://github.com/KayzenRoot/gef-bootstrap/issues/394#issuecomment-6136485421).

**Brownfield implementation surfaces to inspect after admission:** `packages/evidence-engine/src/public.ts`, `packages/assurance-pipeline/src/public.ts` and `gef-gate.ts`, `packages/proof-graph/src/public.ts`, `packages/contracts/src/work-order.ts`, `packages/preflight/src/change-impact.ts`, `packages/task-context-compiler/src/s07-tiered-context-lock.ts`. Inspect the real current exports and tests before modifying symbols.

## WRITE BOUNDARY — CANDIDATE ONLY, NOT EFFECTIVE
**WRITE_ALLOWED only after separate admission and fresh effective Context Lock:** `packages/evidence-engine/src/**`, `packages/assurance-pipeline/src/**`, `packages/contracts/src/**`; `packages/proof-graph/src/**` only if minimal proof ownership is demonstrated; focused `tests/gbs-mod-wo-002-*.test.mjs`; necessary existing `tests/**` with exact justification; `.engineering/evidence/GBS-MOD-WO-002-*`, `.engineering/checkpoint-deltas/GBS-MOD-WO-002-*`; this Work Order and Lock for factual source/receipt binding only. These are candidate glob ceilings, not unconditional permission.
**WRITE_FORBIDDEN:** both canonical CHECKPOINT files during implementation, `.github/workflows/**`, scanner/ruleset/branch protection, `packages/cli/**`, dependency manifests/lockfiles, release/tag/publish/deploy, historical refs, unrelated V1.2 product/profile and generated/vendor paths. Expand scope only through explicit governed Correction Delta.
**Patch intent:** extend existing M24 Evidence, M25 Proof and M27 Assurance contracts; no parallel authority engine. New source files only under proven package ownership, with approval; actual Codex changes must stay inside admitted globs.

## FROZEN ACCEPTANCE (Issue #396)
A1 exact base/HEAD mismatch => STALE, never PASS.  
A2 required check missing/pending => NOT_VERIFIED/PENDING.  
A3 duplicate display name cannot satisfy a required context twice.  
A4 earlier-SHA rerun cannot prove newer HEAD.  
A5 executor prose cannot override raw provider evidence.  
A6 HEAD changes deterministically invalidate prior packet.  
A7 provider unavailable/denied => NOT_VERIFIED, never silent green.  
A8 acceptance criterion without proof mapping => UNPROVEN.

**Additional negative controls:** malformed/partial payloads, failover and retries, absent reviewer provider versus canonical required specialist review, ambiguous check IDs, ruleset drift, raw secret sanitization.

## TEST / ASSURANCE PLAN
Only **after admission**, Codex writes focused deterministic A1-A8 tests and adversarial failures, validates schema/verdict under malformed provider data and exact-SHA attempts, runs full required lint/build/typecheck/regression and GitHub required Repository Validation, Pipeline Integrity, Gitleaks/Trivy and risk-appropriate Windows/Linux/macOS checks. Capture exact head/run/job IDs, bounded redacted proof and negative controls. An Owner/ChatGPT comment review is NOT_INDEPENDENT, never a Security substitute.

## DELIVERABLES
Versioned contract, read-only collection/normalization, acceptance-to-provider-proof packet, negative tests, Evidence Bundle of exact-state provider IDs, proposed Checkpoint Delta (not effective), Portuguese owner audit with APPROVED/CORRECTION REQUIRED/BLOCKED and source-bound STOP.

## ADMISSION / STOP
WO-001 source/CI prerequisite is proven, but this document does not admit WO-002. Formal Owner authorization to admit exactly this scope/WRITE_ALLOWED/risk and a separately effective **current-main implementation Context Lock** are required. Do not ask Codex to implement from this planning file, or assume this planning PR can be merged without separate authorization.

**Planning STOP:** `GBS_MOD_WO_002_PLANNING_PACKET_READY_FOR_OWNER_AUDIT`.  
**Future admission STOP:** `GBS_MOD_WO_002_ADMITTED_AWAITING_FRESH_IMPLEMENTATION_LOCK`.  
**Future implementation STOP:** `GBS_MOD_WO_002_IMPLEMENTATION_READY_FOR_OWNER_AUDIT`.  
**Future promotion STOP:** `GBS_MOD_WO_002_PROMOTED`.
