/**
 * Windows effective-rights oracle (ADR-0004).
 *
 * Replacement of a Windows path entry is governed by two rights that are independent of generic
 * write access: `DELETE` on the target object and `FILE_DELETE_CHILD` on the containing directory.
 * A denied write-open proves neither, so the trust policy needs an OS-enforced decision for those
 * two rights, not a proxy.
 *
 * This module answers exactly one question per call — does the current token hold one requested
 * right on one already-normalized physical path — and returns `ALLOWED | DENIED | UNKNOWN`. It is
 * imported on `win32` only, loads `kernel32.dll`, and calls three functions: `CreateFileW`,
 * `CloseHandle` and `GetLastError`. No security descriptor is parsed: the OS access check performed
 * by `CreateFileW` is the authority.
 *
 * Contract (ADR-0004-D2..D6):
 * - no callbacks, no asynchronous native calls, no user-controlled library or symbol names;
 * - the library name is fixed, the prototypes are hard-coded, the access masks come from Win32
 *   constants, and the only input is a normalized physical path plus an internal right name;
 * - handles are released immediately in `finally` logic;
 * - a missing or failing adapter is `UNKNOWN`, never `DENIED` and never `FOUND`;
 * - no handle value, raw pointer, native error text or absolute trusted path is ever emitted.
 */

import { createRequire } from "node:module";

/** The tri-state answer for one requested right. `UNKNOWN` always fails the trust decision closed. */
export type WindowsRightVerdict = "ALLOWED" | "DENIED" | "UNKNOWN";

/** The only rights this adapter is allowed to ask about. */
export type WindowsRight = "DELETE" | "FILE_DELETE_CHILD";

/** Win32 access masks, hard-coded from the SDK constants. */
const ACCESS_MASKS: Readonly<Record<WindowsRight, number>> = Object.freeze({
  DELETE: 0x00010000,
  FILE_DELETE_CHILD: 0x00000040,
});

/** `FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE`: never block another user of the path. */
const SHARE_ALL = 0x00000001 | 0x00000002 | 0x00000004;
/** `OPEN_EXISTING`: the object must already exist; nothing is created. */
const OPEN_EXISTING = 3;
/** `FILE_FLAG_BACKUP_SEMANTICS`: required to obtain a directory handle. */
const FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
/** `INVALID_HANDLE_VALUE`, returned on failure. */
const INVALID_HANDLE_VALUE = -1;
/** `ERROR_ACCESS_DENIED` is the only code that means "this token does not hold the right". */
const ERROR_ACCESS_DENIED = 5;

interface NativeBindings {
  readonly createFile: (path: string, access: number, share: number, securityAttributes: null, disposition: number, flags: number, templateFile: null) => number;
  readonly closeHandle: (handle: number) => number;
  readonly lastError: () => number;
}

/**
 * Resolution cache for the native adapter.
 *
 * This caches *the adapter*, not any trust decision: it holds no invocation state and no verdict,
 * and each right query is a fresh OS access check. A failed load is cached as `null` so a broken
 * adapter cannot be retried in a loop within one process.
 */
let bindings: NativeBindings | null | undefined;

function loadBindings(): NativeBindings | null {
  if (bindings !== undefined) return bindings;
  bindings = null;
  if (process.platform !== "win32") return bindings;
  try {
    // CommonJS resolution is used deliberately: the trust decision is synchronous, and `require`
    // reaches Koffi's CJS entry, which loads the platform prebuilt binary. Nothing else is loaded.
    const require = createRequire(import.meta.url);
    const koffi = require("koffi") as { load: (name: string) => { func: (prototype: string) => unknown } };
    const kernel32 = koffi.load("kernel32.dll");
    const createFile = kernel32.func(
      "intptr_t CreateFileW(const char16_t *lpFileName, uint32_t dwDesiredAccess, uint32_t dwShareMode, void *lpSecurityAttributes, uint32_t dwCreationDisposition, uint32_t dwFlagsAndAttributes, void *hTemplateFile)",
    ) as NativeBindings["createFile"];
    const closeHandle = kernel32.func("int CloseHandle(intptr_t hObject)") as NativeBindings["closeHandle"];
    const lastError = kernel32.func("uint32_t GetLastError()") as NativeBindings["lastError"];
    if (typeof createFile !== "function" || typeof closeHandle !== "function" || typeof lastError !== "function") return bindings;
    bindings = { createFile, closeHandle, lastError };
  } catch {
    // A missing or unusable adapter is not evidence of anything: it stays `UNKNOWN`.
    bindings = null;
  }
  return bindings;
}

/**
 * Ask the operating system whether the current token holds `right` on `path`.
 *
 * `path` must already be a normalized physical path produced by the trust policy; this function
 * never resolves a path, never consults `PATH`, and never writes, renames or deletes anything.
 */
export function probeWindowsRight(path: string, right: WindowsRight, isDirectory: boolean): WindowsRightVerdict {
  const native = loadBindings();
  if (native === null) return "UNKNOWN";
  let handle: number;
  try {
    handle = native.createFile(path, ACCESS_MASKS[right], SHARE_ALL, null, OPEN_EXISTING, isDirectory ? FILE_FLAG_BACKUP_SEMANTICS : 0, null);
  } catch {
    return "UNKNOWN";
  }
  if (handle === INVALID_HANDLE_VALUE) {
    let error: number;
    try {
      error = native.lastError();
    } catch {
      return "UNKNOWN";
    }
    return error === ERROR_ACCESS_DENIED ? "DENIED" : "UNKNOWN";
  }
  try {
    if (native.closeHandle(handle) === 0) return "UNKNOWN";
  } catch {
    // A failed close leaves the proof unusable; the handle is never returned or exposed.
    return "UNKNOWN";
  }
  return "ALLOWED";
}

/** Whether the adapter is usable in this process. Reported as evidence, never as a trust verdict. */
export function windowsRightsOracleAvailable(): boolean {
  return loadBindings() !== null;
}
