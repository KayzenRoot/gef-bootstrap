# GEF V1.2 — Remaining Engineering Gaps and Priority Research Audit

**Status:** Noncanonical proposal audit, not the final V1.2 Scope/DoD. Owner asked what else should be explored before closing the idea-gathering phase, especially accelerating complete app delivery, defect prevention, Web3 and games. This audit records what's still underexplored and proposes bounded decisions. “Candidate necessary” below means recommended for discussion, not OWNER_APPROVED or a guaranteed new module. No version progress percentages or delivery ETA invented before future M21/M22 release baseline.

## Critical open gaps that merit further exploration BEFORE feature freeze
### GAP01. Independent assurance of high-risk code and contracts (must address in admission)
Code generation and fast automated tools still miss design, economic and deployment errors. Specify exactly when independent qualified human smart-contract/game economy/security review is mandatory, what proof constitutes review and what no-deploy decision happens when unavailable. An LLM cannot self-certify its smart contract production safety. Test assurance itself by seeding known severe flaws and stale/misbound review SHA.

### GAP02. Reproducible dev/CI/test/profile environments
Native compiler, JS dependency graph, browser/font/GPU/game engine export, Rust/Anchor/Solidity compiler, local fork block, disposable game server and data fixtures must be pinned per profile. Set no-paid, Windows/Linux/macOS and limited local CPU/GPU behavior. Without reproducibility, incremental test-proof caching becomes unsafe and user-observed preview cannot be reproduced.

### GAP03. Credential, key and privileged-operation protection
Secrets scanning of repository and build is insufficient if code tools can perform unintended RPC, wallet signing or mainnet writes. Develop a bounded capability/consent map: read-only repository planning, disposable local simulated writes, isolated CI secrets, explicit deployment environment approval, hardware-backed/multisig signer where appropriate. Never ingest private keys/seed phrases in GitHub issues or ChatGPT. Verify domain-specific dangerous actions require explicit owner signoff and cannot be triggered by prompt injection in repo text or dependency docs.

### GAP04. Capacity, CI cost and realistic hardware profiles
Measure the actual production bottleneck across interactive design, Codex, repository checks, browser installs, compilation, contract fuzzing, multiplayer load and real previews. Track wall-clock and CPU/CI cost by app profile; compute net useful accepted functionality/hour and escaped-bug cost. Create a no-SaaS baseline using reproducible fixtures, then pilot premium capabilities only if objectively justified. Benchmark local CPU/GPU memory limits before building an enormous always-on test matrix.

### GAP05. Post-release customer feedback to test trace
Operations research covers signals but needs evidence-safe triage loop into actual issues: privacy-safe minimal reproduction, confirmed causal linkage to exact release SHA, risk severity, regression test, measurable reopened work and user-facing status panel. Do not confuse correlated telemetry with deterministic cause or disclose PII in reports.

### GAP06. SLO, error-budget and production readiness per app type
One universal “100% green” gate is inadequate for MMO capacity, wallet transaction finality, data consistency or mobile game frame pacing. The owner approves objective SLOs and app-specific tolerances before tests, with launch canary/rollback and monitoring that actually enforce them. The final user-defined DoD remains the authority; a local single-player game must not inherit cloud-hosted MMO ops.

### GAP07. Cross-profile legal/license/export and business model scope
Before shipping game+Web3: asset ownership, open-source engine licenses, asset generation rights, personal data handling, user consent, token/NFT sale and financial/wagering regulatory questions vary by jurisdiction and business model. GEF should flag legal review needs and evidence/doc owners rather than asserting jurisdiction-specific compliance. Do not hardcode unverified geographic/legal judgments.

### GAP08. Human-centered operator UX and fast decision cadence
A complex system can become slower through long interviews/status walls. Trial one-screen compact reporting, multi-answer voice/text interview batches, Source Pack drafts before deep probing and a “what decision is blocking progress?” queue. A future installer must be fully versioned, reversible and provide a real usable sample app, not just dozens of generated Markdown files. Track repeated questions and time-to-first-playable/first-usable journey.

## Additional optional experiments to consider, NOT all v1.2 commitments
R01 Contract model-checking/formal proofs for high-value EVM or Solana critical invariants after cost/benefit pilot; optional Halmos or qualified commercial prover, human-authored specs. No general “formally verified” claim from a bounded symbolic test.
R02 Differential engine/client replay on supported MMO renderer/network upgrades; reference canonical server trace under old and new build plus precise intentional behavior changes.
R03 Chaos/load on game sharding and RPC/indexer reorg: multi-player synthetic clients, shard handoff, datastore outage, replay protection and recovery; start with budgeted sample not huge paid servers.
R04 Secure dependency update bot policy: group low-risk updates; ABI/engine/Rust/solc/Anchor changes require compatible replay/regression, not mass automated merge.
R05 Native observability standards across GEF and target apps without a hosted permanent service, telemetry schema versioning, PII redaction and trust boundary.
R06 Design system + engine UI integration for reusable menus/HUD/controller across game/web product families, only if ROI proven and existing owner-approved game art stays intact.
R07 Profile version/upgrader and compatibility migration on existing repositories (brownfield): dry-run showing added dependencies/CI costs and rollback to original checkout; no silent migration.
R08 PR merge queue check of exact tested merge commit when several Work Orders interact; stale head checks must not be reused across merge base changes.
R09 Model/tool evaluations: compare Codex prompt profiles under same accepted Scope/DoD, avoid speculative paid frontier model upgrades or unsupported percentage improvements.
R10 Web3 audit-ready documentation: public ABI/signer/upgrade authority registry, transparent risk disclosure and economically justified anti-MEV/oracle/bridge assumptions for relevant protocols only.
R11 Game asset/legal supply chain: asset hashes, provenance/licensing approval, updated build manifest and deterministic import without storing proprietary font/model files in distributed artifacts.
R12 Installer security and resilience: clean offline/dependency download failure, partial install atomic recovery, profile dry-run and detection of unsafe PATH binaries.

## Owner-oriented freeze recommendation and bounded prioritization
**Do NOT put every experimental tool/engine/cloud integration into core v1.2.** Recommend a small universal shipped nucleus and conditional profiles with exact owner acceptance:
- Core candidate: coherent interview -> canonical scope/design -> critical-path Marathon WOs -> Codex code -> causally repaired impact tests -> qualified exact-head audit -> compact M20-M23 status/ETA -> installable verified starter/preview. This is the path to speed without losing traceability.
- Mandatory security gates conditional on behavior: smart-contract deployment protections for Web3 projects with real assets; network/economy/server authority testing for multiplayer/RMT games; migration/recovery proof for data-bearing apps; release exact-head tests for every accepted profile.
- Separate optional profile packs: first EVM + browser 2D with multiplayer (future pilot candidates), Solana/Game+Web3 extension after chain and asset architecture proven, deeper fuzz/formal verification, advanced observability, multiplayer scale and paid scanners only if representative ROI justifies.
- A future core v1.2 can ship with *documented* conditional profile contracts and validated reference pilots rather than requiring production-grade every-chain support and full MMORPG platform at the same time. Owner chooses core vs optional delivery boundary at WO-000.
- Any further research idea should include 1) missing concrete risk/user scenario; 2) existing mechanism it extends; 3) smallest reproducible baseline experiment; 4) acceptance/failure condition; 5) resource/cost/security constraints; 6) whether it blocks current core v1.2 or belongs to next extension. Unbounded idea accumulation without measured ROI is a threat to time-to-market.

## Proposed cross-domain pilot matrix before marking profiles ready
A. Tiny conventional web app (baseline) with accepted UI/login and exact-head review.
B. EVM dapp local disposable network, simple scoped asset contract and optional frontend, seeded reentrancy/role/storage/nonce cases and owner-gated testnet mock; NEVER mainnet.
C. Solana deterministic small Anchor program with LiteSVM/Mollusk, account/signer/PDA cases; separate adapter confidence not inherited from EVM pass.
D. 2D web game with one complete local playable loop, renderer/mobile frame samples, asset license/import and browser smoke.
E. Authoritative multiplayer game 2–20+ synthetic clients at measured approved budgets with trade/idempotency/lag/disconnect, accepted visual HUD and persistence tests.
F. Optional combined Web3 game, completed only after both standalone proof packs: onchain/offchain event idempotency and reorg/failure, user consent and game server authority.
For every pilot capture same profile-specific exact Scope/DoD, startup effort, cost, accepted journeys/contracts, material injected defects found, false positives, rework, sample/hardware, and final exact-head release proof. Do not rank performance across non-comparable populations.

## Current planning completion definition
A research document is RECORDED when versioned on isolated PR and indexed; verified file count only, not implementation % or V1.2 scope completion. Before final freeze obtain owner answers to unresolved key choices: (a) first supported Web3 chains; (b) first game engine/browser-first requirements; (c) multiplayer authoritative stack; (d) actual game-with-Web3 demand; (e) acceptable paid CI/devtool budget; (f) security threshold for independent contract audit and mainnet gate; (g) target end-to-end pilot and release-splitting policy.
No requirement to answer those NOW just to record proposal. Highest-impact next action after V1.1 acceptance: WO-000 baseline, source audit and targeted owner interview, then freeze only useful, proven candidate Scope. “Perfect” is not a measurable release gate; qualified quality and end-to-end delivery are.
**STOP:** remaining research gaps identified; implementation NOT AUTHORIZED.
