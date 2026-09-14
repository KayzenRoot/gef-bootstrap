# GBS-M13 — Adoption Ledger Synchronization

Status: `FROZEN`
Module: `GBS-M13 — GEF Adoption Engine`
Planning merge base: `7254ad200ac0b5d51a6daf1be0204414862ae487`
Planning exact-head audit: `5195569395`

This governed ledger fragment synchronizes the frozen M13 adoption decisions and technologies without rewriting or renumbering historical central-ledger entries. Existing global entries `TECH-0012` and `TECH-0013` are adopted by M13. M13-native mechanisms use stable module-local IDs to avoid collision with historical global decision numbering already reused by constitutional/source-pack fragments.

## Decisions

### D-M13-01 — Adoption mode is explicit and project-bound
- Status: APPROVED
- Decision: GEF adoption uses only explicit `NEW_PROJECT`, `BROWNFIELD_INCREMENTAL`, `BROWNFIELD_GOVERNED_MIGRATION`, or `OBSERVE_ONLY` modes. Repository shape, age, file count, framework, timestamps, latest commit text or model confidence cannot silently select a mode.

### D-M13-02 — Brownfield adoption is first-class and progressive
- Status: APPROVED
- Decision: Existing projects may receive useful GEF governance incrementally by domain before complete normalization or historical cleanup. Brownfield is not a degraded new-project path.

### D-M13-03 — Descriptive and normative truth remain separate
- Status: APPROVED
- Decision: Existing code/tests/CI/repository state may establish descriptive truth; approved project sources establish normative truth by domain. Disagreement emits explicit drift and is never auto-resolved by newest-wins or file-order heuristics.

### D-M13-04 — Adoption has no independent mutation authority
- Status: APPROVED
- Decision: M13 may classify strategy, produce plans, mappings, receipts and promotion-readiness projections but cannot independently mutate filesystem/Git/provider state. Writes remain with M05/M06 and later Git/GitHub owners under admitted execution.

### D-M13-05 — Governance maturity is per-domain, not a global compliance score
- Status: APPROVED
- Decision: Adoption maturity is represented through a Governance Maturity Vector and Normalization Frontier. Partial adoption is normal and must expose governed, legacy, blocked and drifted domains explicitly.

### D-M13-06 — Legacy coexistence uses explicit bridges/membranes
- Status: APPROVED
- Decision: Legacy representations may coexist with GEF through exact, fingerprint-bound aliases/projections/adapters/acceptance records. Lossy mappings require explicit approval and do not silently become normative truth.

### D-M13-07 — Normalization is bounded, reversible where known and capability-driven
- Status: APPROVED
- Decision: Adoption increments optimize for the smallest safe governance delta needed to unlock a governed capability. Scope widening, unknown irreversibility and destructive cleanup fail closed or require a separately admitted migration increment.

### D-M13-08 — Adoption receipts unlock capabilities, not project completion
- Status: APPROVED
- Decision: M13 emits deterministic adoption receipts and capability-readiness projections. They do not replace canonical checkpoint/progress/evidence/assurance/release authorities owned by later modules.

## Existing technologies promoted into M13 semantics
- `TECH-0012 — Brownfield Truth Reconciler`: `FROZEN`, `NECESSARY`, owner M13.
- `TECH-0013 — Progressive Governance Envelope`: `FROZEN`, `NECESSARY`, owner M13.

## M13-native technologies
- `TECH-M13-01` Adoption Intent Capsule — `FROZEN`, NECESSARY.
- `TECH-M13-02` Governance Maturity Vector — `FROZEN`, NECESSARY.
- `TECH-M13-03` Adoption Safety Envelope — `FROZEN`, NECESSARY.
- `TECH-M13-04` Bootstrap Seed Graph — `FROZEN`, NECESSARY.
- `TECH-M13-05` Minimal Governance Kernel — `FROZEN`, NECESSARY.
- `TECH-M13-06` Bootstrap Provenance Chain — `FROZEN`, NECESSARY.
- `TECH-M13-07` Empty-State Ambiguity Detector — `FROZEN`, IMPORTANT.
- `TECH-M13-08` Legacy Compatibility Membrane — `FROZEN`, NECESSARY.
- `TECH-M13-09` Adoption Slice Planner — `FROZEN`, NECESSARY.
- `TECH-M13-10` Legacy Debt Quarantine — `FROZEN`, NECESSARY.
- `TECH-M13-11` Drift Resolution Ladder — `FROZEN`, NECESSARY.
- `TECH-M13-12` Normalization Frontier — `FROZEN`, NECESSARY.
- `TECH-M13-13` Compatibility Bridge Contract — `FROZEN`, NECESSARY.
- `TECH-M13-14` Semantic Equivalence Probe — `FROZEN`, NECESSARY.
- `TECH-M13-15` Progressive Normalization Budget — `FROZEN`, NECESSARY.
- `TECH-M13-16` Reversibility Index — `FROZEN`, IMPORTANT.
- `TECH-M13-17` Capability Unlock Matrix — `FROZEN`, NECESSARY.
- `TECH-M13-18` Adoption Proof Spine — `FROZEN`, NECESSARY.
- `TECH-M13-19` Governance Delta Receipt — `FROZEN`, NECESSARY.
- `TECH-M13-20` Adoption Regression Sentinel — `FROZEN`, NECESSARY.

## Deferred technologies
ML adoption recommendation, embedding-based legacy matching, graph database mapping storage, generalized bidirectional lenses and broad AST migration tooling remain FUTURE/IMPORTANT candidates. None are implementation dependencies for M13 V1.

## Ownership lock
- M00/M09 retain Source Hierarchy/source resolution authority.
- M11 retains product/intent decision authority.
- M12 retains Scope/DoD classification/evaluation semantics.
- M14/M15 own context/execution-pack compilation.
- M16 owns generic policy/guardrail runtime.
- M17/M21 own checkpoint/progress semantics.
- M24+ own evidence/proof/assurance layers.
- M29+ own Git/GitHub mechanics.
- M36 owns general recovery.
- M37 owns broader integrity policy.
- M44 owns audit-ledger mechanics.
- M51 owns exact runtime/platform compatibility.
- M62 owns production acceptance.

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.

STOP CONDITION: `M13_LEDGER_SYNC_FROZEN`.