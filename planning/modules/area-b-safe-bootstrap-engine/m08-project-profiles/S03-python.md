# GBS-M08-S03 — Python

Status: `FROZEN`

## Purpose
Freeze the deterministic specialized-profile contract for Python projects. S03 refines the frozen S01 Generic Profile and follows S02's key separation between **technology intent** and **runtime/tool availability evidence**.

The built-in Python profile is declarative only. It does not install Python, select a package manager by ambient discovery, create virtual environments, resolve dependencies, execute project code, run build backends, contact package registries, or mutate repository state.

## Binding sources
- canonical checkpoint `READY_FOR_GBS_M08_S03`;
- frozen M08-S01 Generic Profile;
- frozen M08-S02 TypeScript and Node profile principles where cross-language behavior must stay symmetric;
- completed M00-M07 public contracts;
- M04 explicit-input/bounded discovery rules;
- M07 typed profile-binding contract and precedence `TEMPLATE_DEFAULT < PROFILE_BINDING < EXPLICIT_INPUT`;
- M05/M06 mutation/path authority boundaries;
- frozen Architecture/Security/Requirements/Scope/DoD/Test Plan;
- M09 template/source resolution ownership;
- M13 new-project/brownfield adoption ownership;
- M34/M35 security policy ownership;
- M51 exact runtime/platform compatibility ownership;
- M63 quantitative performance ownership.

## Ownership boundary
M08-S03 OWNS:
- product-owned `python` profile identity;
- Python runtime-family intent;
- supported-runtime-channel semantics without hard-coding an eternal interpreter version;
- package/environment/build-backend neutrality unless explicit governed input selects one;
- Python-specific typed profile-binding candidates for exact M07 templates;
- Python-specific semantic digest inputs, typed errors and proof obligations.

M08-S03 DOES NOT OWN:
- S01 selection/default rules;
- S04 Web/App semantics;
- S05 profile composition;
- exact Python compatibility ranges (M51);
- dependency resolution/install/build execution;
- virtualenv creation or activation;
- package-index/network access;
- exact project layout, framework, test runner, formatter/linter or build backend selection;
- M07 template/variable authority;
- M05/M06 effect/path authority;
- Git/provider mutation.

## Specialized semantic extension

```text
PythonProfileSemantics {
  language: PYTHON
  runtimeFamily: CPYTHON_COMPATIBLE
  runtimeChannel: SUPPORTED_STABLE
  environmentPolicy: EXPLICIT_OR_ADOPTION_OWNED
  packageManagerPolicy: EXPLICIT_OR_ADOPTION_OWNED
  buildBackendPolicy: EXPLICIT_OR_TEMPLATE_OWNED
  frameworkPolicy: UNSPECIFIED
  applicationShape: UNSPECIFIED
}
```

For `profileKind = PYTHON`, this block is mandatory and output-relevant.

## Frozen Python contract

### PYN-01 — Canonical identity
The product-owned profile ID is exactly `python`; `profileKind` is exactly `PYTHON`. It is selected through S01 exact profile selection. Repository-local content cannot shadow it.

### PYN-02 — Python intent is explicit
Selecting `python` means Python technology intent. S03 does not infer Python from `.py` files, `pyproject.toml`, `requirements.txt`, lockfiles or installed interpreters.

### PYN-03 — Runtime channel is stable, exact support remains M51-owned
The semantic runtime channel is `SUPPORTED_STABLE`. S03 does not freeze `latest`, a moving alias or a permanent exact major/minor. M51 owns exact supported interpreter lines for each release.

### PYN-04 — Runtime intent is not runtime evidence
Profile selection does not prove that Python exists, that the interpreter is supported, or that a usable environment is active. Explicit capability/preflight evidence must establish those facts before any operation that needs execution.

### PYN-05 — No interpreter installation or download
S03 never installs Python, downloads installers, modifies PATH, invokes pyenv/conda/system package managers or changes host interpreter configuration.

### PYN-06 — Environment policy is explicit/adoption-owned
The profile does not automatically choose system Python, `venv`, virtualenv, conda, Poetry-managed environments, uv-managed environments or another isolation mechanism.

New-project defaults may later be governed by an exact template/adoption contract. Brownfield projects preserve approved repository truth until an explicit migration Work Order authorizes change.

### PYN-07 — Package manager is not inferred
S03 does not auto-select pip, uv, Poetry, PDM, pip-tools, conda or another package/dependency manager from PATH, file presence, popularity or lockfile enumeration order.

### PYN-08 — Conflicting dependency indicators fail visibly
If later bounded discovery observes contradictory manager/lock indicators, there is no implicit precedence. The owning adoption/discovery contract must resolve or block the ambiguity.

### PYN-09 — Manager identity grants no execution authority
An explicitly selected manager remains declarative data. It does not authorize install, sync, update, lock regeneration, build, publish, audit or script/plugin execution.

### PYN-10 — No dependency version invention
S03 never queries package indexes, resolves ranges, selects newest versions, follows floating aliases, or rewrites lockfiles. Exact dependency choices belong to admitted templates/release integration and their security/compatibility evidence.

### PYN-11 — `pyproject.toml` is declarative repository data
A future template may materialize `pyproject.toml`, but profile evaluation never executes build-system hooks, dynamic metadata providers, plugins or project code merely because metadata references them.

### PYN-12 — Build backend is not auto-selected
S03 does not automatically choose setuptools, hatchling, Poetry Core, flit-core, maturin or another backend. Exact backend choice is explicit/template-owned and remains subject to security/execution policy.

### PYN-13 — Framework is unspecified
The Python profile does not imply Django, Flask, FastAPI, Litestar, Celery, data-science stacks, notebooks or another framework/application class.

### PYN-14 — Application shape is unspecified
S03 does not decide whether the project is a library, CLI, API, worker, automation tool, service, package, data project or monorepo component.

### PYN-15 — Repository topology is not assumed
The profile does not require `src/`, flat layout, package name mirroring, workspace layout or specific test directories. Exact paths come from admitted templates/project context and remain subject to M07/M05/M06.

### PYN-16 — Test runner is not implied
pytest, unittest, hypothesis, tox, nox or another runner is not selected by profile identity alone.

### PYN-17 — Lint/format/type-check stack is not implied
Ruff, Black, isort, mypy, pyright, pylint or another tool is not ambiently selected. Tooling belongs to explicit project/template/toolchain contracts.

### PYN-18 — Native-extension/toolchain requirements are separate
Compilers, system headers, Rust/C/C++ toolchains and platform SDKs required by specific packages are capability/dependency concerns. Selecting `python` does not authorize installation or prove availability.

### PYN-19 — Package-index/network access is outside profile evaluation
Profile parsing/selection/projection performs no PyPI/private-index request, metadata lookup, vulnerability query, artifact download or update check.

### PYN-20 — Credentials are forbidden profile content
Package-index tokens, repository passwords, cloud credentials and secret material are forbidden in ordinary profile content/bindings. Non-secret references remain subject exclusively to M07 declaration `valueClass` policy.

### PYN-21 — Exact template references preserve S01
Python `templateBindings` use exact template ID/version and optional semantic digest. No floating ranges, tags, branches, `latest`, registry search or auto-discovery.

### PYN-22 — Profile bindings remain subordinate to M07
Python-specific bindings are typed `PROFILE_BINDING` candidates only. They cannot create variables, change types, `valueClass`, contexts, allowed sources or precedence.

### PYN-23 — Semantic block enters profile digest
Language/runtime/environment/package-manager/build-backend/framework/application-shape semantic fields participate in `profileSemanticDigest`. Operational tool paths/versions do not.

### PYN-24 — Tool observations stay operational
Interpreter executable path, observed version, environment path, package-manager path/version and global packages are evidence, not canonical profile semantics.

### PYN-25 — Brownfield preservation is first-class
Selecting the Python profile for an existing repository does not rewrite its dependency files, environment strategy, package layout, build backend or tooling. M13 owns compatibility classification and any migration proposal.

### PYN-26 — New-project defaults do not become brownfield mandates
A later recommended new-project Python template does not prove that an existing project should be normalized to those defaults.

### PYN-27 — Unsupported runtime blocks before effects
Any operation requiring Python execution must prove supported runtime capability before effects. S03 cannot downgrade missing/unsupported runtime to success.

### PYN-28 — Cross-platform semantics are portable
Profile semantics contain no host-specific path separator, shell activation syntax, executable suffix or platform-local home/path convention.

### PYN-29 — Profile processing is S0/read-only and startup-pure
Parsing, selecting, hashing and projecting the profile MUST NOT mutate files/Git/providers, execute Python/project code, create environments, install dependencies, read home/global config by implication, recursively scan repositories or access the network.

### PYN-30 — Bounded/cancellable behavior
S01 resource limits continue to apply. Python-specific fields and evidence are finite/bounded. Cancellation or budget exhaustion returns typed non-success without partial acceptance.

### PYN-31 — Typed errors
Future implementation should distinguish at least:
- `PYTHON_PROFILE_SEMANTICS_INVALID`;
- `PYTHON_RUNTIME_UNSUPPORTED`;
- `PYTHON_RUNTIME_EVIDENCE_MISSING`;
- `PYTHON_ENVIRONMENT_UNSPECIFIED` when a downstream operation requires it;
- `PYTHON_PACKAGE_MANAGER_UNSPECIFIED` when required downstream;
- `PYTHON_PACKAGE_MANAGER_CONFLICT`;
- `PYTHON_TEMPLATE_BINDING_INVALID`;
- `PYTHON_BINDING_INVALID`;
- `PYTHON_BUDGET_EXCEEDED`;
- `PYTHON_CANCELLED`.

## Canonical built-in intent

```text
profileId = python
profileKind = PYTHON
language = PYTHON
runtimeFamily = CPYTHON_COMPATIBLE
runtimeChannel = SUPPORTED_STABLE
environmentPolicy = EXPLICIT_OR_ADOPTION_OWNED
packageManagerPolicy = EXPLICIT_OR_ADOPTION_OWNED
buildBackendPolicy = EXPLICIT_OR_TEMPLATE_OWNED
frameworkPolicy = UNSPECIFIED
applicationShape = UNSPECIFIED
```

## Proof obligations
The M08 implementation Work Order must prove at minimum:
1. `python` cannot be repository-shadowed.
2. Profile selection never infers Python from files/tool presence.
3. Runtime channel contains no `latest`/floating version semantics.
4. Missing/unsupported interpreter evidence is distinguishable from profile intent.
5. No interpreter/environment/dependency installation occurs during profile processing.
6. Package/environment/build-backend choices are never derived from PATH or filesystem enumeration order.
7. Conflicting lock/manager indicators do not silently choose a winner.
8. Profile bindings preserve M07 authority and exact types.
9. Secret material is rejected/redacted safely.
10. Brownfield repositories are not rewritten by profile selection.
11. Import/startup is effect-free.
12. Semantic digest excludes host/tool observations.
13. Identical admitted semantic input produces identical profile identity across supported hosts.

## Review checklist
- [x] S01/S02 invariants preserved.
- [x] Runtime/tool availability separated from semantic intent.
- [x] Package/environment/backend selection is non-ambient.
- [x] Brownfield preservation is explicit.
- [x] No secret/process/network/mutation authority introduced.
- [x] M07/M05/M06 authority remains intact.
- [x] S0, boundedness, cancellation and startup purity are explicit.

## Session completion rule
S03 may be promoted to `FROZEN` only after exact-head semantic review finds no unresolved HIGH/CRITICAL defect.

Planning earns no production credit. After checkpoint promotion, the only next legal stage is:

`GBS-M08-S04 — Web and App`

Codex remains outside Bootstrap construction absent a separately governed exception/ADR.
