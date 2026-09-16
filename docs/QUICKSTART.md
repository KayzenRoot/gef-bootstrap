# Quickstart · GEF Bootstrap V1.0.0

## 1. Verify the workspace
```bash
npm ci
npm run validate
```

## 2. Read canonical operating state
Read `AGENTS.md`, `planning/MASTER-MODULE-INDEX.md` and `.engineering/CHECKPOINT.md` before changing governed state.

## 3. New project path
Establish project identity, sources, scope/DoD and architecture. Create a bounded Work Order, lock context, run preflight, execute only admitted scope, capture evidence, review exact head and update checkpoint only after acceptance.

## 4. Existing project path
Treat the repository as brownfield: inventory existing files/history/config/CI, preserve unrelated user work, classify collisions, preview changes and only then mutate. Dirty/conflicted/unknown states are explicit and fail closed where safety requires.

## 5. Core lifecycle
`ANALYZE → SOURCE CHECK → WORK ORDER → CONTEXT LOCK → PREFLIGHT → EXECUTOR → TESTS/EVIDENCE → PR → AUDIT → CHECKPOINT → NEXT`

## 6. Evidence rule
Tests, workflow results and audits must bind the exact candidate/head. A plan, commit, PR opening or green historical run does not itself award production progress.
