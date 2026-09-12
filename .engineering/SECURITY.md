# Security

Status: `FROZEN`

## Binding
Security derives from `GBS-CONSTITUTION-v1.1`, frozen Project Overview, Requirements, complete-production Scope and frozen Architecture.

No functional implementation begins until the remaining ordered Source Pack stages permit construction.

## Security objective
Protect canonical project truth, repository integrity, credentials, operator intent, deterministic mutation safety, provider operations, adapter isolation, evidence integrity and recovery paths while preserving the product's token/time-efficiency goals.

Security fails closed where ambiguity could cause destructive mutation, privilege misuse, secret disclosure, invalid evidence or silent corruption.

## Protected assets
1. Canonical governance/source documents.
2. Target repository files and Git history.
3. Credentials/tokens/provider authorizations.
4. Machine contracts, receipts, checkpoints and evidence.
5. Recovery material and transaction journals.
6. Derived indexes/caches used for execution decisions.
7. Hosted-provider state such as PRs/checks/issues/releases/rulesets.
8. Adapter capability declarations and inter-process messages.
9. Telemetry/benchmark data containing repository-sensitive metadata.
10. Operator-approved product intent and scope boundaries.

## Trust boundaries
Anything crossing filesystem, Git/process, hosted-provider, adapter, persisted-machine-state or distribution boundaries is untrusted until validated against the applicable contract and expected state.

## Threat model
The production model must control at least:
- `T1` wrong-target mutation;
- `T2` path traversal/symlink escape;
- `T3` destructive Git/history operations;
- `T4` secret leakage;
- `T5` shell/process injection;
- `T6` dependency/supply-chain compromise;
- `T7` malicious/untrusted adapter behavior;
- `T8` provider privilege misuse;
- `T9` stale/tampered derived state;
- `T10` evidence/checkpoint forgery;
- `T11` recovery artifact exposure;
- `T12` denial/resource exhaustion.

# Frozen security decisions

## SEC-01 — Security classes
Every governed operation has exactly one minimum security class. Higher classes inherit lower-class controls.

| Class | Meaning | Representative operations |
|---|---|---|
| `S0_READ_ONLY` | no governed mutation or external side effect | inspect repo, compute fingerprints, read status, compile context |
| `S1_MANAGED_WRITE` | bounded reversible GEF-managed file mutation | create/update GEF-managed artifacts, staging, local derived state |
| `S2_REPOSITORY_CHANGE` | Git/index/branch/commit mutation | add/stage/commit, create branch, repository metadata change |
| `S3_PROVIDER_CHANGE` | hosted-provider side effect | open/update PR, issue, check, release metadata, provider settings within granted policy |
| `S4_ELEVATED_DESTRUCTIVE` | irreversible/high-impact or privileged change | force push, history rewrite, destructive cleanup, branch deletion, privileged governance/security change, destructive migration |

Security class is determined by the highest-impact side effect. A workflow cannot downgrade itself by splitting one dangerous action into smaller operations.

## SEC-02 — Authorization model
`S0` requires no mutation approval beyond source access.

`S1` may execute under frozen project policy when all of the following are true: target identity is bound, mutation surface is admitted, exact/compatible pre-state is known, recovery is available, and no higher-risk signal is present.

`S2` may execute under frozen repository policy for routine governed branches/commits when branch, repository and expected-state constraints pass. Protected/default-branch direct mutation is never inferred merely from broad authorization.

`S3` may execute under explicit provider capability/policy grants. Provider permission and operation intent are checked independently.

`S4` always requires a separate explicit Product Owner/user authorization for the specific action and target, plus recovery/irreversibility disclosure before execution. Broad statements such as “do everything automatically” do not silently authorize S4.

Emergency security stop/deny may occur without prior approval; resumption follows governed review.

## SEC-03 — Private operational and recovery state
Repository-local private product state uses a reserved ignored directory selected by Configuration/Schema planning, with the architectural placeholder `.gef/` until that module freezes the exact name.

Security rules:
- private operational/recovery data is excluded from normal version control by default;
- recovery content is minimal and bounded to changed managed surfaces;
- file permissions are restricted where the OS supports reliable controls;
- secrets are never intentionally copied merely for convenience;
- receipts store references/fingerprints instead of duplicating sensitive content where possible;
- successful transaction recovery material has bounded retention and can be safely garbage-collected only after post-state verification and checkpoint/evidence promotion;
- failed/interrupted transaction recovery material persists until resolved or explicitly abandoned with audit record;
- publication/release scans must include accidental private-state tracking/exposure checks.

## SEC-04 — Secret detection, redaction and publication
Secrets are capabilities/references, not canonical project data.

Rules:
- never intentionally persist secret values in governed Markdown/JSON, receipts, telemetry, fixtures or logs;
- provider credentials come from external credential mechanisms/environment/keychain/authorized connectors;
- known sensitive schema fields are redacted before logging/receipts;
- probable-secret detection produces a finding with location/category but avoids echoing the secret;
- high-confidence secret exposure blocks publication/release until remediated;
- ambiguous findings may be dispositioned as false positive only with governed rationale/evidence;
- allowlists suppress only the specific fingerprint/pattern context and cannot globally disable scanning;
- rotation/revocation guidance is required when exposure of a real credential is plausible;
- a clean scanner result is evidence, never proof that no secret exists.

## SEC-05 — Process execution policy
All subprocess execution is explicit and bounded.

Rules:
- prefer direct executable + argument-array invocation, never untrusted shell-string interpolation;
- shell execution is disabled by default and requires a specifically reviewed operation contract when unavoidable;
- executables come from an approved capability set or an explicitly resolved trusted tool path;
- repository content cannot select arbitrary executable paths without policy validation;
- child environment starts from a minimal allowlisted inheritance set, with required variables passed deliberately;
- secret-bearing environment variables are never copied into receipts/logs;
- cwd is canonicalized/bound to the intended repository/work area;
- timeout, output-size and resource/cancellation bounds apply;
- exit code, bounded stdout/stderr metadata and tool identity/version are captured where relevant to evidence.

## SEC-06 — Supply-chain and release gates
Production acceptance requires:
- committed deterministic lockfile;
- reproducible dependency installation path;
- dependency inventory/SBOM-capable metadata;
- license policy check;
- vulnerability/advisory scan appropriate to Node/TypeScript;
- no unresolved HIGH/CRITICAL exploitable dependency finding without explicit accepted-risk policy, and CRITICAL release blockers cannot be waived by convenience;
- minimized production dependency graph;
- package integrity/provenance checks where ecosystem support exists;
- release artifacts accompanied by checksums and provenance/build metadata;
- dependency/runtime major upgrades require compatibility + security review;
- updates are previewed and verified, never silently self-applied by default.

Signing is supported where reliable release infrastructure exists, but the product never fabricates a signature/provenance claim when signing infrastructure is unavailable.

## SEC-07 — Provider permissions and degraded states
Hosted-provider adapters follow least privilege and capability discovery.

The GitHub reference profile must:
- discover observable capabilities/permission gaps before side effects where technically possible;
- map each requested operation to its required permission class;
- refuse privilege escalation or unrelated use of available broad permissions;
- separate read, routine write and administrative/elevated actions;
- emit `READY_WITH_GAPS`, `BLOCKED_PERMISSION`, or equivalent truthful states when capabilities are missing;
- never bypass provider governance because an API permission is unavailable;
- bind side-effect receipts to provider/repository identity and post-state when observable.

Credentials with broad permissions are treated as capability ceilings, not blanket authorization.

## SEC-08 — Adapter isolation and sandbox contract
Optional adapters are untrusted extensions relative to core.

Each adapter must declare identity/version, protocol compatibility, capabilities, permissions, external endpoints/processes, filesystem/provider side-effect classes, resource bounds and maximum security class.

Rules:
- no implicit auto-load/execute of repository-supplied adapters;
- unknown/incompatible major protocol version fails closed;
- core never imports optional adapter implementation code directly;
- external/risky adapters execute out-of-process by default through bounded versioned IPC;
- requests are capability-scoped and schema-validated;
- adapter cannot directly mutate canonical core state outside governed application/kernel operations;
- timeouts, output limits, crash isolation and cancellation are mandatory;
- adapter requests above its declared/allowed security ceiling are rejected;
- S4 operations cannot be delegated to an adapter without the same explicit owner authorization and core-side policy validation.

This is isolation, not a claim of OS-grade sandboxing. Stronger process/container sandboxing may be added where platform support and threat level justify it.

## SEC-09 — Integrity model
GEF uses tamper-evident bindings without pretending ordinary local files are cryptographically trusted.

Integrity controls include:
- canonical and derived content fingerprints;
- schema validation and version checks;
- dependency/input fingerprints for caches/indexes/proofs;
- exact-state bindings for evidence/checkpoints where applicable;
- append/audit linkage for promoted governance events;
- invalidation/rebuild on mismatched dependencies;
- release checksums/provenance for distributed artifacts.

A hash proves content equality to a known hash, not author identity or trustworthiness. Local filesystem compromise remains an environmental risk unless stronger signed/remote attestation exists. Security/status language must preserve that distinction.

## SEC-10 — Production security evidence gate
`PRODUCTION_RELEASE_DONE` requires passing security evidence for all applicable supported surfaces.

Minimum gate:
1. threat-to-control mapping complete for T1–T12;
2. secret scan/publication checks pass;
3. dependency/supply-chain review passes;
4. path traversal, root containment and symlink escape tests pass across supported OS cases;
5. wrong-target and destructive-operation denial tests pass;
6. transaction interruption/recovery tests pass;
7. command/process injection and environment-minimization tests pass;
8. malformed/incompatible schema, receipt and state tests fail closed;
9. stale/tampered cache/proof/checkpoint tests invalidate safely;
10. adapter incompatibility/crash/timeout/capability-ceiling/isolation tests pass;
11. provider permission-gap and exact-target tests pass for the GitHub profile;
12. resource-exhaustion/budget/cancellation cases have bounded behavior;
13. release artifact integrity/provenance evidence exists;
14. no unresolved HIGH/CRITICAL product-security defect remains for the claimed release surface.

A security test that cannot run because an external capability is unavailable must be represented as an explicit evidence gap, not success. Production acceptance policy decides whether a given non-core external gap is allowable.

# Cross-cutting safety rules

## Filesystem
- normalize and resolve target paths;
- require containment within approved roots after resolution;
- define symlink/junction/reparse-point behavior explicitly;
- never follow an unexpected link to obtain write authority;
- use same-filesystem staging where atomic replacement semantics depend on it;
- refuse ambiguous case-collision/path normalization states.

## Git
- no force push/history rewrite/reset/destructive clean by default;
- verify repository identity and current branch/HEAD binding;
- routine branch creation/commit is S2 and policy-governed;
- protected/default branch semantics are discovered where possible and never assumed safe;
- worktree/index dirtiness that could be overwritten creates conflict/gap rather than silent cleanup.

## Evidence and receipts
- machine-readable receipts bind operation ID, target identity, security class, pre/post state, changed paths/side effects, policy result and terminal status;
- receipts must not contain plaintext secrets or unnecessary target content;
- success without applicable post-state verification is not final success;
- invalid/stale evidence cannot promote a checkpoint or DONE state.

## Resource safety
Repository discovery, hashing, scans, IPC and provider operations use bounded file count/size/depth, time, memory/output and retry policies. Budget escalation is explicit and assurance may override optimization limits when required.

## Security vs token economy
Security evidence should be compact and deterministic where possible. Token savings may come from hashes, structured findings, dependency maps and delta review, but never from hiding findings, dropping required context, weakening threat controls or replacing actual security evidence with a model assertion.

# Security decision summary
| ID | Decision |
|---|---|
| `SEC-01` | five inherited security classes S0–S4 with anti-downgrade rule |
| `SEC-02` | policy authorization for bounded S1–S3; separate explicit owner authorization for every S4 action |
| `SEC-03` | private ignored repository-local operational/recovery area with bounded retention |
| `SEC-04` | secret minimization, redaction, blocking real exposure, scoped false-positive disposition |
| `SEC-05` | direct argument-array processes, minimal env, shell disabled by default, bounded execution |
| `SEC-06` | lockfile/dependency/vulnerability/license/integrity/provenance production gates |
| `SEC-07` | provider least privilege, capability discovery and truthful permission-gap states |
| `SEC-08` | versioned capability-scoped adapter isolation, out-of-process by default for external/risky adapters |
| `SEC-09` | fingerprint/schema/exact-state tamper evidence without false cryptographic trust claims |
| `SEC-10` | mandatory T1–T12 security evidence gate for production acceptance |

## Freeze audit
- Architecture compatibility: PASS
- security classes closed: PASS
- authorization boundary closed: PASS
- S4 explicit approval invariant: PASS
- private/recovery state policy: PASS
- secret handling/publication: PASS
- process execution policy: PASS
- supply-chain gates: PASS
- provider permission model: PASS
- adapter isolation model: PASS
- integrity truthfulness: PASS
- production security evidence gate: PASS
- Windows/Linux/macOS security concerns represented: PASS
- token optimization cannot weaken security: PASS
- no functional implementation introduced: PASS
- open Security decisions: 0

STOP CONDITION: `READY_FOR_SECURITY_EXACT_DELTA_REVIEW_AND_CHECKPOINT`.
