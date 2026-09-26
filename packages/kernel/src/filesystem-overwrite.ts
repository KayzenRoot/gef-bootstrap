import { createGefError } from "./errors.js";
import type {
  FilesystemEntryObservation,
  FilesystemOverwriteDecision,
  FilesystemOverwriteRequest,
  FilesystemResult,
  FilesystemTargetKind,
} from "./filesystem-types.js";

const LINK_LIKE = new Set<FilesystemTargetKind>(["SYMLINK", "JUNCTION", "REPARSE"]);

function overwriteError(
  request: FilesystemOverwriteRequest,
  reason: string,
  summary: string,
  category: "PRECONDITION" | "POLICY" | "CAPABILITY" = "PRECONDITION",
): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-overwrite-${reason}`,
      category,
      reason: `filesystem_overwrite.${reason}`,
      severity: "ERROR",
      summary,
      retryability: "NEVER",
      recoverability: "NONE_REQUIRED",
      terminal: "BLOCKED",
      targetRef: request.path.rootRef,
      metadata: {
        rootRef: request.path.rootRef,
        operation: request.path.operation,
        targetKind: request.observation.kind,
      },
    }),
  };
}

function observedFields(observation: FilesystemEntryObservation) {
  return {
    ...(observation.identityToken === undefined ? {} : { observedIdentityToken: observation.identityToken }),
    ...(observation.fingerprint === undefined ? {} : { observedFingerprint: observation.fingerprint }),
  };
}

function allowed(
  request: FilesystemOverwriteRequest,
  code: FilesystemOverwriteDecision["code"],
  noop = false,
): FilesystemResult<FilesystemOverwriteDecision> {
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: 1 as const,
      allowed: true as const,
      noop,
      code,
      operation: request.path.operation,
      targetKind: request.observation.kind,
      ...observedFields(request.observation),
      requiresTraversalProof: !noop,
    }),
  };
}

function exactStateMatches(request: FilesystemOverwriteRequest): boolean {
  const expected = request.expected;
  if (expected === undefined) return false;
  if (expected.expectedKind !== undefined && expected.expectedKind !== request.observation.kind) return false;
  if (expected.expectedFingerprint !== undefined && expected.expectedFingerprint !== request.observation.fingerprint) return false;
  if (expected.expectedIdentityToken !== undefined && expected.expectedIdentityToken !== request.observation.identityToken) return false;
  return true;
}

function destructiveOwnershipProven(request: FilesystemOverwriteRequest): boolean {
  const expected = request.expected;
  if (expected?.ownershipRef === undefined || expected.ownershipRef.trim().length === 0) return false;
  return expected.expectedFingerprint !== undefined || expected.expectedIdentityToken !== undefined;
}

function ensureObservable(request: FilesystemOverwriteRequest): FilesystemResult<true> {
  const observation = request.observation;
  if (!observation.accessible || observation.kind === "UNKNOWN") {
    return overwriteError(request, "observation_gap", "Filesystem target state cannot be observed safely", "CAPABILITY");
  }
  if (observation.kind === "SPECIAL") {
    return overwriteError(request, "unsupported_target_kind", "Special filesystem target kind is not supported by the managed overwrite contract", "CAPABILITY");
  }
  if (LINK_LIKE.has(observation.kind)) {
    return overwriteError(request, "link_or_alias_requires_s03", "Link-like target requires a separately typed link operation or S03 disposition before destructive mutation");
  }
  return { ok: true, value: true };
}

export function evaluateFilesystemOverwrite(request: FilesystemOverwriteRequest): FilesystemResult<FilesystemOverwriteDecision> {
  const visible = ensureObservable(request);
  if (!visible.ok) return visible;

  const observation = request.observation;
  const operation = request.path.operation;

  if (operation === "CREATE" || operation === "STAGE") {
    if (observation.kind === "ABSENT") return allowed(request, "CREATE_ALLOWED_ABSENT");
    if (
      operation === "CREATE" &&
      request.expected?.allowNoopIfDesired === true &&
      request.desiredFingerprint !== undefined &&
      request.desiredFingerprint === observation.fingerprint &&
      observation.kind === "FILE"
    ) {
      return allowed(request, "NOOP_ALREADY_DESIRED", true);
    }
    return overwriteError(request, "unexpected_existing", "Create is no-clobber and the target already exists");
  }

  if (operation === "UPDATE" || operation === "RESTORE") {
    if (observation.kind === "ABSENT") return overwriteError(request, "missing_expected", "Update or restore requires the exact expected current target");
    if (!destructiveOwnershipProven(request)) return overwriteError(request, "ownership_unproven", "Destructive replacement requires explicit ownership and exact current-state evidence", "POLICY");
    if (!exactStateMatches(request)) return overwriteError(request, "stale_state", "Observed target no longer matches the admitted expected state");
    if (
      request.expected?.allowNoopIfDesired === true &&
      request.desiredFingerprint !== undefined &&
      request.desiredFingerprint === observation.fingerprint
    ) {
      return allowed(request, "NOOP_ALREADY_DESIRED", true);
    }
    return allowed(request, "REPLACE_ALLOWED_EXPECTED_STATE");
  }

  if (operation === "REMOVE") {
    if (observation.kind === "ABSENT") {
      if (request.expected?.allowAbsentNoop === true) return allowed(request, "NOOP_ALREADY_ABSENT", true);
      return overwriteError(request, "missing_expected", "Remove target is absent but absence was not admitted as a no-op");
    }
    if (!destructiveOwnershipProven(request)) return overwriteError(request, "ownership_unproven", "Remove requires explicit ownership and exact current-state evidence", "POLICY");
    if (!exactStateMatches(request)) return overwriteError(request, "stale_state", "Remove target no longer matches the admitted expected state");
    return allowed(request, "REMOVE_ALLOWED_EXPECTED_STATE");
  }

  if (operation === "MOVE_SOURCE") {
    if (observation.kind === "ABSENT") return overwriteError(request, "missing_move_source", "Move source must exist in the admitted expected state");
    if (!destructiveOwnershipProven(request)) return overwriteError(request, "ownership_unproven", "Move source requires explicit ownership and exact current-state evidence", "POLICY");
    if (!exactStateMatches(request)) return overwriteError(request, "stale_state", "Move source no longer matches the admitted expected state");
    return allowed(request, "MOVE_SOURCE_ALLOWED");
  }

  if (operation === "MOVE_DESTINATION") {
    if (observation.kind === "ABSENT") return allowed(request, "MOVE_DESTINATION_ALLOWED_ABSENT");
    if (request.replaceExistingDestination !== true) return overwriteError(request, "unexpected_existing", "Move destination is no-clobber unless exact replacement was separately admitted");
    if (!destructiveOwnershipProven(request)) return overwriteError(request, "destination_ownership_unproven", "Move destination replacement requires explicit ownership and exact state", "POLICY");
    if (!exactStateMatches(request)) return overwriteError(request, "stale_destination", "Move destination no longer matches the admitted expected state");
    return allowed(request, "MOVE_DESTINATION_REPLACE_ALLOWED");
  }

  return overwriteError(request, "operation_not_supported", "Overwrite policy is not applicable to this filesystem operation");
}
