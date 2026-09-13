import { createGefError } from "./errors.js";
import type {
  FilesystemAtomicRequest,
  FilesystemOperation,
  FilesystemPhysicalSafetyCapability,
  FilesystemResult,
} from "./filesystem-types.js";

function atomicError(
  request: FilesystemAtomicRequest,
  reason: string,
  summary: string,
  category: "PRECONDITION" | "CAPABILITY" = "PRECONDITION",
): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-atomic-${reason}`,
      category,
      reason: `filesystem_atomic.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      targetRef: request.path.rootRef,
      metadata: {
        rootRef: request.path.rootRef,
        operation: request.path.operation,
        capabilityRef: request.primitive.capabilityRef,
      },
    }),
  };
}

function mutationNeedsAtomicVisibility(operation: FilesystemOperation): boolean {
  return operation === "UPDATE" || operation === "REMOVE" || operation === "MOVE_SOURCE" || operation === "MOVE_DESTINATION" || operation === "RESTORE";
}

export function composeFilesystemPhysicalSafety(request: FilesystemAtomicRequest): FilesystemResult<FilesystemPhysicalSafetyCapability> {
  if (request.overwrite.noop) return atomicError(request, "noop_has_no_effect", "No-op overwrite decision must not open a target-visible filesystem effect");
  if (request.path.operation !== request.overwrite.operation || request.path.operation !== request.traversal.operation || request.path.operation !== request.primitive.operation) {
    return atomicError(request, "operation_binding_mismatch", "Filesystem safety layers are not bound to the same exact operation");
  }
  if (request.path.rootRef !== request.traversal.rootRef || request.path.normalizedRelativePath !== request.traversal.normalizedRelativePath) {
    return atomicError(request, "target_binding_mismatch", "Filesystem safety layers are not bound to the same exact target");
  }
  if (!request.primitive.raceResistant) return atomicError(request, "race_guarantee_missing", "Selected filesystem primitive cannot preserve the required final-state race guarantee", "CAPABILITY");

  if (request.path.operation === "CREATE" || request.path.operation === "STAGE") {
    if (!request.primitive.noClobberCreate) return atomicError(request, "no_clobber_missing", "Create requires a race-resistant no-clobber primitive", "CAPABILITY");
  }

  if (request.path.operation === "UPDATE" || request.path.operation === "RESTORE") {
    if (!request.primitive.replaceExisting) return atomicError(request, "replace_capability_missing", "Managed replacement requires an exact replacement primitive", "CAPABILITY");
    if (request.traversal.aliasRisk === "HARDLINK" && !request.primitive.visibilityAtomic) {
      return atomicError(request, "hardlink_replace_gap", "Hard-link alias risk requires directory-entry replacement rather than in-place mutation", "CAPABILITY");
    }
  }

  if (mutationNeedsAtomicVisibility(request.path.operation) && !request.primitive.visibilityAtomic) {
    return atomicError(request, "visibility_atomicity_missing", "Selected filesystem primitive cannot provide the required atomic directory-entry visibility", "CAPABILITY");
  }

  if (request.primitive.requiresSameFilesystem) {
    if (request.stagingFilesystemId === undefined || request.destinationFilesystemId === undefined) {
      return atomicError(request, "filesystem_identity_gap", "Selected primitive requires a proven same-filesystem relationship", "CAPABILITY");
    }
    if (request.stagingFilesystemId !== request.destinationFilesystemId) {
      return atomicError(request, "cross_filesystem", "Selected primitive cannot provide its guarantee across filesystems or volumes", "CAPABILITY");
    }
  }

  if (request.requireCrashDurability && request.primitive.durability !== "CRASH_DURABLE") {
    return atomicError(request, "durability_gap", "Crash durability is required but is not proven by the selected platform capability", "CAPABILITY");
  }

  const dependencyTokens = Object.freeze([
    `policy:${request.path.policyRef}`,
    `path-semantics:${request.path.pathSemanticsRef}`,
    ...request.traversal.dependencyTokens,
  ]);

  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: 1 as const,
      outcome: "FILESYSTEM_MUTATION_SAFE" as const,
      rootRef: request.path.rootRef,
      normalizedRelativePath: request.path.normalizedRelativePath,
      operation: request.path.operation,
      capabilityRef: request.primitive.capabilityRef,
      visibilityAtomic: request.primitive.visibilityAtomic,
      durability: request.primitive.durability,
      dependencyTokens,
      ...(request.traversal.targetIdentityToken === undefined ? {} : { observedIdentityToken: request.traversal.targetIdentityToken }),
    }),
  };
}
