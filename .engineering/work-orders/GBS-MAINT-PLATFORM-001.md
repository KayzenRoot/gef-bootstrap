# GBS-MAINT-PLATFORM-001 — Next Labs AI Engineering Pipeline Pilot

Status: ADMITTED_FOR_PILOT under the user-supplied MASTER WORK ORDER; not production-approved.
Risk: ELEVATED (branch protection, workflow security, external analysis providers; no product runtime change).
Repository: KayzenRoot/gef-bootstrap (public GitHub repository).
Base: \`main\` at \`dfe14590521aead09ab0d8360fefbaea3e230aff\`.
Base tree: \`9dd4d05aef418a215ea12b6d9a65b8d1703ebab7\`.
Execution branch: \`gbs/maint/platform-001-ai-engineering-pilot\`.
Target: \`main\`. Do not target or alter \`release/1.1\`.

## AUTHORITY AND BOUNDARY

This repository-local Work Order narrows implementation authorized by the user's MASTER WORK ORDER in this session. It remains subordinate to \`AGENTS.md\`, frozen source hierarchy, security policy, V1 maintenance boundary, and the exact-state Context Lock. It does not admit product functionality, change contracts, alter the 1088/1088 production denominator, or authorize rollout beyond this pilot.

The task-level Work Order authorized a one-time ruleset update before this repository-local Work Order was materialized. That operation is recorded in the Evidence Bundle; it was confirmed by a fresh read after mutation. Do not repeat or broaden it from this Work Order.

## OBJECTIVE

Complete a cost-bounded, evidence-led CI/security pilot for \`KayzenRoot/gef-bootstrap\`, then publish a reviewable pull request, exact-head evidence, an operational MASTER file, and a pilot-only corporate rollout design. Preserve existing providers and controls unless the live evidence proves a bounded addition is needed.

## SCOPE

1. Preserve the confirmed Main Branch Protection ruleset and document its four exact required contexts; do not make further ruleset or app-permission changes.
2. Keep SonarQube Cloud on Automatic Analysis for the single public pilot project; record the observed plan/project visibility, New Code definition, Sonar way default gate, first analysis result, and its Quality Gate limitation. No Sonar CI token or duplicate CI analysis.
3. Preserve existing Socket Security. Record the real pilot scan at exact main commit and observed plan/result. Do not add Socket workflows or duplicate scans.
4. Add an immutable-SHA GitHub Dependency Review workflow for every PR to \`main\`, with HIGH/CRITICAL severity enforcement, read-only token permissions, fork-safe \`pull_request\`, no license policy until accepted licenses are defined, and no PR write/comment permission.
5. Add weekly and manual OpenSSF Scorecard analysis using a verified immutable commit SHA. Add a supported `push` path filter for security/pipeline policy files so the exact candidate can be audited before merge without scanning every source commit. Keep public API publication disabled. Store results through GitHub's repository code-scanning mechanism only if exact workflow validation proves the supported permissions and upload path; skip the Scorecard job in fork repositories because the official action does not support fork runs.
6. Add StepSecurity Harden-Runner to a small, relevant set of Linux CI jobs in explicit audit mode only. Pin by verified immutable SHA. Do not set blocking egress, policy store, API keys, or broaden GitHub App access. Confirm telemetry through the currently authorized dashboard; if access would require new consent or a broader installation scope, mark NOT_VERIFIED and continue without approving it.
7. Remove the redundant second TypeScript build from mandatory Repository Validation only if local and exact-head CI evidence confirms \`npm run validate\` runs the same build/typecheck and test suite as the prior \`npm run typecheck\` + \`npm test\` sequence.
8. Audit current workflows, immutable refs, permissions, triggers, cancellation, CodeQL, Codecov, Dependabot, CodeRabbit, Greptile, and present CI runtime data. Do not convert any conditional provider into a required check.
9. Publish this Work Order and Context Lock, an exact-head Evidence Bundle, a MASTER reconstruction document, a pilot-only rollout manifest/design, and targeted adapter/supply-chain guidance for future applicable web/runtime products.
10. Keep the historical V1 checkpoints unchanged. A future maintenance checkpoint delta is proposed separately and is not promoted in this Work Order.

## OUT OF SCOPE

- Any edit to product code, V1.1 development, release architecture, requirements, or production behavior.
- Any expansion of GitHub App repository scope; any change affecting repositories beyond this pilot.
- Codex automatic review, \`@codex review\`, paid products, subscriptions, cards, credits, or new service accounts.
- Renovate activation, duplicate dependency analysis, or unconditional new AI reviewers.
- Scorecard public result publication, automatic egress blocking, releases, SBOM/provenance claims without an actual artifact/release, and production deployment.
- Checkpoint history edits, force-push, auto-merge, branch protection weakening, or global rollout.
- Required Sonar, Socket, StepSecurity, Dependency Review, Codecov, CodeQL, or Scorecard contexts unless exact-state liveness is independently proven for every applicable PR.

## USER ADDENDUM — FREE-TIER CONTINUITY

The user clarified that the entire workflow must continue after any existing trial ends using free plans only. This is an acceptance condition for this pilot:

- Do not add a payment method, enable usage billing, activate a paid tier, consume paid credits, or accept a trial extension.
- For every existing external provider used by the pilot, record the observed account tier, the provider's published free-tier limits, and whether post-trial downgrade/continuity was directly verified.
- Mark a provider BLOCKED when the current service will terminate or its free-tier eligibility/transition cannot be verified. Keep the GitHub-native validation and security pipeline independent of that provider where possible.
- Do not convert multi-user/team services to an individual free plan if that could disrupt other repositories or users. Record the narrow owner action needed to resolve the blocker.
- The app or workflow must not be called free-continuous solely because its public pricing page advertises a free tier.

## ACCEPTANCE

- Static checks show the new Actions use immutable, verified SHA references; least-privilege workflow/job permissions; supported event forms; and no secrets.
- Local tests cover the optimized existing validation command and the workflow/YAML/immutable-action policy.
- The PR emits Dependency Review on a real, safe PR and the action returns a verifiable result for the exact PR head.
- Scorecard runs on its weekly schedule and the supported, path-filtered `push` event (with manual dispatch retained for the default branch), reports the exact candidate commit, and does not publish to the public Scorecard API. The policy filter must not run it on ordinary source-only commits.
- Harden-Runner runs in audit mode in selected Linux jobs without blocking network egress or introducing regressions. External dashboard visibility must be separately evidenced; an OAuth screen or installed app alone is not PASS.
- Existing mandatory contexts plus relevant existing security checks pass on the exact candidate SHA; CodeQL and Codecov remain non-required when path filters can omit them.
- Codecov evidence distinguishes all-code coverage (including \`tests/\`) from TypeScript source coverage. No threshold is introduced.
- No paid plan is activated, no additional app scope is granted, no source/product code changes are present, and the global rollout is not executed.
- Every provider used by the pilot has an explicit free-continuity status. Any trial whose end-of-trial behavior or account eligibility remains uncertain is reported as BLOCKED, and no component is represented as guaranteed free without evidence.
- MASTER report and Evidence Bundle link every verifiable execution and mark external/administrative limits honestly.
- External independent review and any merge/promotion remain separate gates; do not invoke Codex review or auto-merge.

## VALIDATION PLAN

1. Validate YAML syntax and Pipeline Integrity against all affected workflow files.
2. Confirm action commit refs against upstream releases and inspect their metadata/permissions.
3. Run local \`npm ci\`, \`npm run validate\`, and \`npm audit --audit-level=high\`; record actual outputs.
4. Create one reviewable PR from this exact base; inspect all check runs and job logs bound to the candidate SHA.
5. Inspect the exact head's combined check suite, code scan/dependency review output, external review state, and diff before deciding any next step.
6. Capture post-merge state only if all applicable gates and independent review permit integration. Otherwise leave a reviewable open PR and record the blocking gate.
7. Verify all application plans against current provider policy and account billing state without changing billing. Recheck free-tier eligibility and post-trial behavior before claiming long-term continuity.
8. Confirm the push-filtered Scorecard run analyzes the exact candidate SHA and uploads repository SARIF; inspect the paths filter to verify ordinary source-only changes do not trigger it. Do not use a merge or a manual event unavailable on the default branch to manufacture pre-merge evidence.

## STOP CONDITION

Stop the pilot at the first failed exact-state or validation gate that cannot be repaired in scope, or at an external OAuth/permission/review gate requiring owner action. Continue all independent work and publish a complete, truthful Evidence Bundle. A green workflow alone is not product acceptance. No global rollout.
