# Context Lock — GBS-MAINT-SEC-001

Status: LOCKED at admission; revalidate against actual PR head before audit.

- Repository: `KayzenRoot/gef-bootstrap` (public).
- Base ref / SHA: `refs/heads/main` / `72c17bd3e7e421790ac382022b1f0ebbb0275ea4`.
- Execution branch: `gbs/maint/sec-001-free-security-pilot`.
- Scope: new isolated security workflow and operator document; no alteration of production code or V1.1 release line.
- Work Order ID: `GBS-MAINT-SEC-001`.
- Source fingerprints (Git blob SHA at admission):
  - `.engineering/SOURCE-HIERARCHY.md`: `bedc10c97d28154efe59ff43fc1d175add37f568`
  - `.engineering/CHECKPOINT.md`: `78677f5aac573be8d6831963b396ba64a89372f7`
  - `.engineering/CHECKPOINT.json`: `0084244aa4ebc47d0f3ff2e8a25b4d6425e68c3f`
  - `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md`: `289d7cbe88a0682f3385dab6db60686ed9014bc7`
  - `.engineering/SCOPE.md`: `ce62e9823ebf040621652ff14363b055d38b9580`
  - `.engineering/DEFINITION-OF-DONE.md`: `d1833728b8dd2efed8d53064acfc6949c5bfc0d5`
  - `.engineering/TEST-BENCHMARK-PLAN.md`: `a7b5618ead1a483275a0b0e72126258523349f01`
  - `AGENTS.md`: `722ce876e05ff8d6f24d9c60794e0aa6be3c936c`
- Existing security workflow: `.github/workflows/security-codeql.yml` blob `885d14d6f19237f25c71720b2fd03e1f8ba1dd56`.
- Existing repository workflow: `.github/workflows/repository-validation.yml` blob `9b9fd588eb08b9556ffbfc9a7a1d13d0aa9a8ebf`.
- Existing dependency bot configuration: `.github/dependabot.yml` blob `db16797379522973a282f7470c9a598572e09f14`.

## Staleness rule
If main or any critical source fingerprint changes in a way relevant to the Work Order, mark this lock STALE and rebase/recompile before changes or approval. Do not overwrite intervening decisions. External service logins/installations remain OWNER-REPORTED until independently observable in checks or authorized dashboards.

## Verification
Before independent approval, record exact PR head SHA, workflow job statuses, existing required check statuses, scanner findings and operator-guide consistency in the PR evidence. No prior tests or historical 1088/1088 points establish acceptance for this new maintenance increment.