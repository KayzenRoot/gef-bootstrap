# Context Lock — GBS-MAINT-CI-002

Status: LOCKED at admission; invalidates on material base or source changes.

- Repo `KayzenRoot/gef-bootstrap` (public); base commit `8299045f63a6324320caf712afc12eeac8ea17b8`; branch `gbs/maint/ci-002-codecov-oidc`.
- Issue #304; Work Order `GBS-MAINT-CI-002`.
- `.engineering/SOURCE-HIERARCHY.md` blob `bedc10c97d28154efe59ff43fc1d175add37f568`.
- `.engineering/GBS-V1-MAINTENANCE-BOUNDARY.md` blob `289d7cbe88a0682f3385dab6db60686ed9014bc7`.
- Root `package.json` blob `e4f0272e62570e56f280bdaca56534e8462b72c1`.
- Existing `.github/workflows/repository-validation.yml` blob `9b9fd588eb08b9556ffbfc9a7a1d13d0aa9a8ebf`.
- Existing `.github/workflows/security-codeql.yml` blob `885d14d6f19237f25c71720b2fd03e1f8ba1dd56`.
- `main` at admission is already running Trivy+Gitleaks from #303, and its CodeQL, repository validation and pilot main-push runs passed.
- Do not modify production code, accepted historical checkpoints, or V1.1. Coverage percentages and provider acceptance are UNKNOWN before evidence.

Required evidence: exact candidate HEAD and run URLs; Node coverage LCOV path inventory; Codecov OIDC provider outcome; independent review of minimum permissions; scope proof; checkpoint delta proposed, not promoted.
