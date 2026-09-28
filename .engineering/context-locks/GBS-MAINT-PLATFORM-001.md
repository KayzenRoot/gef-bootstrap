# Context Lock — GBS-MAINT-PLATFORM-001

Status: LOCKED for execution at exact base; revalidate immediately before PR publication and before audit.
Repository: \`KayzenRoot/gef-bootstrap\` (public).
Base ref/SHA: \`refs/heads/main\` / \`dfe14590521aead09ab0d8360fefbaea3e230aff\`.
Base tree: \`9dd4d05aef418a215ea12b6d9a65b8d1703ebab7\`.
Execution branch: \`gbs/maint/platform-001-ai-engineering-pilot\`.
Work Order: \`GBS-MAINT-PLATFORM-001\`.
Authority: user-supplied MASTER WORK ORDER for this chat; no global rollout.
Local audit checkout: \`C:\Users\csn19\AppData\Local\Temp\codex-gef-bootstrap-main-audit\`; initially clean at the locked SHA.
Separate local checkout \`D:\Projects\gef\` is V1.1 and contains untracked \`tmp/\`; it is not part of this execution and must remain untouched.

## Source fingerprints at admission

- \`AGENTS.md\`: \`722ce876e05ff8d6f24d9c60794e0aa6be3c936c\`
- \`.engineering/SOURCE-HIERARCHY.md\`: \`bedc10c97d28154efe59ff43fc1d175add37f568\`
- \`.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md\`: \`289d7cbe88a0682f3385dab6db60686ed9014bc7\`
- \`.engineering/CHECKPOINT.md\`: \`78677f5aac573be8d6831963b396ba64a89372f7\`
- \`.engineering/CHECKPOINT.json\`: \`0084244aa4ebc47d0f3ff2e8a25b4d6425e68c3f\`
- \`.github/workflows/repository-validation.yml\`: \`590475d959190a548028d7f1517872f967b622aa\`
- \`.github/workflows/pipeline-integrity.yml\`: \`a711e9467bd4e4e348ab45f712e331b4c9197dbf\`
- \`.github/workflows/free-security-pilot.yml\`: \`9f2fb75e8302424d82e0458a9170858812f8b4d4\`
- \`.github/workflows/security-codeql.yml\`: \`83e138728ea462ce29146d097c6cf4e9550d9be2\`
- \`.github/workflows/coverage-codecov.yml\`: \`4ca92f88cc6108084133c87b49f27c66dc8bdc5b\`
- \`.github/dependabot.yml\`: \`db16797379522973a282f7470c9a598572e09f14\`
- \`.engineering/GITHUB-ACCELERATION-PROFILE.md\`: \`51d0b73453d8acdc3fc0a180eb688a4929b513c3\`

## Live state observed

- Current main SHA is \`dfe14590521aead09ab0d8360fefbaea3e230aff\`; GitHub account via authenticated connector/browser is KayzenRoot with repository admin access. \`gh\` CLI itself has no authenticated account.
- Ruleset 23566111 is active on main. It now requires the exact contexts \`Repository validation\`, \`Pipeline integrity\`, \`Gitleaks secrets\`, and \`Trivy filesystem and configuration\`. PR requirement, zero approval count, resolved conversations, deletion/force-push blocking, and no bypass actors were preserved and reread after update.
- Required main checks all succeeded on the locked SHA. Run URLs are recorded in the Evidence Bundle.
- Dependency Graph, Dependabot alerts, Dependabot security updates, and version updates are enabled. No Dependency Review workflow currently exists in main.
- SonarQube project \`KayzenRoot_gef-bootstrap\` was imported as a public project and Automatic Analysis completed main plus five PR tasks successfully. Current Quality Gate is the built-in organization default Sonar way; New Code is Previous version. The first main analysis has Quality Gate \`Not Computed\`; do not claim PASS or install a parallel scanner.
- Socket Free dashboard includes \`gef-bootstrap\`, 29 npm dependencies, zero current alerts, and a real main scan on the locked SHA. No workflow duplication is needed.
- StepSecurity Actions Security app is already installed with all-repository access. The app has not been expanded in this task. Official OAuth approval screen asks for read-only email scope; stop before authorizing and await account owner.
- Codecov has a real accepted commit coverage result on 3c4455a; it reports 8,231 tracked lines, including 8,030 under \`tests/\` and 201 under \`packages/\`. The 97.86% aggregate is not source-only. No threshold is authorized.
- Dependabot PR #196 is open and separate; do not merge or modify it.
- The historical V1 checkpoint remains 1088/1088 with active Work Order NONE at admission. No checkpoint file will be edited.

## Pre-Work-Order operation note

The user-level MASTER WORK ORDER explicitly authorized the main ruleset change, and that UI/API operation was performed and reverified before this repository-local Work Order file was written. Preserve its exact before/after evidence; do not describe the repository-local Work Order as preceding that administrative action.

## Staleness and invalidation

Any change to main, the locked source files above, the required-check configuration, or the relevant workflows invalidates dependent evidence. Capture the candidate parent/head SHA and recompute local checks immediately before PR creation. Never transfer checks or provider evidence across commits. Do not alter \`D:\Projects\gef\`, historical checkpoints, or other repositories.
