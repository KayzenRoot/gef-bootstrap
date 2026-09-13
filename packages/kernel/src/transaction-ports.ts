import type { GefError } from "@gef-bootstrap/contracts";
import type {
  AppliedIntentResult,
  ExternalEffectDeclaration,
  TransactionIntent,
  TransactionJournalSnapshot,
  TransactionPlan,
  TransactionStateBinding,
  VerificationObligation,
} from "./transaction-types.js";

export type TransactionPortResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: GefError };

export interface DigestPort {
  digest(canonicalValue: string): string;
}

export interface TransactionStatePort {
  observeBinding(binding: TransactionStateBinding): Promise<TransactionPortResult<string | undefined>> | TransactionPortResult<string | undefined>;
  observeTargetFingerprint(targetRef: string): Promise<TransactionPortResult<string | undefined>> | TransactionPortResult<string | undefined>;
}

export interface TransactionAuthorizationPort {
  authorize(request: {
    readonly runId: string;
    readonly plan: TransactionPlan;
    readonly authorizationRefs: readonly string[];
  }): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
}

export interface TransactionJournalPort {
  begin(snapshot: TransactionJournalSnapshot): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  update(snapshot: TransactionJournalSnapshot): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  finish(snapshot: TransactionJournalSnapshot): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
}

export interface TransactionEffectPort {
  checkPhysicalSafety(intent: TransactionIntent): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  captureRecovery(intent: TransactionIntent): Promise<TransactionPortResult<string | undefined>> | TransactionPortResult<string | undefined>;
  stage(intent: TransactionIntent): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  verifyStaged(intent: TransactionIntent, obligations: readonly VerificationObligation[]): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  revalidateCommitBarrier(plan: TransactionPlan): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  promote(intent: TransactionIntent): Promise<TransactionPortResult<{ readonly postFingerprint?: string }>> | TransactionPortResult<{ readonly postFingerprint?: string }>;
  verifyPostState(plan: TransactionPlan, applied: readonly AppliedIntentResult[], obligations: readonly VerificationObligation[]): Promise<TransactionPortResult<readonly TransactionStateBinding[]>> | TransactionPortResult<readonly TransactionStateBinding[]>;
  cleanup(request: { readonly transactionId: string; readonly successful: boolean }): Promise<TransactionPortResult<true>> | TransactionPortResult<true>;
  restore(request: {
    readonly intent: TransactionIntent;
    readonly recoveryRef: string;
    readonly expectedCurrentFingerprint?: string;
    readonly expectedPreFingerprint?: string;
  }): Promise<TransactionPortResult<{ readonly postFingerprint?: string }>> | TransactionPortResult<{ readonly postFingerprint?: string }>;
}

export interface ExternalEffectObservationPort {
  observeEffect(declaration: ExternalEffectDeclaration): Promise<TransactionPortResult<"ABSENT" | "PRESENT" | "UNKNOWN">> | TransactionPortResult<"ABSENT" | "PRESENT" | "UNKNOWN">;
}

export interface TransactionPorts {
  readonly digest: DigestPort;
  readonly state: TransactionStatePort;
  readonly authorization?: TransactionAuthorizationPort;
  readonly journal?: TransactionJournalPort;
  readonly effects?: TransactionEffectPort;
  readonly externalEffects?: ExternalEffectObservationPort;
}
