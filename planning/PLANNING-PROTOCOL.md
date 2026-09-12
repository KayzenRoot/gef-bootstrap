# Planning Protocol

## Unit of work
Planning proceeds one session at a time using stable IDs: `GBS-Mxx-Syy`.

## Lifecycle
`PLANNED -> IN_DISCUSSION -> DECIDED -> DOCUMENTED -> FROZEN`

## Rules
1. Do not pre-fill session conclusions.
2. A session may update canonical Source Pack documents only after the decision is reviewed.
3. Frozen decisions are not silently reopened.
4. Dependent implementation waits for the applicable planning and architecture decisions.
5. Checkpoint is updated after an approved planning increment.
6. New ideas are classified as NECESSARY, IMPORTANT, FUTURE, or OUT_OF_SCOPE before entering V1.
