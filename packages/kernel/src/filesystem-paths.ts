import { createGefError } from "./errors.js";
import type {
  FilesystemOperation,
  FilesystemPathCapsule,
  FilesystemPathRequest,
  FilesystemResult,
} from "./filesystem-types.js";

const MAX_PATH_INPUT = 65_536;
const MAX_COMPONENTS = 1_024;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

function pathError(request: FilesystemPathRequest, reason: string, summary: string, category: "INPUT" | "POLICY" | "CAPABILITY" = "PRECONDITION" as never): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-path-${reason}`,
      category,
      reason: `filesystem_path.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      targetRef: request.root.rootRef,
      metadata: { rootRef: request.root.rootRef, operation: request.operation },
    }),
  };
}

function simplePathError(request: FilesystemPathRequest, reason: string, summary: string): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-path-${reason}`,
      category: "PRECONDITION",
      reason: `filesystem_path.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      targetRef: request.root.rootRef,
      metadata: { rootRef: request.root.rootRef, operation: request.operation },
    }),
  };
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0 && !value.includes("\0");
}

function normalizePosixRoot(root: string): string | undefined {
  if (!root.startsWith("/") || root.includes("\0") || root.length > MAX_PATH_INPUT) return undefined;
  const components = root.split("/").filter((part) => part.length > 0 && part !== ".");
  if (components.some((part) => part === "..")) return undefined;
  return components.length === 0 ? "/" : `/${components.join("/")}`;
}

function windowsRoot(root: string): boolean {
  const normalized = root.replaceAll("/", "\\");
  if (/^\\\\[?.]\\/.test(normalized)) return false;
  if (/^[A-Za-z]:\\/.test(normalized)) return true;
  return /^\\\\[^\\]+\\[^\\]+(?:\\|$)/.test(normalized);
}

function normalizeWindowsRoot(root: string): string | undefined {
  if (!windowsRoot(root) || root.includes("\0") || root.length > MAX_PATH_INPUT) return undefined;
  const normalized = root.replaceAll("/", "\\");
  if (/^[A-Za-z]:\\/.test(normalized)) {
    const drive = normalized.slice(0, 2);
    const tail = normalized.slice(3).split("\\").filter((part) => part.length > 0 && part !== ".");
    if (tail.some((part) => part === "..")) return undefined;
    return tail.length === 0 ? `${drive}\\` : `${drive}\\${tail.join("\\")}`;
  }
  const parts = normalized.slice(2).split("\\").filter((part) => part.length > 0 && part !== ".");
  if (parts.length < 2 || parts.some((part) => part === "..")) return undefined;
  return `\\\\${parts.join("\\")}`;
}

function validWindowsComponent(component: string): boolean {
  if (component.includes(":")) return false;
  if (component.endsWith(".") || component.endsWith(" ")) return false;
  return !WINDOWS_RESERVED.test(component);
}

function normalizeRelative(request: FilesystemPathRequest): FilesystemResult<{ readonly normalized: string; readonly components: readonly string[] }> {
  const raw = request.relativePath;
  if (raw.length > MAX_PATH_INPUT || raw.includes("\0")) return simplePathError(request, "invalid_path", "Filesystem target path is invalid or exceeds the safety input bound");

  if (request.root.pathFlavor === "POSIX") {
    if (raw.startsWith("/")) return simplePathError(request, "absolute_target_forbidden", "Absolute target path cannot bypass the admitted root");
    const parts = raw.split("/").filter((part) => part.length > 0 && part !== ".");
    if (parts.length > MAX_COMPONENTS) return simplePathError(request, "component_limit", "Filesystem target path exceeds the component safety bound");
    if (parts.some((part) => part === "..")) return simplePathError(request, "traversal_forbidden", "Parent traversal is not admitted for managed filesystem targets");
    return { ok: true, value: { normalized: parts.join("/"), components: Object.freeze(parts) } };
  }

  const normalizedSeparators = raw.replaceAll("/", "\\");
  if (/^[A-Za-z]:/.test(normalizedSeparators) || normalizedSeparators.startsWith("\\") || /^\\\\/.test(normalizedSeparators)) {
    return simplePathError(request, "absolute_or_drive_target_forbidden", "Absolute, UNC or drive-relative target cannot bypass the admitted root");
  }
  const parts = normalizedSeparators.split("\\").filter((part) => part.length > 0 && part !== ".");
  if (parts.length > MAX_COMPONENTS) return simplePathError(request, "component_limit", "Filesystem target path exceeds the component safety bound");
  if (parts.some((part) => part === "..")) return simplePathError(request, "traversal_forbidden", "Parent traversal is not admitted for managed filesystem targets");
  if (parts.some((part) => !validWindowsComponent(part))) return simplePathError(request, "unsupported_windows_name", "Filesystem target contains an unsupported or ambiguous Windows name");
  return { ok: true, value: { normalized: parts.join("\\"), components: Object.freeze(parts) } };
}

function physicalTarget(root: string, relative: string, operation: FilesystemOperation, flavor: "POSIX" | "WINDOWS"): string {
  if (relative.length === 0) return root;
  const separator = flavor === "POSIX" ? "/" : "\\";
  const needsSeparator = !root.endsWith(separator);
  return `${root}${needsSeparator ? separator : ""}${relative}`;
}

export function authorizeFilesystemPath(request: FilesystemPathRequest): FilesystemResult<FilesystemPathCapsule> {
  const root = request.root;
  if (!nonEmpty(root.rootRef) || !nonEmpty(root.rootKind) || !nonEmpty(root.policyRef) || !nonEmpty(root.pathSemanticsRef)) {
    return simplePathError(request, "invalid_root_contract", "Filesystem root descriptor is incomplete");
  }
  if (!root.allowedOperations.includes(request.operation)) return simplePathError(request, "operation_not_admitted", "Filesystem operation is not admitted by the selected root capability");

  const normalizedRoot = root.pathFlavor === "POSIX" ? normalizePosixRoot(root.physicalRoot) : normalizeWindowsRoot(root.physicalRoot);
  if (normalizedRoot === undefined) return simplePathError(request, "invalid_root", "Filesystem root is not a supported absolute root for the declared path flavor");

  const relative = normalizeRelative(request);
  if (!relative.ok) return relative;
  if (relative.value.components.length === 0 && request.operation !== "READ") return simplePathError(request, "root_mutation_denied", "Mutation of the admitted root itself is denied by default");

  const capsule: FilesystemPathCapsule = {
    schemaVersion: 1,
    rootRef: root.rootRef,
    rootKind: root.rootKind,
    operation: request.operation,
    normalizedRelativePath: relative.value.normalized,
    physicalTarget: physicalTarget(normalizedRoot, relative.value.normalized, request.operation, root.pathFlavor),
    physicalRoot: normalizedRoot,
    pathFlavor: root.pathFlavor,
    caseSemantics: root.caseSemantics,
    policyRef: root.policyRef,
    pathSemanticsRef: root.pathSemanticsRef,
    ...(root.bindingRef === undefined ? {} : { bindingRef: root.bindingRef }),
    outcome: "PATH_ALLOWED_LEXICALLY",
  };
  return { ok: true, value: Object.freeze(capsule) };
}
