# GEF Bootstrap V1.2 — Game Factory, Browser-First and Multiplayer/MMORPG Profile

**Status:** RESEARCH / FUTURE CONDITIONAL DOMAIN PROFILE. The owner expects regular game development. No engine, game server, cloud account, asset-generation app or dependency installed now. Codex alone codes/tests/CI/asset-build scripts after an approved Work Order; ChatGPT conducts design interview, source planning and exact-head audit. Existing project's approved art/world bible, tech stack and lore retain canonical authority.

## 1. Detection and adaptive interview
Owner's explicit game brief, then approved Source Pack and true repo signals (project.godot, package Phaser/Babylon/Three, Unity/Unreal config, engine files, Colyseus/Nakama) select `GAME_2D_WEB`, `GAME_3D_WEB`, `GAME_GODOT_MULTIPLATFORM`, `GAME_MULTIPLAYER`, `GAME_MMO`, `GAME_WITH_WEB3`; these tags compose and are not a mutually exclusive ranking. Repo signals are HYPOTHESES, not owner decisions; preserve brownfield accepted engine. Do not infer Web3 simply because a game has an economy or tradable items.

Ask concise batches of the highest-impact missing:
- What genre, player fantasy, reference games, gameplay loop, art style 2D/2.5D/3D, camera and expected session length?
- Web browser-first, desktop/mobile/native, supported browsers/devices and minimum hardware; multiplayer mode, region/latency, concurrency target and hosting budget?
- Character/party/classes/progression, combat model, AI/autopilot, skills/abilities, persistence, world maps, quests and gameplay-critical systems?
- Expected players per map/instance vs total connected users, server-authoritative needs, game tick target, client prediction, anti-cheat and disconnection/reconnect policies?
- Monetization, economy sinks/sources, trading/RMT if any, admin authority, bot detection, refunds/moderation, player reports and incident response?
- Approved world/art bible, asset style/resolution/formats, animation, sounds, LOD and ownership/license; preexisting asset pipeline and integration (do not assume brand or tools)?
- Accessibility, HUD/UI, onboarding, keybind/controller/touch support, localization, comfort/motion options; target “playable” quality and concrete game pilot acceptance.

Outputs: approved Game Design Bible and scoped slice, World/Art Bible references without overwrites, gameplay state machines, authoritative trust boundary, netcode architecture, scene/asset import contract, capacity forecast hypotheses, game-specific DoD and bounded Codex Work Orders.

## 2. Engine and service decision matrix (conditional, no default blanket install)
- **2D / 2.5D browser-first:** Phaser + TypeScript, component/state architecture and editor/assets selected to project needs; Phaser is 2D first. Browser rendering/perf test on actual targets. Source: https://phaser.io/tutorials/getting-started-phaser3 .
- **3D browser-first:** evaluate Babylon.js or Three.js (renderer) with explicit ECS and physics requirements rather than assuming a 3D engine has MMORPG server logic. Test WebGL/WebGPU fallback and GPU texture/memory budgets on target browsers.
- **Godot:** GDScript for Godot 4 web candidate; currently official Godot 4 C# web export is unsupported per Godot documentation. For Godot 4 web, prefer tested single-threaded export where supported and measure cross-origin isolation need before enabling threads: https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html . Godot native supported separately.
- **Authoritative Node/TS multiplayer:** evaluate Colyseus with rooms, matchmaking and server-controlled synchronized state, authoritative delta and optional reconciliation. API/feature version may change; pin and pilot: https://docs.colyseus.io/ .
- **Backend/social/MMO services:** evaluate Nakama open-source for players/social/chat/matchmaking/leaderboards and configurable server-authoritative matches. It does NOT provide a ready-made MMO world, guild economy or all game rules; these remain the game's server/domain responsibility: https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/ .
- **Other existing engines:** Unity/Unreal/Defold and their build/CI adapters only for matching projects. Avoid migrating approved code just because GEF has a more convenient starter.

## 3. Proposed first-party game engineering mechanisms
G-01 Game Loop Contract Compiler: translate approved gameplay loops/states/transitions into deterministic tests of input, effects, cooldown/animation contract, failure paths and save continuity. Proof obligations trace into GEF existing requirements/proof graph.
G-02 Server Authority and Anti-Cheat Sentinel: trust boundary client intent -> authenticated server validation -> canonical state; check speed hacks, teleport, duplicate attacks, inventory writes, time manipulation, client-crafted economy transactions, cross-user IDOR. A client can predict visuals but never authoritatively credit valuable items/money/XP.
G-03 Multiplayer Network Lab: network emulator (latency/jitter/loss/out-of-order/duplication/disconnection/reconnection), replayable deterministic or bounded simulation, 2/20/100+ synthetic client load as actual risk/CPU permits, tick drift, interpolation/prediction correction and persistent snapshot consistency. Set game-specific latency/tick goals from owner and measured target, not arbitrary universal FPS.
G-04 MMORPG Persistence/Economy Guardian: property tests for item conservation, no unintended duplication or loss, currency mint/burn/sinks, trade atomicity, escrow, auction, idempotent reward, rollbacks/reconnect, inventory permission, data migrations and disconnected shard transactions. Fraud/RMT protections only when approved/legal and supported. Simulated economic abuse and sink-source balance are model-driven and may require product owner economic judgments.
G-05 World and Asset Pipeline Compiler: asset registry, canonical IDs, import format/metadata/rights, content-hashed sprite/texture/animation/audio bundles, preview and deterministic build, sprite atlases/LOD/texture compression appropriate to target, missing reference and license scanner; incremental changed-asset rebuilds. Existing approved asset creation system is an optional adapter, not rebuilt inside GEF.
G-06 Frame/GPU Budget Sentinel: measure actual low-percentile FPS, frame pacing, CPU main-thread, GPU draw calls/overdraw, texture/VRAM and download size on representative hardware/browsers and game scenes. Visual regression snapshots in stable renderer environments; don't flag artistic subjective differences as machine pass/fail.
G-07 Game State Replay and Regression Harness: store privacy-safe seed, input event sequence, deterministic world snapshot and game build version for reproduced defects; verify old recorded failure first then corrected build. Use authoritative server state for competitive replay, not untrusted client assertions.
G-08 Live World Load/Shard Planner: for MMO, plan regional capacity, interest management, visibility radius, instance/zone ownership, handoff between zones, hot-shard recovery, persistence and failure isolation. Pilot small reproducible target before scale claims; no “millions of players” by copying SaaS marketing.
G-09 UI/HUD Accessibility Factory: reuse GEF UI-UX Design Factory but add game menu/HUD/gamepad/touch/key remap/chat moderation/localization/readable scalable fonts and reduced motion, focus handling and app pause/resume.
G-10 Security and Live-Ops Guard: safe admin permissions, server logs with redaction, moderation/reporting, ban/unban audit, feature flags, event scheduling, asset hot updates, rollback when recoverable and economy/abuse alerts without collecting unnecessary player PII.

## 4. Game-specific validation strategy
A. PRECODE: accepted gameplay vertical slice, asset/reference provenance, target platform performance and approved architecture. A screenshot/mock isn't a playable game.
B. FAST LOOP PR: compile, lint/typecheck, representative engine smoke, deterministic state machine examples and owner-approved server-side gameplay invariant fixtures, asset-hash validation and any changed scenes.
C. IMPACTED INTEGRATION: one complete playable journey login/character/create or spawn -> act -> receive reward -> persist -> disconnect/reconnect, with actual server where relevant; relevant client/network E2E.
D. ADVERSARIAL: 2-client duplication/parallel trades, forged client messages, stale snapshots, packet loss/jitter, reconnect and malformed assets; security/anti-cheat failures are blockers if in scope.
E. PERFORMANCE: representative scene/device FPS and memory, synthetic multiplayer load if in scope, asset bundle size and network bandwidth with explicit sample/config. Separate local measured data from inferred cloud capacity.
F. RELEASE: cross-target export and installation, supported browser/GPU checks, save/backward compatibility, security/admin hardening, large release-relevant load proof and actual “playable” smoke by owner where required. Massive load test not rerun after each trivial UI typo if evidence validity permits.

## 5. Performance/scope economics
Prioritize a complete VERTICAL GAME SLICE over all game systems as horizontal mocks. For MMO use milestone ladder: offline core loop -> authoritative 2-player scene -> 10–20 client controlled test -> first persistent zone, guild/economy service -> approved load matrix; exact levels depend on requirements and budget. Only accepted scope counts toward release percent. Advance staged performance targets after proving baseline on actual available local/CI hardware. Optional GPU-intensive asset production runs outside essential core CI but exact asset availability/license checks remain.
Local-first and budget-sensitive: default no paid game cloud or proprietary marketplace assets. Engine/service licenses and deployment costs must be checked before packaging a customer deliverable.

## 6. Combined GAME_WITH_WEB3 opt-in
Default: all moment-to-moment movement/combat and ordinary state remain OFFCHAIN and authoritative where anti-cheat matters. Onchain operations only for owner-approved asset ownership/settlement/claims, with explicit finality, transaction failure/retry, custody and gas affordability. Do not embed a signature approval inside a normal fast gameplay tick. Economic ledger reconciles offchain game inventory with finalized chain events, idempotent mint/burn/bridge and replay-safe events. An onchain asset owner must not automatically gain unrestricted server admin/player authority; preserve exploit and fraud boundaries. See `WEB3-FACTORY-PROFILE.md` and `DOMAIN-ROUTER-AND-HYBRID-PROFILES.md`.
No forced token/NFT for games where blockchain does not deliver a justified product requirement.

## 7. Candidate install/CI runbook, not executed
- Phaser app only: pinned project TypeScript/Phaser; real browser Playwright smoke if admitted, visual tests per designed state. For multiplayer add a pinned, disposable Colyseus test server and fake clients only if approved.
- Godot app: current compatible editor/CLI and export templates, explicit rendering/WebGL constraints. Validate web export on declared browsers; never use an unsupported Godot C# web path.
- Nakama pilot: pinned container image/digest with local disposable datastore and isolated test runtime; contract for rules/roles/session must be written and tested, not inferred from social API.
- All engine/dependency installs and CI implementation performed solely by Codex under future admitted Work Order. No unnecessary global toolchain for GEF projects that are not games.

## 8. Evidence and trial benchmarks
At pilot: small browser game and one small authoritative multiplayer fixture (with persistence and adversarial client), plus brownfield import whose approved engine survives unchanged. Measure accepted playable gameplay goals per executor-hour; build times, number of reproducible defects, latency percentiles, frame p95/low-percentile behavior, memory, asset size, per-instance capacity, unexplained visual revisions and security incidents. Compare with identical V1.1 workload/DoD and include cost and hardware constraints. Quality regressions invalidate a proposed speed claim. Experimental tools remain SHADOW without ROI.

**STOP:** document only; no game code, deployment, massive test cost or browser preview claimed before implementation/actual testing.
