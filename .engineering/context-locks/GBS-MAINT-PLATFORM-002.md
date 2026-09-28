# Context Lock — GBS-MAINT-PLATFORM-002

Status: LOCKED for the exact main base below. Revalidate remote refs before commit, owner audit, and merge.
Repository: `KayzenRoot/gef-bootstrap`.
Base ref/SHA: `refs/heads/main` / `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`.
Base tree: `5ebf9c846a9e0fd545a82e4a0e30a8ab91e03568`.
Execution branch: `gbs/maint/platform-002-scorecard-permissions`.
Work Order: `GBS-MAINT-PLATFORM-002`.
Authority: user-supplied master execution order; this is a single-repository, bounded Scorecard-finding correction.
Initial checkout: clean at the base SHA.

## Source fingerprints at lock

The following blob IDs identify the workflow sources inspected at admission:

- `.github/workflows/security-codeql.yml`: `3649772577b6c14a3cc9b2993589e2d40d6c9e7c`
- `.github/workflows/m08-platform.yml`: `cea9450ae114933b617c082e8b46590c28379ce3`
- `.github/workflows/m09-platform.yml`: `9483e34828d390810a47711ccb5358b3e2eba6ed`
- `.github/workflows/m41-m47-integrated.yml`: `a587e395850e130d438655692f86f24870fc0f23`
- `.github/workflows/m48-m54-integrated.yml`: `5eab8ef4baa3acaaa9b3b469434188f6621ed33d`
- `.github/workflows/m62-m63-final.yml`: `3fce160e50a989545c6f2e5413dd44982fde7d16`
- `.github/workflows/scorecard.yml`: `912137ce232acdc5e8ce871fbd472a90528d43fe`
- `.github/workflows/pipeline-integrity.yml`: `a711e9467bd4e4e348ab45f712e331b4c9197dbf`

## Live governance and baseline evidence

- GitHub operator: `KayzenRoot` (user ID `114633702`).
- Main ruleset `23566111` is active and unchanged; it requires PRs and the four existing status contexts. No ruleset edit is authorized here.
- Repository Actions default token setting is `default_workflow_permissions: read`; approving pull-request reviews from Actions is disabled.
- Scorecard run `36481787729` completed against `9c9170f98ee6385e11b2dbf8e1f7584222230cd8`; its report is stored in repository code scanning, with public API publication disabled.
- Active Scorecard Token-Permissions alerts at admission: #5–#10, as itemized in the Work Order and Evidence Bundle.

## Allowed changes

Only the six workflow files listed in the Work Order and the Work Order, this Context Lock, and the corresponding Evidence Bundle may change. Do not update unrelated workflows, application code, branch rules, dependency versions, test architecture, or provider configuration.

## Invalidation and stop conditions

Any change to `main`, an inspected workflow, the branch ruleset, or the Scorecard findings invalidates dependent evidence. Re-fetch the exact base/head and recompute source fingerprints before owner audit and merge. If the locked base moves before the candidate is audited, stop and create a new Context Lock rather than silently rebasing evidence.
