# ADR-0004 — Windows Effective-Rights Oracle for Trusted-Executable Admission

Status: `APPROVED`
Release line: `1.1.x`
Base: `release/1.1`
Related decisions: `ADR-0003-D3`, `ADR-0003-D5`, `SEC-05`, `D-0060`
Scope: bounded corrective dependency of the already-approved cross-platform CLI contract

## Trigger

`GBS-V11-WO-003` must prove that the caller cannot replace the Git executable it runs. On POSIX that
proof is the effective-write chain from the executable to the filesystem root. On Windows the rights
that govern replacement are independent of generic write access:

- `DELETE` on the target object;
- `FILE_DELETE_CHILD` on the containing directory.

A denied `r+` open proves neither. This was verified against the platform rather than assumed: a
read-only file whose write-open is refused can still be renamed by the same process. The objective
audit at head `38e19dd…` therefore rejected the Windows chain proof as unsound.

The supported runtime exposes no way to request `DELETE` or `FILE_DELETE_CHILD` — Node maps only
read/write/create/truncate/append flags — and no security-descriptor API. With no oracle available, the
high-assurance policy failed closed on Windows (`8e8801f…`, disposition `BLOCKED`). That outcome was
correct in safety but unacceptable in capability: the working tree becomes unobservable on Windows, so
the accepted WO-002 `init`/`adopt` preconditions block managed mutation there, and full Windows
validation cannot pass.

## Decision

`ADR-0004-D1` — **Windows parity is preserved.** Permanent, fail-closed loss of Git-backed capability
on Windows is not accepted for V1.1. Windows/Linux/macOS parity is a requirement of the approved CLI
distribution architecture, and `GBS-V11-WO-003` requires the accepted WO-002 `init`/`adopt`
regressions to remain green.

`ADR-0004-D2` — **A narrow Windows FFI adapter is admitted as a corrective dependency**, bounded to
effective-rights proof. It uses **Koffi**, pinned to one exact reviewed version in `package-lock.json`,
imported dynamically on `win32` only, and calling exactly three functions from `kernel32.dll`:
`CreateFileW`, `CloseHandle`, `GetLastError`. No security-descriptor parsing is performed: the OS
access check inside `CreateFileW` is the authority. `ffi-napi`, PowerShell `Add-Type`, shell ACL
parsing, background services and broad native frameworks are excluded.

`ADR-0004-D3` — **No semantic engine moves into native code.** The adapter answers one question per
call — does the current token hold one requested access mask on one already-normalized physical path —
and returns `ALLOWED | DENIED | UNKNOWN`. Every trust decision, containment check, alias rule, identity
hash and authority chain remains in the TypeScript trust policy.

`ADR-0004-D4` — **POSIX is unchanged.** The effective-write chain remains the POSIX proof, the
adapter is never loaded there, and the Linux/macOS assurance path is not weakened.

`ADR-0004-D5` — **Unknown native proof fails closed.** A missing or failing adapter, an unexpected
Win32 error, or any result other than an explicit access-denied is `UNKNOWN`, and `UNKNOWN` means the
high-assurance policy does not admit the candidate. The adapter can never produce `FOUND` and can
never turn an unprovable right into trust.

`ADR-0004-D6` — **The FFI surface is minimal and non-negotiable.** Fixed library name, hard-coded
prototypes, hard-coded masks, no callbacks, no asynchronous native calls, no user-controlled symbols,
input limited to a normalized physical path and an internal right enumeration, handles released in
`finally`-equivalent logic, and no handle value, pointer, native error text or absolute trusted
executable path emitted to user output.

`ADR-0004-D7` — **Publication and release remain governed by later Work Orders.** Nothing in this ADR
authorizes tagging, publishing, release creation or mutation of `main`, `release/1.1` or `v1.0.0`; that
remains governed by `ADR-0003-D5` and the release Work Orders.

## Consequences

- The high-assurance policy can admit a Windows executable only when the oracle proves, for the
  executable and for every directory entry in the physical chain up to the volume root, that the
  caller holds neither `DELETE` on the object nor `FILE_DELETE_CHILD` on its parent.
- The packaged CLI gains one runtime dependency and its Windows prebuilt binary; the staging and
  bundling path must carry both, and the installed tarball must load the adapter without a
  source-tree or registry dependency and without post-install compilation.
- Windows assurance must be exercised in CI by a dedicated job, because a capability that only Ubuntu
  verifies is not a verified capability.
- The five WO-002 assertions that the fail-closed Windows default broke must return green **without
  being modified**: the executable is admitted securely through the new proof rather than the tests
  being relaxed.

## Compliance with frozen authority

- Builds on `ADR-0003-D3`: still bounded to `release/1.1` and its subordinate branches, still only for
  admitted Work Orders, still no merge/tag/publish/force-push/self-approval.
- Does not alter constitutional product scope, `main` or V1.0.0 accepted history.
- Keeps the frozen M04-S04 toolchain authority as the single source of executable-resolution policy;
  the adapter supplies evidence to that policy and never replaces it.
