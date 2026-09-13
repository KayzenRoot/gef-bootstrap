import { createGefError } from "./errors.js";
import type {
  FilesystemEntryObservation,
  FilesystemResult,
  FilesystemTargetKind,
  FilesystemTraversalProof,
  FilesystemTraversalRequest,
} from "./filesystem-types.js";

const LINK_LIKE = new Set<FilesystemTargetKind>(["SYMLINK", "JUNCTION", "REPARSE"]);
const MAX_ANCESTORS = 1_024;

function traversalError(
  request: FilesystemTraversalRequest,
  reason: string,
  summary: string,
  category: "PRECONDITION" | "CAPABILITY" = "PRECONDITION",
): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-traversal-${reason}`,
      category,
      reason: `filesystem_traversal.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      targetRef: request.path.rootRef,
      metadata: {
        rootRef: request.path.rootRef,
        operation: request.path.operation,
        targetKind: request.target.kind,
      },
    }),
  };
}

function separator(request: FilesystemTraversalRequest): string {
  return request.path.pathFlavor === "POSIX" ? "/" : "\\";
}

function pathComponents(path: string, separatorValue: string): readonly string[] {
  return Object.freeze(path.split(separatorValue).filter((part) => part.length > 0));
}

function isPrefix(prefix: readonly string[], target: readonly string[], insensitive: boolean): boolean {
  if (prefix.length > target.length) return false;
  for (let index = 0; index < prefix.length; index += 1) {
    const left = prefix[index];
    const right = target[index];
    if (left === undefined || right === undefined) return false;
    if (insensitive ? left.toLocaleLowerCase("en-US") !== right.toLocaleLowerCase("en-US") : left !== right) return false;
  }
  return true;
}

function requireIdentity(request: FilesystemTraversalRequest, observation: FilesystemEntryObservation, scope: string): FilesystemResult<string> {
  if (observation.identityToken === undefined || observation.identityToken.length === 0) {
    return traversalError(request, "unsupported_race_guarantee", `${scope} identity cannot be bound strongly enough for mutation safety`, "CAPABILITY");
  }
  return { ok: true, value: observation.identityToken };
}

export function proveFilesystemTraversal(request: FilesystemTraversalRequest): FilesystemResult<FilesystemTraversalProof> {
  if (request.ancestors.length > MAX_ANCESTORS) return traversalError(request, "ancestor_limit", "Filesystem ancestry exceeds the bounded traversal limit", "CAPABILITY");
  if (request.path.caseSemantics === "UNKNOWN") return traversalError(request, "case_semantics_unknown", "Filesystem case semantics are ambiguous for mutation traversal", "CAPABILITY");

  const separatorValue = separator(request);
  const targetComponents = pathComponents(request.path.normalizedRelativePath, separatorValue);
  const insensitive = request.path.caseSemantics === "INSENSITIVE";
  const dependencyTokens: string[] = [];
  let previousLength = -1;

  for (const ancestor of request.ancestors) {
    if (!ancestor.accessible) return traversalError(request, "ancestor_access_gap", "Filesystem ancestor metadata is not safely observable", "CAPABILITY");
    if (ancestor.kind === "ABSENT" || ancestor.kind === "UNKNOWN" || ancestor.kind === "SPECIAL") {
      return traversalError(request, "ancestor_kind_gap", "Filesystem ancestor kind cannot establish a safe traversal", "CAPABILITY");
    }
    if (LINK_LIKE.has(ancestor.kind)) return traversalError(request, "link_ancestor_blocked", "Managed mutation cannot traverse an unexpected link, junction or reparse ancestor");
    if (ancestor.kind !== "DIRECTORY") return traversalError(request, "ancestor_not_directory", "Filesystem ancestor required for traversal is not a directory");

    const ancestorComponents = pathComponents(ancestor.relativePath, separatorValue);
    if (!isPrefix(ancestorComponents, targetComponents, insensitive) || ancestorComponents.length <= previousLength) {
      return traversalError(request, "ancestor_chain_invalid", "Filesystem ancestry is not an ordered prefix chain for the admitted target");
    }
    previousLength = ancestorComponents.length;
    const identity = requireIdentity(request, ancestor, "Ancestor");
    if (!identity.ok) return identity;
    dependencyTokens.push(identity.value);
  }

  const target = request.target;
  if (target.relativePath !== request.path.normalizedRelativePath) return traversalError(request, "target_binding_mismatch", "Observed target does not match the admitted logical target");
  if (!target.accessible && target.kind !== "ABSENT") return traversalError(request, "target_access_gap", "Filesystem target metadata is not safely observable", "CAPABILITY");
  if (target.kind === "UNKNOWN" || target.kind === "SPECIAL") return traversalError(request, "target_kind_gap", "Filesystem target kind cannot establish a safe traversal", "CAPABILITY");
  if (LINK_LIKE.has(target.kind) && request.allowTargetLinkObject !== true) {
    return traversalError(request, "target_link_requires_typed_operation", "Managed mutation cannot silently dereference a link-like target object");
  }

  if (target.kind !== "ABSENT") {
    const identity = requireIdentity(request, target, "Target");
    if (!identity.ok) return identity;
    dependencyTokens.push(identity.value);
  }

  const aliasRisk = target.kind === "FILE" && target.linkCount !== undefined && target.linkCount > 1 ? "HARDLINK" as const : "NONE" as const;
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: 1 as const,
      outcome: "TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT" as const,
      rootRef: request.path.rootRef,
      normalizedRelativePath: request.path.normalizedRelativePath,
      operation: request.path.operation,
      dependencyTokens: Object.freeze(dependencyTokens),
      aliasRisk,
      targetKind: target.kind,
      ...(target.identityToken === undefined ? {} : { targetIdentityToken: target.identityToken }),
      ...(target.filesystemId === undefined ? {} : { targetFilesystemId: target.filesystemId }),
    }),
  };
}
