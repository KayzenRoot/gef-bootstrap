# M33 Release Governance — Frozen Plan
Status: FROZEN
Assurance: MAX_ASSURANCE
Weight: 19

Release governance models semantic versions, immutable tags, changelog entries, release manifests and compatibility decisions. A release candidate binds source commit, accepted module/checkpoint state, artifacts, evidence and policy profile.

Version transitions reject regression and invalid SemVer. Tags are immutable by default and must target the reviewed release commit. Changelog entries are structured by version and change class with deterministic ordering. Release authorization requires exact-head accepted CI/security evidence and no unresolved HIGH/CRITICAL findings.

Compatibility is explicit across schema/API/runtime/platform contracts. Breaking changes require a major-version decision or an approved compatibility exception. Rollback metadata is part of the release receipt.

Acceptance: SemVer transition validation; immutable tag plan; deterministic changelog; exact-head release gate; compatibility classification; rollback receipt; tests. STOP: M33 implementation and evidence accepted.