# GBS-V11-GOV-001 promotion evidence

Status: `PROMOTED`
Decision: `D-0062 / ADR-0006`
Work Order: `GBS-V11-GOV-001`
Target: `release/1.1`

## Exact-head owner audit

- Promotion PR: [#298](https://github.com/KayzenRoot/gef-bootstrap/pull/298)
- Audited head: `03f81da4c85fe06310ad4c94a79af20e71747681`
- Base at audit: `release/1.1` at `33671ba9a3d4962cea4371f5610bda23e4889e11`
- Owner audit: [comment #5847950958](https://github.com/KayzenRoot/gef-bootstrap/pull/298#issuecomment-5847950958), disposition `OWNER_APPROVED`
- The audit was performed by `KayzenRoot`; it is a substantive owner audit and is not an independent review.
- Findings: `CRITICAL=0`, `HIGH=0`.
- Check runs: `30/30 SUCCESS`, all attached to the exact audited head.
- Merge: squash-merged by `KayzenRoot` on 2026-09-26 as `d52dcca0840465324582b022c53b5a12fd0a3840`.
- Ruleset snapshot: `Main Branch Protection` (ID `23566111`) applies only to `refs/heads/main`; required approving reviews `0`; `Repository validation` required; deletion and non-fast-forward protections active; bypass actors `none`.
- No collaborator review was requested. Required automated assurance and release boundaries remain in force.

## Check-run binding

| Check run | Name | Result |
|---:|---|---|
| 108441710984 | INC-VAL on ubuntu-latest | SUCCESS |
| 108441710964 | focused (windows-latest) | SUCCESS |
| 108441710962 | Upgrade and recovery on windows-latest | SUCCESS |
| 108441710961 | Upgrade and recovery on ubuntu-latest | SUCCESS |
| 108441710947 | focused (ubuntu-latest) | SUCCESS |
| 108441710946 | PROOF-INV on windows-latest | SUCCESS |
| 108441710945 | focused (windows-latest) | SUCCESS |
| 108441710944 | CTX-DET on ubuntu-latest | SUCCESS |
| 108441710941 | focused (ubuntu-latest) | SUCCESS |
| 108441710936 | regression | SUCCESS |
| 108441710929 | CTX-DET on macos-latest | SUCCESS |
| 108441710927 | INC-VAL on windows-latest | SUCCESS |
| 108441710914 | focused (ubuntu-latest) | SUCCESS |
| 108441710909 | CTX-DET on windows-latest | SUCCESS |
| 108441710897 | PROOF-INV on macos-latest | SUCCESS |
| 108441710895 | focused (windows-latest) | SUCCESS |
| 108441710894 | focused (macos-latest) | SUCCESS |
| 108441710876 | focused (macos-latest) | SUCCESS |
| 108441710863 | validate | SUCCESS |
| 108441710855 | INC-VAL on macos-latest | SUCCESS |
| 108441710824 | focused (macos-latest) | SUCCESS |
| 108441710787 | Upgrade and recovery on macos-latest | SUCCESS |
| 108441710783 | regression | SUCCESS |
| 108441710756 | PROOF-INV on ubuntu-latest | SUCCESS |
| 108441710754 | Windows rights oracle | SUCCESS |
| 108441710726 | regression | SUCCESS |
| 108441710664 | focused (ubuntu-latest) | SUCCESS |
| 108441710647 | focused (macos-latest) | SUCCESS |
| 108441710600 | focused (windows-latest) | SUCCESS |
| 108441710448 | regression | SUCCESS |

## Next legal action

Owner exact-head audit of PR #296 at `c4a108059d5b77baed43faa28847828ea1f450a7`. If the disposition is `OWNER_APPROVED`, all required checks remain successful on that exact head, the branch is mergeable, and CRITICAL/HIGH blockers are zero, merge into `release/1.1` as `KayzenRoot`.
