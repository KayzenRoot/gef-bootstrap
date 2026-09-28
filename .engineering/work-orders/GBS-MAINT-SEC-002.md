# GBS-MAINT-SEC-002 — Pipeline Integrity Hardening

Status: ADMITTED_FOR_IMPLEMENTATION; not approved or merged.
Risk: ELEVATED (CI/supply-chain governance only; no product-runtime contract change).
Base: `main` at `3c4455a080055fb65fee7d7021b72c3d40c5ae52`.
Branch: `gbs/maint/sec-002-pipeline-integrity`.

## OBJECTIVE
Convert the proven security pilot into a durable GitHub pipeline baseline by removing mutable GitHub Action references from existing workflows, enforcing immutable references for future workflow changes, and adding ownership metadata for security-sensitive automation.

## IN SCOPE
1. Replace mutable `actions/checkout@v4` with `11d5960a326750d5838078e36cf38b85af677262` (v4.4.0) and existing `@v7` with `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), preserving each workflow's existing major line.
2. Replace mutable `actions/setup-node@v4` with `49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) and existing `@v7` with `820762786026740c76f36085b0efc47a31fe5020` (v7.0.0), preserving each workflow's existing major line.
3. Pin CodeQL init/analyze to commit `2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2`, corresponding to CodeQL Action v4.38.2 at verification time.
4. Add `.github/workflows/pipeline-integrity.yml` to fail on mutable external Action refs, unpinned Docker Action images, `pull_request_target`, or `permissions: write-all`.
5. Add `.github/CODEOWNERS` and operator documentation. CODEOWNERS is advisory until the repository ruleset explicitly requires code-owner approval.

## OUT OF SCOPE
Product code, V1 accepted 1088/1088 history, V1.1 development, runtime dependencies, SonarQube/Codecov thresholds, mandatory coverage percentages, paid services, automatic merging, or repository-ruleset mutation.

## CONSTRAINTS
- Existing test behavior, triggers, job names and Action major-version lines remain unchanged except for immutable refs.
- Existing exact-SHA pins may remain on their currently verified versions; this Work Order does not upgrade every already-pinned Action.
- No Codex review is required or requested; owner disabled automatic Codex review to preserve quota.
- Dependabot remains the updater of record; Renovate must not duplicate it in this repository.
- Do not claim branch-level enforcement of `Pipeline integrity` until the main ruleset is updated administratively after the check exists and passes.

## ACCEPTANCE
- All workflow `uses:` entries are local, digest-pinned Docker images, or 40-hex commit SHA references.
- Pipeline Integrity passes on exact PR head.
- Existing Repository Validation, security scans and applicable regression workflows pass.
- CodeQL remains syntactically valid and uses immutable refs; if path filters do not trigger it on this PR, manual/static pin verification is evidence, not a claimed run.
- No product files changed.
- External reviewers may run, but Codex quota availability is not a gate.

## STOP CONDITION
Do not merge until exact-head CI is green and changed-file review confirms only bounded pipeline/governance changes. After merge, update the main ruleset to require `Pipeline integrity`, `Gitleaks secrets`, and `Trivy filesystem and configuration` only after each exact check name has been observed successfully on main/PR.
