# GEF Bootstrap 1.2 — Candidate Definition of Done and Release Evidence Gates
Version: GBS-V12-CANDIDATE-DOD-001 | 2026-09-29 | State: PROPOSED, NOT AN APPROVED CANONICAL DOD OR A PASS RECEIPT.

## Governing acceptance principle
This document translates the owner's completed idea collection into observable tests, evidence, fail-closed gates and explicit profile scope. Future WO-000 must compare it against released V1.1 implementation, canonical Source Pack and actual approved Scope before accepting anything. Preserve Codex-only code/test/CI/migrations, ChatGPT architecture/planning/exact-head audit, independent HIGH_ASSURANCE review where required and owner-only privileged deployment approvals. No reference here asserts a feature is already implemented, pass-green or due by an invented date.

## GATE G0 — Version/source truth (required before future V1.2 coding)
- Verify exact V1.1 production acceptance and correct merge/release ancestry, latest relevant checkpoint and decision/ADR ledger. Do not rely on old PR #278 history, candidate branch docs or stale screenshots as release proof.
- Diff actual V1.1 implemented engines and release test proofs against V12-CANDIDATE-SCOPE-FREEZE.md. Eliminate duplicates and select per-proposal delta. Separate REQUIRED universal core, conditional chosen-profile requirements and nonblocking experimental candidates.
- Issue approved V1.2 Source Pack scope/architecture/security/test/DoD/adoption ADR + project-lineage denominator epoch, owner consent and current Context Lock. V1.1 remains unchanged by future V1.2 work.
- Freeze representative comparable V1.1 baseline apps, deterministic defect fixtures, environment and security floor; record performance, false positives and total actual operating costs before optimization.
FAIL CLOSED on missing V1.1 receipts, unknown current interfaces, unresolved protection changes or test baseline gaps.

## GATE G1 — Complete universal interactive workflow
- New project from owner's 1-line idea: profile selection + 5-7 tailored unanswered questions per batch + record approved decisions/assumptions/open questions + canonical Scope/DoD/requirements to proof + app-aware minimal architecture + security classification and meaningful UX design if relevant. Brownfield repo retains approved stack/ADRs/art/design until owner-approved change. Show the top blocking decision rather than interrogating every possible SaaS/Web3/game capability.
- Owner-approved UI project: approved design direction, sitemap/wireflow, versioned semantic tokens, representative small/large viewports, usable interaction/loading/error/empty/auth states and accessible keyboard/focus contrast proof according to project DoD.
- Installable versioned startup profile: automatically executes the agreed operator workflow after actual local setup; supports explicit opt-out/upgrade and no unwanted cloud services, mainnet signer or paid tools. Verified supported OS matrix, lock/tool checksums, realistic local resource and network-unavailable recovery.
- One approved representative complete vertical app journey works on true target preview/localhost with relevant auth, data, UI, backend, security, deploy/recovery. A conceptual mock, README or unrun scaffold is not acceptance proof.
FAIL on repeated known-answer interviews, unapproved design/stack change, installer requiring undocumented manual master prompt or broken real end-to-end journey.

## GATE G2 — Accepted-progress and forecast semantics
- Current project's M21 validated accepted work weights and fixed denominator epoch only. Report accepted/remaining work and modules/Work Orders/PRs by authentic status, not code lines/issues or draft-doc count. Distinct milestones and historical version baselines, no double counting or misleading rolled-up percentage.
- Current M20 default compact pt-BR response on each substantive development turn shows project/release/status/known evidence SHA/time, progress, open material defects/checks, what changed, blockers and the next legal Codex or owner action. Deep report for actual audits/releases or explicit user request, not every simple update.
- M22 may issue empirically supported comparable-cohort bounded estimation only when its real baseline sufficiency policy accepts independent samples; where insufficient return NOT_YET_BASELINED and state next measurement. Never derive calendar ETA from executor effort without available actual capacity/dependency assumptions. Scope/HEAD/evidence drift invalidates stale forecast.
- M23 is the status authority and does not treat an unmerged implementation PR or all green PR-only checks as RELEASED.
NEGATIVE TESTS: new Scope epoch, stale evidence after new commit, previously closed issue reopened, missing CI result, unavailable connector, only 0/1/2 independent valid temporal samples, unrelated Web2 samples used for EVM or MMO ETA and V1's historical 1088/1088 shown as V1.2 completion must all be handled honestly.

## GATE G3 — Faster Codex delivery without lowering quality
- Context-bound dependency DAG compiles from approved Source Pack into bounded multi-wave, issue-backed Codex Work Order: exact source/head/lockfile/decision fingerprints, predicted touched paths and ownership, acceptance links, intermediate stable commits, checkpoint receipts, failure and resume conditions. Unrelated domains never lumped into one unreviewable PR.
- Codex alone writes/revises implementation, tests, CI, build and migrations. ChatGPT prepares planning issues/docs, audits independent exact candidate SHA and requests only necessary corrections. Checks cannot be spoofed by generated text or old-source passes.
- Cheap high-signal fast path: validate source/AST/static/type/unit+changed-risk tests first; impact dependency graph conservatively includes dynamic/indirect changes. Reuse build/test receipts only for matching source/env/lock/graph/scope/policy fingerprint. Shadow compare selective and broad; any missed HIGH/CRITICAL demotes optimized skip path until root cause corrected.
- Causal repair: store first reproducing error/seed, apply narrow correction through Codex, rerun impacted tests/risk closure, cap repeated retries, escalate on inconclusive/flaky behavior. Flake quarantine excludes required checks and expires under explicit policy.
- Compare against true released V1.1 fixtures under same accepted Scope/DoD and risk classification: effective elapsed/CPU/CI, accepted complete journeys or contracts per executor-hour, real defects escaped or seeded caught, errors from repeated full builds, costs and audit/owner rework. A faster run with unacceptable quality regression FAILS; no unsupported blanket % gain.
FAIL on passing old SHA, missing mandatory checks, stale Graph or unapproved codemod/framework/cloud service.

## GATE G4 — Profile-aware extension capability
Actual released profile labels must reflect actual successful pilot evidence, not just research docs or a UI checkbox. All conditional packs start DISABLED unless owner-confirmed project requirements and supported toolchain are checked.

**WEB/API/data:** valid contract and compatibility examples; targeted adversarial tests if risk warrants, approval-linked UI state and accessibility proof, actual sandbox DB migration/recovery, tenant isolation where data-bearing. No forced browser runner on a headless library.
**SaaS subscriptions/metered:** owner-defined provider country/currency and pricing, real provider sandbox: signup->plan->successful/failed/cancelled payment->entitlement, upgrades/discounts/proration/trial, refunds/dunning and accurate invoices, idempotent signed duplicated/out-of-order webhooks and late usage. Assert customer-specific usage quotas/AI COGS and tenant-negative tests. No real card collection in CI or unsupported automatic tax compliance claim.
**Money-moving SaaS/marketplace:** admitted separately only if necessary. Full per-currency balanced append-only postings, unique business event idempotency, atomically authorized credits/debits, causally linked provider movements and independent settlement reconciliation. Partial refund/chargeback, delayed payout, concurrency, ledger restoration and permission abuse synthetic failures. Elevated review and responsible specialist approval for applicable legal/payment obligations.
**EVM Web3:** disposable local chain or approved testnet only for automated steps, pinned compiler/ABI/contracts/dependency versions, representative role/reentrancy/precision/nonce/replay/signature/chain tests, static scan and risk-specific Foundry fuzz/invariants/deep Echidna if relevant. If upgradeable, verify prior storage layout, initializer authority and governance; if immutable, never promise easy rollback. Key custody, independent audit and mainnet deployment separately authorized where value risk warrants.
**Solana Web3:** pinned supported Rust/Anchor/LiteSVM/Mollusk and focused signer/PDA/account-owner/CPI/upgrade/compute budget tests. Separate success receipt, never substitute EVM scanners.
**Web3 data security:** offchain minimal-PII encrypted records and correct tenant access/redacted logs; verify KMS/HSM or documented local equivalent key deny/rotate/revoke/restore, phishing-resistant typed transaction-intent and authority separation, privacy metadata/public-input threat map, secure RPC/key boundaries. ZK/Noir, FHEVM and attested enclaves remain EXPERIMENTAL until an independent requirement-specific synthetic pilot verifies efficacy, cost, confidentiality and maintained version.
**Game browser:** first genuine playable approved core loop, replayable state/scene and asset import/license, representative game UI/HUD and device/browser frame/memory/performance tests; don't call a screenshot a game. Engine and optional servers preserved on brownfield.
**Game MMO:** server-authoritative synthetic forged commands, packet loss/jitter/reconnect, concurrent trade/item economy conservation, persistence restore, test capacity at accepted hardware/CI budget, access moderation/admin evidence when Scope includes it. Single-player games don't get MMO load CI.
**Game + Web3:** only when game owner selected genuine onchain assets. Test game server and blockchain each independently, plus offchain reward/authorization -> wallet-sign -> local contract -> finality/indexer -> player inventory with retry/reorg/failure preventing double mint/credit or game-tick chain wait.
**AI-native targets:** only when target application uses model inference. Versioned task eval, prompt-injection/untrusted input boundaries, tenant data redaction, per-tenant cost budget, model/prompt regression and human approval for any money-moving tool action.
FAIL if a profile is advertised installed but lacks a real end-to-end pilot, misclassifies the user's existing stack or installs another chain/engine/payments dependency without benefit.

## GATE G5 — Cross-domain finance/Web3 operational safety
- Explicit event state machine distinguishes provider capture/settlement, private ledger posting, chain submission/finality and business entitlement activation; no “webhook received” implies actual fiat or onchain settlement.
- No one transaction replay, chain reorg/indexer replay or user retry can produce double-credit, duplicate NFT/item mint or cross-tenant access; deterministic failure/crash fixture with recovery and exception log.
- Public irreversible chains don't receive raw personal data or identifying hashes without a formal privacy threat decision; every commitment/ciphertext discloses residual metadata assumptions. Treasury/signer operations are separate from user wallet identity or coding CI credential.
- For elevated financial and crypto risks, owner-approved professional legal/accounting/security review and deployment controls must be evidenced, never automatically inferred. No automatic production/mainnet transfer, unsanctioned smart contract upgrade or destructive ledger correction.
FAIL on seeded tenant leakage, key in issue/log, unlimited signature approval silently accepted, irreversible real asset action without explicit consent, stale RPC state counted finalized or unreviewed custody claim.

## GATE G6 — Release evidence and app operations
- Candidate exactly tested source SHA and release/merge lineage, mandatory checks, architecture/Scope/DoD/ADR, external licenses/security/entitlement, build provenance where supported and actual isolated environment install/migration/upgrade/restore/rollback or approved roll-forward proof.
- Admitted end-to-end target app smoke/preview, accessible UI if present, profile-specific auth/data/chain/game assurance, useful observability, documented RPO/RTO and operational incident/contact instructions when relevant.
- No known unwaived mandatory CRITICAL/HIGH blocker. Lower risks require owner-assigned disposition and expiry where waiver allowed; observed security scanning alone never equals safe financial custody or formal third-party audit.
- Independent high-assurance review evidence from the required appropriate party for privileged deployments and real-value smart contracts where mandated; ChatGPT owner-account review is not rebranded independent specialist signoff.
- Explicit user-visible summary with accepted denominator, measured vs forecast stats, exact evidence SHA and STOP CONDITION; only then can real approved workflow promote V1.2's release and enable advertised profiles.
STOP CONDITION: any mandatory missing, unverified or stale proof blocks RELEASABLE status; publish partial proven core and keep unfinished domain packs unadvertised/FUTURE when owner explicitly approves that release boundary.

## Admission checklist for future WO-000 and owner handoff
[ ] V1.1 objectively released, source refs/checkpoint/decisions exact.
[ ] Candidate core/profile matrix deduplicated against real engines and tagged REQUIRED / CONDITIONAL_SELECTED / EXPERIMENT / DEFERRED / OUT_OF_SCOPE.
[ ] Approved canonical Scope, DoD, architecture, security, per-profile toolchain ADR and work denominator epoch.
[ ] First 2-3 reproducible representative baseline/pilot apps chosen, cost/hardware and risk floors accepted.
[ ] Independent finance/Web3 custody audit thresholds plus owner permissions/consents documented.
[ ] Source-locked Codex implementation WOs created, each with exact file paths/tests/evidence/release gates, and ChatGPT separate independent review schedule.
[ ] Installer/CLI versions and current provider/engine security/maintenance verified at future execution date.
[ ] No claim that research is installed, no progress percentage or ETA without verified evidence.

**STOP: CANDIDATE_ACCEPTANCE_SPEC_RECORDED_NOT_TESTED.**
