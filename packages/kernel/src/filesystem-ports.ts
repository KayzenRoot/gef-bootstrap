import type { VerificationObligation, TransactionIntent } from "./transaction-types.js";
import type {
  FilesystemEntryObservation,
  FilesystemExpectedState,
  FilesystemPathCapsule,
  FilesystemPrimitiveCapability,
  FilesystemResult,
  FilesystemRootDescriptor,
} from "./filesystem-types.js";

export type FilesystemMaybePromise<T> = T | Promise<T>;

export interface FilesystemExecutionContext {
  readonly signal?: AbortSignal;
  readonly deadlineMs?: number;
  readonly nowMs?: () => number;
}

export interface FilesystemResolvedPath {
  readonly root: FilesystemRootDescriptor;
  readonly relativePath: string;
  readonly expected?: FilesystemExpectedState;
  readonly replaceExisting?: boolean;
}

export interface FilesystemResolvedIntent {
  readonly target: FilesystemResolvedPath;
  readonly source?: FilesystemResolvedPath;
  readonly payloadRef?: string;
  readonly desiredFingerprint?: string;
  readonly requireCrashDurability?: boolean;
}

export interface FilesystemObservationBundle {
  readonly ancestors: readonly FilesystemEntryObservation[];
  readonly target: FilesystemEntryObservation;
}

export interface FilesystemAtomicFacts {
  readonly primitive: FilesystemPrimitiveCapability;
  readonly stagingAuthorityRef: string;
  readonly stagingFilesystemId?: string;
  readonly destinationFilesystemId?: string;
}

export interface FilesystemRecoveryCapture {
  readonly recoveryRef: string;
  readonly fingerprint?: string;
}

export interface FilesystemStageReceipt {
  readonly stageRef: string;
  readonly fingerprint?: string;
}

export interface FilesystemPromotionReceipt {
  readonly postFingerprint?: string;
}

export interface FilesystemPhysicalPort {
  observe(path: FilesystemPathCapsule, context: FilesystemExecutionContext): FilesystemMaybePromise<FilesystemResult<FilesystemObservationBundle>>;
  atomicFacts(request: {
    readonly context: FilesystemExecutionContext;
    readonly intent: TransactionIntent;
    readonly path: FilesystemPathCapsule;
    readonly desiredFingerprint?: string;
    readonly requireCrashDurability: boolean;
  }): FilesystemMaybePromise<FilesystemResult<FilesystemAtomicFacts>>;
  captureRecovery(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly target: FilesystemPathCapsule;
    readonly source?: FilesystemPathCapsule;
  }): FilesystemMaybePromise<FilesystemResult<FilesystemRecoveryCapture>>;
  verifyRecovery(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly recoveryRef: string;
    readonly expectedPreFingerprint?: string;
    readonly expectedPostFingerprint?: string;
  }): FilesystemMaybePromise<FilesystemResult<true>>;
  stage(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly target: FilesystemPathCapsule;
    readonly source?: FilesystemPathCapsule;
    readonly payloadRef?: string;
    readonly desiredFingerprint?: string;
  }): FilesystemMaybePromise<FilesystemResult<FilesystemStageReceipt>>;
  verifyStage(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly stageRef: string;
    readonly desiredFingerprint?: string;
    readonly obligations: readonly VerificationObligation[];
  }): FilesystemMaybePromise<FilesystemResult<true>>;
  promote(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly target: FilesystemPathCapsule;
    readonly source?: FilesystemPathCapsule;
    readonly stageRef: string;
    readonly capabilityRef: string;
  }): FilesystemMaybePromise<FilesystemResult<FilesystemPromotionReceipt>>;
  verifyPost(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly target: FilesystemPathCapsule;
    readonly source?: FilesystemPathCapsule;
    readonly desiredFingerprint?: string;
    readonly obligations: readonly VerificationObligation[];
  }): FilesystemMaybePromise<FilesystemResult<readonly FilesystemEntryObservation[]>>;
  cleanup(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly successful: boolean;
  }): FilesystemMaybePromise<FilesystemResult<true>>;
  restore(request: {
    readonly context: FilesystemExecutionContext;
    readonly transactionId: string;
    readonly intent: TransactionIntent;
    readonly recoveryRef: string;
    readonly target: FilesystemPathCapsule;
    readonly source?: FilesystemPathCapsule;
    readonly capabilityRef: string;
  }): FilesystemMaybePromise<FilesystemResult<FilesystemPromotionReceipt>>;
}

export interface FilesystemIntentResolver {
  resolve(intent: TransactionIntent): FilesystemResult<FilesystemResolvedIntent>;
}
