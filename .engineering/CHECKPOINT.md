# Checkpoint

Status: `READY_FOR_GBS_M03_S04`

- Project: GEF Bootstrap
- Phase: `PRODUCTION_CONSTRUCTION`
- Completed modules: `GBS-M00`, `GBS-M01`, `GBS-M02`
- Active module: `GBS-M03 — Project Identity`
- M03-S01 Project ID: `FROZEN`
- M03-S02 Project Fingerprint: `FROZEN`
- M03-S03 Repository Identity: `FROZEN`
- M03-S03 PR: `#65`
- M03-S03 reviewed head: `3363f8ed9532f3fea545978f3d4e03f62119d6a0`
- Main after M03-S03 merge: `be856d71f139c85fa3ab44073a14bae261e91b81`
- Next module/session: `GBS-M03-S04 — Collision Prevention`
- Main production denominator: `1088 WEIGHT POINTS`
- Earned production weight: `53 WEIGHT POINTS`
- Remaining production weight: `1035 WEIGHT POINTS`
- Official audited overall completion: `4.87%`
- Official audited remaining: `95.13%`
- Denominator change: `NONE`
- ETA: `NOT_YET_RELIABLE — insufficient completed implementation-module velocity sample`
- Current canonical branch: `main`
- Next legal stage: `GBS-M03-S04`
- Stop state: `READY_FOR_GBS_M03_S04`

## M03 identity outcome so far
S01 freezes `projectId` as immutable project-lineage identity. S02 freezes a compact derived `projectFingerprint` with explicit binding strengths and targeted invalidation. S03 freezes repository identity as a provider-neutral structured binding: local-only repositories require an explicit persisted binding ID, formal adoption persists the selected remote binding, trusted provider-stable IDs are stronger equality anchors than locators when available, and provider-neutral core never guesses repository-path case semantics.

## Planned executor benchmark
The user approved a future controlled benchmark comparing ChatGPT-connected-tools construction against Codex-assisted construction after M03 or M04. The current constitutional rule `codexForBootstrap = PROHIBITED` remains binding until a governed temporary benchmark exception/ADR is explicitly prepared and frozen. Do not invoke Codex before that gate. Benchmark dimensions include wall-clock execution time, model tokens, repository searches/files read, correction rounds, test/CI outcomes, escaped findings and evidence quality.

## Continuity contract
Every material milestone/review/merge or chat transition leaves both human-readable and machine-readable checkpoints. Chat history is never the sole continuation authority.

## Do not redo
Do not reopen M00-M02 or M03-S01/S02/S03 without governed change control or invalidated evidence. Do not use Codex for this repository until the planned benchmark exception is formally admitted. Do not alter the frozen denominator without governed recalibration.

## Resume instruction
In a new chat, `continue do chat anterior` means read `.engineering/CHECKPOINT.md`, `.engineering/CHECKPOINT.json`, frozen Source Pack, M03 S01-S03 contracts and Master Module Index. Resume at `GBS-M03-S04`. Report `4.87% complete`, `53/1088 earned`, `1035/1088 remaining` unless a newer audited checkpoint changes it.

STOP CONDITION: `READY_FOR_GBS_M03_S04`.
