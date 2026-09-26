import type { GefError } from "@gef-bootstrap/contracts";

export type FilesystemResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: GefError };

export type FilesystemPathFlavor = "POSIX" | "WINDOWS";
export type FilesystemCaseSemantics = "SENSITIVE" | "INSENSITIVE" | "UNKNOWN";
export type FilesystemOperation =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "REMOVE"
  | "MOVE_SOURCE"
  | "MOVE_DESTINATION"
  | "RESTORE"
  | "STAGE";

export interface FilesystemRootDescriptor {
  readonly rootRef: string;
  readonly rootKind: string;
  readonly physicalRoot: string;
  readonly pathFlavor: FilesystemPathFlavor;
  readonly caseSemantics: FilesystemCaseSemantics;
  readonly allowedOperations: readonly FilesystemOperation[];
  readonly policyRef: string;
  readonly pathSemanticsRef: string;
  readonly bindingRef?: string;
}

export interface FilesystemPathRequest {
  readonly root: FilesystemRootDescriptor;
  readonly relativePath: string;
  readonly operation: FilesystemOperation;
}

export interface FilesystemPathCapsule {
  readonly schemaVersion: 1;
  readonly rootRef: string;
  readonly rootKind: string;
  readonly operation: FilesystemOperation;
  readonly normalizedRelativePath: string;
  readonly physicalTarget: string;
  readonly physicalRoot: string;
  readonly pathFlavor: FilesystemPathFlavor;
  readonly caseSemantics: FilesystemCaseSemantics;
  readonly policyRef: string;
  readonly pathSemanticsRef: string;
  readonly bindingRef?: string;
  readonly outcome: "PATH_ALLOWED_LEXICALLY";
}

export type FilesystemTargetKind =
  | "ABSENT"
  | "FILE"
  | "DIRECTORY"
  | "SYMLINK"
  | "JUNCTION"
  | "REPARSE"
  | "SPECIAL"
  | "UNKNOWN";

export interface FilesystemEntryObservation {
  readonly relativePath: string;
  readonly kind: FilesystemTargetKind;
  readonly accessible: boolean;
  readonly identityToken?: string;
  readonly fingerprint?: string;
  readonly filesystemId?: string;
  readonly linkCount?: number;
  readonly reparseTag?: string;
}

export interface FilesystemExpectedState {
  readonly expectedKind?: FilesystemTargetKind;
  readonly expectedFingerprint?: string;
  readonly expectedIdentityToken?: string;
  readonly ownershipRef?: string;
  readonly allowNoopIfDesired?: boolean;
  readonly allowAbsentNoop?: boolean;
}

export type FilesystemOverwriteDecisionCode =
  | "CREATE_ALLOWED_ABSENT"
  | "NOOP_ALREADY_DESIRED"
  | "REPLACE_ALLOWED_EXPECTED_STATE"
  | "REMOVE_ALLOWED_EXPECTED_STATE"
  | "MOVE_SOURCE_ALLOWED"
  | "MOVE_DESTINATION_ALLOWED_ABSENT"
  | "MOVE_DESTINATION_REPLACE_ALLOWED"
  | "NOOP_ALREADY_ABSENT";

export interface FilesystemOverwriteDecision {
  readonly schemaVersion: 1;
  readonly allowed: true;
  readonly noop: boolean;
  readonly code: FilesystemOverwriteDecisionCode;
  readonly operation: FilesystemOperation;
  readonly targetKind: FilesystemTargetKind;
  readonly observedIdentityToken?: string;
  readonly observedFingerprint?: string;
  readonly requiresTraversalProof: boolean;
}

export interface FilesystemOverwriteRequest {
  readonly path: FilesystemPathCapsule;
  readonly observation: FilesystemEntryObservation;
  readonly expected?: FilesystemExpectedState;
  readonly desiredFingerprint?: string;
  readonly replaceExistingDestination?: boolean;
}

export interface FilesystemTraversalRequest {
  readonly path: FilesystemPathCapsule;
  readonly ancestors: readonly FilesystemEntryObservation[];
  readonly target: FilesystemEntryObservation;
  readonly allowTargetLinkObject?: boolean;
}

export interface FilesystemTraversalProof {
  readonly schemaVersion: 1;
  readonly outcome: "TRAVERSAL_SAFE_PENDING_ATOMIC_COMMIT";
  readonly rootRef: string;
  readonly normalizedRelativePath: string;
  readonly operation: FilesystemOperation;
  readonly dependencyTokens: readonly string[];
  readonly aliasRisk: "NONE" | "HARDLINK";
  readonly targetKind: FilesystemTargetKind;
  readonly targetIdentityToken?: string;
  readonly targetFilesystemId?: string;
}

export type FilesystemDurabilityClass = "NOT_REQUIRED" | "UNPROVEN" | "CRASH_DURABLE";

export interface FilesystemPrimitiveCapability {
  readonly capabilityRef: string;
  readonly operation: FilesystemOperation;
  readonly visibilityAtomic: boolean;
  readonly raceResistant: boolean;
  readonly noClobberCreate: boolean;
  readonly replaceExisting: boolean;
  readonly requiresSameFilesystem: boolean;
  readonly durability: FilesystemDurabilityClass;
}

export interface FilesystemAtomicRequest {
  readonly path: FilesystemPathCapsule;
  readonly overwrite: FilesystemOverwriteDecision;
  readonly traversal: FilesystemTraversalProof;
  readonly primitive: FilesystemPrimitiveCapability;
  readonly requireCrashDurability: boolean;
  readonly stagingFilesystemId?: string;
  readonly destinationFilesystemId?: string;
}

export interface FilesystemPhysicalSafetyCapability {
  readonly schemaVersion: 1;
  readonly outcome: "FILESYSTEM_MUTATION_SAFE";
  readonly rootRef: string;
  readonly normalizedRelativePath: string;
  readonly operation: FilesystemOperation;
  readonly capabilityRef: string;
  readonly visibilityAtomic: boolean;
  readonly durability: FilesystemDurabilityClass;
  readonly dependencyTokens: readonly string[];
  readonly observedIdentityToken?: string;
}
