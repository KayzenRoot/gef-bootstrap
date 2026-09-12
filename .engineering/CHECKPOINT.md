# Checkpoint

Status: `READY_FOR_GBS_M03_S02`

- Project: GEF Bootstrap
- Phase: `PRODUCTION_CONSTRUCTION`
- Completed modules: `GBS-M00`, `GBS-M01`, `GBS-M02`
- Active module: `GBS-M03 — Project Identity`
- M03-S01 Project ID: `FROZEN`
- M03-S01 PR: `#61`
- M03-S01 reviewed head: `6953628689716fcb776ddc5edaca4dba1cb0fbf8`
- Main after M03-S01 merge: `cab91034569da430e29fdf17a12b0738de20cb03`
- Next module/session: `GBS-M03-S02 — Fingerprint`
- Main production denominator: `1088 WEIGHT POINTS`
- Earned production weight: `53 WEIGHT POINTS`
- Remaining production weight: `1035 WEIGHT POINTS`
- Official audited overall completion: `4.87%`
- Official audited remaining: `95.13%`
- Denominator change: `NONE`
- ETA: `NOT_YET_RELIABLE — insufficient completed implementation-module velocity sample`
- Current canonical branch: `main`
- Next legal stage: `GBS-M03-S02`
- Stop state: `READY_FOR_GBS_M03_S02`

## M03-S01 outcome
Project identity is frozen as a bare lowercase RFC-compatible UUIDv4 stored as the mandatory M03-owned `projectId` field in tracked `.gef/project.json`. It is opaque, local-first, stable across path/provider/machine changes, preserved by ordinary clones/backups, immutable during normal operation, and changeable only by an explicit S04 rekey operation. Legacy adopted projects missing identity enter `IDENTITY_BOOTSTRAP_REQUIRED`; identity is never guessed or silently generated.

## Planned executor benchmark
The user approved a future controlled benchmark comparing ChatGPT-connected-tools construction against Codex-assisted construction after M03 or M04. The current constitutional rule `codexForBootstrap = PROHIBITED` remains binding until a governed temporary benchmark exception/ADR is explicitly prepared and frozen. Do not invoke Codex before that gate. Benchmark dimensions should include wall-clock execution time, model tokens, repository searches/files read, correction rounds, test/CI outcomes, escaped findings and evidence quality.

## Continuity contract
Every material milestone/review/merge or chat transition leaves both human-readable and machine-readable checkpoints. Chat history is never the sole continuation authority.

## Do not redo
Do not reopen M00-M02 or M03-S01 without governed change control or invalidated evidence. Do not use Codex for this repository until the planned benchmark exception is formally admitted. Do not alter the frozen denominator without governed recalibration.

## Resume instruction
In a new chat, `continue do chat anterior` means read `.engineering/CHECKPOINT.md`, `.engineering/CHECKPOINT.json`, frozen Source Pack, M03-S01 contract and Master Module Index. Resume at `GBS-M03-S02`. Report `4.87% complete`, `53/1088 earned`, `1035/1088 remaining` unless a newer audited checkpoint changes it.

STOP CONDITION: `READY_FOR_GBS_M03_S02`.
